(function () {
  var svgns = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function iconHref(tipo) { return "assets/icons/" + tipo + ".svg"; }

  // Draws one era's cluster: a genealogy tree for characters linked by
  // edges internal to this era, plus a grid below it for everyone else.
  function renderCluster(eraNome, personagens, edges, defsLayer, edgeLayer, nodeLayer, onSelectCharacter) {
    edgeLayer.innerHTML = '';
    nodeLayer.innerHTML = '';
    defsLayer.innerHTML = '';

    var chars = personagens.filter(function (p) { return p.era === eraNome; });
    var ids = new Set(chars.map(function (c) { return c.id; }));
    var internalEdges = edges.filter(function (e) { return ids.has(e[0]) && ids.has(e[1]); });

    var treePositions = Layout.computeTreeLayout(chars, internalEdges);
    var unconnected = chars.filter(function (c) { return !(c.id in treePositions); });
    var gridPositions = Layout.computeGridLayout(unconnected);

    var treeMaxY = 0;
    Object.keys(treePositions).forEach(function (id) { treeMaxY = Math.max(treeMaxY, treePositions[id].y); });
    var gridOffsetY = Object.keys(treePositions).length ? treeMaxY + 150 : 60;

    var positions = {};
    Object.keys(treePositions).forEach(function (id) { positions[id] = { x: treePositions[id].x, y: treePositions[id].y }; });
    Object.keys(gridPositions).forEach(function (id) { positions[id] = { x: gridPositions[id].x, y: gridPositions[id].y + gridOffsetY }; });

    var xs = Object.keys(positions).map(function (id) { return positions[id].x; });
    var minX = xs.length ? Math.min.apply(null, xs) : 0;
    var shiftX = -minX + 80;
    Object.keys(positions).forEach(function (id) { positions[id].x += shiftX; positions[id].y += 60; });

    var edgeEls = [];
    internalEdges.forEach(function (e) {
      var a = positions[e[0]], b = positions[e[1]], type = e[2];
      if (!a || !b) return;
      var line = el('line', { class: 'edge edge-' + type, x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'data-a': e[0], 'data-b': e[1] });
      edgeLayer.appendChild(line);
      edgeEls.push(line);
      if (e[3]) {
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var label = el('text', { class: 'edge-label', x: mx, y: my - 5, 'text-anchor': 'middle', 'data-a': e[0], 'data-b': e[1] });
        label.textContent = e[3];
        edgeLayer.appendChild(label);
        edgeEls.push(label);
      }
    });

    var nodeEls = {};
    chars.forEach(function (n) {
      var pos = positions[n.id];
      var r = Layout.TIER_RADIUS[n.tier] || Layout.TIER_RADIUS.standard;
      var g = el('g', { class: 'node tier-' + n.tier, tabindex: '0', role: 'button', 'aria-label': n.nome });
      g.appendChild(el('circle', { class: 'halo', cx: pos.x, cy: pos.y, r: r + 7 }));
      g.appendChild(el('circle', { class: 'medallion', cx: pos.x, cy: pos.y, r: r }));

      if (n.retrato) {
        var clipId = 'clip-' + n.id;
        var clip = el('clipPath', { id: clipId });
        clip.appendChild(el('circle', { cx: pos.x, cy: pos.y, r: r }));
        defsLayer.appendChild(clip);
        var portrait = el('image', { class: 'portrait', x: pos.x - r, y: pos.y - r, width: r * 2, height: r * 2, href: n.retrato, 'clip-path': 'url(#' + clipId + ')' });
        portrait.setAttributeNS('http://www.w3.org/1999/xlink', 'href', n.retrato);
        g.appendChild(portrait);
        portrait.addEventListener('error', function () {
          portrait.remove();
          var iconSize = r * 1.3;
          var icon = el('image', { class: 'icon', x: pos.x - iconSize / 2, y: pos.y - iconSize / 2, width: iconSize, height: iconSize, href: iconHref(n.tipo) });
          icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref(n.tipo));
          g.appendChild(icon);
        });
      } else {
        var iconSize2 = r * 1.3;
        var icon2 = el('image', { class: 'icon', x: pos.x - iconSize2 / 2, y: pos.y - iconSize2 / 2, width: iconSize2, height: iconSize2, href: iconHref(n.tipo) });
        icon2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref(n.tipo));
        g.appendChild(icon2);
        icon2.addEventListener('error', function () {
          icon2.setAttribute('href', iconHref('povo'));
          icon2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref('povo'));
        });
      }

      var label = el('text', { x: pos.x, y: pos.y + r + 15, 'text-anchor': 'middle' });
      label.textContent = n.nome;
      g.appendChild(label);
      g.addEventListener('click', function () { onSelectCharacter(n.id); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelectCharacter(n.id); }
      });
      nodeLayer.appendChild(g);
      nodeEls[n.id] = g;
    });

    var allX = Object.keys(positions).map(function (id) { return positions[id].x; });
    var allY = Object.keys(positions).map(function (id) { return positions[id].y; });
    var maxX = allX.length ? Math.max.apply(null, allX) : 200;
    var maxY = allY.length ? Math.max.apply(null, allY) : 200;
    return { width: maxX + 140, height: maxY + 120, edgeEls: edgeEls, nodeEls: nodeEls };
  }

  window.RenderCluster = { renderCluster: renderCluster };
})();
