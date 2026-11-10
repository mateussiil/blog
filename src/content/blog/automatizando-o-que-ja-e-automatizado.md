---
title: "E se pudéssemos automatizar o que já é automatizado?"
date: 2026-11-10
excerpt: "Faz um tempo que venho construindo ferramentas para automatizar a criação e melhorar a qualidade dos testes E2E. Agora resolvi levar essa ideia pro mobile: um laboratório em que agentes de IA testam um aplicativo de verdade."
themes: ["arquitetura", "ia", "devex"]
originalUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7525578612239167488/"
---

![Slide de abertura do laboratório E2E Android: “Cinco Bots do Grok testando um app Android de verdade”, com os tópicos “os Bots em ação”, “como eles falam com o emulador” e “monte o seu, prompt por prompt”.](/images/artigos/automatizando-o-que-ja-e-automatizado.png)

Faz um tempo que venho construindo ferramentas para automatizar a criação e melhorar a qualidade dos testes E2E.

Sempre achei testes importantes, mas agora acho ainda mais. É praticamente impossível acompanhar o ritmo de desenvolvimento atual, entregando novas funcionalidades e mantendo a qualidade sem investir cada vez mais em automação.

Por isso, tenho criado alguns projetos pra estudar e experimentar isso na prática.

Primeiro, comecei pela própria estrutura dos projetos: organizei a [arquitetura](https://mateussiil.com.br/blog/arquitetura-de-frontend-organizando-o-caos/) e tornei as aplicações mais testáveis. Depois, fui definindo o que precisava ser testado, não só como testar, mas [quanto custa estar errado](https://mateussiil.com.br/blog/arquitetura-medalhao-testes/) e quanto esforço vale a pena investir em cada teste.

Agora resolvi levar essa ideia pro mobile: criei um laboratório de testes E2E Android, em que agentes de IA conseguem testar um aplicativo de verdade, usando um emulador.

A estrutura segue um princípio que venho explorando nos outros projetos: separar responsabilidades.

- **🧭 Coordenador:** divide o cenário em etapas e chama os outros agentes. Não toca na tela.
- **👀 Reader:** observa e lê a tela.
- **👆 Tapper:** toca, arrasta e navega pelo aplicativo.
- **⌨️ Typer:** único responsável por digitar.
- **✅ Checker:** confere o resultado sem ter executado a ação.

![Slide “Dividimos o teste em cinco papéis”, com os cards do Coordenador, Reader, Tapper, Typer e Checker. O Coordenador recebe o cenário, divide em passos e chama um bot por vez, sem tocar na tela. O Reader lê os rótulos da tela. O Tapper toca, arrasta e navega. O Typer digita nos campos. O Checker compara o resultado com o esperado.](/images/artigos/automatizando-o-que-ja-e-automatizado/cinco-papeis.png)

Mas, sinceramente, os bots são só uma parte da história. O que quero construir mesmo é a ferramenta por trás deles.

<video controls muted playsinline preload="metadata" poster="/images/artigos/automatizando-o-que-ja-e-automatizado/replay-poster.png" style="width: 100%; border-radius: 8px;" title="Replay do laboratório E2E: os bots operando o emulador Android e o painel com o log das chamadas.">
  <source src="/images/artigos/automatizando-o-que-ja-e-automatizado/replay.mp4" type="video/mp4" />
  Seu navegador não suporta vídeo em HTML5.
</video>

![Slide “Os Bots chamam, o emulador obedece”: à esquerda, a tela do emulador Android com o “App de teste”; no centro, o painel de chamadas dos bots, com toques, leituras e erros.](/images/artigos/automatizando-o-que-ja-e-automatizado/bots-em-acao.png)

Os agentes ficam na nuvem, mas o controle do Android continua local. Um túnel HTTPS leva as chamadas até uma ponte protegida por token, limitada a um único emulador e sem acesso a shell.

![Slide “Como um pedido do Bot chega ao emulador”: os Bots do Grok, na nuvem, passam por um túnel HTTPS até a ponte local, que confere a chave de acesso e envia o pedido ao emulador; a ponte também alimenta um painel no navegador com cada pedido, quem fez e a tela ao vivo.](/images/artigos/automatizando-o-que-ja-e-automatizado/arquitetura.png)

Cada chamada fica registrada com a identificação de quem executou a ação, e montei um painel pra acompanhar tudo ao vivo. Também implementei a limpeza do aplicativo entre as execuções.

A ideia é que os agentes possam mudar, mas a ferramenta continue funcionando.

E teve bastante perrengue até aqui. Download travando, emulador caindo, screenshot levando 2,7 segundos (consegui reduzir pra uns 300 ms usando o console do emulador) e até um painel quebrando por causa de um acento em um header HTTP. 😂

Hoje a base já consegue navegar pelo aplicativo e se recuperar de alguns erros. Ainda preciso validar o login e fechar um cenário completo de ponta a ponta.

Depois disso, quero partir pras personas sintéticas: simular usuários com diferentes níveis de paciência, aparelhos e contextos, passando pelos mesmos fluxos pra tentar encontrar problemas que um roteiro fixo dificilmente encontraria.

Essa parte também veio de algumas ideias que vi compartilhadas pelo Felippe Regazio e pela Ysabella Andrade.

No fim, acho que todos esses projetos estão me levando pra uma mesma direção: encontrar formas de testar melhor, detectar problemas mais cedo e deixar o software mais confiável.

Como vocês estão lidando com regressões nos times? Já conseguiram criar uma cultura de testes ou ainda é aquela história de testar quando sobra tempo? 😅

## Referências

- [Arquitetura de frontend: organizando o caos](https://mateussiil.com.br/blog/arquitetura-de-frontend-organizando-o-caos/)
- [Uma arquitetura medalhão para testes automatizados](https://mateussiil.com.br/blog/arquitetura-medalhao-testes/)
- [frontend-architecture-ecommerce-example](https://github.com/mateussiil/frontend-architecture-ecommerce-example)
- [Ysabella Andrade, “Personas Sintéticas: Aprendizados Práticos para Testes de UX”](https://www.linkedin.com/pulse/personas-sint%C3%A9ticas-aprendizados-pr%C3%A1ticos-para-testes-andrade-ngvwf/)
- [Felippe Regazio, “Estrutura de personas para testes com AI: exemplo prático e organização”](https://www.linkedin.com/posts/felippe-regazio_algumas-pessoas-se-interessaram-bastante-share-7494075742809505792-Bpib/)
- [Felippe Regazio, “Mercado Livre: como auditamos 100 issues em 1 dia com IA”](https://www.linkedin.com/posts/felippe-regazio_gostaria-de-trazer-um-case-interessante-share-7492989474646401025-89y_/)
- [Uma atualização do Felippe Regazio no LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7524470764411121664/)
- [Publicado originalmente no LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7525578612239167488/)
