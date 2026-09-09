# Ronda 21 (reordenada) — Aspeto: Cor por Era + Ficha Redesenhada (plano)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Dar ao site uma diferença **visual óbvia e permanente** — cada era ganha a sua cor (linha do tempo + fundo que muda de cor conforme a época) e a ficha de personagem é redesenhada para crianças (retrato grande, lição e citação em destaque, contexto histórico colapsado). Reordenação pedida pelo utilizador (o mobile — pinch-zoom etc. — passa para uma ronda posterior).

**Architecture:** A cor por era usa o campo `tint` que cada acontecimento já tem. A linha do tempo (`js/timeline.js`) pinta a calha por troços de era e avisa `app.js` de qual a era ao centro; `app.js` faz o fundo (nébula) transitar para essa cor. A ficha é reestruturada em `app.js` (`focusChar`) + `style.css`. Zero dados alterados.

**Tech Stack:** JS ES5 à mão, SVG gradient, CSS transitions.

## Global Constraints
- Zero bibliotecas; JS ES5 (`var`/`function`). Zero alterações a `data/personagens.json`.
- Manter e elevar o tema espacial (escuro/constelação). `prefers-reduced-motion` respeitado.
- Node: `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64` (ou node do sistema).
- Verificação com screenshots reais (Chrome headless/CDP, porta ≠ 9222) mostrada ao utilizador.

---

### Task 1: Ficha de personagem redesenhada (a mudança mais visível)

Reestruturar o cartão para crianças: retrato maior com anel da cor da era; lição num bloco destacado; citação em destaque; contexto histórico colapsado (é para catequistas).

**Files:** `app.js` (`focusChar`), `style.css`

- [ ] **Step 1: Novo HTML do cartão em `focusChar`**

Em `app.js`, no início de `focusChar` (a seguir a `var d = Object.assign({}, base, overrides);`), acrescentar:
```js
      var tint = (currentEvent && currentEvent.tint) || '#f0d060';
```
Depois, trocar TODO o bloco `var portrait = ...` + `panelBody.innerHTML = ... crossEventRefsHtml(charId);` por:
```js
      var portrait = d.retrato
        ? '<div class="card-portrait" style="border-color:' + tint + '; box-shadow:0 0 26px ' + tint + '66"><img src="' + d.retrato + '" alt="Retrato de ' + escapeAttr(d.nome) + '"></div>'
        : '<div class="card-portrait" style="border-color:' + tint + '"></div>';
      panelBody.style.opacity = '0';
      panelBody.innerHTML =
        portrait +
        '<span class="card-era" style="color:' + tint + '">' + currentEvent.nome + '</span>' +
        '<h2 class="card-name">' + d.nome + '</h2>' +
        '<p class="card-refs">' + (d.refs || '') + '</p>' +
        '<p class="card-summary">' + d.resumo + '</p>' +
        (d.licao ? '<div class="card-highlight" style="--accent:' + tint + '"><span class="card-highlight-label">O que aprendemos</span><p>' + d.licao + '</p></div>' : '') +
        (d.citacao ? '<blockquote class="card-quote" style="border-color:' + tint + '">' + d.citacao + '</blockquote>' : '') +
        (d.importancia ? '<p class="card-section-title">Porque é importante</p><p class="card-body">' + d.importancia + '</p>' : '') +
        '<p class="card-section-title">Família (neste acontecimento)</p>' +
        familyHtml +
        crossEventRefsHtml(charId) +
        (d.contexto ? '<button class="card-context-toggle" type="button"><span class="arrow">&#9654;</span> Contexto histórico</button><div class="card-context-body" hidden><p class="card-body">' + d.contexto + '</p></div>' : '');
```

- [ ] **Step 2: Handler do toggle de contexto (a seguir aos handlers de `.cross-event-ref`)**

A seguir ao bloco `panelBody.querySelectorAll('.cross-event-ref').forEach(...)`, acrescentar:
```js
      var ctxToggle = panelBody.querySelector('.card-context-toggle');
      if (ctxToggle) ctxToggle.addEventListener('click', function () {
        var body = panelBody.querySelector('.card-context-body');
        var open = body.hasAttribute('hidden');
        if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden', '');
        ctxToggle.classList.toggle('open', open);
      });
```

- [ ] **Step 3: CSS do cartão**

Em `style.css`, trocar a regra `.card-portrait { ... }` (largura/altura 96px) para 112px:
```css
.card-portrait { width: 112px; height: 112px; border-radius: 50%; overflow: hidden; margin: 0 auto 1rem; border: 3px solid var(--gold-soft); box-shadow: 0 0 20px rgba(240,208,96,.3); background: radial-gradient(circle at 35% 30%, #efe9ff, var(--lavender) 58%, #362f5e 100%); }
```
E a seguir à regra `.card-quote { ... }`, acrescentar:
```css
.card-name { font-size: 2.1rem; }
.card-highlight { margin: 1rem 0; padding: .8rem 1rem; border-radius: 12px; border-left: 3px solid var(--accent, var(--gold-soft)); background: color-mix(in srgb, var(--accent, #f0d060) 12%, transparent); }
.card-highlight-label { display: block; font-family: var(--font-ui); font-size: .62rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--accent, var(--gold-soft)); margin-bottom: .35rem; }
.card-highlight p { margin: 0; font-family: var(--font-body); font-size: .95rem; line-height: 1.6; color: var(--ink); }
.card-quote { font-family: var(--font-display); font-size: 1.18rem; font-style: italic; line-height: 1.5; color: var(--gold-soft); border-left: 3px solid var(--gold-soft); padding-left: .9rem; margin: 1.1rem 0; }
.card-context-toggle { margin-top: 1.2rem; font-family: var(--font-ui); font-size: .68rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-dim); background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 6px; }
.card-context-toggle .arrow { display: inline-block; transition: transform .2s ease; font-size: .8em; }
.card-context-toggle.open .arrow { transform: rotate(90deg); }
.card-context-body { margin-top: .5rem; }
```
Nota: a `card-divider` deixa de ser usada no cartão (removida do HTML) — deixar a regra CSS no ficheiro (inofensiva) ou removê-la; não é obrigatório mexer nela.

- [ ] **Step 4: Verificar e commit**

`node --check app.js` sem erros; `node scripts/test-event-graph.js`/`test-timeline.js` ALL PASS. Verificação visual (screenshot) pelo controlador.
```bash
git add app.js style.css
git commit -m "feat(ronda21): ficha de personagem redesenhada (retrato grande, lição/citação em destaque, contexto colapsado, cor da era)"
```

---

### Task 2: Linha do tempo colorida por era

A calha da linha do tempo passa a fluir pelas cores das eras (usa o `tint` de cada acontecimento).

**Files:** `js/timeline.js` (função `render`)

- [ ] **Step 1: Pintar a calha por troços de era**

Em `js/timeline.js`, dentro de `render`, a seguir a `railPath.setAttribute('transform', 'translate(100,0)');`, acrescentar:
```js
      // Colorir a calha pelas cores das eras (o gradiente flui pelo tint de
      // cada acontecimento, distribuído ao longo do seu comprimento).
      var grad = railSvg.querySelector('#railGrad');
      if (grad) {
        grad.innerHTML = '';
        events.forEach(function (ev, i) {
          var stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', (events.length > 1 ? (i / (events.length - 1)) * 100 : 0) + '%');
          stop.setAttribute('stop-color', ev.tint || '#4a4580');
          stop.setAttribute('stop-opacity', '.9');
          grad.appendChild(stop);
        });
      }
```

- [ ] **Step 2: Verificar e commit**

`node scripts/test-timeline.js` ALL PASS. Screenshot pelo controlador.
```bash
git add js/timeline.js
git commit -m "feat(ronda21): linha do tempo colorida pelas cores das eras"
```

---

### Task 3: Fundo que muda de cor conforme a era

À medida que se percorre a linha do tempo, a nébula de fundo transita para a cor da era centrada.

**Files:** `js/timeline.js` (novo callback `onCenter`), `app.js` (fornecer o callback), `style.css` (transição da nébula)

- [ ] **Step 1: `timeline.js` avisa qual a era ao centro**

Em `js/timeline.js`, dentro de `init`, a seguir a `var railOffset = 0;`, acrescentar:
```js
    var lastCenterIdx = -1;
```
E no fim de `function applyOffset()` (a seguir a `updateArrowState();`), acrescentar:
```js
      if (nearest !== lastCenterIdx) {
        lastCenterIdx = nearest;
        if (opts.onCenter && events[nearest]) opts.onCenter(events[nearest].tint, nearest);
      }
```

- [ ] **Step 2: `app.js` faz o fundo transitar para a cor da era**

Em `app.js`, na chamada `Timeline.init({ ... })`, acrescentar uma propriedade ao objeto de opções (ex: a seguir a `onEnter: function (ev, x, y) { enterEvent(ev, x, y); }` — acrescentar uma vírgula e a nova linha):
```js
      onCenter: function (tint) {
        var neb = document.querySelector('.nebula.n1');
        if (neb && tint) neb.style.background = 'radial-gradient(circle, ' + tint + ', transparent 68%)';
      }
```

- [ ] **Step 3: CSS — transição suave da nébula**

Em `style.css`, na regra `.nebula { ... }`, acrescentar `transition: background 1.2s ease;` ao fim das suas propriedades (antes do `}`).
E no bloco `@media (prefers-reduced-motion: reduce)`, a regra `.nebula { animation: none; }` já existe — acrescentar `transition: none;` a essa regra (fica `.nebula { animation: none; transition: none; }`).

- [ ] **Step 4: Verificar e commit**

`node --check app.js`; `node scripts/test-timeline.js` ALL PASS. Screenshot pelo controlador (fundo de cor diferente em eras diferentes).
```bash
git add js/timeline.js app.js style.css
git commit -m "feat(ronda21): fundo (nébula) muda de cor conforme a era centrada na linha do tempo"
```

---

## Verificação final
- [ ] `node scripts/test-event-graph.js` e `node scripts/test-timeline.js` → ALL PASS; `node --check app.js`.
- [ ] `git diff --stat` confirma `data/` intocado.
- [ ] Revisão de branch (opus).
- [ ] Screenshots reais mostrados ao utilizador (linha do tempo em 2 eras diferentes + cartão redesenhado) ANTES do merge, para validação de gosto.
- [ ] Merge para `master`; remover worktree; atualizar `handover.md`.

## Auto-revisão (writing-plans)
- Cobertura: cor por era na calha ✓ (T2), fundo por era ✓ (T3), ficha redesenhada ✓ (T1). Tudo usa `tint` existente; zero dados alterados.
- Sem placeholders. Nomes coerentes: `onCenter` definido em `app.js` (T3-2) e chamado em `timeline.js` (T3-1); `lastCenterIdx` local a `init`.
- `color-mix` já é usado no projeto (`.event-dot` em style.css), por isso é seguro usá-lo em `.card-highlight`.
