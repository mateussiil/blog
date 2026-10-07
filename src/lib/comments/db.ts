import pg from 'pg';

// Comentários ficam no Postgres apontado por DATABASE_URL.
// Para tirar algo do ar, apague direto no banco: apagar uma conversa (comment_threads)
// apaga os comentários dela; uma conversa sem comentários deixa de aparecer no post.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS comment_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id text NOT NULL,
    quote text NOT NULL,
    prefix text NOT NULL DEFAULT '',
    suffix text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS comment_threads_post_idx ON comment_threads (post_id);

  CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES comment_threads (id) ON DELETE CASCADE,
    name text,
    email text,
    body text NOT NULL,
    notify boolean NOT NULL DEFAULT true,
    unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS comments_thread_idx ON comments (thread_id);
`;

let pool: pg.Pool | null = null;
let ready: Promise<void> | null = null;

export class CommentsUnavailable extends Error {}

export async function db(): Promise<pg.Pool> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new CommentsUnavailable('DATABASE_URL não configurada');
  pool ??= new pg.Pool({ connectionString: url, max: 5 });
  ready ??= pool.query(SCHEMA).then(
    () => undefined,
    (err) => {
      ready = null; // tenta criar as tabelas de novo na próxima requisição
      throw err;
    }
  );
  await ready;
  return pool;
}

export interface PublicComment {
  id: string;
  name: string | null;
  body: string;
  createdAt: string;
}

export interface PublicThread {
  id: string;
  quote: string;
  prefix: string;
  suffix: string;
  comments: PublicComment[];
}

// Nunca devolve e-mail: o que sai daqui é lido por qualquer visitante.
export async function threadsFor(postId: string, threadId?: string): Promise<PublicThread[]> {
  const pool = await db();
  const { rows } = await pool.query(
    `SELECT t.id AS thread_id, t.quote, t.prefix, t.suffix,
            c.id, c.name, c.body, c.created_at
       FROM comment_threads t
       JOIN comments c ON c.thread_id = t.id
      WHERE t.post_id = $1 AND ($2::uuid IS NULL OR t.id = $2::uuid)
      ORDER BY t.created_at, c.created_at`,
    [postId, threadId ?? null]
  );
  const threads = new Map<string, PublicThread>();
  for (const r of rows) {
    let t = threads.get(r.thread_id);
    if (!t) {
      t = { id: r.thread_id, quote: r.quote, prefix: r.prefix, suffix: r.suffix, comments: [] };
      threads.set(r.thread_id, t);
    }
    t.comments.push({ id: r.id, name: r.name, body: r.body, createdAt: r.created_at.toISOString() });
  }
  return [...threads.values()];
}
