# Ecrã interior — organograma limpo com rótulos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a "teia de linhas" do interior de um acontecimento por um organograma limpo — descendência só em ângulo reto, casamento com ♥, e relações fracas (irmãos sem pai, afinidade, companheiros) mostradas como grupos rotulados sob uma chaveta, sem linhas a cruzar.

**Architecture:** Toda a mudança vive em `js/event-graph.js` (uma função pura nova `deriveGroups`, um ajuste de adjacência em `layoutEvent`, e a reescrita de `render` para roteamento ortogonal + rótulos + chavetas) e em `style.css` (estilo das linhas ortogonais, chavetas, rótulos; remoção da flutuação). `app.js` não muda — a assinatura de `EventGraph.render(charLinesEl, charButtonsEl, ids, defs, edges, onCharClick)` e de `deriveFamily`/`layoutEvent` mantém-se. Não existe legenda separada de tipos de linha a atualizar.

**Tech Stack:** Site estático sem framework nem bundler. JS IIFE em `window` (+ `module.exports` para testes Node). Testes: `node scripts/test-event-graph.js` (funções puras, sandbox `new Function`, sem DOM). Verificação visual: Chrome headless via CDP com eventos reais.

## Global Constraints

- **Node não está no PATH.** Antepor a cada comando `node`:
  `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64`
- **Implementar em worktree isolado**, nunca em `master`.
- **Implementar com o modelo Fable 5** (pedido explícito do utilizador).
- Todo o texto de interface e conteúdo em **português**, adequado a crianças.
- **Nunca inferir sexo** de um nome (regra do projeto): o rótulo de descendência é `"pais de"` para casais e `"pai/mãe de"` para progenitor único (o próprio ficheiro de dados não tem campo de sexo; ver Task 3).
- As funções `deriveFamily`/`layoutEvent`/`render` continuam expostas em `window.EventGraph` **e** em `module.exports`.
- Coordenadas de posição continuam em **percentagem** (`%`) dentro do `camLayer` (câmara aplicada pelo `app.js`); só translações finas de rótulos/chavetas usam `px` via `transform`.
- `index.html` **não** abre por `file://` — servir por `http://` para verificar.

---

### Task 1: `deriveGroups(family)` — componentes ligados das relações fracas

Função pura nova que transforma as arestas fracas (`family.irmaos`) em **grupos rotulados**, excluindo pares que já são irmãos pela árvore (partilham progenitor dentro do acontecimento — esses não precisam de nada, ficam lado a lado sob o mesmo pai). É o input das chavetas no `render` e da adjacência no `layoutEvent`.

**Files:**
- Modify: `js/event-graph.js` (acrescentar `deriveGroups`, exportá-la)
- Test: `scripts/test-event-graph.js` (casos novos)

**Interfaces:**
- Consumes: `family` de `deriveFamily(ids, edges)` → `{casais, filhos, irmaos}`, onde `irmaos` é `[[a, b, label], ...]` e `filhos` é `[{pais:[...], filho}, ...]`.
- Produces: `deriveGroups(family)` → `[{ ids: [id,...], label: string|null }, ...]`, um objeto por componente ligado (≥2 membros) das arestas fracas que **não** partilham progenitor no acontecimento. `label` = a etiqueta da primeira aresta (em ordem de entrada) cujas duas pontas estão no componente, ou `null`. Exportada em `EventGraph.deriveGroups`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao fim de `scripts/test-event-graph.js`, **antes** da linha `console.log('\nALL PASS');`:

```js
// --- Caso 7: deriveGroups agrupa arestas fracas em componentes ligados,
// excluindo pares que já partilham progenitor no acontecimento ---
(function () {
  // Pedro-André-Tiago ligados por arestas fracas (companheiros) → 1 grupo de 3.
  const family = {
    casais: [], filhos: [],
    irmaos: [['pedro', 'andre', 'apóstolos'], ['andre', 'tiago', 'apóstolos']]
  };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 1, 'devia haver 1 grupo');
  assert.deepStrictEqual(groups[0].ids.slice().sort(), ['andre', 'pedro', 'tiago']);
  assert.strictEqual(groups[0].label, 'apóstolos', 'usa a etiqueta da aresta');
  console.log('ok: deriveGroups une componentes ligados com a etiqueta da aresta');
})();

// --- Caso 8: irmãos que já partilham progenitor no acontecimento NÃO formam
// grupo (a árvore já os põe lado a lado sob o mesmo pai) ---
(function () {
  const family = {
    casais: [['adao', 'eva']],
    filhos: [{ pais: ['adao', 'eva'], filho: 'caim' }, { pais: ['adao', 'eva'], filho: 'abel' }],
    irmaos: [['caim', 'abel', 'irmão/irmã']]
  };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 0, 'caim e abel já partilham pais → sem grupo/chaveta');
  console.log('ok: deriveGroups exclui irmãos que já partilham progenitor no evento');
})();

// --- Caso 9: afinidade sem progenitor comum forma grupo com a sua etiqueta ---
(function () {
  const family = { casais: [], filhos: [], irmaos: [['noemi', 'rute', 'sogra e nora']] };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].label, 'sogra e nora');
  console.log('ok: deriveGroups agrupa afinidade com a etiqueta real');
})();
```

- [ ] **Step 2: Correr os testes e ver que falham**

Run: `<node-dir>\node.exe scripts/test-event-graph.js`
Expected: FALHA com `TypeError: EventGraph.deriveGroups is not a function`.

- [ ] **Step 3: Implementar `deriveGroups`**

Em `js/event-graph.js`, imediatamente **a seguir** ao fecho de `deriveFamily` (a seguir à linha `}` que fecha essa função, antes de `function layoutEvent`), acrescentar:

```js
  // Transforma as arestas fracas (irmãos sem pai no evento, afinidade,
  // companheiros) em grupos rotulados. Exclui pares que já partilham
  // progenitor dentro do acontecimento — esses já ficam lado a lado sob o
  // mesmo pai na árvore, não precisam de chaveta. Cada grupo é um componente
  // ligado (≥2 membros); a etiqueta é a da primeira aresta do componente.
  function deriveGroups(family) {
    var parentKey = {};
    family.filhos.forEach(function (f) {
      parentKey[f.filho] = f.pais.slice().sort().join('|');
    });
    var adj = {};
    var labelOf = {};
    var order = [];
    family.irmaos.forEach(function (w) {
      var a = w[0], b = w[1], label = w[2];
      if (parentKey[a] && parentKey[b] && parentKey[a] === parentKey[b]) return;
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
      var key = [a, b].sort().join('|');
      if (labelOf[key] === undefined) { labelOf[key] = (label != null ? label : null); order.push(key); }
    });
    var seen = {}, groups = [];
    Object.keys(adj).forEach(function (start) {
      if (seen[start]) return;
      var stack = [start], comp = [];
      while (stack.length) {
        var n = stack.pop();
        if (seen[n]) continue;
        seen[n] = true; comp.push(n);
        (adj[n] || []).forEach(function (m) { if (!seen[m]) stack.push(m); });
      }
      if (comp.length < 2) return;
      var inComp = {}; comp.forEach(function (id) { inComp[id] = true; });
      var label = null;
      for (var i = 0; i < order.length; i++) {
        var pts = order[i].split('|');
        if (inComp[pts[0]] && inComp[pts[1]]) { label = labelOf[order[i]]; break; }
      }
      groups.push({ ids: comp, label: label });
    });
    return groups;
  }
```

E na linha do export, acrescentar `deriveGroups`:

```js
  var EventGraph = { deriveFamily: deriveFamily, deriveGroups: deriveGroups, layoutEvent: layoutEvent, render: render };
```

- [ ] **Step 4: Correr os testes e ver que passam**

Run: `<node-dir>\node.exe scripts/test-event-graph.js`
Expected: PASS, incluindo as 3 novas linhas `ok:` e o `ALL PASS` final.

- [ ] **Step 5: Commit**

```bash
git add js/event-graph.js scripts/test-event-graph.js
git commit -m "feat(event-graph): deriveGroups agrupa relacoes fracas em componentes rotulados"
```

---

### Task 2: `layoutEvent` — adjacência dos membros de um grupo fraco

Para uma chaveta abraçar um grupo sem saltar por cima de terceiros, os membros do grupo têm de ficar em **slots consecutivos**. Espelha a lógica que já existe para pôr cônjuges consecutivos na geração 0.

**Files:**
- Modify: `js/event-graph.js` (dentro de `layoutEvent`, o bloco de colocação da geração 0)
- Test: `scripts/test-event-graph.js`

**Interfaces:**
- Consumes: `deriveGroups(family)` (Task 1); `family.casais`.
- Produces: `layoutEvent(ids, family)` → `{gen, slot, maxGen}` (assinatura inalterada), agora com a garantia extra: membros de um mesmo grupo fraco que estejam na geração 0 recebem slots consecutivos.

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar ao fim de `scripts/test-event-graph.js`, antes de `console.log('\nALL PASS');`:

```js
// --- Caso 10: membros de um grupo fraco ficam em slots consecutivos ---
(function () {
  const ids = ['x', 'pedro', 'andre', 'tiago']; // x é ruído no meio da ordem
  const edges = [['pedro', 'andre', 'sibling', 'apóstolos'], ['andre', 'tiago', 'sibling', 'apóstolos']];
  const family = EventGraph.deriveFamily(ids, edges);
  const layout = EventGraph.layoutEvent(ids, family);
  const groupSlots = ['pedro', 'andre', 'tiago'].map(function (id) { return layout.slot[id]; }).sort(function (a, b) { return a - b; });
  assert.strictEqual(groupSlots[2] - groupSlots[0], 2, 'os 3 membros do grupo ocupam 3 slots contíguos');
  console.log('ok: layoutEvent mantém os membros de um grupo fraco consecutivos');
})();
```

- [ ] **Step 2: Correr o teste e ver que falha**

Run: `<node-dir>\node.exe scripts/test-event-graph.js`
Expected: FALHA na asserção do Caso 10 (`os 3 membros do grupo ocupam 3 slots contíguos`) — sem a nova lógica, `x` pode cair no meio dos slots do grupo.

- [ ] **Step 3: Implementar a adjacência de grupo**

Em `js/event-graph.js`, dentro de `layoutEvent`, **no início da função** (antes de `var parentOf = {};`) acrescentar o cálculo dos grupos:

```js
    var groups = deriveGroups(family);
    var groupOf = {};
    groups.forEach(function (g, gi) { g.ids.forEach(function (id) { groupOf[id] = gi; }); });
```

Depois, no bloco que coloca a geração 0 (o `ids.filter(...).forEach(...)` onde hoje se colocam os cônjuges consecutivos), acrescentar — **imediatamente a seguir** ao `family.casais.forEach(...)` que já lá está, ainda dentro do mesmo `forEach` de colocação — a colocação dos co-membros do grupo:

```js
      if (groupOf[id] !== undefined) {
        groups[groupOf[id]].ids.forEach(function (m) {
          if (!placed[m] && gen[m] === 0) { slot[m] = nextSlot++; placed[m] = true; }
        });
      }
```

- [ ] **Step 4: Correr os testes e ver que passam**

Run: `<node-dir>\node.exe scripts/test-event-graph.js`
Expected: PASS, incluindo `ok: layoutEvent mantém os membros de um grupo fraco consecutivos` e `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add js/event-graph.js scripts/test-event-graph.js
git commit -m "feat(event-graph): layoutEvent mantem membros de grupo fraco consecutivos"
```

---

### Task 3: `render` — roteamento ortogonal, rótulos e chavetas

Reescrita de `render`: descendência em ângulo reto (queda da união → barra horizontal → queda a cada filho), casamento como linha horizontal com ♥, relações fracas como chavetas rotuladas (deixa de haver linhas diagonais de irmãos/afinidade). É DOM — verifica-se em browser real (Task 5), não por teste unitário (o núcleo puro já ficou coberto nas Tasks 1-2).

**Files:**
- Modify: `js/event-graph.js` (substituir toda a função `render`)

**Interfaces:**
- Consumes: `deriveFamily`, `layoutEvent`, `deriveGroups`, `measureTextWidth`, `prefersReduce`, `SVG_NS`. Assinatura pública inalterada: `render(charLinesEl, charButtonsEl, ids, defs, edges, onCharClick)`; devolve `family` (como hoje — `app.js` não usa o retorno, mas mantém-se por compatibilidade).
- Produces: no `charLinesEl` (SVG) só `<line class="cline">` (segmentos verticais/horizontais + a linha `casamento`); no `charButtonsEl` (div): `.marriage-mark` (♥), `.rel-label` (rótulo de descendência), `.group-brace` + `.group-label` (chavetas), e os `.char` (orbes). Nenhum orbe tem já animação `floatChar` no atributo `animationDelay`.

- [ ] **Step 1: Substituir a função `render`**

Em `js/event-graph.js`, substituir a função `render` inteira (de `function render(charLinesEl, ...` até ao seu `}` final, **sem** tocar no comentário-cabeçalho acima dela nem no export abaixo) por:

```js
  function render(charLinesEl, charButtonsEl, ids, defs, edges, onCharClick) {
    charLinesEl.innerHTML = '';
    charButtonsEl.innerHTML = '';
    var family = deriveFamily(ids, edges);
    var layout = layoutEvent(ids, family);
    var groups = deriveGroups(family);
    var slots = ids.map(function (id) { return layout.slot[id]; });
    var minSlot = Math.min.apply(null, slots), maxSlot = Math.max.apply(null, slots);
    var containerW = charButtonsEl.getBoundingClientRect().width || 800;

    // Largura de coluna por fila — cada geração dimensiona-se pelo seu nome
    // mais largo (medido a sério), para nenhum nome ser cortado.
    var rowIds = {};
    ids.forEach(function (id) { (rowIds[layout.gen[id]] = rowIds[layout.gen[id]] || []).push(id); });
    var rowColWidthPct = {};
    Object.keys(rowIds).forEach(function (g) {
      var maxLabelPx = 0;
      rowIds[g].forEach(function (id) {
        var w = measureTextWidth((defs[id] && defs[id].nome) || '');
        if (w > maxLabelPx) maxLabelPx = w;
      });
      var neededPx = Math.max(64, maxLabelPx * 1.1 + 10);
      rowColWidthPct[g] = Math.min(28, Math.max(9, neededPx / containerW * 100));
    });

    // Entrada por geração (pais primeiro), esquerda→direita dentro da geração.
    var enterDelay = {};
    var reduce = prefersReduce();
    Object.keys(rowIds).forEach(function (g) {
      var ordered = rowIds[g].slice().sort(function (a, b) { return layout.slot[a] - layout.slot[b]; });
      ordered.forEach(function (id, i) { enterDelay[id] = reduce ? 0 : (parseInt(g, 10) * 120 + i * 40); });
    });

    var rowHeightPct = layout.maxGen > 0 ? Math.min(30, 64 / (layout.maxGen + 1)) : 0;
    var topPct = layout.maxGen > 0 ? 18 : 50;
    var positions = {};
    ids.forEach(function (id) {
      var cw = rowColWidthPct[layout.gen[id]];
      positions[id] = {
        x: 50 + (layout.slot[id] - (minSlot + maxSlot) / 2) * cw,
        y: topPct + layout.gen[id] * rowHeightPct
      };
    });

    function drawSeg(x1, y1, x2, y2, cls, gen) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', x1 + '%'); line.setAttribute('y1', y1 + '%');
      line.setAttribute('x2', x2 + '%'); line.setAttribute('y2', y2 + '%');
      line.setAttribute('class', 'cline' + (cls ? ' ' + cls : ''));
      if (gen != null) line.setAttribute('data-gen', gen);
      charLinesEl.appendChild(line);
    }
    function addLabel(xPct, yPct, text, cls) {
      var el = document.createElement('div');
      el.className = cls;
      el.style.left = xPct + '%'; el.style.top = yPct + '%';
      el.textContent = text;
      charButtonsEl.appendChild(el);
    }

    // Casamento: linha horizontal direta com ♥ a meio; o ponto médio é a
    // origem de onde a descendência arranca.
    var unions = {};
    family.casais.forEach(function (pair) {
      var a = positions[pair[0]], b = positions[pair[1]];
      if (!a || !b) return;
      var key = pair.slice().sort().join('|');
      var ux = (a.x + b.x) / 2, uy = (a.y + b.y) / 2;
      unions[key] = { x: ux, y: uy };
      drawSeg(a.x, a.y, b.x, b.y, 'casamento', layout.gen[pair[0]]);
      var mark = document.createElement('div');
      mark.className = 'marriage-mark';
      mark.style.left = ux + '%'; mark.style.top = uy + '%';
      mark.innerHTML = '♥';
      charButtonsEl.appendChild(mark);
    });

    // Descendência em ângulo reto, agrupada por unidade (casal ou progenitor
    // único): queda vertical da origem → barra horizontal → queda a cada filho.
    var byUnit = {};
    family.filhos.forEach(function (f) {
      var key = f.pais.length === 2 ? ('u:' + f.pais.slice().sort().join('|')) : ('s:' + f.pais[0]);
      (byUnit[key] = byUnit[key] || { pais: f.pais, filhos: [] }).filhos.push(f.filho);
    });
    Object.keys(byUnit).forEach(function (key) {
      var unit = byUnit[key];
      var source;
      if (unit.pais.length === 2) {
        source = unions[unit.pais.slice().sort().join('|')];
        if (!source) {
          var pa = positions[unit.pais[0]], pb = positions[unit.pais[1]];
          if (!pa || !pb) return;
          source = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
        }
      } else {
        source = positions[unit.pais[0]];
      }
      if (!source) return;
      var kids = unit.filhos.map(function (id) { return positions[id]; }).filter(Boolean);
      if (!kids.length) return;
      var gen = layout.gen[unit.filhos[0]];
      var childY = kids[0].y;
      var busY = source.y + (childY - source.y) * 0.5;
      var kidXs = kids.map(function (p) { return p.x; });
      var minX = Math.min.apply(null, kidXs), maxX = Math.max.apply(null, kidXs);
      drawSeg(source.x, source.y, source.x, busY, '', gen);
      drawSeg(Math.min(minX, source.x), busY, Math.max(maxX, source.x), busY, '', gen);
      kids.forEach(function (p) { drawSeg(p.x, busY, p.x, p.y, '', gen); });
      addLabel(source.x, busY, unit.pais.length === 2 ? 'pais de' : 'pai/mãe de', 'rel-label');
    });

    // Relações fracas: chaveta rotulada, sem linhas a cruzar.
    groups.forEach(function (g) {
      var pts = g.ids.map(function (id) { return positions[id]; }).filter(Boolean);
      if (pts.length < 2) return;
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var gMinX = Math.min.apply(null, xs), gMaxX = Math.max.apply(null, xs);
      var gy = Math.max.apply(null, ys);
      var brace = document.createElement('div');
      brace.className = 'group-brace';
      brace.style.left = gMinX + '%'; brace.style.width = (gMaxX - gMinX) + '%'; brace.style.top = gy + '%';
      charButtonsEl.appendChild(brace);
      if (g.label) addLabel((gMinX + gMaxX) / 2, gy, g.label, 'group-label');
    });

    // Orbes — só entrada suave, sem flutuação perpétua (floatChar removido).
    ids.forEach(function (id) {
      var d = defs[id];
      var btn = document.createElement('button');
      btn.className = 'char';
      btn.setAttribute('data-char-id', id);
      btn.style.left = positions[id].x + '%';
      btn.style.top = positions[id].y + '%';
      btn.style.animationDelay = enterDelay[id] + 'ms';
      var portrait = d.retrato
        ? '<img src="' + d.retrato + '" alt="" draggable="false">'
        : '';
      btn.innerHTML = '<span class="char-orb">' + portrait + '</span><span class="char-label">' + d.nome + '</span>';
      btn.addEventListener('click', function () { onCharClick(id); });
      charButtonsEl.appendChild(btn);
    });

    // Traçar as linhas progressivamente, por geração. Desligado sob
    // prefers-reduced-motion.
    if (!reduce) {
      var lineEls = charLinesEl.querySelectorAll('.cline');
      Array.prototype.forEach.call(lineEls, function (ln) {
        var L = ln.getTotalLength();
        ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L; ln.style.transition = 'none';
      });
      charLinesEl.getBoundingClientRect();
      Array.prototype.forEach.call(lineEls, function (ln) {
        var g = parseInt(ln.getAttribute('data-gen') || '0', 10);
        var delay = g * 120 + 120;
        ln.style.transition = 'stroke-dashoffset .5s ease ' + delay + 'ms';
        ln.style.strokeDashoffset = '0';
        ln.addEventListener('transitionend', function () {
          ln.style.strokeDasharray = ''; ln.style.strokeDashoffset = ''; ln.style.transition = '';
        }, { once: true });
      });
    }

    return family;
  }
```

- [ ] **Step 2: Verificar que os testes puros continuam a passar**

Run: `<node-dir>\node.exe scripts/test-event-graph.js`
Expected: PASS (a reescrita de `render` não toca no núcleo puro; `ALL PASS`).

- [ ] **Step 3: Commit**

```bash
git add js/event-graph.js
git commit -m "feat(event-graph): render em organograma ortogonal com rotulos e chavetas"
```

---

### Task 4: CSS — linhas ortogonais, rótulos, chavetas; remover flutuação

**Files:**
- Modify: `style.css` (linhas 124-146 aproximadamente; remover `floatChar` do `.char`; acrescentar `.rel-label`, `.group-brace`, `.group-label`; remover `.union-node` morto)

**Interfaces:**
- Consumes: as classes emitidas pela Task 3 (`.cline`, `.cline.casamento`, `.marriage-mark`, `.rel-label`, `.group-brace`, `.group-label`, `.char`).
- Produces: aspeto final estático do organograma.

- [ ] **Step 1: Ajustar as linhas e remover a linha tracejada de irmãos**

Em `style.css`, substituir o bloco atual das linhas (as três regras `.cline`, `.cline.casamento`, `.cline.weak`) por:

```css
.cline { stroke: var(--lavender); stroke-width: 1.6; opacity: .75; stroke-linecap: round; }
.cline.casamento { stroke: var(--pink); opacity: .85; stroke-width: 1.6; }
```

(A regra `.cline.weak` deixa de ser usada — as relações fracas passaram a chavetas — e é removida. O casamento deixa de ser tracejado: é uma linha sólida com o ♥ a marcar o significado.)

- [ ] **Step 2: Remover o `.union-node` morto e acrescentar rótulos e chavetas**

Em `style.css`, remover por completo a regra `.union-node { ... }` (losango, já não é criada desde 2026-09-09) e, a seguir a `.marriage-mark`, acrescentar:

```css
.rel-label { position: absolute; transform: translate(-50%, -50%); font-family: var(--font-ui); font-size: 10.5px; font-weight: 600; letter-spacing: .06em; color: var(--ink-dim); background: rgba(20,23,46,.72); padding: 1px 6px; border-radius: 999px; white-space: nowrap; pointer-events: none; z-index: 1; }
.group-brace { position: absolute; height: 10px; border-top: 1.6px solid var(--lavender); border-left: 1.6px solid var(--lavender); border-right: 1.6px solid var(--lavender); border-radius: 6px 6px 0 0; opacity: .55; transform: translateY(46px); pointer-events: none; }
.group-label { position: absolute; transform: translate(-50%, 60px); font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: .06em; color: var(--gold-soft); background: rgba(20,23,46,.72); padding: 1px 7px; border-radius: 999px; white-space: nowrap; pointer-events: none; z-index: 1; }
```

(A chaveta é um `⊓` invertido — barra por cima com as pontas a descer — colocado por baixo dos orbes+nome via `translateY(46px)`; o rótulo fica logo abaixo. `border-top` + `border-left/right` com `border-radius` no topo desenham o `⊓`.)

- [ ] **Step 3: Remover a flutuação perpétua dos orbes**

Em `style.css`, na regra `.char`, mudar a propriedade `animation` para deixar só a entrada:

```css
.char { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; background: none; border: none; color: inherit; transform: translate(-50%, -50%); animation: charEnter .55s cubic-bezier(.34, 1.56, .64, 1) both; }
```

E remover o `@keyframes floatChar { ... }` (deixa de ser referenciado).

- [ ] **Step 4: Verificação visual rápida (servir + olhar)**

Servir a pasta por `http://` (skill `run` ou servidor estático) e abrir um acontecimento com descendência (ex.: `origens`). Confirmar a olho: linhas em ângulo reto, ♥ entre o casal, rótulo "pais de", orbes quietos depois de entrarem. (A verificação rigorosa por CDP é a Task 5.)

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "style: organograma ortogonal, rotulos e chavetas; remover flutuacao dos orbes"
```

---

### Task 5: Verificação em browser real (CDP) + auditoria + testes

Fecho da ronda: confirmar os critérios de aceitação da spec num browser real com eventos reais, mais os testes automáticos e a auditoria geométrica.

**Files:**
- Nenhum ficheiro de produto alterado (só verificação). Correções que surjam voltam à task respetiva.

- [ ] **Step 1: Testes unitários**

Run: `<node-dir>\node.exe scripts/test-event-graph.js`
Expected: `ALL PASS` (Casos 1-10).

- [ ] **Step 2: Auditoria geométrica de retratos**

Run: `<node-dir>\node.exe scripts/geometry-audit.js assets/retratos`
Expected: ~243 pares (esperado por design; não é regressão).

- [ ] **Step 3: Verificação por CDP com eventos reais**

Servir por `http://`, abrir Chrome `--headless=new --remote-debugging-port=<porta>` (CDP `/json/new` via **PUT**), e para cada acontecimento medir posições reais das `.cline`/orbes:

- `origens` (Adão♥Eva → Caim/Abel/Set): queda vertical do ♥ → barra "pais de" → uma queda vertical a cada filho; **nenhum** segmento diagonal (todo `x1≈x2` **ou** `y1≈y2`, tolerância ~1px); nenhuma linha cruza outra.
- `saul_david_ev`: cada casal adjacente, ♥ entre eles na horizontal; sem linhas a cruzar; desvio orbe-âncora = 0 (linhas entram no meio do orbe).
- Um acontecimento com afinidade (Noemi/Rute) ou irmãos sem pai (filhos de Jacob): grupo lado a lado sob chaveta com rótulo, **sem** `.cline` a ligar esses orbes.
- Acontecimento dos 12 apóstolos: navegável por arrasto/zoom, sem sobreposição de nomes; grupo sob rótulo se houver arestas entre eles.

Verificação de "sem diagonais" (script CDP): para cada `<line class="cline">` que **não** seja `.casamento`, confirmar `abs(x1-x2) < 1 || abs(y1-y2) < 1` em coordenadas de ecrã.

- [ ] **Step 4: Revisão independente + registo**

Despachar um subagent revisor (`opus`) sobre a branch inteira (cumprimento da spec + qualidade). Corrigir o que aparecer na task respetiva. Depois, seguir o fluxo `superpowers:finishing-a-development-branch` para merge em `master`, e atualizar `handover.md` + memória do projeto.

---

## Limitações aceites (registar no handover)

- **Rótulo de descendência de progenitor único = `"pai/mãe de"`** (o ficheiro de dados não tem campo de sexo; inferir sexo de um nome é proibido por regra do projeto). A Isabel valida a redação na verificação; se preferir, troca-se por `"pais de"` universal — mudança de uma string.
- **Casais em gerações > 0** (uma pessoa que é filha *dentro* do acontecimento e também casada lá — muito raro neste elenco) podem não ficar perfeitamente adjacentes; a linha de casamento continua a ligar os dois, mas pode não ser perfeitamente horizontal. Aceite; só se corrige se algum acontecimento real o exibir.
- **Grupos fracos com membros em gerações diferentes**: a chaveta abrange o intervalo horizontal do grupo à altura da fila mais baixa; pode ficar ligeiramente desalinhada se o grupo cruzar gerações. Raro; aceite.
- **Filas muito largas (12 apóstolos)** continuam a poder estender-se para além do contentor e a sobrepor os controlos de zoom — resto visual já conhecido (handover item 23), fora do âmbito desta ronda.
