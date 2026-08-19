# Redesenho da Navegação (Sub-projeto A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single flat 97-node SVG map with a two-layer navigation: a "path" screen (one stop per `era`, in narrative order) and, inside each era, a focused cluster view — a computed genealogy tree for family-connected characters, a grid for everyone else. Add a search bar. No content changes.

**Architecture:** Split the growing `app.js` into four files with one responsibility each: `js/layout.js` (pure position-computation functions, no DOM), `js/render-path.js` (draws the path screen), `js/render-cluster.js` (draws one era's cluster, using `layout.js`), and `app.js` (fetches data, holds navigation state, wires up search/back/card panel, calls the renderers). All four are loaded as plain `<script>` tags (no bundler, no external libraries — same constraint as every prior round), and expose their functions on `window.Layout` / `window.RenderPath` / `window.RenderCluster` to avoid global collisions.

**Tech Stack:** Static HTML/CSS/JS, no dependencies.

**Spec:** `docs/superpowers/specs/2026-08-19-redesign-navegacao-design.md`

## Global Constraints

- No external libraries or build step — plain `<script>` tags, same as the rest of the site.
- No content changes — same 97 characters, same `resumo`/`contexto`/`relacoes`/`retrato`. Only `data/personagens.json`'s top-level structure gains one new field (`eras`); no `personagens[]` entry is touched.
- `x`/`y` fields on each character remain in the JSON untouched (do not remove them — out of scope, minimizes diff) but are no longer read by the renderer. `layout.width`/`layout.height` also stop being read by the renderer (positions are now computed, not fixed to one canvas size).
- Every new SVG-drawing function follows the existing element-creation pattern already used in `app.js` (an `el(tag, attrs)` helper building `document.createElementNS` elements) — do not introduce a different DOM-building style.
- Portrait/icon fallback behavior (broken `retrato` → fall back to the type icon, broken icon → fall back to `povo` icon) must be preserved exactly as it exists today.
- Keep the existing pan/zoom/drag behavior (mouse and touch), just re-scoped to whatever view is currently rendered instead of a fixed canvas size.

---

### Task 1: Add the `eras` list to `data/personagens.json`

**Files:**
- Modify: `data/personagens.json`

**Interfaces:**
- Produces: a top-level `eras` array, `[{ "nome": string, "descricao": string }, ...]`, in narrative order — this is the ordered source of truth the path screen iterates over in Task 3.

- [ ] **Step 1: Add the `eras` array**

At the top of `data/personagens.json`, right after the `"layout": { ... },` line, insert this exact array (33 entries, in this exact order — it matches the order `era` values already appear in `personagens[]`):

```json
  "eras": [
    { "nome": "As origens", "descricao": "Adão e Eva, o início da humanidade." },
    { "nome": "Primeira geração", "descricao": "Caim, Abel e Set, os primeiros filhos." },
    { "nome": "O Dilúvio", "descricao": "Noé e a arca." },
    { "nome": "Depois do Dilúvio", "descricao": "Os descendentes de Noé." },
    { "nome": "Os Patriarcas · Abraão", "descricao": "Abraão, Sara e a primeira aliança." },
    { "nome": "Os Patriarcas · Isaac", "descricao": "Isaac, Rebeca e os gémeos Esaú e Jacob." },
    { "nome": "Os Patriarcas · Jacob", "descricao": "Jacob, Raquel e Lia." },
    { "nome": "As famílias de Jacob", "descricao": "Os doze filhos de Jacob e Dina." },
    { "nome": "José no Egito", "descricao": "José, vendido pelos irmãos, torna-se governador do Egito." },
    { "nome": "O Êxodo", "descricao": "Moisés liberta o povo da escravidão no Egito." },
    { "nome": "Josué", "descricao": "Josué conquista a Terra Prometida." },
    { "nome": "Os Juízes", "descricao": "Líderes que guiam Israel antes dos reis." },
    { "nome": "Rute", "descricao": "Rute e Booz, uma história de lealdade." },
    { "nome": "1 Samuel · Ana e Samuel", "descricao": "Ana e o nascimento do profeta Samuel." },
    { "nome": "1 Samuel · Saul e David", "descricao": "O primeiro rei de Israel e a ascensão de David." },
    { "nome": "2 Samuel · O reinado de David", "descricao": "David rei, com vitórias e falhas." },
    { "nome": "1 Reis · Salomão", "descricao": "Salomão e a sabedoria." },
    { "nome": "1-2 Reis · O reino dividido", "descricao": "Israel e Judá divididos; os profetas Elias e Eliseu." },
    { "nome": "Isaías", "descricao": "O profeta Isaías e os reis Acaz, Uzias, Senaqueribe." },
    { "nome": "Jeremias", "descricao": "O profeta que testemunha a queda de Jerusalém." },
    { "nome": "Oséias", "descricao": "O profeta cujo casamento se torna sinal profético." },
    { "nome": "Amós", "descricao": "O pastor que denuncia a injustiça social." },
    { "nome": "Ezequiel", "descricao": "O profeta do exílio e das grandes visões." },
    { "nome": "Jonas", "descricao": "O profeta engolido por um grande peixe." },
    { "nome": "Miqueias", "descricao": "O profeta que anuncia Belém." },
    { "nome": "Naum", "descricao": "O anúncio da queda de Nínive." },
    { "nome": "Habacuc", "descricao": "O profeta que questiona Deus." },
    { "nome": "Sofonias", "descricao": "O Dia do Senhor, e a alegria final." },
    { "nome": "Ageu", "descricao": "O incentivo a reconstruir o Templo." },
    { "nome": "Zacarias", "descricao": "Visões da reconstrução e do rei humilde." },
    { "nome": "Malaquias", "descricao": "O último profeta antes do silêncio." },
    { "nome": "Joel", "descricao": "A praga de gafanhotos e o Espírito derramado." },
    { "nome": "Abdias", "descricao": "O livro mais curto, contra Edom." }
  ],
```

- [ ] **Step 2: Validate**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"` — expect `valid`.

Run this check and confirm the exact output:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json','utf8'));
const eraNames = new Set(d.eras.map(e => e.nome));
console.log('eras count:', d.eras.length);
const personagemEras = new Set(d.personagens.map(p => p.era));
let missing = [];
personagemEras.forEach(e => { if (!eraNames.has(e)) missing.push(e); });
console.log('personagem eras not covered by eras[]:', JSON.stringify(missing));
let unused = [];
eraNames.forEach(e => { if (!personagemEras.has(e)) unused.push(e); });
console.log('eras[] entries with 0 personagens:', JSON.stringify(unused));
"
```
Expected: `eras count: 33`, `personagem eras not covered by eras[]: []`, `eras[] entries with 0 personagens: []`. If either list is non-empty, find the mismatch (likely a typo in a `nome` — copy it character-for-character from the count query below) and fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add data/personagens.json
git commit -m "feat: add eras[] list for the navigation redesign"
```

**Report:** include the Step 2 output verbatim.

---

### Task 2: Create `js/layout.js` (pure layout computation) with a test script

**Files:**
- Create: `js/layout.js`
- Create: `scripts/test-layout.js`

**Interfaces:**
- Produces: `window.Layout = { TIER_RADIUS, computeTreeLayout(nodes, edges), computeGridLayout(nodes) }`. `computeTreeLayout` returns `{ [id]: {x, y} }` for every node reachable via at least one edge in `edges` where both endpoints are in `nodes`; nodes with no such edge are simply absent from the returned object (the caller — Task 3's `render-cluster.js` — routes those to `computeGridLayout`). `computeGridLayout` returns `{ [id]: {x, y} }` for every node passed to it.
- Consumes: nothing — this file has no dependency on any other new file. `scripts/test-layout.js` runs under plain Node (`require('../js/layout.js')` won't work as-is since the file uses `window` — see Step 1's note on dual-environment export).

- [ ] **Step 1: Create `js/layout.js`**

Use this exact content. Note the last two lines: this file is loaded both by the browser (via `<script>`, where `window` exists) and by the Node test script in Step 2 (where it doesn't) — the `typeof module` guard makes both work without any build step.

```javascript
(function () {
  var TIER_RADIUS = { major: 26, standard: 18, minor: 12 };
  var ROW_HEIGHT = 130;
  var COL_SPACING_TREE = 110;
  var GRID_COL_SPACING = 100;
  var GRID_ROW_HEIGHT = 110;
  var TOP_MARGIN = 60;

  function UnionFind(ids) {
    var parent = {};
    ids.forEach(function (id) { parent[id] = id; });
    this.find = function (id) {
      while (parent[id] !== id) { parent[id] = parent[parent[id]]; id = parent[id]; }
      return id;
    };
    this.union = function (a, b) {
      var ra = this.find(a), rb = this.find(b);
      if (ra !== rb) parent[ra] = rb;
    };
  }

  // Genealogy-tree layout for characters connected by "internal" edges
  // (both endpoints present in `nodes`). Returns {id: {x, y}} only for
  // characters reachable via at least one such edge — the caller routes
  // everyone else to computeGridLayout.
  function computeTreeLayout(nodes, edges) {
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    var parentsOf = {};
    var siblingGroups = new UnionFind(nodes.map(function (n) { return n.id; }));
    var connected = new Set();

    edges.forEach(function (e) {
      var a = e[0], b = e[1], type = e[2];
      if (!byId[a] || !byId[b]) return;
      connected.add(a); connected.add(b);
      if (type === 'parent' || type === 'descendant') {
        parentsOf[b] = parentsOf[b] || [];
        parentsOf[b].push(a);
      } else if (type === 'spouse') {
        siblingGroups.union(a, b);
      } else if (type === 'sibling') {
        siblingGroups.union(a, b);
      }
    });

    if (connected.size === 0) return {};

    var level = {};
    connected.forEach(function (id) { level[id] = 0; });
    for (var pass = 0; pass < connected.size + 1; pass++) {
      var changed = false;
      connected.forEach(function (id) {
        (parentsOf[id] || []).forEach(function (p) {
          if (connected.has(p) && level[p] + 1 > level[id]) {
            level[id] = level[p] + 1;
            changed = true;
          }
        });
      });
      if (!changed) break;
    }

    var groupMaxLevel = {};
    connected.forEach(function (id) {
      var root = siblingGroups.find(id);
      groupMaxLevel[root] = Math.max(groupMaxLevel[root] === undefined ? -Infinity : groupMaxLevel[root], level[id]);
    });
    connected.forEach(function (id) { level[id] = groupMaxLevel[siblingGroups.find(id)]; });

    var rows = {};
    nodes.forEach(function (n) {
      if (!connected.has(n.id)) return;
      var lvl = level[n.id];
      rows[lvl] = rows[lvl] || [];
      rows[lvl].push(n.id);
    });

    var positions = {};
    Object.keys(rows).forEach(function (lvlKey) {
      var ids = rows[lvlKey];
      var lvl = Number(lvlKey);
      var totalWidth = (ids.length - 1) * COL_SPACING_TREE;
      var startX = -totalWidth / 2;
      ids.forEach(function (id, i) {
        positions[id] = { x: startX + i * COL_SPACING_TREE, y: TOP_MARGIN + lvl * ROW_HEIGHT };
      });
    });
    return positions;
  }

  // Simple grid, sorted so major-tier characters land first (top-left).
  function computeGridLayout(nodes) {
    var order = { major: 0, standard: 1, minor: 2 };
    var sorted = nodes.slice().sort(function (a, b) {
      return (order[a.tier] === undefined ? 3 : order[a.tier]) - (order[b.tier] === undefined ? 3 : order[b.tier]);
    });
    var cols = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));
    var positions = {};
    sorted.forEach(function (n, i) {
      var col = i % cols, row = Math.floor(i / cols);
      positions[n.id] = { x: col * GRID_COL_SPACING, y: row * GRID_ROW_HEIGHT };
    });
    return positions;
  }

  var Layout = {
    TIER_RADIUS: TIER_RADIUS,
    computeTreeLayout: computeTreeLayout,
    computeGridLayout: computeGridLayout
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Layout;
  } else {
    window.Layout = Layout;
  }
})();
```

- [ ] **Step 2: Create `scripts/test-layout.js`**

```javascript
// Plain-Node assertion script for js/layout.js (no test framework in this repo).
// Run: node scripts/test-layout.js
const Layout = require('../js/layout.js');

let failures = 0;
function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('FAIL:', msg, '\n  expected:', JSON.stringify(expected), '\n  actual:  ', JSON.stringify(actual));
    failures++;
  } else {
    console.log('ok:', msg);
  }
}
function assertTrue(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); failures++; }
  else { console.log('ok:', msg); }
}

// --- computeTreeLayout: simple 2-generation tree ---
// abraao -> isaac (parent), abraao spouse sara, isaac spouse rebeca (rebeca not in this set)
const nodes1 = [
  { id: 'abraao', tier: 'major' },
  { id: 'sara', tier: 'major' },
  { id: 'isaac', tier: 'major' }
];
const edges1 = [
  ['abraao', 'isaac', 'parent'],
  ['abraao', 'sara', 'spouse']
];
const pos1 = Layout.computeTreeLayout(nodes1, edges1);
assertTrue('abraao' in pos1 && 'sara' in pos1 && 'isaac' in pos1, 'all 3 nodes placed');
assertEqual(pos1.abraao.y, pos1.sara.y, 'spouses share the same row (y)');
assertTrue(pos1.isaac.y > pos1.abraao.y, 'child is on a lower row than parent (larger y)');
assertTrue(pos1.abraao.x !== pos1.sara.x, 'spouses do not share the same x');

// --- computeTreeLayout: node with no internal edge is excluded ---
const nodes2 = [{ id: 'a', tier: 'minor' }, { id: 'b', tier: 'minor' }, { id: 'c', tier: 'minor' }];
const edges2 = [['a', 'b', 'parent']];
const pos2 = Layout.computeTreeLayout(nodes2, edges2);
assertTrue('a' in pos2 && 'b' in pos2, 'connected nodes placed');
assertTrue(!('c' in pos2), 'unconnected node is absent from tree layout');

// --- computeTreeLayout: empty edges returns empty object ---
assertEqual(Layout.computeTreeLayout(nodes2, []), {}, 'no internal edges -> empty tree');

// --- computeTreeLayout: siblings share a row even with no shared parent in-set ---
const nodes3 = [{ id: 'x', tier: 'minor' }, { id: 'y', tier: 'minor' }];
const edges3 = [['x', 'y', 'sibling']];
const pos3 = Layout.computeTreeLayout(nodes3, edges3);
assertEqual(pos3.x.y, pos3.y.y, 'siblings share the same row (y)');

// --- computeGridLayout: major tier sorts first ---
const gridNodes = [
  { id: 'm1', tier: 'minor' },
  { id: 'maj1', tier: 'major' },
  { id: 's1', tier: 'standard' }
];
const gridPos = Layout.computeGridLayout(gridNodes);
assertTrue(Object.keys(gridPos).length === 3, 'all grid nodes placed');
assertTrue(gridPos.maj1.y <= gridPos.m1.y, 'major-tier lands at or before minor-tier (row order)');

console.log(failures === 0 ? '\nALL PASS' : '\n' + failures + ' FAILURE(S)');
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 3: Run the test script**

Run: `node scripts/test-layout.js`
Expected: every line prints `ok: ...`, ending with `ALL PASS` and exit code 0. If anything prints `FAIL`, fix `js/layout.js` (not the test) unless the test itself is wrong — re-read the assertion and the algorithm carefully before changing either.

- [ ] **Step 4: Commit**

```bash
git add js/layout.js scripts/test-layout.js
git commit -m "feat: add layout.js (genealogy tree + grid layout algorithms) with tests"
```

**Report:** paste the full Step 3 output.

---

### Task 3: Create `js/render-path.js` and `js/render-cluster.js`

**Files:**
- Create: `js/render-path.js`
- Create: `js/render-cluster.js`

**Interfaces:**
- Consumes: `window.Layout` from Task 2 (`js/render-cluster.js` calls `Layout.computeTreeLayout`, `Layout.computeGridLayout`, `Layout.TIER_RADIUS`).
- Produces: `window.RenderPath = { renderPath(eras, edgeLayer, nodeLayer, onSelectEra) }` returning `{width, height}`. `window.RenderCluster = { renderCluster(eraNome, personagens, edges, defsLayer, edgeLayer, nodeLayer, onSelectCharacter) }` returning `{width, height, edgeEls, nodeEls}` — `edgeEls` is an array of the drawn `<line>`/`<text>` elements, `nodeEls` is `{[id]: <g> element}`, both in the exact shape Task 4's `app.js` needs to reuse the existing dim/highlight-on-select behavior.

- [ ] **Step 1: Create `js/render-path.js`**

```javascript
(function () {
  var svgns = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  var STATION_R = { big: 26, small: 16 };
  var STEP_X = 150;
  var AMPLITUDE = 90;

  // Draws the era path/hub screen into the given <g> layers (the same
  // #edges/#nodes groups the cluster view uses). `eras` is
  // [{nome, descricao, count}, ...] in narrative order.
  function renderPath(eras, edgeLayer, nodeLayer, onSelectEra) {
    edgeLayer.innerHTML = '';
    nodeLayer.innerHTML = '';

    var points = eras.map(function (era, i) {
      return { era: era, x: 80 + i * STEP_X, y: 200 + Math.sin(i * 0.9) * AMPLITUDE };
    });

    if (points.length) {
      var d = 'M ' + points.map(function (p) { return p.x + ' ' + p.y; }).join(' L ');
      edgeLayer.appendChild(el('path', { d: d, class: 'path-line', fill: 'none' }));
    }

    points.forEach(function (p) {
      var r = p.era.count >= 6 ? STATION_R.big : STATION_R.small;
      var g = el('g', { class: 'station', tabindex: '0', role: 'button', 'aria-label': p.era.nome + ', ' + p.era.count + ' personagens' });
      g.appendChild(el('circle', { class: 'station-circle', cx: p.x, cy: p.y, r: r }));
      var count = el('text', { class: 'station-count', x: p.x, y: p.y + 4, 'text-anchor': 'middle' });
      count.textContent = p.era.count;
      g.appendChild(count);
      var label = el('text', { class: 'station-label', x: p.x, y: p.y + r + 16, 'text-anchor': 'middle' });
      label.textContent = p.era.nome;
      g.appendChild(label);
      g.addEventListener('click', function () { onSelectEra(p.era.nome); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelectEra(p.era.nome); }
      });
      nodeLayer.appendChild(g);
    });

    var lastX = points.length ? points[points.length - 1].x : 200;
    return { width: lastX + 160, height: 200 + AMPLITUDE * 2 + 80 };
  }

  window.RenderPath = { renderPath: renderPath };
})();
```

- [ ] **Step 2: Create `js/render-cluster.js`**

```javascript
(function () {
  var svgns = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function iconHref(tipo) { return "assets/icons/" + tipo + ".svg"; }

  // Draws one era's cluster: a genealogy tree for characters linked by
  // edges internal to this era, plus a grid below it for everyone else.
  function renderCluster(eraNome, personagens, edges, defsLayer, edgeLayer, nodeLayer, onSelectCharacter) {
    edgeLayer.innerHTML = '';
    nodeLayer.innerHTML = '';
    defsLayer.innerHTML = '';

    var chars = personagens.filter(function (p) { return p.era === eraNome; });
    var ids = new Set(chars.map(function (c) { return c.id; }));
    var internalEdges = edges.filter(function (e) { return ids.has(e[0]) && ids.has(e[1]); });

    var treePositions = Layout.computeTreeLayout(chars, internalEdges);
    var unconnected = chars.filter(function (c) { return !(c.id in treePositions); });
    var gridPositions = Layout.computeGridLayout(unconnected);

    var treeMaxY = 0;
    Object.keys(treePositions).forEach(function (id) { treeMaxY = Math.max(treeMaxY, treePositions[id].y); });
    var gridOffsetY = Object.keys(treePositions).length ? treeMaxY + 150 : 60;

    var positions = {};
    Object.keys(treePositions).forEach(function (id) { positions[id] = { x: treePositions[id].x, y: treePositions[id].y }; });
    Object.keys(gridPositions).forEach(function (id) { positions[id] = { x: gridPositions[id].x, y: gridPositions[id].y + gridOffsetY }; });

    var xs = Object.keys(positions).map(function (id) { return positions[id].x; });
    var minX = xs.length ? Math.min.apply(null, xs) : 0;
    var shiftX = -minX + 80;
    Object.keys(positions).forEach(function (id) { positions[id].x += shiftX; positions[id].y += 60; });

    var edgeEls = [];
    internalEdges.forEach(function (e) {
      var a = positions[e[0]], b = positions[e[1]], type = e[2];
      if (!a || !b) return;
      var line = el('line', { class: 'edge edge-' + type, x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'data-a': e[0], 'data-b': e[1] });
      edgeLayer.appendChild(line);
      edgeEls.push(line);
      if (e[3]) {
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var label = el('text', { class: 'edge-label', x: mx, y: my - 5, 'text-anchor': 'middle', 'data-a': e[0], 'data-b': e[1] });
        label.textContent = e[3];
        edgeLayer.appendChild(label);
        edgeEls.push(label);
      }
    });

    var nodeEls = {};
    chars.forEach(function (n) {
      var pos = positions[n.id];
      var r = Layout.TIER_RADIUS[n.tier] || Layout.TIER_RADIUS.standard;
      var g = el('g', { class: 'node tier-' + n.tier, tabindex: '0', role: 'button', 'aria-label': n.nome });
      g.appendChild(el('circle', { class: 'halo', cx: pos.x, cy: pos.y, r: r + 7 }));
      g.appendChild(el('circle', { class: 'medallion', cx: pos.x, cy: pos.y, r: r }));

      if (n.retrato) {
        var clipId = 'clip-' + n.id;
        var clip = el('clipPath', { id: clipId });
        clip.appendChild(el('circle', { cx: pos.x, cy: pos.y, r: r }));
        defsLayer.appendChild(clip);
        var portrait = el('image', { class: 'portrait', x: pos.x - r, y: pos.y - r, width: r * 2, height: r * 2, href: n.retrato, 'clip-path': 'url(#' + clipId + ')' });
        portrait.setAttributeNS('http://www.w3.org/1999/xlink', 'href', n.retrato);
        g.appendChild(portrait);
        portrait.addEventListener('error', function () {
          portrait.remove();
          var iconSize = r * 1.3;
          var icon = el('image', { class: 'icon', x: pos.x - iconSize / 2, y: pos.y - iconSize / 2, width: iconSize, height: iconSize, href: iconHref(n.tipo) });
          icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref(n.tipo));
          g.appendChild(icon);
        });
      } else {
        var iconSize2 = r * 1.3;
        var icon2 = el('image', { class: 'icon', x: pos.x - iconSize2 / 2, y: pos.y - iconSize2 / 2, width: iconSize2, height: iconSize2, href: iconHref(n.tipo) });
        icon2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref(n.tipo));
        g.appendChild(icon2);
        icon2.addEventListener('error', function () {
          icon2.setAttribute('href', iconHref('povo'));
          icon2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref('povo'));
        });
      }

      var label = el('text', { x: pos.x, y: pos.y + r + 15, 'text-anchor': 'middle' });
      label.textContent = n.nome;
      g.appendChild(label);
      g.addEventListener('click', function () { onSelectCharacter(n.id); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelectCharacter(n.id); }
      });
      nodeLayer.appendChild(g);
      nodeEls[n.id] = g;
    });

    var allX = Object.keys(positions).map(function (id) { return positions[id].x; });
    var allY = Object.keys(positions).map(function (id) { return positions[id].y; });
    var maxX = allX.length ? Math.max.apply(null, allX) : 200;
    var maxY = allY.length ? Math.max.apply(null, allY) : 200;
    return { width: maxX + 140, height: maxY + 120, edgeEls: edgeEls, nodeEls: nodeEls };
  }

  window.RenderCluster = { renderCluster: renderCluster };
})();
```

- [ ] **Step 3: Validate both files parse**

Run: `node -e "new Function(require('fs').readFileSync('js/render-path.js','utf8').replace(/window\./g,'globalThis.').replace('document.createElementNS','(()=>({setAttribute(){},appendChild(){},addEventListener(){}}))')); console.log('render-path.js: syntax ok')"`

This is a crude syntax check (it stubs out the DOM calls it can't run under plain Node) — if it throws, there's a JavaScript syntax error to fix. Do the same for `js/render-cluster.js`. Full functional verification happens in Task 4 in a real browser.

- [ ] **Step 4: Commit**

```bash
git add js/render-path.js js/render-cluster.js
git commit -m "feat: add render-path.js and render-cluster.js"
```

**Report:** confirm both syntax checks passed.

---

### Task 4: Rewire `app.js`, update `index.html`/`style.css`, add search and cross-era badges

**Files:**
- Modify: `app.js` (full rewrite of the orchestration logic; keep `renderCard`'s core field rendering, extend it)
- Modify: `index.html` (script tags, search bar, back button, breadcrumb, fix the stale "Génesis & Êxodo" header text)
- Modify: `style.css` (new classes for the path/station/cluster/search UI)

**Interfaces:**
- Consumes: `window.Layout` (Task 2), `window.RenderPath`, `window.RenderCluster` (Task 3), the `eras` array (Task 1).
- Produces: nothing consumed by a later task — this is the last task in this plan.

- [ ] **Step 1: Update `index.html`**

Replace the `<head>` script-loading area is unchanged (single `style.css` link stays). Replace the `<header class="topbar">` block:

```html
  <header class="topbar">
    <div>
      <span class="eyebrow">Génesis a Malaquias</span>
      <h1>Os Personagens da Bíblia</h1>
    </div>
    <div class="search-wrap">
      <input id="searchInput" class="search-input" type="text" placeholder="Procurar por nome, era ou livro…" autocomplete="off">
      <div id="searchResults" class="search-results" hidden></div>
    </div>
    <p class="instructions">Escolhe uma era para explorares as suas personagens. Toca numa personagem para abrires a sua história.</p>
    <div class="legend" id="legend"></div>
  </header>
```

Replace the `.graph-wrap` block (adds a breadcrumb/back button bar above the graph):

```html
    <div class="graph-wrap">
      <div class="breadcrumb-bar" id="breadcrumbBar" hidden>
        <button id="backBtn" class="back-btn" type="button">&larr; Voltar ao percurso</button>
        <span id="breadcrumbLabel" class="breadcrumb-label"></span>
      </div>
      <!-- viewBox is a pre-load fallback only; app.js recomputes it at runtime for whichever view is showing -->
      <svg id="graph" class="graph" viewBox="0 0 1200 500" role="group" aria-label="Mapa de personagens bíblicas e as suas relações">
        <defs id="defs"></defs>
        <g id="edges"></g>
        <g id="nodes"></g>
      </svg>
      <div class="controls">
        <button id="zoomIn" type="button" aria-label="Ampliar">+</button>
        <button id="zoomOut" type="button" aria-label="Reduzir">&minus;</button>
        <button id="zoomReset" type="button" aria-label="Repor vista">&#8634;</button>
      </div>
    </div>
```

At the bottom, replace the single `<script src="app.js"></script>` with, in this exact order (dependency order matters — plain script tags, no module system):

```html
<script src="js/layout.js"></script>
<script src="js/render-path.js"></script>
<script src="js/render-cluster.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 2: Add new CSS to `style.css`**

Append this block at the end of the file:

```css
.search-wrap {
  position: relative;
  flex: 1 1 260px;
}
.search-input {
  width: 100%;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.85rem;
}
.search-input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(74, 48, 22, 0.18);
  z-index: 20;
  max-height: 16rem;
  overflow-y: auto;
}
.search-result {
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border);
}
.search-result:last-child { border-bottom: none; }
.search-result:hover, .search-result.active { background: var(--bg-2); }
.search-result .era { color: var(--text-muted); font-size: 0.72rem; }

.breadcrumb-bar {
  position: absolute;
  top: 0.8rem;
  left: 1rem;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.back-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  color: var(--text);
  cursor: pointer;
}
.back-btn:hover { border-color: var(--accent); color: var(--accent); }
.breadcrumb-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.station { cursor: pointer; }
.station-circle {
  fill: var(--surface);
  stroke: var(--accent);
  stroke-width: 2.6px;
  transition: stroke 0.2s ease, filter 0.2s ease;
}
.station:hover .station-circle, .station:focus-visible .station-circle {
  stroke: var(--accent-2);
  filter: drop-shadow(0 0 6px var(--accent-soft));
}
.station-count {
  font-family: var(--font-mono);
  font-size: 12px;
  fill: var(--accent-2);
  text-anchor: middle;
  pointer-events: none;
}
.station-label {
  font-family: var(--font-body);
  font-size: 11px;
  fill: var(--text-muted);
  pointer-events: none;
}
.path-line {
  stroke: var(--border);
  stroke-width: 4px;
  stroke-linecap: round;
}

.cross-era-ref {
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
}
```

- [ ] **Step 3: Rewrite `app.js`**

Replace the entire file with this content:

```javascript
(function () {
  var svgns = "http://www.w3.org/2000/svg";

  var LEGEND = [
    ["parent", "Pai/mãe → filho/filha"],
    ["spouse", "Casamento"],
    ["sibling", "Irmãos"],
    ["descendant", "Várias gerações depois"]
  ];

  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function normalize(str) {
    // Strip Unicode combining diacritical marks (U+0300-U+036F) left over
    // after NFD decomposition, so "Amós" and "amos" compare equal.
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  fetch("data/personagens.json")
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      document.getElementById("panelBody").innerHTML =
        '<p class="panel-empty">Não foi possível carregar os dados (' + err.message + '). Se abriste o ficheiro diretamente no browser, é preciso servir a pasta por http:// — usa a skill run.</p>';
    });

  function init(data) {
    var NODES = data.personagens;
    var EDGES = data.edges;
    var ERAS = data.eras;

    var byId = {};
    NODES.forEach(function (n) { byId[n.id] = n; });

    var eraCounts = {};
    NODES.forEach(function (n) { eraCounts[n.era] = (eraCounts[n.era] || 0) + 1; });
    var erasWithCounts = ERAS.map(function (e) {
      return { nome: e.nome, descricao: e.descricao, count: eraCounts[e.nome] || 0 };
    });

    var adjacency = {};
    NODES.forEach(function (n) { adjacency[n.id] = new Set(); });
    EDGES.forEach(function (e) { adjacency[e[0]].add(e[1]); adjacency[e[1]].add(e[0]); });

    var graphSvg = document.getElementById("graph");
    var defsLayer = document.getElementById("defs");
    var edgeLayer = document.getElementById("edges");
    var nodeLayer = document.getElementById("nodes");
    var panelBody = document.getElementById("panelBody");
    var panel = document.getElementById("panel");
    var breadcrumbBar = document.getElementById("breadcrumbBar");
    var breadcrumbLabel = document.getElementById("breadcrumbLabel");
    var backBtn = document.getElementById("backBtn");

    var state = { view: 'path', era: null };
    var edgeEls = [];
    var nodeEls = {};
    var full = { x: 0, y: 0, w: 1200, h: 500 };
    var view = { x: 0, y: 0, w: 1200, h: 500 };

    function applyView() {
      graphSvg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    }

    function resetViewTo(dims) {
      full = { x: 0, y: 0, w: dims.width, h: dims.height };
      view = { x: 0, y: 0, w: dims.width, h: dims.height };
      applyView();
    }

    function goToPath() {
      state = { view: 'path', era: null };
      breadcrumbBar.hidden = true;
      var dims = RenderPath.renderPath(erasWithCounts, edgeLayer, nodeLayer, goToEra);
      edgeEls = []; nodeEls = {};
      resetViewTo(dims);
      closePanel();
    }

    function goToEra(eraNome) {
      state = { view: 'cluster', era: eraNome };
      breadcrumbBar.hidden = false;
      breadcrumbLabel.textContent = eraNome;
      var result = RenderCluster.renderCluster(eraNome, NODES, EDGES, defsLayer, edgeLayer, nodeLayer, selectCharacter);
      edgeEls = result.edgeEls; nodeEls = result.nodeEls;
      resetViewTo(result);
      closePanel();
    }

    backBtn.addEventListener("click", goToPath);

    function selectCharacter(id) {
      var neighbors = adjacency[id];
      graphSvg.classList.add("has-selection");
      Object.keys(nodeEls).forEach(function (nid) {
        var g = nodeEls[nid];
        g.classList.toggle("selected", nid === id);
        g.classList.toggle("dim", nid !== id && !neighbors.has(nid));
      });
      edgeEls.forEach(function (line) {
        var a = line.getAttribute("data-a"), b = line.getAttribute("data-b");
        if (a === null) return;
        line.classList.toggle("dim", a !== id && b !== id);
      });
      renderCard(byId[id]);
      panel.classList.add("open");
    }

    function crossEraRefsHtml(n) {
      var refs = [];
      EDGES.forEach(function (e) {
        if (e[0] !== n.id && e[1] !== n.id) return;
        var otherId = e[0] === n.id ? e[1] : e[0];
        var other = byId[otherId];
        if (!other || other.era === n.era) return;
        var typeLabel = { parent: 'Família', spouse: 'Casamento', sibling: 'Irmão/irmã', descendant: e[3] || 'Descendência' }[e[2]] || e[2];
        refs.push('<span class="cross-era-ref" data-goto-era="' + other.era + '" data-goto-id="' + other.id + '">' + other.nome + ' (' + typeLabel + ' · ' + other.era + ')</span>');
      });
      return refs.length ? '<p class="card-section-title">Ligações noutras eras</p><p>' + refs.join(', ') + '</p>' : '';
    }

    function renderCard(n) {
      var portraitHtml = n.retrato
        ? '<img class="card-portrait" src="' + n.retrato + '" alt="Retrato de ' + n.nome + '">'
        : '';
      panelBody.innerHTML =
        portraitHtml +
        '<p class="card-era">' + n.era + '</p>' +
        '<h2 class="card-name">' + n.nome + '</h2>' +
        '<p class="card-refs">' + n.refs + '</p>' +
        '<p class="card-summary">' + n.resumo + '</p>' +
        '<p class="card-section-title">Contexto histórico</p>' +
        '<p class="card-contexto">' + n.contexto + '</p>' +
        '<p class="card-section-title">Família</p>' +
        '<p class="card-relations">' + n.relacoes + '</p>' +
        crossEraRefsHtml(n);

      panelBody.querySelectorAll('.cross-era-ref').forEach(function (span) {
        span.addEventListener('click', function () {
          var eraNome = span.getAttribute('data-goto-era');
          var id = span.getAttribute('data-goto-id');
          goToEra(eraNome);
          setTimeout(function () { selectCharacter(id); }, 0);
        });
      });
    }

    function closePanel() {
      panel.classList.remove("open");
      graphSvg.classList.remove("has-selection");
    }
    document.getElementById("panelClose").addEventListener("click", closePanel);

    graphSvg.addEventListener("click", function (ev) {
      if (ev.target === graphSvg) closePanel();
    });

    // --- search ---
    var searchInput = document.getElementById("searchInput");
    var searchResults = document.getElementById("searchResults");

    searchInput.addEventListener("input", function () {
      var q = normalize(searchInput.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      var matches = NODES.filter(function (n) {
        return normalize(n.nome).indexOf(q) !== -1 || normalize(n.era).indexOf(q) !== -1;
      }).slice(0, 8);
      if (!matches.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = matches.map(function (n) {
        return '<div class="search-result" data-id="' + n.id + '" data-era="' + n.era + '">' + n.nome + '<div class="era">' + n.era + '</div></div>';
      }).join('');
      searchResults.hidden = false;
      searchResults.querySelectorAll('.search-result').forEach(function (row) {
        row.addEventListener('click', function () {
          var id = row.getAttribute('data-id'), eraNome = row.getAttribute('data-era');
          searchResults.hidden = true;
          searchInput.value = '';
          goToEra(eraNome);
          setTimeout(function () { selectCharacter(id); }, 0);
        });
      });
    });
    document.addEventListener("click", function (ev) {
      if (!ev.target.closest('.search-wrap')) { searchResults.hidden = true; }
    });

    // --- pan/zoom/drag (unchanged behavior, re-scoped to the current view) ---
    function zoomBy(factor, cx, cy) {
      var nw = Math.min(full.w * 1.4, Math.max(full.w * 0.22, view.w * factor));
      var nh = nw * (view.h / view.w);
      var px = (cx - view.x) / view.w;
      var py = (cy - view.y) / view.h;
      view.x -= (nw - view.w) * px;
      view.y -= (nh - view.h) * py;
      view.w = nw; view.h = nh;
      applyView();
    }

    document.getElementById("zoomIn").addEventListener("click", function () {
      zoomBy(0.8, view.x + view.w / 2, view.y + view.h / 2);
    });
    document.getElementById("zoomOut").addEventListener("click", function () {
      zoomBy(1.25, view.x + view.w / 2, view.y + view.h / 2);
    });
    document.getElementById("zoomReset").addEventListener("click", function () {
      view = { x: full.x, y: full.y, w: full.w, h: full.h };
      applyView();
    });

    graphSvg.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var rect = graphSvg.getBoundingClientRect();
      var px = view.x + ((ev.clientX - rect.left) / rect.width) * view.w;
      var py = view.y + ((ev.clientY - rect.top) / rect.height) * view.h;
      zoomBy(ev.deltaY > 0 ? 1.1 : 0.9, px, py);
    }, { passive: false });

    var dragging = false, dragStart = null, pointerDownAt = null, activePointerId = null;
    var DRAG_THRESHOLD = 4;
    graphSvg.addEventListener("pointerdown", function (ev) {
      dragging = false;
      activePointerId = ev.pointerId;
      pointerDownAt = { x: ev.clientX, y: ev.clientY };
      dragStart = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
    });
    graphSvg.addEventListener("pointermove", function (ev) {
      if (dragStart === null || ev.pointerId !== activePointerId) return;
      if (!dragging) {
        var moved = Math.hypot(ev.clientX - pointerDownAt.x, ev.clientY - pointerDownAt.y);
        if (moved < DRAG_THRESHOLD) return;
        dragging = true;
        graphSvg.classList.add("dragging");
        graphSvg.setPointerCapture(activePointerId);
      }
      var rect = graphSvg.getBoundingClientRect();
      var dx = (ev.clientX - dragStart.x) * (view.w / rect.width);
      var dy = (ev.clientY - dragStart.y) * (view.h / rect.height);
      view.x = dragStart.vx - dx;
      view.y = dragStart.vy - dy;
      applyView();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
      graphSvg.addEventListener(evt, function () {
        dragging = false;
        dragStart = null;
        graphSvg.classList.remove("dragging");
      });
    });

    var legend = document.getElementById("legend");
    LEGEND.forEach(function (l) {
      var span = document.createElement("span");
      span.className = "swatch";
      var svg = document.createElementNS(svgns, "svg");
      svg.setAttribute("width", "22"); svg.setAttribute("height", "8");
      var line = el("line", { class: "edge edge-" + l[0], x1: 0, y1: 4, x2: 22, y2: 4 });
      svg.appendChild(line);
      span.appendChild(svg);
      var text = document.createElement("span");
      text.textContent = l[1];
      span.appendChild(text);
      legend.appendChild(span);
    });

    goToPath();
  }
})();
```

- [ ] **Step 4: Verify, to whatever depth your environment allows**

Prior tasks in this project have consistently run in sandboxes with no real browser available — if that's true for you too, don't fake it. Do what you legitimately can:

1. **Static checks (always possible):** run `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('json still valid')"`. Read back the full `app.js`, `index.html`, and the two `js/render-*.js` files and trace the 7 scenarios below by hand against the actual code — for each one, name the exact functions/lines involved and state whether the logic holds up, not just "looks fine".
2. **If a browser genuinely is available to you** (check before assuming it isn't): start a local static server (see `handover.md` for the technique) and actually click through the 7 scenarios below with real pointer events, the same way prior rounds' portrait tasks were verified.

The 7 scenarios, either way:
1. **Path screen loads**: 33 stations, path line connects them, header no longer says "Génesis & Êxodo".
2. **"As famílias de Jacob" era** (14 characters, the biggest family-tree case): a tree renders with Jacob's generation above his children, no two characters land on identical coordinates. Clicking a character opens the card with correct content.
3. **"Isaías" era** (4 characters): `uzias→acaz` is an internal edge (both in "Isaías" era) so they form a small tree; `acaz→ezequias` is NOT internal (ezequias is in "1-2 Reis · O reino dividido") so Isaías/Senaqueribe/the Uzias-Acaz pair are correctly split between tree and grid.
4. **"Jonas" era** (1 character, zero edges): renders as a lone grid entry, no crash (check `computeGridLayout` handles a length-1 array, and `computeTreeLayout` returns `{}` when `connected.size === 0`).
5. **Cross-era reference**: Sofonias's card shows a "Ligações noutras eras" section linking to Ezequias (trace `crossEraRefsHtml`); clicking it calls `goToEra` then `selectCharacter` via the `setTimeout`.
6. **Search**: typing "amos" matches "Amós" via `normalize()`; clicking a result calls `goToEra` + `selectCharacter`.
7. **Back button**: `backBtn`'s click listener calls `goToPath`, which re-renders the path screen.

State plainly in your report which of these you verified by actually running the code in a browser versus by tracing the logic — do not blur the two together, and do not claim a browser check you didn't perform. The controller will do a full independent real-browser pass across all 33 eras regardless.

- [ ] **Step 5: Commit**

```bash
git add app.js index.html style.css
git commit -m "feat: wire up path/cluster navigation, search, and cross-era card links"
```

**Report:** the results of all 7 checks in Step 4 (clearly labeled real-browser vs. code-trace), plus a note on whether you could check the existing mobile bottom-sheet panel behavior (`@media (max-width: 720px)`, untouched by this task).
