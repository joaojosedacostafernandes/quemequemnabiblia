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

  function layoutEvent(ids, family) {
    var groups = deriveGroups(family);
    var parentOf = {};
    family.filhos.forEach(function (f) {
      parentOf[f.filho] = f.pais.length === 2
        ? { type: 'uniao', a: f.pais[0], b: f.pais[1] }
        : { type: 'unico', id: f.pais[0] };
    });
    var gen = {};
    function computeGen(id, path) {
      if (gen[id] !== undefined) return gen[id];
      if (path.indexOf(id) !== -1) return gen[id] = 0;
      path = path.concat([id]);
      var p = parentOf[id];
      if (!p) return gen[id] = 0;
      var pg = p.type === 'uniao' ? Math.max(computeGen(p.a, path), computeGen(p.b, path)) : computeGen(p.id, path);
      return gen[id] = pg + 1;
    }
    ids.forEach(function (id) { computeGen(id, []); });

    var slot = {};
    var nextSlot = 0;
    var placed = {};
    // Colocação da geração 0, INDEPENDENTE da ordem dos dados:
    //  1) grupos fracos primeiro, para um membro nunca ser "consumido" como
    //     cônjuge de um id sem grupo que apareça antes no JSON (senão a chaveta
    //     partia-se). Membros no meio, cônjuges a flanquear por fora
    //     (ex: [José, Maria, Isabel, Zacarias] — as "primas" no meio).
    //  2) o resto da geração 0, na ordem dos dados, cada um com os seus
    //     cônjuges adjacentes (inclui poligamia: Abraão com Sara e Agar).
    function spousesOf(id) {
      var out = [];
      family.casais.forEach(function (p) {
        var o = p[0] === id ? p[1] : (p[1] === id ? p[0] : null);
        if (o && gen[o] === 0 && !placed[o]) out.push(o);
      });
      return out;
    }
    function placeCluster(list) { list.forEach(function (m) { slot[m] = nextSlot++; }); }
    groups.forEach(function (grp) {
      var members = grp.ids.filter(function (m) { return gen[m] === 0 && !placed[m]; });
      if (!members.length) return;
      members.forEach(function (m) { placed[m] = true; });
      var left = spousesOf(members[0]);
      left.forEach(function (s) { placed[s] = true; });
      var right = members.length > 1 ? spousesOf(members[members.length - 1]) : [];
      right.forEach(function (s) { placed[s] = true; });
      placeCluster(left.concat(members).concat(right));
    });
    ids.filter(function (id) { return gen[id] === 0; }).forEach(function (id) {
      if (placed[id]) return;
      placed[id] = true;
      var sp = spousesOf(id);
      sp.forEach(function (s) { placed[s] = true; });
      placeCluster([id].concat(sp));
    });

    var maxGen = 0;
    ids.forEach(function (id) { maxGen = Math.max(maxGen, gen[id]); });
    for (var g = 1; g <= maxGen; g++) {
      var rowIds = ids.filter(function (id) { return gen[id] === g; });
      var rowGroups = {}, order = [];
      rowIds.forEach(function (id) {
        var p = parentOf[id];
        var key = p.type === 'uniao' ? 'u:' + [p.a, p.b].sort().join('|') : 's:' + p.id;
        if (!rowGroups[key]) { rowGroups[key] = []; order.push(key); }
        rowGroups[key].push(id);
      });
      function parentSlotOf(key) {
        if (key.charAt(0) === 'u') {
          var pr = key.slice(2).split('|');
          return (slot[pr[0]] + slot[pr[1]]) / 2;
        }
        return slot[key.slice(2)];
      }
      // Colocar os grupos de filhos pela ordem horizontal dos pais (não pela
      // ordem dos dados) — assim cada filho desce por baixo dos seus pais e a
      // barra de descendência nunca atravessa o ecrã para alcançar um filho
      // colocado longe (ex: Jesus, filho de Maria/José, deixa de ser empurrado
      // para a direita por João Batista).
      order.sort(function (a, b) { return parentSlotOf(a) - parentSlotOf(b); });
      var cursor = 0;
      order.forEach(function (key) {
        var group = rowGroups[key];
        var startSlot = Math.max(cursor, parentSlotOf(key) - (group.length - 1) / 2);
        group.forEach(function (id, i) { slot[id] = startSlot + i; });
        cursor = startSlot + group.length;
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

    // Casamento: linha horizontal direta com ♥ a meio; o ponto médio é a
    // origem de onde a descendência arranca.
    var unions = {};
    family.casais.forEach(function (pair) {
      var a = positions[pair[0]], b = positions[pair[1]];
      if (!a || !b) return;
      var key = pair.slice().sort().join('|');
      var ux = (a.x + b.x) / 2, uy = (a.y + b.y) / 2;
      unions[key] = { x: ux, y: uy };
      drawSeg(a.x, a.y, b.x, b.y, 'casamento', layout.gen[pair[0]]);
      var mark = document.createElement('div');
      mark.className = 'marriage-mark';
      mark.style.left = ux + '%'; mark.style.top = uy + '%';
      mark.innerHTML = '♥';
      charButtonsEl.appendChild(mark);
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
