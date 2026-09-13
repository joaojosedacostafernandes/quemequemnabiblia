(function () {
  // Motor de desenho do interior de um acontecimento — substitui por completo
  // o par reveal-graph.js/physics.js da Ronda 11/12. Duas responsabilidades:
  //
  // 1. `deriveFamily(ids, edges)` — deriva casais/filhos/irmãos SÓ a partir
  //    das arestas reais (`edges`) filtradas ao conjunto de personagens do
  //    acontecimento. Nunca há dados de família duplicados a manter
  //    sincronizados; nunca há revelação progressiva, por isso o ciclo
  //    união↔cônjuge que causou 4 bugs reais nas Rondas 11-12 deixa de poder
  //    existir — não há aqui nenhum grafo de "reveals" para percorrer.
  //
  // 2. Layout genealógico determinístico por gerações (BFS a partir de quem
  //    não é filho de ninguém dentro do acontecimento) — testado no
  //    protótipo com casos difíceis (14 personagens numa só fila; três
  //    uniões a partilhar a mesma pessoa) sem sobreposições de linhas.

  function deriveFamily(ids, edges) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    var parentsOf = {};
    var spouseEdges = [];
    var weakEdges = [];
    edges.forEach(function (e) {
      var a = e[0], b = e[1], type = e[2], label = e[3];
      if (!idSet[a] || !idSet[b]) return;
      if (type === 'parent') (parentsOf[b] = parentsOf[b] || []).push(a);
      else if (type === 'spouse') spouseEdges.push([a, b]);
      else if (type === 'sibling' || type === 'descendant' || type === 'affinity') {
        weakEdges.push([a, b, label || (type === 'sibling' ? 'irmão/irmã' : type)]);
      }
    });
    function unionKey(a, b) { return [a, b].sort().join('|'); }
    var casaisMap = {};
    spouseEdges.forEach(function (p) { casaisMap[unionKey(p[0], p[1])] = p; });
    var filhos = [];
    Object.keys(parentsOf).forEach(function (childId) {
      var parents = parentsOf[childId].filter(function (v, i, arr) { return arr.indexOf(v) === i; });
      if (parents.length >= 2) {
        // Dois progenitores conhecidos sem aresta "spouse" formal (ex: Agar)
        // sintetizam uma união implícita — mesma ideia do antigo
        // reveal-graph.js, agora só para desenhar, nunca para revelar.
        var key = unionKey(parents[0], parents[1]);
        if (!casaisMap[key]) casaisMap[key] = [parents[0], parents[1]];
        filhos.push({ pais: casaisMap[key], filho: childId });
      } else if (parents.length === 1) {
        filhos.push({ pais: parents, filho: childId });
      }
    });
    var casais = Object.keys(casaisMap).map(function (k) { return casaisMap[k]; });
    return { casais: casais, filhos: filhos, irmaos: weakEdges };
  }

  // Transforma as arestas fracas (irmãos sem pai no evento, afinidade,
  // companheiros) em grupos rotulados. Exclui pares que já partilham
  // progenitor dentro do acontecimento — esses já ficam lado a lado sob o
  // mesmo pai na árvore, não precisam de chaveta. Cada grupo é um componente
  // ligado (≥2 membros); a etiqueta é a da primeira aresta do componente.
  function deriveGroups(family) {
    var parentKey = {};
    family.filhos.forEach(function (f) {
      parentKey[f.filho] = f.pais.slice().sort().join('|');
    });
    var adj = {};
    var labelOf = {};
    var order = [];
    family.irmaos.forEach(function (w) {
      var a = w[0], b = w[1], label = w[2];
      if (parentKey[a] && parentKey[b] && parentKey[a] === parentKey[b]) return;
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
      var key = [a, b].sort().join('|');
      if (labelOf[key] === undefined) { labelOf[key] = label; order.push(key); }
    });
    var seen = {}, groups = [];
    Object.keys(adj).forEach(function (start) {
      if (seen[start]) return;
      var stack = [start], comp = [];
      while (stack.length) {
        var n = stack.pop();
        if (seen[n]) continue;
        seen[n] = true; comp.push(n);
        (adj[n] || []).forEach(function (m) { if (!seen[m]) stack.push(m); });
      }
      if (comp.length < 2) return;
      var inComp = {}; comp.forEach(function (id) { inComp[id] = true; });
      var label = null;
      for (var i = 0; i < order.length; i++) {
        var pts = order[i].split('|');
        if (inComp[pts[0]] && inComp[pts[1]]) { label = labelOf[order[i]]; break; }
      }
      groups.push({ ids: comp, label: label });
    });
    return groups;
  }

  // Layout em árvore genealógica "normal":
  //  - cônjuges partilham o mesmo nível e ficam LADO A LADO (cadeia de
  //    casamentos), por isso a linha de casamento é sempre curta;
  //  - os membros de uma chaveta fraca (irmãos sem pai, afinidade,
  //    companheiros) ficam contíguos — encadeia-se cada cluster sobre as
  //    arestas de casamento E as fracas num único caminho (ex:
  //    José—Maria—Isabel—Zacarias: as "primas" no meio, maridos por fora);
  //  - o nível de um grupo é o caminho mais longo no DAG de grupos (um filho
  //    fica um nível abaixo do máximo dos pais); os filhos são colocados por
  //    baixo dos pais (ordem pela posição real dos pais), para a descendência
  //    não atravessar o ecrã.
  function layoutEvent(ids, family) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });

    // grupos de cônjuges (união por casamento) — partilham nível
    var uf = {};
    ids.forEach(function (id) { uf[id] = id; });
    function find(x) { return uf[x] === x ? x : (uf[x] = find(uf[x])); }
    function union(a, b) { uf[find(a)] = find(b); }
    family.casais.forEach(function (p) { if (idSet[p[0]] && idSet[p[1]]) union(p[0], p[1]); });
    var groupOf = {};
    ids.forEach(function (id) { groupOf[id] = find(id); });
    var gmembers = {};
    ids.forEach(function (id) { (gmembers[groupOf[id]] = gmembers[groupOf[id]] || []).push(id); });

    var parentsOf = {};
    family.filhos.forEach(function (f) { parentsOf[f.filho] = f.pais.slice(); });

    // nível de cada grupo = caminho mais longo no DAG de grupos
    var gparents = {};
    Object.keys(gmembers).forEach(function (g) { gparents[g] = {}; });
    family.filhos.forEach(function (f) {
      var cg = groupOf[f.filho];
      f.pais.forEach(function (p) { if (idSet[p] && groupOf[p] !== cg) gparents[cg][groupOf[p]] = true; });
    });
    var level = {};
    function computeLevel(g, stack) {
      if (level[g] !== undefined) return level[g];
      if (stack.indexOf(g) !== -1) return 0; // guarda contra ciclos
      var ps = Object.keys(gparents[g]);
      if (!ps.length) return level[g] = 0;
      stack.push(g);
      var m = 0;
      ps.forEach(function (pg) { m = Math.max(m, computeLevel(pg, stack) + 1); });
      stack.pop();
      return level[g] = m;
    }
    Object.keys(gmembers).forEach(function (g) { computeLevel(g, []); });
    var gen = {};
    ids.forEach(function (id) { gen[id] = level[groupOf[id]]; });
    var maxGen = 0;
    ids.forEach(function (id) { if (gen[id] > maxGen) maxGen = gen[id]; });

    // arestas fracas entre grupos diferentes no MESMO nível
    var weakPairs = [];
    family.irmaos.forEach(function (w) {
      var a = w[0], b = w[1];
      if (!idSet[a] || !idSet[b]) return;
      if (groupOf[a] === groupOf[b]) return;
      if (level[groupOf[a]] !== level[groupOf[b]]) return;
      weakPairs.push([a, b]);
    });

    // cluster: grupos de cônjuges ligados por arestas fracas (união por grupo)
    var guf = {};
    Object.keys(gmembers).forEach(function (g) { guf[g] = g; });
    function gfind(x) { return guf[x] === x ? x : (guf[x] = gfind(guf[x])); }
    weakPairs.forEach(function (w) { guf[gfind(groupOf[w[0]])] = gfind(groupOf[w[1]]); });
    var clusterGroups = {};
    Object.keys(gmembers).forEach(function (g) { var r = gfind(g); (clusterGroups[r] = clusterGroups[r] || []).push(g); });

    // ordenar um cluster como um único caminho sobre arestas de casamento +
    // fracas — casais adjacentes E membros de chaveta adjacentes
    function orderCluster(groupIds) {
      var memberSet = {};
      groupIds.forEach(function (g) { gmembers[g].forEach(function (m) { memberSet[m] = true; }); });
      var nodes = Object.keys(memberSet);
      if (nodes.length <= 1) return nodes;
      var adj = {};
      nodes.forEach(function (n) { adj[n] = []; });
      family.casais.forEach(function (p) { if (memberSet[p[0]] && memberSet[p[1]]) { adj[p[0]].push(p[1]); adj[p[1]].push(p[0]); } });
      weakPairs.forEach(function (w) { if (memberSet[w[0]] && memberSet[w[1]]) { adj[w[0]].push(w[1]); adj[w[1]].push(w[0]); } });
      var start = null;
      for (var i = 0; i < nodes.length; i++) { if (adj[nodes[i]].length === 1) { start = nodes[i]; break; } }
      if (start === null) start = nodes[0];
      var seen = {}, order = [];
      (function walk(n) {
        if (seen[n]) return;
        seen[n] = true; order.push(n);
        adj[n].forEach(function (x) { if (!seen[x]) walk(x); });
      })(start);
      nodes.forEach(function (n) { if (!seen[n]) order.push(n); });
      return order;
    }

    // blocos por nível (cada bloco = membros ordenados de um cluster)
    var rows = {};
    Object.keys(clusterGroups).forEach(function (r) {
      var gs = clusterGroups[r];
      var lv = level[gs[0]];
      (rows[lv] = rows[lv] || []).push({ members: orderCluster(gs) });
    });

    // posições: nível 0 por ordem de entrada; níveis seguintes pela posição
    // real dos pais (top-down), para os filhos descerem por baixo dos pais.
    var slot = {};
    function minInputIndex(members) {
      var m = Infinity;
      members.forEach(function (x) { var i = ids.indexOf(x); if (i < m) m = i; });
      return m;
    }
    function baryParentSlot(members) {
      var xs = [];
      members.forEach(function (mm) {
        (parentsOf[mm] || []).forEach(function (p) { if (idSet[p] && slot[p] !== undefined) xs.push(slot[p]); });
      });
      if (!xs.length) return null;
      var s = 0; xs.forEach(function (v) { s += v; }); return s / xs.length;
    }
    for (var lv = 0; lv <= maxGen; lv++) {
      var blocks = rows[lv] || [];
      if (lv === 0) {
        blocks.sort(function (A, B) { return minInputIndex(A.members) - minInputIndex(B.members); });
      } else {
        blocks.sort(function (A, B) {
          var a = baryParentSlot(A.members), b = baryParentSlot(B.members);
          if (a === null && b === null) return minInputIndex(A.members) - minInputIndex(B.members);
          if (a === null) return 1;
          if (b === null) return -1;
          return a - b;
        });
      }
      var cursor = 0;
      blocks.forEach(function (blk) {
        var b = baryParentSlot(blk.members);
        var start = b === null ? cursor : Math.max(cursor, b - (blk.members.length - 1) / 2);
        blk.members.forEach(function (m, i) { slot[m] = start + i; });
        cursor = start + blk.members.length;
      });
    }
    return { gen: gen, slot: slot, maxGen: maxGen };
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var LABEL_FONT = "600 15px 'Cormorant Garamond', Georgia, serif";
  function prefersReduce() {
    return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  var _measureCtx = null;
  function measureTextWidth(text) {
    if (!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d');
    _measureCtx.font = LABEL_FONT;
    return _measureCtx.measureText(text).width;
  }

  // `container` precisa de: .charLines (svg), .charButtons (div) — filhos de
  // um elemento com transform de câmara já aplicado pelo chamador (app.js).
  function render(charLinesEl, charButtonsEl, ids, defs, edges, onCharClick) {
    charLinesEl.innerHTML = '';
    charButtonsEl.innerHTML = '';
    var family = deriveFamily(ids, edges);
    var layout = layoutEvent(ids, family);
    var groups = deriveGroups(family);
    var slots = ids.map(function (id) { return layout.slot[id]; });
    var minSlot = Math.min.apply(null, slots), maxSlot = Math.max.apply(null, slots);
    var containerW = charButtonsEl.getBoundingClientRect().width || 800;

    // Largura de coluna por fila — cada geração dimensiona-se pelo seu nome
    // mais largo (medido a sério), para nenhum nome ser cortado.
    var rowIds = {};
    ids.forEach(function (id) { (rowIds[layout.gen[id]] = rowIds[layout.gen[id]] || []).push(id); });
    var rowColWidthPct = {};
    Object.keys(rowIds).forEach(function (g) {
      var maxLabelPx = 0;
      rowIds[g].forEach(function (id) {
        var w = measureTextWidth((defs[id] && defs[id].nome) || '');
        if (w > maxLabelPx) maxLabelPx = w;
      });
      var neededPx = Math.max(64, maxLabelPx * 1.1 + 10);
      rowColWidthPct[g] = Math.min(28, Math.max(9, neededPx / containerW * 100));
    });

    // Entrada por geração (pais primeiro), esquerda→direita dentro da geração.
    var enterDelay = {};
    var reduce = prefersReduce();
    Object.keys(rowIds).forEach(function (g) {
      var ordered = rowIds[g].slice().sort(function (a, b) { return layout.slot[a] - layout.slot[b]; });
      ordered.forEach(function (id, i) { enterDelay[id] = reduce ? 0 : (parseInt(g, 10) * 120 + i * 40); });
    });

    var rowHeightPct = layout.maxGen > 0 ? Math.min(30, 64 / (layout.maxGen + 1)) : 0;
    var topPct = layout.maxGen > 0 ? 18 : 50;
    var positions = {};
    ids.forEach(function (id) {
      var cw = rowColWidthPct[layout.gen[id]];
      positions[id] = {
        x: 50 + (layout.slot[id] - (minSlot + maxSlot) / 2) * cw,
        y: topPct + layout.gen[id] * rowHeightPct
      };
    });

    function drawSeg(x1, y1, x2, y2, cls, gen) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', x1 + '%'); line.setAttribute('y1', y1 + '%');
      line.setAttribute('x2', x2 + '%'); line.setAttribute('y2', y2 + '%');
      line.setAttribute('class', 'cline' + (cls ? ' ' + cls : ''));
      if (gen != null) line.setAttribute('data-gen', gen);
      charLinesEl.appendChild(line);
    }
    function addLabel(xPct, yPct, text, cls) {
      var el = document.createElement('div');
      el.className = cls;
      el.style.left = xPct + '%'; el.style.top = yPct + '%';
      el.textContent = text;
      charButtonsEl.appendChild(el);
    }

    // Casamento:
    //  - casal lado a lado na mesma fila (sem orbe entre eles): linha
    //    horizontal direta com ♥ a meio (caso comum; o ♥ é a origem da
    //    descendência).
    //  - casal afastado ou de gerações diferentes: percurso em ÂNGULO RETO por
    //    uma faixa horizontal no intervalo logo abaixo do orbe mais alto do par
    //    (descida/subida vertical + segmento horizontal), nunca em diagonal.
    var unions = {};
    function heartAt(xPct, yPct) {
      var mark = document.createElement('div');
      mark.className = 'marriage-mark';
      mark.style.left = xPct + '%'; mark.style.top = yPct + '%';
      mark.innerHTML = '♥';
      charButtonsEl.appendChild(mark);
    }
    family.casais.forEach(function (pair) {
      var a = positions[pair[0]], b = positions[pair[1]];
      if (!a || !b) return;
      var key = pair.slice().sort().join('|');
      var gen = layout.gen[pair[0]];
      var sameRow = Math.abs(a.y - b.y) < 0.01;
      var loX = Math.min(a.x, b.x), hiX = Math.max(a.x, b.x);
      var ux = (a.x + b.x) / 2;
      var between = sameRow && ids.some(function (id) {
        if (id === pair[0] || id === pair[1]) return false;
        var p = positions[id];
        return p && layout.gen[id] === gen && p.x > loX + 0.01 && p.x < hiX - 0.01;
      });
      if (sameRow && !between) {
        unions[key] = { x: ux, y: a.y };
        drawSeg(a.x, a.y, b.x, b.y, 'casamento', gen);
        heartAt(ux, a.y);
      } else {
        var laneGap = Math.max(rowHeightPct * 0.4, 7);
        var laneY = Math.min(a.y, b.y) + laneGap;
        drawSeg(a.x, a.y, a.x, laneY, 'casamento', gen);
        drawSeg(b.x, b.y, b.x, laneY, 'casamento', gen);
        drawSeg(loX, laneY, hiX, laneY, 'casamento', gen);
        unions[key] = { x: ux, y: laneY };
        heartAt(ux, laneY);
      }
    });

    // Descendência em ângulo reto, agrupada por unidade (casal ou progenitor
    // único): queda vertical da origem → barra horizontal → queda a cada filho.
    var byUnit = {};
    family.filhos.forEach(function (f) {
      var key = f.pais.length === 2 ? ('u:' + f.pais.slice().sort().join('|')) : ('s:' + f.pais[0]);
      (byUnit[key] = byUnit[key] || { pais: f.pais, filhos: [] }).filhos.push(f.filho);
    });
    Object.keys(byUnit).forEach(function (key) {
      var unit = byUnit[key];
      var source;
      if (unit.pais.length === 2) {
        source = unions[unit.pais.slice().sort().join('|')];
        if (!source) {
          var pa = positions[unit.pais[0]], pb = positions[unit.pais[1]];
          if (!pa || !pb) return;
          source = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
        }
      } else {
        source = positions[unit.pais[0]];
      }
      if (!source) return;
      var kids = unit.filhos.map(function (id) { return positions[id]; }).filter(Boolean);
      if (!kids.length) return;
      var gen = layout.gen[unit.filhos[0]];
      var childY = kids[0].y;
      var busY = source.y + (childY - source.y) * 0.5;
      var kidXs = kids.map(function (p) { return p.x; });
      var minX = Math.min.apply(null, kidXs), maxX = Math.max.apply(null, kidXs);
      drawSeg(source.x, source.y, source.x, busY, '', gen);
      drawSeg(Math.min(minX, source.x), busY, Math.max(maxX, source.x), busY, '', gen);
      kids.forEach(function (p) { drawSeg(p.x, busY, p.x, p.y, '', gen); });
      addLabel(source.x, busY, unit.pais.length === 2 ? 'pais de' : 'pai/mãe de', 'rel-label');
    });

    // Relações fracas: chaveta rotulada, sem linhas a cruzar.
    groups.forEach(function (g) {
      var pts = g.ids.map(function (id) { return positions[id]; }).filter(Boolean);
      if (pts.length < 2) return;
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var gMinX = Math.min.apply(null, xs), gMaxX = Math.max.apply(null, xs);
      var gy = Math.max.apply(null, ys);
      var brace = document.createElement('div');
      brace.className = 'group-brace';
      brace.style.left = gMinX + '%'; brace.style.width = (gMaxX - gMinX) + '%'; brace.style.top = gy + '%';
      charButtonsEl.appendChild(brace);
      if (g.label) addLabel((gMinX + gMaxX) / 2, gy, g.label, 'group-label');
    });

    // Orbes — só entrada suave, sem flutuação perpétua (floatChar removido).
    ids.forEach(function (id) {
      var d = defs[id];
      var btn = document.createElement('button');
      btn.className = 'char';
      btn.setAttribute('data-char-id', id);
      btn.style.left = positions[id].x + '%';
      btn.style.top = positions[id].y + '%';
      btn.style.animationDelay = enterDelay[id] + 'ms';
      var portrait = d.retrato
        ? '<img src="' + d.retrato + '" alt="" draggable="false">'
        : '';
      btn.innerHTML = '<span class="char-orb">' + portrait + '</span><span class="char-label">' + d.nome + '</span>';
      btn.addEventListener('click', function () { onCharClick(id); });
      charButtonsEl.appendChild(btn);
    });

    // Traçar as linhas progressivamente, por geração. Desligado sob
    // prefers-reduced-motion.
    if (!reduce) {
      var lineEls = charLinesEl.querySelectorAll('.cline');
      Array.prototype.forEach.call(lineEls, function (ln) {
        var L = ln.getTotalLength();
        ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L; ln.style.transition = 'none';
      });
      charLinesEl.getBoundingClientRect();
      Array.prototype.forEach.call(lineEls, function (ln) {
        var g = parseInt(ln.getAttribute('data-gen') || '0', 10);
        var delay = g * 120 + 120;
        ln.style.transition = 'stroke-dashoffset .5s ease ' + delay + 'ms';
        ln.style.strokeDashoffset = '0';
        ln.addEventListener('transitionend', function () {
          ln.style.strokeDasharray = ''; ln.style.strokeDashoffset = ''; ln.style.transition = '';
        }, { once: true });
      });
    }

    return family;
  }

  var EventGraph = { deriveFamily: deriveFamily, deriveGroups: deriveGroups, layoutEvent: layoutEvent, render: render };
  if (typeof module !== 'undefined' && module.exports) module.exports = EventGraph;
  if (typeof window !== 'undefined') window.EventGraph = EventGraph;
})();
