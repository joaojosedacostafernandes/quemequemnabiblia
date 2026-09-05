# Faixa de épocas — redesign de navegação (Ronda 10)

## Motivação

A Isabel testou o site redesenhado na Ronda 7 (navegação em duas camadas: ecrã de percurso com as 33 épocas → ecrã de cluster de uma época) e encontrou um problema de fluxo: para trocar de uma época para outra, é preciso primeiro clicar "← Voltar ao percurso" para fechar a época atual, antes de poder abrir a seguinte — os dois ecrãs não coexistem, e a transição obrigatória sente-se como as épocas ficarem "sobrepostas" em vez de a nova substituir a anterior diretamente. Pediu três coisas:

1. Trocar de época sem ter de fechar a anterior manualmente primeiro.
2. O cartão de descrição da personagem selecionada fixo à direita do ecrã (já é assim no CSS atual em desktop — este pedido confirma que deve continuar assim na nova disposição).
3. As épocas não selecionadas devem ocupar o mínimo de espaço possível, o mais à esquerda do ecrã, dando o máximo de espaço à área de exploração da época selecionada.

## Decisões tomadas (brainstorming, 2026-09-05)

- **Modelo de navegação:** o ecrã de percurso (mapa espacial das 33 épocas, com posições calculadas por `js/render-path.js`) é substituído por uma **faixa de épocas sempre visível**, encostada à esquerda do ecrã. Deixa de existir um "ecrã" separado para escolher a época — a faixa e a área de exploração coexistem sempre lado a lado.
- **Conteúdo da faixa:** lista plana com o nome de cada uma das 33 épocas por extenso (mesmo texto que já existe em `data.eras[].nome`) mais a contagem de personagens de cada uma (o mesmo número que a estação do mapa antigo já mostrava) — sem agrupar por livro bíblico (isso exigiria um campo novo de dados, decisão explicitamente descartada pela Isabel por não valer o custo agora) e sem nenhuma linha/caminho visual a ligar as épocas (a ordem de cima para baixo já comunica a cronologia).
- **Trocar de época:** clicar num item da faixa substitui imediatamente o conteúdo da área central pela época escolhida. A época anteriormente aberta não precisa de nenhuma ação de fecho — nunca há duas épocas abertas ao mesmo tempo, mas também nunca é preciso um botão "voltar". O botão "← Voltar ao percurso" e a barra de breadcrumb (`#breadcrumbBar`) deixam de existir.
- **Painel de detalhe da personagem:** mantém-se exactamente como está hoje (`aside#panel`, coluna fixa de 22rem em desktop, sem sobreposição — já cumpre o pedido da Isabel). Ao trocar de época, o painel volta ao estado vazio ("Escolhe uma personagem…") porque a personagem selecionada pertencia à época anterior.
- **Estado inicial (primeiro carregamento):** área central vazia com uma mensagem-convite (ex: "Escolhe uma época à esquerda para começares"); nenhuma época vem pré-selecionada.
- **Mobile (≤720px):** a faixa deixa de ser uma coluna vertical e passa a ser uma barra horizontal com scroll lateral, encostada ao topo do ecrã (abaixo do cabeçalho/pesquisa). O painel de detalhe mantém-se como já é hoje (bottom sheet que sobe de baixo).
- **Ligações entre eras e pesquisa:** o fluxo de clicar num nome dentro do cartão de detalhe ("Ligações noutras eras") ou escolher um resultado de pesquisa continua a funcionar tal como hoje (muda a época ativa + abre a personagem certa no painel) — só muda onde a época fica destacada (a faixa, não um mapa).
- **Dados:** nenhuma alteração a `data/personagens.json` é necessária.

## Desenho técnico

### Estrutura HTML (`index.html`)

Dentro de `.stage`, acrescentar um novo `<aside id="eraStrip">` como primeiro filho, antes de `.graph-wrap`:

```html
<div class="stage">
  <aside id="eraStrip" class="era-strip"></aside>
  <div class="graph-wrap">
    <!-- breadcrumb-bar removido -->
    <svg id="graph" ...>...</svg>
    <div class="controls">...</div>
  </div>
  <aside id="panel">...</aside>
</div>
```

Remove-se `.breadcrumb-bar` (`#breadcrumbBar`, `#backBtn`, `#breadcrumbLabel`) de `index.html` — deixa de haver "voltar ao percurso".

### `js/render-path.js` → simplificado para a faixa

Substituir o cálculo espacial (posições de estação, `MARGIN`/`STEP_X`/`STEP_Y`, desenho SVG de círculos/linhas) por uma função que gera a lista HTML da faixa:

```js
function renderEraStrip(erasWithCounts, activeEraNome, container, onSelectEra) {
  container.innerHTML = '';
  erasWithCounts.forEach(function (era) {
    var item = document.createElement('button');
    item.type = 'button';
    item.className = 'era-item' + (era.nome === activeEraNome ? ' active' : '');
    item.setAttribute('aria-label', era.nome + ', ' + era.count + ' personagens');
    item.innerHTML = '<span class="era-name">' + era.nome + '</span><span class="era-count">' + era.count + '</span>';
    item.addEventListener('click', function () { onSelectEra(era.nome); });
    container.appendChild(item);
  });
}
```

Deixa de desenhar em SVG (`edgeLayer`/`nodeLayer` deixam de ser passados) — é HTML simples dentro de `#eraStrip`, o que também simplifica o CSS (não precisa de `viewBox`/`transform` nenhum, só `overflow-y: auto` em desktop e `overflow-x: auto` em mobile).

### `js/render-cluster.js` e `js/layout.js`

Sem alterações. Continuam a desenhar a árvore genealógica + grelha da época ativa exactamente como hoje, sempre dentro do `#graph` central.

### `app.js` (orquestrador)

- Remove `goToPath()`, `backBtn` e a lógica de `breadcrumbBar`.
- `goToEra(eraNome)` passa a também re-renderizar a faixa (para marcar a nova época como `.active`) e a chamar `closePanel()` como já faz hoje. Depois de marcar `.active`, chama `scrollIntoView({block: 'nearest'})` (desktop) / `{inline: 'center'}` (mobile) no item ativo — necessário porque a pesquisa e "Ligações noutras eras" podem saltar para uma época distante que esteja fora da área visível da faixa (com scroll, seja vertical em desktop seja horizontal em mobile).
- Estado inicial: nenhuma chamada a `goToEra` no arranque — mostra-se a mensagem vazia (`panel-empty`-like) na área central; a faixa renderiza-se sem nenhuma época `.active`.
- `crossEraRefsHtml` e o fluxo de pesquisa continuam a chamar `goToEra(eraNome)` + `selectCharacter(id)`, sem alterações de fundo.

### CSS (`style.css`)

- Novo bloco `.era-strip` (desktop): `width: 200px`, `flex-shrink: 0`, `overflow-y: auto`, `border-right: 1px solid var(--border)`.
- `.era-item`: botão de largura total, texto à esquerda + contagem à direita, estado `.active` destacado (mesma paleta terracota/âmbar já usada em `.node.selected`).
- Remove-se `.breadcrumb-bar` e regras associadas.
- `@media (max-width: 720px)`: `.era-strip` passa a `display:flex; flex-direction:row; overflow-x:auto; overflow-y:hidden` no topo do `.stage` (que também passa a `flex-direction: column` em mobile).
- `aside#panel` mantém-se sem alterações de fundo (já cumpre o requisito de ficar fixo à direita em desktop / bottom sheet em mobile).

## Fora de âmbito (não faz parte desta ronda)

- Agrupar a faixa por livro bíblico (exigiria um novo campo de dados por época) — descartado nesta ronda, fica como ideia futura se a lista de 33 nomes se tornar difícil de navegar.
- Qualquer sinal visual de "caminho"/percurso gamificado na faixa — descartado, lista simples chega.
- Sub-projetos B (cartões mais ricos) e C (vista histórica) do redesign de navegação da Ronda 7 — continuam pendentes, não fazem parte desta ronda.

## Testes

- `scripts/test-layout.js` não precisa de alterações (não toca em `js/layout.js` nem `js/render-cluster.js`).
- Verificação manual num browser real (cliques reais via CDP, como nas rondas anteriores): trocar de época várias vezes seguidas sem passar por nenhum "fechar"; confirmar que o painel de detalhe limpa ao trocar de época; confirmar viewport mobile (faixa horizontal no topo, bottom sheet do painel); confirmar que "Ligações noutras eras" e a pesquisa continuam a mudar de época e abrir a personagem certa.
