(function () {
  var svgns = "http://www.w3.org/2000/svg";

  var LEGEND = [
    ["parent", "Pai/mãe → filho/filha"],
    ["spouse", "Casamento"],
    ["sibling", "Irmãos"],
    ["descendant", "Várias gerações depois"]
  ];

  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function normalize(str) {
    // Strip Unicode combining diacritical marks (U+0300-U+036F) left over
    // after NFD decomposition, so "Amós" and "amos" compare equal.
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    var ERAS = data.eras;

    var byId = {};
    NODES.forEach(function (n) { byId[n.id] = n; });

    var eraCounts = {};
    NODES.forEach(function (n) { eraCounts[n.era] = (eraCounts[n.era] || 0) + 1; });
    var erasWithCounts = ERAS.map(function (e) {
      return { nome: e.nome, descricao: e.descricao, count: eraCounts[e.nome] || 0 };
    });

    var adjacency = {};
    NODES.forEach(function (n) { adjacency[n.id] = new Set(); });
    EDGES.forEach(function (e) { adjacency[e[0]].add(e[1]); adjacency[e[1]].add(e[0]); });

    var graphSvg = document.getElementById("graph");
    var defsLayer = document.getElementById("defs");
    var edgeLayer = document.getElementById("edges");
    var nodeLayer = document.getElementById("nodes");
    var panelBody = document.getElementById("panelBody");
    var panel = document.getElementById("panel");
    var breadcrumbBar = document.getElementById("breadcrumbBar");
    var breadcrumbLabel = document.getElementById("breadcrumbLabel");
    var backBtn = document.getElementById("backBtn");

    var edgeEls = [];
    var nodeEls = {};
    var full = { x: 0, y: 0, w: 1200, h: 500 };
    var view = { x: 0, y: 0, w: 1200, h: 500 };

    function applyView() {
      graphSvg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    }

    function resetViewTo(dims) {
      full = { x: 0, y: 0, w: dims.width, h: dims.height };
      view = { x: 0, y: 0, w: dims.width, h: dims.height };
      applyView();
    }

    function goToPath() {
      defsLayer.innerHTML = '';
      breadcrumbBar.hidden = true;
      var dims = RenderPath.renderPath(erasWithCounts, edgeLayer, nodeLayer, goToEra);
      edgeEls = []; nodeEls = {};
      resetViewTo(dims);
      closePanel();
    }

    function goToEra(eraNome) {
      breadcrumbBar.hidden = false;
      breadcrumbLabel.textContent = eraNome;
      var result = RenderCluster.renderCluster(eraNome, NODES, EDGES, defsLayer, edgeLayer, nodeLayer, selectCharacter);
      edgeEls = result.edgeEls; nodeEls = result.nodeEls;
      resetViewTo(result);
      closePanel();
    }

    backBtn.addEventListener("click", goToPath);

    function selectCharacter(id) {
      var neighbors = adjacency[id];
      graphSvg.classList.add("has-selection");
      Object.keys(nodeEls).forEach(function (nid) {
        var g = nodeEls[nid];
        g.classList.toggle("selected", nid === id);
        g.classList.toggle("dim", nid !== id && !neighbors.has(nid));
      });
      edgeEls.forEach(function (line) {
        var a = line.getAttribute("data-a"), b = line.getAttribute("data-b");
        if (a === null) return;
        line.classList.toggle("dim", a !== id && b !== id);
      });
      renderCard(byId[id]);
      panel.classList.add("open");
    }

    function crossEraRefsHtml(n) {
      var refs = [];
      EDGES.forEach(function (e) {
        if (e[0] !== n.id && e[1] !== n.id) return;
        var otherId = e[0] === n.id ? e[1] : e[0];
        var other = byId[otherId];
        if (!other || other.era === n.era) return;
        var typeLabel = { parent: 'Família', spouse: 'Casamento', sibling: 'Irmão/irmã', descendant: e[3] || 'Descendência' }[e[2]] || e[2];
        refs.push('<span class="cross-era-ref" data-goto-era="' + escapeAttr(other.era) + '" data-goto-id="' + escapeAttr(other.id) + '" tabindex="0" role="button" aria-label="Ir para ' + escapeAttr(other.nome) + ', ' + escapeAttr(other.era) + '">' + other.nome + ' (' + typeLabel + ' · ' + other.era + ')</span>');
      });
      return refs.length ? '<p class="card-section-title">Ligações noutras eras</p><p>' + refs.join(', ') + '</p>' : '';
    }

    function renderCard(n) {
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
        '<p class="card-relations">' + n.relacoes + '</p>' +
        crossEraRefsHtml(n);

      function goToCrossEraRef(span) {
        var eraNome = span.getAttribute('data-goto-era');
        var id = span.getAttribute('data-goto-id');
        goToEra(eraNome);
        setTimeout(function () { selectCharacter(id); }, 0);
      }
      panelBody.querySelectorAll('.cross-era-ref').forEach(function (span) {
        span.addEventListener('click', function () { goToCrossEraRef(span); });
        span.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); goToCrossEraRef(span); }
        });
      });
    }

    function closePanel() {
      panel.classList.remove("open");
      graphSvg.classList.remove("has-selection");
    }
    document.getElementById("panelClose").addEventListener("click", closePanel);

    graphSvg.addEventListener("click", function (ev) {
      if (ev.target === graphSvg) closePanel();
    });

    // --- search ---
    var searchInput = document.getElementById("searchInput");
    var searchResults = document.getElementById("searchResults");

    searchInput.addEventListener("input", function () {
      var q = normalize(searchInput.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      var matches = NODES.filter(function (n) {
        return normalize(n.nome).indexOf(q) !== -1 || normalize(n.era).indexOf(q) !== -1;
      }).slice(0, 8);
      if (!matches.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = matches.map(function (n) {
        return '<div class="search-result" data-id="' + escapeAttr(n.id) + '" data-era="' + escapeAttr(n.era) + '" tabindex="0" role="button" aria-label="' + escapeAttr(n.nome) + ', ' + escapeAttr(n.era) + '">' + n.nome + '<div class="era">' + n.era + '</div></div>';
      }).join('');
      searchResults.hidden = false;
      function chooseResult(row) {
        var id = row.getAttribute('data-id'), eraNome = row.getAttribute('data-era');
        searchResults.hidden = true;
        searchInput.value = '';
        goToEra(eraNome);
        setTimeout(function () { selectCharacter(id); }, 0);
      }
      searchResults.querySelectorAll('.search-result').forEach(function (row) {
        row.addEventListener('click', function () { chooseResult(row); });
        row.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); chooseResult(row); }
        });
      });
    });
    document.addEventListener("click", function (ev) {
      if (!ev.target.closest('.search-wrap')) { searchResults.hidden = true; }
    });

    // --- pan/zoom/drag (unchanged behavior, re-scoped to the current view) ---
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

    var dragging = false, dragStart = null, pointerDownAt = null, activePointerId = null;
    var DRAG_THRESHOLD = 4;
    graphSvg.addEventListener("pointerdown", function (ev) {
      dragging = false;
      activePointerId = ev.pointerId;
      pointerDownAt = { x: ev.clientX, y: ev.clientY };
      dragStart = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
    });
    graphSvg.addEventListener("pointermove", function (ev) {
      if (dragStart === null || ev.pointerId !== activePointerId) return;
      if (!dragging) {
        var moved = Math.hypot(ev.clientX - pointerDownAt.x, ev.clientY - pointerDownAt.y);
        if (moved < DRAG_THRESHOLD) return;
        dragging = true;
        graphSvg.classList.add("dragging");
        graphSvg.setPointerCapture(activePointerId);
      }
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
        dragStart = null;
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

    goToPath();
  }
})();
