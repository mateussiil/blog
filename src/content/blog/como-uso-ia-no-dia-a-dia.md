---
title: "Como uso IA pra resolver probleminhas do dia a dia"
date: 2026-09-22
excerpt: "Uma coleção de automações pequenas que economizam minutos todo dia — e por que elas importam mais que um projeto grande."
themes: ["ia"]
draft: true
---

Não é o projeto grande que economiza tempo no fim do mês — é a automação de cinco minutos que você usa todo santo dia. Separei aqui três exemplos reais que uso na minha rotina.

![Capa: automatizando o dia a dia](/images/post-cover.svg)

## Resumindo commits do dia

No fim da tarde eu rodava `git log` manualmente pra lembrar o que tinha mexido. Hoje isso é um script:

```bash
# resumo.sh — gera um resumo dos commits do dia
git log --since="6am" --oneline | \
  llm "resuma essas mudanças em 3 bullets, em português"
```

> Não é sobre economizar 10 minutos. É sobre nunca mais escrever o mesmo resumo de standup duas vezes.

## Triagem de issues

O segundo exemplo é um pouco mais visual — este vídeo curto mostra o fluxo completo, do webhook do GitHub até o comentário automático na issue:

<video controls poster="/images/post-cover.svg" style="width: 100%; border-radius: 8px;">
  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
  Seu navegador não suporta vídeo em HTML5.
</video>

## O que eu evito

Automação demais também é problema — se você não confia no resultado sem revisar, ela não está economizando tempo, só mudando onde o tempo é gasto. Regra que uso: só automatizo o que eu já fazia de forma repetitiva e previsível.
