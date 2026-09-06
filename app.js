(function () {
  fetch("data/personagens.json")
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      document.getElementById("panelBody").innerHTML =
        '<p class="panel-empty">Não foi possível carregar os dados (' + err.message + '). Se abriste o ficheiro diretamente no browser, é preciso servir a pasta por http:// — usa a skill run.</p>';
    });

  function normalize(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function init(data) {
    var built = RevealGraph.build(data.personagens, data.edges, data.capitulos);
    var defs = built.defs, weakRefs = built.weakRefs;

    var byId = {};
    data.personagens.forEach(function (p) { byId[p.id] = p; });

    var W = 1400, H = 900, SAFE_TOP = 110;
    Physics.init(defs, weakRefs, W, H, SAFE_TOP);
    Physics.bootstrap();

    var stage = document.getElementById('stage');
    var world = document.getElementById('world');
    var edgeLayer = document.getElementById('edgeLayer');
    var nodeLayer = document.getElementById('nodeLayer');
    var bgLayer = document.getElementById('bgLayer');
    var panel = document.getElementById('panel');
    var panelBody = document.getElementById('panelBody');
    var panelEmptyHtml = panelBody.innerHTML;

    // Fundo decorativo de estrelas (estático, fora do transform de pan/zoom) —
    // desenhado uma única vez pelo próprio render-graph.js (Task 4), não aqui.
    RenderGraph.drawBackground(bgLayer, W, H);

    var selectedId = null; // última personagem CLICADA — o painel volta a isto quando o rato sai de um hover

    function requestDraw() {
      RenderGraph.draw(world, edgeLayer, nodeLayer, defs, Physics, {
        onNodeClick: onNodeClick,
        onNodeHover: onNodeHover,
        onNodeUnhover: onNodeUnhover
      });
    }

    function onNodeClick(id) {
      Physics.toggleExpand(id, RenderGraph.markDirty);
      Physics.wake();
      var d = defs[id];
      if (d.kind !== 'uniao' && d.kind !== 'capitulo') {
        selectedId = id;
        renderCardFull(id);
        panel.classList.add('open');
      }
    }
    function onNodeHover(id) {
      var d = defs[id];
      if (d.kind === 'uniao' || d.kind === 'capitulo') return;
      renderCardPreview(id);
      panel.classList.add('open');
    }
    function onNodeUnhover() {
      if (selectedId) { renderCardFull(selectedId); }
      else { panelBody.innerHTML = panelEmptyHtml; panel.classList.remove('open'); }
    }

    function renderCardPreview(id) {
      var d = defs[id];
      panelBody.innerHTML =
        '<p class="card-era">' + d.era + '</p>' +
        '<h2 class="card-name">' + d.nome + '</h2>' +
        (d.rel ? '<p class="card-refs">' + d.rel + '</p>' : '');
    }

    function crossEraRefsHtml(n, id) {
      var refs = [];
      data.edges.forEach(function (e) {
        if (e[0] !== id && e[1] !== id) return;
        var otherId = e[0] === id ? e[1] : e[0];
        var other = byId[otherId];
        if (!other || other.era === n.era) return;
        var typeLabel = { parent: 'Família', spouse: 'Casamento', sibling: 'Irmão/irmã', descendant: e[3] || 'Descendência', affinity: e[3] || 'Parentesco' }[e[2]] || e[2];
        refs.push('<span class="cross-era-ref" data-goto-id="' + escapeAttr(otherId) + '" tabindex="0" role="button" aria-label="Ir para ' + escapeAttr(other.nome) + '">' + other.nome + ' (' + typeLabel + ' · ' + other.era + ')</span>');
      });
      return refs.length ? '<p class="card-section-title">Ligações noutras eras</p><p>' + refs.join(', ') + '</p>' : '';
    }

    function renderCardFull(id) {
      var n = defs[id];
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
        '<p class="card-relations">' + (n.rel || '') + '</p>' +
        crossEraRefsHtml(n, id);

      panelBody.querySelectorAll('.cross-era-ref').forEach(function (span) {
        span.addEventListener('click', function () { revealAndSelect(span.getAttribute('data-goto-id')); });
        span.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); revealAndSelect(span.getAttribute('data-goto-id')); }
        });
      });
    }

    function closePanel() {
      panel.classList.remove('open');
    }
    document.getElementById('panelClose').addEventListener('click', function () {
      closePanel();
      panelBody.innerHTML = panelEmptyHtml;
      selectedId = null;
    });

    // --- revelar por id (partilhado pela pesquisa e pelas ligações noutras eras) ---
    // BFS a partir dos capítulos (as únicas raízes verdadeiras) sobre o grafo
    // de `reveals`: dá a cada nó exatamente um predecessor, sem ciclos.
    // Um mapa "o último a escrever ganha" sobre `Object.keys(defs)` (versão
    // anterior desta task) partia-se sempre que uma personagem casava: a
    // união revela os dois cônjuges E cada cônjuge revela a união (para
    // nenhum ficar sem caminho de revelação próprio — ver reveal-graph.js),
    // o que cria sempre um ciclo de 2 nós entre uma personagem e a sua
    // própria união conjugal. `pathToRoot` ficava presa num `while` infinito
    // sempre que o alvo (ou um descendente seu) passava por esse ciclo —
    // ex: pesquisar "Jacob" ou qualquer descendente dele congelava a página
    // por completo (descoberto na verificação em browser real da Task 7).
    // BFS nunca revisita um nó já visitado, por isso não há ciclo possível,
    // e continua a alcançar personagens sem pais conhecidos (ex: Eva, Lia)
    // através do cônjuge, exatamente como antes.
    var revealedBy = {};
    (function () {
      var visited = {};
      var queue = [];
      Object.keys(defs).forEach(function (id) {
        if (defs[id].kind === 'capitulo') { visited[id] = true; queue.push(id); }
      });
      while (queue.length) {
        var cur = queue.shift();
        (defs[cur].reveals || []).forEach(function (cid) {
          if (!visited[cid]) { visited[cid] = true; revealedBy[cid] = cur; queue.push(cid); }
        });
      }
    })();
    function pathToRoot(id) {
      var path = []; var cur = id;
      while (revealedBy[cur]) { path.unshift(revealedBy[cur]); cur = revealedBy[cur]; }
      return path;
    }
    function revealAndSelect(id) {
      var path = pathToRoot(id);
      path.forEach(function (pid) {
        var n = Physics.getNode(pid);
        if (n && !n.expanded) Physics.toggleExpand(pid, RenderGraph.markDirty);
      });
      Physics.wake();
      setTimeout(function () {
        selectedId = id;
        renderCardFull(id);
        panel.classList.add('open');
        Physics.focusNode(id);
        // Destaque temporário no nó recém-revelado (glow em `.found-highlight
        // .halo`, já definido em style.css mas nunca antes aplicado por
        // ninguém — regressão encontrada na revisão final do branch). Mesmo
        // padrão `classList.add` + `setTimeout` a remover do mockup original
        // (docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html,
        // dentro de `focusNode`); aqui vive em app.js, não em physics.js,
        // porque `js/physics.js` nunca toca no DOM (ver cabeçalho do ficheiro).
        var foundEl = nodeLayer.querySelector('[data-id="' + id + '"]');
        if (foundEl) {
          foundEl.classList.add('found-highlight');
          setTimeout(function () { foundEl.classList.remove('found-highlight'); }, 2400);
        }
      }, 700);
    }

    // --- pesquisa ---
    var searchBox = document.getElementById('searchBox');
    var searchResults = document.getElementById('searchResults');
    var searchablePeople = Object.keys(defs).filter(function (id) {
      return ['major', 'standard', 'minor'].indexOf(defs[id].kind) !== -1;
    });
    searchBox.addEventListener('input', function () {
      var q = normalize(searchBox.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      var matches = searchablePeople.filter(function (id) { return normalize(defs[id].nome).indexOf(q) !== -1; }).slice(0, 8);
      if (!matches.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = matches.map(function (id) {
        return '<div class="search-result" data-id="' + escapeAttr(id) + '" tabindex="0" role="button" aria-label="' + escapeAttr(defs[id].nome) + '">' + defs[id].nome + '<span class="sr-era">' + defs[id].era + '</span></div>';
      }).join('');
      searchResults.hidden = false;
    });
    function activateSearchResult(row) {
      searchResults.hidden = true;
      searchBox.value = defs[row.getAttribute('data-id')].nome;
      revealAndSelect(row.getAttribute('data-id'));
    }
    searchResults.addEventListener('click', function (ev) {
      var row = ev.target.closest('.search-result');
      if (!row) return;
      activateSearchResult(row);
    });
    // As linhas de resultado têm tabindex="0"/role="button" (por cima, no
    // template), mas até esta correção não tinham handler de teclado — eram
    // focáveis mas Enter/Espaço não faziam nada (regressão encontrada na
    // revisão final do branch). Mesmo padrão Enter/Espaço já usado em
    // `.cross-era-ref` (`renderCardFull`, mais abaixo neste ficheiro).
    searchResults.addEventListener('keydown', function (ev) {
      var row = ev.target.closest('.search-result');
      if (!row) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activateSearchResult(row); }
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search-wrap')) { searchResults.hidden = true; }
    });

    // --- controlos de zoom/reset/fechar tudo ---
    document.getElementById('zoomIn').addEventListener('click', function () { Physics.zoomBy(1.25); requestDraw(); });
    document.getElementById('zoomOut').addEventListener('click', function () { Physics.zoomBy(0.8); requestDraw(); });
    document.getElementById('zoomReset').addEventListener('click', function () { Physics.resetView(); requestDraw(); });
    document.getElementById('collapseAllBtn').addEventListener('click', function () {
      Physics.collapseAll(RenderGraph.markDirty);
      Physics.wake();
      Physics.resetView();
      requestDraw();
      selectedId = null;
      panelBody.innerHTML = panelEmptyHtml;
      closePanel();
    });

    // --- pan/zoom/toque (porto direto do mockup, ver
    //     docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html:548-621) ---
    stage.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var rect = stage.getBoundingClientRect();
      var px = (ev.clientX - rect.left) * (W / rect.width);
      var py = (ev.clientY - rect.top) * (H / rect.height);
      Physics.zoomBy(ev.deltaY < 0 ? 1.12 : 0.89, px, py);
      requestDraw();
    }, { passive: false });

    var panning = false, lastX = 0, lastY = 0;
    stage.addEventListener('mousedown', function (ev) {
      if (ev.target.closest('.node')) return;
      panning = true; lastX = ev.clientX; lastY = ev.clientY;
      stage.classList.add('panning');
    });
    window.addEventListener('mousemove', function (ev) {
      if (!panning) return;
      var rect = stage.getBoundingClientRect();
      Physics.panBy((ev.clientX - lastX) * (W / rect.width), (ev.clientY - lastY) * (H / rect.height));
      lastX = ev.clientX; lastY = ev.clientY;
      requestDraw();
    });
    window.addEventListener('mouseup', function () { panning = false; stage.classList.remove('panning'); });

    // --- ciclo de física + desenho ---
    Physics.tick(requestDraw);
    requestDraw();
  }
})();
