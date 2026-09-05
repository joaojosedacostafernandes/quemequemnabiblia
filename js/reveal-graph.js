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
