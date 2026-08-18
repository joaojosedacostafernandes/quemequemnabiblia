# Ronda 6 — Ezequiel e os 12 Profetas Menores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 15 new characters (Ezequiel + 12 minor prophets + Gómer + Amasias) to "Os Personagens da Bíblia", plus formalize the geometry-audit script that has been informally reused since Round 4.

**Architecture:** No structural changes to the site. One new file: `scripts/geometry-audit.js` (a standalone Node utility, not part of the site's runtime — the site never loads it).

**Tech Stack:** Static HTML/CSS/JS, hand-authored SVG, Node.js (for the new audit script and validation commands only).

**Spec:** `docs/superpowers/specs/2026-08-18-ezequiel-profetas-menores-design.md`

## Global Constraints

- Portrait SVGs: `viewBox="0 0 100 100"`, layer order clothing-band → neck rect → face ellipse → ears → hair/veil/beard → eyebrows → eyes → nose → mouth → beard-if-drawn-last (established real convention since Round 4: the beard is drawn as the LAST element, after the mouth — follow the actual files, not a literal reading of "hair/veil/beard" as one adjacent group).
- Palette: warm tones only — browns, terracottas, ochres, olives, cream. No blue, violet, or teal.
- Every new portrait must be genuinely unique — no palette-swap of an existing portrait's shapes. This round has the highest same-type/same-tier density so far (10 `profeta`-type characters, 9 of them `tier: minor`) — take the per-character "anchor visual detail" direction in Task 2 seriously, and compare exhaustively, not just against 2-3 named files.
- `data/personagens.json` field order per character: `id, nome, tipo, retrato, tier, x, y, era, refs` then `resumo, contexto, relacoes` on following lines — match the existing file's formatting exactly.
- `layout.width` changes from `3300` to `3800`. `index.html`'s `<svg id="graph" ...>` `viewBox` must change from `0 0 3300 820` to `0 0 3800 820` in the same commit — these two values must always match.
- No quizzes/gamification — this project is free-exploration content only.
- Gómer's content must treat marital infidelity with indirect, age-appropriate language — no explicit description, only the essential meaning (unfaithfulness followed by being taken back, as a sign of God's faithful love). This is a deliberate, Isabel-approved editorial choice, not a simplification to fix later.
- Sofonias's genealogy connecting him to King Ezequias must be phrased as a traditional identification ("a tradição identifica..."), not stated as settled historical fact — the biblical text names an ancestor "Ezequias" without explicitly confirming it is the king.

---

### Task 1: Add the geometry-audit script + 6 richer characters (Ezequiel, Oséias, Gómer, Amós, Amasias, Jonas)

**Files:**
- Create: `scripts/geometry-audit.js`
- Modify: `data/personagens.json` — add 6 character entries, add 2 edges, change `layout.width`
- Modify: `index.html` — change `viewBox` on `<svg id="graph">`
- Create: `assets/retratos/ezequiel.svg`
- Create: `assets/retratos/oseias.svg`
- Create: `assets/retratos/gomer.svg`
- Create: `assets/retratos/amos.svg`
- Create: `assets/retratos/amasias.svg`
- Create: `assets/retratos/jonas.svg`

**Interfaces:**
- Consumes: existing `personagens.json` schema and `edges` format; existing portrait SVG technique (read `assets/retratos/jeremias.svg`, `isaias.svg`, `senaqueribe.svg` first — these are the most recently-drawn, closest-in-style files).
- Produces: `scripts/geometry-audit.js`, which Task 2's implementer will run against the full `assets/retratos/` directory (including this task's 6 new files) as part of its own validation.

- [ ] **Step 1: Create `scripts/geometry-audit.js`**

Create the file with this exact content:

```javascript
// Geometry-fingerprint distinctness audit for assets/retratos/*.svg
// Compares SHAPE data (path d=, ellipse/circle rx/ry/cx/cy etc), ignoring fill/stroke color,
// to flag pairs of portraits that share suspiciously similar underlying geometry.
//
// Usage: node scripts/geometry-audit.js assets/retratos
//
// IMPORTANT: this script produces false positives. Generic shared elements (e.g. the
// neck rectangle, or a commonly-reused eye/nose shape) count toward the overlap score.
// Every flagged pair needs manual visual confirmation — it is a lead, not a verdict.

const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/geometry-audit.js <path-to-retratos-dir>');
  process.exit(1);
}
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort();

function extractShapeTokens(svgText) {
  const elRe = /<(ellipse|circle|path|rect|polygon|line)\b([^>]*)\/?>/g;
  const tokens = [];
  let m;
  while ((m = elRe.exec(svgText))) {
    const tag = m[1];
    const attrs = m[2];
    const geomAttrs = {};
    const attrRe = /([\w-]+)="([^"]*)"/g;
    let am;
    while ((am = attrRe.exec(attrs))) {
      const key = am[1];
      if (['fill', 'stroke', 'class', 'id', 'stroke-width', 'opacity', 'clip-path'].includes(key)) continue;
      geomAttrs[key] = am[2];
    }
    if (tag === 'path' && geomAttrs.d) {
      const norm = geomAttrs.d.replace(/-?\d+(\.\d+)?/g, (n) => Math.round(parseFloat(n) / 2) * 2);
      tokens.push('path:' + norm);
    } else {
      const norm = Object.keys(geomAttrs).sort().map(k => k + '=' + Math.round(parseFloat(geomAttrs[k]) / 2) * 2).join(',');
      tokens.push(tag + ':' + norm);
    }
  }
  return tokens;
}

const sigs = {};
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  sigs[f] = extractShapeTokens(text);
}

function overlap(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared++;
  const denom = Math.min(setA.size, setB.size) || 1;
  return shared / denom;
}

const flagged = [];
for (let i = 0; i < files.length; i++) {
  for (let j = i + 1; j < files.length; j++) {
    const o = overlap(sigs[files[i]], sigs[files[j]]);
    if (o >= 0.6) flagged.push({ a: files[i], b: files[j], overlap: (o * 100).toFixed(0) + '%' });
  }
}

flagged.sort((x, y) => parseFloat(y.overlap) - parseFloat(x.overlap));
console.log('Files scanned:', files.length);
console.log('Pairs flagged (>=60% shape-token overlap):', flagged.length);
flagged.forEach(f => console.log(' ', f.a, 'vs', f.b, '->', f.overlap));
```

- [ ] **Step 2: Run the script against the current cast as a smoke test**

Run: `node scripts/geometry-audit.js assets/retratos`
Expected: `Files scanned: 82` and a list of already-known flagged pairs (this is the pre-existing baseline — do not act on these, they belong to prior rounds and are logged in `handover.md`). This step just confirms the script works before relying on it in Task 2.

- [ ] **Step 3: Add the 6 character entries to `data/personagens.json`**

Insert these 6 objects into the `personagens` array (position doesn't matter for rendering — insert after `nabucodonosor` for readability). Use this exact content:

```json
    { "id": "oseias", "nome": "Oséias", "tipo": "profeta", "retrato": "assets/retratos/oseias.svg", "tier": "standard", "x": 3400, "y": 150, "era": "Oséias", "refs": "Os 1–3",
      "resumo": "Profeta do Reino de Israel (norte), pouco antes da sua queda. Deus manda-o casar com Gómer, cujo comportamento infiel se torna um sinal vivo do próprio comportamento de Israel para com Deus — mas Oséias vai buscá-la de volta, um gesto que espelha o amor fiel de Deus que nunca desiste do seu povo.",
      "contexto": "É um dos primeiros profetas a usar a imagem do casamento para descrever a relação entre Deus e o seu povo — uma imagem que a tradição bíblica volta a usar muitas vezes depois dele.",
      "relacoes": "Casado com Gómer." },
    { "id": "gomer", "nome": "Gómer", "tipo": "povo", "retrato": "assets/retratos/gomer.svg", "tier": "minor", "x": 3400, "y": 300, "era": "Oséias", "refs": "Os 1–3",
      "resumo": "Mulher de Oséias, cujo casamento difícil e cheio de infidelidades se torna, por ordem de Deus, um sinal profético da relação entre Deus e Israel. Apesar de tudo, Oséias vai buscá-la de volta e reconstrói o casamento — uma imagem do amor de Deus que continua fiel mesmo quando não é correspondido.",
      "contexto": "A sua história é difícil de contar a crianças em detalhe, mas o essencial passa bem: mesmo quando alguém se afasta, o amor fiel não desiste.",
      "relacoes": "Casada com Oséias." },
    { "id": "amos", "nome": "Amós", "tipo": "profeta", "retrato": "assets/retratos/amos.svg", "tier": "standard", "x": 3500, "y": 150, "era": "Amós", "refs": "Am 1–9; 7:10-17",
      "resumo": "Pastor e cultivador de sicómoros de Tecoa, chamado por Deus para profetizar contra as injustiças sociais do Reino de Israel (norte) — a exploração dos pobres, a corrupção dos ricos, um culto religioso vazio sem justiça verdadeira.",
      "contexto": "É um dos primeiros profetas a insistir que Deus se preocupa tanto com a justiça social como com o culto religioso correto — uma mensagem repetida por quase todos os profetas depois dele.",
      "relacoes": "Confrontado pelo sacerdote Amasias, que lhe manda deixar o santuário de Betel." },
    { "id": "amasias", "nome": "Amasias", "tipo": "sacerdote", "retrato": "assets/retratos/amasias.svg", "tier": "minor", "x": 3500, "y": 300, "era": "Amós", "refs": "Am 7:10-17",
      "resumo": "Sacerdote do santuário real de Betel, no Reino de Israel, confronta Amós e manda-o voltar para Judá, acusando-o de perturbar a paz do reino com as suas profecias de castigo.",
      "contexto": "O confronto entre os dois mostra a tensão entre o poder religioso instalado, ligado à corte do rei, e a voz profética independente que o desafia em nome de Deus.",
      "relacoes": "Sem relações familiares registadas — sacerdote do santuário de Betel, opositor de Amós." },
    { "id": "ezequiel", "nome": "Ezequiel", "tipo": "profeta", "retrato": "assets/retratos/ezequiel.svg", "tier": "major", "x": 3500, "y": 450, "era": "Ezequiel", "refs": "Ez 1–48",
      "resumo": "Sacerdote e profeta levado para o exílio em Babilónia, tem visões impressionantes — a glória de Deus sobre um carro de fogo com quatro rostos, e o vale dos ossos secos que ganham vida (Ez 37), símbolo da esperança de renascimento para um povo que se sente morto pelo exílio.",
      "contexto": "É a única grande voz profética que vive fisicamente no exílio, não em Jerusalém — a sua mensagem tem de sustentar a fé de um povo longe da sua terra e do seu Templo destruído, sem saber se algum dia voltará.",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo do exílio babilónico, na mesma geração de Jeremias." },
    { "id": "jonas", "nome": "Jonas", "tipo": "profeta", "retrato": "assets/retratos/jonas.svg", "tier": "standard", "x": 3600, "y": 150, "era": "Jonas", "refs": "Jn 1–4",
      "resumo": "Profeta que tenta fugir da missão de anunciar o castigo de Deus a Nínive, capital do império assírio, e é engolido por um grande peixe durante três dias antes de ser lançado em terra. Quando finalmente prega, toda a cidade se converte — mas Jonas fica aborrecido por Deus ter perdoado os seus inimigos.",
      "contexto": "É um livro cheio de humor e ironia, usado para ensinar que a misericórdia de Deus não tem fronteiras — alcança até os maiores inimigos de Israel, para grande desagrado do próprio profeta.",
      "relacoes": "Sem relações familiares registadas no grafo." }
```

- [ ] **Step 4: Change `layout.width`**

At the top of `data/personagens.json`, change:
```json
  "layout": { "width": 3300, "height": 820 },
```
to:
```json
  "layout": { "width": 3800, "height": 820 },
```

- [ ] **Step 5: Add 2 new edges**

At the end of the `edges` array (after the `joaquim → sedequias` line), add:
```json
    ["oseias", "gomer", "spouse"],
    ["ezequias", "sofonias", "descendant", "4 gerações, tradicional · Sf 1:1"]
```
Remember the trailing comma on the previous last line needs adding since it's no longer the last element. Note: `sofonias` is not created until Task 2 — this edge referencing `sofonias` will make the `bad edge refs` consistency check in Step 6 report 1 bad ref until Task 2 adds that character. This is expected and correct for this task; do not remove or change the edge. State this explicitly in your report so the task reviewer isn't alarmed by it.

- [ ] **Step 6: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"`
Expected: prints `valid`.

Also run this consistency check:
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
"
```
Expected: `total personagens: 88`, `duplicate ids: 0`, `missing retrato: 0`, `bad edge refs: 1` (the expected `sofonias` forward-reference — see Step 5), `total edges: 77`.

- [ ] **Step 7: Update the SVG viewBox in `index.html`**

Find `<svg id="graph" class="graph" viewBox="0 0 3300 820" role="group"` and change `3300` to `3800`.

- [ ] **Step 8: Draw the 6 portrait SVGs**

Create each file at `viewBox="0 0 100 100"`, following the established layer order and warm-only palette. Read `assets/retratos/jeremias.svg`, `isaias.svg`, `senaqueribe.svg` first to internalize the current technique.

Casting direction, each with a "check against" list:

- **`ezequiel.svg`** — profeta, major tier, sacerdote-prophet in exile. More solemn/formal than other prophets — consider a priestly vestment detail (a distinct band/stripe), fixed/visionary gaze. **Check against:** `isaias.svg`, `jeremias.svg` (the other two major-tier prophets — highest risk pair in this task).
- **`oseias.svg`** — profeta, standard tier. Contained sorrow/wounded-love expression (personal heartbreak, not national mourning). **Check against:** `jeremias.svg` (must NOT reuse Jeremias's "weeping prophet" grief register — Oséias reads as personal/romantic hurt, a different emotional register).
- **`gomer.svg`** — povo, minor tier. Distant/evasive expression, treated with dignity, no visual insinuation of anything explicit. **Check against:** other minor-tier "povo" characters already in the cast.
- **`amos.svg`** — profeta, standard tier. Rugged, outdoorsy (shepherd/farmer), firm and direct expression. **Check against:** `eliseu.svg`, `booz.svg`.
- **`amasias.svg`** — sacerdote, minor tier. Royal-shrine priestly vestments (distinct from legitimate Jerusalem priesthood), defensive-authority expression. **Check against:** `eli.svg` (the only other sacerdote-tipo character).
- **`jonas.svg`** — profeta, standard tier. Sulky/reluctant expression (the prophet who doesn't want to be there). **Check against:** `elias.svg`, `natan.svg`.

After drawing all 6, compare them against each other too.

- [ ] **Step 9: Validate the 6 SVGs**

Run: `node -e "['ezequiel','oseias','gomer','amos','amasias','jonas'].forEach(id => { require('fs').readFileSync('assets/retratos/'+id+'.svg','utf8'); }); console.log('all 6 read ok')"`

No browser is available — confirm structural well-formedness (one open/close `<svg>` tag, all elements self-closed, coordinates within -2 to 102) for each file. Full real-browser verification happens separately, done by the controller after this task.

- [ ] **Step 10: Manual palette check**

Read back all 6 new SVG files. Confirm every `fill`/`stroke` color is warm-toned. List colors per file in your report.

- [ ] **Step 11: Commit**

```bash
git add scripts/geometry-audit.js data/personagens.json index.html assets/retratos/ezequiel.svg assets/retratos/oseias.svg assets/retratos/gomer.svg assets/retratos/amos.svg assets/retratos/amasias.svg assets/retratos/jonas.svg
git commit -m "feat: add geometry-audit script + Ezequiel, Oséias, Gómer, Amós, Amasias, Jonas (Ronda 6, parte 1)"
```

**Report:** include (1) color list per new SVG file, (2) explicit confirmation of what you compared each portrait against and what changed (or why not), (3) the Step 6 consistency check output (note the expected 1 bad edge ref), (4) confirmation the geometry-audit script ran successfully in Step 2, (5) commit hash(es).

---

### Task 2: Add the 9 minor-tier prophets (Miqueias, Naum, Habacuc, Sofonias, Ageu, Zacarias, Malaquias, Joel, Abdias)

**Files:**
- Modify: `data/personagens.json` — add 9 character entries
- Create: `assets/retratos/miqueias.svg`
- Create: `assets/retratos/naum.svg`
- Create: `assets/retratos/habacuc.svg`
- Create: `assets/retratos/sofonias.svg`
- Create: `assets/retratos/ageu.svg`
- Create: `assets/retratos/zacarias.svg`
- Create: `assets/retratos/malaquias.svg`
- Create: `assets/retratos/joel.svg`
- Create: `assets/retratos/abdias.svg`

**Interfaces:**
- Consumes: `scripts/geometry-audit.js` (created in Task 1 — run it yourself as your final validation step, see Step 6 below), the 6 portraits Task 1 already drew (compare against `ezequiel.svg` and `oseias.svg`/`amos.svg`/`jonas.svg` as noted below), the pre-existing `sofonias` forward-reference edge from Task 1 (`["ezequias", "sofonias", "descendant", ...]` — this task's `sofonias` entry resolves that reference; after this task, the "bad edge refs" count must be 0).
- Produces: nothing consumed by a later task — this is the last task in this plan.

**This is the highest same-type/same-tier density round so far: all 9 characters here are `tipo: "profeta"`, `tier: "minor"`. Give each one exactly one distinct anchor visual detail tied to their book's message (see casting table below) — do not let any two converge on "generic minor prophet with different robe color."**

- [ ] **Step 1: Add the 9 character entries to `data/personagens.json`**

Insert these 9 objects into the `personagens` array (insert after `jonas` for readability). Use this exact content:

```json
    { "id": "miqueias", "nome": "Miqueias", "tipo": "profeta", "retrato": "assets/retratos/miqueias.svg", "tier": "minor", "x": 3700, "y": 150, "era": "Miqueias", "refs": "Mi 1–7",
      "resumo": "Profeta contemporâneo de Isaías, denuncia a injustiça social e a opressão dos poderosos sobre os pequenos agricultores de Judá. É dele a profecia que anuncia Belém como o lugar de nascimento do futuro rei prometido por Deus (Mi 5:2), mais tarde lida como referência a Jesus.",
      "contexto": "A sua frase mais conhecida resume o que Deus pede: \"praticar a justiça, amar a bondade e caminhar humildemente com o teu Deus\" (Mi 6:8).",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo de Isaías, Acaz e Ezequias." },
    { "id": "naum", "nome": "Naum", "tipo": "profeta", "retrato": "assets/retratos/naum.svg", "tier": "minor", "x": 3600, "y": 300, "era": "Naum", "refs": "Na 1–3",
      "resumo": "Profeta que anuncia a queda da poderosa Nínive, capital do império assírio que décadas antes se tinha arrependido com a pregação de Jonas — agora volta às suas crueldades e é destruída, cumprindo o aviso de que nenhum império é demasiado forte para escapar ao julgamento de Deus.",
      "contexto": "A queda real de Nínive em 612 a.C., às mãos dos babilónios, confirma historicamente o que o profeta anuncia — um dos poucos livros proféticos cujo cumprimento é registado fora da Bíblia.",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "habacuc", "nome": "Habacuc", "tipo": "profeta", "retrato": "assets/retratos/habacuc.svg", "tier": "minor", "x": 3700, "y": 300, "era": "Habacuc", "refs": "Hab 1–3",
      "resumo": "Profeta que ousa perguntar diretamente a Deus porque permite que o mal e a injustiça pareçam vencer, e porque usa um povo violento (a Babilónia) para castigar Judá. Termina em confiança: \"o justo viverá pela sua fé\" (Hab 2:4), mesmo sem todas as respostas.",
      "contexto": "É um dos raros livros bíblicos estruturados como um diálogo direto e honesto de queixa a Deus — uma oração que a tradição cristã voltou a citar muitas vezes (por exemplo, S. Paulo em Romanos 1:17).",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "sofonias", "nome": "Sofonias", "tipo": "profeta", "retrato": "assets/retratos/sofonias.svg", "tier": "minor", "x": 3400, "y": 450, "era": "Sofonias", "refs": "Sf 1–3",
      "resumo": "Profeta durante o reinado de Josias, anuncia o \"Dia do Senhor\" — um julgamento severo sobre Judá e as nações vizinhas pela idolatria — mas termina com uma das promessas mais alegres de todo o Antigo Testamento: Deus a cantar de alegria pelo seu povo (Sf 3:17).",
      "contexto": "A sua genealogia (Sf 1:1) remonta quatro gerações a um \"Ezequias\" que a tradição identifica com o rei de Judá do mesmo nome — o que faria de Sofonias um descendente da própria família real.",
      "relacoes": "Tradicionalmente ligado ao rei Ezequias, 4 gerações depois (Sf 1:1)." },
    { "id": "ageu", "nome": "Ageu", "tipo": "profeta", "retrato": "assets/retratos/ageu.svg", "tier": "minor", "x": 3400, "y": 600, "era": "Ageu", "refs": "Ag 1–2",
      "resumo": "Profeta que anima o povo, recém-regressado do exílio babilónico, a retomar a reconstrução do Templo de Jerusalém, que tinha ficado parada por desânimo. Em poucos meses, o seu incentivo direto e prático leva as obras a recomeçar.",
      "contexto": "É um profeta pragmático — não fala de visões dramáticas, mas de prioridades concretas: \"vocês cuidam das vossas casas e deixam a casa de Deus em ruínas?\" (Ag 1:4).",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo de Zacarias, ambos profetas do regresso do exílio." },
    { "id": "zacarias", "nome": "Zacarias", "tipo": "profeta", "retrato": "assets/retratos/zacarias.svg", "tier": "minor", "x": 3500, "y": 600, "era": "Zacarias", "refs": "Zc 1–14",
      "resumo": "Profeta contemporâneo de Ageu, anima também a reconstrução do Templo através de visões simbólicas — cavalos de cores, um sumo sacerdote purificado, um rei humilde que entra em Jerusalém montado num jumentinho (Zc 9:9), uma imagem que os Evangelhos aplicam a Jesus.",
      "contexto": "As suas visões finais sobre um rei que vem em paz, e não em conquista, moldam profundamente a forma como os primeiros cristãos leram a entrada de Jesus em Jerusalém antes da Paixão.",
      "relacoes": "Sem relações familiares registadas no grafo. Contemporâneo de Ageu, ambos profetas do regresso do exílio. (Não confundir com o Zacarias do Novo Testamento, pai de João Batista.)" },
    { "id": "malaquias", "nome": "Malaquias", "tipo": "profeta", "retrato": "assets/retratos/malaquias.svg", "tier": "minor", "x": 3600, "y": 600, "era": "Malaquias", "refs": "Ml 1–3",
      "resumo": "Último dos profetas do Antigo Testamento na ordem tradicional, critica sacerdotes desleixados e um povo que deixou de confiar em Deus, mas termina com a promessa de um \"mensageiro\" que prepara o caminho antes de um grande Dia do Senhor — lida pela tradição cristã como anúncio de João Batista.",
      "contexto": "O próprio nome \"Malaquias\" significa \"o meu mensageiro\" em hebraico — alguns estudiosos pensam que pode não ser um nome próprio, mas um título anónimo tirado do próprio texto do livro (Ml 3:1).",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "joel", "nome": "Joel", "tipo": "profeta", "retrato": "assets/retratos/joel.svg", "tier": "minor", "x": 3700, "y": 450, "era": "Joel", "refs": "Jl 1–3",
      "resumo": "Profeta que descreve uma devastadora praga de gafanhotos como aviso do \"Dia do Senhor\", e chama o povo ao jejum e à conversão sincera. Promete que Deus um dia \"derramará o seu Espírito sobre toda a carne\" (Jl 2:28) — uma profecia que São Pedro cita no dia de Pentecostes (Atos 2).",
      "contexto": "A data exata do livro é incerta — pode situar-se tanto antes como depois do exílio — o que torna Joel um dos profetas menores mais difíceis de situar no tempo com precisão.",
      "relacoes": "Sem relações familiares registadas no grafo." },
    { "id": "abdias", "nome": "Abdias", "tipo": "profeta", "retrato": "assets/retratos/abdias.svg", "tier": "minor", "x": 3600, "y": 450, "era": "Abdias", "refs": "Abd 1",
      "resumo": "Autor do mais curto de todos os livros do Antigo Testamento (só um capítulo), anuncia o castigo de Edom por se ter alegrado e aproveitado da queda de Jerusalém em vez de ajudar um povo vizinho e aparentado.",
      "contexto": "Edom descendia de Esaú, irmão de Jacob — a sua traição na hora da desgraça de Judá é lida como a quebra definitiva de um laço de família muito antigo.",
      "relacoes": "Sem relações familiares registadas no grafo." }
```

- [ ] **Step 2: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/personagens.json','utf8')); console.log('valid')"`
Expected: prints `valid`.

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
"
```
Expected: `total personagens: 97`, `duplicate ids: 0`, `missing retrato: 0`, `bad edge refs: 0` (this task's `sofonias` entry resolves Task 1's forward reference), `total edges: 77`.

- [ ] **Step 3: Draw the 9 portrait SVGs — one distinct anchor detail each**

Read `assets/retratos/ezequiel.svg`, `oseias.svg`, `amos.svg`, `jonas.svg` (drawn in Task 1) plus 2-3 more existing files first.

Casting table — one anchor visual detail per character, beyond color:

- **`miqueias.svg`** — serious social-denunciation gaze, short neat beard texture. **Check against:** `isaias.svg` (contemporary of Isaías — convergence risk).
- **`naum.svg`** — contained fury/severity (the harshest judgment prophet).
- **`habacuc.svg`** — upward/questioning gaze (dialogues directly with God).
- **`sofonias.svg`** — solemn expression with a trace of serenity (the book ends in joy).
- **`ageu.svg`** — practical/builder appearance — consider a tool or building-related gesture/detail worked into the clothing.
- **`zacarias.svg`** — very wide-open/visionary eyes (a book full of symbolic visions).
- **`malaquias.svg`** — older, tired appearance (criticizes sloppy priests).
- **`joel.svg`** — alarmed/urgent expression (the locust plague).
- **`abdias.svg`** — the briefest and most direct of all — austere expression, minimal ornamentation.

After drawing all 9, compare them **exhaustively against each other** (36 pairs) — this is the highest same-type/same-tier density round so far, do not skip this. Also compare each against the Task 1 portraits named above, and against any other existing `profeta`-type portrait you judge plausible (e.g. `natan.svg`, `eliseu.svg`, `samuel.svg`, `elias.svg`, `jeremias.svg`).

- [ ] **Step 4: Validate the 9 SVGs**

Run: `node -e "['miqueias','naum','habacuc','sofonias','ageu','zacarias','malaquias','joel','abdias'].forEach(id => { require('fs').readFileSync('assets/retratos/'+id+'.svg','utf8'); }); console.log('all 9 read ok')"`

Confirm structural well-formedness (viewBox, matched tags, self-closed elements, in-range coordinates) for each file.

- [ ] **Step 5: Manual palette check**

Read back all 9 new SVG files. Confirm every `fill`/`stroke` color is warm-toned. List colors per file in your report.

- [ ] **Step 6: Run the geometry-audit script and report its output**

Run: `node scripts/geometry-audit.js assets/retratos`

Compare the output against the known pre-existing baseline (the same ~30 pairs seen in prior rounds — listed in `handover.md`'s backlog section, all already-logged, none involving this round's characters). Report:
1. The full script output.
2. Any NEW flagged pair involving one of this round's 15 characters (Task 1's 6 or this task's 9) that was NOT in the pre-existing baseline.
3. For each new flagged pair, open both files and manually judge: genuine near-clone, or false positive (shared generic element)? State your judgment with evidence (specific shape/color differences, or lack thereof).

If you find a genuine new near-clone among this round's own characters, redraw the weaker offender before committing. Do not commit a genuine unresolved near-clone.

- [ ] **Step 7: Commit**

```bash
git add data/personagens.json assets/retratos/miqueias.svg assets/retratos/naum.svg assets/retratos/habacuc.svg assets/retratos/sofonias.svg assets/retratos/ageu.svg assets/retratos/zacarias.svg assets/retratos/malaquias.svg assets/retratos/joel.svg assets/retratos/abdias.svg
git commit -m "feat: add Miqueias, Naum, Habacuc, Sofonias, Ageu, Zacarias, Malaquias, Joel, Abdias (Ronda 6, parte 2)"
```

**Report:** include (1) color list per new SVG file, (2) explicit confirmation of the anchor-detail choice per character and what you compared against, (3) the Step 2 consistency check output (confirm `bad edge refs: 0`), (4) the full Step 6 geometry-audit output plus your judgment on any new flagged pair, (5) commit hash(es).
