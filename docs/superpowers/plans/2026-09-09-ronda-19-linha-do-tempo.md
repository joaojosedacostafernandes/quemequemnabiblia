# Ronda 19 — Linha do Tempo que Não Te Perde (plano de implementação)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a linha do tempo fisicamente credível (limite elástico, inércia, encaixe), corrigir as setas nos extremos, e ligar a History API para o botão "voltar" do telemóvel voltar à linha do tempo em vez de sair do site.

**Architecture:** A matemática de navegação (limites, índice mais próximo, alvo de encaixe) é extraída para funções puras no topo de `js/timeline.js`, exportadas e testadas em Node. A física animada (inércia + encaixe, animação das setas) vive dentro de `init()` e é verificada em browser real. A History API vive em `app.js`, com todas as entradas de acontecimento a passarem por um único caminho e o `popstate` a conduzir a exibição.

**Tech Stack:** JavaScript ES5 à mão (sem bibliotecas), SVG/CSS, `requestAnimationFrame`, `performance.now()`, History API. Testes: Node puro (`assert`), padrão `scripts/test-*.js` com sandbox `new Function`.

## Global Constraints

- **Zero bibliotecas JS externas.** Só CSS/JS à mão. (verbatim da spec)
- **Zero alterações a `data/personagens.json`** e ao fluxo de edição da Isabel. (verbatim da spec)
- **Manter e elevar o tema espacial**; sem redesign. (verbatim da spec)
- **`prefers-reduced-motion` respeitado** em tudo o que for novo. (verbatim da spec)
- **Node não está no PATH.** Prefixar `node` com: `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64` (verbatim do CLAUDE.md).
- **Servir por `http://`** para verificação (o `fetch` falha em `file://`).
- **Verificação com eventos reais** (CDP `Input.dispatchMouseEvent`/`dispatchTouchEvent`), nunca `.click()` sintético.
- `SPACING = 340` é a distância entre acontecimentos; `railOffset` válido ∈ `[-(n-1)*SPACING, 0]`, onde `railOffset = -idx*SPACING` centra o acontecimento `idx` (0 = primeiro/As Origens).

---

### Task 1: Funções puras de navegação + testes unitários

Extrair a matemática para funções puras no topo do módulo (fora de `init`), exportá-las, e cobri-las com testes Node. Nenhuma mudança de comportamento visível ainda.

**Files:**
- Modify: `js/timeline.js` (topo do módulo, ~linhas 6-9 e a exportação ~linha 138)
- Test: `scripts/test-timeline.js` (criar)

**Interfaces:**
- Produces (todas puras, ao nível do módulo, dependem de `SPACING`):
  - `boundsFor(n) -> { min: number, max: number }`
  - `nearestIndex(offset, n) -> number` (inteiro em `[0, n-1]`)
  - `snapTarget(offset, n) -> number` (o `railOffset` que centra o índice mais próximo)
  - `clampHard(raw, n) -> number` (preso a `[min, max]`)
  - `clampElastic(raw, n) -> number` (dentro dos limites devolve `raw`; além, comprime o excesso a 1/3)
  - Exportadas em `Timeline` (e via `window.Timeline`) a par de `SPACING`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `scripts/test-timeline.js`:

```js
const assert = require('assert');
const path = require('path');
const fs = require('fs');
// timeline.js expõe-se em `window` no browser; em Node carregamo-lo num
// sandbox (as funções de navegação são puras, não tocam no DOM).
const src = fs.readFileSync(path.join(__dirname, '../js/timeline.js'), 'utf8');
const sandbox = {};
new Function('window', 'module', src)(sandbox, undefined);
const T = sandbox.Timeline;
const S = T.SPACING;

assert.strictEqual(S, 340, 'SPACING esperado = 340');

// boundsFor: primeiro acontecimento em 0, último em -(n-1)*SPACING
assert.deepStrictEqual(T.boundsFor(40), { min: -39 * S, max: 0 });
assert.deepStrictEqual(T.boundsFor(1), { min: 0, max: 0 });

// nearestIndex: arredonda e prende a [0, n-1]
assert.strictEqual(T.nearestIndex(0, 40), 0);
assert.strictEqual(T.nearestIndex(-S, 40), 1);
assert.strictEqual(T.nearestIndex(-S * 1.4, 40), 1);
assert.strictEqual(T.nearestIndex(-S * 1.6, 40), 2);
assert.strictEqual(T.nearestIndex(50, 40), 0, 'offset positivo prende ao primeiro');
assert.strictEqual(T.nearestIndex(-99999, 40), 39, 'muito além prende ao último');

// snapTarget: o offset que centra o índice mais próximo
assert.strictEqual(T.snapTarget(-S * 1.4, 40), -S);
assert.strictEqual(T.snapTarget(-S * 1.6, 40), -2 * S);

// clampHard: nunca sai dos limites
assert.strictEqual(T.clampHard(100, 40), 0);
assert.strictEqual(T.clampHard(-1e9, 40), -39 * S);
assert.strictEqual(T.clampHard(-S, 40), -S);

// clampElastic: dentro devolve igual; além comprime o excesso a 1/3
assert.strictEqual(T.clampElastic(-S, 40), -S);
assert.strictEqual(T.clampElastic(300, 40), 100, 'excesso acima do max/3');
assert.strictEqual(T.clampElastic(-39 * S - 300, 40), -39 * S - 100, 'excesso abaixo do min/3');

console.log('ALL PASS');
```

- [ ] **Step 2: Correr o teste e confirmar que falha**

Run: `"C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64\node.exe" scripts/test-timeline.js`
Expected: FALHA (ex.: `TypeError: T.boundsFor is not a function` ou `SPACING` indefinido em `Timeline`).

- [ ] **Step 3: Implementar as funções puras**

No topo de `js/timeline.js`, a seguir a `var SPACING = 340;` e `var WAVE_AMP = 30;`, acrescentar (antes de `function markerY`):

```js
  function boundsFor(n) { return { min: -(n - 1) * SPACING, max: 0 }; }
  function nearestIndex(offset, n) {
    return Math.max(0, Math.min(n - 1, Math.round(-offset / SPACING)));
  }
  function snapTarget(offset, n) { return -nearestIndex(offset, n) * SPACING; }
  function clampHard(raw, n) {
    var b = boundsFor(n);
    return Math.max(b.min, Math.min(b.max, raw));
  }
  function clampElastic(raw, n) {
    var b = boundsFor(n);
    if (raw > b.max) return b.max + (raw - b.max) / 3;
    if (raw < b.min) return b.min + (raw - b.min) / 3;
    return raw;
  }
```

E na exportação, trocar a linha `var Timeline = { init: init };` por:

```js
  var Timeline = {
    init: init,
    SPACING: SPACING,
    boundsFor: boundsFor,
    nearestIndex: nearestIndex,
    snapTarget: snapTarget,
    clampHard: clampHard,
    clampElastic: clampElastic
  };
```

- [ ] **Step 4: Correr os testes e confirmar que passam**

Run: `"C:\...\node.exe" scripts/test-timeline.js`
Expected: `ALL PASS`.
Correr também o suite existente para garantir que nada partiu: `"C:\...\node.exe" scripts/test-event-graph.js` → `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add js/timeline.js scripts/test-timeline.js
git commit -m "feat(ronda19): funções puras de navegação da linha do tempo + testes"
```

---

### Task 2: Limite elástico no arrasto, roda e teclas de scroll

Aplicar `clampElastic` durante o arrasto/roda (para o offset nunca voar para o vazio) e prender `jumpTo` com `clampHard`. Ainda sem inércia (isso é a Task 3) — ao largar, o offset fica onde está mas dentro dos limites elásticos.

**Files:**
- Modify: `js/timeline.js` (dentro de `init`: handlers de `mousemove`, `touchmove`, `wheel`, `jumpTo`)

**Interfaces:**
- Consumes: `clampElastic`, `clampHard`, `boundsFor` (Task 1).

- [ ] **Step 1: Aplicar clamp elástico ao arrasto de rato**

Em `js/timeline.js`, no handler `window.addEventListener('mousemove', ...)`, trocar a linha:

```js
      railOffset = dragStartOffset + (e.clientX - dragStartX);
```

por:

```js
      railOffset = clampElastic(dragStartOffset + (e.clientX - dragStartX), events.length);
```

- [ ] **Step 2: Aplicar clamp elástico ao arrasto tátil**

No handler `view.addEventListener('touchmove', ...)`, trocar:

```js
      railOffset = dragStartOffset + (e.touches[0].clientX - dragStartX);
```

por:

```js
      railOffset = clampElastic(dragStartOffset + (e.touches[0].clientX - dragStartX), events.length);
```

- [ ] **Step 3: Aplicar clamp elástico à roda do rato**

No handler `view.addEventListener('wheel', ...)`, trocar:

```js
      railOffset -= (e.deltaY || e.deltaX);
      applyOffset();
```

por:

```js
      railOffset = clampElastic(railOffset - (e.deltaY || e.deltaX), events.length);
      applyOffset();
```

- [ ] **Step 4: Prender `jumpTo` aos limites**

Trocar o corpo de `jumpTo`:

```js
    function jumpTo(idx) {
      railOffset = -idx * SPACING;
      applyOffset();
    }
```

por:

```js
    function jumpTo(idx) {
      railOffset = clampHard(-idx * SPACING, events.length);
      applyOffset();
    }
```

- [ ] **Step 5: Verificar em browser real**

Servir a pasta por `http://` (skill `run` ou servidor estático Node) e abrir em Chrome headless via CDP. Arrastar a linha do tempo fortemente para a direita (para lá de As Origens) e para a esquerda (para lá do Apocalipse). Confirmar: o conteúdo resiste (o excesso é comprimido, não desliza livre) e há sempre marcadores visíveis; nunca aparece só o fundo estrelado vazio. Registar o resultado.

- [ ] **Step 6: Commit**

```bash
git add js/timeline.js
git commit -m "feat(ronda19): limite elástico no arrasto/roda da linha do tempo"
```

---

### Task 3: Inércia + encaixe (snap) ao largar

Ao largar o arrasto, a calha continua com inércia (decaimento) e encaixa no acontecimento mais próximo; se estiver além dos limites, faz "spring back". Uma única cadeia de `requestAnimationFrame`, cancelável, partilhada.

**Files:**
- Modify: `js/timeline.js` (dentro de `init`: variáveis de estado, `mousedown`/`touchstart`, `mousemove`/`touchmove`, `mouseup`/`touchend`)

**Interfaces:**
- Consumes: `boundsFor`, `snapTarget` (Task 1).
- Produces (locais a `init`): `settleFromVelocity()`, `animateTo(to, dur)`, variável `momentumRAF`, `velocity`.

- [ ] **Step 1: Acrescentar estado de velocidade e o motor de animação**

Em `js/timeline.js`, logo a seguir à declaração `var dragging = false, dragStartX = 0, dragStartOffset = 0;`, acrescentar:

```js
    var lastX = 0, lastT = 0, velocity = 0, momentumRAF = null;
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function cancelMomentum() { if (momentumRAF) { cancelAnimationFrame(momentumRAF); momentumRAF = null; } }

    function animateTo(to, dur) {
      cancelMomentum();
      if (reduceMotion) { railOffset = to; applyOffset(); return; }
      var from = railOffset, start = performance.now();
      dur = dur || 320;
      function anim(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3); // easeOutCubic
        railOffset = from + (to - from) * e;
        applyOffset();
        if (t < 1) momentumRAF = requestAnimationFrame(anim); else momentumRAF = null;
      }
      momentumRAF = requestAnimationFrame(anim);
    }

    function settleFromVelocity() {
      cancelMomentum();
      var b = boundsFor(events.length);
      if (reduceMotion) { animateTo(snapTarget(railOffset, events.length)); return; }
      var v = velocity * 16; // px por frame (~16ms)
      function step() {
        v *= 0.94;
        railOffset += v;
        if (railOffset > b.max) { railOffset += (b.max - railOffset) * 0.2; v *= 0.5; }
        else if (railOffset < b.min) { railOffset += (b.min - railOffset) * 0.2; v *= 0.5; }
        applyOffset();
        var outOfBounds = railOffset > b.max + 0.5 || railOffset < b.min - 0.5;
        if (Math.abs(v) > 0.4 || outOfBounds) {
          momentumRAF = requestAnimationFrame(step);
        } else {
          animateTo(snapTarget(railOffset, events.length)); // encaixe final
        }
      }
      momentumRAF = requestAnimationFrame(step);
    }
```

- [ ] **Step 2: Cancelar inércia e iniciar registo de velocidade no `mousedown`**

No handler `view.addEventListener('mousedown', ...)`, a seguir a `view.classList.add('dragging');`, acrescentar:

```js
      cancelMomentum();
      lastX = e.clientX; lastT = performance.now(); velocity = 0;
```

- [ ] **Step 3: Registar velocidade durante o `mousemove`**

No handler `window.addEventListener('mousemove', ...)`, a seguir à linha que atualiza `railOffset` (a que já usa `clampElastic`, da Task 2), acrescentar antes de `applyOffset();`:

```js
      var nowT = performance.now(), dt = nowT - lastT;
      if (dt > 0) velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX; lastT = nowT;
```

- [ ] **Step 4: Disparar o assentamento no `mouseup`**

Trocar o handler:

```js
    window.addEventListener('mouseup', function () { dragging = false; view.classList.remove('dragging'); });
```

por:

```js
    window.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false; view.classList.remove('dragging');
      settleFromVelocity();
    });
```

- [ ] **Step 5: Replicar para toque (start/move/end)**

No `touchstart`, a seguir a `view.classList.add('dragging');`:

```js
      cancelMomentum();
      lastX = e.touches[0].clientX; lastT = performance.now(); velocity = 0;
```

No `touchmove`, a seguir à linha que atualiza `railOffset` (com `clampElastic`), antes de `applyOffset();`:

```js
      var nowT2 = performance.now(), dt2 = nowT2 - lastT;
      if (dt2 > 0) velocity = (e.touches[0].clientX - lastX) / dt2;
      lastX = e.touches[0].clientX; lastT = nowT2;
```

Trocar `touchend`:

```js
    window.addEventListener('touchend', function () { dragging = false; view.classList.remove('dragging'); });
```

por:

```js
    window.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false; view.classList.remove('dragging');
      settleFromVelocity();
    });
```

(O `touchcancel` mantém-se como está — cancelamento bruto sem inércia.)

- [ ] **Step 6: Verificar em browser real**

Servir e abrir via CDP. (a) Um arrasto rápido com "atirão" (flick) deve continuar por inércia e parar sempre com um acontecimento centrado (nunca a meio caminho). (b) Arrastar para lá do extremo e largar deve "voltar" suavemente para dentro dos limites e encaixar no primeiro/último. (c) Com `prefers-reduced-motion: reduce` (emular via CDP `Emulation.setEmulatedMedia`), largar deve encaixar instantaneamente sem inércia. Registar os três resultados.

- [ ] **Step 7: Commit**

```bash
git add js/timeline.js
git commit -m "feat(ronda19): inércia + encaixe no acontecimento ao largar o arrasto"
```

---

### Task 4: Setas/pontos animados e desativados nos extremos

As setas do menu inferior passam a animar (usam `animateTo`) e ficam `disabled` no primeiro/último acontecimento; os pontos de progresso também animam. O estado desativado é recalculado a cada frame em `applyOffset`, servindo também a navegação dentro de um acontecimento (um botão desativado não emite clique, por isso `app.js` fica protegido nos extremos de graça).

**Files:**
- Modify: `js/timeline.js` (dentro de `init`: `applyOffset`, handlers das setas, handler dos dots, `renderProgressDots`)
- Modify: `style.css` (estado `:disabled` das setas)

**Interfaces:**
- Consumes: `animateTo` (Task 3), `nearestIndex` (Task 1).
- Produces (local a `init`): `stepEvent(delta)`, `updateArrowState()`.

- [ ] **Step 1: Acrescentar `stepEvent` e `updateArrowState`**

Em `js/timeline.js`, dentro de `init`, a seguir a `applyOffset`, acrescentar:

```js
    function updateArrowState() {
      var idx = nearestIndex(railOffset, events.length);
      if (opts.scrollLeftBtn) opts.scrollLeftBtn.disabled = (idx <= 0);
      if (opts.scrollRightBtn) opts.scrollRightBtn.disabled = (idx >= events.length - 1);
    }
    function stepEvent(delta) {
      var idx = nearestIndex(railOffset, events.length);
      var target = Math.max(0, Math.min(events.length - 1, idx + delta));
      animateTo(-target * SPACING);
    }
```

- [ ] **Step 2: Recalcular o estado das setas a cada `applyOffset`**

No fim de `function applyOffset()`, a seguir ao `forEach` que marca o dot ativo, acrescentar:

```js
      updateArrowState();
```

- [ ] **Step 3: Ligar as setas ao `stepEvent` animado**

Trocar os dois handlers das setas:

```js
    if (opts.scrollLeftBtn) opts.scrollLeftBtn.addEventListener('click', function () {
      if (opts.isSuspended && opts.isSuspended()) return;
      railOffset += SPACING; applyOffset();
    });
    if (opts.scrollRightBtn) opts.scrollRightBtn.addEventListener('click', function () {
      if (opts.isSuspended && opts.isSuspended()) return;
      railOffset -= SPACING; applyOffset();
    });
```

por:

```js
    if (opts.scrollLeftBtn) opts.scrollLeftBtn.addEventListener('click', function () {
      if (opts.isSuspended && opts.isSuspended()) return;
      stepEvent(-1);
    });
    if (opts.scrollRightBtn) opts.scrollRightBtn.addEventListener('click', function () {
      if (opts.isSuspended && opts.isSuspended()) return;
      stepEvent(1);
    });
```

- [ ] **Step 4: Animar o clique nos pontos de progresso**

No `renderProgressDots`, trocar o corpo do listener do dot:

```js
        dot.addEventListener('click', function () {
          if (opts.isSuspended && opts.isSuspended()) return;
          railOffset = -parseInt(dot.getAttribute('data-idx'), 10) * SPACING;
          applyOffset();
        });
```

por:

```js
        dot.addEventListener('click', function () {
          if (opts.isSuspended && opts.isSuspended()) return;
          animateTo(-parseInt(dot.getAttribute('data-idx'), 10) * SPACING);
        });
```

- [ ] **Step 5: Estilo do estado desativado das setas**

Em `style.css`, a seguir à regra `.scroll-arrows button:hover, .zoom-controls button:hover { ... }` (linha ~82), acrescentar:

```css
.scroll-arrows button:disabled { opacity: .3; cursor: default; pointer-events: none; }
```

- [ ] **Step 6: Verificar em browser real**

Servir e abrir via CDP. (a) No primeiro acontecimento, a seta esquerda está esbatida/inativa; no último, a direita. (b) Clicar numa seta desliza suavemente um acontecimento (não salta). (c) Clicar num ponto de progresso desliza até esse acontecimento. (d) Dentro de um acontecimento, no primeiro/último, a seta correspondente do menu está inativa e não faz nada (protege o `gotoAdjacentEvent` de `app.js`). Registar.

- [ ] **Step 7: Commit**

```bash
git add js/timeline.js style.css
git commit -m "feat(ronda19): setas/pontos animados e desativados nos extremos"
```

---

### Task 5: History API — o botão "voltar" volta à linha do tempo

Todas as entradas de acontecimento passam por um caminho único que empurra estado no histórico; o `popstate` conduz a exibição (entrar no acontecimento do hash, ou sair para a linha do tempo). O botão "voltar" do browser/telemóvel e o `backBtn` da app usam `history.back()`. Deep-links (`#exodo`) abrem direto no acontecimento, com uma base de linha do tempo por baixo para o "voltar" nunca sair do site.

**Files:**
- Modify: `app.js` (`enterEvent`, `exitToTimeline`/`backBtn`, `jumpToPersonagem`, `init` — bloco final)

**Interfaces:**
- Consumes: `enterEvent(ev, clickX, clickY)` já existente; `events`, `currentEvent`.
- Produces: `enterEvent(ev, clickX, clickY, fromHistory)` (parâmetro novo), `exitVisual(originXFrac, originYFrac)`, `enterEventCentered(ev, fromHistory)`, handler `popstate`.

- [ ] **Step 1: Acrescentar `fromHistory` a `enterEvent` e empurrar estado**

Em `app.js`, trocar a assinatura e o fim de `enterEvent`. Assinatura:

```js
    function enterEvent(ev, clickX, clickY) {
```

por:

```js
    function enterEvent(ev, clickX, clickY, fromHistory) {
```

E na última linha do corpo, a seguir a `requestAnimationFrame(function () { eventView.classList.add('shown'); });`, antes do `}` que fecha a função, acrescentar:

```js
      if (!fromHistory) {
        try { history.pushState({ ev: ev.id }, '', '#' + ev.id); } catch (e) {}
      }
```

- [ ] **Step 2: Extrair `exitVisual` e redirecionar o `backBtn` para `history.back()`**

Trocar todo o bloco atual:

```js
    function exitToTimeline(e) {
      var stageEl = document.querySelector('.stage');
      var rect = stageEl.getBoundingClientRect();
      var fx = (e.clientX - rect.left) / rect.width, fy = (e.clientY - rect.top) / rect.height;
      var originPct = (fx * 100).toFixed(1) + '% ' + (fy * 100).toFixed(1) + '%';
      timelineView.style.transformOrigin = originPct;
      eventView.style.transformOrigin = originPct;
      WarpTransition.trigger(fx, fy, currentEvent ? currentEvent.tint : '#f0d060');
      eventView.classList.remove('shown');
      timelineView.classList.remove('diving');
      document.body.classList.remove('in-event');
      scrollHintText.textContent = 'arrasta a linha do tempo';
    }
    backBtn.addEventListener('click', exitToTimeline);
```

por:

```js
    // Parte visual da saída — sem tocar no histórico. `fx`/`fy` são frações
    // (0..1) da stage; por omissão o centro (usado quando a saída vem do
    // teclado ou do `popstate`, que não têm coordenadas de clique).
    function exitVisual(fx, fy) {
      if (typeof fx !== 'number') fx = 0.5;
      if (typeof fy !== 'number') fy = 0.5;
      var originPct = (fx * 100).toFixed(1) + '% ' + (fy * 100).toFixed(1) + '%';
      timelineView.style.transformOrigin = originPct;
      eventView.style.transformOrigin = originPct;
      WarpTransition.trigger(fx, fy, currentEvent ? currentEvent.tint : '#f0d060');
      eventView.classList.remove('shown');
      timelineView.classList.remove('diving');
      document.body.classList.remove('in-event');
      scrollHintText.textContent = 'arrasta a linha do tempo';
      currentEvent = null;
      panel.classList.remove('open');
    }
    // O botão "voltar" da app recua no histórico; o `popstate` faz a saída
    // visual — assim o botão "voltar" do telemóvel e o da app são o mesmo.
    backBtn.addEventListener('click', function () { history.back(); });
```

- [ ] **Step 3: Entrar centrado + handler `popstate`**

A seguir ao novo bloco do backBtn, acrescentar:

```js
    function enterEventCentered(ev, fromHistory) {
      var rect = document.querySelector('.stage').getBoundingClientRect();
      enterEvent(ev, rect.left + rect.width / 2, rect.top + rect.height / 2, fromHistory);
    }
    function eventById(id) {
      for (var i = 0; i < events.length; i++) if (events[i].id === id) return events[i];
      return null;
    }
    window.addEventListener('popstate', function () {
      var id = location.hash ? location.hash.slice(1) : '';
      if (!id) {
        if (currentEvent) exitVisual();
        return;
      }
      var ev = eventById(id);
      if (ev && (!currentEvent || currentEvent.id !== ev.id)) enterEventCentered(ev, true);
    });
```

- [ ] **Step 4: `jumpToPersonagem` empurra estado pelo caminho normal**

Em `jumpToPersonagem`, a chamada existente `enterEvent(targetEvent, cx, cy);` já empurra estado (sem `fromHistory`) — confirmar que continua a passar só 3 argumentos (logo `fromHistory` fica `undefined` → empurra). Nenhuma alteração de código; marcar após confirmação visual no Step 6.

- [ ] **Step 5: Deep-link inicial + base de histórico**

No fim de `init`, imediatamente antes do bloco `if (document.fonts && document.fonts.ready) {`, acrescentar:

```js
    // Base de linha do tempo no histórico, para o "voltar" nunca sair do
    // site — mesmo quando se entra por deep-link (#id) já dentro de um
    // acontecimento.
    try { history.replaceState({}, '', location.pathname + location.search); } catch (e) {}
    if (location.hash) {
      var initEv = eventById(location.hash.slice(1));
      if (initEv) enterEventCentered(initEv, false);
    }
```

- [ ] **Step 6: Verificar em browser real**

Servir e abrir via CDP. (a) Entrar num acontecimento pelo marcador → o URL ganha `#<id>`; carregar no "voltar" do browser (CDP `Page.navigate` para trás, ou `history.back()` disparado por evento real de botão do browser) volta à linha do tempo com o warp a partir do centro, sem sair do site. (b) Navegar acontecimento→acontecimento pelas setas e depois "voltar" recua um acontecimento de cada vez. (c) Abrir diretamente `http://<host>/#exodo` entra logo no Êxodo, e "voltar" leva à linha do tempo (não sai do site). (d) Pesquisar uma personagem noutro acontecimento e "voltar" recua corretamente. Registar todos.

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat(ronda19): History API — botão voltar volta à linha do tempo + deep-links"
```

---

## Verificação final da Ronda (antes do merge)

- [ ] `"C:\...\node.exe" scripts/test-timeline.js` → `ALL PASS`
- [ ] `"C:\...\node.exe" scripts/test-event-graph.js` → `ALL PASS`
- [ ] Revisão de branch inteira por subagente (preferir `opus`), como nas rondas anteriores.
- [ ] `git diff --stat` confirma que `data/` **não** foi tocado.
- [ ] Verificação de toque real (idealmente em dispositivo físico, mas no mínimo emulação CDP): flick com inércia, encaixe, e "voltar" do telemóvel.
- [ ] Merge para `master` via `superpowers:finishing-a-development-branch`; `git worktree remove` + `git branch -d`.
- [ ] Atualizar `handover.md` (Ronda 19) e a memória do projeto.

## Notas de convenção

- Cada `git commit` acima leva os trailers exigidos pelo repositório (`Co-Authored-By:` e `Claude-Session:`) — omitidos nos snippets por brevidade.
- Execução num **git worktree isolado** (skill `superpowers:using-git-worktrees`), nunca diretamente em `master`.

## Auto-revisão (writing-plans)

- **Cobertura da spec (Ronda 19):** limite elástico ✓ (Task 2), inércia+snap ✓ (Task 3), setas desativadas nos extremos ✓ (Task 4), History API + deep-links + fallback de origem central ✓ (Task 5). Todos os pontos da secção "Ronda 19" da spec têm tarefa.
- **Placeholders:** nenhum — todo o código está escrito por extenso.
- **Consistência de tipos/nomes:** `boundsFor`/`nearestIndex`/`snapTarget`/`clampHard`/`clampElastic` definidos na Task 1 e usados com a mesma assinatura nas Tasks 2-4; `animateTo`/`cancelMomentum`/`settleFromVelocity` definidos na Task 3 e usados na Task 4; `enterEvent(...,fromHistory)`/`exitVisual`/`enterEventCentered`/`eventById` coerentes na Task 5.
