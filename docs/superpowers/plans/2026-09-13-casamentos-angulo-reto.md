# Casamentos em ângulo reto — Plano

**Motivação:** com muitos personagens, casamentos entre pessoas afastadas ou de
gerações diferentes desenhavam linhas longas em diagonal que cruzavam o ecrã
(ex: `saul_david_ev` — David, filho de Jessé à esquerda, casado com Mical ao
centro e com Abigail em cima à direita). Decisão do utilizador: **linhas de
casamento só em ângulo reto**, aproximando os casais o mais possível.

## Global Constraints
- Só `js/event-graph.js` (layout + render). `app.js`, dados, retratos, CSS de
  linhas (a `.cline.casamento` já existe) intactos. Node fora do PATH (prefixar
  o dir winget). PT. Assinaturas públicas inalteradas.

## Mudança 1 — layout: aproximar casais (pura, TDD)
No loop da geração ≥1, ao colocar cada grupo de filhos, **ordenar os membros do
grupo pelo slot do cônjuge já colocado** (cônjuge mais à esquerda → membro mais à
esquerda; sem cônjuge colocado → mantém-se depois). Isto põe, p.ex., a Mical
(casada com o David, já colocado à esquerda) imediatamente ao lado do David, em
vez de ter o Jónatas no meio.

Teste (Caso 15): jesse→david, saul→{jonatas,mical}, david♥mical ⇒
`|slot[david]-slot[mical]| === 1` (adjacentes). Falha antes, passa depois.

## Mudança 2 — render: casamento em ângulo reto (DOM, verificado por CDP)
Para cada casal:
- **Lado a lado na mesma fila** (mesma geração e sem nenhum orbe entre eles):
  mantém-se a **linha horizontal direta com ♥** a meio (caso comum já validado —
  não mexer). O ♥ continua a ser a origem da descendência.
- **Caso contrário** (afastados na mesma fila, ou gerações diferentes): percurso
  **ortogonal** por uma faixa horizontal no intervalo logo abaixo do orbe mais
  alto do par (`laneY = min(ay,by) + max(rowHeight*0.4, 7%)`): descida/subida
  vertical de cada orbe até à faixa + segmento horizontal na faixa; ♥ ao meio da
  faixa. Nunca há diagonais. Se o casal tiver filhos, a descendência arranca do
  ♥ na faixa (fica acima dos filhos, funciona).

Verificação (CDP, eventos reais): em `saul_david_ev`, `origens`, `nascimento_ev`,
`rute_ev`, `apostolos_ev` — **0 segmentos diagonais** (todos os `.cline`,
incluindo `casamento`, verticais ou horizontais), casais lado a lado com linha
reta, e os distantes (David♥Abigail, David♥Mical se ainda não adjacente) em
ângulo reto sem cruzar orbes. Screenshots mostrados ao utilizador.

## Limitação aceite
Um casamento distante cuja faixa horizontal cruze uma linha de descendência
vertical de outra família faz um cruzamento **em ângulo reto** (não diagonal) —
muito mais legível que a diagonal anterior; aceite.
