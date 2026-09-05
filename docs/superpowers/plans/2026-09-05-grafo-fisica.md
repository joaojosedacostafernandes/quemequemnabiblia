# Grafo com Física (Ronda 11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir por completo o tema claro "Livro de Ilustrações" e a faixa de épocas (Rondas 7-10) por um grafo com física real (repulsão, molas, câmara que se ajusta sozinha), tema escuro/estrelado, começando em 7 "capítulos" que se vão revelando progressivamente ao clicar — portando o motor já escrito e testado num mockup de brainstorming para ler os dados reais do site.

**Architecture:** Este não é um motor escrito de raiz — é um **porto** do mockup `docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html` (cópia versionada de `.superpowers/brainstorm/mockup-grafo-A-capitulos.html`, que está fora do git). O mockup tem ~105 personagens escritas à mão num objeto `defs` e uma lista `capitulos` embutida; este plano substitui isso por um novo módulo puro (`js/reveal-graph.js`) que deriva a mesma forma de dados (`defs`/`weakRefs`) automaticamente a partir de `data/personagens.json`, mantendo o motor de física (`js/physics.js`) e o motor de desenho (`js/render-graph.js`) o mais próximo possível do mockup original, com um conjunto pequeno e concreto de adaptações (ver cada tarefa).

**Tech Stack:** HTML/CSS/JS puro (sem frameworks, sem build step) — site estático, consistente com o resto do projeto.

**Spec:** `docs/superpowers/specs/2026-09-05-grafo-fisica-design.md`

## Global Constraints

- Não introduzir nenhuma dependência nova (sem npm packages, sem frameworks, sem build step).
- `data/personagens.json` continua a ser a única fonte de conteúdo — o único campo novo permitido é o array de topo `capitulos` (7 entradas). Nenhum campo por personagem muda.
- Implementar num git worktree isolado, nunca diretamente em `master`.
- Reutilizar a paleta e tipografia já escritas no mockup de referência (`docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html`) — não inventar cores/fontes novas.
- `assets/retratos/` e `assets/icons/` não mudam de sítio nem de formato — só o caminho relativo usado para os referenciar muda (o mockup usa `"../../" + retrato` por estar dentro de `.superpowers/brainstorm/`; o site real usa `retrato` diretamente, tal como `app.js`/`render-cluster.js` já fazem hoje).
- Nenhuma personagem, ligação ou texto de conteúdo bíblico muda nesta ronda — só o motor de visualização.

---

### Task 1: `capitulos` em `data/personagens.json`

**Files:**
- Modify: `data/personagens.json` (acrescentar array de topo, irmão de `eras`)

**Interfaces:**
- Produces: `data.capitulos` — `[{ nome: string, arranque: string[] }, ...]`, 7 entradas, cada `arranque` uma lista de ids de `personagens[].id`. Consumido pela Task 2.

- [ ] **Step 1: Verificar que todos os ids existem no ficheiro atual**

Run (prepondo o PATH do Node conforme `handover.md`):
```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node -e "
const d = require('./data/personagens.json');
const ids = new Set(d.personagens.map(p=>p.id));
const capIds = ['adao','noe','abraao','moises','miriam','arao','farao','josue','calebe','otoniel','eude','debora','baraque','jael','gideao','jefte','sansao','dalila','noemi','rute','elcana','eli','jesse','golias','natan','rainha_seba','jeroboao','elias','acab','eliseu','naama','josias','saul','acaz','uzias','isaias','senaqueribe','jeremias','baruque','godolias','ebede_meleque','nabucodonosor','ezequiel','oseias','amos','amasias','jonas','miqueias','naum','habacuc','sofonias','ageu','zacarias','malaquias','joel','abdias'];
const missing = capIds.filter(id => !ids.has(id));
console.log('missing:', missing);
"
```
Expected: `missing: []` (já confirmado durante o planeamento, mas repetir aqui porque este é o primeiro passo de execução real e os dados podem ter mudado entretanto).

Se `missing` não for vazio, PARAR e reportar BLOCKED — não inventar substitutos.

- [ ] **Step 2: Acrescentar o array `capitulos`**

Adicionar como um novo campo de topo do JSON (irmão de `"eras"`, `"personagens"`, `"edges"`):

```json
"capitulos": [
  { "nome": "As Origens", "arranque": ["adao", "noe"] },
  { "nome": "Os Patriarcas", "arranque": ["abraao"] },
  { "nome": "O Êxodo", "arranque": ["moises", "miriam", "arao", "farao"] },
  { "nome": "Josué e os Juízes", "arranque": ["josue", "calebe", "otoniel", "eude", "debora", "baraque", "jael", "gideao", "jefte", "sansao", "dalila", "noemi", "rute"] },
  { "nome": "Os Reis", "arranque": ["elcana", "eli", "jesse", "golias", "natan", "rainha_seba", "jeroboao", "elias", "acab", "eliseu", "naama", "josias", "saul"] },
  { "nome": "Os Grandes Profetas", "arranque": ["acaz", "uzias", "isaias", "senaqueribe", "jeremias", "baruque", "godolias", "ebede_meleque", "nabucodonosor", "ezequiel"] },
  { "nome": "Os Profetas Menores", "arranque": ["oseias", "amos", "amasias", "jonas", "miqueias", "naum", "habacuc", "sofonias", "ageu", "zacarias", "malaquias", "joel", "abdias"] }
]
```

- [ ] **Step 3: Validar que o JSON continua válido**

```bash
node -e "const d = require('./data/personagens.json'); console.log('capitulos:', d.capitulos.length, 'personagens:', d.personagens.length, 'edges:', d.edges.length);"
```
Expected: `capitulos: 7 personagens: 105 edges: 115`

- [ ] **Step 4: Commit**

```bash
git add data/personagens.json
git commit -m "feat: add capitulos array for graph entry points"
```

---

### Task 2: `js/reveal-graph.js` (novo módulo, funções puras)

**Files:**
- Create: `js/reveal-graph.js`
- Test: `scripts/test-reveal-graph.js`

**Interfaces:**
- Consumes: `data.personagens` (array de `{id, nome, tipo, retrato, tier, era, refs, resumo, contexto, relacoes}`), `data.edges` (array de `[a, b, tipo, label?]`, tipos `parent`/`spouse`/`sibling`/`descendant`/`affinity`), `data.capitulos` (Task 1).
- Produces: `window.RevealGraph.build(personagens, edges, capitulos)` → `{ defs, weakRefs }`:
  - `defs`: objeto `{ [id]: { kind, nome, rel, era, refs, resumo, contexto, retrato, reveals, home?, spouses? } }` — mesma forma que o mockup usa (ver `docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html:153`), incluindo entradas sintéticas para capítulos (`kind:'capitulo'`) e para uniões (`kind:'uniao'`, sem `nome`, com `spouses:[idA,idB]`).
  - `weakRefs`: array `[{a, b, type, label}]` — uma entrada por cada `edge` do tipo `descendant`, `affinity`, e por qualquer `sibling` cujos dois lados não partilhem um progenitor comum já representado por um nó de união (ver Step 4).

- [ ] **Step 1: Escrever os testes (falham primeiro — não há implementação ainda)**

Criar `scripts/test-reveal-graph.js`:

```js
const assert = require('assert');
const { build } = require('../js/reveal-graph.js');

function personagem(id, extra) {
  return Object.assign({ id, nome: id, tipo: 'x', retrato: null, tier: 'standard', era: 'Era X', refs: '', resumo: '', contexto: '', relacoes: '' }, extra);
}

// --- Caso 1: união com dois cônjuges conhecidos ---
(function () {
  const personagens = [personagem('pai'), personagem('mae'), personagem('filho')];
  const edges = [
    ['pai', 'mae', 'spouse'],
    ['pai', 'filho', 'parent'],
    ['mae', 'filho', 'parent'],
  ];
  const { defs } = build(personagens, edges, []);
  const uniaoIds = Object.keys(defs).filter(id => defs[id].kind === 'uniao');
  assert.strictEqual(uniaoIds.length, 1, 'devia sintetizar exatamente 1 nó de união');
  const uniaoId = uniaoIds[0];
  assert.deepStrictEqual(defs[uniaoId].spouses.slice().sort(), ['mae', 'pai'], 'a união devia listar os dois cônjuges');
  assert.ok(defs['pai'].reveals.includes(uniaoId), 'o pai devia revelar a união');
  assert.ok(defs['mae'].reveals.includes(uniaoId), 'a mãe também devia revelar a união — a família tem de ser alcançável a partir de qualquer um dos cônjuges, não só do primeiro lado da aresta "spouse"');
  assert.ok(defs[uniaoId].reveals.includes('filho'), 'a união devia revelar o filho');
  console.log('ok: união com dois cônjuges conhecidos');
})();

// --- Caso 2: progenitor único conhecido (ex: Eli) ---
(function () {
  const personagens = [personagem('eli'), personagem('hofni')];
  const edges = [['eli', 'hofni', 'parent']];
  const { defs } = build(personagens, edges, []);
  const uniaoIds = Object.keys(defs).filter(id => defs[id].kind === 'uniao');
  assert.strictEqual(uniaoIds.length, 0, 'sem cônjuge conhecido, não deve sintetizar nenhuma união');
  assert.ok(defs['eli'].reveals.includes('hofni'), 'eli devia revelar hofni diretamente, sem união');
  console.log('ok: progenitor único conhecido revela diretamente, sem união sintética');
})();

// --- Caso 3: personagem-folha sem revelações ---
(function () {
  const personagens = [personagem('sozinho')];
  const { defs } = build(personagens, [], []);
  assert.deepStrictEqual(defs['sozinho'].reveals, [], 'sem ligações, reveals devia ficar vazio');
  console.log('ok: personagem-folha sem revelações');
})();

// --- Caso 4: descendant e affinity tornam-se weakRefs, nunca reveals ---
(function () {
  const personagens = [personagem('a'), personagem('b'), personagem('c'), personagem('d')];
  const edges = [
    ['a', 'b', 'descendant', '8 gerações'],
    ['c', 'd', 'affinity', 'sogra e nora'],
  ];
  const { defs, weakRefs } = build(personagens, edges, []);
  assert.deepStrictEqual(defs['a'].reveals, [], 'descendant não deve aparecer em reveals');
  assert.deepStrictEqual(defs['c'].reveals, [], 'affinity não deve aparecer em reveals');
  assert.ok(weakRefs.some(w => w.a === 'a' && w.b === 'b' && w.type === 'descendant' && w.label === '8 gerações'));
  assert.ok(weakRefs.some(w => w.a === 'c' && w.b === 'd' && w.type === 'affinity' && w.label === 'sogra e nora'));
  console.log('ok: descendant/affinity viram weakRefs, nunca reveals');
})();

// --- Caso 5: sibling sem progenitor comum conhecido vira weakRef (caso Dan/Neftali da Ronda 9) ---
(function () {
  const personagens = [personagem('pai2'), personagem('filhoA'), personagem('filhoB')];
  const edges = [
    ['pai2', 'filhoA', 'parent'],
    ['pai2', 'filhoB', 'parent'],
    ['filhoA', 'filhoB', 'sibling'],
  ];
  const { defs, weakRefs } = build(personagens, edges, []);
  assert.deepStrictEqual(defs['filhoA'].reveals, [], 'sibling nunca deve fazer parte da árvore de revelação, mesmo com progenitor comum');
  assert.ok(weakRefs.some(w => (w.a === 'filhoA' && w.b === 'filhoB') || (w.a === 'filhoB' && w.b === 'filhoA')), 'sibling devia virar weakRef');
  console.log('ok: sibling vira sempre weakRef, nunca reveal (redundante com o progenitor)');
})();

// --- Caso 6: capítulos entram em defs como nós kind:'capitulo' com home e reveals ---
(function () {
  const personagens = [personagem('x'), personagem('y')];
  const capitulos = [{ nome: 'Capítulo Um', arranque: ['x', 'y'] }];
  const { defs } = build(personagens, [], capitulos);
  const capIds = Object.keys(defs).filter(id => defs[id].kind === 'capitulo');
  assert.strictEqual(capIds.length, 1);
  const cap = defs[capIds[0]];
  assert.strictEqual(cap.nome, 'Capítulo Um');
  assert.deepStrictEqual(cap.reveals.slice().sort(), ['x', 'y']);
  assert.ok(Array.isArray(cap.home) && cap.home.length === 2, 'capítulo devia ter coordenadas home [x,y]');
  console.log('ok: capítulos viram nós kind:capitulo com reveals e home');
})();

console.log('\nALL PASS');
```

- [ ] **Step 2: Correr os testes para confirmar que falham (o módulo ainda não existe)**

```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node scripts/test-reveal-graph.js
```
Expected: FALHA com `Error: Cannot find module '../js/reveal-graph.js'` (ou semelhante) — confirma que estamos a começar do "vermelho".

- [ ] **Step 3: Implementar `js/reveal-graph.js`**

```js
(function () {
  function build(personagens, edges, capitulos) {
    var defs = {};
    var weakRefs = [];

    personagens.forEach(function (p) {
      defs[p.id] = {
        kind: p.tier, // 'major' | 'standard' | 'minor'
        nome: p.nome,
        rel: p.relacoes || null,
        era: p.era,
        refs: p.refs,
        resumo: p.resumo,
        contexto: p.contexto,
        retrato: p.retrato,
        reveals: []
      };
    });

    // Passo 1: sintetizar um nó de união por cada par de cônjuges.
    var unionOf = {}; // "idA|idB" (ordenado) -> unionId
    function unionKey(a, b) { return [a, b].sort().join('|'); }
    edges.filter(function (e) { return e[2] === 'spouse'; }).forEach(function (e) {
      var a = e[0], b = e[1];
      var unionId = 'u_' + a + '_' + b;
      unionOf[unionKey(a, b)] = unionId;
      defs[unionId] = { kind: 'uniao', nome: '', spouses: [a, b], reveals: [] };
      // Os DOIS cônjuges revelam a união (não só o primeiro da aresta) — se
      // só um o fizesse, a família ficaria inacessível sempre que um futuro
      // capítulo/ponto de entrada revelasse primeiro o outro cônjuge, por
      // acaso da ordem em que a aresta "spouse" foi escrita no JSON.
      if (defs[a]) defs[a].reveals.push(unionId);
      if (defs[b]) defs[b].reveals.push(unionId);
      // Garante que os dois cônjuges aparecem no ecrã mesmo que nenhum outro
      // nó os liste diretamente em "reveals" (ex: a Eva nunca é alvo direto
      // de ninguém no mockup original — sem isto, nunca chegaria a aparecer).
      defs[unionId].reveals.push(a, b);
    });

    // Passo 2: para cada filho, agrupar os progenitores conhecidos (edges
    // "parent" de entrada) e decidir de onde revelar.
    var parentsOf = {}; // childId -> [parentId, ...]
    edges.filter(function (e) { return e[2] === 'parent'; }).forEach(function (e) {
      var parentId = e[0], childId = e[1];
      (parentsOf[childId] = parentsOf[childId] || []).push(parentId);
    });
    Object.keys(parentsOf).forEach(function (childId) {
      var parents = parentsOf[childId];
      if (parents.length >= 2) {
        // Tenta encontrar um par de progenitores com um nó de união sintetizado.
        var found = null;
        for (var i = 0; i < parents.length && !found; i++) {
          for (var j = i + 1; j < parents.length && !found; j++) {
            var key = unionKey(parents[i], parents[j]);
            if (unionOf[key]) found = unionOf[key];
          }
        }
        if (found) {
          defs[found].reveals.push(childId);
          return;
        }
      }
      // Só um progenitor conhecido (ou vários mas sem união sintetizada entre
      // eles) — revela a partir do primeiro progenitor conhecido.
      var p0 = parents[0];
      if (defs[p0]) defs[p0].reveals.push(childId);
    });

    // Passo 3: sibling, descendant e affinity nunca entram na árvore de
    // revelação — sibling é sempre redundante com o progenitor (quem tem
    // ligação sibling já é revelado pelo seu progenitor, quando este existe;
    // quando não existe — caso Dan/Neftali, Ronda 9 — não há âncora de
    // revelação de qualquer forma). Todos os três tornam-se weakRefs.
    edges.filter(function (e) { return e[2] === 'sibling' || e[2] === 'descendant' || e[2] === 'affinity'; })
      .forEach(function (e) {
        weakRefs.push({ a: e[0], b: e[1], type: e[2], label: e[3] || null });
      });

    // Passo 4: capítulos — nós sintéticos kind:'capitulo', com posições fixas
    // em grelha (2 filas: 4 na primeira, 3 na segunda — mesma disposição do
    // mockup original) e reveals = a sua lista de arranque.
    var CAP_HOMES = [[260, 180], [580, 180], [900, 180], [1220, 180], [260, 500], [580, 500], [900, 500]];
    (capitulos || []).forEach(function (cap, i) {
      var capId = 'cap_' + i;
      defs[capId] = { kind: 'capitulo', nome: cap.nome, reveals: cap.arranque.slice(), home: CAP_HOMES[i] || [700, 340] };
    });

    // Limpa duplicados nas listas de reveals (uma personagem pode, em teoria,
    // ser alvo de mais do que uma origem — mantemos só a primeira ocorrência).
    Object.keys(defs).forEach(function (id) { defs[id].reveals = uniqueKeepOrder(defs[id].reveals); });

    return { defs: defs, weakRefs: weakRefs };
  }

  function uniqueKeepOrder(arr) {
    var seen = {}; var out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = true; out.push(x); } });
    return out;
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.RevealGraph = api;
})();
```

- [ ] **Step 4: Correr os testes até passarem**

```bash
node scripts/test-reveal-graph.js
```
Expected: 6 linhas `ok: ...` seguidas de `ALL PASS`.

Se algum teste falhar, ajustar a implementação (não o teste) até passar — exceto se o teste em si estiver mal escrito, caso em que corrigir o teste e justificar no commit.

- [ ] **Step 5: Commit**

```bash
git add js/reveal-graph.js scripts/test-reveal-graph.js
git commit -m "feat: derive reveal graph automatically from existing edges"
```

---

### Task 3: `js/physics.js` (porto do motor de simulação)

**Files:**
- Create: `js/physics.js`

**Interfaces:**
- Consumes: `defs`/`weakRefs` (Task 2, forma exata documentada acima).
- Produces: `window.Physics` com os métodos (contrato completo — `app.js`, Task 6, chama exatamente estes nomes):
  - `init(defs, weakRefs, canvasWidth, canvasHeight, safeTop)` — guarda o estado interno (equivalente a `sim`, `W`, `H`, `SAFE_TOP` no mockup, mais `weakRefs` guardado para `getWeakEdgesVisible()`).
  - `bootstrap()` — inicia `sim` só com os nós que têm `home` definido (os 7 capítulos). Equivalente a `bootstrap()`, mockup linhas 202-208.
  - `toggleExpand(id, onChange)` — expande/colapsa um nó; chama `onChange()` depois de mexer no `sim`. Equivalente a `toggleExpand`/`collapseSubtree`, linhas 232-264, **com uma adaptação obrigatória** (ver Step 2).
  - `tick(onFrame)` — arranca o ciclo de simulação (`requestAnimationFrame` recorrente); chama `onFrame()` a cada frame para redesenhar. Equivalente a `tick()`, linhas 288-358, mas parametrizado (o mockup chama `draw()` diretamente dentro do `tick()`, linha 340 — aqui, substituir essa chamada por `onFrame()`, recebido como argumento).
  - `wake()` — acorda a simulação. Igual ao mockup, linha 279 (adaptado para não chamar `requestAnimationFrame(tick)` diretamente, mas sim o `tick` guardado internamente com o `onFrame` já ligado da última chamada a `Physics.tick(onFrame)`).
  - `getNode(id)`, `getAllNodes()` — acesso de leitura ao `sim`.
  - `getEdges()` — equivalente a `allEdges()`, linhas 226-230 (ligações fortes/reveladas, entre nós já em `sim`).
  - `getWeakEdgesVisible()` — filtra o `weakRefs` guardado em `init()` às entradas em que **ambas** as pontas já estão em `sim` (mesma lógica do `weakRefs.forEach` dentro de `draw()` no mockup, linhas 444-448, mas exposta como método de leitura em vez de misturada no desenho): `weakRefs.filter(function (w) { return sim.has(w.a) && sim.has(w.b); })`.
  - `everythingInView()` / `fitView()` / `animateCameraTo(targetScale, targetTx, targetTy, duration)` — equivalentes às linhas 470-522, sem alterações de fundo (usam `scale`/`tx`/`ty` internos).
  - `collapseAll(onChange)` — equivalente à linha 210-215, chama `onChange()` em vez de `render()`/`resetView()` diretamente (quem decide redesenhar é sempre quem chama, nunca o módulo de física).
  - `zoomBy(factor, cx, cy)` — porto direto de `zoomBy`, linhas 550-557 (`cx`/`cy` opcionais, default ao centro do `W`/`H`).
  - `resetView()` — porto direto de `resetView`, linha 558.
  - `panBy(dx, dy)` — extraído do corpo do `mousemove` do mockup (linha 580-581: `tx += dx; ty += dy;`) para uma função própria, já que no mockup essa lógica estava inline no listener em vez de numa função do motor.
  - `focusNode(id)` — porto de `focusNode`, linhas 643-650 (a parte da animação de câmara; o realce visual `.found-highlight` fica no `render-graph.js`/`app.js`, não aqui, porque mexe em classes DOM).

**Adaptações obrigatórias em relação ao mockup** (ler `docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html` linhas 157-358 como base e portar quase literalmente, aplicando estas mudanças):

- [ ] **Step 1: Copiar a estrutura base do motor**

Portar as linhas 157-358 do mockup de referência para dentro de uma função-fábrica `createPhysics()`, substituindo `defs`/`weakRefs` (hoje globais no mockup) por parâmetros recebidos em `init()`, e envolvendo tudo num IIFE que expõe `window.Physics`. Manter os nomes de variáveis e a lógica exatamente iguais onde não houver adaptação listada abaixo (repulsão, molas, amortecimento, sono, posicionamento do nó de união sobre a linha dos cônjuges). Adicionalmente, portar também (não fazem parte do intervalo 157-358, mas são necessários para o contrato desta tarefa):
- `zoomBy`/`resetView` (linhas 550-558) e `animateCameraTo`/`fitView`/`everythingInView` (linhas 470-522) — como métodos do objeto devolvido.
- A lógica de `panBy(dx, dy)`: `tx += dx; ty += dy;` (extraída do corpo do listener `mousemove`, linha 580-581, que no mockup estava inline em vez de numa função própria do motor).
- `focusNode(id)` (linhas 643-650) — só a parte que anima a câmara (`animateCameraTo(targetScale, targetTx, targetTy, 600)`); a linha 651-655 (realce `.found-highlight`) fica de fora, é responsabilidade do `render-graph.js`/`app.js`.
- `getEdges()` (equivalente a `allEdges()`, linhas 226-230) e `getWeakEdgesVisible()` (novo, filtra o `weakRefs` recebido em `init()` por `sim.has(w.a) && sim.has(w.b)`).

- [ ] **Step 2: Adaptação — cônjuge sem alvo direto tem de aparecer**

No mockup, `toggleExpand` só chama `addNode` para os ids em `defs[id].reveals` — mas como a Task 2 já garante que todo o nó de união revela **os dois cônjuges** (não só os filhos, ver `js/reveal-graph.js` Passo 1: `defs[unionId].reveals.push(a, b)`), este passo já fica resolvido pela forma dos dados, sem precisar de lógica especial em `toggleExpand`. **Confirmar isto explicitamente**: escrever um teste manual (`node -e`) que verifica que, depois de `build()`, todo `defs[unionId].reveals` inclui os dois ids de `defs[unionId].spouses` — se não incluir, é uma regressão na Task 2, não algo para contornar aqui.

- [ ] **Step 3: Adaptação — capítulo aberto não encolhe, mas o círculo desaparece (ver Task 4)**

`targetRadiusFor` (mockup linhas 194-198) mantém-se igual — o capítulo aberto continua a calcular o raio "normal". A remoção visual do círculo/brilho quando `n.expanded` é `true` fica inteiramente a cargo do `render-graph.js` (Task 4), não deste módulo — `physics.js` só fornece a posição e o raio, nunca decide o que se desenha.

- [ ] **Step 4: Adaptação — repulsão reforçada + âncora mais forte para capítulos na faixa lateral**

Alterar as constantes do `tick()` (mockup linha 290):
```js
const REPEL = 3200; // era 2200 — mais forte, para reduzir sobreposição de linhas/retratos
const SPRING_K = 0.012; // sem alteração
const DAMP = 0.6; // sem alteração
const ERA_ANCHOR_K = 0.05; // sem alteração — usada para o "palco principal" do capítulo aberto
const SIDE_ANCHOR_K = 0.22; // nova constante — só para capítulos encolhidos na faixa lateral
```
No corpo do `forEach` que aplica a âncora (mockup linha 315-319), usar `SIDE_ANCHOR_K` em vez de `ERA_ANCHOR_K` especificamente quando o nó é um capítulo fechado enquanto outro está aberto (i.e., quando `effectiveHome` devolve a posição da faixa lateral, não a posição normal nem a posição de "palco"):
```js
nodes.forEach(n => {
  const home = effectiveHome(n.id);
  if (home) {
    const d = defs[n.id];
    const inSideStrip = d.kind === 'capitulo' && anyCapExpanded() && !n.expanded;
    const k = inSideStrip ? SIDE_ANCHOR_K : ERA_ANCHOR_K;
    n.vx += (home[0] - n.x) * k; n.vy += (home[1] - n.y) * k;
  }
  ...
});
```

- [ ] **Step 5: Verificação de sintaxe**

```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node --check js/physics.js
```
Expected: sem output.

- [ ] **Step 6: Commit**

```bash
git add js/physics.js
git commit -m "feat: port physics simulation engine from brainstorm mockup"
```

---

### Task 4: `js/render-graph.js` (porto do motor de desenho)

**Files:**
- Create: `js/render-graph.js`

**Interfaces:**
- Consumes: `window.Physics` (Task 3) para ler o estado (`getNode`, `getAllNodes`, `getEdges`, `getWeakEdgesVisible`), `defs` (Task 2) para saber `kind`/`nome`/`retrato`/`rel`.
- Produces:
  - `window.RenderGraph.draw(svgWorldEl, edgeLayerEl, nodeLayerEl, defs, physics, callbacks)` onde `callbacks = { onNodeClick(id), onNodeHover(id), onNodeUnhover() }`. Chamado a **cada frame** (dentro do `onFrame` do `Physics.tick`, Task 3, e também diretamente depois de zoom/pan) — só reconstrói os nós DOM quando necessário (ver `markDirty` abaixo); nos outros frames só atualiza posições/transformações.
  - `window.RenderGraph.markDirty()` — equivalente a `render()` no mockup (linhas 368-370): só marca uma flag interna `needsFullRender = true`; **não desenha nada sozinho**. Quem chama isto tem sempre de garantir que `draw()` corre a seguir (na prática, via `Physics.wake()`, que reativa o ciclo de `tick()` → `onFrame` → `draw()` no frame seguinte). Sem esta separação, chamar `draw()` diretamente a cada frame reconstruiria todos os nós DOM 60×/segundo — a flag é o que faz o mockup (e este porto) só reconstruir quando a estrutura de nós visíveis realmente muda (abrir/fechar uma personagem), não em cada frame de física.

- [ ] **Step 1: Portar `draw()`/`starShape()`/criação de nós**

Portar as linhas 360-450 do mockup de referência quase literalmente (função `draw()`, `starShape()`, `radiusFor()`, criação dos elementos `<g class="node ...">` com halo/star/nome/badge, e a flag `needsFullRender`/função `render()` — linhas 364, 368-370 — renomeada para `markDirty()` no contrato exposto por `window.RenderGraph`), com estas três mudanças:

1. **Caminho do retrato:** o mockup usa `<image href="../../${d.retrato}" ...>` (linha 384) porque está dentro de `.superpowers/brainstorm/`; no site real, usar `d.retrato` diretamente (sem prefixo), tal como `js/render-cluster.js` já faz hoje.
2. **Eventos delegados via `callbacks`, não chamados diretamente:** o mockup liga `g.addEventListener('click', () => toggleExpand(n.id))` e usa `mouseenter`/`mousemove`/`mouseleave` para uma tooltip flutuante própria (`showTooltip`/`moveTooltip`/`hideTooltip`/`positionTooltip`, linhas 524-546 — **não portar estas quatro funções**, ficam substituídas pela caixa fixa no painel, já da responsabilidade do `app.js`). Em vez disso: `g.addEventListener('click', () => callbacks.onNodeClick(n.id))`; e, só para `n.kind !== 'uniao' && n.kind !== 'capitulo'` (mesma condição do mockup, linha 412): `g.addEventListener('mouseenter', () => callbacks.onNodeHover(n.id))` e `g.addEventListener('mouseleave', () => callbacks.onNodeUnhover())` (sem `mousemove` — já não há tooltip a seguir o cursor).
3. **Capítulo aberto perde o círculo:** dentro do `sim.forEach` que atualiza atributos a cada frame (mockup linhas 422-434), acrescentar, logo a seguir a `g.classList.toggle('side', ...)`:
   ```js
   const isOpenChapter = defs[n.id].kind === 'capitulo' && n.expanded;
   g.classList.toggle('chapter-opened', isOpenChapter);
   ```
   E em `style.css` (Task 5), a classe `.node.capitulo.chapter-opened .star`, `.node.capitulo.chapter-opened .halo`, `.node.capitulo.chapter-opened .badge-bg`, `.node.capitulo.chapter-opened .badge` ficam todas com `display: none` — só o `text.name` continua visível. Isto substitui o comportamento do mockup original (que mantém sempre o círculo do capítulo aberto, `targetRadiusFor` linha 194-198) pelo pedido da Isabel (bola desaparece, só o título fica).

- [ ] **Step 2: Portar o desenho de ligações (`cline`) e ligações fracas**

Portar as linhas 437-441 do mockup (construção do `edgeSvg` a partir de `allEdges()`) chamando `physics.getEdges()` (Task 3) em vez de `allEdges()` diretamente. Portar as linhas 444-448 (desenho das ligações fracas) chamando `physics.getWeakEdgesVisible()` (Task 3) em vez de percorrer `weakRefs` diretamente — a filtragem por visibilidade já vem feita.

- [ ] **Step 3: Portar as estrelas de fundo decorativas**

Portar as linhas 452-459 do mockup (`bgLayer`, 140 pontos aleatórios) sem alterações.

- [ ] **Step 4: Verificação de sintaxe**

```bash
node --check js/render-graph.js
```
Expected: sem output.

- [ ] **Step 5: Commit**

```bash
git add js/render-graph.js
git commit -m "feat: port graph rendering engine from brainstorm mockup, chapter node loses its circle when opened"
```

---

### Task 5: `index.html` e `style.css` (tema escuro/estrelado)

**Files:**
- Modify: `index.html` (reescrita completa do corpo)
- Modify: `style.css` (reescrita completa)

**Interfaces:**
- Produces: elementos `#stage` (svg), `#bgLayer`/`#edgeLayer`/`#nodeLayer` (grupos dentro do svg, dentro de um grupo `#world` para o pan/zoom), `#searchBox`/`#searchResults`, controlos de zoom (`#zoomIn`/`#zoomOut`/`#zoomReset`/`#collapseAllBtn`), e o painel de detalhe fixo à direita (reaproveita `aside#panel`/`#panelBody`/`#panelClose` já existentes, sem mudar os seus ids). Consumidos pela Task 6 (`app.js`).

- [ ] **Step 1: Reescrever `index.html`**

Estrutura (adaptada das linhas 93-141 do mockup de referência, mais o painel de detalhe já existente):

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
  <div class="topbar">
    <div>
      <span class="eyebrow">Génesis a Malaquias</span>
      <h1>Os Personagens da Bíblia</h1>
    </div>
    <div class="search-wrap">
      <input id="searchBox" class="search-box" type="text" placeholder="Procura uma personagem (ex: David, Rute, Isaías)..." autocomplete="off" aria-label="Procurar personagem">
      <div id="searchResults" class="search-results" hidden></div>
    </div>
    <p class="hint">Clica num capítulo para o abrir. Passa o rato por cima de uma personagem para uma prévia; clica para a história completa.</p>
  </div>

  <div class="stage-row">
    <div class="stage-wrap">
      <svg id="stage" viewBox="0 0 1400 900">
        <defs id="svgDefs">
          <radialGradient id="majorGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#fff8e0"/><stop offset="55%" stop-color="#f0d060"/><stop offset="100%" stop-color="#c9a24a"/></radialGradient>
          <radialGradient id="standardGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#e4e0f8"/><stop offset="55%" stop-color="#9a94d0"/><stop offset="100%" stop-color="#6b64a8"/></radialGradient>
          <radialGradient id="minorGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#c9c6dc"/><stop offset="55%" stop-color="#7d76ad"/><stop offset="100%" stop-color="#524d78"/></radialGradient>
          <radialGradient id="uniaoGrad" cx="35%" cy="30%"><stop offset="0%" stop-color="#ffe0ec"/><stop offset="55%" stop-color="#e8608f"/><stop offset="100%" stop-color="#a83a63"/></radialGradient>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g id="bgLayer"></g>
        <g id="world">
          <g id="edgeLayer"></g>
          <g id="nodeLayer"></g>
        </g>
      </svg>
      <div class="controls">
        <button id="zoomIn" type="button" aria-label="Ampliar">+</button>
        <button id="zoomOut" type="button" aria-label="Reduzir">&minus;</button>
        <button id="zoomReset" type="button" aria-label="Repor vista">&#8634;</button>
        <button id="collapseAllBtn" type="button" aria-label="Fechar tudo">&#10558;</button>
      </div>
    </div>

    <aside id="panel">
      <button class="panel-close" id="panelClose" type="button">Fechar &times;</button>
      <div id="panelBody">
        <p class="panel-empty">Passa o rato por uma personagem para uma prévia, ou clica para conheceres a sua história completa.</p>
      </div>
    </aside>
  </div>

  <footer class="note">Os Personagens da Bíblia — Paróquia da Póvoa de Santa Iria.</footer>
</div>
<script src="js/reveal-graph.js"></script>
<script src="js/physics.js"></script>
<script src="js/render-graph.js"></script>
<script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Reescrever `style.css`**

Base: paleta e tipografia do CSS do mockup de referência (linhas 6-91), adaptada a esta estrutura:

```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #0d1024; color: #e8e4d8; font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; overflow: hidden; height: 100%; }

.app { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

.topbar { padding: 16px 20px 8px; z-index: 10; }

.stage-row { position: relative; flex: 1; display: flex; min-height: 0; }
.topbar .eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #d8c98a; display: block; margin-bottom: 2px; }
.topbar h1 { font-size: 19px; margin: 0 0 4px; color: #f0e6d2; font-weight: 400; }
.hint { font-size: 11.5px; color: #6b6591; margin: 4px 0 0; }

.search-wrap { position: relative; width: 420px; max-width: 90vw; margin: 6px 0; }
.search-box { width: 100%; padding: 12px 18px; border-radius: 999px; border: 2px solid #4a4580; background: #161933; color: #f0e6d2; font-family: Georgia, serif; font-size: 15px; outline: none; }
.search-box:focus { border-color: #d8c98a; }
.search-box::placeholder { color: #6b6591; }
.search-results { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #161933; border: 1px solid #4a4580; border-radius: 12px; overflow: hidden; z-index: 15; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
.search-result { padding: 10px 18px; cursor: pointer; font-size: 14px; color: #e8e4d8; display: flex; justify-content: space-between; align-items: baseline; }
.search-result:hover { background: #2a2650; }
.search-result .sr-era { font-size: 10.5px; color: #9a94b8; }

.stage-wrap { position: relative; flex: 1; min-width: 0; }
#stage { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
#stage.panning { cursor: grabbing; }
.bgstar { fill: #cfd0f0; }

.cline { stroke: #4a4580; stroke-width: 1.4; fill: none; }
.cline.stem { stroke: #d8a0b8; stroke-width: 1.2; opacity: .8; }
.cline.descent { stroke: #6b64a8; stroke-width: 1.6; }
.cline.spouseDirect { stroke: #d8a0b8; stroke-width: 1.2; stroke-dasharray: 3 4; opacity: .8; }
.cline.weak { stroke: #4a4a6a; stroke-width: 0.8; stroke-dasharray: 1 5; opacity: .55; }

.node { cursor: pointer; }
.node circle.halo { fill: none; stroke: #d8c98a; stroke-width: 1; opacity: 0; }
.node.expandable circle.halo { opacity: .35; }
.node.uniao .halo { stroke: #e8608f; }
.node.capitulo .halo { stroke: #f0d060; stroke-width: 2; }
.node.capitulo .star { fill: url(#majorGrad); }
.node.capitulo text.name { font-size: 14px; font-weight: bold; }
.node.capitulo.side text.name { font-size: 10.5px; }
.node.capitulo.side text.clabel { display: none; }
.node.capitulo.side { opacity: .85; }
.node.capitulo.chapter-opened .star,
.node.capitulo.chapter-opened .halo,
.node.capitulo.chapter-opened .badge-bg,
.node.capitulo.chapter-opened .badge { display: none; }
.node.major .star { fill: url(#majorGrad); }
.node.standard .star { fill: url(#standardGrad); }
.node.minor .star { fill: url(#minorGrad); }
.node.uniao .star { fill: url(#uniaoGrad); }
.node text.name { fill: #f0e6d2; font-size: 11px; text-anchor: middle; paint-order: stroke; stroke: #0d1024; stroke-width: 3; }
.node.minor text.name { font-size: 9.5px; }
.node text.badge { fill: #1a1735; font-size: 9px; text-anchor: middle; font-weight: bold; }
.node circle.badge-bg { fill: #d8c98a; }
.node text.clabel { fill: #9a94b8; font-size: 8.5px; text-anchor: middle; paint-order: stroke; stroke: #0d1024; stroke-width: 3; }

.node-group { transform-box: fill-box; transform-origin: center; }
.pop-in { animation: popIn .35s cubic-bezier(.34,1.56,.64,1); }
@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
.found-highlight .halo { opacity: 1 !important; stroke: #f0d060; stroke-width: 2.5; }

.controls { position: absolute; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
.controls button { width: 38px; height: 38px; border-radius: 50%; border: 1px solid #4a4580; background: #161933; color: #d8c98a; font-size: 17px; cursor: pointer; font-family: Georgia, serif; }
.controls button:hover { background: #2a2650; }
.controls button:focus-visible,
aside button:focus-visible,
.node:focus-visible circle.halo { outline: 2px solid #d8c98a; outline-offset: 2px; }

aside#panel { width: 22rem; flex-shrink: 0; border-left: 1px solid #4a4580; background: #12142a; padding: 1.3rem 1.4rem; overflow-y: auto; color: #e8e4d8; }
.panel-empty { color: #9a94b8; font-size: 0.88rem; margin-top: 2rem; text-align: center; line-height: 1.6; }
.card-era { font-family: Georgia, serif; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: #d8c98a; }
.card-portrait { display: block; width: 128px; height: 128px; border-radius: 50%; object-fit: cover; background: #161933; border: 3px solid #d8c98a; margin: 0 auto 1rem; }
.card-name { font-family: Georgia, serif; font-size: 1.7rem; margin: 0.2rem 0 0.15rem; color: #f0e6d2; }
.card-refs { font-size: 0.78rem; color: #9a94b8; margin: 0 0 1rem; }
.card-summary, .card-contexto, .card-relations { font-size: 0.9rem; line-height: 1.6; color: #e8e4d8; max-width: 36ch; margin: 0 0 1.1rem; }
.card-section-title { font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; color: #9a94b8; margin: 1rem 0 0.4rem; }
.card-section-title:first-of-type { margin-top: 0; }
.card-relations { border-left: 2px solid #4a4580; padding-left: 0.7rem; }
.panel-close { display: none; }
.cross-era-ref { color: #d8c98a; cursor: pointer; text-decoration: underline; text-decoration-style: dotted; }

footer.note { padding: 0.4rem 1.4rem; font-size: 0.68rem; color: #6b6591; }

@media (max-width: 720px) {
  .stage-row { flex-direction: column; }
  .hint { display: none; }
  aside#panel {
    position: fixed; left: 0; right: 0; bottom: 0; width: auto; max-height: 62dvh;
    border-left: none; border-top: 1px solid #4a4580; border-radius: 10px 10px 0 0;
    transform: translateY(100%); transition: transform 0.3s ease;
    box-shadow: 0 -8px 24px rgba(0,0,0,.5); z-index: 20;
  }
  aside#panel.open { transform: translateY(0); }
  .panel-close { display: block; margin: -0.4rem 0 0.6rem auto; background: none; border: none; color: #9a94b8; font-size: 0.8rem; cursor: pointer; }
  footer.note { display: none; }
}
```

Nota: `.app` é `display:flex; flex-direction:column` (empilha `.topbar` em cima de `.stage-row` em cima de `footer.note`); `.stage-row` é `display:flex; flex-direction:row` por defeito (empilha `.stage-wrap` e `aside#panel` lado a lado), passando a `flex-direction:column` só dentro do `@media (max-width:720px)` — o mesmo padrão já usado em `index.html` desde a Ronda 7 (`.stage` continha `.graph-wrap` + `aside#panel` como irmãos).

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat: dark starfield theme, single-stage graph layout"
```

---

### Task 6: `app.js` (orquestrador)

**Files:**
- Modify: `app.js` (reescrita completa)
- Delete: `js/render-era-strip.js`, `js/render-cluster.js`, `js/layout.js`, `scripts/test-layout.js`

**Interfaces:**
- Consumes: `RevealGraph.build` (Task 2), `Physics` (Task 3), `RenderGraph.draw` (Task 4), elementos DOM da Task 5.
- Produces: comportamento final da aplicação — nenhuma outra tarefa depende disto.

- [ ] **Step 1: Escrever `app.js`**

```js
(function () {
  fetch("data/personagens.json")
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      document.getElementById("panelBody").innerHTML =
        '<p class="panel-empty">Não foi possível carregar os dados (' + err.message + '). Se abriste o ficheiro diretamente no browser, é preciso servir a pasta por http:// — usa a skill run.</p>';
    });

  function normalize(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function init(data) {
    var built = RevealGraph.build(data.personagens, data.edges, data.capitulos);
    var defs = built.defs, weakRefs = built.weakRefs;

    var byId = {};
    data.personagens.forEach(function (p) { byId[p.id] = p; });

    var W = 1400, H = 900, SAFE_TOP = 110;
    Physics.init(defs, weakRefs, W, H, SAFE_TOP);
    Physics.bootstrap();

    var stage = document.getElementById('stage');
    var world = document.getElementById('world');
    var edgeLayer = document.getElementById('edgeLayer');
    var nodeLayer = document.getElementById('nodeLayer');
    var bgLayer = document.getElementById('bgLayer');
    var panel = document.getElementById('panel');
    var panelBody = document.getElementById('panelBody');
    var panelEmptyHtml = panelBody.innerHTML;

    // Fundo decorativo de estrelas (estático, fora do transform de pan/zoom).
    var bgSvg = '';
    for (var i = 0; i < 140; i++) {
      var bx = Math.random() * W, by = Math.random() * H, br = Math.random() * 1.3 + 0.3, bo = Math.random() * 0.5 + 0.1;
      bgSvg += '<circle class="bgstar" cx="' + bx + '" cy="' + by + '" r="' + br + '" opacity="' + bo + '"></circle>';
    }
    bgLayer.innerHTML = bgSvg;

    var selectedId = null; // última personagem CLICADA — o painel volta a isto quando o rato sai de um hover

    function requestDraw() {
      RenderGraph.draw(world, edgeLayer, nodeLayer, defs, Physics, {
        onNodeClick: onNodeClick,
        onNodeHover: onNodeHover,
        onNodeUnhover: onNodeUnhover
      });
    }

    function onNodeClick(id) {
      Physics.toggleExpand(id, RenderGraph.markDirty);
      Physics.wake();
      var d = defs[id];
      if (d.kind !== 'uniao' && d.kind !== 'capitulo') {
        selectedId = id;
        renderCardFull(id);
        panel.classList.add('open');
      }
    }
    function onNodeHover(id) {
      var d = defs[id];
      if (d.kind === 'uniao' || d.kind === 'capitulo') return;
      renderCardPreview(id);
      panel.classList.add('open');
    }
    function onNodeUnhover() {
      if (selectedId) { renderCardFull(selectedId); }
      else { panelBody.innerHTML = panelEmptyHtml; panel.classList.remove('open'); }
    }

    function renderCardPreview(id) {
      var d = defs[id];
      panelBody.innerHTML =
        '<p class="card-era">' + d.era + '</p>' +
        '<h2 class="card-name">' + d.nome + '</h2>' +
        (d.rel ? '<p class="card-refs">' + d.rel + '</p>' : '');
    }

    function crossEraRefsHtml(n, id) {
      var refs = [];
      data.edges.forEach(function (e) {
        if (e[0] !== id && e[1] !== id) return;
        var otherId = e[0] === id ? e[1] : e[0];
        var other = byId[otherId];
        if (!other || other.era === n.era) return;
        var typeLabel = { parent: 'Família', spouse: 'Casamento', sibling: 'Irmão/irmã', descendant: e[3] || 'Descendência', affinity: e[3] || 'Parentesco' }[e[2]] || e[2];
        refs.push('<span class="cross-era-ref" data-goto-id="' + escapeAttr(otherId) + '" tabindex="0" role="button" aria-label="Ir para ' + escapeAttr(other.nome) + '">' + other.nome + ' (' + typeLabel + ' · ' + other.era + ')</span>');
      });
      return refs.length ? '<p class="card-section-title">Ligações noutras eras</p><p>' + refs.join(', ') + '</p>' : '';
    }

    function renderCardFull(id) {
      var n = defs[id];
      var portraitHtml = n.retrato
        ? '<img class="card-portrait" src="' + n.retrato + '" alt="Retrato de ' + n.nome + '">'
        : '';
      panelBody.innerHTML =
        portraitHtml +
        '<p class="card-era">' + n.era + '</p>' +
        '<h2 class="card-name">' + n.nome + '</h2>' +
        '<p class="card-refs">' + n.refs + '</p>' +
        '<p class="card-summary">' + n.resumo + '</p>' +
        '<p class="card-section-title">Contexto histórico</p>' +
        '<p class="card-contexto">' + n.contexto + '</p>' +
        '<p class="card-section-title">Família</p>' +
        '<p class="card-relations">' + (n.rel || '') + '</p>' +
        crossEraRefsHtml(n, id);

      panelBody.querySelectorAll('.cross-era-ref').forEach(function (span) {
        span.addEventListener('click', function () { revealAndSelect(span.getAttribute('data-goto-id')); });
        span.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); revealAndSelect(span.getAttribute('data-goto-id')); }
        });
      });
    }

    function closePanel() {
      panel.classList.remove('open');
    }
    document.getElementById('panelClose').addEventListener('click', function () {
      closePanel();
      panelBody.innerHTML = panelEmptyHtml;
      selectedId = null;
    });

    // --- revelar por id (partilhado pela pesquisa e pelas ligações noutras eras) ---
    var revealedBy = {};
    Object.keys(defs).forEach(function (id) {
      (defs[id].reveals || []).forEach(function (cid) { revealedBy[cid] = id; });
    });
    function pathToRoot(id) {
      var path = []; var cur = id;
      while (revealedBy[cur]) { path.unshift(revealedBy[cur]); cur = revealedBy[cur]; }
      return path;
    }
    function revealAndSelect(id) {
      var path = pathToRoot(id);
      path.forEach(function (pid) {
        var n = Physics.getNode(pid);
        if (n && !n.expanded) Physics.toggleExpand(pid, RenderGraph.markDirty);
      });
      Physics.wake();
      setTimeout(function () {
        selectedId = id;
        renderCardFull(id);
        panel.classList.add('open');
        Physics.focusNode(id);
      }, 700);
    }

    // --- pesquisa ---
    var searchBox = document.getElementById('searchBox');
    var searchResults = document.getElementById('searchResults');
    var searchablePeople = Object.keys(defs).filter(function (id) {
      return ['major', 'standard', 'minor'].indexOf(defs[id].kind) !== -1;
    });
    searchBox.addEventListener('input', function () {
      var q = normalize(searchBox.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      var matches = searchablePeople.filter(function (id) { return normalize(defs[id].nome).indexOf(q) !== -1; }).slice(0, 8);
      if (!matches.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = matches.map(function (id) {
        return '<div class="search-result" data-id="' + escapeAttr(id) + '" tabindex="0" role="button" aria-label="' + escapeAttr(defs[id].nome) + '">' + defs[id].nome + '<span class="sr-era">' + defs[id].era + '</span></div>';
      }).join('');
      searchResults.hidden = false;
    });
    searchResults.addEventListener('click', function (ev) {
      var row = ev.target.closest('.search-result');
      if (!row) return;
      searchResults.hidden = true;
      searchBox.value = defs[row.getAttribute('data-id')].nome;
      revealAndSelect(row.getAttribute('data-id'));
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search-wrap')) { searchResults.hidden = true; }
    });

    // --- controlos de zoom/reset/fechar tudo ---
    document.getElementById('zoomIn').addEventListener('click', function () { Physics.zoomBy(1.25); requestDraw(); });
    document.getElementById('zoomOut').addEventListener('click', function () { Physics.zoomBy(0.8); requestDraw(); });
    document.getElementById('zoomReset').addEventListener('click', function () { Physics.resetView(); requestDraw(); });
    document.getElementById('collapseAllBtn').addEventListener('click', function () {
      Physics.collapseAll(RenderGraph.markDirty);
      Physics.wake();
      Physics.resetView();
      requestDraw();
      selectedId = null;
      panelBody.innerHTML = panelEmptyHtml;
      closePanel();
    });

    // --- pan/zoom/toque (porto direto do mockup, ver
    //     docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html:548-621) ---
    stage.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var rect = stage.getBoundingClientRect();
      var px = (ev.clientX - rect.left) * (W / rect.width);
      var py = (ev.clientY - rect.top) * (H / rect.height);
      Physics.zoomBy(ev.deltaY < 0 ? 1.12 : 0.89, px, py);
      requestDraw();
    }, { passive: false });

    var panning = false, lastX = 0, lastY = 0;
    stage.addEventListener('mousedown', function (ev) {
      if (ev.target.closest('.node')) return;
      panning = true; lastX = ev.clientX; lastY = ev.clientY;
      stage.classList.add('panning');
    });
    window.addEventListener('mousemove', function (ev) {
      if (!panning) return;
      var rect = stage.getBoundingClientRect();
      Physics.panBy((ev.clientX - lastX) * (W / rect.width), (ev.clientY - lastY) * (H / rect.height));
      lastX = ev.clientX; lastY = ev.clientY;
      requestDraw();
    });
    window.addEventListener('mouseup', function () { panning = false; stage.classList.remove('panning'); });

    // --- ciclo de física + desenho ---
    Physics.tick(requestDraw);
    requestDraw();
  }
})();
```

**Nota importante para o implementador:** o código acima assume uma forma de API do `Physics` (`init(defs, weakRefs, W, H, SAFE_TOP)`, `getNode`, `zoomBy`, `resetView`, `panBy`, `focusNode`, `collapseAll(cb)`, `toggleExpand(id, cb)`, `tick(onFrame)`) — ao implementar a Task 3, garantir que a assinatura final bate certo com este ficheiro (ou ajustar `app.js` para bater com a assinatura real escolhida na Task 3, documentando a mudança no relatório desta tarefa). Como as Tasks 3 e 4 são implementadas antes desta, o implementador desta tarefa deve **ler o `js/physics.js` e `js/render-graph.js` reais** antes de colar este código, e ajustar nomes de função conforme necessário — este bloco é o contrato pretendido, não uma garantia de que os nomes exatos sobrevivem sem ajuste.

- [ ] **Step 2: Remover os ficheiros obsoletos**

```bash
git rm js/render-era-strip.js js/render-cluster.js js/layout.js scripts/test-layout.js
```

- [ ] **Step 3: Verificação de sintaxe**

```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node --check app.js
```
Expected: sem output.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: wire physics-based graph engine into orchestrator, remove obsolete era-strip/cluster/layout modules"
```

---

### Task 7: Verificação num browser real + regressão

**Files:** nenhum ficheiro modificado nesta tarefa por defeito; corrigir inline qualquer problema encontrado nos ficheiros das Tasks 1-6 se necessário.

- [ ] **Step 1: Correr os testes de `js/reveal-graph.js`**

```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node scripts/test-reveal-graph.js
```
Expected: `ALL PASS`.

- [ ] **Step 2: Servir o site localmente e abrir num Chrome headless com CDP**

Mesma abordagem já usada nas rondas anteriores (servidor estático Node + Chrome `--headless=new --remote-debugging-port=<porta>` + `Input.dispatchMouseEvent` real via WebSocket, nunca `dispatchEvent` sintético).

- [ ] **Step 3: Verificar, com capturas de ecrã em cada passo**

1. **Estado inicial:** os 7 capítulos aparecem com física entre eles (repulsão visível se se sobrepuserem ao início), fundo escuro estrelado.
2. **Abrir um capítulo:** clicar em "Os Patriarcas" — confirmar que a bola desse capítulo desaparece (só o texto "Os Patriarcas" fica visível) e que o Abraão aparece ligado a essa posição.
3. **Capítulos não abertos:** confirmar visualmente que os restantes 6 capítulos ficam claramente mais à esquerda do que na Ronda anterior (comparar com `docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html` aberto em paralelo, ou com a captura `mockup-A-expanded.png` feita durante o brainstorming) — não é preciso serem idênticos, só visivelmente mais afastados da área de exploração.
4. **Cluster denso:** abrir "Os Reis" (13 personagens) e avaliar visualmente o nível de sobreposição de linhas/texto/retratos — deve estar visivelmente melhor do que sem a Task 3 Step 4 (repulsão/âncora reforçadas), mesmo que não seja perfeito.
5. **Hover:** passar o rato por uma personagem (não um capítulo, não uma união) e confirmar que a caixa fixa à direita mostra a prévia (nome, era, relação) — não uma tooltip a seguir o cursor.
6. **Clique:** clicar na mesma personagem e confirmar que a caixa passa a mostrar o conteúdo completo (retrato, resumo, contexto histórico, família, referências).
7. **Voltar a passar o rato por cima de outra personagem, depois tirar o rato:** confirmar que o painel volta ao conteúdo completo da personagem clicada antes (não fica preso na prévia da última passagem do rato).
8. **Nunca sair do ecrã:** expandir várias personagens seguidas (ex: toda a genealogia de Jacob) e confirmar que a câmara ajusta zoom/pan sozinha para manter tudo visível, sem nada cortado fora da área do SVG.
9. **Pesquisa:** procurar por um nome de uma personagem ainda não revelada (ex: "Ester" não existe ainda — usar "Ezequiel" ou outro nome do fim da árvore) e confirmar que abre o caminho todo até lá e destaca a personagem encontrada.
10. **Fechar tudo:** clicar no botão de colapsar tudo e confirmar que volta ao estado inicial (só os 7 capítulos).
11. **Viewport mobile:** redimensionar para ≤720px e confirmar que o painel de detalhe continua a funcionar como bottom sheet.

- [ ] **Step 4: Corrigir inline qualquer problema encontrado, priorizando pelos pedidos explícitos da Isabel**

Se algo falhar, corrigir o ficheiro relevante e repetir a verificação a partir do ponto que falhou. Prioridade especial aos pontos 2, 3, 5, 6, 7 (pedidos explícitos desta ronda) sobre afinações de física mais subjetivas (ponto 4).

- [ ] **Step 5: Parar os processos de apoio (Chrome/Node) por PID específico, nunca `taskkill /IM chrome.exe` genérico**

- [ ] **Step 6: Commit (só se o Step 4 tiver alterado algum ficheiro)**

```bash
git add -A
git commit -m "fix: address issues found in real-browser verification of physics graph"
```
