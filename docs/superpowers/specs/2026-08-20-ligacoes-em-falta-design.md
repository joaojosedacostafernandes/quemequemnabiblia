# Ronda 9 — Ligações em Falta

Data: 2026-08-20
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

A revisão final da Ronda 8 encontrou, ao verificar se havia mais contradições como a do Calebe/Otoniel, um problema muito maior: 67 pares de personagens já existentes cujo texto descreve uma relação familiar sem que exista a ligação correspondente no grafo. Isabel pediu para fechar esta lacuna numa ronda própria.

Um levantamento exaustivo (releitura completa das 105 personagens) encontrou **44 pares concretos**, não 67 — a revisão final provavelmente contou de forma mais alargada (por exemplo, incluindo a possibilidade de expandir o grupo dos filhos de Jacob para todas as combinações possíveis, não só os pares mencionados nominalmente). A contagem de 44 é a que serve de base a esta ronda; a diferença fica registada para não gerar confusão futura.

Não há mudanças de arquitetura de fundo — mesma estrutura de ficheiros. Uma pequena adição técnica: um **5º tipo de ligação, "affinity"** (parentesco por casamento — sogra/nora, sogro/genro, etc.), que a Isabel escolheu criar em vez de forçar um tipo existente ou deixar sem ligação. Isto tocará `app.js` (legenda) e `style.css` (cor/estilo da linha), além de `data/personagens.json`.

## Âmbito

**25 ligações novas**, todas entre personagens já existentes — nenhuma personagem nova nesta ronda:

- `ismael ↔ isaac` (sibling) — meios-irmãos, mencionado só pelo lado do Ismael.
- `jose ↔ benjamim` (sibling) — confirmado por ambos os lados.
- `dan ↔ neftali` (sibling) — meios-irmãos (filhos de Bila), confirmado por ambos.
- `gad ↔ aser` (sibling) — meios-irmãos (filhos de Zilpa), confirmado por ambos.
- `juda → jesse` (descendant, "~8 gerações, incerta · Rt 4:18-22") — a linhagem de Judá a Jessé, tal como listada em Rute 4, mas sem o texto bíblico confirmar o número exato de gerações com certeza.
- `noemi ↔ rute` (**affinity**, "sogra e nora") — o caso que motivou a decisão do novo tipo de ligação.
- **19 ligações `sibling`** entre os filhos de Jacob explicitamente mencionados uns aos outros pelo nome nos seus próprios textos (não o grupo completo de 13 — só os pares onde o texto já nomeia os dois lados): `ruben↔simeao`, `ruben↔levi`, `ruben↔juda`, `ruben↔issacar`, `ruben↔zabulao`, `ruben↔dina`, `simeao↔levi`, `simeao↔juda`, `simeao↔issacar`, `simeao↔zabulao`, `simeao↔dina`, `juda↔levi`, `juda↔issacar`, `juda↔zabulao`, `juda↔dina`, `dina↔levi`, `dina↔issacar`, `dina↔zabulao`, `zabulao↔issacar`.

**Deliberadamente fora de âmbito:**
- `booz ↔ noemi` — o texto só diz "parente de Noemi" sem especificar o grau exato; forçar um tipo de ligação inventaria uma precisão que a Bíblia não dá. Fica só em texto.
- A expansão da lista de filhos de Jacob para todas as combinações possíveis (clique completa de 13 personagens, dezenas de ligações) — só as 19 já nomeadas diretamente pelo texto. As menções genéricas ("meio-irmão dos restantes filhos de Jacob") mantêm-se como estão, sem gerar ligações automáticas.
- Pessoas mencionadas mas sem nó próprio (Obede, Jotão, Acsa, Penina, etc.) — mesma convenção já estabelecida na Ronda 8, nenhuma nova personagem nesta ronda. Obede é o caso mais forte para uma futura ronda de conteúdo (é mencionado por 4 personagens diferentes), mas fica fora daqui.

## O novo tipo de ligação "affinity"

- Cor de linha nova em `style.css` (`--line-affinity`), distinta das 4 já existentes (parent castanho, spouse âmbar, sibling verde-oliva, descendant laranja) — um tom terracota-rosado, com padrão pontilhado (`stroke-dasharray: 3 3`) para diferenciar visualmente.
- Nova entrada na legenda em `app.js` (array `LEGEND`): `["affinity", "Parentesco por casamento"]`.
- O motor de desenho (`js/render-cluster.js`) já não precisa de nenhuma alteração — o tipo de ligação é só uma string usada para escolher a classe CSS (`edge-` + tipo), o mesmo mecanismo genérico que já suporta os outros 4 tipos.
- Formato da aresta: `[idA, idB, "affinity", "rótulo opcional"]` — mesmo formato das outras, com rótulo opcional a descrever a relação específica (ex: "sogra e nora").

## Correção adicional (aproveitando o trabalho de consistência desta ronda)

`jose.relacoes` nunca menciona o Efraim como filho (só o `efraim.relacoes` menciona o José) — achado já registado no backlog da Ronda 8. Como esta ronda já está a rever consistência de texto entre personagens relacionadas, aproveita-se para fechar também esta lacuna pontual.

## Validação

Mesma abordagem: JSON válido, clique real no browser, e desta vez também uma verificação específica de que a nova ligação "affinity" aparece corretamente na legenda e com a cor/estilo distintos no grafo.
