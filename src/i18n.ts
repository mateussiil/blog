export type Lang = 'pt' | 'en';

export const THEME_IDS = ['arquitetura', 'financeiro', 'ia', 'devex', 'dados', 'produto'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/mateussiil',
  github: 'https://github.com/mateussiil',
  medium: 'https://medium.com/@mateussiil',
};

// Quando o "Agora" foi revisado pela última vez — atualize junto com o texto.
export const NOW_UPDATED = new Date('2026-09-29');

const pt = {
  htmlLang: 'pt-BR',
  home: '/',
  otherHome: '/en/',
  nav: { projects: 'projetos', articles: 'artigos', reading: 'consumindo' },
  bio: [
    'Sou engenheiro de software e tenho interesse na interseção entre tecnologia, dados, IA e desenvolvimento de produtos. Escrevo sobre arquitetura de software, sistemas financeiros, aplicações inteligentes, experiência de desenvolvimento e os aprendizados que encontro enquanto construo software.',
    'Tenho particular interesse em entender como sistemas complexos podem se tornar mais simples, flexíveis e úteis — seja através de uma boa arquitetura, dados, IA ou pensamento de produto.',
  ],
  themesLead: 'Os textos daqui giram em torno de',
  and: ' e ',
  themes: {
    arquitetura: 'arquitetura de software',
    financeiro: 'sistemas financeiros',
    ia: 'aplicações inteligentes',
    devex: 'experiência de desenvolvimento',
    dados: 'dados',
    produto: 'pensamento de produto',
  } satisfies Record<ThemeId, string>,
  linkedin: 'Conecte-se no LinkedIn',
  now: {
    title: 'Agora',
    working: 'Trabalhando no <strong>Leitura Curada</strong>, curadoria de leitura por IA entregue no Kindle, e no <strong>Braglog</strong>, que transforma meu histórico do GitHub em rascunhos para o LinkedIn.',
    reading: 'Lendo',
    by: 'de',
  },
  projects: { title: 'Projetos', sub: 'Quase todos com IA e uma pessoa no controle.' },
  articles: {
    title: 'Artigos',
    pinned: 'Fixado',
    topic: 'Tema:',
    clear: 'Limpar filtro de tema',
    empty: 'Ainda não escrevi sobre esse tema. Escolha outro ou limpe o filtro.',
  },
  reading: {
    title: 'Consumindo',
    sub: 'Livros, artigos e o que guardo no Recorder.',
    kinds: { livro: 'Livro', artigo: 'Artigo', video: 'Vídeo', audio: 'Áudio' },
    now: 'lendo agora',
  },
  post: { original: 'Publicado originalmente no', back: 'Voltar para a home' },
  date: (d: Date, style: 'short' | 'long' = 'short') =>
    d.toLocaleDateString('pt-BR', style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace('.', ''),
  month: (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
};

const en: typeof pt = {
  htmlLang: 'en',
  home: '/en/',
  otherHome: '/',
  nav: { projects: 'projects', articles: 'writing', reading: 'reading' },
  bio: [
    'I am a software engineer interested in the intersection of technology, data, AI and product development. I write about software architecture, financial systems, intelligent applications, developer experience and what I learn while building software.',
    'I am particularly interested in how complex systems can become simpler, more flexible and more useful — through good architecture, data, AI or product thinking.',
  ],
  themesLead: 'What I write about here:',
  and: ' and ',
  themes: {
    arquitetura: 'software architecture',
    financeiro: 'financial systems',
    ia: 'intelligent applications',
    devex: 'developer experience',
    dados: 'data',
    produto: 'product thinking',
  },
  linkedin: 'Connect on LinkedIn',
  now: {
    title: 'Now',
    working: 'Working on <strong>Leitura Curada</strong>, AI-curated reading delivered to Kindle, and <strong>Braglog</strong>, which turns my GitHub history into LinkedIn drafts.',
    reading: 'Reading',
    by: 'by',
  },
  projects: { title: 'Projects', sub: 'Most of them with AI and a person in charge.' },
  articles: {
    title: 'Writing',
    pinned: 'Pinned',
    topic: 'Topic:',
    clear: 'Clear topic filter',
    empty: 'Nothing on this topic yet. Pick another or clear the filter.',
  },
  reading: {
    title: 'Reading',
    sub: 'Books, articles and what I keep in Recorder.',
    kinds: { livro: 'Book', artigo: 'Article', video: 'Video', audio: 'Audio' },
    now: 'reading now',
  },
  post: { original: 'Originally published on', back: 'Back to home' },
  date: (d, style = 'short') =>
    d.toLocaleDateString('en-US', style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  month: (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
};

export const copy: Record<Lang, typeof pt> = { pt, en };
