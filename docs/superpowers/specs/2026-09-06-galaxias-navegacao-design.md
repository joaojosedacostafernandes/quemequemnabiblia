# Navegação entre Galáxias — Design

**Spec:** substitui o modelo de "vários capítulos abertos em separadores/faixa lateral" (Ronda 11) por um modelo de "uma galáxia de cada vez", com transição de salto no hiperespaço, portado do protótipo `galaxias-mockup.html` (Artifact aprovado por Isabel).

## Porquê

Isabel testou a Ronda 11 e achou confuso abrir vários capítulos ao mesmo tempo. Pediu explicitamente um modelo mental diferente: cada capítulo é uma "galáxia" com os seus próprios personagens; nunca duas galáxias visíveis/interativas ao mesmo tempo; navegação entre elas deve ser possível. Testou 3 opções de navegação num protótipo interativo e escolheu a **Opção 1 — só um botão "Voltar ao mapa"** (mais simples e previsível para crianças). Pediu também um efeito mais "3D"/"viagem espaço-tempo", que se tornou o salto no hiperespaço (streaks de canvas + perspetiva CSS 3D), já aprovado e testado no mesmo protótipo.

## Modelo de navegação

Dois ecrãs, nunca ambos interativos ao mesmo tempo:

1. **Mapa de galáxias** — grelha com as 7 galáxias (capítulos), cada uma mostrando nome + contagem de personagens. Clicar entra na galáxia.
2. **Interior de uma galáxia** — só os personagens desse capítulo, com a física real (deriva, halos, retratos, linhas de parentesco). Só existe "← Voltar ao mapa" — sem mini-mapa, sem rasto de visitadas.

Transição entre os dois: o mesmo efeito de salto no hiperespaço do protótipo (streaks de estrelas em canvas a irradiar do centro + o próprio ecrã ganha profundidade via `perspective`/`translateZ`/`rotateX` em CSS, ~550ms, desliga-se com `prefers-reduced-motion`).

**Salto direto entre galáxias** (ver secção seguinte): quando o salto é disparado por uma ligação cruzada ou pela pesquisa, salta-se diretamente de uma galáxia para outra — nunca mostra o mapa geral a meio.

## Física dentro da galáxia

Reaproveita tal e qual `js/physics.js` + `js/render-graph.js` + `js/reveal-graph.js` (motor da Ronda 11: deriva orgânica, halos, retratos, badges "+", linhas de parentesco por casamento/descendência). Mudança de âmbito: em vez de todos os 7 capítulos poderem estar simultaneamente na simulação (com a guarda `rootCapitulo` a isolar a física de cada um), agora **só entra na simulação, a qualquer momento, os personagens de UMA galáxia**.

Isto simplifica genuinamente o motor, porque:
- Nós `kind:'capitulo'` nunca mais entram em `sim` — a identidade da galáxia passa a viver inteiramente no mapa (HTML/CSS fora do SVG), não como um nó físico. Isto elimina toda a lógica de "faixa lateral" (`anyCapExpanded`, `effectiveHome`, `SIDE_RADIUS`, `SIDE_ANCHOR_K`, `ERA_ANCHOR_K`, posições `home` em grelha) — hoje essa lógica só se aplicava a nós capítulo; os próprios personagens nunca tiveram `home` nem âncora, por isso removê-la não muda o comportamento de nenhum personagem.
- A guarda `rootCapitulo` no duplo-loop de repulsão em `frame()` deixa de ser necessária — só há sempre uma galáxia na simulação, portanto nunca há dois grupos a precisar de isolamento.
- Isto também resolve de vez, por construção, a limitação residual já documentada no código (`alpha`/`asleep` globais causarem um pequeno reajuste ao abrir um segundo capítulo) — sem segundo capítulo possível, o cenário deixa de existir.

**Entrada numa galáxia:** em vez do antigo `bootstrap()` (que colocava todos os 7 capítulos em grelha), uma nova função `enterCapitulo(capId)` limpa a simulação e coloca os personagens de arranque desse capítulo (`defs[capId].reveals`, já existente) num pequeno leque à volta do centro do mundo — o mesmo padrão de leque que `toggleExpand` já usa para filhos recém-revelados, só que a partir do centro em vez de um nó pai. A física normal (repulsão + molas + `fitView` automático) trata do resto, exatamente como já acontece hoje quando se expande qualquer personagem.

**Botão "fechar tudo"** dentro da galáxia (equivalente ao atual `collapseAllBtn`) passa a re-chamar `enterCapitulo` com o capítulo atual — "recomeçar esta galáxia", não "fechar os 7 capítulos" (esse conceito deixa de existir).

## Ligações entre galáxias

Um personagem pode ter ligações (família, casamento) com personagens de outra galáxia. Hoje isto já é mostrado no cartão de detalhe como "Ligações noutras eras" (comparando o campo `era`), com cada ligação clicável (`revealAndSelect`). Duas mudanças:

1. **O critério muda de "era diferente" para "galáxia diferente"** — usando uma nova função `RevealGraph.groupByCapitulo(defs)` que devolve, para cada personagem, a que capítulo pertence (via uma travessia a partir de cada `defs[capId].reveals`, a mesma ideia do `revealedBy` que já existe em `app.js`, mas por capítulo em vez de global). Duas personagens na mesma galáxia mas em eras internas diferentes deixam de aparecer nesta secção (não precisam de salto); só aparecem ligações que realmente atravessam uma fronteira de galáxia.
2. **A etiqueta mostra o nome da galáxia**, não a era (“também aparece em: Os Profetas”), porque é isso que a ligação vai fazer ao clicar.

Clicar numa ligação cruzada (ou usar a pesquisa, que é global a todas as galáxias) chama `revealAndSelect(id)`: se o alvo está numa galáxia diferente da atual, dispara o salto no hiperespaço diretamente para essa galáxia (sem passar pelo mapa geral), inicializa-a com `enterCapitulo`, e só depois expande a cadeia de revelação até ao alvo e foca-o — mesmo padrão de `setTimeout` já usado hoje, com o atraso ajustado para cobrir a duração do salto (550ms).

## Ficheiros afetados

- `js/reveal-graph.js` — remove `home`/`CAP_HOMES` (deixam de ter consumidor); adiciona `groupByCapitulo(defs)`.
- `js/physics.js` — remove `anyCapExpanded`, `effectiveHome`, `SIDE_RADIUS`, `targetRadiusFor` (fica sempre `radiusFor`), `rootCapitulo`, `capitulIds`, a guarda de repulsão por capítulo, e o bloco de âncora `ERA_ANCHOR_K`/`SIDE_ANCHOR_K` em `frame()`; substitui `bootstrap()` por `enterCapitulo(capId)` + `resetGalaxy()`.
- `js/render-graph.js` — remove os ramos que só se aplicavam a nós `kind:'capitulo'` (nunca mais existem em `sim`): classe `side`, classe `chapter-opened`, etiqueta de contagem de personagens no próprio nó. Remove `drawBackground`/uso de `#bgLayer` (substituído pelo canvas partilhado de fundo).
- `js/warp-transition.js` (novo) — porta `triggerWarp`/`drawWarp`/o ciclo de estrelas do protótipo `galaxias-mockup.html`.
- `js/galaxy-map.js` (novo) — renderiza a grelha de galáxias (nome + contagem de personagens, via `groupByCapitulo`), delega o clique para `app.js`.
- `index.html` — nova estrutura: `#bgStars` (canvas), `#mapView` (grelha de galáxias), `#galaxyView` (cabeçalho com "Voltar ao mapa" + título + controlos, depois o `#stage` SVG existente sem `#bgLayer`), `aside#panel` inalterado.
- `style.css` — remove regras `.node.capitulo`, `.side`, `.chapter-opened`; adiciona os estilos de mapa de galáxias e a transição 3D (perspective/translateZ/rotateX), portados do protótipo.
- `app.js` — reescreve a orquestração: `renderGalaxyMap()`, `enterGalaxy(capId)`, `exitToMap()`, `revealAndSelect` com salto entre galáxias, `crossEraRefsHtml` a usar `groupByCapitulo` em vez de `era`.

## Fora de âmbito

- Não muda `data/personagens.json` além do que já lá está (`capitulos` já existe desde a Ronda 11).
- Não implementa as opções 2/3 de navegação (mini-mapa, rasto) — só a Opção 1.
- Não altera o conteúdo/redação dos cartões de personagem, só a condição que decide o que aparece em "também aparece em".

## Testes

`scripts/test-reveal-graph.js` ganha casos novos para `groupByCapitulo` (cada personagem de arranque e os seus descendentes ficam atribuídos ao capítulo certo; união entre cônjuges de galáxias diferentes — caso hipotético, sem exemplo real hoje — não é assumido/testado, mantém-se o aviso já existente no código de que isto não é garantido pelos dados). Verificação funcional via Chrome DevTools Protocol com cliques reais (convenção já estabelecida no projeto): entrar numa galáxia, expandir/colapsar personagens, saltar por uma ligação cruzada, saltar pela pesquisa, voltar ao mapa, confirmar que nunca há duas galáxias com física ativa ao mesmo tempo.
