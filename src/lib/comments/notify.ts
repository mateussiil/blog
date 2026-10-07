import type pg from 'pg';

// Avisos por e-mail via Resend (https://resend.com). Sem RESEND_API_KEY, os avisos são pulados.
//   RESEND_API_KEY  chave da API
//   COMMENTS_FROM   remetente verificado no Resend, ex.: "Mateus Silva <comentarios@mateussiil.com.br>"
//   AUTHOR_EMAIL    para onde vai o aviso de cada comentário novo

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

async function send(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.COMMENTS_FROM;
  if (!key || !from) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
  });
  if (!res.ok) console.error(`[comentários] Resend respondeu ${res.status}: ${await res.text()}`);
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const html = (paragraphs: string[]) =>
  `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#14201f;max-width:560px">${paragraphs.join('')}</div>`;
const quoteHtml = (q: string) =>
  `<blockquote style="margin:16px 0;padding:2px 0 2px 14px;border-left:3px solid #0f766e;font-style:italic;color:#2b3836">“${esc(q)}”</blockquote>`;
const bodyHtml = (b: string) => `<p style="white-space:pre-wrap;margin:0 0 16px">${esc(b)}</p>`;

const copy = {
  pt: {
    anon: 'Anônimo',
    replySubject: (title: string) => `Nova resposta em “${title}”`,
    replyIntro: (name: string) => `${name} respondeu numa conversa em que você comentou:`,
    open: 'Ver a conversa',
    stop: 'Parar de receber avisos desta conversa',
  },
  en: {
    anon: 'Anonymous',
    replySubject: (title: string) => `New reply on “${title}”`,
    replyIntro: (name: string) => `${name} replied to a conversation you commented on:`,
    open: 'See the conversation',
    stop: 'Stop getting updates for this conversation',
  },
};

export interface NewComment {
  threadId: string;
  quote: string;
  name: string | null;
  email: string | null;
  body: string;
}

export interface PostInfo {
  title: string;
  url: string;
  lang: 'pt' | 'en';
}

export async function notifyNewComment(pool: pg.Pool, site: URL, post: PostInfo, c: NewComment) {
  const t = copy[post.lang];
  const who = c.name || t.anon;
  const author = process.env.AUTHOR_EMAIL?.toLowerCase();
  const jobs: Promise<void>[] = [];

  // 1. Para o autor do blog: sempre, com o e-mail de quem comentou (se houver) como resposta.
  if (author && c.email !== author) {
    const contact = c.email ? `${who} <${c.email}>` : `${who} (sem e-mail)`;
    jobs.push(
      send({
        to: author,
        subject: `Comentário de ${who} em “${post.title}”`,
        replyTo: c.email ?? undefined,
        text: `${contact} comentou:\n\n“${c.quote}”\n\n${c.body}\n\n${post.url}`,
        html: html([
          `<p style="margin:0 0 8px"><strong>${esc(contact)}</strong> comentou:</p>`,
          quoteHtml(c.quote),
          bodyHtml(c.body),
          `<p><a href="${esc(post.url)}" style="color:#0f766e">${esc(post.title)}</a></p>`,
        ]),
      })
    );
  }

  // 2. Para quem já participou da conversa e deixou e-mail: um aviso por pessoa.
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (email) email, unsubscribe_token
       FROM comments
      WHERE thread_id = $1 AND email IS NOT NULL AND notify
      ORDER BY email, created_at DESC`,
    [c.threadId]
  );
  for (const r of rows) {
    if (r.email === c.email || r.email === author) continue;
    const stop = new URL(`/api/comments/unsubscribe?token=${r.unsubscribe_token}`, site).toString();
    jobs.push(
      send({
        to: r.email,
        subject: t.replySubject(post.title),
        text: `${t.replyIntro(who)}\n\n“${c.quote}”\n\n${c.body}\n\n${t.open}: ${post.url}\n\n${t.stop}: ${stop}`,
        html: html([
          `<p style="margin:0 0 8px">${esc(t.replyIntro(who))}</p>`,
          quoteHtml(c.quote),
          bodyHtml(c.body),
          `<p><a href="${esc(post.url)}" style="color:#0f766e">${esc(t.open)}</a></p>`,
          `<p style="font-size:13px;color:#52615e"><a href="${esc(stop)}" style="color:#52615e">${esc(t.stop)}</a></p>`,
        ]),
      })
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === 'rejected') console.error('[comentários] falha ao enviar aviso:', r.reason);
}
