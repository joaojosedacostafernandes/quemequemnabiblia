# Juízes e Reis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 37 new characters (Judges, Ruth, 1-2 Samuel, 1-2 Kings through the divided kingdom) to `data/personagens.json`, each with full content AND a unique illustrated portrait from the start, closing out "Round 3" of the project.

**Architecture:** No new architecture — reuses the existing data model (`data/personagens.json`), the existing 8-value `tipo` icon system, and the existing portrait system (`assets/retratos/<id>.svg`, `retrato` field, engine fallback) exactly as built in Rounds 1-2. This is a pure content round: only `data/personagens.json`, `index.html` (one `viewBox` line), and new files under `assets/retratos/` are touched. `app.js` and `style.css` are not modified.

**Tech Stack:** Same as prior rounds — plain JSON data, hand-authored SVG portraits (viewBox `0 0 100 100`, flat vector style, warm palette).

**Spec:** `docs/superpowers/specs/2026-08-16-juizes-reis-design.md`

## Global Constraints

- `tipo` must be one of the 8 existing values: patriarca, matriarca, profeta, rei, sacerdote, jovem, povo, estrangeiro. No new type.
- `retrato` follows the exact existing pattern: `"retrato": "assets/retratos/<id>.svg"` inserted right after `"tipo"`.
- Every portrait: viewBox `0 0 100 100`, same layering order as `assets/retratos/adao.svg` (clothing → neck → face → ears → hair/veil/beard → eyebrows → eyes → nose → mouth), warm palette only (browns/terracottas/ochres/olives/cream — no cool/blue-grey).
- **Every portrait must be checked for distinctness against ALL previously-existing portraits, not just its own batch or this round.** By the end of this plan there will be 71 total. Round 2's final review found that per-batch-only comparison missed a real near-clone pair (Sara/Lia) that spanned two different batches — this round explicitly requires each task to spot-check its new portraits against a sample of already-shipped ones (especially same age/gender/role — e.g. new young male "povo" characters must be checked against Rúben, Simeão, Levi, Judá, Issacar, Zabulão, Dan, Neftali, Gad, Aser, and each other), and Task 8 runs a dedicated full-cast audit as a final safety net.
- Edge types are the 4 existing ones only: `parent`, `spouse`, `sibling`, `descendant` (the last with a generation-count label string as the 4th array element, e.g. `"12 gerações · 2 Rs 15-18"`). Not every character needs an edge — a character with no blood/marriage tie to anyone already in the graph (e.g. a foreign antagonist) can have none, same as Faraó in Round 1.
- All content in Portuguese (pt-PT), matching the existing tone: concrete, historically grounded, appropriate for children in catechism, careful with theological framing.

---

### Task 1: Layout expansion + characters — Josué, Otoniel, Eúde, Débora, Baraque, Jael

**Files:**
- Modify: `data/personagens.json` (layout + 6 new characters + their edges)
- Modify: `index.html` (one `viewBox` line)
- Create: `assets/retratos/josue.svg`, `assets/retratos/otoniel.svg`, `assets/retratos/eude.svg`, `assets/retratos/debora.svg`, `assets/retratos/baraque.svg`, `assets/retratos/jael.svg`

**Interfaces:**
- Consumes: the existing `data/personagens.json` shape (unchanged) and the portrait technique established in `assets/retratos/adao.svg` (Round 2, already in the repo).
- Produces: the new `layout` value (`{ "width": 2900, "height": 820 }`) that Tasks 2-8 build on top of, and the first 6 of 37 new character entries.

- [ ] **Step 1: Update `layout` in `data/personagens.json`**

Change:
```json
  "layout": { "width": 1700, "height": 720 },
```
to:
```json
  "layout": { "width": 2900, "height": 820 },
```

- [ ] **Step 2: Update the `viewBox` in `index.html`**

Change:
```html
      <svg id="graph" class="graph" viewBox="0 0 1700 720" role="group" aria-label="Mapa de personagens bíblicas e as suas relações">
```
to:
```html
      <svg id="graph" class="graph" viewBox="0 0 2900 820" role="group" aria-label="Mapa de personagens bíblicas e as suas relações">
```
(If the exact attribute order/whitespace differs slightly from what's shown here, match the existing line — only the `viewBox` value changes.)

- [ ] **Step 3: Append these 6 characters to the `personagens` array in `data/personagens.json`**

```json
    { "id": "josue", "nome": "Josué", "tipo": "povo", "retrato": "assets/retratos/josue.svg", "tier": "major", "x": 1660, "y": 420, "era": "Josué", "refs": "Js 1–24",
      "resumo": "Sucessor de Moisés, lidera o povo de Israel na travessia do rio Jordão e na conquista de Canaã, incluindo a célebre queda das muralhas de Jericó.",
      "contexto": "A conquista descrita no livro de Josué corresponde arqueologicamente a um processo mais gradual e complexo de assentamento israelita em Canaã do que uma única campanha militar.",
      "relacoes": "Descendente de Efraim, filho de José. Não é parente direto de Moisés — é o seu servo e sucessor escolhido por Deus." },
    { "id": "otoniel", "nome": "Otoniel", "tipo": "povo", "retrato": "assets/retratos/otoniel.svg", "tier": "minor", "x": 1720, "y": 100, "era": "Os Juízes", "refs": "Jz 3:7-11",
      "resumo": "Primeiro dos juízes de Israel, sobrinho de Calebe. Liberta o povo do domínio do rei de Arã-Naaraim depois de um período de opressão.",
      "contexto": "A sua história segue o padrão que se repete ao longo do livro dos Juízes: o povo afasta-se de Deus, é oprimido, clama por ajuda, e Deus levanta um libertador.",
      "relacoes": "Sobrinho de Calebe. Casa com Acsa, filha de Calebe." },
    { "id": "eude", "nome": "Eúde", "tipo": "povo", "retrato": "assets/retratos/eude.svg", "tier": "minor", "x": 1720, "y": 200, "era": "Os Juízes", "refs": "Jz 3:12-30",
      "resumo": "Segundo juiz de Israel, canhoto, liberta o povo do domínio do rei moabita Eglom através de um ato de coragem pessoal disfarçado de embaixada diplomática.",
      "contexto": "Ser canhoto é mencionado no texto como um pormenor tático — os guardas não esperavam uma arma escondida do lado direito do corpo.",
      "relacoes": "Da tribo de Benjamim. Sem outras relações familiares registadas no texto." },
    { "id": "debora", "nome": "Débora", "tipo": "profeta", "retrato": "assets/retratos/debora.svg", "tier": "major", "x": 1780, "y": 300, "era": "Os Juízes", "refs": "Jz 4–5",
      "resumo": "Única mulher juíza e profetisa de Israel, julga o povo debaixo de uma palmeira e lidera, junto com o general Baraque, a vitória sobre o exército cananeu de Sísera.",
      "contexto": "O \"Cântico de Débora\" (Jz 5), que celebra esta vitória, é considerado por muitos estudiosos um dos textos mais antigos preservados na Bíblia hebraica.",
      "relacoes": "Esposa de Lapidote. Lidera junto com o general Baraque." },
    { "id": "baraque", "nome": "Baraque", "tipo": "povo", "retrato": "assets/retratos/baraque.svg", "tier": "minor", "x": 1780, "y": 380, "era": "Os Juízes", "refs": "Jz 4–5",
      "resumo": "General israelita que, a pedido de Débora, lidera o exército contra as forças de Sísera, comandante do rei cananeu Jabim.",
      "contexto": "Baraque só aceita ir à batalha se Débora o acompanhar — um pormenor que a tradição lê como falta de fé, ou como reconhecimento da autoridade profética dela.",
      "relacoes": "Comandante militar sob a liderança de Débora. Sem relações familiares registadas." },
    { "id": "jael", "nome": "Jael", "tipo": "povo", "retrato": "assets/retratos/jael.svg", "tier": "minor", "x": 1780, "y": 460, "era": "Os Juízes", "refs": "Jz 4:17-22; 5:24-27",
      "resumo": "Mulher quenita que dá refúgio ao general cananeu Sísera em fuga, e o mata enquanto dorme, cumprindo a profecia de Débora de que a vitória seria atribuída a uma mulher.",
      "contexto": "Os quenitas eram um povo nómada aliado de Israel — a hospitalidade que Jael oferece a Sísera (e depois trai) reflete os códigos de hospitalidade do Próximo Oriente Antigo, tornando o seu ato ainda mais chocante para os ouvintes originais.",
      "relacoes": "Esposa de Héber, o quenita. Sem outras relações registadas." }
```

- [ ] **Step 4: Append these edges to the `edges` array in `data/personagens.json`**

None of these 6 characters have a blood/marriage tie to anyone already in the graph or to each other (Josué, Otoniel and Eúde are unrelated leaders; Débora/Baraque/Jael collaborate in the same story but aren't family). Do not add any edges for this task — leave the `edges` array as-is. (This is intentional, not an oversight — verify Step 6 accepts an unchanged edge count.)

- [ ] **Step 5: Draw the 6 portraits**

Study `assets/retratos/adao.svg` and `assets/retratos/moises.svg` (already in the repo) for technique. Casting direction:

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| josue | homem meia-idade/idoso, guerreiro | `#c99a6b` | castanho escuro curto, sem barba ou barba curta | expressão determinada |
| otoniel | homem jovem/meia-idade | `#d9b483` | castanho curto, sem barba | neutro |
| eude | homem jovem | `#c99a6b` | preto curto, sem barba | ar astuto |
| debora | mulher meia-idade | `#e8c9a0` | castanho escuro longo/coberto | expressão de autoridade |
| baraque | homem meia-idade | `#8a6238` | preto curto, barba curta | ar de guerreiro |
| jael | mulher jovem/meia-idade | `#c99a6b` | preto coberto/lenço | expressão firme/determinada |

Each must be genuinely unique (face rx/ry, hairline, eyebrow, mouth curve all deliberately varied) — AND must not read as a recolor of any already-shipped portrait. Spot-check Débora against Sara, Rebeca, Miriam (existing veiled/covered-hair women) and Jael against the same set. Spot-check Josué, Otoniel, Eúde, and Baraque against Adão, Noé, Sem, Abraão, Isaac, Jacob, Esaú, José, Moisés, Arão (existing adult men) — pick at least 2-3 to actually read and compare parameters against, not just assume.

- [ ] **Step 6: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
console.log(d.layout.width, d.layout.height, '—', d.personagens.length, 'personagens,', d.edges.length, 'edges');
"
```
Expected: `2900 820 — 40 personagens, 54 edges` (34 + 6 new; edges unchanged since this batch adds none).

```bash
node -e "
const fs = require('fs');
['josue','otoniel','eude','debora','baraque','jael'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve the site (via the `run` skill or your own static server — `file://` breaks `fetch`) and check in browser: the graph now extends further right, Josué appears near Moisés/Arão, the 5 Judges-era characters appear in a new cluster to the right, all 6 show portraits (not icons), clicking each shows correct content.

- [ ] **Step 7: Commit**

```bash
git add data/personagens.json index.html assets/retratos/josue.svg assets/retratos/otoniel.svg assets/retratos/eude.svg assets/retratos/debora.svg assets/retratos/baraque.svg assets/retratos/jael.svg
git commit -m "Expand canvas; add Josué, Otoniel, Eúde, Débora, Baraque, Jael"
```

---

### Task 2: Characters — Gideão, Abimeleque, Jefté, Sansão, Dalila

**Files:**
- Modify: `data/personagens.json`
- Create: `assets/retratos/gideao.svg`, `assets/retratos/abimeleque.svg`, `assets/retratos/jefte.svg`, `assets/retratos/sansao.svg`, `assets/retratos/dalila.svg`

**Interfaces:** same as Task 1 — reuses the established data shape and portrait technique. Do not touch `app.js`, `index.html`, or `style.css`.

- [ ] **Step 1: Append these 5 characters to `personagens`**

```json
    { "id": "gideao", "nome": "Gideão", "tipo": "povo", "retrato": "assets/retratos/gideao.svg", "tier": "major", "x": 1850, "y": 560, "era": "Os Juízes", "refs": "Jz 6–8",
      "resumo": "Chamado por Deus enquanto se esconde para debulhar trigo, lidera apenas 300 homens escolhidos a derrotar um enorme exército midianita, provando que a vitória vem de Deus e não do número de soldados.",
      "contexto": "O teste dos 300 homens (Jz 7) — escolhidos pela forma como bebiam água — é um dos episódios mais conhecidos do livro dos Juízes, usado ainda hoje como exemplo de liderança e fé.",
      "relacoes": "Pai de Abimeleque, entre setenta filhos. Recusa ser feito rei, mas o seu filho Abimeleque tenta tornar-se um." },
    { "id": "abimeleque", "nome": "Abimeleque", "tipo": "rei", "retrato": "assets/retratos/abimeleque.svg", "tier": "minor", "x": 1920, "y": 620, "era": "Os Juízes", "refs": "Jz 9",
      "resumo": "Filho de Gideão que mata os seus setenta meio-irmãos para se tornar governante de Siquém, tornando-se um contraexemplo do juiz ideal — movido por ambição, não por chamado divino.",
      "contexto": "A sua história é frequentemente lida como uma advertência bíblica contra a monarquia hereditária não escolhida por Deus, preparando o terreno para as tensões que voltam a surgir com Saul.",
      "relacoes": "Filho de Gideão. Mata os seus meios-irmãos para reclamar o poder." },
    { "id": "jefte", "nome": "Jefté", "tipo": "povo", "retrato": "assets/retratos/jefte.svg", "tier": "standard", "x": 1920, "y": 180, "era": "Os Juízes", "refs": "Jz 11–12",
      "resumo": "Filho rejeitado pela sua família por ser filho de uma prostituta, torna-se um líder militar respeitado e derrota os amonitas — mas faz um voto precipitado que acaba por custar a vida da sua própria filha.",
      "contexto": "O voto de Jefté é um dos episódios mais debatidos da Bíblia, lido por uns como um exemplo trágico das consequências de promessas precipitadas feitas a Deus.",
      "relacoes": "Filho de Gileade e de uma prostituta. Pai de uma filha não nomeada no texto." },
    { "id": "sansao", "nome": "Sansão", "tipo": "povo", "retrato": "assets/retratos/sansao.svg", "tier": "major", "x": 1990, "y": 280, "era": "Os Juízes", "refs": "Jz 13–16",
      "resumo": "Nazireu dotado de força sobrenatural desde o nascimento, luta sozinho contra os filisteus ao longo de várias histórias — até ser traído por Dalila, que descobre o segredo da sua força no cabelo nunca cortado.",
      "contexto": "O voto de nazireu (Nm 6) incluía nunca cortar o cabelo, nunca beber vinho e nunca tocar num cadáver — Sansão quebra os três votos ao longo da sua história, um padrão que a narrativa usa para mostrar o seu carácter impulsivo.",
      "relacoes": "Filho de Manoá, da tribo de Dã. Nunca chega a ter filhos ou esposa reconhecida no texto — Dalila é a sua companheira, não esposa formal." },
    { "id": "dalila", "nome": "Dalila", "tipo": "estrangeiro", "retrato": "assets/retratos/dalila.svg", "tier": "standard", "x": 1990, "y": 380, "era": "Os Juízes", "refs": "Jz 16:4-22",
      "resumo": "Mulher filisteia que, subornada pelos chefes filisteus, descobre repetidamente o segredo da força de Sansão até o convencer a revelar que está no seu cabelo, entregando-o assim aos seus inimigos.",
      "contexto": "Ao contrário de Jael, que trai um inimigo de Israel, Dalila trai um herói israelita a favor dos filisteus — a narrativa bíblica trata-a sempre como uma figura do lado adversário, nunca israelita.",
      "relacoes": "Sem relações familiares registadas. Associada aos chefes filisteus que a subornam." }
```

- [ ] **Step 2: Append this edge to `edges`**

```json
    ["gideao", "abimeleque", "parent"]
```

- [ ] **Step 3: Draw the 5 portraits**

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| gideao | homem meia-idade | `#d9b483` | castanho escuro, barba curta | expressão cautelosa/pensativa |
| abimeleque | homem jovem/meia-idade | `#d9b483` | castanho escuro, sem barba | expressão ambiciosa/dura — deve ser claramente distinto do pai, Gideão |
| jefte | homem meia-idade | `#8a6238` | preto médio, barba curta | expressão sofrida/grave |
| sansao | homem jovem/meia-idade, muito forte | `#c99a6b` | preto muito longo (característica central), sem barba ou barba curta | traço mais marcante do lote — cabelo comprido é o ponto central da sua história |
| dalila | mulher jovem, estrangeira (filisteia) | `#e8c9a0` | preto longo ondulado | expressão calculista |

Genuinely unique per character, and check against both this task's neighbors AND already-shipped characters — Gideão/Abimeleque are father/son, so treat them with the same care Round 2 gave Isaac/Abraão or Esaú/Jacob (different face proportions, not just different beard). Sansão's long hair should look different from any long-haired character already shipped (check e.g. Eva, Raquel, Golias if already drawn in a parallel task — if not yet drawn, check against Eva at minimum).

- [ ] **Step 4: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges');
"
```
Expected: `45 personagens, 55 edges`

```bash
node -e "
const fs = require('fs');
['gideao','abimeleque','jefte','sansao','dalila'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve and check in browser: all 5 render with portraits, Gideão→Abimeleque parent line visible, content correct on click.

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json assets/retratos/gideao.svg assets/retratos/abimeleque.svg assets/retratos/jefte.svg assets/retratos/sansao.svg assets/retratos/dalila.svg
git commit -m "Add Gideão, Abimeleque, Jefté, Sansão, Dalila"
```

---

### Task 3: Characters — Noemi, Rute, Booz, Ana, Eli

**Files:**
- Modify: `data/personagens.json`
- Create: `assets/retratos/noemi.svg`, `assets/retratos/rute.svg`, `assets/retratos/booz.svg`, `assets/retratos/ana.svg`, `assets/retratos/eli.svg`

**Interfaces:** same as Task 1.

- [ ] **Step 1: Append these 5 characters to `personagens`**

```json
    { "id": "noemi", "nome": "Noemi", "tipo": "matriarca", "retrato": "assets/retratos/noemi.svg", "tier": "minor", "x": 1850, "y": 720, "era": "Rute", "refs": "Rt 1",
      "resumo": "Israelita que perde o marido e os dois filhos em Moabe, e regressa a Belém com a sua nora Rute, que se recusa a abandoná-la.",
      "contexto": "O livro de Rute passa-se \"nos dias em que os juízes governavam\" (Rt 1:1) — uma história pequena e pessoal, contada em paralelo com a violência do livro dos Juízes.",
      "relacoes": "Sogra de Rute. Avó de Obede, bisavó de Jessé, pai de David." },
    { "id": "rute", "nome": "Rute", "tipo": "estrangeiro", "retrato": "assets/retratos/rute.svg", "tier": "standard", "x": 1920, "y": 760, "era": "Rute", "refs": "Rt 1–4",
      "resumo": "Mulher moabita que, depois de enviuvar, escolhe ficar com a sua sogra Noemi em vez de regressar à sua terra — \"o teu povo será o meu povo, e o teu Deus, o meu Deus\" (Rt 1:16). Casa com Booz e torna-se bisavó de David.",
      "contexto": "Sendo moabita, Rute é uma estrangeira integrada por escolha própria no povo de Israel — a sua inclusão na genealogia de David é um sinal recorrente na Bíblia de que a pertença ao povo de Deus não é só de sangue.",
      "relacoes": "Nora de Noemi. Casa com Booz. Mãe de Obede, avó de Jessé, bisavó de David." },
    { "id": "booz", "nome": "Booz", "tipo": "povo", "retrato": "assets/retratos/booz.svg", "tier": "minor", "x": 1990, "y": 720, "era": "Rute", "refs": "Rt 2–4",
      "resumo": "Proprietário rico de Belém, parente de Noemi, que mostra bondade a Rute quando ela colhe espigas nos seus campos, e acaba por casar com ela, assumindo o papel de \"resgatador\" familiar.",
      "contexto": "O direito de resgate (levirato) permitia a um parente próximo casar com a viúva de um familiar falecido para preservar a linhagem e as terras da família — a base legal de todo o desenlace do livro de Rute.",
      "relacoes": "Parente de Noemi. Casa com Rute. Pai de Obede, avô de Jessé, bisavô de David." },
    { "id": "ana", "nome": "Ana", "tipo": "matriarca", "retrato": "assets/retratos/ana.svg", "tier": "standard", "x": 2100, "y": 100, "era": "1 Samuel · Ana e Samuel", "refs": "1 Sm 1–2",
      "resumo": "Mulher estéril que ora fervorosamente no santuário de Silo por um filho, prometendo consagrá-lo a Deus — e dá à luz Samuel, que entrega ao serviço do templo assim que é desmamado.",
      "contexto": "A sua oração (1 Sm 2:1-10) é um dos grandes cânticos de louvor do Antigo Testamento, e serve de modelo literário para o cântico de Maria (o Magnificat) no Evangelho de Lucas.",
      "relacoes": "Esposa de Elcana. Mãe de Samuel." },
    { "id": "eli", "nome": "Eli", "tipo": "sacerdote", "retrato": "assets/retratos/eli.svg", "tier": "standard", "x": 2100, "y": 200, "era": "1 Samuel · Ana e Samuel", "refs": "1 Sm 1–4",
      "resumo": "Sumo sacerdote e último juiz de Silo, cria Samuel no templo depois de Ana o entregar. Os seus próprios filhos, Hofni e Finéias, corrompem o sacerdócio, trazendo julgamento sobre a sua casa.",
      "contexto": "A sua morte, ao cair de uma cadeira ao saber que a Arca da Aliança foi capturada pelos filisteus (1 Sm 4:18), marca simbolicamente o fim de uma era de liderança sacerdotal falhada, abrindo caminho para Samuel.",
      "relacoes": "Cria Samuel, filho de Ana, no templo de Silo. Pai de Hofni e Finéias." }
```

- [ ] **Step 2: Append this edge to `edges`**

```json
    ["rute", "booz", "spouse"]
```

(Noemi's relationship to Rute is a mother-in-law tie, which has no edge type in this project's 4-type vocabulary — leave it as text-only in `relacoes`, same convention already used elsewhere for non-blood/non-marriage ties.)

- [ ] **Step 3: Draw the 5 portraits**

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| noemi | mulher idosa | `#e8c9a0` | grisalho, véu simples | expressão de luto/resiliência |
| rute | mulher jovem, estrangeira (moabita) | `#d9b483` | castanho longo | expressão de determinação/lealdade |
| booz | homem meia-idade | `#c99a6b` | castanho grisalho curto, barba curta | expressão generosa |
| ana | mulher jovem/meia-idade | `#e8c9a0` | castanho médio, véu leve | expressão de fé/súplica |
| eli | homem idoso | `#c99a6b` | grisalho, barba grisalha longa | pode sugerir-se cegueira com olhos semicerrados; expressão cansada |

Check Noemi and Ana (both veiled/covered older or middle-aged women) against Sara, Rebeca, Lia, Miriam — this project has already had one near-clone incident among exactly this kind of character (Round 2's Sara/Lia), so take particular care here. Eli is the second elderly bearded man in this task's era-cluster after Josué/Gideão (Task 1/2) — check against those plus Noé, Abraão, Moisés, Arão.

- [ ] **Step 4: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges');
"
```
Expected: `50 personagens, 56 edges`

```bash
node -e "
const fs = require('fs');
['noemi','rute','booz','ana','eli'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve and check in browser.

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json assets/retratos/noemi.svg assets/retratos/rute.svg assets/retratos/booz.svg assets/retratos/ana.svg assets/retratos/eli.svg
git commit -m "Add Noemi, Rute, Booz, Ana, Eli"
```

---

### Task 4: Characters — Samuel, Saul, Jónatas, David, Golias

**Files:**
- Modify: `data/personagens.json`
- Create: `assets/retratos/samuel.svg`, `assets/retratos/saul.svg`, `assets/retratos/jonatas.svg`, `assets/retratos/david.svg`, `assets/retratos/golias.svg`

**Interfaces:** same as Task 1. This is a major, well-known cluster — take extra care, these are the characters children will recognize most.

- [ ] **Step 1: Append these 5 characters to `personagens`**

```json
    { "id": "samuel", "nome": "Samuel", "tipo": "profeta", "retrato": "assets/retratos/samuel.svg", "tier": "major", "x": 2170, "y": 150, "era": "1 Samuel · Ana e Samuel", "refs": "1 Sm 1–25",
      "resumo": "Último dos juízes e primeiro dos grandes profetas de Israel, ouve a voz de Deus ainda criança no templo. Unge Saul como primeiro rei de Israel, e mais tarde David, quando Saul se afasta de Deus.",
      "contexto": "A transição que Samuel medeia — de uma confederação de tribos lideradas por juízes para uma monarquia unificada — é uma das mudanças políticas mais significativas de toda a história bíblica de Israel.",
      "relacoes": "Filho de Ana e Elcana, criado por Eli. Unge Saul e, mais tarde, David como reis." },
    { "id": "saul", "nome": "Saul", "tipo": "rei", "retrato": "assets/retratos/saul.svg", "tier": "major", "x": 2240, "y": 80, "era": "1 Samuel · Saul e David", "refs": "1 Sm 9–31",
      "resumo": "Escolhido por sorte divina e ungido por Samuel, torna-se o primeiro rei de Israel. Vitorioso no início, vai-se progressivamente afastando de Deus por desobediência e ciúme de David, terminando a vida em derrota e suicídio numa batalha contra os filisteus.",
      "contexto": "O pedido do povo por \"um rei como as outras nações\" (1 Sm 8:5) é apresentado no texto como uma rejeição implícita do governo direto de Deus — a monarquia nasce já marcada por essa tensão.",
      "relacoes": "Pai de Jónatas e de Mical. Sogro de David, que persegue por ciúme depois de Deus escolher David para o suceder." },
    { "id": "jonatas", "nome": "Jónatas", "tipo": "povo", "retrato": "assets/retratos/jonatas.svg", "tier": "standard", "x": 2310, "y": 40, "era": "1 Samuel · Saul e David", "refs": "1 Sm 14; 18–20; 31",
      "resumo": "Filho mais velho de Saul e herdeiro do trono, torna-se o melhor amigo de David e ajuda-o repetidamente a escapar da ira do próprio pai, apesar de isso significar abdicar do seu direito à coroa. Morre ao lado de Saul na batalha do monte Gilboa.",
      "contexto": "A amizade entre Jónatas e David (1 Sm 18:1, \"a alma de Jónatas ficou ligada à alma de David\") é um dos relatos de lealdade mais celebrados da Bíblia hebraica.",
      "relacoes": "Filho de Saul. Irmão de Mical. Amigo íntimo de David, seu cunhado." },
    { "id": "david", "nome": "David", "tipo": "rei", "retrato": "assets/retratos/david.svg", "tier": "major", "x": 2310, "y": 300, "era": "1 Samuel · Saul e David", "refs": "1 Sm 16 – 1 Rs 2",
      "resumo": "Pastor mais novo de oito irmãos, ungido em segredo por Samuel, torna-se herói nacional ao derrotar o gigante filisteu Golias com uma funda. Sucede a Saul como segundo rei de Israel, unifica o reino e, apesar de graves falhas morais, é lembrado como o maior rei de Israel e antepassado do Messias esperado.",
      "contexto": "A dinastia davídica tornar-se-ia a base da esperança messiânica judaica e, na tradição cristã, da genealogia de Jesus — a promessa de um \"trono para sempre\" feita a David (2 Sm 7) atravessa o resto da Bíblia.",
      "relacoes": "Filho de Jessé, bisneto de Rute e Booz. Casa com Mical, filha de Saul, e mais tarde com Betsabé. Pai de Absalão e de Salomão, entre outros filhos. Amigo íntimo de Jónatas." },
    { "id": "golias", "nome": "Golias", "tipo": "estrangeiro", "retrato": "assets/retratos/golias.svg", "tier": "standard", "x": 2240, "y": 380, "era": "1 Samuel · Saul e David", "refs": "1 Sm 17",
      "resumo": "Guerreiro gigante filisteu de Gate que desafia diariamente o exército israelita para um combate individual — até ser derrotado pelo jovem David com uma simples funda e uma pedra, num dos episódios mais conhecidos de toda a Bíblia.",
      "contexto": "A descrição detalhada da sua armadura pesada (1 Sm 17:5-7) contrasta deliberadamente com a simplicidade das armas de David, reforçando o tema central do episódio: a vitória não depende do poder militar.",
      "relacoes": "Sem relações familiares registadas — figura estrangeira, sem ligação de sangue às restantes personagens deste grafo." }
```

- [ ] **Step 2: Append these edges to `edges`**

```json
    ["saul", "jonatas", "parent"],
    ["jonatas", "mical", "sibling"]
```

Note: `mical` doesn't exist yet (she's added in Task 5) — this edge references a character id that will exist by the time Task 8's final validation runs, but it means Task 4's own verification (Step 4 below) will show one edge referencing a not-yet-created id. That's expected and fine; do not skip or reorder this edge. Task 5 will add `saul→mical` (parent) and `david→mical` (spouse) when Mical's entry is created.

- [ ] **Step 3: Draw the 5 portraits**

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| samuel | homem idoso | `#d9b483` | grisalho, barba grisalha | expressão grave/profética |
| saul | homem meia-idade, alto/imponente | `#d9b483` | castanho escuro grisalhando, barba curta | expressão atormentada |
| jonatas | homem jovem | `#d9b483` | castanho claro curto, sem barba | expressão nobre/leal |
| david | homem jovem/meia-idade | `#c99a6b` | castanho encaracolado curto, barba curta | expressão carismática |
| golias | homem muito alto/corpulento, estrangeiro (filisteu) | `#8a6238` | preto, barba preta | expressão ameaçadora, considerar uma cicatriz ou detalhe de guerreiro |

These are the most recognizable characters in the whole cast — give them extra individuality. Saul and Jónatas are father/son (check they're clearly distinct, same discipline as Isaac/Abraão in Round 2). David's curly hair should echo José's technique (multiple overlapping small shapes) but not be identical — check against `assets/retratos/jose.svg`. Golias needs to read as physically imposing even at medallion scale — consider a slightly larger visual weight in his design (e.g. broader shoulders in the clothing shape) even though the actual `r` size is data-driven by `tier`, not by the SVG itself.

- [ ] **Step 4: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges');
"
```
Expected: `55 personagens, 58 edges`

```bash
node -e "
const fs = require('fs');
['samuel','saul','jonatas','david','golias'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve and check in browser: Saul→Jónatas edge visible; the Jónatas→Mical sibling edge will not render correctly yet (Mical doesn't exist until Task 5) — this is expected, do not treat it as a bug in this task. Confirm Samuel/Saul/Jónatas/David/Golias all show portraits and correct card content.

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json assets/retratos/samuel.svg assets/retratos/saul.svg assets/retratos/jonatas.svg assets/retratos/david.svg assets/retratos/golias.svg
git commit -m "Add Samuel, Saul, Jónatas, David, Golias"
```

---

### Task 5: Characters — Abigail, Mical, Betsabé, Absalão, Natã

**Files:**
- Modify: `data/personagens.json`
- Create: `assets/retratos/abigail.svg`, `assets/retratos/mical.svg`, `assets/retratos/betsabe.svg`, `assets/retratos/absalao.svg`, `assets/retratos/natan.svg`

**Interfaces:** same as Task 1.

- [ ] **Step 1: Append these 5 characters to `personagens`**

```json
    { "id": "abigail", "nome": "Abigail", "tipo": "matriarca", "retrato": "assets/retratos/abigail.svg", "tier": "minor", "x": 2380, "y": 350, "era": "1 Samuel · Saul e David", "refs": "1 Sm 25",
      "resumo": "Mulher \"sensata e formosa\", casada com o rico e insensato Nabal, intervém com sabedoria e diplomacia para impedir que David massacre a casa do marido depois de um insulto — e, após a morte súbita de Nabal, torna-se esposa de David.",
      "contexto": "É apresentada no texto como um contraponto de sensatez à impulsividade tanto de Nabal como do próprio David nesse momento da sua vida em fuga.",
      "relacoes": "Viúva de Nabal. Segunda esposa de David." },
    { "id": "mical", "nome": "Mical", "tipo": "matriarca", "retrato": "assets/retratos/mical.svg", "tier": "minor", "x": 2380, "y": 200, "era": "1 Samuel · Saul e David", "refs": "1 Sm 18–19; 2 Sm 6",
      "resumo": "Filha mais nova de Saul, apaixona-se por David e torna-se sua primeira esposa, ajudando-o a escapar quando o pai tenta matá-lo. Mais tarde, já rei, David recupera-a como esposa, mas o casamento deteriora-se.",
      "contexto": "É a única mulher na Bíblia hebraica explicitamente descrita como apaixonando-se por um homem (1 Sm 18:20) — um pormenor pouco comum no estilo narrativo do texto.",
      "relacoes": "Filha de Saul. Irmã de Jónatas. Primeira esposa de David." },
    { "id": "betsabe", "nome": "Betsabé", "tipo": "matriarca", "retrato": "assets/retratos/betsabe.svg", "tier": "standard", "x": 2480, "y": 280, "era": "2 Samuel · O reinado de David", "refs": "2 Sm 11–12; 1 Rs 1–2",
      "resumo": "Esposa de Urias, o hitita, é vista a banhar-se por David, que a engravida e depois manda matar Urias em combate para encobrir o adultério. Depois de casar com David, torna-se mãe de Salomão e assegura, já viúva, que ele suceda ao trono.",
      "contexto": "O profeta Natã confronta David sobre este episódio com uma parábola (2 Sm 12), um dos momentos mais marcantes de responsabilização moral de um rei em toda a Bíblia.",
      "relacoes": "Esposa de Urias, o hitita, depois de David. Mãe de Salomão." },
    { "id": "absalao", "nome": "Absalão", "tipo": "povo", "retrato": "assets/retratos/absalao.svg", "tier": "standard", "x": 2550, "y": 340, "era": "2 Samuel · O reinado de David", "refs": "2 Sm 13–18",
      "resumo": "Filho de David, conhecido pela sua beleza e pelo seu longo cabelo, revolta-se contra o pai e chega a tomar Jerusalém temporariamente. Morre tragicamente preso pelo cabelo num carvalho durante a batalha final contra as forças do pai.",
      "contexto": "A dor de David pela morte de Absalão (\"Meu filho Absalão... quem me dera ter morrido eu em teu lugar!\", 2 Sm 18:33) é um dos momentos mais comoventes de luto paterno em toda a Bíblia.",
      "relacoes": "Filho de David. Meio-irmão de Salomão." },
    { "id": "natan", "nome": "Natã", "tipo": "profeta", "retrato": "assets/retratos/natan.svg", "tier": "minor", "x": 2480, "y": 180, "era": "2 Samuel · O reinado de David", "refs": "2 Sm 7; 12; 1 Rs 1",
      "resumo": "Profeta da corte de David, transmite-lhe a promessa de uma dinastia eterna (2 Sm 7) e, mais tarde, confronta-o corajosamente com uma parábola depois do episódio com Betsabé, levando o rei ao arrependimento.",
      "contexto": "Ser profeta da corte, e não um outsider, torna a sua coragem ao confrontar o próprio rei ainda mais notável dentro do contexto político da época.",
      "relacoes": "Conselheiro e profeta de confiança de David. Sem relações familiares registadas." }
```

- [ ] **Step 2: Append these edges to `edges`**

```json
    ["saul", "mical", "parent"],
    ["david", "mical", "spouse"],
    ["david", "abigail", "spouse"],
    ["david", "betsabe", "spouse"],
    ["david", "absalao", "parent"]
```

(The `["jonatas", "mical", "sibling"]` edge from Task 4 will now resolve correctly since `mical` exists.)

- [ ] **Step 3: Draw the 5 portraits**

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| abigail | mulher jovem/meia-idade | `#e8c9a0` | castanho escuro, véu leve | expressão inteligente/serena |
| mical | mulher jovem | `#d9b483` | castanho escuro longo | expressão altiva/complexa |
| betsabe | mulher jovem/meia-idade | `#e8c9a0` | castanho longo, véu leve | expressão calma/determinada |
| absalao | homem jovem, muito bonito | `#d9b483` | cabelo notavelmente longo (característica central), sem barba | expressão orgulhosa |
| natan | homem meia-idade | `#c99a6b` | castanho escuro médio, barba curta | expressão firme/honesta |

David now has three wives in the cast (Mical, Abigail, Betsabé) plus Mical's sister-in-law relationship to Jónatas — take real care that Abigail, Mical, and Betsabé are three distinct women, not palette swaps of each other or of Rebeca/Sara/Lia/Miriam/Ana/Noemi from earlier tasks/rounds. Absalão's long hair is his defining trait — check it reads as distinct from Sansão's (Task 2) and from any long-haired woman already shipped.

- [ ] **Step 4: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const ids = new Set(d.personagens.map(p => p.id));
const bad = d.edges.filter(e => !ids.has(e[0]) || !ids.has(e[1]));
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges,', 'bad refs:', bad.length);
"
```
Expected: `60 personagens, 63 edges, bad refs: 0` (this is the first check in this plan where all edges — including Task 4's forward-reference to Mical — should resolve cleanly).

```bash
node -e "
const fs = require('fs');
['abigail','mical','betsabe','absalao','natan'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve and check in browser: Saul→Mical, David→Mical, Jónatas↔Mical, David→Abigail, David→Betsabé, David→Absalão edges all visible and correct now.

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json assets/retratos/abigail.svg assets/retratos/mical.svg assets/retratos/betsabe.svg assets/retratos/absalao.svg assets/retratos/natan.svg
git commit -m "Add Abigail, Mical, Betsabé, Absalão, Natã"
```

---

### Task 6: Characters — Salomão, Rainha de Sabá, Roboão, Jeroboão

**Files:**
- Modify: `data/personagens.json`
- Create: `assets/retratos/salomao.svg`, `assets/retratos/rainha_seba.svg`, `assets/retratos/roboao.svg`, `assets/retratos/jeroboao.svg`

**Interfaces:** same as Task 1.

- [ ] **Step 1: Append these 4 characters to `personagens`**

```json
    { "id": "salomao", "nome": "Salomão", "tipo": "rei", "retrato": "assets/retratos/salomao.svg", "tier": "major", "x": 2600, "y": 280, "era": "1 Reis · Salomão", "refs": "1 Rs 1–11",
      "resumo": "Filho de David e Betsabé, sucede ao pai e pede a Deus sabedoria em vez de riqueza ou longa vida. Constrói o primeiro Templo de Jerusalém e leva o reino de Israel ao auge da sua riqueza e prestígio internacional — mas os seus muitos casamentos políticos acabam por desviar o seu coração.",
      "contexto": "A construção do Templo (1 Rs 6–8) torna-se o centro religioso e político de Israel durante séculos, e a sua fama de sabedoria, incluindo a visita da Rainha de Sabá, ecoa em tradições muito além do texto bíblico.",
      "relacoes": "Filho de David e Betsabé. Pai de Roboão." },
    { "id": "rainha_seba", "nome": "Rainha de Sabá", "tipo": "estrangeiro", "retrato": "assets/retratos/rainha_seba.svg", "tier": "minor", "x": 2600, "y": 420, "era": "1 Reis · Salomão", "refs": "1 Rs 10",
      "resumo": "Governante estrangeira de um reino distante (situado na atual Iémen ou Etiópia) que viaja até Jerusalém para testar a fama de sabedoria de Salomão com perguntas difíceis, e sai impressionada e maravilhada.",
      "contexto": "A sua visita é um dos poucos episódios bíblicos que mostram Israel como destino de admiração diplomática internacional, em vez de o inverso.",
      "relacoes": "Sem relações familiares registadas — visitante estrangeira, sem ligação de sangue às restantes personagens deste grafo." },
    { "id": "roboao", "nome": "Roboão", "tipo": "rei", "retrato": "assets/retratos/roboao.svg", "tier": "minor", "x": 2670, "y": 280, "era": "1-2 Reis · O reino dividido", "refs": "1 Rs 12",
      "resumo": "Filho e sucessor de Salomão, recusa aliviar os impostos pesados impostos pelo pai, seguindo o conselho dos amigos jovens em vez dos conselheiros experientes — uma decisão que provoca a revolta das dez tribos do norte e a divisão do reino.",
      "contexto": "A partir daqui, o antigo reino unido de Israel divide-se em dois: o Reino de Israel (norte, dez tribos) e o Reino de Judá (sul, duas tribos, governado pela linhagem de David).",
      "relacoes": "Filho de Salomão. Rei apenas de Judá depois da divisão do reino." },
    { "id": "jeroboao", "nome": "Jeroboão", "tipo": "rei", "retrato": "assets/retratos/jeroboao.svg", "tier": "minor", "x": 2670, "y": 460, "era": "1-2 Reis · O reino dividido", "refs": "1 Rs 11–12",
      "resumo": "Antigo funcionário de Salomão que, depois da revolta contra Roboão, se torna o primeiro rei do Reino de Israel (norte). Para evitar que o povo continue a peregrinar ao Templo em Jerusalém, cria santuários alternativos com bezerros de ouro, um ato que a tradição bíblica considera o pecado fundador do reino do norte.",
      "contexto": "A expressão \"os pecados de Jeroboão\" torna-se, nos livros seguintes, um refrão usado para julgar quase todos os reis do Reino de Israel que se seguem.",
      "relacoes": "Sem relações de sangue com a casa de David — governante rival do Reino de Israel (norte)." }
```

- [ ] **Step 2: Append these edges to `edges`**

```json
    ["david", "salomao", "parent"],
    ["betsabe", "salomao", "parent"],
    ["salomao", "roboao", "parent"]
```

- [ ] **Step 3: Draw the 4 portraits**

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| salomao | homem jovem/meia-idade, rico/régio | `#d9b483` | preto curto, barba curta | expressão sábia/serena; considerar um detalhe régio na roupa (ex: uma faixa dourada) |
| rainha_seba | mulher meia-idade, estrangeira | `#8a6238` | preto coberto/adorno régio | expressão de admiração/dignidade; considerar um detalhe de joia ou adorno distintivo (marca-a como a segunda figura estrangeira feminina de destaque no elenco, depois de Dalila — deve ler-se claramente diferente dela) |
| roboao | homem jovem | `#d9b483` | castanho escuro, sem barba | expressão obstinada/imatura; distinto do pai Salomão |
| jeroboao | homem meia-idade | `#c99a6b` | preto médio, barba curta | expressão calculista/política |

Salomão is David's son — check he doesn't recycle David's exact face proportions (David is in Task 4). Roboão and Jeroboão are political rivals of similar age/role (both "rei", both recently risen to power) — apply the same "6 young similar men" discipline Round 2 used for Rúben/Simeão/Levi/Judá even though there are only 2 here: deliberately different face rx/ry, hairline, eyebrow, mouth.

- [ ] **Step 4: Verify**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const ids = new Set(d.personagens.map(p => p.id));
const bad = d.edges.filter(e => !ids.has(e[0]) || !ids.has(e[1]));
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges,', 'bad refs:', bad.length);
"
```
Expected: `64 personagens, 66 edges, bad refs: 0`

```bash
node -e "
const fs = require('fs');
['salomao','rainha_seba','roboao','jeroboao'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve and check in browser.

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json assets/retratos/salomao.svg assets/retratos/rainha_seba.svg assets/retratos/roboao.svg assets/retratos/jeroboao.svg
git commit -m "Add Salomão, Rainha de Sabá, Roboão, Jeroboão"
```

---

### Task 7: Characters — Elias, Acab, Jezabel, Eliseu, Naamã, Ezequias, Josias (final content batch)

**Files:**
- Modify: `data/personagens.json`
- Create: `assets/retratos/elias.svg`, `assets/retratos/acab.svg`, `assets/retratos/jezabel.svg`, `assets/retratos/eliseu.svg`, `assets/retratos/naama.svg`, `assets/retratos/ezequias.svg`, `assets/retratos/josias.svg`

**Interfaces:** same as Task 1. This is the last content batch — after this task, all 37 planned characters exist (71 total with the 34 from Rounds 1-2).

- [ ] **Step 1: Append these 7 characters to `personagens`**

```json
    { "id": "elias", "nome": "Elias", "tipo": "profeta", "retrato": "assets/retratos/elias.svg", "tier": "major", "x": 2740, "y": 560, "era": "1-2 Reis · O reino dividido", "refs": "1 Rs 17–19; 21; 2 Rs 1–2",
      "resumo": "Profeta poderoso do Reino de Israel, confronta o rei Acab e a rainha Jezabel pela idolatria ao deus Baal, culminando no confronto público no Monte Carmelo. Sobe ao céu num carro de fogo, sem morrer, deixando o seu manto — e o seu papel profético — a Eliseu.",
      "contexto": "A tradição judaica espera o regresso de Elias antes da vinda do Messias — uma expectativa que, no Novo Testamento, é associada a João Batista.",
      "relacoes": "Sem relações familiares registadas. Mentor e antecessor de Eliseu." },
    { "id": "acab", "nome": "Acab", "tipo": "rei", "retrato": "assets/retratos/acab.svg", "tier": "standard", "x": 2740, "y": 380, "era": "1-2 Reis · O reino dividido", "refs": "1 Rs 16; 18; 21–22",
      "resumo": "Rei do reino de Israel (norte), casa com a princesa fenícia Jezabel e introduz o culto a Baal na corte, entrando em conflito direto e repetido com o profeta Elias.",
      "contexto": "É descrito no texto (1 Rs 16:30) como tendo feito \"mais mal aos olhos do Senhor do que todos os que o precederam\" — o padrão de avaliação moral usado para todos os reis do Reino de Israel.",
      "relacoes": "Esposo de Jezabel." },
    { "id": "jezabel", "nome": "Jezabel", "tipo": "rei", "retrato": "assets/retratos/jezabel.svg", "tier": "standard", "x": 2740, "y": 440, "era": "1-2 Reis · O reino dividido", "refs": "1 Rs 16; 18–19; 21; 2 Rs 9",
      "resumo": "Princesa fenícia, esposa de Acab, promove ativamente o culto a Baal em Israel e persegue os profetas de Deus. Torna-se, na tradição bíblica, o exemplo máximo de rainha corrupta e opositora da fé de Israel.",
      "contexto": "O seu nome tornou-se, na cultura ocidental, sinónimo de mulher manipuladora e má — uma leitura que simplifica uma figura complexa de choque cultural e religioso entre Israel e a Fenícia.",
      "relacoes": "Esposa de Acab, rei de Israel." },
    { "id": "eliseu", "nome": "Eliseu", "tipo": "profeta", "retrato": "assets/retratos/eliseu.svg", "tier": "standard", "x": 2800, "y": 560, "era": "1-2 Reis · O reino dividido", "refs": "1 Rs 19; 2 Rs 2–13",
      "resumo": "Discípulo e sucessor de Elias, recebe uma \"porção dobrada\" do seu espírito e realiza uma série de milagres — incluindo a cura da lepra de Naamã — ao longo de um ministério profético que atravessa vários reinados.",
      "contexto": "Ao contrário de Elias, uma figura mais solitária e dramática, Eliseu é retratado como mais próximo do povo comum e das suas necessidades quotidianas.",
      "relacoes": "Discípulo e sucessor de Elias. Sem relações familiares registadas." },
    { "id": "naama", "nome": "Naamã", "tipo": "estrangeiro", "retrato": "assets/retratos/naama.svg", "tier": "minor", "x": 2800, "y": 650, "era": "1-2 Reis · O reino dividido", "refs": "2 Rs 5",
      "resumo": "Comandante do exército arameu (sírio) que sofre de lepra. Segue o conselho de uma jovem serva israelita e vai ter com o profeta Eliseu, que o cura depois de ele mergulhar sete vezes no rio Jordão — apesar da sua relutância inicial.",
      "contexto": "É um dos poucos episódios bíblicos em que a cura e a fé chegam a um estrangeiro através da humildade de uma pessoa sem poder algum, a jovem serva israelita não nomeada.",
      "relacoes": "Sem relações familiares registadas — estrangeiro, sem ligação de sangue às restantes personagens deste grafo." },
    { "id": "ezequias", "nome": "Ezequias", "tipo": "rei", "retrato": "assets/retratos/ezequias.svg", "tier": "minor", "x": 2850, "y": 280, "era": "1-2 Reis · O reino dividido", "refs": "2 Rs 18–20",
      "resumo": "Rei de Judá lembrado como um dos grandes reformadores religiosos, remove os altares idólatras espalhados pelo reino e confia em Deus perante o cerco assírio a Jerusalém, que é levantado milagrosamente.",
      "contexto": "O seu reinado coincide com a ameaça do poderoso Império Assírio, que já tinha destruído o Reino de Israel (norte) em 722 a.C. — Judá sobrevive onde o norte caiu.",
      "relacoes": "Descendente de Salomão, 12 gerações depois (2 Rs 15-18)." },
    { "id": "josias", "nome": "Josias", "tipo": "rei", "retrato": "assets/retratos/josias.svg", "tier": "minor", "x": 2850, "y": 200, "era": "1-2 Reis · O reino dividido", "refs": "2 Rs 22–23",
      "resumo": "Torna-se rei de Judá aos oito anos, e já jovem adulto promove a maior reforma religiosa da história do reino depois de o Livro da Lei ser redescoberto durante obras de restauro no Templo.",
      "contexto": "É o último rei de Judá lembrado com aprovação total pelo texto bíblico — depois dele, o reino entra numa espiral que termina na conquista babilónica e no exílio.",
      "relacoes": "Descendente de Salomão e de Ezequias, 15 gerações depois de Salomão (2 Rs 21-22)." }
```

- [ ] **Step 2: Append these edges to `edges`**

```json
    ["acab", "jezabel", "spouse"],
    ["salomao", "ezequias", "descendant", "12 gerações · 2 Rs 15-18"],
    ["salomao", "josias", "descendant", "15 gerações · 2 Rs 21-22"]
```

- [ ] **Step 3: Draw the 7 portraits**

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| elias | homem idoso, austero/selvagem | `#8a6238` | grisalho desgrenhado, barba grisalha longa | expressão intensa/profética |
| acab | homem meia-idade | `#d9b483` | castanho escuro, barba curta | expressão fraca/indecisa |
| jezabel | mulher meia-idade, estrangeira (fenícia) | `#e8c9a0` | preto elaborado/adornado | expressão altiva/severa; considerar um detalhe de joia estrangeira |
| eliseu | homem meia-idade | `#c99a6b` | castanho escuro curto, considerar careca parcial ou cabelo ralo (2 Rs 2:23), barba curta | expressão serena |
| naama | homem meia-idade, estrangeiro (arameu) | `#8a6238` | preto curto, barba curta | expressão de humildade/gratidão |
| ezequias | homem meia-idade, régio | `#d9b483` | castanho grisalhando, barba curta | expressão piedosa/grave |
| josias | homem jovem, régio | `#d9b483` | castanho escuro curto, sem barba | expressão jovem mas determinada |

This batch has the highest concentration of elderly/bearded men in the whole project (Elias joins Josué, Gideão, Eli, Samuel, Saul from earlier tasks, plus Noé, Abraão, Moisés, Arão from Round 1-2) — Elias's "desgrenhado" (unkempt/wild) hair and austere framing should be a genuinely different technique (messier, less symmetric hairline) from all of them, not just a grey-hair recolor. Jezabel is the third notable foreign/royal woman after Dalila (Task 2) and Rainha de Sabá (Task 6) — check the three read as clearly different people.

- [ ] **Step 4: Verify — this closes out the full 37-character content roster**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const ids = new Set(d.personagens.map(p => p.id));
const bad = d.edges.filter(e => !ids.has(e[0]) || !ids.has(e[1]));
const missing = d.personagens.filter(p => !p.retrato);
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges,', 'bad refs:', bad.length, '— sem retrato:', missing.length);
"
```
Expected: `71 personagens, 69 edges, bad refs: 0 — sem retrato: 0`

```bash
node -e "
const fs = require('fs');
['elias','acab','jezabel','eliseu','naama','ezequias','josias'].forEach(id => {
  const c = fs.readFileSync('assets/retratos/' + id + '.svg', 'utf-8');
  if (!c.trim().startsWith('<svg')) throw new Error(id + ' bad');
});
console.log('OK');
"
```

Serve and check in browser: the full 71-character graph loads, this task's 7 characters all render, Acab↔Jezabel edge visible, Salomão→Ezequias and Salomão→Josias descendant edges visible with labels.

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json assets/retratos/elias.svg assets/retratos/acab.svg assets/retratos/jezabel.svg assets/retratos/eliseu.svg assets/retratos/naama.svg assets/retratos/ezequias.svg assets/retratos/josias.svg
git commit -m "Add Elias, Acab, Jezabel, Eliseu, Naamã, Ezequias, Josias — all 37 Juízes/Reis characters now content-complete"
```

---

### Task 8: Full-cast distinctness audit and final verification

**Files:** none created — verification only, plus fixes if the audit finds a real problem.

This task exists specifically because Round 2's final review found that per-batch-only review missed a real near-clone pair (Sara/Lia) that spanned two different batches. This task is the structural fix: a dedicated cross-batch pass over the entire 71-character cast, not just this round's 37.

- [ ] **Step 1: Build a geometry fingerprint for every portrait**

Write and run a script that, for every file in `assets/retratos/`, extracts the face `<ellipse>`'s `rx`/`ry` and counts how many `<path>`/`<ellipse>`/`<circle>` element `d`/shape-defining attributes are byte-identical between any two files (ignoring `fill`/`stroke` color attributes, which are expected to sometimes coincide). Node is the expected tool; if unavailable in your environment, do this with careful manual/PowerShell text comparison instead — the goal, not the exact tool, is what matters.

```bash
node -e "
const fs = require('fs');
const dir = 'assets/retratos';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
const shapes = {};
for (const f of files) {
  const content = fs.readFileSync(dir + '/' + f, 'utf-8');
  const els = [...content.matchAll(/<(ellipse|path|circle|rect)\s+([^>]*)\/?>/g)];
  const sigs = els.map(m => {
    const attrs = m[2].replace(/\s*(fill|stroke|stroke-width|opacity|class)=\"[^\"]*\"/g, '').trim();
    return m[1] + ':' + attrs;
  });
  shapes[f] = sigs;
}
const names = Object.keys(shapes);
let flagged = [];
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = new Set(shapes[names[i]]);
    const b = new Set(shapes[names[j]]);
    let shared = 0;
    for (const s of a) if (b.has(s)) shared++;
    const minCount = Math.min(a.size, b.size);
    if (minCount > 0 && shared / minCount >= 0.6 && shared >= 6) {
      flagged.push([names[i], names[j], shared, minCount]);
    }
  }
}
flagged.sort((a, b) => (b[2]/b[3]) - (a[2]/a[3]));
console.log(flagged.length, 'pairs flagged (>=60% shape overlap, >=6 shared shapes):');
flagged.forEach(f => console.log(f[0], '<->', f[1], ':', f[2], '/', f[3], 'shared'));
"
```

This threshold (60% shape overlap, minimum 6 shared shapes) is deliberately generous — it's meant to catch anything in the neighborhood of the Sara/Lia incident (which shared 10 of 15, ~67%) plus give some margin, not to flag every pair that happens to share the common eye/nose template already accepted as house style in Round 2's final review. Expect some false positives from the shared eye-shape template; that's fine, it just means this task's job is to look at each flagged pair and make a judgment call, not to eliminate the shared-eyes convention.

- [ ] **Step 2: Review every flagged pair**

For each pair the script flags, read both files. Decide: is this a genuine near-clone (like Sara/Lia was) requiring one of the two to be redrawn on at least face rx/ry + one more axis (hairline, eyebrow, or mouth), or is the overlap explained by the accepted shared conventions (eye template, nose template, or a deliberately-designed family echo like Round 2's Dan/Neftali or Gad/Aser, where only color matches and every shape-based axis differs)? Fix any genuine near-clone directly (redraw the less-established character of the pair — prefer changing one from this round over one from Round 1-2, since those already passed their own review, unless the Round 1-2 file is the one that's actually easier/safer to adjust).

- [ ] **Step 3: Full click-through verification of all 71 characters**

Serve the site (via the `run` skill, or your own static server) and verify every one of the 71 characters: clicking it opens the card with a portrait (not a blank/broken image) and correct content (era, nome, refs, resumo, contexto, relacoes). If you have access to a real browser-automation tool, script this; if not, do a careful manual pass grouped by era (the 34 from Rounds 1-2 should already be fine and don't need re-verification — focus your manual effort on this round's 37, but do at least sample-check a few of the older 34 to confirm nothing regressed).

- [ ] **Step 4: Verify the full data set one more time**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const ids = new Set(d.personagens.map(p => p.id));
const bad = d.edges.filter(e => !ids.has(e[0]) || !ids.has(e[1]));
const missing = d.personagens.filter(p => !p.retrato);
const dupIds = d.personagens.map(p=>p.id).filter((id,i,arr)=>arr.indexOf(id)!==i);
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges, bad refs:', bad.length, ', sem retrato:', missing.length, ', ids duplicados:', dupIds.length);
"
```
Expected: `71 personagens, 69 edges, bad refs: 0, sem retrato: 0, ids duplicados: 0`

- [ ] **Step 5: Commit (only if Step 2 required fixes — otherwise this task has nothing to commit)**

```bash
git add assets/retratos/
git commit -m "Round 3 cross-batch distinctness audit: fix near-clone portraits found across batches"
```

If no fixes were needed, report that explicitly rather than creating an empty commit.
