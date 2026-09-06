# Ronda 13 — O Exílio e o Regresso Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 11 new characters (Daniel, Belsazar, Dario o Medo, Esdras, Neemias, Zorobábel, Jesua, Ester, Mardoqueu, Assuero, Amã) as a new 8th galaxy "O Exílio e o Regresso", each with full content and a unique hand-drawn SVG portrait.

**Architecture:** No structural changes to the engine. Same `data/personagens.json` schema, same `assets/retratos/<id>.svg` portrait convention. The only structural addition is an 8th entry in the existing `capitulos[]` array (introduced in Ronda 12 for galaxy navigation).

**Tech Stack:** Static HTML/CSS/JS, hand-authored SVG.

**Spec:** `docs/superpowers/specs/2026-09-06-exilio-regresso-design.md`

## Global Constraints

- Portrait SVGs: `viewBox="0 0 100 100"`, layer order clothing-band → neck rect → face ellipse → ears → hair/veil/beard → eyebrows → eyes → nose → mouth.
- Palette: warm tones only — browns, terracottas, ochres, olives, cream. No blue, violet, or teal.
- Every new portrait must be genuinely unique — no palette-swap of an existing portrait's shapes. Cross-check against the named comparison characters in the spec's casting section, not just within this batch. Also cross-check new portraits against each other.
- `data/personagens.json` field order per character (no `x`/`y` — obsolete since Ronda 8, position is decided by physics): `id, nome, tipo, retrato, tier, era, refs` on the first line, then `resumo`, `contexto`, `relacoes` on following lines — match the existing file's formatting exactly (see any entry from `abdias` onward for the exact style).
- ⚠️ **Cross-galaxy edges must use `descendant`/`sibling`/`affinity`, never `parent`/`spouse`.** Since Ronda 12, a character's galaxy is decided by `RevealGraph.groupByCapitulo`, which follows the same `reveals` edges as the physics engine (synthesized from `parent`/`spouse`). A `parent`/`spouse` edge to a character in a different existing galaxy would silently reassign that character to the wrong galaxy. `sibling`/`descendant`/`affinity` always become `weakRefs` (never `reveals`) — safe to use across galaxies, and they render as the "Também aparece em" cross-galaxy link in the character's detail card.
- No quizzes/gamification — this project is free-exploration content only.
- Ester's and Mardoqueu's portraits, and Amã's, must read as respectful period depictions — no antisemitic caricature tropes on Amã despite him being the villain.

---

### Task 1: Add Daniel, Belsazar, Dario, Esdras, Neemias, Zorobábel, Jesua (content + portraits + edges + new galaxy)

**Files:**
- Modify: `data/personagens.json` — add 7 character entries, add 1 cross-galaxy edge, add the 8th `capitulos[]` entry (with only these 7 ids in `arranque` — Task 2 appends the remaining 4)
- Create: `assets/retratos/daniel.svg`
- Create: `assets/retratos/belsazar.svg`
- Create: `assets/retratos/dario.svg`
- Create: `assets/retratos/esdras.svg`
- Create: `assets/retratos/neemias.svg`
- Create: `assets/retratos/zorobabel.svg`
- Create: `assets/retratos/jesua.svg`

**Interfaces:**
- Consumes: existing `personagens.json` schema, existing `edges` array format `[idA, idB, type, label?]`, existing `capitulos[]` format `{nome, arranque:[ids]}`, existing portrait SVG technique (read `assets/retratos/isaias.svg`, `assets/retratos/ezequiel.svg`, `assets/retratos/nabucodonosor.svg` — the most recent prophet/king portraits — before drawing).
- Produces: the 8th `capitulos[]` entry with `"nome": "O Exílio e o Regresso"` and `arranque` containing these 7 ids — Task 2 reads this back and appends its own 4 ids to the same array (do not let Task 2 create a duplicate entry).

- [ ] **Step 1: Add the 7 character entries to `data/personagens.json`**

Insert these 7 objects at the end of the `personagens` array (after the `abdias` entry, before the closing `]`) — remember to add a trailing comma after the `abdias` entry's closing `}`:

```json
    { "id": "daniel", "nome": "Daniel", "tipo": "profeta", "retrato": "assets/retratos/daniel.svg", "tier": "major", "era": "Daniel", "refs": "Dn 1–12",
      "resumo": "Jovem nobre judeu levado para a Babilónia no início do exílio, recusa-se a contaminar-se com a comida da mesa real e mantém-se fiel a Deus apesar da pressão constante para se assimilar à corte estrangeira. Interpreta sonhos e visões com sabedoria dada por Deus, sobrevivendo à cova dos leões sob o rei Dario.",
      "contexto": "O livro de Daniel combina narrativa de corte com visões apocalípticas sobre impérios que se sucedem uns aos outros — um género que viria a influenciar fortemente a literatura judaica e cristã posterior, incluindo o Apocalipse.",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "belsazar", "nome": "Belsazar", "tipo": "rei", "retrato": "assets/retratos/belsazar.svg", "tier": "standard", "era": "Daniel", "refs": "Dn 5",
      "resumo": "Rei que, durante um banquete com os utensílios sagrados roubados do Templo, vê uma mão misteriosa escrever na parede \"Mene, Mene, Tequel, Parsim\". Daniel interpreta a mensagem como o fim do seu reinado — nessa mesma noite, a Babilónia cai perante os medos e persas.",
      "contexto": "A Bíblia chama-lhe \"filho\" de Nabucodonosor (Dn 5:2), mas historicamente Belsazar era filho de Nabónido, um rei posterior não coberto neste grafo — \"filho\" no texto entende-se hoje como título dinástico/sucessório, não parentesco literal, por isso não há aqui nenhuma ligação familiar a Nabucodonosor.",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "dario", "nome": "Dario o Medo", "tipo": "rei", "retrato": "assets/retratos/dario.svg", "tier": "standard", "era": "Daniel", "refs": "Dn 6",
      "resumo": "Governante que, pressionado por nobres com ciúmes do favor real dado a Daniel, assina relutantemente um decreto que o obriga a lançá-lo à cova dos leões. Passa a noite em jejum e sem conseguir dormir, e corre ao amanhecer, aliviado, a encontrá-lo ileso.",
      "contexto": "\"Dario o Medo\" é um dos maiores enigmas históricos do Antigo Testamento — não corresponde com clareza a nenhum monarca independente conhecido dos registos seculares da época; pode ser um título alternativo para Ciro ou para um sátrapa regional.",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "esdras", "nome": "Esdras", "tipo": "sacerdote", "retrato": "assets/retratos/esdras.svg", "tier": "major", "era": "Esdras-Neemias", "refs": "Ed 7–10",
      "resumo": "Sacerdote-escriba que lidera um segundo grupo de exilados de volta a Jerusalém, décadas depois do primeiro regresso, com autorização do rei persa para ensinar e restaurar a Lei de Moisés. Confronta com dureza a crise dos casamentos com mulheres estrangeiras, que ameaçava diluir a identidade do povo.",
      "contexto": "A tradição judaica atribui-lhe (de forma disputada pelos estudiosos modernos) um papel central na compilação e fixação de vários livros do Antigo Testamento — é por vezes chamado \"pai do judaísmo\" pós-exílico.",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo de Neemias." },
    { "id": "neemias", "nome": "Neemias", "tipo": "povo", "retrato": "assets/retratos/neemias.svg", "tier": "major", "era": "Esdras-Neemias", "refs": "Ne 1–13",
      "resumo": "Copeiro de confiança do rei persa Artaxerxes, chora ao saber que as muralhas de Jerusalém continuam em ruínas décadas depois do primeiro regresso. Obtém licença e recursos do rei para ir reconstruí-las, e organiza o povo para completar a obra em apenas 52 dias, apesar da oposição de Sambalat e Tobias.",
      "contexto": "Como governador, implementa também reformas sociais concretas — perdão de dívidas entre o povo, renovação da aliança — mostrando que a reconstrução física andava de mãos dadas com a reconstrução da comunidade.",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo de Esdras." },
    { "id": "zorobabel", "nome": "Zorobábel", "tipo": "povo", "retrato": "assets/retratos/zorobabel.svg", "tier": "standard", "era": "Esdras-Neemias", "refs": "Ed 2–6; Ag 1–2; Zc 4",
      "resumo": "Descendente da linhagem real de David, lidera a primeira vaga de exilados a regressar a Jerusalém e encabeça a reconstrução das fundações do Templo, incentivado pelos profetas Ageu e Zacarias depois de anos de obras paradas.",
      "contexto": "É a última figura davídica conhecida a exercer liderança política real antes de a linhagem desaparecer dos registos históricos até reaparecer, séculos depois, nas genealogias de Jesus.",
      "relacoes": "Bisneto do rei Joaquim (Jeconias) — ver ligação a Joaquim, na galáxia \"Os Grandes Profetas\"." },
    { "id": "jesua", "nome": "Jesua", "tipo": "sacerdote", "retrato": "assets/retratos/jesua.svg", "tier": "minor", "era": "Esdras-Neemias", "refs": "Ed 2–5; Zc 3",
      "resumo": "Sumo sacerdote do regresso, trabalha lado a lado com Zorobábel na reconstrução do Templo. Numa visão simbólica de Zacarias, as suas vestes sujas são trocadas por vestes limpas — sinal da purificação do sacerdócio depois do exílio.",
      "contexto": "O nome \"Jesua\" é a mesma forma hebraica de \"Josué\", mas mantido aqui deliberadamente distinto do Josué conquistador de Canaã (outra personagem já existente neste grafo) para não confundir os dois na interface.",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo de Zorobábel." }
```

- [ ] **Step 2: Add the cross-galaxy edge**

At the end of the `edges` array (after the `["zabulao", "issacar", "sibling"]` line), add (remember the trailing comma on the previous last line):

```json
    ["joaquim", "zorobabel", "descendant", "3 gerações, via Jeconias · 1 Cr 3:17-19"]
```

Do NOT use `parent` or `descendant` in the direction `zorobabel → joaquim` — the direction matters for readability in the UI but not for galaxy ownership (both directions are safe here since `descendant` never enters `reveals`); keep `joaquim` first to match the ancestor-first convention already used by every other `descendant` edge in this file (e.g. `sem → abraao`, `salomao → ezequias`).

- [ ] **Step 3: Add the 8th `capitulos[]` entry**

After the `"Os Profetas Menores"` entry (the last one in the array, just before its closing `]`), add (remember the trailing comma on the previous last line):

```json
    { "nome": "O Exílio e o Regresso", "arranque": ["daniel", "belsazar", "dario", "esdras", "neemias", "zorobabel", "jesua"] }
```

- [ ] **Step 4: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"`
Expected: prints `valid` with no error.

Also run:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json','utf8'));
const ids = new Set(d.personagens.map(p=>p.id));
console.log('total personagens:', d.personagens.length);
console.log('duplicate ids:', d.personagens.length - ids.size);
console.log('missing retrato:', d.personagens.filter(p=>!p.retrato).length);
console.log('has x/y (should be 0 new ones):', d.personagens.filter(p=>p.x!==undefined).length);
let badEdges = 0;
d.edges.forEach(e => { if(!ids.has(e[0]) || !ids.has(e[1])) badEdges++; });
console.log('bad edge refs:', badEdges);
console.log('capitulos:', d.capitulos.length);
"
```
Expected: `total personagens: 112`, `duplicate ids: 0`, `missing retrato: 0`, `capitulos: 8`, `bad edge refs: 0`.

- [ ] **Step 5: Draw the 7 portrait SVGs**

Create each file at `viewBox="0 0 100 100"`, following the established layer order (clothing-band → neck rect → face ellipse → ears → hair/veil/beard → eyebrows → eyes → nose → mouth) and warm-only palette. Read 3-4 existing portraits first, especially the most recent ones (`assets/retratos/isaias.svg`, `assets/retratos/ezequiel.svg`, `assets/retratos/nabucodonosor.svg`, `assets/retratos/eli.svg`).

Casting direction per character, each with an explicit "check against" list:

- **`daniel.svg`** — profeta, major tier. Serene but resolute, stands apart even under pressure to assimilate: calm firm gaze, NOT Jeremias' grieving downcast look nor Isaías' distant one. **Check against:** `jeremias.svg`, `isaias.svg`, `ezequiel.svg` (high risk — four major-tier "profeta" portraits in the cast now, must all read distinctly).
- **`belsazar.svg`** — rei, standard tier. Young, reckless, feasting king — a moment of sudden shock/fear (the writing on the wall is his defining scene). **Check against:** `nabucodonosor.svg` (high risk — two Babylonian kings back to back, but must read as different generations/temperaments: conqueror vs. reckless heir), `acab.svg`.
- **`dario.svg`** — rei, standard tier. Older, reluctant ruler, anguished/remorseful expression (forced into a decree he regrets). **Check against:** `saul.svg`, `senaqueribe.svg`.
- **`esdras.svg`** — sacerdote, major tier. Middle-aged scribe-priest, expression of textual/legal authority (the "restorer of the Law"). **Check against:** `eli.svg`, `natan.svg`, `baruque.svg` (another scribe).
- **`neemias.svg`** — povo, major tier. Court official turned builder/governor — practical, determined expression, posture of someone who organizes manual labor. **Check against:** `esdras.svg` (high risk — two return-era leaders in the same galaxy), `godolias.svg`.
- **`zorobabel.svg`** — povo, standard tier. Young Davidic prince, visible royal bearing but no crown (not a coronated king). **Check against:** `david.svg`, `salomao.svg`, `roboao.svg`.
- **`jesua.svg`** — sacerdote, minor tier. High priest, vestments distinct from Esdras (scribe-priest) and from Eli/Finéias (earlier priests). **Check against:** `eli.svg`, `fineias.svg`, `esdras.svg`.

After drawing all 7, do one more pass comparing all 7 against EACH OTHER.

- [ ] **Step 6: Validate the 7 SVGs**

Run: `node -e "['daniel','belsazar','dario','esdras','neemias','zorobabel','jesua'].forEach(id => { require('fs').readFileSync('assets/retratos/'+id+'.svg','utf8'); }); console.log('all 7 read ok')"`

No browser is available in this environment — confirm structural well-formedness instead: exactly one opening `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`, exactly one closing `</svg>`, every interior element self-closed (`/>`), every numeric coordinate plausibly within -2 to 102. Report any malformed lines. Full real-browser click-through verification happens in Task 3.

- [ ] **Step 7: Manual palette check**

Read back all 7 new SVG files. Confirm every `fill`/`stroke` color is a warm tone (brown/terracotta/ochre/olive/cream range) — no blue/violet/teal. List the colors used per file in your report.

- [ ] **Step 8: Commit**

```bash
git add data/personagens.json assets/retratos/daniel.svg assets/retratos/belsazar.svg assets/retratos/dario.svg assets/retratos/esdras.svg assets/retratos/neemias.svg assets/retratos/zorobabel.svg assets/retratos/jesua.svg
git commit -m "feat: add Daniel, Belsazar, Dario, Esdras, Neemias, Zorobábel, Jesua + galáxia O Exílio e o Regresso"
```

**Report:** include (1) the color list per file from Step 7, (2) explicit confirmation of each comparison from Step 5 and what changed as a result (or why not), (3) the Step 4 consistency check output, (4) the commit hash.

---

### Task 2: Add Ester, Mardoqueu, Assuero, Amã (content + portraits + edges)

**Files:**
- Modify: `data/personagens.json` — add 4 character entries, add 2 edges, append 4 ids to the `"O Exílio e o Regresso"` `capitulos[]` entry's `arranque` array (created in Task 1 — do not create a new entry)
- Create: `assets/retratos/ester.svg`
- Create: `assets/retratos/mardoqueu.svg`
- Create: `assets/retratos/assuero.svg`
- Create: `assets/retratos/ama.svg`

**Interfaces:**
- Consumes: the `capitulos[]` entry `{ "nome": "O Exílio e o Regresso", "arranque": [...7 ids from Task 1] }` — append this task's 4 ids to that same array, keep the same entry (do not duplicate the galaxy).
- Produces: nothing consumed by a later task.

- [ ] **Step 1: Add the 4 character entries to `data/personagens.json`**

Insert these 4 objects after the `jesua` entry added in Task 1 (before the closing `]` of `personagens`):

```json
    { "id": "ester", "nome": "Ester", "tipo": "matriarca", "retrato": "assets/retratos/ester.svg", "tier": "major", "era": "Ester", "refs": "Et 1–10",
      "resumo": "Jovem judia órfã, criada pelo primo Mardoqueu, torna-se rainha da Pérsia depois de um concurso de beleza em todo o império. Quando um decreto ameaça exterminar todos os judeus, arrisca a própria vida ao apresentar-se ao rei sem ser chamada — \"quem sabe se não foi para uma hora como esta que chegaste à realeza?\" (Et 4:14).",
      "contexto": "É o único livro da Bíblia que nunca menciona Deus explicitamente — a sua presença lê-se nas \"coincidências\" da trama. A festa judaica do Purim celebra até hoje esta libertação.",
      "relacoes": "Prima e filha adotiva de Mardoqueu. Casada com o rei Assuero." },
    { "id": "mardoqueu", "nome": "Mardoqueu", "tipo": "povo", "retrato": "assets/retratos/mardoqueu.svg", "tier": "major", "era": "Ester", "refs": "Et 2–10",
      "resumo": "Oficial judeu da corte persa, cria a prima órfã Ester \"como sua própria filha\" (Et 2:7). Recusa-se a curvar-se perante Amã, descobre uma conspiração contra o rei, e acaba elevado a segundo homem mais poderoso do império depois da queda de Amã.",
      "contexto": "O seu nome pode estar relacionado com o deus babilónico Marduk — uma prática comum entre judeus exilados, que adotavam nomes de sonoridade local sem abandonar a sua fé.",
      "relacoes": "Primo e pai adotivo de Ester." },
    { "id": "assuero", "nome": "Assuero", "tipo": "rei", "retrato": "assets/retratos/assuero.svg", "tier": "standard", "era": "Ester", "refs": "Et 1–10",
      "resumo": "Rei persa (tradicionalmente identificado com Xerxes I) que deposta a rainha Vasti por desobediência e escolhe Ester como nova rainha através de uma busca por todo o império. Mais tarde, concede aos judeus o direito de se defenderem do decreto de extermínio tramado por Amã.",
      "contexto": "A identificação com Xerxes I baseia-se na correspondência do nome hebraico/persa e na cronologia histórica do seu reinado.",
      "relacoes": "Casado com Ester." },
    { "id": "ama", "nome": "Amã", "tipo": "povo", "retrato": "assets/retratos/ama.svg", "tier": "standard", "era": "Ester", "refs": "Et 3–7",
      "resumo": "Vizir promovido pelo rei Assuero, enfurece-se quando Mardoqueu se recusa a curvar-se perante ele e trama a aniquilação de todos os judeus do império. A forca que manda construir para Mardoqueu acaba por ser a sua própria ruína.",
      "contexto": "É identificado como \"agagita\" — descendente de Agag, rei dos amalecitas, um antigo povo inimigo de Israel (1 Sm 15) — aprofundando o sentido de rivalidade antiga por trás do conflito.",
      "relacoes": "Sem relações familiares registadas no grafo." }
```

- [ ] **Step 2: Add 2 edges**

At the end of the `edges` array (after the `["joaquim", "zorobabel", "descendant", ...]` line added in Task 1), add:

```json
    ["mardoqueu", "ester", "parent"],
    ["assuero", "ester", "spouse"]
```

- [ ] **Step 3: Append to the `capitulos[]` entry**

Find the entry added in Task 1: `{ "nome": "O Exílio e o Regresso", "arranque": ["daniel", "belsazar", "dario", "esdras", "neemias", "zorobabel", "jesua"] }`. Change its `arranque` array to:

```json
["daniel", "belsazar", "dario", "esdras", "neemias", "zorobabel", "jesua", "ester", "mardoqueu", "assuero", "ama"]
```

- [ ] **Step 4: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"`
Expected: prints `valid`.

Also run:
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
const exilio = d.capitulos.find(c=>c.nome==='O Exílio e o Regresso');
console.log('exilio arranque length (expect 11):', exilio.arranque.length);
"
```
Expected: `total personagens: 116`, `duplicate ids: 0`, `missing retrato: 0`, `bad edge refs: 0`, `exilio arranque length (expect 11): 11`.

- [ ] **Step 5: Draw the 4 portrait SVGs**

Casting direction:

- **`ester.svg`** — matriarca, major tier. Young queen, serene beauty with underlying firmness/courage (the "for such a time as this" moment) — not merely pretty, must read as capable of the risk she takes. **Check against:** `abigail.svg`, `betsabe.svg`, `rebeca.svg` (high risk — several young/beautiful "matriarca" portraits already in the cast).
- **`mardoqueu.svg`** — povo, major tier. Middle-aged/older Jewish official, loyal and watchful, protective posture. **Check against:** `elcana.svg`, `eli.svg`.
- **`assuero.svg`** — rei, standard tier. Persian king — iconography distinct from the Babylonian/Assyrian kings already in the cast (Nabucodonosor, Senaqueribe, Belsazar) — Persian-style crown/dress, do not recolor the same patterns. **Check against:** `nabucodonosor.svg`, `belsazar.svg`, `senaqueribe.svg` (high risk — four foreign kings in the total cast now).
- **`ama.svg`** — povo, standard tier, antagonist. Wounded pride/contained hatred (the opposite of Mardoqueu's calm loyalty) — **must read as a period villain through posture/expression alone, never through antisemitic caricature tropes** (no exaggerated stereotyped features). **Check against:** `golias.svg`, `acab.svg`, `jezabel.svg`.

After drawing, compare all 4 against each other, and against the 7 from Task 1 (11 total in this galaxy).

- [ ] **Step 6: Validate the 4 SVGs**

Run: `node -e "['ester','mardoqueu','assuero','ama'].forEach(id => { require('fs').readFileSync('assets/retratos/'+id+'.svg','utf8'); }); console.log('all 4 read ok')"`

Same structural well-formedness check as Task 1 Step 6.

- [ ] **Step 7: Manual palette check**

Same as Task 1 Step 7, for these 4 files.

- [ ] **Step 8: Commit**

```bash
git add data/personagens.json assets/retratos/ester.svg assets/retratos/mardoqueu.svg assets/retratos/assuero.svg assets/retratos/ama.svg
git commit -m "feat: add Ester, Mardoqueu, Assuero, Amã — completa a galáxia O Exílio e o Regresso"
```

**Report:** same structure as Task 1's report, for these 4 characters.

---

### Task 3: Verification — tests, real browser, geometry audit

**Files:** none (verification only, unless a real bug is found).

- [ ] **Step 1: Run the automated test suite**

Run: `node scripts/test-reveal-graph.js`
Expected: `ALL PASS` — this round adds no new test cases (no new engine behavior, only data), but a broken JSON or a `parent`/`spouse` edge accidentally crossing galaxies could still surface here if it changes any existing assumption. If any test fails, treat it as a real bug and apply systematic-debugging before touching anything else.

- [ ] **Step 2: Serve the site and verify via Chrome headless + CDP (real clicks, never synthetic `dispatchEvent`/`.click()`)**

Verify, with screenshots read back:
1. The galaxy map shows 8 galaxies now, "O Exílio e o Regresso" with count "11 personagens".
2. Entering it shows all 11 characters (Daniel, Belsazar, Dario, Esdras, Neemias, Zorobábel, Jesua, Ester, Mardoqueu, Assuero, Amã) with distinct portraits.
3. Mardoqueu → Ester (parent) and Assuero ↔ Ester (spouse) edges render as connecting lines inside the galaxy.
4. Zorobábel's detail card shows "Também aparece em: Os Grandes Profetas" (the cross-galaxy link to Joaquim), and clicking it jumps directly there (with the hyperspace warp) and focuses Joaquim.
5. `RevealGraph.groupByCapitulo` (evaluate directly in the page) attributes all 11 new ids to the new capítulo — none leaked into an existing galaxy.

- [ ] **Step 3: Run the geometry audit against the full portrait set**

Run: `node scripts/geometry-audit.js assets/retratos`
Review flagged pairs involving any of the 11 new portraits — confirm each named "check against" comparison from Tasks 1-2 was genuinely done, not just asserted. Any genuine near-clone (not shared-generic-element noise) must be fixed before this task closes.

- [ ] **Step 4: Stop verification processes**

Kill only the specific Chrome/node processes this step started (by PID) — never `taskkill //IM chrome.exe` (kills every Chrome window on the machine, established mistake from Ronda 12 — do not repeat it).

**Report:** screenshots or explicit confirmation of each check in Step 2, the geometry audit output and what (if anything) was fixed, confirmation tests still pass.
