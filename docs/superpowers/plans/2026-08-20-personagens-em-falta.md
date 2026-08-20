# Ronda 7 — Personagens e Ligações em Falta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new characters (Urias, Jessé, Nabal, Calebe, Elcana, Hofni, Finéias, Efraim) mentioned by name in existing characters' text but missing from the cast, plus 15 new edges (13 involving the new characters, 2 between characters that already exist).

**Architecture:** No structural changes. Same `data/personagens.json` schema, same portrait convention. One simplification enabled by the navigation redesign (Ronda anterior): new character entries do NOT need `x`/`y` fields — those are vestigial on existing entries (kept, unused by the renderer) and there is no reason to keep adding them going forward. Position is entirely computed at runtime from `era` + family edges + `tier`.

**Tech Stack:** Static HTML/CSS/JS, hand-authored SVG.

**Spec:** `docs/superpowers/specs/2026-08-20-personagens-em-falta-design.md`

## Global Constraints

- Portrait SVGs: `viewBox="0 0 100 100"`, layer order clothing-band → neck rect → face ellipse → ears → hair/veil/beard → eyebrows → eyes → nose → mouth → beard-if-drawn-last (beard is drawn LAST, after the mouth — established convention, confirmed across every portrait since Round 4).
- Palette: warm tones only — browns, terracottas, ochres, olives, cream. No blue, violet, or teal.
- Every new portrait must be genuinely unique. This round's highest risk: Hofni and Finéias are brothers with near-identical fates in the text — they need a real distinguishing visual detail, not just a color swap. Jessé and Calebe are both `tipo: povo`, `tier: standard`, elderly men — also need clear mutual distinction and distinction from the existing elderly patriarchs (Abraão, Noé — this exact pair had a real undetected near-clone once before, see `handover.md`).
- `data/personagens.json` field order for NEW entries only: `id, nome, tipo, retrato, tier, era, refs` then `resumo, contexto, relacoes` on following lines — no `x`/`y` fields (see Architecture note above). Existing entries are untouched and keep their `x`/`y`.
- `scripts/geometry-audit.js` (already in the repo since the navigation redesign) must be run as part of this task's validation — `node scripts/geometry-audit.js assets/retratos`.
- No quizzes/gamification — this project is free-exploration content only.

---

### Task 1: Add the 8 characters, their portraits, and the 15 edges

**Files:**
- Modify: `data/personagens.json` — add 8 character entries, add 15 edges
- Create: `assets/retratos/urias.svg`
- Create: `assets/retratos/jesse.svg`
- Create: `assets/retratos/nabal.svg`
- Create: `assets/retratos/calebe.svg`
- Create: `assets/retratos/elcana.svg`
- Create: `assets/retratos/hofni.svg`
- Create: `assets/retratos/fineias.svg`
- Create: `assets/retratos/efraim.svg`

**Interfaces:**
- Consumes: existing `personagens.json` schema, existing `edges` array format, existing portrait SVG technique (read 3-4 recent portraits first — e.g. `assets/retratos/jeremias.svg`, `sofonias.svg`, `booz.svg` — to internalize current style). Consumes `scripts/geometry-audit.js` (run it, don't modify it).
- Produces: nothing consumed by a later task — this is the only task in this plan.

- [ ] **Step 1: Add the 8 character entries to `data/personagens.json`**

Insert these 8 objects into the `personagens` array (position doesn't matter for rendering — insert each one near its narratively-related existing characters for readability, e.g. `urias` near `betsabe`, `jesse` near `david`, etc. — exact placement in the array is not load-bearing). Use this exact content. Note: these entries have NO `x`/`y` fields — that's intentional, see Global Constraints.

```json
    { "id": "urias", "nome": "Urias, o hitita", "tipo": "estrangeiro", "retrato": "assets/retratos/urias.svg", "tier": "minor", "era": "2 Samuel · O reinado de David", "refs": "2 Sm 11",
      "resumo": "Soldado hitita do exército de David, um dos seus \"guerreiros valentes\", casado com Betsabé. Quando David a engravida durante a sua ausência em combate, Urias recusa-se a ir a casa dormir com a mulher enquanto os seus companheiros continuam acampados em guerra — uma lealdade que acaba por lhe custar a vida, quando David manda colocá-lo na linha da frente para morrer.",
      "contexto": "A sua integridade involuntária (não sabe que está a ser usado para encobrir o adultério) contrasta duramente com a traição do próprio rei que devia protegê-lo — um dos retratos mais desconfortáveis de injustiça real em toda a Bíblia.",
      "relacoes": "Marido de Betsabé, antes de David." },
    { "id": "jesse", "nome": "Jessé", "tipo": "povo", "retrato": "assets/retratos/jesse.svg", "tier": "standard", "era": "1 Samuel · Saul e David", "refs": "Rt 4:17,22; 1 Sm 16",
      "resumo": "Habitante de Belém, neto de Booz e Rute, pai de oito filhos — o mais novo dos quais, David, é escolhido por Deus através do profeta Samuel para ser rei, apesar de nem sequer ter sido chamado inicialmente para o desfile de apresentação.",
      "contexto": "A expressão \"rebento do tronco de Jessé\" (Is 11:1) torna-se, na tradição cristã, uma imagem do Messias que viria da sua linhagem — Jesus é chamado \"filho de David\", descendente direto de Jessé.",
      "relacoes": "Neto de Booz e Rute. Pai de David, entre outros filhos." },
    { "id": "nabal", "nome": "Nabal", "tipo": "povo", "retrato": "assets/retratos/nabal.svg", "tier": "minor", "era": "1 Samuel · Saul e David", "refs": "1 Sm 25",
      "resumo": "Rico proprietário de rebanhos no Carmelo, primeiro marido de Abigail, recusa-se rudemente a recompensar David e os seus homens por terem protegido os seus pastores. Poucos dias depois, ao saber como a sua mulher evitou a vingança de David, tem uma espécie de colapso e morre.",
      "contexto": "O seu próprio nome, \"Nabal\", significa \"insensato\" em hebraico — o texto já o apresenta como um homem cujo comportamento vai justificar o próprio nome.",
      "relacoes": "Marido de Abigail, antes de David." },
    { "id": "calebe", "nome": "Calebe", "tipo": "povo", "retrato": "assets/retratos/calebe.svg", "tier": "standard", "era": "Os Juízes", "refs": "Nm 13–14; Js 14–15; Jz 1:12-15",
      "resumo": "Um dos doze espias enviados por Moisés a explorar Canaã, é um dos únicos dois (com Josué) a trazer um relatório de fé em vez de medo — e por isso o único da sua geração, além de Josué, autorizado a entrar na Terra Prometida. Já idoso, recebe Hebron como herança e oferece a mão da sua filha Acsa a quem conquistar Debir.",
      "contexto": "A sua fidelidade ao longo de décadas — desde jovem espia até guerreiro idoso ainda a pedir \"a montanha\" que Deus lhe tinha prometido (Js 14:12) — torna-o um dos poucos personagens do Antigo Testamento sem nenhuma falha moral registada.",
      "relacoes": "Irmão mais velho de Otoniel. A sua filha Acsa viria a casar com o próprio Otoniel — o seu tio." },
    { "id": "elcana", "nome": "Elcana", "tipo": "povo", "retrato": "assets/retratos/elcana.svg", "tier": "minor", "era": "1 Samuel · Ana e Samuel", "refs": "1 Sm 1",
      "resumo": "Marido de Ana (e de uma segunda mulher, Penina), leva a família todos os anos a Silo para oferecer sacrifícios. Consola Ana quando ela chora por não ter filhos, e mais tarde alegra-se com o nascimento de Samuel, fruto da oração dela.",
      "contexto": "A sua pergunta a Ana — \"não valho eu mais para ti do que dez filhos?\" (1 Sm 1:8) — mostra um afeto genuíno, mas também como a fertilidade era, na época, a medida quase exclusiva do valor de uma mulher.",
      "relacoes": "Marido de Ana. Pai de Samuel." },
    { "id": "hofni", "nome": "Hofni", "tipo": "sacerdote", "retrato": "assets/retratos/hofni.svg", "tier": "minor", "era": "1 Samuel · Ana e Samuel", "refs": "1 Sm 2; 4",
      "resumo": "Filho mais velho do sacerdote Eli, abusa da sua posição no santuário de Silo para roubar as melhores partes das ofertas do povo e explorar as mulheres que ali serviam. Morre em combate contra os filisteus no mesmo dia em que a Arca da Aliança é capturada.",
      "contexto": "A sua corrupção, e a do irmão Finéias, é dada como razão direta para a queda da casa de Eli — um aviso bíblico recorrente de que a autoridade religiosa não protege quem a usa mal.",
      "relacoes": "Filho de Eli. Irmão de Finéias." },
    { "id": "fineias", "nome": "Finéias", "tipo": "sacerdote", "retrato": "assets/retratos/fineias.svg", "tier": "minor", "era": "1 Samuel · Ana e Samuel", "refs": "1 Sm 2; 4",
      "resumo": "Filho mais novo do sacerdote Eli, tal como o irmão Hofni, abusa do seu cargo sacerdotal em Silo. Morre no mesmo combate contra os filisteus em que a Arca é capturada — a notícia da sua morte, e a da Arca, provoca a morte súbita do próprio pai.",
      "contexto": "A sua viúva dá à luz um filho no momento de saber destas mortes e chama-lhe Icabode, \"a glória partiu\" (1 Sm 4:21) — um dos nomes mais carregados de significado de toda a Bíblia.",
      "relacoes": "Filho de Eli. Irmão de Hofni." },
    { "id": "efraim", "nome": "Efraim", "tipo": "povo", "retrato": "assets/retratos/efraim.svg", "tier": "minor", "era": "José no Egito", "refs": "Gn 41:52; 48; 1 Cr 7:20-27",
      "resumo": "Segundo filho de José, nascido no Egito. Ao abençoar os netos já cego e doente, Jacob cruza deliberadamente as mãos e dá a Efraim, o mais novo, a bênção maior que normalmente cabia ao primogénito — um gesto que ecoa toda uma vida de bênçãos inesperadas na família.",
      "contexto": "A sua linhagem viria a dar o nome a uma das doze tribos de Israel, tão importante no Reino do Norte que \"Efraim\" se torna, nos livros proféticos, quase um sinónimo poético para o próprio Reino de Israel.",
      "relacoes": "Filho de José. Antepassado de Josué, várias gerações depois (1 Cr 7:20-27)." }
```

- [ ] **Step 2: Add the 15 new edges**

At the end of the `edges` array, add:
```json
    ["urias", "betsabe", "spouse"],
    ["jesse", "david", "parent"],
    ["booz", "jesse", "descendant", "2 gerações, via Obede · Rt 4:17,22"],
    ["rute", "jesse", "descendant", "2 gerações, via Obede · Rt 4:17,22"],
    ["abigail", "nabal", "spouse"],
    ["calebe", "otoniel", "sibling"],
    ["elcana", "ana", "spouse"],
    ["elcana", "samuel", "parent"],
    ["ana", "samuel", "parent"],
    ["eli", "hofni", "parent"],
    ["eli", "fineias", "parent"],
    ["hofni", "fineias", "sibling"],
    ["jose", "efraim", "parent"],
    ["efraim", "josue", "descendant", "várias gerações, incerta · 1 Cr 7:20-27"],
    ["absalao", "salomao", "sibling"]
```
Remember the trailing comma on the previous last edge line needs adding since it's no longer the last element.

Two of these (`ana→samuel`, `absalao→salomao`) connect characters that already existed before this round — they were simply missing edges despite both characters' text describing the relationship. The other 13 involve the 8 new characters.

- [ ] **Step 3: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"`

Run the consistency check:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json','utf8'));
const ids = new Set(d.personagens.map(p=>p.id));
console.log('total personagens:', d.personagens.length);
console.log('duplicate ids:', d.personagens.length - ids.size);
console.log('missing retrato:', d.personagens.filter(p=>!p.retrato).length);
let badEdges = 0;
d.edges.forEach(e => { if(!ids.has(e[0]) || !ids.has(e[1])) badEdges++; });
console.log('bad edge refs:', badEdges);
console.log('total edges:', d.edges.length);
const eraNames = new Set(d.eras.map(e=>e.nome));
let missingEra = [];
d.personagens.forEach(p => { if (!eraNames.has(p.era)) missingEra.push(p.id + ':' + p.era); });
console.log('personagens with an era not in eras[]:', JSON.stringify(missingEra));
"
```
Expected: `total personagens: 105`, `duplicate ids: 0`, `missing retrato: 0`, `bad edge refs: 0`, `total edges: 92`, `personagens with an era not in eras[]: []` (all 8 new characters use eras that already exist in the `eras[]` list added by the navigation redesign — no new era needed).

- [ ] **Step 4: Draw the 8 portrait SVGs**

Create each file at `viewBox="0 0 100 100"`, following the established layer order and warm-only palette. Read `assets/retratos/jeremias.svg`, `sofonias.svg`, `booz.svg`, `eli.svg` first.

Casting direction per character, each with a "check against" list:

- **`urias.svg`** — estrangeiro (Hittite soldier), minor tier. Military bearing, foreign origin marked tastefully (not a caricature) — perhaps a distinct helmet/headwrap or armor collar detail. Loyal, steady expression (not villainous — he's the wronged party). **Check against:** `naama.svg` (closest role — foreign military commander), `ebede_meleque.svg` (other respectful foreign-courtier depiction), `golias.svg` (foreign soldier, but Golias is antagonist — Urias must NOT read as villainous or aggressive the way Golias does).
- **`jesse.svg`** — povo, standard tier, elderly father of many sons. Dignified, weathered farmer/shepherd patriarch look. **Check against:** `booz.svg` (same tipo+tier), `noe.svg` and `abraao.svg` (the two existing elderly patriarchs — this exact pairing had a real undetected near-clone once before in this project, see `handover.md`; Jessé must NOT converge on either).
- **`nabal.svg`** — povo, minor tier. Should read as harsh/self-satisfied/mean-spirited (his name means "fool," his one scene is refusing basic hospitality). **Check against:** `booz.svg`, `godolias.svg` (other minor-tier povo characters).
- **`calebe.svg`** — povo, standard tier, elderly faithful warrior. Should read as resolute/undiminished by age (unlike Jessé's more domestic-patriarch read) — a soldier's bearing even in old age. **Check against:** `jesse.svg` (drawn in this same task — they must not converge on each other either), `noe.svg`, `abraao.svg`, `josue.svg` (Calebe's actual companion-in-faith, same era of loyalty).
- **`elcana.svg`** — povo, minor tier. Devoted husband, gentle/earnest expression. **Check against:** `booz.svg`, `baruque.svg`, `godolias.svg`.
- **`hofni.svg`** and **`fineias.svg`** — sacerdote, minor tier, BROTHERS with nearly identical narrative fates — the highest near-clone risk in this round. Give each a genuinely distinct anchor detail (e.g. one visibly older/more senior in bearing since Hofni is the elder brother, a different priestly-garment accent, different hair/beard treatment) — do not let them differ only by a color swap. **Check against:** each other (the most important comparison in this task), `eli.svg` (their father — must not look like carbon copies of him either), `amasias.svg` (the other existing corrupt-priest character — thematically similar, must read as visually distinct).
- **`efraim.svg`** — povo, minor tier, a young man (son of José, appears as a child/young man in Gn 48). **Check against:** `jose.svg` (his father — avoid a father/son near-clone), `caim.svg`/`abel.svg`/`sete.svg` (existing "jovem"-adjacent minor characters, for silhouette variety).

After drawing all 8, compare them against each other too — especially Jessé vs. Calebe, and Hofni vs. Finéias as called out above.

- [ ] **Step 5: Validate the 8 SVGs**

Run: `node -e "['urias','jesse','nabal','calebe','elcana','hofni','fineias','efraim'].forEach(id => { require('fs').readFileSync('assets/retratos/'+id+'.svg','utf8'); }); console.log('all 8 read ok')"`

Confirm structural well-formedness (viewBox, matched tags, self-closed elements, in-range coordinates) for each file. No browser is available — if you genuinely have one (check before assuming), verify visually; otherwise trace by hand and say so plainly.

- [ ] **Step 6: Manual palette check**

Read back all 8 new SVG files. Confirm every `fill`/`stroke` color is warm-toned. List colors per file in your report.

- [ ] **Step 7: Run the geometry-audit script**

Run: `node scripts/geometry-audit.js assets/retratos`

Compare against the known pre-existing baseline (~30 pairs, documented in `handover.md`'s backlog section — none should involve this round's 8 new characters). Report:
1. The full script output.
2. Any NEW flagged pair involving one of the 8 new characters.
3. For each new flagged pair, open both files and manually judge: genuine near-clone, or false positive (shared generic element like the neck rectangle)? State your judgment with evidence.

If you find a genuine new near-clone among this round's own characters (especially Hofni/Finéias or Jessé/Calebe), redraw the weaker offender before committing. Do not commit a genuine unresolved near-clone.

- [ ] **Step 8: Commit**

```bash
git add data/personagens.json assets/retratos/urias.svg assets/retratos/jesse.svg assets/retratos/nabal.svg assets/retratos/calebe.svg assets/retratos/elcana.svg assets/retratos/hofni.svg assets/retratos/fineias.svg assets/retratos/efraim.svg
git commit -m "feat: add Urias, Jessé, Nabal, Calebe, Elcana, Hofni, Finéias, Efraim + 15 missing edges (Ronda 7)"
```

**Report:** include (1) color list per new SVG file, (2) explicit confirmation of what you compared each portrait against and what changed (or why not) — especially the Hofni/Finéias and Jessé/Calebe pairs, (3) the Step 3 consistency check output, (4) the full Step 7 geometry-audit output plus your judgment on any newly-flagged pair, (5) commit hash(es).
