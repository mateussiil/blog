import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { THEME_IDS } from './i18n';

const theme = z.enum(THEME_IDS);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    lang: z.enum(['pt', 'en']).default('pt'),
    themes: z.array(theme).default([]),
    // Fixado em destaque na home; se mais de um, vale o mais recente.
    featured: z.boolean().default(false),
    // Onde o texto saiu primeiro (ex.: Medium), mostrado como nota no post.
    originalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

const leituras = defineCollection({
  loader: file('src/data/leituras.yaml'),
  schema: z.object({
    kind: z.enum(['livro', 'artigo', 'video', 'audio']),
    title: z.string(),
    titleEn: z.string().optional(),
    author: z.string(),
    url: z.string().url().optional(),
    status: z.enum(['lendo', 'lido']),
    note: z.string().optional(),
    noteEn: z.string().optional(),
  }),
});

const bilingual = { desc: z.string(), descEn: z.string() };

const projetos = defineCollection({
  loader: file('src/data/projetos.yaml'),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    url: z.string().url().optional(),
    featured: z.boolean().default(false),
    themes: z.array(theme).default([]),
    ...bilingual,
    sources: z.array(z.object({ repo: z.string(), ...bilingual })).optional(),
    hub: z
      .object({ title: z.string(), titleEn: z.string(), repos: z.array(z.string()), ...bilingual })
      .optional(),
  }),
});

export const collections = { blog, leituras, projetos };
