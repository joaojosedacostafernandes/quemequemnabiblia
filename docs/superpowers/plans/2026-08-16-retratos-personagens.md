# Retratos Ilustrados por Personagem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the type-icon inside each character's medallion (and add a larger version to the character card) with a unique, hand-illustrated SVG portrait, for all 34 characters currently in `data/personagens.json`, falling back to the existing type icon for any character without one.

**Architecture:** A new optional `retrato` field per character in `data/personagens.json` points to a standalone SVG file under `assets/retratos/`. `app.js` draws it clipped to a circle in the medallion (in place of the type icon) and as a larger circle at the top of the character card; when the field is absent, today's type-icon behavior is unchanged. No build step — same plain-script style as the rest of the project.

**Tech Stack:** Plain HTML/CSS/JS (matching the existing codebase), hand-authored SVG illustrations (viewBox `0 0 100 100`, flat vector style, no external assets/fonts/images).

**Spec:** `docs/superpowers/specs/2026-08-16-retratos-personagens-design.md`

## Global Constraints

- Every portrait is genuinely unique per character — never copy another character's SVG and only recolor it, even between siblings. Each is its own composition (hair shape, face shape, eye/mouth placement can and should differ, not just color).
- viewBox is `0 0 100 100` for every portrait file, no exceptions — the engine assumes this to size/position the clip.
- Palette stays within the project's existing warm "Livro de Ilustrações" colors (see the spec's palette list) — no colors outside that family.
- A character with no `retrato` field must render exactly as it does today (type icon) — never a broken image, never an empty circle.
- No character-specific data belongs in `app.js` — the portrait path comes from the data file like every other field.

---

### Task 1: Engine wiring + first portrait (Adão)

**Files:**
- Modify: `index.html` (add a `<defs>` element inside the `<svg>`)
- Modify: `app.js` (portrait rendering in the node loop; portrait in the card)
- Modify: `style.css` (card-portrait styling)
- Modify: `data/personagens.json` (add `"retrato"` field to the `adao` character only)
- Create: `assets/retratos/adao.svg`

**Interfaces:**
- Consumes: `data/personagens.json`'s new optional `retrato` field (a relative path string).
- Produces: the rendering pattern every later task's portraits plug into unchanged — `assets/retratos/<id>.svg`, referenced by `data.personagens[i].retrato`. Also produces the worked SVG example (`assets/retratos/adao.svg`) that Tasks 2-7 study as their technique reference.

- [ ] **Step 1: Add a `<defs>` element to `index.html`**

Find this line in `index.html`:
```html
        <g id="edges"></g>
```
Add a `<defs>` element right before it, inside the same `<svg>`:
```html
        <defs id="defs"></defs>
        <g id="edges"></g>
```

- [ ] **Step 2: Write `assets/retratos/adao.svg`**

This is the pilot portrait and the technique reference every later task studies. Adão: young/middle-aged man, skin `#d9b483`, short brown hair, no beard, simple/plain (first human, no adornment).

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M18 100 Q50 76 82 100 Z" fill="#7fb88a"/>
  <rect x="42" y="66" width="16" height="18" rx="6" fill="#d9b483"/>
  <ellipse cx="50" cy="46" rx="25" ry="29" fill="#d9b483"/>
  <ellipse cx="24" cy="47" rx="4" ry="6" fill="#d9b483"/>
  <ellipse cx="76" cy="47" rx="4" ry="6" fill="#d9b483"/>
  <path d="M23 40 Q20 14 50 12 Q80 14 77 40 Q77 24 50 22 Q23 24 23 40 Z" fill="#6b3d1c"/>
  <path d="M38 39 Q42 36 46 39" stroke="#4a3016" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M54 39 Q58 36 62 39" stroke="#4a3016" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="42" cy="45" rx="3.4" ry="4" fill="#fffaf0"/>
  <circle cx="42.5" cy="45.5" r="2" fill="#3d2a1a"/>
  <ellipse cx="58" cy="45" rx="3.4" ry="4" fill="#fffaf0"/>
  <circle cx="57.5" cy="45.5" r="2" fill="#3d2a1a"/>
  <path d="M49 47 Q47 54 50 56 Q52 56 51 54" stroke="#a8763f" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M42 62 Q50 66 58 62" stroke="#8a4a2f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>
```

Study this file's structure before Task 2 onward — every later portrait follows the same layering order: (1) clothing band at the bottom, (2) neck rectangle, (3) face ellipse, (4) ear ellipses, (5) hair/veil shape(s) — drawn AFTER the face so the hairline sits on top of the forehead but the face shape still shows below it, (6) eyebrows, (7) eyes (white + pupil), (8) nose (a single soft curved stroke, no fill), (9) mouth (a single curved stroke). Facial hair (beards), headscarves/veils, and accessories are additional shapes layered after step 5, before the eyes.

- [ ] **Step 3: Add `retrato` to Adão in `data/personagens.json`**

Find the `adao` character object (the first one in `personagens`). Add a `"retrato"` field to it, right after `"tipo"`:
```json
    { "id": "adao", "nome": "Adão", "tipo": "patriarca", "retrato": "assets/retratos/adao.svg", "tier": "major", ...
```
(Keep every other field on that line exactly as it is — only insert the new `"retrato"` key/value.)

- [ ] **Step 4: Add portrait rendering to the node loop in `app.js`**

Find this block in `app.js` (inside the `NODES.forEach` callback):
```js
      var iconSize = r * 1.3;
      var icon = el("image", {
        class: "icon", x: n.x - iconSize / 2, y: n.y - iconSize / 2,
        width: iconSize, height: iconSize, href: iconHref(n.tipo)
      });
      icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref(n.tipo));
      g.appendChild(icon);
      icon.addEventListener("error", function () {
        console.warn('Ícone em falta para o tipo "' + n.tipo + '" (personagem "' + n.id + '") — a usar o ícone "povo" como reserva.');
        icon.setAttribute("href", iconHref("povo"));
        icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref("povo"));
      });
```
Replace it with:
```js
      if (n.retrato) {
        var clipId = "clip-" + n.id;
        var clip = el("clipPath", { id: clipId });
        clip.appendChild(el("circle", { cx: n.x, cy: n.y, r: r }));
        defsLayer.appendChild(clip);
        var portrait = el("image", {
          class: "portrait", x: n.x - r, y: n.y - r,
          width: r * 2, height: r * 2, href: n.retrato, "clip-path": "url(#" + clipId + ")"
        });
        portrait.setAttributeNS("http://www.w3.org/1999/xlink", "href", n.retrato);
        g.appendChild(portrait);
      } else {
        var iconSize = r * 1.3;
        var icon = el("image", {
          class: "icon", x: n.x - iconSize / 2, y: n.y - iconSize / 2,
          width: iconSize, height: iconSize, href: iconHref(n.tipo)
        });
        icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref(n.tipo));
        g.appendChild(icon);
        icon.addEventListener("error", function () {
          console.warn('Ícone em falta para o tipo "' + n.tipo + '" (personagem "' + n.id + '") — a usar o ícone "povo" como reserva.');
          icon.setAttribute("href", iconHref("povo"));
          icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref("povo"));
        });
      }
```

Then, near the top of the `init(data)` function, find:
```js
    var graphSvg = document.getElementById("graph");
    var edgeLayer = document.getElementById("edges");
    var nodeLayer = document.getElementById("nodes");
```
Add a line for the new `defs` element right after it:
```js
    var graphSvg = document.getElementById("graph");
    var defsLayer = document.getElementById("defs");
    var edgeLayer = document.getElementById("edges");
    var nodeLayer = document.getElementById("nodes");
```

- [ ] **Step 5: Add portrait rendering to the card in `app.js`**

Find `renderCard`:
```js
    function renderCard(n) {
      panelBody.innerHTML =
        '<p class="card-era">' + n.era + '</p>' +
```
Change it to:
```js
    function renderCard(n) {
      var portraitHtml = n.retrato
        ? '<img class="card-portrait" src="' + n.retrato + '" alt="Retrato de ' + n.nome + '">'
        : '';
      panelBody.innerHTML =
        portraitHtml +
        '<p class="card-era">' + n.era + '</p>' +
```
(Everything else in `renderCard` stays exactly as it was.)

- [ ] **Step 6: Add CSS for the card portrait in `style.css`**

Add this rule right after the `.card-era` rule:
```css
.card-portrait {
  display: block;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--surface);
  border: 3px solid var(--accent);
  margin: 0 auto 1rem;
}

.node image.portrait { pointer-events: none; }
```

- [ ] **Step 7: Verify**

```bash
node -e "const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8')); console.log(d.personagens.find(p => p.id === 'adao').retrato);"
```
Expected: `assets/retratos/adao.svg`

```bash
node --check app.js
```
Expected: no output (success).

Then serve the site (via the `run` skill, or your own static server — `file://` breaks the `fetch` call) and check in a real browser: Adão's medallion shows the illustrated portrait (not the patriarca icon), clicking Adão shows the portrait large at the top of the card, and every OTHER character still shows their type icon exactly as before (unaffected).

- [ ] **Step 8: Commit**

```bash
git add index.html app.js style.css data/personagens.json assets/retratos/adao.svg
git commit -m "Add portrait rendering system, illustrate Adão as the pilot"
```

---

### Task 2: Portraits — Eva, Caim, Abel, Sete, Noé, Sem

**Files:**
- Create: `assets/retratos/eva.svg`, `assets/retratos/caim.svg`, `assets/retratos/abel.svg`, `assets/retratos/sete.svg`, `assets/retratos/noe.svg`, `assets/retratos/sem.svg`
- Modify: `data/personagens.json` (add `"retrato"` to these 6 characters)

**Interfaces:**
- Consumes: the rendering pattern from Task 1 (already built and committed — do not modify `app.js`, `index.html`, or `style.css` in this task). Study `assets/retratos/adao.svg` (already in the repo) as your technique reference before drawing.
- Produces: nothing new tasks depend on — this is a leaf content task, same shape as Task 3 through 7.

- [ ] **Step 1: Draw the 6 portraits**

Technique (same as `assets/retratos/adao.svg` — read that file first): viewBox `0 0 100 100`. Layering order: (1) clothing band at the bottom (`<path d="M18 100 Q50 76 82 100 Z" fill="...">`, vary the fill color), (2) neck rectangle (`<rect x="42" y="66" width="16" height="18" rx="6" fill="<skin>">`), (3) face ellipse (`<ellipse cx="50" cy="46" rx="25" ry="29" fill="<skin>">`, adjust rx/ry slightly per character for face-shape variety), (4) two ear ellipses, (5) hair/veil/beard shapes in the hair color, (6) eyebrows (two short curved strokes), (7) two eyes (white ellipse + dark pupil circle), (8) nose (one soft curved stroke, no fill), (9) mouth (one curved stroke — vary curvature for expression). Every shape must actually differ between these 6 characters, not just recolor the same paths — vary face proportions (rx/ry), hairline shape, and mouth curve per the notes below.

Casting direction (from the spec's table):

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| eva | mulher jovem | `#e8c9a0` | castanho longo solto | simples, sem adornos |
| caim | homem jovem | `#c99a6b` | preto curto | expressão mais carregada/séria |
| abel | homem jovem | `#d9b483` | castanho claro curto | expressão mais serena |
| sete | homem jovem | `#d9b483` | castanho médio | neutro |
| noe | homem idoso | `#c99a6b` | grisalho, barba longa grisalha | rugas leves, ar sereno/sábio |
| sem | homem meia-idade | `#c99a6b` | castanho escuro, barba curta | neutro |

Clothing band colors: pick from `#7fb88a`, `#c1652f`, `#a8763f`, `#5f7a52`, `#b4763f` — vary across the 6, don't repeat the same color twice in this batch.

For long hair (Eva): draw the hair as a shape extending past the shoulders on both sides, behind the clothing band (drawn before the clothing band in paint order, or with a shape wide enough to frame the face down to ~y=85). For beards (Noé, Sem): draw a beard shape covering the lower half of the face, colored in the hair color, layered after the face ellipse but the mouth still needs to read (either place the mouth stroke on top of a lighter beard tone, or shape the beard to leave the mouth area visible).

- [ ] **Step 2: Add `retrato` to these 6 characters in `data/personagens.json`**

For each of `eva`, `caim`, `abel`, `sete`, `noe`, `sem`, add `"retrato": "assets/retratos/<id>.svg"` right after that character's `"tipo"` field, same pattern as Task 1 did for `adao`. Do not touch any other character or any other field.

- [ ] **Step 3: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
['eva','caim','abel','sete','noe','sem'].forEach(id => {
  const p = d.personagens.find(p => p.id === id);
  console.log(id, '->', p.retrato);
});
"
```
Expected: each line shows `assets/retratos/<id>.svg` with no `undefined`.

```bash
node -e "
const fs = require('fs');
['eva','caim','abel','sete','noe','sem'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' is not valid SVG');
});
console.log('OK, 6 files present and well-formed');
"
```
Expected: `OK, 6 files present and well-formed`

Then serve the site and check in browser: all 6 characters show their new portrait (not the old icon) in the medallion and in their card, and no two of the 6 look identical to each other.

- [ ] **Step 4: Commit**

```bash
git add assets/retratos/eva.svg assets/retratos/caim.svg assets/retratos/abel.svg assets/retratos/sete.svg assets/retratos/noe.svg assets/retratos/sem.svg data/personagens.json
git commit -m "Add portraits: Eva, Caim, Abel, Sete, Noé, Sem"
```

---

### Task 3: Portraits — Abraão, Sara, Agar, Ismael, Isaac, Rebeca

**Files:**
- Create: `assets/retratos/abraao.svg`, `assets/retratos/sara.svg`, `assets/retratos/agar.svg`, `assets/retratos/ismael.svg`, `assets/retratos/isaac.svg`, `assets/retratos/rebeca.svg`
- Modify: `data/personagens.json`

**Interfaces:** same as Task 2 — study `assets/retratos/adao.svg` for technique, follow the same layering order, do not touch `app.js`/`index.html`/`style.css`.

- [ ] **Step 1: Draw the 6 portraits**

Same technique as Task 2's Step 1 (viewBox `0 0 100 100`, same layering order). Casting direction:

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| abraao | homem idoso | `#c99a6b` | grisalho, barba grisalha média | ar de autoridade calma |
| sara | mulher idosa | `#e8c9a0` | grisalho, véu/lenço claro | leve sorriso |
| agar | mulher jovem/meia-idade | `#8a6238` | preto, lenço simples | expressão resiliente |
| ismael | homem jovem | `#8a6238` | preto curto | ar de caçador/ar livre |
| isaac | homem meia-idade | `#d9b483` | castanho, barba curta | traços distintos do pai Abraão — não reutilizar a forma de cara/barba dele |
| rebeca | mulher jovem/meia-idade | `#e8c9a0` | castanho escuro, véu leve | expressão atenta/hospitaleira |

For veils/headscarves (Sara, Agar, Rebeca): draw an additional shape over the top and sides of the head (like a hood), in a light fabric color (e.g. `#f6ecd4` or `#e8c9a0` for Sara's pale scarf, a darker tone for Agar's), layered after the hair-adjacent shapes, framing the face. Isaac and Abraão both have beards — make sure their face proportions (rx/ry on the face ellipse), beard shapes, and hairlines are visibly different from each other and from Noé/Sem in Task 2.

- [ ] **Step 2: Add `retrato` to these 6 characters in `data/personagens.json`**

Same pattern as Task 2's Step 2, for `abraao`, `sara`, `agar`, `ismael`, `isaac`, `rebeca`.

- [ ] **Step 3: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
['abraao','sara','agar','ismael','isaac','rebeca'].forEach(id => {
  const p = d.personagens.find(p => p.id === id);
  console.log(id, '->', p.retrato);
});
"
```
Expected: each line shows `assets/retratos/<id>.svg`.

```bash
node -e "
const fs = require('fs');
['abraao','sara','agar','ismael','isaac','rebeca'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' is not valid SVG');
});
console.log('OK, 6 files present and well-formed');
"
```
Expected: `OK, 6 files present and well-formed`

Then serve the site and check in browser: all 6 render correctly, and Isaac/Abraão (both bearded) are visibly distinct from each other.

- [ ] **Step 4: Commit**

```bash
git add assets/retratos/abraao.svg assets/retratos/sara.svg assets/retratos/agar.svg assets/retratos/ismael.svg assets/retratos/isaac.svg assets/retratos/rebeca.svg data/personagens.json
git commit -m "Add portraits: Abraão, Sara, Agar, Ismael, Isaac, Rebeca"
```

---

### Task 4: Portraits — Esaú, Jacob, Raquel, Lia, José, Moisés

**Files:**
- Create: `assets/retratos/esau.svg`, `assets/retratos/jacob.svg`, `assets/retratos/raquel.svg`, `assets/retratos/lia.svg`, `assets/retratos/jose.svg`, `assets/retratos/moises.svg`
- Modify: `data/personagens.json`

**Interfaces:** same as Task 2.

- [ ] **Step 1: Draw the 6 portraits**

Same technique. Casting direction:

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| esau | homem jovem/meia-idade | `#c99a6b` | ruivo/castanho avermelhado, barba mais desalinhada | ar rústico, ao ar livre |
| jacob | homem jovem/meia-idade | `#d9b483` | castanho escuro, sem barba ou barba rala | traços distintos do irmão Esaú |
| raquel | mulher jovem | `#e8c9a0` | preto longo | expressão suave |
| lia | mulher jovem/meia-idade | `#d9b483` | castanho, véu simples | expressão mais contida |
| jose | homem jovem | `#d9b483` | preto encaracolado curto | um toque de cor na roupa a lembrar a túnica multicolor |
| moises | homem idoso | `#c99a6b` | grisalho, barba longa grisalha | ar grave/profético |

Esaú and Jacob are twins in the story — make a deliberate point of NOT drawing them as visually interchangeable: differ hair color/texture, beard presence, and face shape clearly. For José's "túnica multicolor" nod: instead of a single flat clothing-band color, use 2-3 color bands or stripes within the clothing shape (e.g. two or three adjacent `<path>`/`<rect>` slivers in different warm colors) rather than the single-color band the others use. Curly hair (José): use several small overlapping curve/arc shapes along the hairline instead of one smooth hair silhouette. Moisés should look older/more grave than Noé and Abraão from earlier tasks — vary beard length/shape and add subtle brow/forehead lines if you can do so simply (e.g. one or two faint short strokes above the eyebrows).

- [ ] **Step 2: Add `retrato` to these 6 characters in `data/personagens.json`**

Same pattern, for `esau`, `jacob`, `raquel`, `lia`, `jose`, `moises`.

- [ ] **Step 3: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
['esau','jacob','raquel','lia','jose','moises'].forEach(id => {
  const p = d.personagens.find(p => p.id === id);
  console.log(id, '->', p.retrato);
});
"
```

```bash
node -e "
const fs = require('fs');
['esau','jacob','raquel','lia','jose','moises'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' is not valid SVG');
});
console.log('OK, 6 files present and well-formed');
"
```

Then serve the site and check in browser, paying particular attention to Esaú vs. Jacob being visually distinct.

- [ ] **Step 4: Commit**

```bash
git add assets/retratos/esau.svg assets/retratos/jacob.svg assets/retratos/raquel.svg assets/retratos/lia.svg assets/retratos/jose.svg assets/retratos/moises.svg data/personagens.json
git commit -m "Add portraits: Esaú, Jacob, Raquel, Lia, José, Moisés"
```

---

### Task 5: Portraits — Miriam, Rúben, Simeão, Levi, Judá

**Files:**
- Create: `assets/retratos/miriam.svg`, `assets/retratos/ruben.svg`, `assets/retratos/simeao.svg`, `assets/retratos/levi.svg`, `assets/retratos/juda.svg`
- Modify: `data/personagens.json`

**Interfaces:** same as Task 2.

- [ ] **Step 1: Draw the 5 portraits**

Same technique. Casting direction:

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| miriam | mulher meia-idade | `#e8c9a0` | grisalho a castanho, véu | expressão de quem canta/celebra — pode sugerir-se com a boca mais aberta/curva pronunciada |
| ruben | homem jovem | `#d9b483` | castanho curto | neutro |
| simeao | homem jovem | `#c99a6b` | preto curto | expressão mais dura |
| levi | homem jovem | `#d9b483` | castanho médio | ar mais sério/formal |
| juda | homem jovem/meia-idade | `#c99a6b` | castanho escuro, barba curta | ar de liderança |

These four brothers (Rúben, Simeão, Levi, Judá) are all young men with short hair in similar tones — the burden of proof for "genuinely unique" is highest here. Vary at minimum: face shape (rx/ry on the face ellipse — make each measurably different, e.g. 24/28, 26/27, 23/29, 25/26), hairline shape (straight, receding at temples, uneven, side-swept), eyebrow angle, and mouth curve (neutral, slight frown, slight smile, firm line) so all four read as different people even in a small medallion.

- [ ] **Step 2: Add `retrato` to these 5 characters in `data/personagens.json`**

Same pattern, for `miriam`, `ruben`, `simeao`, `levi`, `juda`.

- [ ] **Step 3: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
['miriam','ruben','simeao','levi','juda'].forEach(id => {
  const p = d.personagens.find(p => p.id === id);
  console.log(id, '->', p.retrato);
});
"
```

```bash
node -e "
const fs = require('fs');
['miriam','ruben','simeao','levi','juda'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' is not valid SVG');
});
console.log('OK, 5 files present and well-formed');
"
```

Then serve the site and check in browser: the 4 brothers must be distinguishable from each other at a glance, not just in theory.

- [ ] **Step 4: Commit**

```bash
git add assets/retratos/miriam.svg assets/retratos/ruben.svg assets/retratos/simeao.svg assets/retratos/levi.svg assets/retratos/juda.svg data/personagens.json
git commit -m "Add portraits: Miriam, Rúben, Simeão, Levi, Judá"
```

---

### Task 6: Portraits — Issacar, Zabulão, Dan, Neftali, Gad, Aser

**Files:**
- Create: `assets/retratos/issacar.svg`, `assets/retratos/zabulao.svg`, `assets/retratos/dan.svg`, `assets/retratos/neftali.svg`, `assets/retratos/gad.svg`, `assets/retratos/aser.svg`
- Modify: `data/personagens.json`

**Interfaces:** same as Task 2.

- [ ] **Step 1: Draw the 6 portraits**

Same technique. Casting direction:

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| issacar | homem jovem | `#d9b483` | castanho | neutro |
| zabulao | homem jovem | `#c99a6b` | castanho escuro | neutro |
| dan | homem jovem | `#8a6238` | preto curto | neutro |
| neftali | homem jovem | `#8a6238` | preto curto, traços distintos do irmão Dan | neutro |
| gad | homem jovem | `#c99a6b` | castanho | neutro |
| aser | homem jovem | `#c99a6b` | castanho, traços distintos do irmão Gad | neutro |

Same "genuinely unique" bar as Task 5 — these six are again young men with limited attribute variety, so lean on face-shape proportions, hairline, eyebrow angle, and mouth curve to keep every one of the six distinguishable. Dan/Neftali share a mother (Bila) in the story and Gad/Aser share a mother (Zilpa) — a small deliberate visual echo between each pair (e.g. similar hair texture, different face shape) is a nice touch but not required; distinctness matters more than any family resemblance.

- [ ] **Step 2: Add `retrato` to these 6 characters in `data/personagens.json`**

Same pattern, for `issacar`, `zabulao`, `dan`, `neftali`, `gad`, `aser`.

- [ ] **Step 3: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
['issacar','zabulao','dan','neftali','gad','aser'].forEach(id => {
  const p = d.personagens.find(p => p.id === id);
  console.log(id, '->', p.retrato);
});
"
```

```bash
node -e "
const fs = require('fs');
['issacar','zabulao','dan','neftali','gad','aser'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' is not valid SVG');
});
console.log('OK, 6 files present and well-formed');
"
```

Then serve the site and check in browser.

- [ ] **Step 4: Commit**

```bash
git add assets/retratos/issacar.svg assets/retratos/zabulao.svg assets/retratos/dan.svg assets/retratos/neftali.svg assets/retratos/gad.svg assets/retratos/aser.svg data/personagens.json
git commit -m "Add portraits: Issacar, Zabulão, Dan, Neftali, Gad, Aser"
```

---

### Task 7: Portraits — Dina, Benjamim, Arão, Faraó (final batch)

**Files:**
- Create: `assets/retratos/dina.svg`, `assets/retratos/benjamim.svg`, `assets/retratos/arao.svg`, `assets/retratos/farao.svg`
- Modify: `data/personagens.json`

**Interfaces:** same as Task 2. This is the last portrait batch — after this task, all 34 characters have a `retrato`.

- [ ] **Step 1: Draw the 4 portraits**

Same technique. Casting direction:

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| dina | mulher jovem | `#e8c9a0` | castanho longo | única filha — expressão própria, não repetir a composição de Raquel ou Lia (Task 4) |
| benjamim | homem jovem (adolescente) | `#d9b483` | castanho claro | traços mais jovens/redondos (rosto mais arredondado, olhos proporcionalmente maiores) que os irmãos mais velhos |
| arao | homem idoso | `#c99a6b` | grisalho, barba longa | traços distintos do irmão Moisés (Task 4); um pequeno detalhe cerimonial na roupa (ex: uma faixa/padrão simples na banda de roupa, já que é o primeiro sumo sacerdote) |
| farao | homem meia-idade | `#8a6238` | preto, sem barba ou barba fina | único personagem não-israelita do conjunto — pode ter um detalhe de roupa/adereço diferente (ex: um pequeno adorno geométrico na banda de roupa) para o marcar como estrangeiro à narrativa |

- [ ] **Step 2: Add `retrato` to these 4 characters in `data/personagens.json`**

Same pattern, for `dina`, `benjamim`, `arao`, `farao`.

- [ ] **Step 3: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const missing = d.personagens.filter(p => !p.retrato);
console.log('personagens sem retrato:', missing.length, missing.map(p => p.id));
"
```
Expected: `personagens sem retrato: 0 []` — this confirms ALL 34 characters now have a portrait, not just this task's 4.

```bash
node -e "
const fs = require('fs');
['dina','benjamim','arao','farao'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' is not valid SVG');
});
console.log('OK, 4 files present and well-formed');
"
```

Then serve the site and do a full click-through of all 34 characters: confirm every single one now shows an illustrated portrait (none still show the old type icon), no two characters look identical, and the card's larger portrait matches the medallion's.

- [ ] **Step 4: Commit**

```bash
git add assets/retratos/dina.svg assets/retratos/benjamim.svg assets/retratos/arao.svg assets/retratos/farao.svg data/personagens.json
git commit -m "Add portraits: Dina, Benjamim, Arão, Faraó — all 34 characters now illustrated"
```
