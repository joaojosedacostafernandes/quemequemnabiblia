# Ronda 9 — Ligações em Falta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 25 missing edges between already-existing characters (found by Round 8's final review), plus a new 5th edge type ("affinity", for in-law relationships) needed for one of them, plus a one-clause content fix to `jose.relacoes`.

**Architecture:** No new files, no rendering-logic changes. `js/render-cluster.js` already treats edge `type` as an opaque string used only to pick a CSS class (`edge-` + type) — the existing 4-type mechanism already generalizes to a 5th type with zero code changes there. Only `style.css` (new CSS variable + rule) and `app.js` (new legend entry) need touching.

**Tech Stack:** Static HTML/CSS/JS, JSON data.

**Spec:** `docs/superpowers/specs/2026-08-20-ligacoes-em-falta-design.md`

## Global Constraints

- No new characters in this round — every edge connects two characters that already exist in `data/personagens.json`.
- The new `"affinity"` edge type follows the exact same array format as the other 4: `[idA, idB, "affinity", "label"]` — the 4th element (label) is used here to name the specific relationship (e.g. "sogra e nora"), unlike `sibling`/`spouse` edges elsewhere in the file which normally omit it.
- New CSS color (`--line-affinity`) must be visually distinct from the 4 existing edge colors (`--line-parent: #7a5230`, `--line-spouse: #b4763f`, `--line-sibling: #5f7a52`, `--line-descendant: #c1652f`) and must not be a blue/violet/teal hue (matches this project's established warm-palette convention).
- Do NOT expand the Jacob's-children sibling additions beyond the 19 explicitly-named pairs listed below — no combinatorial full-clique expansion, per the spec's explicit scope decision.
- Do NOT add an edge for `booz↔noemi` — the source text doesn't specify a concrete relationship type, so it deliberately stays prose-only, per the spec.

---

### Task 1: Add the "affinity" edge type, 25 new edges, and the José/Efraim text fix

**Files:**
- Modify: `data/personagens.json` — add 25 edges, fix `jose.relacoes`
- Modify: `style.css` — add `--line-affinity` CSS variable and `.edge-affinity` rule
- Modify: `app.js` — add `["affinity", "Parentesco por casamento"]` to the `LEGEND` array

**Interfaces:**
- Consumes: existing `edges[]` array format; existing `LEGEND` array format in `app.js` (an array of `[type, label]` pairs, already rendered generically by the existing legend-building code); existing `.edge-<type>` CSS class pattern in `style.css`.
- Produces: nothing consumed by a later task — this is the only task in this plan.

- [ ] **Step 1: Add `--line-affinity` to `style.css`**

Find the `:root` block containing `--line-parent`, `--line-spouse`, `--line-sibling`, `--line-descendant` and add a new line right after `--line-descendant: #c1652f;`:
```css
  --line-affinity: #96625a;
```

- [ ] **Step 2: Add the `.edge-affinity` rule to `style.css`**

Find the existing edge-style rules (`.edge-parent { ... }`, `.edge-spouse { ... }`, `.edge-sibling { ... }`, `.edge-descendant { ... }`) and add, right after `.edge-descendant`:
```css
.edge-affinity { stroke: var(--line-affinity); stroke-width: 1.4; stroke-dasharray: 3 3; }
```

- [ ] **Step 3: Add the new legend entry to `app.js`**

Find the `LEGEND` array (a list of `[type, label]` pairs, currently ending with `["descendant", "Várias gerações depois"]`) and add a new entry after it:
```javascript
    ["affinity", "Parentesco por casamento"]
```
(Remember to add a trailing comma to the previous last entry if needed to keep valid JS array syntax.)

- [ ] **Step 4: Add the 25 new edges to `data/personagens.json`**

At the end of the `edges` array, add:
```json
    ["ismael", "isaac", "sibling"],
    ["jose", "benjamim", "sibling"],
    ["dan", "neftali", "sibling"],
    ["gad", "aser", "sibling"],
    ["juda", "jesse", "descendant", "~8 gerações, incerta · Rt 4:18-22"],
    ["noemi", "rute", "affinity", "sogra e nora"],
    ["ruben", "simeao", "sibling"],
    ["ruben", "levi", "sibling"],
    ["ruben", "juda", "sibling"],
    ["ruben", "issacar", "sibling"],
    ["ruben", "zabulao", "sibling"],
    ["ruben", "dina", "sibling"],
    ["simeao", "levi", "sibling"],
    ["simeao", "juda", "sibling"],
    ["simeao", "issacar", "sibling"],
    ["simeao", "zabulao", "sibling"],
    ["simeao", "dina", "sibling"],
    ["juda", "levi", "sibling"],
    ["juda", "issacar", "sibling"],
    ["juda", "zabulao", "sibling"],
    ["juda", "dina", "sibling"],
    ["dina", "levi", "sibling"],
    ["dina", "issacar", "sibling"],
    ["dina", "zabulao", "sibling"],
    ["zabulao", "issacar", "sibling"]
```
Remember the trailing comma on the previous last edge line needs adding since it's no longer the last element. Count the entries above to confirm there are exactly 25 before moving on.

- [ ] **Step 5: Fix `jose.relacoes` to mention Efraim**

Find the `jose` character entry. Its current `relacoes` field reads:
```
"relacoes": "Filho de Jacob e Raquel. Irmão mais velho de Benjamim. Meio-irmão dos restantes filhos de Jacob."
```
Change it to:
```
"relacoes": "Filho de Jacob e Raquel. Irmão mais velho de Benjamim. Meio-irmão dos restantes filhos de Jacob. Pai de Efraim, entre outros filhos."
```

- [ ] **Step 6: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"`

Run the consistency check:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json','utf8'));
const ids = new Set(d.personagens.map(p=>p.id));
console.log('total personagens:', d.personagens.length);
let bad = 0;
d.edges.forEach(e => { if(!ids.has(e[0]) || !ids.has(e[1])) bad++; });
console.log('bad edge refs:', bad);
console.log('total edges:', d.edges.length);
const types = {};
d.edges.forEach(e => { types[e[2]] = (types[e[2]]||0) + 1; });
console.log('edge types:', JSON.stringify(types));
"
```
Expected: `total personagens: 105` (unchanged — no new characters), `bad edge refs: 0`, `total edges: 117`, and `edge types` should show `affinity: 1` among the counts.

- [ ] **Step 7: Verify the legend and edge color in a browser, or by code-trace**

Check for a real browser before assuming none is available (Chrome is at `C:\Program Files\Google\Chrome\Application\chrome.exe`; the project's established headless-CDP technique is documented in `handover.md`). If available: start a local server, load the site, confirm "Parentesco por casamento" appears in the legend with a dotted line swatch, navigate to the "Rute" era (where Noemi and Rute are), and confirm a dotted line connects them in a color distinct from the other edge types. If no browser is available, trace the code by hand: confirm the `LEGEND` array entry renders via the existing generic legend-building loop (it iterates `LEGEND` and draws a swatch per entry — no type-specific code exists, so a new entry works automatically), and confirm `.edge-affinity`'s CSS will apply correctly to the `<line>` (or `<path>`, for same-row edges) element `render-cluster.js` creates with `class: "edge edge-" + type`.

- [ ] **Step 8: Commit**

```bash
git add data/personagens.json style.css app.js
git commit -m "feat: add affinity edge type + 25 missing edges between existing characters (Ronda 9)"
```

**Report:** include (1) the Step 6 consistency check output including the edge-types breakdown, (2) confirmation of the Step 7 verification (browser or code-trace, state which), (3) commit hash(es).
