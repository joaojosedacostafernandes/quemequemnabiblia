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

// --- Caso 7: dois progenitores conhecidos sem aresta "spouse" formal
// (ex: Agar, concubina de Abraão) devem gerar uma união implícita, e ambos
// os progenitores devem conseguir alcançá-la simetricamente ---
(function () {
  const personagens = [personagem('abraao'), personagem('agar'), personagem('ismael')];
  const edges = [
    ['abraao', 'ismael', 'parent'],
    ['agar', 'ismael', 'parent'],
  ];
  const { defs } = build(personagens, edges, []);
  const uniaoIds = Object.keys(defs).filter(id => defs[id].kind === 'uniao');
  assert.strictEqual(uniaoIds.length, 1, 'devia sintetizar exatamente 1 união implícita, mesmo sem aresta spouse formal');
  const uniaoId = uniaoIds[0];
  assert.deepStrictEqual(defs[uniaoId].spouses.slice().sort(), ['abraao', 'agar'], 'a união implícita devia listar os dois progenitores');
  assert.ok(defs['abraao'].reveals.includes(uniaoId), 'abraão devia revelar a união implícita');
  assert.ok(defs['agar'].reveals.includes(uniaoId), 'agar também devia revelar a união implícita — sem isto, ficaria inalcançável (bug real encontrado nos dados reais)');
  assert.ok(defs[uniaoId].reveals.includes('ismael'), 'a união implícita devia revelar o filho');
  console.log('ok: dois progenitores sem spouse formal geram união implícita simétrica (caso Agar)');
})();

console.log('\nALL PASS');
