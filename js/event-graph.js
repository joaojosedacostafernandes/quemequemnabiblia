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
    var groupOf = {};
    groups.forEach(function (g, gi) { g.ids.forEach(function (id) { groupOf[id] = gi; }); });
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
    ids.filter(function (id) { return gen[id] === 0; }).forEach(function (id) {
      if (placed[id]) return;
      slot[id] = nextSlot++; placed[id] = true;
      family.casais.forEach(function (pair) {
        if (pair[0] === id && !placed[pair[1]] && gen[pair[1]] === 0) { slot[pair[1]] = nextSlot++; placed[pair[1]] = true; }
        if (pair[1] === id && !placed[pair[0]] && gen[pair[0]] === 0) { slot[pair[0]] = nextSlot++; placed[pair[0]] = true; }
      });
      if (groupOf[id] !== undefined) {
        groups[groupOf[id]].ids.forEach(function (m) {
          if (!placed[m] && gen[m] === 0) { slot[m] = nextSlot++; placed[m] = true; }
        });
      }
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
      var cursor = 0;
      order.forEach(function (key) {
        var group = rowGroups[key];
        var parentSlot;
        if (key.charAt(0) === 'u') {
          var pair = key.slice(2).split('|');
          parentSlot = (slot[pair[0]] + slot[pair[1]]) / 2;
        } else {
          parentSlot = slot[key.slice(2)];
        }
        var startSlot = Math.max(cursor, parentSlot - (group.length - 1) / 2);
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
    var slots = ids.map(function (id) { return layout.slot[id]; });
    var minSlot = Math.min.apply(null, slots), maxSlot = Math.max.apply(null, slots);
    var containerW = charButtonsEl.getBoundingClientRect().width || 800;

    // O espaçamento entre colunas nunca corta um nome — em vez de uma
    // largura de coluna única para o acontecimento todo, cada fila
    // (geração) tem a sua própria largura, calculada a partir do nome mais
    // largo *dessa* fila (medido a sério, com canvas, não adivinhado). Uma
    // fila com muitas personagens de nomes longos (ex: os 12 apóstolos)
    // cresce para além dos 100% do contentor — o utilizador navega-a por
    // arrasto/zoom, tal como já acontece na linha do tempo principal — mas
    // nenhum nome fica alguma vez cortado com "...".
    var rowIds = {};
    ids.forEach(function (id) { (rowIds[layout.gen[id]] = rowIds[layout.gen[id]] || []).push(id); });
    var rowColWidthPct = {};
    Object.keys(rowIds).forEach(function (g) {
      var maxLabelPx = 0;
      rowIds[g].forEach(function (id) {
        var w = measureTextWidth((defs[id] && defs[id].nome) || '');
        if (w > maxLabelPx) maxLabelPx = w;
      });
      // margem de segurança: a medição por canvas pode divergir ligeiramente
      // da fonte real se o Google Font ainda não tiver carregado.
      var neededPx = Math.max(64, maxLabelPx * 1.1 + 10);
      rowColWidthPct[g] = Math.min(28, Math.max(9, neededPx / containerW * 100));
    });

    // Atraso de entrada por personagem: por geração (pais primeiro) e, dentro
    // da geração, da esquerda para a direita (ordem de slot).
    var enterDelay = {};
    var reduce = prefersReduce();
    Object.keys(rowIds).forEach(function (g) {
      var ordered = rowIds[g].slice().sort(function (a, b) { return layout.slot[a] - layout.slot[b]; });
      ordered.forEach(function (id, i) {
        enterDelay[id] = reduce ? 0 : (parseInt(g, 10) * 120 + i * 40);
      });
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

    function drawLine(a, b, cls, gen) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', a.x + '%'); line.setAttribute('y1', a.y + '%');
      line.setAttribute('x2', b.x + '%'); line.setAttribute('y2', b.y + '%');
      line.setAttribute('class', 'cline' + (cls ? ' ' + cls : ''));
      if (gen != null) line.setAttribute('data-gen', gen);
      charLinesEl.appendChild(line);
    }

    // Casamento = UMA linha direta entre os dois círculos, com um símbolo (♥)
    // a meio. O ponto médio (`unions[key]`) é também de onde os filhos do
    // casal descem — por isso não há losango a flutuar; a família lê-se como
    // círculo —♥— círculo, com os filhos a sair do ♥.
    var unions = {};
    family.casais.forEach(function (pair) {
      var a = positions[pair[0]], b = positions[pair[1]];
      if (!a || !b) return;
      var key = pair.slice().sort().join('|');
      var ux = (a.x + b.x) / 2, uy = (a.y + b.y) / 2;
      unions[key] = { x: ux, y: uy };
      drawLine(a, b, 'casamento', layout.gen[pair[0]]);
      var mark = document.createElement('div');
      mark.className = 'marriage-mark';
      mark.style.left = ux + '%'; mark.style.top = uy + '%';
      mark.innerHTML = '♥';
      charButtonsEl.appendChild(mark);
    });
    family.filhos.forEach(function (f) {
      var childPos = positions[f.filho];
      if (!childPos) return;
      if (f.pais.length === 2) {
        var key = f.pais.slice().sort().join('|');
        var u = unions[key];
        if (u) drawLine(u, childPos, '', layout.gen[f.filho]);
      } else {
        var p = positions[f.pais[0]];
        if (p) drawLine(p, childPos, '', layout.gen[f.filho]);
      }
    });
    family.irmaos.forEach(function (pair) {
      var a = positions[pair[0]], b = positions[pair[1]];
      if (a && b) drawLine(a, b, 'weak', layout.gen[pair[0]]);
    });

    ids.forEach(function (id) {
      var d = defs[id];
      var btn = document.createElement('button');
      btn.className = 'char';
      btn.setAttribute('data-char-id', id);
      btn.style.left = positions[id].x + '%';
      btn.style.top = positions[id].y + '%';
      // duas animações em .char: charEnter (entrada, uma vez) e floatChar
      // (flutuar, perpétuo). A lista de delays casa com a ordem em `animation`.
      var floatDelay = (Math.random() * -7).toFixed(2);
      btn.style.animationDelay = enterDelay[id] + 'ms, ' + floatDelay + 's';
      var portrait = d.retrato
        ? '<img src="' + d.retrato + '" alt="" draggable="false">'
        : '';
      btn.innerHTML = '<span class="char-orb">' + portrait + '</span><span class="char-label">' + d.nome + '</span>';
      btn.addEventListener('click', function () { onCharClick(id); });
      charButtonsEl.appendChild(btn);
    });

    // Traçar as linhas progressivamente, alinhadas com a geração a que ligam
    // (as de gerações mais baixas desenham-se depois, a acompanhar a cascata
    // dos personagens). Desligado sob prefers-reduced-motion.
    if (!reduce) {
      var lineEls = charLinesEl.querySelectorAll('.cline');
      Array.prototype.forEach.call(lineEls, function (ln) {
        var L = ln.getTotalLength();
        ln.style.strokeDasharray = L;
        ln.style.strokeDashoffset = L;
        ln.style.transition = 'none';
      });
      charLinesEl.getBoundingClientRect(); // força reflow para o estado inicial "pegar"
      Array.prototype.forEach.call(lineEls, function (ln) {
        var g = parseInt(ln.getAttribute('data-gen') || '0', 10);
        var delay = g * 120 + 120; // ligeiramente depois do nó dessa geração
        ln.style.transition = 'stroke-dashoffset .5s ease ' + delay + 'ms';
        ln.style.strokeDashoffset = '0';
        // No fim do traçado, limpar os estilos inline para o CSS voltar a
        // mandar — senão o `strokeDasharray = L` inline tornava sólidas as
        // linhas tracejadas por classe (casamento `2 5`, irmãos `1 5`).
        ln.addEventListener('transitionend', function () {
          ln.style.strokeDasharray = '';
          ln.style.strokeDashoffset = '';
          ln.style.transition = '';
        }, { once: true });
      });
    }

    return family;
  }

  var EventGraph = { deriveFamily: deriveFamily, deriveGroups: deriveGroups, layoutEvent: layoutEvent, render: render };
  if (typeof module !== 'undefined' && module.exports) module.exports = EventGraph;
  if (typeof window !== 'undefined') window.EventGraph = EventGraph;
})();
