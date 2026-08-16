# Redesign visual e enriquecimento de conteúdo — "Os Personagens da Bíblia"

Data: 2026-08-16
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

O protótipo "Constelação Bíblica" (tema escuro, mapa de estrelas, 20 personagens de Génesis/Êxodo) foi validado como conceito de interação — exploração livre de um grafo de personagens ligadas por relações familiares, com cartão lateral por personagem (época, referências bíblicas, resumo, família). Existia apenas como Artifact publicado, fora do repositório.

Isabel gostou do protótipo mas pediu três coisas: (1) melhorar o visual, (2) acrescentar informação histórica e mais detalhe bíblico a cada personagem, (3) começar a tratar isto como o site real em vez de um protótipo avulso. Uma sessão de brainstorming com companion visual (3 mockups comparados lado a lado) resultou nas decisões abaixo.

Ver `handover.md` para o histórico completo da sessão anterior e `CLAUDE.md` para as decisões de fundo do projeto (âmbito bíblico completo, sem gamificação, site estático, dados separados do motor).

## Objetivo desta ronda

Substituir o tema escuro de "constelação" por um novo sistema visual ("Livro de Ilustrações"), enriquecer o conteúdo de cada personagem com contexto histórico, trazer o código para ficheiros reais neste repositório (dados separados do motor de renderização), e fechar o bloco narrativo Génesis/Êxodo com mais personagens.

**Fora de âmbito nesta ronda:** linha do tempo com escala/datas explícitas (mantém-se a ordenação esquerda→direita por época, sem eixo de datas — cronologias bíblicas para o Génesis inicial são tecnicamente contestadas e isso foi decidido para evitar essa complexidade); símbolos bespoke por personagem (rejeitado — não escala para uma pessoa sem formação técnica adicionar conteúdo); gamificação/quizzes (já excluído nas decisões de fundo do projeto).

## Direção visual: "Livro de Ilustrações"

Fundo cor de pergaminho (gradiente `#f6ecd4` → `#efe0bd`), paleta terrosa e quente (terracota `#c1652f` como cor de destaque principal, tons de ocre e castanho para texto e traços). Tipografia serif (Georgia) para nomes e títulos, mantendo uma sans-serif do sistema para texto corrido — o mesmo princípio tipográfico do protótipo atual, mas aplicado a uma paleta quente em vez de fria/noturna.

Cada personagem é um medalhão circular (fundo creme `#fffaf0`, borda terracota de ~2.5px) em vez do "ponto de estrela" atual. As ligações entre personagens (pai/mãe, casamento, irmãos, "várias gerações depois") mantêm a mesma lógica de 4 tipos de linha do protótipo atual, mas redesenhadas como traços de tinta/pena em vez de linhas de constelação douradas — mesma informação, textura visual diferente.

A disposição do grafo mantém-se: esquerda (mais antigo) → direita (mais recente), pan/zoom por arrasto, cartão lateral (bottom sheet em mobile) ao selecionar uma personagem. Não há mudança na interação, só no revestimento visual.

## Sistema de ícones por tipo

Dentro do medalhão de cada personagem, um ícone indica o seu "tipo" — não um símbolo único por pessoa, mas um de um conjunto fixo e pequeno de categorias reutilizáveis, para que adicionar uma personagem nova nunca exija desenhar nada:

- Patriarca
- Matriarca
- Profeta / Profetisa
- Rei / Governante
- Sacerdote / Levita
- Criança / Jovem
- Povo / Irmãos
- Estrangeiro / Aliado

Cada personagem no ficheiro de dados tem um campo `tipo` que é uma destas oito strings. O conjunto de ícones SVG (um por tipo, ~8 ficheiros) é criado uma única vez como parte da implementação; adicionar uma personagem nova é escolher um `tipo` da lista, nunca criar arte nova. Se surgir a necessidade de um tipo adicional no futuro, isso é uma decisão consciente (não algo que aconteça por defeito a cada personagem nova).

## Modelo de dados

Fica confirmado o princípio já decidido no `CLAUDE.md`: conteúdo num ficheiro de dados simples, separado do motor de renderização. `data/personagens.json` passa a incluir, por personagem, os campos já existentes no protótipo (id, nome, tier, x/y, era, referências, resumo, relações-texto) mais dois novos:

- `tipo` — uma das oito categorias acima, usada para escolher o ícone
- `contexto` — 1-2 frases de contexto histórico/cultural real (onde viviam, como era a vida na época), distinto do `resumo` bíblico/narrativo já existente

O `resumo` de cada uma das 20 personagens atuais é revisto e aprofundado com mais detalhe narrativo/bíblico do que a versão do protótipo.

As ligações (`EDGES`) mantêm a mesma estrutura do protótipo — lista de pares com tipo de relação (`parent`, `spouse`, `sibling`, `descendant`) e, para `descendant`, o texto de referência ("9 gerações · Gn 11").

## Estrutura de ficheiros

```
Orion/
├── index.html            # esqueleto da página
├── style.css              # sistema visual "Livro de Ilustrações"
├── app.js                  # motor do grafo — genérico, lê data/personagens.json
├── data/
│   └── personagens.json    # todo o conteúdo — é aqui que a Isabel mexe para adicionar/editar personagens
└── assets/
    └── icons/               # os ~8 ícones SVG por tipo
```

O motor (`app.js`) não deve conter nomes, textos ou dados de personagens específicas — só lógica de layout, desenho do grafo e do cartão. Isto é o que torna `personagens.json` seguro de editar sem tocar em código.

## Expansão de conteúdo

Depois do redesign das 20 personagens atuais, esta ronda inclui fechar o bloco Génesis/Êxodo com mais personagens (ordem de grandeza: 10-20), candidatos a confirmar durante a implementação/curadoria: os restantes filhos de Jacó além de José (Rúben, Simeão, Levi, Judá, Dan, Neftali, Gad, Aser, Issacar, Zabulão, Benjamim), Dina, Arão, e Faraó. A lista exata e o nível de detalhe de cada uma ficam para a fase de curadoria de conteúdo dentro do plano de implementação — este documento fixa a ordem de grandeza e o bloco narrativo, não a lista final.

## Validação

Não há testes automatizados — é um site estático sem lógica de negócio complexa. A validação é visual: abrir o site no browser (via skill `run`) depois de cada alteração relevante, confirmar que o novo estilo, os ícones por tipo e os novos campos de conteúdo aparecem corretamente, testar em viewport de mobile (bottom sheet), e rever o conteúdo em conjunto com a Isabel antes de considerar a ronda fechada.
