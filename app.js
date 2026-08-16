(function () {
  var svgns = "http://www.w3.org/2000/svg";

  var LEGEND = [
    ["parent", "Pai/mãe → filho/filha"],
    ["spouse", "Casamento"],
    ["sibling", "Irmãos"],
    ["descendant", "Várias gerações depois"]
  ];

  var radius = { major: 15, standard: 11, minor: 8 };

  function el(tag, attrs) {
    var e = document.createElementNS(svgns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function iconHref(tipo) {
    return "assets/icons/" + tipo + ".svg";
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

    var byId = {};
    NODES.forEach(function (n) { byId[n.id] = n; });

    var graphSvg = document.getElementById("graph");
    var defsLayer = document.getElementById("defs");
    var edgeLayer = document.getElementById("edges");
    var nodeLayer = document.getElementById("nodes");
    var panelBody = document.getElementById("panelBody");
    var panel = document.getElementById("panel");

    var edgeEls = [];
    EDGES.forEach(function (e) {
      var a = byId[e[0]], b = byId[e[1]], type = e[2];
      var line = el("line", {
        class: "edge edge-" + type,
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        "data-a": e[0], "data-b": e[1]
      });
      edgeLayer.appendChild(line);
      edgeEls.push(line);
      if (e[3]) {
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var label = el("text", { class: "edge-label", x: mx, y: my - 5, "text-anchor": "middle", "data-a": e[0], "data-b": e[1] });
        label.textContent = e[3];
        edgeLayer.appendChild(label);
        edgeEls.push(label);
      }
    });

    var adjacency = {};
    NODES.forEach(function (n) { adjacency[n.id] = new Set(); });
    EDGES.forEach(function (e) { adjacency[e[0]].add(e[1]); adjacency[e[1]].add(e[0]); });

    var nodeEls = {};
    NODES.forEach(function (n) {
      var r = radius[n.tier] || radius.standard;
      var g = el("g", { class: "node tier-" + n.tier, tabindex: "0", role: "button", "aria-label": n.nome });
      g.appendChild(el("circle", { class: "halo", cx: n.x, cy: n.y, r: r + 7 }));
      g.appendChild(el("circle", { class: "medallion", cx: n.x, cy: n.y, r: r }));
      if (n.retrato) {
        var clipId = "clip-" + n.id;
        var clip = el("clipPath", { id: clipId });
        clip.appendChild(el("circle", { cx: n.x, cy: n.y, r: r }));
        defsLayer.appendChild(clip);
        var portrait = el("image", {
          class: "portrait", x: n.x - r, y: n.y - r,
          width: r * 2, height: r * 2, href: n.retrato, "clip-path": "url(#" + clipId + ")"
        });
        portrait.setAttributeNS("http://www.w3.org/1999/xlink", "href", n.retrato);
        g.appendChild(portrait);
      } else {
        var iconSize = r * 1.3;
        var icon = el("image", {
          class: "icon", x: n.x - iconSize / 2, y: n.y - iconSize / 2,
          width: iconSize, height: iconSize, href: iconHref(n.tipo)
        });
        icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref(n.tipo));
        g.appendChild(icon);
        icon.addEventListener("error", function () {
          console.warn('Ícone em falta para o tipo "' + n.tipo + '" (personagem "' + n.id + '") — a usar o ícone "povo" como reserva.');
          icon.setAttribute("href", iconHref("povo"));
          icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref("povo"));
        });
      }
      var label = el("text", { x: n.x, y: n.y + r + 15, "text-anchor": "middle" });
      label.textContent = n.nome;
      g.appendChild(label);
      g.addEventListener("click", function () { selectNode(n.id); });
      g.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectNode(n.id); }
      });
      nodeLayer.appendChild(g);
      nodeEls[n.id] = g;
    });

    function selectNode(id) {
      var neighbors = adjacency[id];
      graphSvg.classList.add("has-selection");
      Object.keys(nodeEls).forEach(function (nid) {
        var g = nodeEls[nid];
        g.classList.toggle("selected", nid === id);
        g.classList.toggle("dim", nid !== id && !neighbors.has(nid));
      });
      edgeEls.forEach(function (line) {
        var a = line.getAttribute("data-a"), b = line.getAttribute("data-b");
        line.classList.toggle("dim", a !== id && b !== id);
      });
      renderCard(byId[id]);
      panel.classList.add("open");
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
        '<p class="card-relations">' + n.relacoes + '</p>';
    }

    function closePanel() {
      panel.classList.remove("open");
    }
    document.getElementById("panelClose").addEventListener("click", closePanel);

    graphSvg.addEventListener("click", function (ev) {
      if (ev.target === graphSvg) {
        graphSvg.classList.remove("has-selection");
        Object.keys(nodeEls).forEach(function (nid) { nodeEls[nid].classList.remove("selected", "dim"); });
        edgeEls.forEach(function (line) { line.classList.remove("dim"); });
        closePanel();
      }
    });

    var full = { x: 0, y: 0, w: data.layout.width, h: data.layout.height };
    var view = { x: full.x, y: full.y, w: full.w, h: full.h };

    function applyView() {
      graphSvg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    }
    applyView();

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
  }
})();
