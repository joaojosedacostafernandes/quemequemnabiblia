(function () {
  var svgns = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  var STATION_R = { big: 26, small: 16 };

  // Draws the era path/hub screen into the given <g> layers (the same
  // #edges/#nodes groups the cluster view uses). `eras` is
  // [{nome, descricao, count}, ...] in narrative order.
  function renderPath(eras, edgeLayer, nodeLayer, onSelectEra) {
    edgeLayer.innerHTML = '';
    nodeLayer.innerHTML = '';

    var COLS = 6;
    var STEP_X = 160;
    var STEP_Y = 160;
    var MARGIN = 100;

    var points = eras.map(function (era, i) {
      var row = Math.floor(i / COLS);
      var col = i % COLS;
      var displayCol = (row % 2 === 0) ? col : (COLS - 1 - col);
      return { era: era, x: MARGIN + displayCol * STEP_X, y: MARGIN + row * STEP_Y };
    });

    if (points.length) {
      var d = 'M ' + points.map(function (p) { return p.x + ' ' + p.y; }).join(' L ');
      edgeLayer.appendChild(el('path', { d: d, class: 'path-line', fill: 'none' }));
    }

    points.forEach(function (p) {
      var r = p.era.count >= 6 ? STATION_R.big : STATION_R.small;
      var g = el('g', { class: 'station', tabindex: '0', role: 'button', 'aria-label': p.era.nome + ', ' + p.era.count + ' personagens' });
      g.appendChild(el('circle', { class: 'station-circle', cx: p.x, cy: p.y, r: r }));
      var count = el('text', { class: 'station-count', x: p.x, y: p.y + 4, 'text-anchor': 'middle' });
      count.textContent = p.era.count;
      g.appendChild(count);
      var label = el('text', { class: 'station-label', x: p.x, y: p.y + r + 16, 'text-anchor': 'middle' });
      label.textContent = p.era.nome;
      g.appendChild(label);
      g.addEventListener('click', function () { onSelectEra(p.era.nome); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelectEra(p.era.nome); }
      });
      nodeLayer.appendChild(g);
    });

    var maxRow = points.length ? Math.floor((points.length - 1) / COLS) : 0;
    var width = MARGIN * 2 + (COLS - 1) * STEP_X;
    var height = MARGIN * 2 + maxRow * STEP_Y;
    return { width: width, height: height };
  }

  window.RenderPath = { renderPath: renderPath };
})();
