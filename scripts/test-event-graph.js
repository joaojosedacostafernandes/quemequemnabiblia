const assert = require('assert');
// js/event-graph.js expõe-se em `window` no browser; em Node, carregamo-lo
// manualmente para o testar isoladamente (sem depender de nenhum DOM real —
// `deriveFamily` e `layoutEvent` são puras, não tocam em nada visual).
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(path.join(__dirname, '../js/event-graph.js'), 'utf8');
const sandbox = {};
new Function('window', 'module', src)(sandbox, undefined);
const EventGraph = sandbox.EventGraph;

// --- Caso 1: união formal entre cônjuges, filhos ligam-se à união ---
(function () {
  const edges = [['adao', 'eva', 'spouse'], ['adao', 'caim', 'parent'], ['eva', 'caim', 'parent'], ['caim', 'abel', 'sibling']];
  const family = EventGraph.deriveFamily(['adao', 'eva', 'caim', 'abel'], edges);
  assert.strictEqual(family.casais.length, 1, 'devia sintetizar 1 união');
  assert.deepStrictEqual(family.casais[0].slice().sort(), ['adao', 'eva']);
  assert.strictEqual(family.filhos.length, 1, 'abel não tem progenitores nas arestas, só caim');
  assert.deepStrictEqual(family.filhos[0].pais.slice().sort(), ['adao', 'eva']);
  console.log('ok: união formal, filho ligado à união');
})();

// --- Caso 2: dois progenitores conhecidos sem aresta "spouse" formal
// sintetizam uma união implícita (caso Agar) ---
(function () {
  const edges = [['abraao', 'ismael', 'parent'], ['agar', 'ismael', 'parent']];
  const family = EventGraph.deriveFamily(['abraao', 'agar', 'ismael'], edges);
  assert.strictEqual(family.casais.length, 1, 'devia sintetizar união implícita mesmo sem aresta spouse');
  assert.strictEqual(family.filhos.length, 1);
  console.log('ok: união implícita sem aresta spouse formal (caso Agar)');
})();

// --- Caso 3: progenitor único conhecido dentro do acontecimento — linha
// direta, sem união ---
(function () {
  const edges = [['jacob', 'jose', 'parent'], ['jose', 'efraim', 'parent']];
  const family = EventGraph.deriveFamily(['jacob', 'jose', 'efraim'], edges);
  assert.strictEqual(family.casais.length, 0, 'só um progenitor conhecido em cada caso — sem união');
  assert.strictEqual(family.filhos.length, 2);
  assert.deepStrictEqual(family.filhos.find(f => f.filho === 'jose').pais, ['jacob']);
  console.log('ok: progenitor único revela diretamente, sem união');
})();

// --- Caso 4: um progenitor com dois cônjuges no mesmo acontecimento gera
// duas uniões distintas (caso Abraão/Sara/Agar; Saul/David com Mical e
// Abigail) ---
(function () {
  const edges = [
    ['abraao', 'sara', 'spouse'], ['abraao', 'agar', 'spouse'],
    ['abraao', 'sara', 'parent'], ['sara', 'isaac', 'parent'],
    ['agar', 'ismael', 'parent']
  ];
  // nota: a aresta "abraao","sara","parent" acima é só ruído de teste — o
  // que importa é isaac ter [abraao? não] — corrige-se abaixo
  const edges2 = [
    ['abraao', 'sara', 'spouse'], ['abraao', 'agar', 'spouse'],
    ['abraao', 'isaac', 'parent'], ['sara', 'isaac', 'parent'],
    ['abraao', 'ismael', 'parent'], ['agar', 'ismael', 'parent']
  ];
  const family = EventGraph.deriveFamily(['abraao', 'sara', 'agar', 'isaac', 'ismael'], edges2);
  assert.strictEqual(family.casais.length, 2, 'Abraão tem duas uniões distintas neste acontecimento');
  console.log('ok: um progenitor com dois cônjuges gera duas uniões distintas');
})();

// --- Caso 5: sibling/descendant/affinity tornam-se linhas fracas com a
// etiqueta real da aresta, nunca com um "irmão/irmã" genérico quando há
// etiqueta própria ---
(function () {
  const edges = [['noemi', 'rute', 'affinity', 'sogra e nora'], ['uzias', 'acaz', 'descendant', '2 gerações, via Jotão']];
  const family = EventGraph.deriveFamily(['noemi', 'rute', 'uzias', 'acaz'], edges);
  assert.strictEqual(family.irmaos.length, 2);
  assert.ok(family.irmaos.some(w => w[2] === 'sogra e nora'));
  assert.ok(family.irmaos.some(w => w[2] === '2 gerações, via Jotão'));
  console.log('ok: affinity/descendant mantêm a sua etiqueta real, não um genérico "irmão/irmã"');
})();

// --- Caso 6: arestas fora do acontecimento (ambas ou uma ponta) são
// ignoradas — a família nunca "vaza" para personagens de outro acontecimento ---
(function () {
  const edges = [['joaquim', 'zorobabel', 'descendant', '3 gerações'], ['joaquim', 'sedequias', 'sibling']];
  const family = EventGraph.deriveFamily(['zorobabel', 'esdras'], edges); // joaquim/sedequias não estão aqui
  assert.strictEqual(family.irmaos.length, 0, 'nenhuma das duas arestas tem as duas pontas no acontecimento');
  console.log('ok: arestas com uma ponta fora do acontecimento são ignoradas');
})();

// --- Caso 7: deriveGroups agrupa arestas fracas em componentes ligados,
// excluindo pares que já partilham progenitor no acontecimento ---
(function () {
  // Pedro-André-Tiago ligados por arestas fracas (companheiros) → 1 grupo de 3.
  const family = {
    casais: [], filhos: [],
    irmaos: [['pedro', 'andre', 'apóstolos'], ['andre', 'tiago', 'apóstolos']]
  };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 1, 'devia haver 1 grupo');
  assert.deepStrictEqual(groups[0].ids.slice().sort(), ['andre', 'pedro', 'tiago']);
  assert.strictEqual(groups[0].label, 'apóstolos', 'usa a etiqueta da aresta');
  console.log('ok: deriveGroups une componentes ligados com a etiqueta da aresta');
})();

// --- Caso 8: irmãos que já partilham progenitor no acontecimento NÃO formam
// grupo (a árvore já os põe lado a lado sob o mesmo pai) ---
(function () {
  const family = {
    casais: [['adao', 'eva']],
    filhos: [{ pais: ['adao', 'eva'], filho: 'caim' }, { pais: ['adao', 'eva'], filho: 'abel' }],
    irmaos: [['caim', 'abel', 'irmão/irmã']]
  };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 0, 'caim e abel já partilham pais → sem grupo/chaveta');
  console.log('ok: deriveGroups exclui irmãos que já partilham progenitor no evento');
})();

// --- Caso 9: afinidade sem progenitor comum forma grupo com a sua etiqueta ---
(function () {
  const family = { casais: [], filhos: [], irmaos: [['noemi', 'rute', 'sogra e nora']] };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].label, 'sogra e nora');
  console.log('ok: deriveGroups agrupa afinidade com a etiqueta real');
})();

// --- Caso 11: numa componente com etiquetas diferentes, ganha a etiqueta
// da PRIMEIRA aresta em ordem de entrada ---
(function () {
  const family = { casais: [], filhos: [], irmaos: [['a', 'b', 'primeira'], ['b', 'c', 'segunda']] };
  const groups = EventGraph.deriveGroups(family);
  assert.strictEqual(groups.length, 1);
  assert.deepStrictEqual(groups[0].ids.slice().sort(), ['a', 'b', 'c']);
  assert.strictEqual(groups[0].label, 'primeira', 'a etiqueta da primeira aresta da componente ganha');
  console.log('ok: deriveGroups usa a etiqueta da primeira aresta em ordem de entrada');
})();

// --- Caso 10: membros de um grupo fraco ficam em slots consecutivos ---
(function () {
  const ids = ['pedro', 'x', 'andre', 'tiago']; // x é ruído no meio da ordem
  const edges = [['pedro', 'andre', 'sibling', 'apóstolos'], ['andre', 'tiago', 'sibling', 'apóstolos']];
  const family = EventGraph.deriveFamily(ids, edges);
  const layout = EventGraph.layoutEvent(ids, family);
  const groupSlots = ['pedro', 'andre', 'tiago'].map(function (id) { return layout.slot[id]; }).sort(function (a, b) { return a - b; });
  assert.strictEqual(groupSlots[2] - groupSlots[0], 2, 'os 3 membros do grupo ocupam 3 slots contíguos');
  console.log('ok: layoutEvent mantém os membros de um grupo fraco consecutivos');
})();

console.log('\nALL PASS');
