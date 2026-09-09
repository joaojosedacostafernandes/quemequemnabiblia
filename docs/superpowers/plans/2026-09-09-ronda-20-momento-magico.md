# Ronda 20 — O Momento Mágico (plano de implementação)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a entrada num acontecimento no momento memorável da app — personagens que entram em cascata, linhas de família que se traçam, e feedback tátil imediato em cada toque — sem redesenhar o tema nem tocar nos dados.

**Architecture:** As animações de entrada vivem em `js/event-graph.js` (o `render` calcula um atraso por personagem e por linha) + `style.css` (keyframes). O feedback tátil e o polimento de motion são CSS. O cross-fade do painel é em `app.js`. A coreografia do warp é um ajuste em `js/warp-transition.js`. Tudo respeita `prefers-reduced-motion`.

**Tech Stack:** JavaScript ES5 à mão (sem bibliotecas), CSS animations/transitions, SVG `stroke-dasharray`/`getTotalLength`.

## Global Constraints

- **Zero bibliotecas JS externas.** Só CSS/JS à mão. (verbatim da spec)
- **Zero alterações a `data/personagens.json`** e ao fluxo de edição da Isabel. (verbatim da spec)
- **Manter e elevar o tema espacial**; sem redesign. (verbatim da spec)
- **`prefers-reduced-motion` respeitado** em tudo o que for novo — cascata e traçado de linhas ficam instantâneos, sem animação. (verbatim da spec)
- **Node não está no PATH.** Prefixar `node` com: `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64` (ou o `node` do sistema se esse caminho não existir).
- **Verificação em browser** é feita centralmente pelo controlador (Chrome headless/CDP) — os subagentes fazem código + auto-revisão + `node --check`, e registam que a verificação visual/tátil fica deferida.
- **Nenhum nome de personagem pode ser cortado** (manter a garantia da Ronda 16 — não mexer no cálculo de largura de coluna).

## Decisão de arquitetura registada

A spec listava "`floatChar` via `transform` (perf)". **Não se faz:** a animação de entrada (`charEnter`) e a centragem já usam `transform` em `.char`, e o flutuar perpétuo tem de coexistir com ambos. `transform` e `margin-top` são propriedades diferentes, por isso `charEnter` (transform) e `floatChar` (margin-top) coexistem no mesmo elemento sem conflito. Manter `floatChar` em `margin-top` é a opção correta; o custo de layout é irrelevante para ≤14 personagens. Esta é uma decisão deliberada que supera a linha "via transform" da spec.

---

### Task 1: Feedback tátil universal + polimento de motion (CSS)

Estados `:active` (squash + brilho) em personagens, marcadores e botões — resolve o "toquei e não aconteceu nada" em ecrã tátil, onde `:hover` não dispara. Desincroniza o `ringPulse` dos marcadores.

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Squash + pop nos orbes de personagem**

A seguir à regra `.char:hover .char-orb, .char:focus-visible .char-orb { transform: scale(1.14); }`, acrescentar:
```css
.char:active .char-orb { transform: scale(.9); box-shadow: 0 0 0 3px rgba(240,208,96,.55), 0 4px 14px rgba(0,0,0,.5), 0 0 26px 8px rgba(240,208,96,.45); }
```

- [ ] **Step 2: Feedback nos marcadores da linha do tempo**

A seguir à regra `.event-marker:hover .event-dot, .event-marker:focus-visible .event-dot { transform: scale(1.3); }`, acrescentar:
```css
.event-marker:active .event-dot { transform: scale(1.12); }
.event-marker:active .event-avatar { transform: translateY(-3px) scale(.96); }
```

- [ ] **Step 3: Feedback nos botões de controlo**

A seguir à regra `.scroll-arrows button:disabled { ... }` (acrescentada na Ronda 19), acrescentar:
```css
.scroll-arrows button, .zoom-controls button, .back-btn, .panel-close { transition: transform .12s ease, border-color .2s, background .2s, color .2s; }
.scroll-arrows button:active, .zoom-controls button:active, .back-btn:active, .panel-close:active { transform: scale(.88); }
.progress-dot:active { transform: scale(1.4); }
```

- [ ] **Step 4: Desincronizar o `ringPulse` dos marcadores**

A seguir ao `@keyframes ringPulse { ... }`, acrescentar (os marcadores são `<button>`, o `railSvg` é `<svg>`, por isso `:nth-of-type` conta só marcadores):
```css
.event-marker:nth-of-type(2n) .event-dot-ring { animation-delay: -1.1s; }
.event-marker:nth-of-type(3n) .event-dot-ring { animation-delay: -2.3s; }
.event-marker:nth-of-type(5n) .event-dot-ring { animation-delay: -0.6s; }
```

- [ ] **Step 5: Verificar e commit**

Verificação visual/tátil deferida ao controlador. Confirmar que o CSS é válido (sem chavetas por fechar) relendo o `git diff`.
```bash
git add style.css
git commit -m "feat(ronda20): feedback tátil (:active) em personagens/marcadores/botões + ringPulse desync"
```

---

### Task 2: Cross-fade no painel de detalhe

Trocar de personagem deixa de "piscar" — o conteúdo novo aparece com um fade rápido.

**Files:**
- Modify: `style.css` (transição do `#panelBody`)
- Modify: `app.js` (função `focusChar`)

- [ ] **Step 1: Transição de opacidade no painel**

Em `style.css`, a seguir à regra `.panel-empty { ... }`, acrescentar:
```css
#panelBody { transition: opacity .18s ease; }
```

- [ ] **Step 2: Fade-in ao trocar de personagem**

Em `app.js`, na função `focusChar`, a atribuição atual é `panelBody.innerHTML = ...;` seguida da ligação dos handlers (`.family-chip`, `.cross-event-ref`) e no fim `panel.classList.add('open');`. Trocar a linha:
```js
      panel.classList.add('open');
```
por:
```js
      // fade-in do conteúdo novo (o conteúdo antigo é substituído já invisível)
      panelBody.style.opacity = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { panelBody.style.opacity = ''; });
      });
      panel.classList.add('open');
```
E imediatamente ANTES de `panelBody.innerHTML =` (a atribuição grande que começa `panelBody.innerHTML =\n        portrait +`), acrescentar:
```js
      panelBody.style.opacity = '0';
```
(Assim o conteúdo antigo desaparece no mesmo instante em que o novo é escrito, e o novo entra em fade.)

- [ ] **Step 3: Verificar e commit**

`node --check app.js` sem erros (colar no report). Verificação visual deferida ao controlador.
```bash
git add app.js style.css
git commit -m "feat(ronda20): cross-fade do conteúdo do painel ao trocar de personagem"
```

---

### Task 3: Cascata de entrada dos personagens

Ao abrir um acontecimento, os personagens entram em cascata (pais primeiro, filhos a seguir, com leve overshoot) em vez de aparecerem todos de uma vez.

**Files:**
- Modify: `js/event-graph.js` (topo do módulo: helper de reduced-motion; dentro de `render`: cálculo do atraso por personagem e aplicação inline)
- Modify: `style.css` (keyframe `charEnter`, animação do `.char`, bloco `prefers-reduced-motion`)

**Interfaces:**
- Consumes: `layout.gen`, `layout.slot`, `rowIds` (já calculados em `render`).
- Produces: `prefersReduce()` (helper de módulo).

- [ ] **Step 1: Helper de reduced-motion no módulo**

Em `js/event-graph.js`, a seguir à linha `var LABEL_FONT = "600 15px 'Cormorant Garamond', Georgia, serif";`, acrescentar:
```js
  function prefersReduce() {
    return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
```

- [ ] **Step 2: Calcular o atraso de entrada por personagem**

Em `render`, a seguir ao bloco que calcula `rowColWidthPct` (termina no `});` do `Object.keys(rowIds).forEach`), acrescentar:
```js
    // Atraso de entrada por personagem: por geração (pais primeiro) e, dentro
    // da geração, da esquerda para a direita (ordem de slot).
    var enterDelay = {};
    var reduce = prefersReduce();
    Object.keys(rowIds).forEach(function (g) {
      var ordered = rowIds[g].slice().sort(function (a, b) { return layout.slot[a] - layout.slot[b]; });
      ordered.forEach(function (id, i) {
        enterDelay[id] = reduce ? 0 : (parseInt(g, 10) * 120 + i * 40);
      });
    });
```

- [ ] **Step 3: Aplicar o atraso ao criar cada botão**

Em `render`, no bloco final `ids.forEach(function (id) { ... })` que cria os botões, trocar a linha:
```js
      btn.style.animationDelay = (Math.random() * -7).toFixed(2) + 's';
```
por:
```js
      // duas animações em .char: charEnter (entrada, uma vez) e floatChar
      // (flutuar, perpétuo). A lista de delays casa com a ordem em `animation`.
      var floatDelay = (Math.random() * -7).toFixed(2);
      btn.style.animationDelay = enterDelay[id] + 'ms, ' + floatDelay + 's';
```

- [ ] **Step 4: Keyframe e animação no CSS**

Em `style.css`, na regra `.char { ... }`, trocar:
```css
animation: floatChar 7s ease-in-out infinite;
```
por:
```css
animation: charEnter .55s cubic-bezier(.34, 1.56, .64, 1) both, floatChar 7s ease-in-out infinite;
```
E a seguir ao `@keyframes floatChar { ... }`, acrescentar:
```css
@keyframes charEnter {
  from { opacity: 0; transform: translate(-50%, -50%) scale(.3); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
```

- [ ] **Step 5: Respeitar reduced-motion no CSS**

No fim de `style.css`, dentro do ficheiro (a seguir ao `@media (max-width: 720px) { ... }`), acrescentar:
```css
@media (prefers-reduced-motion: reduce) {
  .char { animation: none; opacity: 1; }
  .event-dot-ring { animation: none; }
  .nebula { animation: none; }
}
```

- [ ] **Step 6: Testes, verificação e commit**

`node scripts/test-event-graph.js` → `ALL PASS` (a lógica pura de família/layout não muda; só confirma que nada partiu). Verificação visual deferida ao controlador (confirmar que os personagens ainda são criados e clicáveis).
```bash
git add js/event-graph.js style.css
git commit -m "feat(ronda20): cascata de entrada dos personagens (pais→filhos, com overshoot)"
```

---

### Task 4: Linhas de família a traçarem-se

As linhas (casamento, descendência, irmãos) desenham-se progressivamente, alinhadas com a geração a que ligam, em vez de já estarem lá.

**Files:**
- Modify: `js/event-graph.js` (função `drawLine` guarda a geração; nova passagem de animação no fim de `render`)

**Interfaces:**
- Consumes: `prefersReduce()` (Task 3), `charLinesEl`, `layout.gen`.

- [ ] **Step 1: `drawLine` guarda a geração da linha**

Em `js/event-graph.js`, trocar a função `drawLine`:
```js
    function drawLine(a, b, cls) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', a.x + '%'); line.setAttribute('y1', a.y + '%');
      line.setAttribute('x2', b.x + '%'); line.setAttribute('y2', b.y + '%');
      line.setAttribute('class', 'cline' + (cls ? ' ' + cls : ''));
      charLinesEl.appendChild(line);
    }
```
por (parâmetro `gen` opcional, guardado como atributo):
```js
    function drawLine(a, b, cls, gen) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', a.x + '%'); line.setAttribute('y1', a.y + '%');
      line.setAttribute('x2', b.x + '%'); line.setAttribute('y2', b.y + '%');
      line.setAttribute('class', 'cline' + (cls ? ' ' + cls : ''));
      if (gen != null) line.setAttribute('data-gen', gen);
      charLinesEl.appendChild(line);
    }
```

- [ ] **Step 2: Passar a geração em cada chamada a `drawLine`**

Nas chamadas existentes dentro de `render`, acrescentar o 4º argumento:
- Nas duas linhas de casamento (dentro do `family.casais.forEach`):
```js
      drawLine(a, { x: ux, y: uy }, 'casamento', layout.gen[pair[0]]);
      drawLine(b, { x: ux, y: uy }, 'casamento', layout.gen[pair[0]]);
```
- Nas linhas de filhos (dentro do `family.filhos.forEach`), a chamada da união:
```js
        if (u) drawLine(u, childPos, '', layout.gen[f.filho]);
```
  e a chamada do progenitor único:
```js
        if (p) drawLine(p, childPos, '', layout.gen[f.filho]);
```
- Na linha de irmãos (dentro do `family.irmaos.forEach`):
```js
      if (a && b) drawLine(a, b, 'weak', layout.gen[pair[0]]);
```

- [ ] **Step 3: Passagem de animação de traçado no fim de `render`**

Em `render`, imediatamente ANTES de `return family;`, acrescentar:
```js
    // Traçar as linhas progressivamente, alinhadas com a geração a que ligam
    // (as de gerações mais baixas desenham-se depois, a acompanhar a cascata
    // dos personagens). Desligado sob prefers-reduced-motion.
    if (!reduce) {
      var lineEls = charLinesEl.querySelectorAll('.cline');
      Array.prototype.forEach.call(lineEls, function (ln) {
        var L = ln.getTotalLength();
        ln.style.strokeDasharray = L;
        ln.style.strokeDashoffset = L;
        ln.style.transition = 'none';
      });
      charLinesEl.getBoundingClientRect(); // força reflow para o estado inicial "pegar"
      Array.prototype.forEach.call(lineEls, function (ln) {
        var g = parseInt(ln.getAttribute('data-gen') || '0', 10);
        var delay = g * 120 + 120; // ligeiramente depois do nó dessa geração
        ln.style.transition = 'stroke-dashoffset .5s ease ' + delay + 'ms';
        ln.style.strokeDashoffset = '0';
      });
    }
```
Nota: `reduce` é a variável já calculada na Task 3 (no início de `render`). Esta task depende da Task 3 estar aplicada.

- [ ] **Step 4: Testes, verificação e commit**

`node scripts/test-event-graph.js` → `ALL PASS`. Verificação visual deferida ao controlador (confirmar que as linhas aparecem e ligam os nós certos; que sob reduced-motion aparecem logo completas).
```bash
git add js/event-graph.js
git commit -m "feat(ronda20): linhas de família traçam-se progressivamente ao abrir o acontecimento"
```

---

### Task 5: Coreografia do warp (clarão alinhado com a revelação)

O clarão do salto no hiperespaço acontece hoje tarde (progresso 0.8, quase no fim), depois de o novo mundo já estar praticamente revelado. Antecipá-lo para coincidir com a revelação.

**Files:**
- Modify: `js/warp-transition.js` (o pico do `flash` em `drawWarp`)

- [ ] **Step 1: Antecipar o pico do clarão**

Em `js/warp-transition.js`, na função `drawWarp`, trocar a linha:
```js
      var flash = Math.max(0, 1 - Math.abs(progress - 0.8) * 6);
```
por:
```js
      var flash = Math.max(0, 1 - Math.abs(progress - 0.45) * 5);
```
(O clarão passa a atingir o máximo a ~45% da transição — a meio da revelação do `#eventView`, que arranca no início do warp — em vez de a 80%, quase no fim.)

- [ ] **Step 2: Verificação e commit**

Verificação visual deferida ao controlador. Confirmar que `js/warp-transition.js` continua sintaticamente válido (`node --check js/warp-transition.js`).
```bash
git add js/warp-transition.js
git commit -m "feat(ronda20): clarão do warp antecipado para coincidir com a revelação"
```

---

## Verificação final da Ronda (antes do merge)

- [ ] `node scripts/test-event-graph.js` → `ALL PASS`
- [ ] `node scripts/test-timeline.js` → `ALL PASS`
- [ ] `node --check app.js` e `node --check js/warp-transition.js` → sem erros
- [ ] Revisão de branch inteira por subagente (`opus`).
- [ ] `git diff --stat` confirma que `data/` **não** foi tocado.
- [ ] Verificação em browser real (Chrome headless/CDP, **porta ≠ 9222** — a 9222 está ocupada pelo Lenovo Vantage; usar 9315 + `--remote-allow-origins=*`): abrir um acontecimento e confirmar que os personagens são criados, clicáveis, sem erros de consola; confirmar que sob `prefers-reduced-motion` (emular via `Emulation.setEmulatedMedia`) tudo aparece completo e imediato.
- [ ] Verificação da "sensação" (cascata/traçado/tátil) idealmente num dispositivo real — não validável a 100% headless.
- [ ] Merge para `master` via `superpowers:finishing-a-development-branch`; remover worktree.
- [ ] Atualizar `handover.md` (Ronda 20) e a memória do projeto.

## Notas de convenção

- Cada `git commit` leva os trailers exigidos pelo repositório (`Co-Authored-By:` e `Claude-Session:`) — omitidos nos snippets por brevidade.
- Execução num **git worktree isolado** (`superpowers:using-git-worktrees` / `EnterWorktree`), nunca em `master`.

## Auto-revisão (writing-plans)

- **Cobertura da spec (Ronda 20):** cascata de personagens ✓ (Task 3), linhas a traçarem-se ✓ (Task 4), feedback tátil ✓ (Task 1), micro-coreografia do warp ✓ (Task 5), cross-fade do painel ✓ (Task 2), ringPulse desync ✓ (Task 1). A conversão de `floatChar` para transform é deliberadamente NÃO feita — ver "Decisão de arquitetura registada".
- **Placeholders:** nenhum — todo o código está escrito por extenso.
- **Consistência de nomes:** `prefersReduce()` definido na Task 3 e usado na Task 4; a variável `reduce` é calculada uma vez no início de `render` (Task 3) e reutilizada na Task 4; `drawLine(a,b,cls,gen)` com o 4º argumento usado consistentemente nas chamadas da Task 4; `enterDelay`/`rowIds`/`layout` coerentes com o código existente.
- **Dependências entre tarefas:** Task 4 depende da Task 3 (usa `reduce` e `prefersReduce`). Executar por ordem.
```
