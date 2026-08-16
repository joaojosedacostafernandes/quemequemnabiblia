# Redesign Visual e Conteúdo — "Livro de Ilustrações" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark "Constelação Bíblica" prototype with a warm "Livro de Ilustrações" visual system, add historical-context content to every character, bring the code into this repository with data separated from the rendering engine, and close out the Génesis/Êxodo narrative block with more characters.

**Architecture:** A static site with three layers that don't know about each other's internals: `data/personagens.json` (all content — the only file Isabel edits), `app.js` (a generic graph/card renderer that reads that JSON and knows nothing about specific characters), and `style.css` (the visual system). `index.html` wires the three together. No build step, no framework, no server-side code.

**Tech Stack:** Plain HTML/CSS/JS (ES5-style, matching the existing prototype's style — no bundler, no npm dependencies), inline SVG for the graph, hand-authored SVG icons for the role-type system.

**Spec:** `docs/superpowers/specs/2026-08-16-redesign-visual-conteudo-design.md`

## Global Constraints

- No external libraries or CDN dependencies (spec: static site, must stay simple for a non-programmer to eventually maintain).
- `app.js` must contain zero character-specific data — everything character-related lives in `data/personagens.json`.
- Adding a character must never require creating new artwork — the `tipo` field is always one of the 8 fixed categories below, each with one pre-made icon.
- The 8 `tipo` values (exact strings used in JSON and as icon filenames without extension): `patriarca`, `matriarca`, `profeta`, `rei`, `sacerdote`, `jovem`, `povo`, `estrangeiro`.
- No automated test framework. Validation = JSON-parses-cleanly checks (`node -e`) for data files, and manual browser verification (via the `run` skill) for visual tasks.
- Portuguese (pt-PT) for all user-facing text and content, consistent with the existing prototype and spec.

---

### Task 1: Data file — the 20 existing characters, enriched

**Files:**
- Create: `data/personagens.json`

**Interfaces:**
- Produces: a JSON document with shape `{ "layout": { "width": number, "height": number }, "personagens": [ { "id": string, "nome": string, "tipo": string, "tier": "major"|"standard"|"minor", "x": number, "y": number, "era": string, "refs": string, "resumo": string, "contexto": string, "relacoes": string } ], "edges": [ [string, string, "parent"|"spouse"|"sibling"|"descendant", string?] ] }`. Task 4 (`app.js`) consumes this shape by `fetch`-ing the file. Task 6 appends to `personagens` and `edges` without changing the shape.

- [ ] **Step 1: Write `data/personagens.json`**

```json
{
  "layout": { "width": 1560, "height": 660 },
  "personagens": [
    { "id": "adao", "nome": "Adão", "tipo": "patriarca", "tier": "major", "x": 80, "y": 300, "era": "As origens", "refs": "Gn 2–3",
      "resumo": "O primeiro ser humano, formado por Deus a partir do pó da terra e colocado no Jardim do Éden para o cultivar. A sua desobediência ao comer do fruto proibido marca o início da história da salvação — mas também abre caminho para a promessa de redenção que atravessa toda a Bíblia.",
      "contexto": "Situa-se numa época sem registo arqueológico direto — a tradição bíblica coloca as origens da humanidade no Crescente Fértil, a região entre os rios Tigre e Eufrates onde surgiram as primeiras comunidades agrícolas.",
      "relacoes": "Não tem pais bíblicos — é o primeiro homem. Casado com Eva. Pai de Caim, Abel e Set." },
    { "id": "eva", "nome": "Eva", "tipo": "matriarca", "tier": "major", "x": 80, "y": 380, "era": "As origens", "refs": "Gn 2–4",
      "resumo": "A primeira mulher, formada por Deus a partir de Adão e chamada por ele \"mãe de todos os viventes\" (Gn 3:20). É ela quem primeiro dialoga com a serpente, um momento central na narrativa da queda.",
      "contexto": "Como Adão, a sua história situa-se na memória das primeiras comunidades agrícolas do Crescente Fértil, antes de qualquer registo escrito.",
      "relacoes": "Não tem pais bíblicos — é a primeira mulher. Casada com Adão. Mãe de Caim, Abel e Set." },
    { "id": "caim", "nome": "Caim", "tipo": "jovem", "tier": "minor", "x": 240, "y": 120, "era": "Primeira geração", "refs": "Gn 4",
      "resumo": "Filho mais velho de Adão e Eva, agricultor. Quando a sua oferta a Deus não é aceite como a do irmão, mata Abel por ciúme — a primeira referência bíblica à violência entre irmãos. Ainda assim, Deus poupa-lhe a vida e coloca nele um sinal de proteção.",
      "contexto": "Como agricultor, representa as comunidades que começavam a cultivar a terra no Crescente Fértil — uma das grandes mudanças da história humana, a passagem de caçadores-recolectores a povos agrícolas fixos.",
      "relacoes": "Filho de Adão e Eva. Irmão de Abel e Set." },
    { "id": "abel", "nome": "Abel", "tipo": "jovem", "tier": "minor", "x": 240, "y": 260, "era": "Primeira geração", "refs": "Gn 4",
      "resumo": "Segundo filho de Adão e Eva, pastor de ovelhas. A sua oferta agrada a Deus, o que desperta a inveja do irmão Caim, que o mata no campo — tornando-o a primeira vítima de violência da Bíblia.",
      "contexto": "Como pastor, representa os povos pastores nómadas do Próximo Oriente Antigo, muitas vezes em tensão com as comunidades agrícolas fixas — uma tensão que a sua história com Caim reflete.",
      "relacoes": "Filho de Adão e Eva. Irmão de Caim e Set." },
    { "id": "sete", "nome": "Set", "tipo": "jovem", "tier": "minor", "x": 240, "y": 420, "era": "Primeira geração", "refs": "Gn 4:25; 5",
      "resumo": "Terceiro filho de Adão e Eva, nascido \"em vez de Abel\". É através dele, e não de Caim, que a genealogia bíblica continua até Noé — a linha que a tradição liga à esperança da salvação.",
      "contexto": "A genealogia que passa por Set (Gn 5) usa idades muito longas, um recurso literário comum nos textos antigos da região para transmitir a importância e a antiguidade de uma linhagem.",
      "relacoes": "Filho de Adão e Eva. Irmão de Caim e Abel. Antepassado de Noé." },
    { "id": "noe", "nome": "Noé", "tipo": "patriarca", "tier": "major", "x": 400, "y": 420, "era": "O Dilúvio", "refs": "Gn 6–9",
      "resumo": "Descendente de Set, descrito como \"justo e íntegro\" na sua geração. Construiu a arca por ordem de Deus e salvou a sua família e os animais do dilúvio. Com ele, Deus faz a primeira grande aliança da Bíblia, selada pelo sinal do arco-íris.",
      "contexto": "A narrativa do dilúvio ecoa outras histórias de grandes cheias conhecidas no Próximo Oriente Antigo, como o Poema de Guilgamexe — a arca é uma resposta de fé dentro desse contexto cultural partilhado.",
      "relacoes": "Descendente de Set (8 gerações depois, através de Enos, Cainã, Maalalel, Jarede, Enoque, Matusalém e Lameque — Gn 5). Pai de Sem, entre outros filhos." },
    { "id": "sem", "nome": "Sem", "tipo": "povo", "tier": "minor", "x": 540, "y": 420, "era": "Depois do Dilúvio", "refs": "Gn 5:32; 9:26; 11:10",
      "resumo": "Filho mais velho de Noé, abençoado por ele depois do dilúvio. A tradição bíblica liga-lhe a linhagem que, muitas gerações depois, chega até Abraão.",
      "contexto": "A tradição bíblica liga-lhe a origem dos povos semitas — nome que ainda hoje designa a família de línguas que inclui o hebraico e o árabe.",
      "relacoes": "Filho de Noé. Antepassado de Abraão." },
    { "id": "abraao", "nome": "Abraão", "tipo": "patriarca", "tier": "major", "x": 680, "y": 420, "era": "Os Patriarcas · Abraão", "refs": "Gn 12–25",
      "resumo": "Chamado por Deus a deixar a sua terra e a sua família, recebe a promessa de uma descendência \"como as estrelas do céu\" (Gn 15:5) e de uma terra para os seus descendentes. A sua confiança nessa promessa, mesmo sem a ver cumprida, torna-o o \"pai da fé\" para judeus, cristãos e muçulmanos.",
      "contexto": "Viveu por volta do início do 2º milénio a.C., numa altura em que povos semi-nómadas se deslocavam entre a Mesopotâmia (a cidade de Ur) e Canaã à procura de pastagens — o mesmo movimento que a sua chamada de Deus descreve.",
      "relacoes": "Descendente de Sem (9 gerações depois — Gn 11). Casado com Sara, pai de Isaac. Também pai de Ismael, com Agar." },
    { "id": "sara", "nome": "Sara", "tipo": "matriarca", "tier": "standard", "x": 680, "y": 500, "era": "Os Patriarcas · Abraão", "refs": "Gn 17–23",
      "resumo": "Esposa de Abraão. Já em idade muito avançada, ri-se ao ouvir que terá um filho — e dá à luz Isaac, cujo nome significa \"ele ri\", cumprindo a promessa de Deus contra toda a probabilidade.",
      "contexto": "Como esposa do chefe de um clã semi-nómada, o seu papel incluía gerir a tenda e a casa — mas a narrativa destaca-a precisamente por ultrapassar esse papel esperado.",
      "relacoes": "Esposa de Abraão. Mãe de Isaac." },
    { "id": "agar", "nome": "Agar", "tipo": "estrangeiro", "tier": "minor", "x": 680, "y": 580, "era": "Os Patriarcas · Abraão", "refs": "Gn 16; 21",
      "resumo": "Serva egípcia de Sara, torna-se mãe de Ismael com Abraão. Depois de ser expulsa para o deserto com o filho, é a primeira pessoa na Bíblia a dar um nome a Deus — \"o Deus que me vê\" (Gn 16:13).",
      "contexto": "Como serva egípcia, reflete os laços entre os patriarcas hebreus e o Egito, uma potência vizinha muito mais antiga e desenvolvida, com quem as famílias bíblicas mantinham contacto frequente.",
      "relacoes": "Serva de Sara. Mãe de Ismael, com Abraão." },
    { "id": "ismael", "nome": "Ismael", "tipo": "povo", "tier": "minor", "x": 820, "y": 580, "era": "Os Patriarcas · Isaac", "refs": "Gn 16; 21; 25",
      "resumo": "Filho de Abraão e Agar. Deus promete que também dele nascerá uma grande nação — segundo a tradição bíblica, torna-se pai de doze príncipes e antepassado de povos árabes.",
      "contexto": "A tradição identifica Ismael como antepassado de povos árabes — é também uma figura importante no Islão, onde é considerado profeta.",
      "relacoes": "Filho de Abraão e Agar. Meio-irmão de Isaac." },
    { "id": "isaac", "nome": "Isaac", "tipo": "patriarca", "tier": "standard", "x": 820, "y": 420, "era": "Os Patriarcas · Isaac", "refs": "Gn 21–27",
      "resumo": "Filho de Abraão e Sara, nascido da promessa depois de anos de espera. Quase sacrificado por Abraão no Monte Moriá (Gn 22), é poupado por Deus — um episódio que a tradição cristã lê como prefiguração do sacrifício de Cristo. Casa com Rebeca e é pai de Esaú e Jacob.",
      "contexto": "Cresce numa família semi-nómada em Canaã, herdando os poços e pastagens negociados pelo pai — a posse de um poço de água era, nesta região árida, um bem tão disputado como a própria terra.",
      "relacoes": "Filho de Abraão e Sara. Casado com Rebeca. Pai de Esaú e Jacob." },
    { "id": "rebeca", "nome": "Rebeca", "tipo": "matriarca", "tier": "standard", "x": 820, "y": 340, "era": "Os Patriarcas · Isaac", "refs": "Gn 24–27",
      "resumo": "Escolhida junto ao poço por Eliezer, servo de Abraão, para ser esposa de Isaac — reconhecida pela sua hospitalidade ao oferecer água não só ao servo mas também aos seus camelos. Mãe de Esaú e Jacob, tem um papel decisivo em garantir que a bênção do pai passa para Jacob.",
      "contexto": "Vinda da Mesopotâmia (Padã-Arã) para casar com Isaac em Canaã, a sua história reflete os casamentos combinados entre clãs distantes, comuns para manter alianças e identidade familiar.",
      "relacoes": "Esposa de Isaac. Mãe de Esaú e Jacob." },
    { "id": "esau", "nome": "Esaú", "tipo": "povo", "tier": "standard", "x": 960, "y": 220, "era": "Os Patriarcas · Jacob", "refs": "Gn 25–33",
      "resumo": "Filho mais velho de Isaac e Rebeca, caçador hábil. Vende o seu direito de primogenitura a Jacob por um prato de lentilhas, e mais tarde vê a bênção do pai ser-lhe também tirada — mas a história termina com um reencontro de perdão entre os dois irmãos (Gn 33).",
      "contexto": "Descrito como homem do campo, em contraste com o irmão — a Bíblia usa essa diferença de temperamento para explicar por que a bênção segue um caminho inesperado.",
      "relacoes": "Filho de Isaac e Rebeca. Irmão gémeo de Jacob." },
    { "id": "jacob", "nome": "Jacob", "tipo": "patriarca", "tier": "major", "x": 960, "y": 420, "era": "Os Patriarcas · Jacob", "refs": "Gn 25–49",
      "resumo": "Filho de Isaac e Rebeca. Depois de lutar a noite toda com um anjo, recebe de Deus o novo nome \"Israel\" (Gn 32:28), que passa a designar todo o povo. Pai de doze filhos que dão origem às doze tribos de Israel.",
      "contexto": "O novo nome dado a Jacob viria a dar nome a todo o povo — as doze tribos de Israel descendem dos seus doze filhos.",
      "relacoes": "Filho de Isaac e Rebeca. Irmão gémeo de Esaú. Casado com Lia e Raquel. Pai de José, com Raquel, e antepassado de Moisés, Arão e Miriam, através de Levi, filho de Lia." },
    { "id": "raquel", "nome": "Raquel", "tipo": "matriarca", "tier": "standard", "x": 1100, "y": 480, "era": "As famílias de Jacob", "refs": "Gn 29–35",
      "resumo": "Esposa preferida de Jacob, encontrada junto a um poço quando este chega a casa do seu tio Labão. Mãe de José e, mais tarde, de Benjamim — morre ao dar à luz este último filho, perto de Belém.",
      "contexto": "Encontrada junto a um poço, como Rebeca antes dela — os poços eram pontos de encontro social nas comunidades pastoris, onde muitas histórias bíblicas de encontro e casamento acontecem.",
      "relacoes": "Esposa de Jacob. Mãe de José e de Benjamim." },
    { "id": "lia", "nome": "Lia", "tipo": "matriarca", "tier": "minor", "x": 1100, "y": 360, "era": "As famílias de Jacob", "refs": "Gn 29–49",
      "resumo": "Primeira esposa de Jacob, casada com ele através de um engano do seu pai Labão. Mãe de seis dos doze filhos de Jacob, incluindo Levi e Judá — antepassada da tribo sacerdotal e da linhagem real de David.",
      "contexto": "Mãe de Levi, cuja descendência se tornaria a tribo sacerdotal de Israel — sem saber, a sua linhagem prepara já o papel central que os levitas terão séculos depois no culto israelita.",
      "relacoes": "Esposa de Jacob. Mãe de Rúben, Simeão, Levi, Judá, Issacar, Zabulão e Dina." },
    { "id": "jose", "nome": "José", "tipo": "rei", "tier": "major", "x": 1260, "y": 480, "era": "José no Egito", "refs": "Gn 37–50",
      "resumo": "Filho preferido de Jacob e Raquel, reconhecível pela sua túnica de várias cores. Vendido como escravo pelos próprios irmãos, torna-se governador do Egito depois de interpretar os sonhos do Faraó — e acaba por salvar a sua família da fome, perdoando os irmãos que o traíram.",
      "contexto": "A sua ascensão a governador reflete um país com uma administração central sofisticada, capaz de planear anos de fartura e de fome — algo que os clãs pastoris de Canaã não tinham.",
      "relacoes": "Filho de Jacob e Raquel. Irmão mais velho de Benjamim. Meio-irmão dos restantes filhos de Jacob." },
    { "id": "moises", "nome": "Moisés", "tipo": "profeta", "tier": "major", "x": 1420, "y": 340, "era": "O Êxodo", "refs": "Êx 2 – Dt 34",
      "resumo": "Descendente de Levi, criado na corte egípcia depois de ser salvo das águas do Nilo em bebé. Liberta o povo de Israel da escravidão no Egito através de dez pragas e da travessia do Mar Vermelho, e recebe os Dez Mandamentos no Monte Sinai.",
      "contexto": "Cresce na corte egípcia numa época de grandes construções monumentais, muitas delas erguidas com mão de obra escrava — o pano de fundo histórico da opressão que o livro do Êxodo descreve.",
      "relacoes": "Descendente de Jacob e Lia, através de Levi (4 gerações depois, via Coate e Anrão — Êx 6). Irmão de Miriam e Arão." },
    { "id": "miriam", "nome": "Miriam", "tipo": "profeta", "tier": "standard", "x": 1420, "y": 240, "era": "O Êxodo", "refs": "Êx 2; 15",
      "resumo": "Irmã mais velha de Moisés e Arão. Vigia o cesto do irmão bebé no rio Nilo e sugere a sua própria mãe como ama — depois, já profetisa, guia o povo no cântico de louvor depois da travessia do Mar Vermelho (Êx 15:20-21).",
      "contexto": "Como profetisa que lidera o canto após a travessia do Mar Vermelho, representa o papel das mulheres na liturgia e memória oral dos povos antigos, transmitindo a história através de cânticos.",
      "relacoes": "Descendente de Jacob e Lia, através de Levi. Irmã de Moisés e Arão." }
  ],
  "edges": [
    ["adao", "caim", "parent"], ["eva", "caim", "parent"],
    ["adao", "abel", "parent"], ["eva", "abel", "parent"],
    ["adao", "sete", "parent"], ["eva", "sete", "parent"],
    ["noe", "sem", "parent"],
    ["abraao", "isaac", "parent"], ["sara", "isaac", "parent"],
    ["abraao", "ismael", "parent"], ["agar", "ismael", "parent"],
    ["isaac", "esau", "parent"], ["rebeca", "esau", "parent"],
    ["isaac", "jacob", "parent"], ["rebeca", "jacob", "parent"],
    ["jacob", "jose", "parent"], ["raquel", "jose", "parent"],
    ["adao", "eva", "spouse"], ["abraao", "sara", "spouse"],
    ["isaac", "rebeca", "spouse"], ["jacob", "raquel", "spouse"], ["jacob", "lia", "spouse"],
    ["caim", "abel", "sibling"], ["caim", "sete", "sibling"], ["abel", "sete", "sibling"],
    ["esau", "jacob", "sibling"], ["moises", "miriam", "sibling"],
    ["sete", "noe", "descendant", "8 gerações · Gn 5"],
    ["sem", "abraao", "descendant", "9 gerações · Gn 11"],
    ["jacob", "moises", "descendant", "4 gerações, via Levi · Êx 6"],
    ["jacob", "miriam", "descendant", "4 gerações, via Levi · Êx 6"]
  ]
}
```

- [ ] **Step 2: Verify the JSON parses**

Run: `node -e "const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8')); console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges')"`
Expected: `20 personagens, 31 edges`

- [ ] **Step 3: Verify every edge references a real id**

Run:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const ids = new Set(d.personagens.map(p => p.id));
const bad = d.edges.filter(e => !ids.has(e[0]) || !ids.has(e[1]));
console.log(bad.length === 0 ? 'OK' : JSON.stringify(bad));
"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add data/personagens.json
git commit -m "Add enriched data file for the 20 existing characters"
```

---

### Task 2: Role-type icon set

**Files:**
- Create: `assets/icons/patriarca.svg`
- Create: `assets/icons/matriarca.svg`
- Create: `assets/icons/profeta.svg`
- Create: `assets/icons/rei.svg`
- Create: `assets/icons/sacerdote.svg`
- Create: `assets/icons/jovem.svg`
- Create: `assets/icons/povo.svg`
- Create: `assets/icons/estrangeiro.svg`

**Interfaces:**
- Produces: 8 files named exactly `assets/icons/<tipo>.svg`, one per `tipo` value used in `data/personagens.json`. Each is a standalone 24×24 viewBox SVG with the stroke color hardcoded (not `currentColor`) because Task 4 loads them via `<image href="...">`, which does not inherit page CSS. Task 4 consumes these by building the path `assets/icons/' + personagem.tipo + '.svg'`.

- [ ] **Step 1: Write the 8 icon files**

`assets/icons/patriarca.svg` (cajado/staff):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 21V6a3 3 0 1 1 6 0c0 2-2 3-4 3"/>
</svg>
```

`assets/icons/matriarca.svg` (ânfora):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 3h6M10 3v3.5c0 .8-.4 1.5-1 2.1C7.5 10 7 12 7 14a5 5 0 0 0 10 0c0-2-.5-4-2-4.4-.6-.6-1-1.3-1-2.1V3"/>
</svg>
```

`assets/icons/profeta.svg` (chama):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c1 1 2 2.5 2 4.5A6 6 0 0 1 6 13.5C6 8 12 6 12 2Z"/>
</svg>
```

`assets/icons/rei.svg` (coroa):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 18h16l-1-9-4 4-3-6-3 6-4-4-1 9Z"/>
</svg>
```

`assets/icons/sacerdote.svg` (cálice):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 3h10M8 3c0 4 1 7 4 7s4-3 4-7M12 10v6M8 21h8M12 16c-2 0-4 1-4 5h8c0-4-2-5-4-5Z"/>
</svg>
```

`assets/icons/jovem.svg` (rebento):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 21V11M12 11C12 6 8 5 5 5c0 4 2 6 7 6ZM12 11c0-3 3-4 6-4 0 3-1.5 5-6 5"/>
</svg>
```

`assets/icons/povo.svg` (tenda):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 4 3 20h18L12 4ZM12 4v16M8 20l4-9 4 9"/>
</svg>
```

`assets/icons/estrangeiro.svg` (caminho/pegadas):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 19c6-1 5-15 16-15"/>
  <circle cx="8" cy="15" r="1.4" fill="#8a5a2b" stroke="none"/>
  <circle cx="16" cy="6" r="1.4" fill="#8a5a2b" stroke="none"/>
</svg>
```

- [ ] **Step 2: Verify all 8 files exist and are well-formed XML**

Run:
```bash
node -e "
const fs = require('fs');
const tipos = ['patriarca','matriarca','profeta','rei','sacerdote','jovem','povo','estrangeiro'];
for (const t of tipos) {
  const content = fs.readFileSync('assets/icons/' + t + '.svg', 'utf-8');
  if (!content.startsWith('<svg')) throw new Error(t + ' does not start with <svg>');
}
console.log('OK, 8 icons present');
"
```
Expected: `OK, 8 icons present`

- [ ] **Step 3: Commit**

```bash
git add assets/icons/
git commit -m "Add role-type icon set (8 SVG icons)"
```

---

### Task 3: Visual system — `style.css`

**Files:**
- Create: `style.css`

**Interfaces:**
- Produces: CSS classes consumed by `index.html` markup and by the DOM nodes `app.js` (Task 4) creates: `.app`, `.topbar`, `.eyebrow`, `.instructions`, `.legend`, `.swatch`, `.stage`, `.graph-wrap`, `#graph`, `.edge` + `.edge-parent`/`.edge-spouse`/`.edge-sibling`/`.edge-descendant`, `.edge-label`, `.node` + `.tier-major`/`.tier-standard`/`.tier-minor`, `.node circle.medallion`, `.node .halo`, `.node image.icon`, `.node text`, `.node.selected`, `.graph.has-selection .node.dim`, `.graph.has-selection .edge.dim`, `.controls` + button children, `aside#panel`, `.panel-empty`, `.card-era`, `.card-name`, `.card-refs`, `.card-summary`, `.card-section-title`, `.card-contexto`, `.card-relations`, `.panel-close`, `footer.note`.

- [ ] **Step 1: Write `style.css`**

```css
:root {
  --bg-1: #f6ecd4;
  --bg-2: #efe0bd;
  --surface: #fffaf0;
  --surface-panel: #fbf3e2;
  --border: #d9c49a;
  --accent: #c1652f;
  --accent-soft: rgba(193, 101, 47, 0.28);
  --accent-2: #8a5a2b;
  --text: #4a3016;
  --text-muted: #8a6a45;
  --line-parent: #7a5230;
  --line-spouse: #b4763f;
  --line-sibling: #5f7a52;
  --line-descendant: #c1652f;
  --font-display: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg-1);
  color: var(--text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 1.6rem;
  padding: 1.1rem 1.4rem 0.9rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-2), var(--bg-1));
}

.topbar h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 1.5rem;
  letter-spacing: 0.01em;
  margin: 0;
  text-wrap: balance;
  color: var(--text);
}

.topbar .eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  display: block;
  margin-bottom: 0.2rem;
}

.topbar .instructions {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  flex: 1 1 240px;
  align-self: center;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.1rem;
  font-size: 0.72rem;
  color: var(--text-muted);
  align-items: center;
}

.legend .swatch {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.legend svg { display: block; }

.stage {
  position: relative;
  flex: 1;
  display: flex;
  min-height: 0;
}

.graph-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 50% at 25% 15%, rgba(193, 101, 47, 0.08), transparent 60%),
    radial-gradient(ellipse 70% 60% at 85% 85%, rgba(138, 90, 43, 0.07), transparent 60%),
    var(--bg-1);
}

#graph {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  cursor: grab;
}

#graph.dragging { cursor: grabbing; }

.edge {
  fill: none;
  stroke-linecap: round;
  transition: opacity 0.25s ease, stroke-width 0.25s ease;
}
.edge-parent { stroke: var(--line-parent); stroke-width: 1.6; }
.edge-spouse { stroke: var(--line-spouse); stroke-width: 1.6; stroke-dasharray: 2 5; }
.edge-sibling { stroke: var(--line-sibling); stroke-width: 1.4; stroke-dasharray: 1 4; }
.edge-descendant { stroke: var(--line-descendant); stroke-width: 1.3; stroke-dasharray: 9 6; opacity: 0.6; }

.edge-label {
  font-family: var(--font-mono);
  font-size: 8.5px;
  fill: var(--accent-2);
  opacity: 0.85;
  pointer-events: none;
}

.node { cursor: pointer; }

.node circle.medallion {
  fill: var(--surface);
  stroke: var(--accent);
  stroke-width: 2.4px;
  transition: stroke 0.25s ease, r 0.25s ease, filter 0.25s ease;
}

.node.tier-major circle.medallion { stroke-width: 3px; }

.node .halo {
  fill: var(--accent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.node image.icon { pointer-events: none; }

.node text {
  font-family: var(--font-body);
  font-size: 11.5px;
  fill: var(--text-muted);
  transition: fill 0.25s ease, opacity 0.25s ease;
  paint-order: stroke;
  stroke: var(--bg-1);
  stroke-width: 3px;
}

.node.selected circle.medallion {
  stroke: var(--accent-2);
  filter: drop-shadow(0 0 6px var(--accent-soft));
}
.node.selected .halo { opacity: 0.22; }
.node.selected text { fill: var(--text); font-weight: 600; }

.graph.has-selection .node.dim { opacity: 0.3; }
.graph.has-selection .edge.dim { opacity: 0.12; }

.controls {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  z-index: 5;
}

.controls button {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
}
.controls button:hover { border-color: var(--accent); color: var(--accent); }
.controls button:focus-visible,
aside button:focus-visible,
.node:focus-visible circle.medallion { outline: 2px solid var(--accent); outline-offset: 2px; }

aside#panel {
  width: 22rem;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  background: var(--surface-panel);
  padding: 1.3rem 1.4rem;
  overflow-y: auto;
}

.panel-empty {
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-top: 2rem;
  text-align: center;
  line-height: 1.6;
}

.card-era {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

.card-name {
  font-family: var(--font-display);
  font-size: 1.7rem;
  margin: 0.2rem 0 0.15rem;
  text-wrap: balance;
  color: var(--text);
}

.card-refs {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0 0 1rem;
}

.card-summary {
  font-size: 0.92rem;
  line-height: 1.65;
  margin: 0 0 1.1rem;
  max-width: 36ch;
}

.card-section-title {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 1rem 0 0.4rem;
}
.card-section-title:first-of-type { margin-top: 0; }

.card-contexto {
  font-size: 0.87rem;
  line-height: 1.6;
  color: var(--text);
  max-width: 36ch;
  margin: 0 0 1.1rem;
}

.card-relations {
  font-size: 0.87rem;
  line-height: 1.6;
  color: var(--text);
  border-left: 2px solid var(--border);
  padding-left: 0.7rem;
}

.panel-close { display: none; }

footer.note {
  padding: 0.55rem 1.4rem;
  border-top: 1px solid var(--border);
  font-size: 0.72rem;
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .topbar .instructions { display: none; }
  aside#panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: 62dvh;
    border-left: none;
    border-top: 1px solid var(--border);
    border-radius: 10px 10px 0 0;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 -8px 24px rgba(74, 48, 22, 0.25);
    z-index: 10;
  }
  aside#panel.open { transform: translateY(0); }
  .panel-close {
    display: block;
    margin: -0.4rem 0 0.6rem auto;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    cursor: pointer;
  }
  footer.note { display: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "Add Livro de Ilustrações visual system"
```

---

### Task 4: Rendering engine — `app.js`

**Files:**
- Create: `app.js`

**Interfaces:**
- Consumes: `data/personagens.json` (Task 1 shape) via `fetch('data/personagens.json')`; icon files at `assets/icons/<tipo>.svg` (Task 2); CSS classes from `style.css` (Task 3); DOM elements with ids `graph`, `bgLayerUnused` (not used — no starfield in this theme), `edges`, `nodes`, `legend`, `panel`, `panelBody`, `panelClose`, `zoomIn`, `zoomOut`, `zoomReset` (Task 5 provides these in `index.html`).
- Produces: no exports (plain script, IIFE) — this is the last piece of app logic; nothing downstream consumes its internals.

- [ ] **Step 1: Write `app.js`**

```js
(function () {
  var svgns = "http://www.w3.org/2000/svg";

  var LEGEND = [
    ["parent", "Pai/mãe → filho/filha"],
    ["spouse", "Casamento"],
    ["sibling", "Irmãos"],
    ["descendant", "Várias gerações depois"]
  ];

  var radius = { major: 15, standard: 11, minor: 8 };

  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function iconHref(tipo) {
    return "assets/icons/" + tipo + ".svg";
  }

  fetch("data/personagens.json")
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      document.getElementById("panelBody").innerHTML =
        '<p class="panel-empty">Não foi possível carregar os dados (' + err.message + '). Se abriste o ficheiro diretamente no browser, é preciso servir a pasta por http:// — usa a skill run.</p>';
    });

  function init(data) {
    var NODES = data.personagens;
    var EDGES = data.edges;

    var byId = {};
    NODES.forEach(function (n) { byId[n.id] = n; });

    var graphSvg = document.getElementById("graph");
    var edgeLayer = document.getElementById("edges");
    var nodeLayer = document.getElementById("nodes");
    var panelBody = document.getElementById("panelBody");
    var panel = document.getElementById("panel");

    var edgeEls = [];
    EDGES.forEach(function (e) {
      var a = byId[e[0]], b = byId[e[1]], type = e[2];
      var line = el("line", {
        class: "edge edge-" + type,
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        "data-a": e[0], "data-b": e[1]
      });
      edgeLayer.appendChild(line);
      edgeEls.push(line);
      if (e[3]) {
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var label = el("text", { class: "edge-label", x: mx, y: my - 5, "text-anchor": "middle" });
        label.textContent = e[3];
        edgeLayer.appendChild(label);
      }
    });

    var adjacency = {};
    NODES.forEach(function (n) { adjacency[n.id] = new Set(); });
    EDGES.forEach(function (e) { adjacency[e[0]].add(e[1]); adjacency[e[1]].add(e[0]); });

    var nodeEls = {};
    NODES.forEach(function (n) {
      var r = radius[n.tier];
      var g = el("g", { class: "node tier-" + n.tier, tabindex: "0", role: "button", "aria-label": n.nome });
      g.appendChild(el("circle", { class: "halo", cx: n.x, cy: n.y, r: r + 7 }));
      g.appendChild(el("circle", { class: "medallion", cx: n.x, cy: n.y, r: r }));
      var iconSize = r * 1.3;
      var icon = el("image", {
        class: "icon", x: n.x - iconSize / 2, y: n.y - iconSize / 2,
        width: iconSize, height: iconSize, href: iconHref(n.tipo)
      });
      icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref(n.tipo));
      g.appendChild(icon);
      var label = el("text", { x: n.x, y: n.y + r + 15, "text-anchor": "middle" });
      label.textContent = n.nome;
      g.appendChild(label);
      g.addEventListener("click", function () { selectNode(n.id); });
      g.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectNode(n.id); }
      });
      nodeLayer.appendChild(g);
      nodeEls[n.id] = g;
    });

    function selectNode(id) {
      var neighbors = adjacency[id];
      graphSvg.classList.add("has-selection");
      Object.keys(nodeEls).forEach(function (nid) {
        var g = nodeEls[nid];
        g.classList.toggle("selected", nid === id);
        g.classList.toggle("dim", nid !== id && !neighbors.has(nid));
      });
      edgeEls.forEach(function (line) {
        var a = line.getAttribute("data-a"), b = line.getAttribute("data-b");
        line.classList.toggle("dim", a !== id && b !== id);
      });
      renderCard(byId[id]);
      panel.classList.add("open");
    }

    function renderCard(n) {
      panelBody.innerHTML =
        '<button class="panel-close" id="panelCloseInner" type="button">Fechar &times;</button>' +
        '<p class="card-era">' + n.era + '</p>' +
        '<h2 class="card-name">' + n.nome + '</h2>' +
        '<p class="card-refs">' + n.refs + '</p>' +
        '<p class="card-summary">' + n.resumo + '</p>' +
        '<p class="card-section-title">Contexto histórico</p>' +
        '<p class="card-contexto">' + n.contexto + '</p>' +
        '<p class="card-section-title">Família</p>' +
        '<p class="card-relations">' + n.relacoes + '</p>';
      document.getElementById("panelCloseInner").addEventListener("click", closePanel);
    }

    function closePanel() {
      panel.classList.remove("open");
    }
    document.getElementById("panelClose").addEventListener("click", closePanel);

    graphSvg.addEventListener("click", function (ev) {
      if (ev.target === graphSvg) {
        graphSvg.classList.remove("has-selection");
        Object.keys(nodeEls).forEach(function (nid) { nodeEls[nid].classList.remove("selected", "dim"); });
        edgeEls.forEach(function (line) { line.classList.remove("dim"); });
        closePanel();
      }
    });

    var full = { x: 0, y: 0, w: data.layout.width, h: data.layout.height };
    var view = { x: full.x, y: full.y, w: full.w, h: full.h };

    function applyView() {
      graphSvg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    }
    applyView();

    function zoomBy(factor, cx, cy) {
      var nw = Math.min(full.w * 1.4, Math.max(full.w * 0.22, view.w * factor));
      var nh = nw * (view.h / view.w);
      var px = (cx - view.x) / view.w;
      var py = (cy - view.y) / view.h;
      view.x -= (nw - view.w) * px;
      view.y -= (nh - view.h) * py;
      view.w = nw; view.h = nh;
      applyView();
    }

    document.getElementById("zoomIn").addEventListener("click", function () {
      zoomBy(0.8, view.x + view.w / 2, view.y + view.h / 2);
    });
    document.getElementById("zoomOut").addEventListener("click", function () {
      zoomBy(1.25, view.x + view.w / 2, view.y + view.h / 2);
    });
    document.getElementById("zoomReset").addEventListener("click", function () {
      view = { x: full.x, y: full.y, w: full.w, h: full.h };
      applyView();
    });

    graphSvg.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var rect = graphSvg.getBoundingClientRect();
      var px = view.x + ((ev.clientX - rect.left) / rect.width) * view.w;
      var py = view.y + ((ev.clientY - rect.top) / rect.height) * view.h;
      zoomBy(ev.deltaY > 0 ? 1.1 : 0.9, px, py);
    }, { passive: false });

    var dragging = false, dragStart = null;
    graphSvg.addEventListener("pointerdown", function (ev) {
      dragging = true;
      graphSvg.classList.add("dragging");
      dragStart = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
      graphSvg.setPointerCapture(ev.pointerId);
    });
    graphSvg.addEventListener("pointermove", function (ev) {
      if (!dragging) return;
      var rect = graphSvg.getBoundingClientRect();
      var dx = (ev.clientX - dragStart.x) * (view.w / rect.width);
      var dy = (ev.clientY - dragStart.y) * (view.h / rect.height);
      view.x = dragStart.vx - dx;
      view.y = dragStart.vy - dy;
      applyView();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
      graphSvg.addEventListener(evt, function () {
        dragging = false;
        graphSvg.classList.remove("dragging");
      });
    });

    var legend = document.getElementById("legend");
    LEGEND.forEach(function (l) {
      var span = document.createElement("span");
      span.className = "swatch";
      var svg = document.createElementNS(svgns, "svg");
      svg.setAttribute("width", "22"); svg.setAttribute("height", "8");
      var line = el("line", { class: "edge edge-" + l[0], x1: 0, y1: 4, x2: 22, y2: 4 });
      svg.appendChild(line);
      span.appendChild(svg);
      var text = document.createElement("span");
      text.textContent = l[1];
      span.appendChild(text);
      legend.appendChild(span);
    });
  }
})();
```

- [ ] **Step 2: Commit**

```bash
git add app.js
git commit -m "Add graph/card rendering engine reading from data/personagens.json"
```

---

### Task 5: `index.html` and first browser verification

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `style.css` (Task 3), `app.js` (Task 4), `data/personagens.json` (Task 1) via relative paths from the site root.
- Produces: the page shell — the DOM ids/structure `app.js` (Task 4) expects: `#graph` (`<svg>`), `#edges`, `#nodes` (groups inside the svg), `#legend`, `#panel`, `#panelBody`, `#panelClose`, `#zoomIn`, `#zoomOut`, `#zoomReset`.

- [ ] **Step 1: Write `index.html`**

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
  <header class="topbar">
    <div>
      <span class="eyebrow">Génesis &amp; Êxodo</span>
      <h1>Os Personagens da Bíblia</h1>
    </div>
    <p class="instructions">Toca numa personagem para abrires a sua história. Arrasta para navegar, usa os botões para ampliar.</p>
    <div class="legend" id="legend"></div>
  </header>

  <div class="stage">
    <div class="graph-wrap">
      <svg id="graph" viewBox="0 0 1560 660" role="img" aria-label="Mapa de personagens bíblicas e as suas relações">
        <g id="edges"></g>
        <g id="nodes"></g>
      </svg>
      <div class="controls">
        <button id="zoomIn" type="button" aria-label="Ampliar">+</button>
        <button id="zoomOut" type="button" aria-label="Reduzir">&minus;</button>
        <button id="zoomReset" type="button" aria-label="Repor vista">&#8634;</button>
      </div>
    </div>

    <aside id="panel">
      <button class="panel-close" id="panelClose" type="button">Fechar &times;</button>
      <div id="panelBody">
        <p class="panel-empty">Escolhe uma personagem no mapa para conheceres a sua história, o contexto histórico, as referências bíblicas e a família.</p>
      </div>
    </aside>
  </div>

  <footer class="note">Os Personagens da Bíblia — Paróquia da Póvoa de Santa Iria.</footer>
</div>
<script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in the browser**

Use the `run` skill to serve this directory over HTTP (opening `index.html` directly via `file://` will make the `fetch("data/personagens.json")` call in `app.js` fail in most browsers due to CORS restrictions on local files).

Check, and fix any issue found before moving on:
- The 20 character medallions appear on a warm parchment background, each with a small brown icon inside.
- Clicking a medallion opens the side panel (or bottom sheet on a narrow window) showing: época, nome, referências, resumo, "Contexto histórico" section, "Família" section.
- Clicking empty canvas closes the selection.
- Drag-to-pan and the +/−/reset buttons work.
- No console errors (especially no 404s for `data/personagens.json` or any `assets/icons/*.svg`).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add page shell wiring style.css, app.js and the data file together"
```

---

### Task 6: Content expansion — close the Génesis/Êxodo block

**Files:**
- Modify: `data/personagens.json`

**Interfaces:**
- Consumes/produces: same shape as Task 1; this task only appends 14 new entries to `personagens`, appends new entries to `edges`, updates `layout` to `{ "width": 1700, "height": 720 }`, and widens the SVG's initial `viewBox` in `index.html` (Task 5) to match.

- [ ] **Step 1: Update `layout` and append 14 characters to `data/personagens.json`**

Change the top of the file:
```json
  "layout": { "width": 1700, "height": 720 },
```

Append these 14 entries to the end of the `personagens` array (after `miriam`, before the closing `]`):

```json
    { "id": "ruben", "nome": "Rúben", "tipo": "povo", "tier": "minor", "x": 1180, "y": 30, "era": "As famílias de Jacob", "refs": "Gn 29:32; 35:22; 49:3-4",
      "resumo": "Filho mais velho de Jacob e Lia. Perde o direito de primogenitura por uma falta contra o pai (Gn 35:22; 49:4), mas é ele quem, mais tarde, tenta salvar José da morte às mãos dos irmãos (Gn 37:21-22).",
      "contexto": "Como primogénito, Rúben teria direito a uma porção dobrada de herança e à liderança da família — um costume comum entre os povos semi-nómadas do Próximo Oriente Antigo, que este episódio bíblico mostra não ser automático.",
      "relacoes": "Filho de Jacob e Lia. Irmão de Simeão, Levi, Judá, Issacar, Zabulão e Dina, e meio-irmão dos restantes filhos de Jacob." },
    { "id": "simeao", "nome": "Simeão", "tipo": "povo", "tier": "minor", "x": 1180, "y": 85, "era": "As famílias de Jacob", "refs": "Gn 29:33; 34; 49:5-7",
      "resumo": "Segundo filho de Jacob e Lia. Junto com Levi, vinga com violência a irmã Dina, um ato que o pai condena no seu leito de morte (Gn 49:5-7).",
      "contexto": "O episódio de Siquém (Gn 34) reflete os códigos de honra familiar do mundo antigo, onde a ofensa a uma mulher da família era vista como ofensa a todo o clã.",
      "relacoes": "Filho de Jacob e Lia. Irmão de Rúben, Levi, Judá, Issacar, Zabulão e Dina." },
    { "id": "levi", "nome": "Levi", "tipo": "sacerdote", "tier": "minor", "x": 1180, "y": 140, "era": "As famílias de Jacob", "refs": "Gn 29:34; 49:5-7; Êx 6:16-20",
      "resumo": "Terceiro filho de Jacob e Lia. É dele que descendem Moisés, Arão e Miriam — a tribo de Levi tornar-se-ia, mais tarde, a tribo sacerdotal de Israel, dedicada ao serviço do templo.",
      "contexto": "Ao contrário das outras tribos, os levitas não recebem um território próprio em Canaã (Js 13:33) — a sua \"herança\" é o próprio serviço religioso, sustentado pelas ofertas do resto do povo.",
      "relacoes": "Filho de Jacob e Lia. Antepassado de Moisés, Arão e Miriam (via Coate e Anrão — Êx 6)." },
    { "id": "juda", "nome": "Judá", "tipo": "povo", "tier": "standard", "x": 1180, "y": 195, "era": "As famílias de Jacob", "refs": "Gn 29:35; 37:26-27; 44; 49:8-10",
      "resumo": "Quarto filho de Jacob e Lia. Propõe vender José em vez de o matar, e mais tarde oferece-se como refém para poupar Benjamim — um gesto que mostra a sua transformação. A tradição bíblica liga-lhe a futura linhagem real de David.",
      "contexto": "A bênção de Jacob a Judá (Gn 49:8-10), prometendo que \"o cetro não se afastará de Judá\", é lida pela tradição cristã como uma das profecias que apontam para a descendência de Jesus.",
      "relacoes": "Filho de Jacob e Lia. Irmão de Rúben, Simeão, Levi, Issacar, Zabulão e Dina. Antepassado da linhagem de David." },
    { "id": "issacar", "nome": "Issacar", "tipo": "povo", "tier": "minor", "x": 1180, "y": 250, "era": "As famílias de Jacob", "refs": "Gn 30:17-18; 49:14-15",
      "resumo": "Nono filho de Jacob, quinto de Lia. A Bíblia dedica-lhe poucos episódios próprios — é sobretudo conhecido através da tribo que viria a levar o seu nome.",
      "contexto": "A bênção de Jacob descreve-o como \"jumento forte\" que se curva ao trabalho — uma imagem ligada às terras férteis do vale de Jezreel, onde a tribo de Issacar se viria a fixar.",
      "relacoes": "Filho de Jacob e Lia." },
    { "id": "zabulao", "nome": "Zabulão", "tipo": "povo", "tier": "minor", "x": 1180, "y": 305, "era": "As famílias de Jacob", "refs": "Gn 30:19-20; 49:13",
      "resumo": "Décimo filho de Jacob, sexto e último de Lia. Como o irmão Issacar, é conhecido sobretudo através da tribo de Israel que herda o seu nome.",
      "contexto": "A bênção de Jacob liga Zabulão ao mar e aos portos (Gn 49:13) — o seu território ficaria perto da costa, numa rota comercial importante da região.",
      "relacoes": "Filho de Jacob e Lia." },
    { "id": "dan", "nome": "Dan", "tipo": "povo", "tier": "minor", "x": 1180, "y": 360, "era": "As famílias de Jacob", "refs": "Gn 30:1-6; 49:16-17",
      "resumo": "Quinto filho de Jacob, nascido de Bila, serva de Raquel — dado à luz \"sobre os joelhos\" de Raquel, que assim o considera seu, segundo o costume da época.",
      "contexto": "Uma mulher sem filhos dar a sua serva ao marido para gerar herdeiros \"em seu nome\" era uma prática documentada noutros textos legais do Próximo Oriente Antigo, não uma invenção da narrativa bíblica.",
      "relacoes": "Filho de Jacob e de Bila, serva de Raquel. Meio-irmão de Neftali (também filho de Bila)." },
    { "id": "neftali", "nome": "Neftali", "tipo": "povo", "tier": "minor", "x": 1180, "y": 415, "era": "As famílias de Jacob", "refs": "Gn 30:7-8; 49:21",
      "resumo": "Sexto filho de Jacob, segundo de Bila, serva de Raquel.",
      "contexto": "Como Dan, o seu nascimento reflete a rivalidade entre Raquel e Lia pelo número de filhos — uma disputa que estrutura boa parte dos capítulos de Génesis 29-30.",
      "relacoes": "Filho de Jacob e de Bila, serva de Raquel. Meio-irmão de Dan." },
    { "id": "gad", "nome": "Gad", "tipo": "povo", "tier": "minor", "x": 1180, "y": 470, "era": "As famílias de Jacob", "refs": "Gn 30:9-11; 49:19",
      "resumo": "Sétimo filho de Jacob, nascido de Zilpa, serva de Lia.",
      "contexto": "Tal como Bila, Zilpa entra na família como serva de casamento — o seu estatuto era diferente do de uma esposa, mas os seus filhos herdam plenos direitos como filhos de Jacob.",
      "relacoes": "Filho de Jacob e de Zilpa, serva de Lia. Meio-irmão de Aser (também filho de Zilpa)." },
    { "id": "aser", "nome": "Aser", "tipo": "povo", "tier": "minor", "x": 1180, "y": 525, "era": "As famílias de Jacob", "refs": "Gn 30:12-13; 49:20",
      "resumo": "Oitavo filho de Jacob, segundo de Zilpa, serva de Lia.",
      "contexto": "A bênção de Jacob promete-lhe \"pão gordo\" e \"iguarias de rei\" (Gn 49:20) — uma referência à fertilidade da região costeira onde a sua tribo se viria a estabelecer.",
      "relacoes": "Filho de Jacob e de Zilpa, serva de Lia. Meio-irmão de Gad." },
    { "id": "dina", "nome": "Dina", "tipo": "jovem", "tier": "minor", "x": 1180, "y": 580, "era": "As famílias de Jacob", "refs": "Gn 30:21; 34",
      "resumo": "Única filha de Jacob e Lia mencionada pelo nome. A sua história em Siquém (Gn 34) desencadeia a resposta violenta dos irmãos Simeão e Levi contra a cidade.",
      "contexto": "Dina é uma das poucas mulheres com um capítulo inteiro dedicado à sua história em Génesis — um sinal de como a narrativa bíblica, apesar de centrada em figuras masculinas, também dá espaço a episódios centrados em mulheres.",
      "relacoes": "Filha de Jacob e Lia. Irmã de Rúben, Simeão, Levi, Judá, Issacar e Zabulão." },
    { "id": "benjamim", "nome": "Benjamim", "tipo": "jovem", "tier": "standard", "x": 1180, "y": 635, "era": "As famílias de Jacob", "refs": "Gn 35:16-20; 44",
      "resumo": "Filho mais novo de Jacob, e o único, com José, nascido de Raquel — que morre ao dá-lo à luz, perto de Belém. Depois da suposta morte de José, torna-se o filho mais amado de Jacob, e é por ele que Judá se oferece como refém no Egito.",
      "contexto": "O seu nome original, Ben-Oni (\"filho da minha dor\"), dado por Raquel moribunda, é mudado por Jacob para Benjamim (\"filho da minha mão direita\") — uma mudança de nome que, como outras na Bíblia, marca uma nova fase na história da família.",
      "relacoes": "Filho de Jacob e Raquel. Irmão mais novo de José." },
    { "id": "arao", "nome": "Arão", "tipo": "sacerdote", "tier": "standard", "x": 1420, "y": 440, "era": "O Êxodo", "refs": "Êx 4; 7; 28",
      "resumo": "Irmão mais velho de Moisés e Miriam. Torna-se o porta-voz de Moisés perante o Faraó (Êx 4:14-16) e, mais tarde, o primeiro sumo sacerdote de Israel (Êx 28) — dele descende toda a linhagem sacerdotal levítica.",
      "contexto": "A instituição de um sacerdócio hereditário, ligado a uma única família dentro da tribo de Levi, é uma das estruturas religiosas centrais que o livro do Êxodo estabelece para o culto de Israel.",
      "relacoes": "Filho de Anrão e Jocabede, descendentes de Levi. Irmão de Moisés e Miriam." },
    { "id": "farao", "nome": "Faraó", "tipo": "rei", "tier": "standard", "x": 1560, "y": 600, "era": "O Êxodo", "refs": "Êx 1–14",
      "resumo": "Título do governante do Egito na narrativa do Êxodo — a Bíblia não dá o seu nome próprio. Escraviza o povo de Israel por temer o seu crescimento, e recusa repetidamente libertá-lo, mesmo depois das dez pragas, até à décima praga e à perseguição final junto ao Mar Vermelho.",
      "contexto": "Os egiptólogos debatem com qual faraó histórico esta narrativa poderá corresponder — um candidato comum é Ramessés II (séc. XIII a.C.) — mas a Bíblia trata-o sobretudo como símbolo do poder que se opõe à libertação do povo de Deus.",
      "relacoes": "Não tem relações familiares na narrativa — figura antagonista, sem ligação de sangue às restantes personagens deste grafo." }
```

Append these entries to the end of the `edges` array:

```json
    ["jacob", "ruben", "parent"], ["lia", "ruben", "parent"],
    ["jacob", "simeao", "parent"], ["lia", "simeao", "parent"],
    ["jacob", "levi", "parent"], ["lia", "levi", "parent"],
    ["jacob", "juda", "parent"], ["lia", "juda", "parent"],
    ["jacob", "issacar", "parent"], ["lia", "issacar", "parent"],
    ["jacob", "zabulao", "parent"], ["lia", "zabulao", "parent"],
    ["jacob", "dina", "parent"], ["lia", "dina", "parent"],
    ["jacob", "dan", "parent"],
    ["jacob", "neftali", "parent"],
    ["jacob", "gad", "parent"],
    ["jacob", "aser", "parent"],
    ["jacob", "benjamim", "parent"], ["raquel", "benjamim", "parent"],
    ["arao", "moises", "sibling"], ["arao", "miriam", "sibling"]
```

Note: Jacob's 12 children are deliberately **not** connected to each other with sibling edges — a full mesh across 12 nodes (66 lines) would be visual noise. Their shared parentage is already visible through the shared `parent` lines converging on Jacob/Lia/Raquel, and each character's `relacoes` text spells out the siblings by name.

- [ ] **Step 2: Widen the initial viewBox in `index.html` to match**

In `index.html`, change:
```html
      <svg id="graph" viewBox="0 0 1560 660" role="img" aria-label="Mapa de personagens bíblicas e as suas relações">
```
to:
```html
      <svg id="graph" viewBox="0 0 1700 720" role="img" aria-label="Mapa de personagens bíblicas e as suas relações">
```

- [ ] **Step 3: Verify the JSON parses and counts are right**

Run:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('data/personagens.json', 'utf-8'));
const ids = new Set(d.personagens.map(p => p.id));
const bad = d.edges.filter(e => !ids.has(e[0]) || !ids.has(e[1]));
console.log(d.personagens.length, 'personagens,', d.edges.length, 'edges,', 'bad refs:', bad.length);
"
```
Expected: `34 personagens, 53 edges, bad refs: 0`

- [ ] **Step 4: Verify in the browser**

Serve via the `run` skill again and check:
- 14 new medallions appear clustered near Jacob/Lia/Raquel and near Moisés/Miriam, with no label seriously overlapping another (nudge `x`/`y` values in `data/personagens.json` by a few pixels if two labels collide, then re-check).
- Clicking each new character shows the expected content, including "Contexto histórico".
- Faraó appears with no connecting lines (expected — no family edges).

- [ ] **Step 5: Commit**

```bash
git add data/personagens.json index.html
git commit -m "Add 14 characters closing out the Génesis/Êxodo block"
```

---

### Task 7: Final QA pass

**Files:** none created — verification only, plus the housekeeping edits below.

- [ ] **Step 1: Mobile viewport check**

Using the `run` skill's browser, resize (or use device emulation) to a narrow viewport (e.g. 375×667). Confirm:
- The instructions text and footer hide (per the `@media (max-width: 720px)` rule in `style.css`).
- Selecting a character opens the panel as a bottom sheet with a visible "Fechar ×" button that closes it.

- [ ] **Step 2: Full click-through**

Click through all 34 characters one by one (or a representative sample of at least 10 spanning different `tier`/`tipo` values) and confirm no character is missing a `contexto`, `resumo`, or `relacoes` value (an empty section would show as a blank paragraph after the section title).

- [ ] **Step 3: Update `handover.md`**

Add a short note recording that the redesign shipped, replacing the earlier "prototype only exists as an Artifact" note, since the working code now lives in this repository at `index.html` / `style.css` / `app.js` / `data/personagens.json`.

- [ ] **Step 4: Commit**

```bash
git add handover.md
git commit -m "Update handover notes after visual/content redesign"
```
