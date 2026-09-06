# Navegação entre Galáxias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o modelo de vários capítulos abertos em simultâneo (Ronda 11) por navegação de uma galáxia de cada vez, com salto no hiperespaço entre o mapa de galáxias e o interior de cada uma.

**Architecture:** Duas vistas (`#mapView`, `#galaxyView`) nunca ambas interativas ao mesmo tempo, com transição de canvas+CSS 3D portada de `galaxias-mockup.html`. O motor de física (`js/physics.js`) passa a simular sempre só os personagens de UMA galáxia (`enterCapitulo(capId)`), o que elimina toda a lógica de isolamento entre capítulos da Ronda 11 (`rootCapitulo`, faixa lateral, âncoras de capítulo) por já não ser possível dois estarem simultaneamente ativos.

**Tech Stack:** JS vanilla, sem build, sem dependências. Testes com `node` + `assert` (`scripts/test-reveal-graph.js`). Verificação funcional via Chrome DevTools Protocol (cliques reais, sem `--headless` synthetic events).

**Spec:** `docs/superpowers/specs/2026-09-06-galaxias-navegacao-design.md`

## Global Constraints

- Sem bibliotecas externas, sem build step — vanilla JS/CSS/SVG/Canvas, tal como o resto do projeto.
- `js/physics.js` nunca chama `document.*` nem nenhuma API do DOM (regra já estabelecida, ver cabeçalho do ficheiro) — continua válida após esta ronda.
- Nunca duas galáxias com física ativa em simultâneo — só uma pode estar em `sim` a qualquer momento.
- Duração do salto no hiperespaço: 550ms, com `prefers-reduced-motion: reduce` a desligar por completo o efeito de streaks/perspetiva 3D (mantém só crossfade de opacidade).
- Não alterar `data/personagens.json`.

---

### Task 1: `js/reveal-graph.js` — remover `home`/`CAP_HOMES`, adicionar `groupByCapitulo`

**Files:**
- Modify: `js/reveal-graph.js`
- Test: `scripts/test-reveal-graph.js`

**Interfaces:**
- Consumes: nada de novo.
- Produces: `RevealGraph.groupByCapitulo(defs)` → `{ [personagemId]: capId }`. Usado por `app.js` (Task 7) para decidir se uma ligação exige salto de galáxia, e para contar personagens por galáxia no mapa.

- [ ] **Step 1: Remover `CAP_HOMES` e `home` do nó de capítulo**

Em `js/reveal-graph.js`, na função `build`, substitui:

```js
    // Passo 4: capítulos — nós sintéticos kind:'capitulo', com posições fixas
    // em grelha (2 filas: 4 na primeira, 3 na segunda — mesma disposição do
    // mockup original) e reveals = a sua lista de arranque.
    var CAP_HOMES = [[260, 180], [580, 180], [900, 180], [1220, 180], [260, 500], [580, 500], [900, 500]];
    (capitulos || []).forEach(function (cap, i) {
      var capId = 'cap_' + i;
      defs[capId] = { kind: 'capitulo', nome: cap.nome, reveals: cap.arranque.slice(), home: CAP_HOMES[i] || [700, 340] };
    });
```

por:

```js
    // Passo 4: capítulos — nós sintéticos kind:'capitulo', com reveals = a
    // sua lista de arranque. Já não têm posição fixa (`home`): desde a
    // Ronda 12 (navegação por galáxias) um capítulo nunca entra na
    // simulação de física como nó — a sua identidade vive inteiramente no
    // mapa de galáxias (`js/galaxy-map.js`), fora do SVG.
    (capitulos || []).forEach(function (cap, i) {
      var capId = 'cap_' + i;
      defs[capId] = { kind: 'capitulo', nome: cap.nome, reveals: cap.arranque.slice() };
    });
```

- [ ] **Step 2: Adicionar `groupByCapitulo`**

Ainda em `js/reveal-graph.js`, adiciona esta função a seguir a `uniqueKeepOrder` (antes de `var api = ...`):

```js
  // Para cada personagem/união, a que capítulo (galáxia) pertence — uma
  // travessia a partir de CADA `defs[capId].reveals` separadamente (não uma
  // BFS global sobre todos os capítulos ao mesmo tempo), para que cada nó
  // fique atribuído ao capítulo cuja própria linhagem o alcança. Assunção
  // não garantida pelos dados (mesmo aviso já existente em `physics.js`
  // sobre `rootCapitulo`): se um casamento alguma vez ligar dois capítulos
  // diferentes, essa união (e tudo o que ela revela) fica atribuída a
  // quem for processado primeiro, sem aviso — sem caso real hoje.
  function groupByCapitulo(defs) {
    var capIds = Object.keys(defs).filter(function (id) { return defs[id].kind === 'capitulo'; });
    var owner = {};
    capIds.forEach(function (capId) {
      var visited = {};
      var queue = defs[capId].reveals.slice();
      while (queue.length) {
        var cur = queue.shift();
        if (visited[cur]) continue;
        visited[cur] = true;
        if (!owner[cur]) owner[cur] = capId;
        (defs[cur].reveals || []).forEach(function (cid) {
          if (!visited[cid]) queue.push(cid);
        });
      }
    });
    return owner;
  }
```

Atualiza a linha final do ficheiro para exportar a nova função:

```js
  var api = { build: build, groupByCapitulo: groupByCapitulo };
```

- [ ] **Step 3: Atualizar o teste do Caso 6 (já não há `home`)**

Em `scripts/test-reveal-graph.js`, no bloco `// --- Caso 6 ---`, substitui:

```js
  const cap = defs[capIds[0]];
  assert.strictEqual(cap.nome, 'Capítulo Um');
  assert.deepStrictEqual(cap.reveals.slice().sort(), ['x', 'y']);
  assert.ok(Array.isArray(cap.home) && cap.home.length === 2, 'capítulo devia ter coordenadas home [x,y]');
  console.log('ok: capítulos viram nós kind:capitulo com reveals e home');
```

por:

```js
  const cap = defs[capIds[0]];
  assert.strictEqual(cap.nome, 'Capítulo Um');
  assert.deepStrictEqual(cap.reveals.slice().sort(), ['x', 'y']);
  assert.strictEqual(cap.home, undefined, 'capítulo já não deve ter coordenadas home — vive fora da física desde a Ronda 12');
  console.log('ok: capítulos viram nós kind:capitulo com reveals, sem home');
```

- [ ] **Step 4: Adicionar Caso 8 — `groupByCapitulo`**

No fim de `scripts/test-reveal-graph.js`, antes de `console.log('\nALL PASS');`, adiciona:

```js
// --- Caso 8: groupByCapitulo atribui cada personagem (direta ou via união)
// ao capítulo certo, mesmo com dois capítulos distintos no mesmo grafo ---
(function () {
  const { build, groupByCapitulo } = require('../js/reveal-graph.js');
  const personagens = [
    personagem('pai'), personagem('mae'), personagem('filho'),
    personagem('outroPai'), personagem('outroFilho'),
  ];
  const edges = [
    ['pai', 'mae', 'spouse'],
    ['pai', 'filho', 'parent'],
    ['mae', 'filho', 'parent'],
    ['outroPai', 'outroFilho', 'parent'],
  ];
  const capitulos = [
    { nome: 'Capítulo A', arranque: ['pai', 'mae'] },
    { nome: 'Capítulo B', arranque: ['outroPai'] },
  ];
  const { defs } = build(personagens, edges, capitulos);
  const owner = groupByCapitulo(defs);
  assert.strictEqual(owner['pai'], 'cap_0');
  assert.strictEqual(owner['mae'], 'cap_0');
  assert.strictEqual(owner['filho'], 'cap_0', 'filho devia herdar o capítulo dos pais através da união sintetizada');
  assert.strictEqual(owner['outroPai'], 'cap_1');
  assert.strictEqual(owner['outroFilho'], 'cap_1');
  console.log('ok: groupByCapitulo atribui cada personagem ao capítulo certo, mesmo através de uniões');
})();
```

- [ ] **Step 5: Correr os testes**

Run: `node scripts/test-reveal-graph.js`
Expected: `ALL PASS` (8 blocos `ok:`).

- [ ] **Step 6: Commit**

```bash
git add js/reveal-graph.js scripts/test-reveal-graph.js
git commit -m "refactor: remove capitulo home, add groupByCapitulo (Ronda 12 galaxias)"
```

---

### Task 2: `js/physics.js` — física escopada a uma galáxia de cada vez

**Files:**
- Modify: `js/physics.js`

**Interfaces:**
- Consumes: `defs`, `weakRefs` tal como hoje (via `init`).
- Produces: `Physics.enterCapitulo(capId)` (substitui `bootstrap()`), `Physics.resetGalaxy(onChange)` (substitui `collapseAll(onChange)`). Removidos da API pública: `bootstrap`, `collapseAll`. Todas as outras funções (`toggleExpand`, `tick`, `wake`, `getNode`, `getAllNodes`, `getCamera`, `getEdges`, `getWeakEdgesVisible`, `everythingInView`, `fitView`, `animateCameraTo`, `zoomBy`, `resetView`, `panBy`, `focusNode`) mantêm a mesma assinatura — `app.js` (Task 7) só muda as chamadas a `bootstrap`/`collapseAll`.

Este ficheiro é pequeno e as mudanças estão espalhadas por várias funções que se referem umas às outras (a guarda de `rootCapitulo` em `frame()` só faz sentido lida a par de `addNode`) — por isso este passo substitui o ficheiro inteiro em vez de vários excertos soltos.

- [ ] **Step 1: Substituir o ficheiro inteiro**

Escreve `js/physics.js` com exatamente este conteúdo:

```js
(function () {
  // Porto do motor de simulação física do protótipo de brainstorming
  // (docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html, linhas
  // 157-358, 460-522, 550-558, 580-581, 643-650). Este módulo é só estado +
  // matemática: nenhuma chamada a `document.*` ou a qualquer API do DOM —
  // quem desenha é sempre o `render-graph.js` (via `onFrame`/`onChange`),
  // nunca este ficheiro.
  //
  // Ronda 12 (navegação por galáxias): a simulação nunca mais contém nós
  // `kind:'capitulo'` — a identidade de cada galáxia vive inteiramente no
  // mapa (js/galaxy-map.js), fora desta física. Como consequência, só há
  // sempre UM capítulo em `sim` a qualquer momento (`enterCapitulo` limpa
  // e recomeça a simulação a cada troca de galáxia), o que eliminou por
  // completo a lógica de isolamento entre capítulos da Ronda 11
  // (`rootCapitulo`, faixa lateral, âncoras de capítulo) — já não há
  // segundo capítulo para isolar.
  function createPhysics() {
    var defs = {};
    var weakRefs = [];
    var W = 0, H = 0, SAFE_TOP = 0;
    var sim = new Map(); // id -> {x,y,vx,vy,kind,nome,rel,expanded,born,visualR,spawnParent}
    var scale = 1, tx = 0, ty = 0;
    var currentCapId = null;

    // Margem à volta de cada nó, em unidades do mundo, que reserva espaço
    // para o nome e a etiqueta de parentesco por baixo.
    var LABEL_MARGIN = 44;

    // Sono: a simulação adormece assim que assenta (ver `frame()`), e
    // volta a acordar sempre que `wake()` é chamado (abrir/fechar um nó,
    // fazer pan/zoom que a mexa, etc).
    var asleep = false;
    var calmFrames = 0;
    var alpha = 1;
    var SLEEP_SPEED = 0.12, SLEEP_AFTER = 15, ALPHA_DECAY = 0.975;

    var fitting = false;
    var camAnim = null;

    // Callback de redesenho guardado da última chamada a `tick(onFrame)` —
    // `wake()` e a animação de câmara (`stepCamAnim`) reutilizam-no, para
    // que o chamador nunca tenha de o passar mais do que uma vez.
    var _onFrame = null;

    function radiusFor(kind) {
      return kind === 'capitulo' ? 36 : kind === 'major' ? 24 : kind === 'standard' ? 16 : kind === 'uniao' ? 8 : 11;
    }

    // `spawnParentId` é quem estava a ser clicado quando este nó nasceu —
    // usado por `collapseSubtree` para percorrer a árvore real de
    // nascimento (ver nota lá, sobre porque isto tem de ser diferente de
    // `defs[id].reveals`, que é cíclico entre cônjuges).
    function addNode(id, atX, atY, spawnParentId) {
      var def = defs[id];
      sim.set(id, {
        id: id, nome: def.nome, kind: def.kind, rel: def.rel || null,
        expanded: false, x: atX, y: atY, vx: 0, vy: 0, born: performance.now(),
        visualR: radiusFor(def.kind), spawnParent: spawnParentId || null
      });
    }

    // Substitui o antigo `bootstrap()` da Ronda 11 (que colocava os 7
    // capítulos em grelha, todos fechados, na mesma simulação). Agora só há
    // sempre UMA galáxia em `sim`: entrar numa galáxia limpa a simulação e
    // coloca os seus personagens de arranque (`defs[capId].reveals`) num
    // leque à volta do centro do mundo — mesmo padrão de leque que
    // `toggleExpand` já usa para filhos recém-revelados, só que a partir do
    // centro em vez de um nó pai.
    function enterCapitulo(capId) {
      sim.clear();
      currentCapId = capId;
      var arranque = defs[capId].reveals;
      var baseAngle = Math.random() * Math.PI * 2;
      var dist = 110;
      arranque.forEach(function (id, i) {
        var angle = baseAngle + (i / Math.max(arranque.length, 1)) * Math.PI * 2;
        addNode(id, W / 2 + Math.cos(angle) * dist, H / 2 + Math.sin(angle) * dist, null);
      });
      wake();
    }

    // "Fechar tudo" dentro de uma galáxia — recomeça esta galáxia do zero
    // (substitui o antigo `collapseAll()`, que fechava os 7 capítulos; esse
    // conceito já não existe).
    function resetGalaxy(onChange) {
      enterCapitulo(currentCapId);
      if (onChange) onChange();
    }

    function edgeKind(fromId, toId) {
      if (defs[fromId].kind === 'uniao') return 'descent';
      if (defs[toId].kind === 'uniao') return 'stem';
      if (defs[fromId].spouseDirect && defs[fromId].spouseDirect.indexOf(toId) !== -1) return 'spouseDirect';
      return 'direct';
    }

    function edgesFor(id) {
      return (defs[id].reveals || []).filter(function (cid) { return sim.has(cid); }).map(function (cid) {
        return { a: id, b: cid, kind: edgeKind(id, cid) };
      });
    }

    function getEdges() {
      var out = [];
      Array.from(sim.keys()).forEach(function (id) { out = out.concat(edgesFor(id)); });
      // Cônjuge <-> união aparece duas vezes em `out`: a pessoa revela a
      // união (kind 'stem') E a união revela a pessoa de volta (kind
      // 'descent' — mesmo ciclo simétrico descrito em `collapseSubtree`).
      // Sem desduplicar, a mola aplicava-se duas vezes por par com dois
      // comprimentos de repouso diferentes a competir (o casamento assentava
      // numa distância de compromisso não intencional), e desenhavam-se duas
      // linhas sobrepostas — a "descent" (mais grossa, cor de descendência)
      // por cima da "stem" (mais fina, cor de casamento), escondendo a
      // distinção visual que o mockup original pretendia entre as duas.
      // Mantém sempre a direção 'stem' (pessoa -> união) quando existem as
      // duas; pares com uma só direção (ex: união -> filho, kind 'descent',
      // que é uma relação real, não duplicada) passam tal e qual.
      var byPair = {};
      out.forEach(function (e) {
        var key = [e.a, e.b].sort().join('|');
        if (!byPair[key] || (byPair[key].kind !== 'stem' && e.kind === 'stem')) {
          byPair[key] = e;
        }
      });
      return Object.keys(byPair).map(function (key) { return byPair[key]; });
    }

    function getWeakEdgesVisible() {
      return weakRefs.filter(function (w) { return sim.has(w.a) && sim.has(w.b); });
    }

    function restLengthFor(kind) {
      return kind === 'stem' ? 55 : kind === 'descent' ? 70 : kind === 'spouseDirect' ? 60 : 130;
    }

    function toggleExpand(id, onChange) {
      var n = sim.get(id);
      if (!n) return;
      var targets = defs[id].reveals || [];
      if (targets.length === 0) return;
      n.expanded = !n.expanded;
      if (n.expanded) {
        // Nasce já espalhado num pequeno leque à volta do pai — nascer
        // todos colados ao mesmo ponto obrigava a física a desfazer
        // sobreposições sozinha, e o "sono" rápido podia travar antes
        // disso acontecer. Origem do leque: a posição atual do pai — já
        // não há "capítulo a migrar para o palco principal" (esse conceito
        // desapareceu com o modelo de galáxias, Ronda 12, em que só existe
        // sempre uma galáxia em ecrã), por isso a origem é sempre
        // simplesmente onde o nó pai já está.
        var originX = n.x, originY = n.y;
        var newTargets = targets.filter(function (cid) { return !sim.has(cid); });
        var baseAngle = Math.random() * Math.PI * 2;
        newTargets.forEach(function (cid, i) {
          var dist = restLengthFor(edgeKind(id, cid));
          var angle = baseAngle + (i / Math.max(newTargets.length, 1)) * Math.PI * 2;
          addNode(cid, originX + Math.cos(angle) * dist, originY + Math.sin(angle) * dist, id);
        });
      } else {
        collapseSubtree(id);
      }
      if (onChange) onChange();
      wake();
    }

    // Colapsar percorre quem `id` REALMENTE fez aparecer no ecrã (o
    // `spawnParent` gravado em `addNode`), nunca `defs[id].reveals` — esse
    // é um grafo cíclico sobre "o que é possível revelar" (um cônjuge revela
    // a sua união E a união revela os dois cônjuges de volta, para a Eva
    // aparecer mesmo não sendo alvo direto de mais ninguém), não uma árvore
    // de posse. Uma primeira correção (percurso iterativo com conjunto de
    // visitados sobre `reveals`) resolveu o estouro de pilha
    // (`RangeError: Maximum call stack size exceeded`, 24/33 personagens)
    // mas não este problema mais subtil: colapsar a Eva reentrava a união
    // partilhada e apagava o Adão e os filhos também — tudo o que a união
    // revela — mesmo o clique tendo sido nela, não no Adão. Percorrer a
    // árvore real de nascimento evita isto: colapsar a Eva não apaga nada
    // (o clique dela não gerou nenhum nó novo, já que a união já estava
    // visível); colapsar o Adão (ou a própria união) continua a remover
    // corretamente tudo o que essa cadeia gerou.
    function collapseSubtree(id) {
      var childrenOf = {};
      sim.forEach(function (n) {
        if (n.spawnParent) {
          (childrenOf[n.spawnParent] = childrenOf[n.spawnParent] || []).push(n.id);
        }
      });
      var stack = (childrenOf[id] || []).slice();
      while (stack.length) {
        var cid = stack.pop();
        if (!sim.has(cid)) continue;
        sim.delete(cid);
        if (childrenOf[cid]) stack = stack.concat(childrenOf[cid]);
      }
      var n = sim.get(id);
      if (n) n.expanded = false;
    }

    function wake() {
      alpha = 1;
      if (asleep) {
        asleep = false;
        calmFrames = 0;
        requestAnimationFrame(frame);
      }
    }

    function frame() {
      var nodes = Array.from(sim.values());
      var REPEL = 3200; // era 2200 no mockup — mais forte, para reduzir sobreposição de linhas/retratos
      var SPRING_K = 0.012;
      var DAMP = 0.6;

      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1;
          var d = Math.sqrt(d2);
          var f = (REPEL / d2) * alpha;
          var fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }
      getEdges().forEach(function (e) {
        var ea = sim.get(e.a), eb = sim.get(e.b);
        var dx = eb.x - ea.x, dy = eb.y - ea.y;
        var d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        var rest = restLengthFor(e.kind);
        var diff = d - rest;
        var fx = (dx / d) * diff * SPRING_K * alpha, fy = (dy / d) * diff * SPRING_K * alpha;
        ea.vx += fx; ea.vy += fy;
        eb.vx -= fx; eb.vy -= fy;
      });
      var maxSpeed = 0;
      nodes.forEach(function (n) {
        n.visualR += (radiusFor(n.kind) - n.visualR) * 0.18;
        n.vx *= DAMP; n.vy *= DAMP;
        if (Math.abs(n.vx) < 0.05) n.vx = 0;
        if (Math.abs(n.vy) < 0.05) n.vy = 0;
        n.x += n.vx; n.y += n.vy;
        maxSpeed = Math.max(maxSpeed, Math.abs(n.vx), Math.abs(n.vy));
      });

      // Nó de casamento: como numa árvore genealógica em papel, fica
      // sempre exatamente sobre a linha que une os dois cônjuges — nunca
      // à deriva.
      sim.forEach(function (n) {
        if (defs[n.id].kind !== 'uniao') return;
        var spouses = defs[n.id].spouses;
        var sa = sim.get(spouses[0]), sb = sim.get(spouses[1]);
        if (!sa || !sb) return;
        n.x = (sa.x + sb.x) / 2;
        n.y = (sa.y + sb.y) / 2;
        n.vx = 0; n.vy = 0;
      });

      if (_onFrame) _onFrame();

      // Enquanto a física está acordada (algo acabou de abrir/fechar),
      // garante que tudo continua visível — nunca deixa nada sair do
      // ecrã sozinho.
      if (!fitting && !everythingInView()) {
        fitting = true;
        fitView();
      }

      alpha *= ALPHA_DECAY;
      if (maxSpeed < SLEEP_SPEED || alpha < 0.01) {
        calmFrames++;
        if (calmFrames > SLEEP_AFTER) { asleep = true; return; }
      } else {
        calmFrames = 0;
      }
      requestAnimationFrame(frame);
    }

    function tick(onFrame) {
      _onFrame = onFrame;
      asleep = false;
      requestAnimationFrame(frame);
    }

    function everythingInView() {
      // Tolerância de meio pixel: `fitView()` calcula o enquadramento mais
      // justo possível com esta mesma fórmula de `r`, por isso um nó
      // exatamente no limite devia sempre passar — mas a multiplicação por
      // `scale`/`tx`/`ty` acumula erro de vírgula flutuante (ex:
      // 109.99999999999991 em vez de 110.0 exatos), o que sem tolerância
      // fazia isto voltar `false` para sempre.
      var EPS = 0.5;
      var ok = true;
      sim.forEach(function (n) {
        var r = radiusFor(n.kind) + LABEL_MARGIN;
        var sx = n.x * scale + tx, sy = n.y * scale + ty;
        var rs = r * scale;
        if (sx - rs < -EPS || sx + rs > W + EPS || sy - rs < SAFE_TOP - EPS || sy + rs > H + EPS) ok = false;
      });
      return ok;
    }

    function fitView() {
      var nodes = Array.from(sim.values());
      if (nodes.length === 0) { fitting = false; return; }
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach(function (n) {
        var r = radiusFor(n.kind) + LABEL_MARGIN;
        minX = Math.min(minX, n.x - r); maxX = Math.max(maxX, n.x + r);
        minY = Math.min(minY, n.y - r); maxY = Math.max(maxY, n.y + r);
      });
      var bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
      var availH = H - SAFE_TOP;
      var targetScale = Math.min(3, Math.max(0.2, Math.min(W / bw, availH / bh)));
      var targetTx = W / 2 - (minX + maxX) / 2 * targetScale;
      var targetTy = SAFE_TOP + availH / 2 - (minY + maxY) / 2 * targetScale;
      animateCameraTo(targetScale, targetTx, targetTy);
    }

    function animateCameraTo(targetScale, targetTx, targetTy, duration) {
      camAnim = {
        startScale: scale, startTx: tx, startTy: ty,
        targetScale: targetScale, targetTx: targetTx, targetTy: targetTy,
        startTime: performance.now(), duration: duration || 450
      };
      requestAnimationFrame(stepCamAnim);
    }

    function stepCamAnim(now) {
      if (!camAnim) return;
      var t = (now - camAnim.startTime) / camAnim.duration;
      if (t > 1) t = 1;
      var ease = 1 - Math.pow(1 - t, 3);
      scale = camAnim.startScale + (camAnim.targetScale - camAnim.startScale) * ease;
      tx = camAnim.startTx + (camAnim.targetTx - camAnim.startTx) * ease;
      ty = camAnim.startTy + (camAnim.targetTy - camAnim.startTy) * ease;
      if (_onFrame) _onFrame();
      if (t < 1) {
        requestAnimationFrame(stepCamAnim);
      } else {
        camAnim = null;
        fitting = false;
      }
    }

    function zoomBy(factor, cx, cy) {
      cx = (cx === undefined || cx === null) ? W / 2 : cx;
      cy = (cy === undefined || cy === null) ? H / 2 : cy;
      var newScale = Math.min(3, Math.max(0.35, scale * factor));
      var k = newScale / scale;
      tx = cx - (cx - tx) * k;
      ty = cy - (cy - ty) * k;
      scale = newScale;
    }

    function resetView() {
      scale = 1; tx = 0; ty = 0;
    }

    function panBy(dx, dy) {
      tx += dx;
      ty += dy;
    }

    function focusNode(id) {
      var n = sim.get(id);
      if (!n) return;
      var targetScale = 1.5;
      var availH = H - SAFE_TOP;
      var targetTx = W / 2 - n.x * targetScale;
      var targetTy = SAFE_TOP + availH / 2 - n.y * targetScale;
      animateCameraTo(targetScale, targetTx, targetTy, 600);
    }

    function getNode(id) {
      return sim.get(id);
    }

    function getAllNodes() {
      return Array.from(sim.values());
    }

    function getCamera() {
      return { scale: scale, tx: tx, ty: ty };
    }

    function init(newDefs, newWeakRefs, canvasWidth, canvasHeight, safeTop) {
      defs = newDefs || {};
      weakRefs = newWeakRefs || [];
      W = canvasWidth;
      H = canvasHeight;
      SAFE_TOP = safeTop;
      sim = new Map();
      scale = 1; tx = 0; ty = 0;
      asleep = false; calmFrames = 0; alpha = 1;
      fitting = false; camAnim = null; _onFrame = null;
      currentCapId = null;
    }

    return {
      init: init,
      enterCapitulo: enterCapitulo,
      resetGalaxy: resetGalaxy,
      toggleExpand: toggleExpand,
      tick: tick,
      wake: wake,
      getNode: getNode,
      getAllNodes: getAllNodes,
      getCamera: getCamera,
      getEdges: getEdges,
      getWeakEdgesVisible: getWeakEdgesVisible,
      everythingInView: everythingInView,
      fitView: fitView,
      animateCameraTo: animateCameraTo,
      zoomBy: zoomBy,
      resetView: resetView,
      panBy: panBy,
      focusNode: focusNode
    };
  }

  var Physics = createPhysics();
  if (typeof module !== 'undefined' && module.exports) module.exports = Physics;
  if (typeof window !== 'undefined') window.Physics = Physics;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/physics.js
git commit -m "refactor: scope physics to one galaxy at a time (Ronda 12)"
```

---

### Task 3: `js/render-graph.js` — remover ramos exclusivos de `kind:'capitulo'` e `drawBackground`

**Files:**
- Modify: `js/render-graph.js`

**Interfaces:**
- Consumes: `physics.getAllNodes()`, `physics.getEdges()`, `physics.getWeakEdgesVisible()`, `physics.getCamera()`, `physics.getNode()` — tudo inalterado (Task 2 manteve estas assinaturas).
- Produces: `RenderGraph.draw(...)`, `RenderGraph.markDirty()` — inalterados. Remove `RenderGraph.drawBackground` (Task 6 substitui-o pelo canvas de `js/warp-transition.js`).

- [ ] **Step 1: Remover a etiqueta de contagem exclusiva de capítulo**

Em `js/render-graph.js`, na construção do `g.innerHTML` dentro do `if (needsFullRender)`, substitui:

```js
        g.innerHTML =
          '<circle class="halo" r="' + (r + 6) + '"></circle>' +
          starShape(defs, n, r) +
          (n.kind !== 'uniao' ? '<text class="name" y="' + (r + 16) + '">' + n.nome + '</text>' : '') +
          (n.kind === 'capitulo' ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + (defs[n.id].reveals || []).length + ' personagens</text>' : '') +
          (n.rel ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + truncateRelLabel(n.rel) + '</text>' : '') +
```

por:

```js
        g.innerHTML =
          '<circle class="halo" r="' + (r + 6) + '"></circle>' +
          starShape(defs, n, r) +
          (n.kind !== 'uniao' ? '<text class="name" y="' + (r + 16) + '">' + n.nome + '</text>' : '') +
          (n.rel ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + truncateRelLabel(n.rel) + '</text>' : '') +
```

(nós `kind:'capitulo'` nunca mais entram em `physics.getAllNodes()` desde a Task 2 — este ramo nunca disparava depois disso, e ficava morto.)

- [ ] **Step 2: Remover as classes `side`/`chapter-opened`**

Substitui:

```js
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      g.classList.toggle('side', defs[n.id].kind === 'capitulo' && n.visualR < radiusFor('capitulo') - 4);
      // Capítulo aberto perde o círculo/halo/badge (pedido da Isabel) — o
      // mockup original mantinha sempre o círculo visível; aqui a classe
      // `chapter-opened` é só marcada/desmarcada, a ocultação em si é CSS
      // (Task 5, style.css), fora da responsabilidade deste ficheiro.
      var isOpenChapter = defs[n.id].kind === 'capitulo' && n.expanded;
      g.classList.toggle('chapter-opened', isOpenChapter);
      // Halo/badge de "dá para expandir" — recalculados todos os frames
```

por:

```js
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      // Halo/badge de "dá para expandir" — recalculados todos os frames
```

- [ ] **Step 3: Remover `drawBackground` e a sua exportação**

Remove por completo a função:

```js
  // Estrelas de fundo decorativas, desenhadas uma única vez (fora da
  // transformação de `#world`, tal como no mockup). Não faz parte do
  // contrato `draw(svgWorldEl, edgeLayerEl, nodeLayerEl, defs, physics,
  // callbacks)` porque `#bgLayer` e as dimensões do mundo não são
  // parâmetros de `draw()` — quem chama isto uma vez (na inicialização,
  // não a cada frame) é o app.js (Task 6).
  function drawBackground(bgLayerEl, width, height) {
    var bgSvg = '';
    for (var i = 0; i < 140; i++) {
      var x = Math.random() * width, y = Math.random() * height, r = Math.random() * 1.3 + 0.3, o = Math.random() * 0.5 + 0.1;
      bgSvg += '<circle class="bgstar" cx="' + x + '" cy="' + y + '" r="' + r + '" opacity="' + o + '"></circle>';
    }
    bgLayerEl.innerHTML = bgSvg;
  }
```

e na definição de `RenderGraph`, substitui:

```js
  var RenderGraph = {
    draw: draw,
    markDirty: markDirty,
    drawBackground: drawBackground
  };
```

por:

```js
  var RenderGraph = {
    draw: draw,
    markDirty: markDirty
  };
```

(o fundo estrelado deixa de ser um `<g id="bgLayer">` estático em SVG — passa a ser o canvas partilhado `#bgStars`, desenhado por `js/warp-transition.js`, Task 4, que também cintila e faz os saltos entre galáxias.)

- [ ] **Step 4: Commit**

```bash
git add js/render-graph.js
git commit -m "refactor: drop dead capitulo-node branches and drawBackground from render-graph"
```

---

### Task 4: `js/warp-transition.js` (novo) — salto no hiperespaço

**Files:**
- Create: `js/warp-transition.js`

**Interfaces:**
- Consumes: um elemento `<canvas>` (via `init(canvasEl)`).
- Produces: `WarpTransition.init(canvasEl)`, `WarpTransition.trigger()`. Usado por `app.js` (Task 7) no arranque (`init`) e em cada troca de vista (`trigger`).

Porto quase direto do protótipo `galaxias-mockup.html` (aprovado e testado pela Isabel), generalizado para um módulo com API própria em vez de um IIFE de página única.

- [ ] **Step 1: Escrever o ficheiro**

```js
(function () {
  // Porto do efeito de "salto no hiperespaço" do protótipo
  // galaxias-mockup.html (testado e aprovado pela Isabel): canvas de fundo
  // com estrelas a cintilar sempre visível, mais um rasto de streaks
  // radiais disparado em cada transição entre o mapa de galáxias e o
  // interior de uma galáxia (ou diretamente entre duas galáxias).
  function createWarpTransition() {
    var canvas, ctx;
    var stars = [];
    var reduceMotion = false;
    var warpActive = false;
    var warpStart = 0;
    var WARP_DURATION = 550;
    var warpParticles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init(canvasEl) {
      canvas = canvasEl;
      ctx = canvas.getContext('2d');
      reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      resize();
      window.addEventListener('resize', resize);
      stars = [];
      for (var i = 0; i < 160; i++) {
        stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, o: Math.random() * 0.5 + 0.15, p: Math.random() * Math.PI * 2 });
      }
      requestAnimationFrame(drawFrame);
    }

    // Disparado a cada troca de vista (mapa->galáxia, galáxia->mapa, ou
    // diretamente entre duas galáxias via ligação cruzada/pesquisa).
    // Sem efeito se o utilizador pedir movimento reduzido ao sistema.
    function trigger() {
      if (reduceMotion) return;
      warpActive = true;
      warpStart = performance.now();
      warpParticles = [];
      for (var i = 0; i < 110; i++) {
        warpParticles.push({
          angle: Math.random() * Math.PI * 2,
          dist: Math.random() * 30,
          speed: 90 + Math.random() * 220
        });
      }
    }

    function drawWarp(t) {
      var elapsed = t - warpStart;
      var progress = Math.min(1, elapsed / WARP_DURATION);
      if (progress >= 1) { warpActive = false; return; }
      var cx = canvas.width / 2, cy = canvas.height / 2;
      var kick = 1 + progress * progress * 11;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      warpParticles.forEach(function (p) {
        var prevDist = p.dist;
        p.dist += p.speed * kick * 0.016;
        var x1 = cx + Math.cos(p.angle) * prevDist;
        var y1 = cy + Math.sin(p.angle) * prevDist * 0.6;
        var x2 = cx + Math.cos(p.angle) * p.dist;
        var y2 = cy + Math.sin(p.angle) * p.dist * 0.6;
        var fade = 1 - progress;
        ctx.strokeStyle = 'rgba(232,228,216,' + (0.55 * fade).toFixed(3) + ')';
        ctx.lineWidth = 1 + progress * 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      // breve clarão no pico do salto, como ao "emergir" do hiperespaço
      var flash = Math.max(0, 1 - Math.abs(progress - 0.82) * 6);
      if (flash > 0) {
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(canvas.width, canvas.height) * 0.5);
        grad.addColorStop(0, 'rgba(240,208,96,' + (flash * 0.22).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(240,208,96,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    }

    function drawFrame(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#cfd0f0';
      stars.forEach(function (s) {
        var tw = 0.6 + 0.4 * Math.sin(t / 900 + s.p);
        ctx.globalAlpha = s.o * tw;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (warpActive) drawWarp(t);
      requestAnimationFrame(drawFrame);
    }

    return { init: init, trigger: trigger };
  }

  var WarpTransition = createWarpTransition();
  if (typeof module !== 'undefined' && module.exports) module.exports = WarpTransition;
  if (typeof window !== 'undefined') window.WarpTransition = WarpTransition;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/warp-transition.js
git commit -m "feat: add hyperspace warp transition (ported from approved mockup)"
```

---

### Task 5: `js/galaxy-map.js` (novo) — grelha do mapa de galáxias

**Files:**
- Create: `js/galaxy-map.js`

**Interfaces:**
- Consumes: `defs` (de `RevealGraph.build`), um mapa `memberCounts` (`{ [capId]: number }`, calculado por `app.js` a partir de `groupByCapitulo`).
- Produces: `GalaxyMap.render(gridEl, defs, memberCounts, onEnter)` — `onEnter(capId)` é chamado ao clicar numa galáxia.

- [ ] **Step 1: Escrever o ficheiro**

```js
(function () {
  // Grelha do mapa de galáxias — um botão por capítulo. Só lê `defs`/
  // `memberCounts` (nunca os muda) e reporta a intenção de entrar numa
  // galáxia via `onEnter`, no mesmo espírito de `render-graph.js` (DOM só
  // aqui, decisão em app.js).
  function render(gridEl, defs, memberCounts, onEnter) {
    gridEl.innerHTML = '';
    Object.keys(defs)
      .filter(function (id) { return defs[id].kind === 'capitulo'; })
      .forEach(function (capId) {
        var d = defs[capId];
        var btn = document.createElement('button');
        btn.className = 'galaxy';
        btn.innerHTML =
          '<span class="galaxy-orb" style="animation-delay:' + (Math.random() * -6).toFixed(2) + 's"></span>' +
          '<span class="galaxy-name">' + d.nome + '</span>' +
          '<span class="galaxy-count">' + (memberCounts[capId] || 0) + ' personagens</span>';
        btn.addEventListener('click', function () { onEnter(capId); });
        gridEl.appendChild(btn);
      });
  }

  var GalaxyMap = { render: render };
  if (typeof module !== 'undefined' && module.exports) module.exports = GalaxyMap;
  if (typeof window !== 'undefined') window.GalaxyMap = GalaxyMap;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/galaxy-map.js
git commit -m "feat: add galaxy map grid renderer"
```

---

### Task 6: `index.html` + `style.css` — nova estrutura de duas vistas

**Files:**
- Modify: `index.html`
- Modify: `style.css`

**Interfaces:**
- Consumes: `js/warp-transition.js`, `js/galaxy-map.js` (Tasks 4-5), IDs novos que `app.js` (Task 7) vai usar: `#bgStars`, `#mapView`, `#galaxyGrid`, `#galaxyView`, `#galaxyTitle`, `#backBtn`.
- Produces: a página completa, pronta para `app.js` ligar os eventos.

- [ ] **Step 1: Substituir `index.html`**

```html
<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Os Personagens da Bíblia</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app">
  <div class="topbar">
    <div>
      <span class="eyebrow">Génesis a Malaquias</span>
      <h1>Os Personagens da Bíblia</h1>
    </div>
    <div class="search-wrap">
      <input id="searchBox" class="search-box" type="text" placeholder="Procura uma personagem (ex: David, Rute, Isaías)..." autocomplete="off" aria-label="Procurar personagem">
      <div id="searchResults" class="search-results" hidden></div>
    </div>
    <p class="hint">Clica numa galáxia para a abrir. Dentro dela, passa o rato por uma personagem para uma prévia; clica para a história completa.</p>
  </div>

  <div class="stage-area">
    <div class="stage-views">
      <canvas id="bgStars"></canvas>

      <div class="view" id="mapView">
        <div class="galaxy-grid" id="galaxyGrid"></div>
      </div>

      <div class="view" id="galaxyView">
        <div class="galaxy-header">
          <button class="back-btn" id="backBtn">&larr; Voltar ao mapa de galáxias</button>
          <span class="galaxy-title" id="galaxyTitle"></span>
        </div>
        <div class="stage-wrap">
          <svg id="stage" viewBox="0 0 1400 900" role="group" aria-label="Personagens bíblicas e as suas relações">
            <defs id="svgDefs">
              <radialGradient id="majorGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#fff8e0"/><stop offset="55%" stop-color="#f0d060"/><stop offset="100%" stop-color="#c9a24a"/></radialGradient>
              <radialGradient id="standardGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#e4e0f8"/><stop offset="55%" stop-color="#9a94d0"/><stop offset="100%" stop-color="#6b64a8"/></radialGradient>
              <radialGradient id="minorGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#c9c6dc"/><stop offset="55%" stop-color="#7d76ad"/><stop offset="100%" stop-color="#524d78"/></radialGradient>
              <radialGradient id="uniaoGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#ffe0ec"/><stop offset="55%" stop-color="#e8608f"/><stop offset="100%" stop-color="#a83a63"/></radialGradient>
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <g id="world">
              <g id="edgeLayer"></g>
              <g id="nodeLayer"></g>
            </g>
          </svg>
          <div class="controls">
            <button id="zoomIn" type="button" aria-label="Ampliar">+</button>
            <button id="zoomOut" type="button" aria-label="Reduzir">&minus;</button>
            <button id="zoomReset" type="button" aria-label="Repor vista">&#8634;</button>
            <button id="collapseAllBtn" type="button" aria-label="Recomeçar esta galáxia">&#10558;</button>
          </div>
        </div>
      </div>
    </div>

    <aside id="panel">
      <button class="panel-close" id="panelClose" type="button">Fechar &times;</button>
      <div id="panelBody">
        <p class="panel-empty">Passa o rato por uma personagem para uma prévia, ou clica para conheceres a sua história completa.</p>
      </div>
    </aside>
  </div>

  <footer class="note">Os Personagens da Bíblia — Paróquia da Póvoa de Santa Iria.</footer>
</div>
<script src="js/reveal-graph.js"></script>
<script src="js/physics.js"></script>
<script src="js/render-graph.js"></script>
<script src="js/warp-transition.js"></script>
<script src="js/galaxy-map.js"></script>
<script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Substituir `style.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #0d1024; color: #e8e4d8; font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; overflow: hidden; height: 100%; }

.app { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

.topbar { padding: 16px 20px 8px; z-index: 10; }
.topbar .eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #d8c98a; display: block; margin-bottom: 2px; }
.topbar h1 { font-size: 19px; margin: 0 0 4px; color: #f0e6d2; font-weight: 400; }
.hint { font-size: 11.5px; color: #6b6591; margin: 4px 0 0; }

.search-wrap { position: relative; width: 420px; max-width: 90vw; margin: 6px 0; }
.search-box { width: 100%; padding: 12px 18px; border-radius: 999px; border: 2px solid #4a4580; background: #161933; color: #f0e6d2; font-family: Georgia, serif; font-size: 15px; outline: none; }
.search-box:focus { border-color: #d8c98a; }
.search-box::placeholder { color: #6b6591; }
.search-results { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #161933; border: 1px solid #4a4580; border-radius: 12px; overflow: hidden; z-index: 15; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
.search-result { padding: 10px 18px; cursor: pointer; font-size: 14px; color: #e8e4d8; display: flex; justify-content: space-between; align-items: baseline; }
.search-result:hover { background: #2a2650; }
.search-result .sr-era { font-size: 10.5px; color: #9a94b8; }

.stage-area { position: relative; flex: 1; display: flex; min-height: 0; }
.stage-views { position: relative; flex: 1; min-width: 0; overflow: hidden; perspective: 1000px; }
#bgStars { position: absolute; inset: 0; z-index: 0; }
.view { position: absolute; inset: 0; z-index: 5; }

/* --- mapa de galáxias --- */
#mapView {
  display: flex; align-items: center; justify-content: center;
  transition: opacity .55s ease, transform .55s cubic-bezier(.22,.61,.36,1);
  transform-style: preserve-3d;
}
#mapView.hidden { opacity: 0; transform: scale(1.55) translateZ(260px) rotateX(5deg); pointer-events: none; }
.galaxy-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 46px 64px; max-width: 900px; padding: 20px; }
.galaxy { display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; background: none; border: none; color: inherit; font-family: inherit; }
.galaxy-orb {
  width: 76px; height: 76px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff8e0, #f0d060 55%, #a9812e 100%);
  box-shadow: 0 0 22px 4px rgba(240,208,96,.35);
  animation: drift 7s ease-in-out infinite;
  transition: transform .2s ease, box-shadow .2s ease;
}
.galaxy:hover .galaxy-orb, .galaxy:focus-visible .galaxy-orb { transform: scale(1.08); box-shadow: 0 0 32px 8px rgba(240,208,96,.55); }
.galaxy-name { font-size: 13.5px; color: #e8e4d8; }
.galaxy-count { font-size: 10.5px; color: #7d76ad; font-family: -apple-system, sans-serif; }
@keyframes drift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(3px,-5px); } }

/* --- interior de uma galáxia --- */
#galaxyView {
  display: flex; flex-direction: column; opacity: 0; pointer-events: none;
  transition: opacity .55s ease, transform .55s cubic-bezier(.22,.61,.36,1);
  transform: scale(.4) translateZ(-420px) rotateX(-5deg);
  transform-style: preserve-3d;
}
#galaxyView.shown { opacity: 1; pointer-events: auto; transform: scale(1) translateZ(0) rotateX(0deg); }

@media (prefers-reduced-motion: reduce) {
  #mapView, #galaxyView { transition: opacity .3s ease; }
  #mapView.hidden { transform: none; }
  #galaxyView, #galaxyView.shown { transform: none; }
}

.galaxy-header { display: flex; align-items: center; gap: 14px; padding: 14px 20px 0; z-index: 10; position: relative; }
.back-btn { font-family: Georgia, serif; font-size: 12.5px; color: #d8c98a; background: #161933; border: 1px solid #4a4580; border-radius: 999px; padding: 7px 14px; cursor: pointer; }
.back-btn:hover { border-color: #d8c98a; background: #2a2650; }
.galaxy-title { font-size: 15px; color: #f0e6d2; }

.stage-wrap { position: relative; flex: 1; min-height: 0; }
#stage { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
#stage.panning { cursor: grabbing; }

.cline { stroke: #4a4580; stroke-width: 1.4; fill: none; }
.cline.stem { stroke: #d8a0b8; stroke-width: 1.2; opacity: .8; }
.cline.descent { stroke: #6b64a8; stroke-width: 1.6; }
.cline.spouseDirect { stroke: #d8a0b8; stroke-width: 1.2; stroke-dasharray: 3 4; opacity: .8; }
.cline.weak { stroke: #4a4a6a; stroke-width: 0.8; stroke-dasharray: 1 5; opacity: .55; }

.node { cursor: pointer; }
.node circle.halo { fill: none; stroke: #d8c98a; stroke-width: 1; opacity: 0; }
.node.expandable circle.halo { opacity: .35; }
.node.uniao .halo { stroke: #e8608f; }
.node.major .star { fill: url(#majorGrad); }
.node.standard .star { fill: url(#standardGrad); }
.node.minor .star { fill: url(#minorGrad); }
.node.uniao .star { fill: url(#uniaoGrad); }
.node text.name { fill: #f0e6d2; font-size: 11px; text-anchor: middle; paint-order: stroke; stroke: #0d1024; stroke-width: 3; }
.node.minor text.name { font-size: 9.5px; }
.node text.badge { fill: #1a1735; font-size: 9px; text-anchor: middle; font-weight: bold; }
.node circle.badge-bg { fill: #d8c98a; }
.node text.clabel { fill: #9a94b8; font-size: 8.5px; text-anchor: middle; paint-order: stroke; stroke: #0d1024; stroke-width: 3; }

.node-group { transform-box: fill-box; transform-origin: center; }
.pop-in { animation: popIn .35s cubic-bezier(.34,1.56,.64,1); }
@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
.found-highlight .halo { opacity: 1 !important; stroke: #f0d060; stroke-width: 2.5; }

.controls { position: absolute; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
.controls button { width: 38px; height: 38px; border-radius: 50%; border: 1px solid #4a4580; background: #161933; color: #d8c98a; font-size: 17px; cursor: pointer; font-family: Georgia, serif; }
.controls button:hover { background: #2a2650; }
.controls button:focus-visible,
aside button:focus-visible,
.back-btn:focus-visible,
.galaxy:focus-visible,
.node:focus-visible circle.halo { outline: 2px solid #d8c98a; outline-offset: 2px; }
.search-result:focus-visible,
.cross-galaxy-ref:focus-visible { outline: 2px solid #d8c98a; outline-offset: 2px; }

aside#panel { width: 22rem; flex-shrink: 0; border-left: 1px solid #4a4580; background: #12142a; padding: 1.3rem 1.4rem; overflow-y: auto; color: #e8e4d8; }
.panel-empty { color: #9a94b8; font-size: 0.88rem; margin-top: 2rem; text-align: center; line-height: 1.6; }
.card-era { font-family: Georgia, serif; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: #d8c98a; }
.card-portrait { display: block; width: 128px; height: 128px; border-radius: 50%; object-fit: cover; background: #161933; border: 3px solid #d8c98a; margin: 0 auto 1rem; }
.card-name { font-family: Georgia, serif; font-size: 1.7rem; margin: 0.2rem 0 0.15rem; color: #f0e6d2; }
.card-refs { font-size: 0.78rem; color: #9a94b8; margin: 0 0 1rem; }
.card-summary, .card-contexto, .card-relations { font-size: 0.9rem; line-height: 1.6; color: #e8e4d8; max-width: 36ch; margin: 0 0 1.1rem; }
.card-section-title { font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; color: #9a94b8; margin: 1rem 0 0.4rem; }
.card-section-title:first-of-type { margin-top: 0; }
.card-relations { border-left: 2px solid #4a4580; padding-left: 0.7rem; }
.panel-close { display: none; }
.cross-galaxy-ref { color: #d8c98a; cursor: pointer; text-decoration: underline; text-decoration-style: dotted; }

footer.note { padding: 0.4rem 1.4rem; font-size: 0.68rem; color: #6b6591; }

@media (max-width: 720px) {
  .stage-area { flex-direction: column; }
  .hint { display: none; }
  aside#panel {
    position: fixed; left: 0; right: 0; bottom: 0; width: auto; max-height: 62dvh;
    border-left: none; border-top: 1px solid #4a4580; border-radius: 10px 10px 0 0;
    transform: translateY(100%); transition: transform 0.3s ease;
    box-shadow: 0 -8px 24px rgba(0,0,0,.5); z-index: 20;
  }
  aside#panel.open { transform: translateY(0); }
  .panel-close { display: block; margin: -0.4rem 0 0.6rem auto; background: none; border: none; color: #9a94b8; font-size: 0.8rem; cursor: pointer; }
  footer.note { display: none; }
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat: restructure page into galaxy map + galaxy view with warp transition"
```

---

### Task 7: `app.js` — orquestração do mapa/galáxia, saltos e ligações cruzadas

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `RevealGraph.build`, `RevealGraph.groupByCapitulo`, `Physics.*` (Task 2), `RenderGraph.*` (Task 3), `WarpTransition.*` (Task 4), `GalaxyMap.render` (Task 5), os novos IDs do DOM (Task 6).
- Produces: a aplicação funcional.

- [ ] **Step 1: Substituir o ficheiro inteiro**

```js
(function () {
  fetch("data/personagens.json")
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      document.getElementById("panelBody").innerHTML =
        '<p class="panel-empty">Não foi possível carregar os dados (' + err.message + '). Se abriste o ficheiro diretamente no browser, é preciso servir a pasta por http:// — usa a skill run.</p>';
    });

  function normalize(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function init(data) {
    var built = RevealGraph.build(data.personagens, data.edges, data.capitulos);
    var defs = built.defs, weakRefs = built.weakRefs;
    var ownerMap = RevealGraph.groupByCapitulo(defs);

    var memberCounts = {};
    Object.keys(ownerMap).forEach(function (id) {
      if (['major', 'standard', 'minor'].indexOf(defs[id].kind) === -1) return;
      var capId = ownerMap[id];
      memberCounts[capId] = (memberCounts[capId] || 0) + 1;
    });

    var byId = {};
    data.personagens.forEach(function (p) { byId[p.id] = p; });

    var W = 1400, H = 900, SAFE_TOP = 110;
    Physics.init(defs, weakRefs, W, H, SAFE_TOP);

    var bgStars = document.getElementById('bgStars');
    WarpTransition.init(bgStars);

    var mapView = document.getElementById('mapView');
    var galaxyView = document.getElementById('galaxyView');
    var galaxyGrid = document.getElementById('galaxyGrid');
    var galaxyTitle = document.getElementById('galaxyTitle');
    var backBtn = document.getElementById('backBtn');

    var stage = document.getElementById('stage');
    var world = document.getElementById('world');
    var edgeLayer = document.getElementById('edgeLayer');
    var nodeLayer = document.getElementById('nodeLayer');
    var panel = document.getElementById('panel');
    var panelBody = document.getElementById('panelBody');
    var panelEmptyHtml = panelBody.innerHTML;

    var selectedId = null; // última personagem CLICADA — o painel volta a isto quando o rato sai de um hover
    var currentCapId = null; // galáxia aberta neste momento (null = no mapa)

    function requestDraw() {
      RenderGraph.draw(world, edgeLayer, nodeLayer, defs, Physics, {
        onNodeClick: onNodeClick,
        onNodeHover: onNodeHover,
        onNodeUnhover: onNodeUnhover
      });
    }

    function onNodeClick(id) {
      Physics.toggleExpand(id, RenderGraph.markDirty);
      Physics.wake();
      var d = defs[id];
      if (d.kind !== 'uniao') {
        selectedId = id;
        renderCardFull(id);
        panel.classList.add('open');
      }
    }
    function onNodeHover(id) {
      var d = defs[id];
      if (d.kind === 'uniao') return;
      renderCardPreview(id);
      panel.classList.add('open');
    }
    function onNodeUnhover() {
      if (selectedId) { renderCardFull(selectedId); }
      else { panelBody.innerHTML = panelEmptyHtml; panel.classList.remove('open'); }
    }

    function renderCardPreview(id) {
      var d = defs[id];
      panelBody.innerHTML =
        '<p class="card-era">' + d.era + '</p>' +
        '<h2 class="card-name">' + d.nome + '</h2>' +
        (d.rel ? '<p class="card-refs">' + d.rel + '</p>' : '');
    }

    // "Também aparece em" — só ligações que atravessam uma fronteira de
    // galáxia (capítulo diferente), não qualquer diferença de era interna.
    // A etiqueta mostra o nome da galáxia, porque é para lá que o clique
    // salta (Ronda 12 — antes mostrava a era, e o critério era "era
    // diferente"; ver spec 2026-09-06-galaxias-navegacao-design.md).
    function crossGalaxyRefsHtml(n, id) {
      var refs = [];
      data.edges.forEach(function (e) {
        if (e[0] !== id && e[1] !== id) return;
        var otherId = e[0] === id ? e[1] : e[0];
        var other = byId[otherId];
        if (!other) return;
        var otherCap = ownerMap[otherId];
        if (!otherCap || otherCap === ownerMap[id]) return;
        var typeLabel = { parent: 'Família', spouse: 'Casamento', sibling: 'Irmão/irmã', descendant: e[3] || 'Descendência', affinity: e[3] || 'Parentesco' }[e[2]] || e[2];
        refs.push('<span class="cross-galaxy-ref" data-goto-id="' + escapeAttr(otherId) + '" tabindex="0" role="button" aria-label="Ir para ' + escapeAttr(other.nome) + '">' + other.nome + ' (' + typeLabel + ' · ' + defs[otherCap].nome + ')</span>');
      });
      return refs.length ? '<p class="card-section-title">Também aparece em</p><p>' + refs.join(', ') + '</p>' : '';
    }

    function renderCardFull(id) {
      var n = defs[id];
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
        '<p class="card-relations">' + (n.rel || '') + '</p>' +
        crossGalaxyRefsHtml(n, id);

      panelBody.querySelectorAll('.cross-galaxy-ref').forEach(function (span) {
        span.addEventListener('click', function () { revealAndSelect(span.getAttribute('data-goto-id')); });
        span.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); revealAndSelect(span.getAttribute('data-goto-id')); }
        });
      });
    }

    function closePanel() {
      panel.classList.remove('open');
    }
    document.getElementById('panelClose').addEventListener('click', function () {
      closePanel();
      panelBody.innerHTML = panelEmptyHtml;
      selectedId = null;
    });

    // --- mapa de galáxias <-> interior de uma galáxia ---
    function renderGalaxyMap() {
      GalaxyMap.render(galaxyGrid, defs, memberCounts, enterGalaxy);
    }

    function enterGalaxy(capId) {
      WarpTransition.trigger();
      currentCapId = capId;
      galaxyTitle.textContent = defs[capId].nome;
      mapView.classList.add('hidden');
      galaxyView.classList.add('shown');
      Physics.enterCapitulo(capId);
      RenderGraph.markDirty();
      Physics.resetView();
      requestDraw();
    }

    function exitToMap() {
      WarpTransition.trigger();
      currentCapId = null;
      mapView.classList.remove('hidden');
      galaxyView.classList.remove('shown');
      selectedId = null;
      panelBody.innerHTML = panelEmptyHtml;
      closePanel();
    }
    backBtn.addEventListener('click', exitToMap);

    // --- revelar por id (partilhado pela pesquisa e pelas ligações
    // cruzadas entre galáxias) ---
    // BFS a partir dos capítulos (as únicas raízes verdadeiras) sobre o grafo
    // de `reveals`: dá a cada nó exatamente um predecessor, sem ciclos.
    // Um mapa "o último a escrever ganha" sobre `Object.keys(defs)` (versão
    // anterior desta task) partia-se sempre que uma personagem casava: a
    // união revela os dois cônjuges E cada cônjuge revela a união (para
    // nenhum ficar sem caminho de revelação próprio — ver reveal-graph.js),
    // o que cria sempre um ciclo de 2 nós entre uma personagem e a sua
    // própria união conjugal. BFS nunca revisita um nó já visitado, por
    // isso não há ciclo possível.
    var revealedBy = {};
    (function () {
      var visited = {};
      var queue = [];
      Object.keys(defs).forEach(function (id) {
        if (defs[id].kind === 'capitulo') { visited[id] = true; queue.push(id); }
      });
      while (queue.length) {
        var cur = queue.shift();
        (defs[cur].reveals || []).forEach(function (cid) {
          if (!visited[cid]) { visited[cid] = true; revealedBy[cid] = cur; queue.push(cid); }
        });
      }
    })();
    function pathToRoot(id) {
      var path = []; var cur = id;
      while (revealedBy[cur]) { path.unshift(revealedBy[cur]); cur = revealedBy[cur]; }
      return path;
    }
    function revealAndSelect(id) {
      var targetCap = ownerMap[id];
      if (targetCap && targetCap !== currentCapId) {
        enterGalaxy(targetCap);
      }
      var path = pathToRoot(id);
      path.forEach(function (pid) {
        var n = Physics.getNode(pid);
        if (n && !n.expanded) Physics.toggleExpand(pid, RenderGraph.markDirty);
      });
      Physics.wake();
      setTimeout(function () {
        selectedId = id;
        renderCardFull(id);
        panel.classList.add('open');
        Physics.focusNode(id);
        var foundEl = nodeLayer.querySelector('[data-id="' + id + '"]');
        if (foundEl) {
          foundEl.classList.add('found-highlight');
          setTimeout(function () { foundEl.classList.remove('found-highlight'); }, 2400);
        }
      }, 700);
    }

    // --- pesquisa ---
    var searchBox = document.getElementById('searchBox');
    var searchResults = document.getElementById('searchResults');
    var searchablePeople = Object.keys(defs).filter(function (id) {
      return ['major', 'standard', 'minor'].indexOf(defs[id].kind) !== -1;
    });
    searchBox.addEventListener('input', function () {
      var q = normalize(searchBox.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      var matches = searchablePeople.filter(function (id) { return normalize(defs[id].nome).indexOf(q) !== -1; }).slice(0, 8);
      if (!matches.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = matches.map(function (id) {
        return '<div class="search-result" data-id="' + escapeAttr(id) + '" tabindex="0" role="button" aria-label="' + escapeAttr(defs[id].nome) + '">' + defs[id].nome + '<span class="sr-era">' + defs[id].era + '</span></div>';
      }).join('');
      searchResults.hidden = false;
    });
    function activateSearchResult(row) {
      searchResults.hidden = true;
      searchBox.value = defs[row.getAttribute('data-id')].nome;
      revealAndSelect(row.getAttribute('data-id'));
    }
    searchResults.addEventListener('click', function (ev) {
      var row = ev.target.closest('.search-result');
      if (!row) return;
      activateSearchResult(row);
    });
    searchResults.addEventListener('keydown', function (ev) {
      var row = ev.target.closest('.search-result');
      if (!row) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activateSearchResult(row); }
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search-wrap')) { searchResults.hidden = true; }
    });

    // --- controlos de zoom/reset/recomeçar galáxia ---
    document.getElementById('zoomIn').addEventListener('click', function () { Physics.zoomBy(1.25); requestDraw(); });
    document.getElementById('zoomOut').addEventListener('click', function () { Physics.zoomBy(0.8); requestDraw(); });
    document.getElementById('zoomReset').addEventListener('click', function () { Physics.resetView(); requestDraw(); });
    document.getElementById('collapseAllBtn').addEventListener('click', function () {
      Physics.resetGalaxy(RenderGraph.markDirty);
      Physics.resetView();
      requestDraw();
      selectedId = null;
      panelBody.innerHTML = panelEmptyHtml;
      closePanel();
    });

    // --- pan/zoom/toque (porto direto do mockup, ver
    //     docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html:548-621) ---
    stage.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var rect = stage.getBoundingClientRect();
      var px = (ev.clientX - rect.left) * (W / rect.width);
      var py = (ev.clientY - rect.top) * (H / rect.height);
      Physics.zoomBy(ev.deltaY < 0 ? 1.12 : 0.89, px, py);
      requestDraw();
    }, { passive: false });

    var panning = false, lastX = 0, lastY = 0;
    stage.addEventListener('mousedown', function (ev) {
      if (ev.target.closest('.node')) return;
      panning = true; lastX = ev.clientX; lastY = ev.clientY;
      stage.classList.add('panning');
    });
    window.addEventListener('mousemove', function (ev) {
      if (!panning) return;
      var rect = stage.getBoundingClientRect();
      Physics.panBy((ev.clientX - lastX) * (W / rect.width), (ev.clientY - lastY) * (H / rect.height));
      lastX = ev.clientX; lastY = ev.clientY;
      requestDraw();
    });
    window.addEventListener('mouseup', function () { panning = false; stage.classList.remove('panning'); });

    // --- arranque: mapa de galáxias visível, física a postos mas parada
    // até a primeira galáxia ser aberta ---
    renderGalaxyMap();
    Physics.tick(requestDraw);
    requestDraw();
  }
})();
```

- [ ] **Step 2: Commit**

```bash
git add app.js
git commit -m "feat: orchestrate galaxy map/galaxy view navigation with cross-galaxy jumps"
```

---

### Task 8: Verificação funcional em browser real

**Files:** nenhum (só verificação — sem alterações de código, a menos que a verificação encontre um bug real).

- [ ] **Step 1: Correr os testes automáticos**

Run: `node scripts/test-reveal-graph.js`
Expected: `ALL PASS` (8 blocos `ok:`).

- [ ] **Step 2: Servir a pasta e abrir no Chrome headless via CDP**

Servidor HTTP local a servir a raiz do worktree, Chrome `--headless=new --remote-debugging-port=<porta>`, cliques via `Input.dispatchMouseEvent` (mousePressed+mouseReleased) — nunca `dispatchEvent`/`.click()` sintético.

Verificar, com screenshots reais lidos de volta:
1. Mapa de galáxias aparece no arranque, 7 galáxias com contagens de personagens corretas (não zero).
2. Clicar numa galáxia dispara o salto (streaks visíveis num screenshot a meio da transição) e entra nela — personagens de arranque aparecem, física assenta.
3. Expandir/colapsar uma personagem dentro da galáxia funciona (halo, badge "+", linhas de parentesco).
4. "← Voltar ao mapa" funciona, mostra o mapa de novo, sem nós da galáxia anterior visíveis.
5. Uma ligação "Também aparece em" no cartão de detalhe salta diretamente para a outra galáxia (sem mostrar o mapa geral a meio) e foca a personagem certa.
6. A pesquisa encontra uma personagem de outra galáxia e salta corretamente.
7. Nunca há dois conjuntos de personagens (de galáxias diferentes) visíveis/em movimento ao mesmo tempo.
8. `prefers-reduced-motion: reduce` (via `Emulation.setEmulatedMedia`) desliga os streaks/perspetiva 3D sem quebrar a navegação.

- [ ] **Step 3: Corrigir quaisquer bugs reais encontrados**

Se a verificação encontrar um bug, aplica **systematic-debugging** (raiz antes do fix) e volta a verificar antes de continuar.

- [ ] **Step 4: Parar os processos de verificação**

Mata só os processos Chrome/node que este passo arrancou (por PID específico) — nunca `taskkill //IM chrome.exe` (mata TODAS as janelas Chrome da máquina, incluindo as do utilizador).
