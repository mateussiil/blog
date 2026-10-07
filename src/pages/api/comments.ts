import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CommentsUnavailable, db, threadsFor } from '../../lib/comments/db';
import { notifyNewComment } from '../../lib/comments/notify';

export const prerender = false;

const LIMITS = { body: 2000, name: 60, email: 200, quote: 500, context: 64 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

async function findPost(id: unknown) {
  if (typeof id !== 'string') return undefined;
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.find((p) => p.id === id);
}

// Compara só letras e números: o texto do post é Markdown, e o trecho chega já renderizado
// (sem `código`, **negrito** ou links, e com aspas e travessões tipográficos).
const letters = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
function plainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // imagens
    .replace(/\]\([^)]*\)/g, ']') // destino dos links
    .replace(/<[^>]+>/g, ' '); // HTML embutido
}

function failure(err: unknown) {
  if (err instanceof CommentsUnavailable) return json({ error: 'unavailable' }, 503);
  console.error('[comentários]', err);
  return json({ error: 'server' }, 500);
}

export const GET: APIRoute = async ({ url }) => {
  const post = await findPost(url.searchParams.get('post'));
  if (!post) return json({ error: 'post' }, 404);
  try {
    return json({ threads: await threadsFor(post.id) });
  } catch (err) {
    return failure(err);
  }
};

// Limite simples em memória: o blog roda num container só.
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  const lastMinute = recent.filter((t) => now - t < 60_000).length;
  if (lastMinute >= 5 || recent.length >= 30) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const POST: APIRoute = async ({ request, site, clientAddress }) => {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'invalid' }, 400);
  }

  // Campo escondido que só robôs preenchem: finge que deu certo e descarta.
  if (clean(input.website, 200)) return json({ ok: true }, 201);

  // O proxy do Coolify acrescenta o IP real no fim do X-Forwarded-For; o começo pode vir do próprio visitante.
  const ip = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || clientAddress;
  if (tooMany(ip)) return json({ error: 'rate' }, 429);

  const post = await findPost(input.post);
  if (!post) return json({ error: 'post' }, 404);

  const body = clean(input.body, LIMITS.body + 1);
  const name = clean(input.name, LIMITS.name) || null;
  const email = clean(input.email, LIMITS.email).toLowerCase() || null;
  if (!body || body.length > LIMITS.body) return json({ error: 'body' }, 400);
  if (email && !EMAIL.test(email)) return json({ error: 'email' }, 400);

  try {
    const pool = await db();
    let threadId: string;
    let quote: string;

    if (typeof input.threadId === 'string') {
      if (!UUID.test(input.threadId)) return json({ error: 'thread' }, 400);
      const { rows } = await pool.query('SELECT id, quote FROM comment_threads WHERE id = $1 AND post_id = $2', [
        input.threadId,
        post.id,
      ]);
      if (!rows[0]) return json({ error: 'thread' }, 404);
      threadId = rows[0].id;
      quote = rows[0].quote;
    } else {
      const anchor = (input.anchor ?? {}) as Record<string, unknown>;
      quote = typeof anchor.quote === 'string' ? anchor.quote.trim() : '';
      if (!quote || quote.length > LIMITS.quote) return json({ error: 'quote' }, 400);
      // Só aceita trechos que existem no post, para ninguém publicar frases inventadas.
      const needle = letters(quote);
      if (!needle || !letters(plainText(post.body ?? '')).includes(needle)) return json({ error: 'quote' }, 400);
      const prefix = typeof anchor.prefix === 'string' ? anchor.prefix.slice(-LIMITS.context) : '';
      const suffix = typeof anchor.suffix === 'string' ? anchor.suffix.slice(0, LIMITS.context) : '';
      // Duas pessoas comentando o mesmo trecho ao mesmo tempo caem na mesma conversa.
      const existing = await pool.query(
        `SELECT t.id FROM comment_threads t
          WHERE t.post_id = $1 AND t.quote = $2 AND t.prefix = $3 AND t.suffix = $4
            AND EXISTS (SELECT 1 FROM comments c WHERE c.thread_id = t.id)
          LIMIT 1`,
        [post.id, quote, prefix, suffix]
      );
      threadId =
        existing.rows[0]?.id ??
        (
          await pool.query(
            'INSERT INTO comment_threads (post_id, quote, prefix, suffix) VALUES ($1, $2, $3, $4) RETURNING id',
            [post.id, quote, prefix, suffix]
          )
        ).rows[0].id;
    }

    await pool.query('INSERT INTO comments (thread_id, name, email, body) VALUES ($1, $2, $3, $4)', [
      threadId,
      name,
      email,
      body,
    ]);

    const base = site ?? new URL(request.url);
    const postInfo = { title: post.data.title, url: new URL(`/blog/${post.id}/`, base).toString(), lang: post.data.lang };
    // O aviso não segura a resposta: quem comentou não espera o e-mail sair.
    notifyNewComment(pool, base, postInfo, { threadId, quote, name, email, body }).catch((err) =>
      console.error('[comentários] falha nos avisos:', err)
    );

    const [thread] = await threadsFor(post.id, threadId);
    return json({ thread }, 201);
  } catch (err) {
    return failure(err);
  }
};
