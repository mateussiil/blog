import type { APIRoute } from 'astro';
import { db } from '../../../lib/comments/db';

export const prerender = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const page = (message: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Avisos</title></head>
<body style="margin:0;background:#e9efec;color:#14201f;font-family:Georgia,serif">
<main style="max-width:560px;margin:0 auto;padding:64px 20px;font-size:19px;line-height:1.6">
<p>${message}</p><p><a href="/" style="color:#0f766e">Voltar para o blog</a></p></main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );

// Link que vai em cada aviso de resposta: para de avisar aquele e-mail sobre aquela conversa.
export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  if (!UUID.test(token)) return page('Este link não é válido.', 400);
  try {
    const pool = await db();
    const { rowCount } = await pool.query(
      `UPDATE comments SET notify = false
        WHERE (thread_id, email) = (SELECT thread_id, email FROM comments WHERE unsubscribe_token = $1)`,
      [token]
    );
    if (!rowCount) return page('Não encontramos essa conversa. Talvez ela já tenha sido removida.', 404);
    return page('Pronto. Você não vai mais receber avisos desta conversa.');
  } catch (err) {
    console.error('[comentários]', err);
    return page('Não deu para concluir agora. Tente de novo em alguns minutos.', 500);
  }
};
