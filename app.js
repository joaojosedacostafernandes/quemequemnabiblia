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
    var byId = {};
    data.personagens.forEach(function (p) { byId[p.id] = p; });
    var events = data.acontecimentos;

    // A que acontecimento pertence cada personagem, para saltos (pesquisa e
    // "também aparece em") — usa sempre o primeiro em que aparece, quando
    // uma personagem participa em mais do que um (ex: David em 3).
    var firstEventOf = {};
    events.forEach(function (ev) {
      ev.personagens.forEach(function (id) {
        if (!firstEventOf[id]) firstEventOf[id] = ev;
      });
    });

    var bgStars = document.getElementById('bgStars');
    WarpTransition.init(bgStars);

    var timelineView = document.getElementById('timelineView');
    var eventView = document.getElementById('eventView');
    var eventAmbient = document.getElementById('eventAmbient');
    var eventIcon = document.getElementById('eventIcon');
    var eventTitle = document.getElementById('eventTitle');
    var eventEra = document.getElementById('eventEra');
    var eventDesc = document.getElementById('eventDesc');
    var eventImportancia = document.getElementById('eventImportancia');
    var eventMensagem = document.getElementById('eventMensagem');
    var eventContexto = document.getElementById('eventContexto');
    var eventPassagens = document.getElementById('eventPassagens');
    var eventInfo = document.getElementById('eventInfo');
    var charButtons = document.getElementById('charButtons');
    var charLines = document.getElementById('charLines');
    var camLayer = document.getElementById('camLayer');
    var charField = document.getElementById('charField');
    var panel = document.getElementById('panel');
    var panelBody = document.getElementById('panelBody');
    var panelEmptyHtml = panelBody.innerHTML;
    var backBtn = document.getElementById('backBtn');
    var scrollHintText = document.getElementById('scrollHintText');
    var panelClose = document.getElementById('panelClose');

    document.getElementById('eventInfoToggle').addEventListener('click', function () { eventInfo.classList.toggle('collapsed'); });
    panelClose.addEventListener('click', function () {
      panel.classList.remove('open');
      document.querySelectorAll('.char.focused').forEach(function (el) { el.classList.remove('focused'); });
    });

    // --- câmara (zoom/pan) dentro de um acontecimento — sem física, só
    // estado de transformação, tal como o protótipo validado ---
    var camScale = 1, camTx = 0, camTy = 0;
    function applyCam() { camLayer.style.transform = 'translate(' + camTx + 'px,' + camTy + 'px) scale(' + camScale + ')'; }
    function resetCam() { camScale = 1; camTx = 0; camTy = 0; applyCam(); }
    function zoomBy(factor) { camScale = Math.max(0.5, Math.min(3, camScale * factor)); applyCam(); }
    document.getElementById('zoomIn').addEventListener('click', function () { zoomBy(1.25); });
    document.getElementById('zoomOut').addEventListener('click', function () { zoomBy(0.8); });
    document.getElementById('zoomReset').addEventListener('click', resetCam);
    charField.addEventListener('wheel', function (e) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false });
    var panningChars = false, panStartX = 0, panStartY = 0, panStartTx = 0, panStartTy = 0;
    charField.addEventListener('mousedown', function (e) {
      if (e.target.closest('.char') || e.target.closest('.union-node')) return;
      panningChars = true; panStartX = e.clientX; panStartY = e.clientY; panStartTx = camTx; panStartTy = camTy;
      charField.classList.add('panning');
    });
    window.addEventListener('mousemove', function (e) {
      if (!panningChars) return;
      camTx = panStartTx + (e.clientX - panStartX); camTy = panStartTy + (e.clientY - panStartY);
      applyCam();
    });
    window.addEventListener('mouseup', function () { panningChars = false; charField.classList.remove('panning'); });
    // Arrastar com o dedo — sem isto, explorar uma árvore genealógica larga
    // (ex: os 12 apóstolos) num telemóvel real só era possível pelo botão
    // de reduzir zoom, nunca por arrasto.
    charField.addEventListener('touchstart', function (e) {
      if (e.target.closest('.char') || e.target.closest('.union-node') || e.touches.length !== 1) return;
      panningChars = true; panStartX = e.touches[0].clientX; panStartY = e.touches[0].clientY; panStartTx = camTx; panStartTy = camTy;
      charField.classList.add('panning');
    }, { passive: true });
    charField.addEventListener('touchmove', function (e) {
      if (!panningChars) return;
      e.preventDefault();
      camTx = panStartTx + (e.touches[0].clientX - panStartX); camTy = panStartTy + (e.touches[0].clientY - panStartY);
      applyCam();
    }, { passive: false });
    window.addEventListener('touchend', function () { panningChars = false; charField.classList.remove('panning'); });
    window.addEventListener('touchcancel', function () { panningChars = false; charField.classList.remove('panning'); });

    // --- mapa de acontecimentos (linha do tempo) ---
    var timelineApi = Timeline.init({
      view: timelineView,
      rail: document.getElementById('timelineRail'),
      railPath: document.getElementById('railPath'),
      railSvg: document.getElementById('railSvg'),
      progressDots: document.getElementById('progressDots'),
      scrollLeftBtn: document.getElementById('scrollLeft'),
      scrollRightBtn: document.getElementById('scrollRight'),
      events: events,
      defs: byId,
      isSuspended: function () { return document.body.classList.contains('in-event'); },
      onEnter: function (ev, x, y) { enterEvent(ev, x, y); }
    });

    var currentEvent = null;

    function enterEvent(ev, clickX, clickY, fromHistory) {
      var wasInEvent = !!currentEvent;
      var stageEl = document.querySelector('.stage');
      var rect = stageEl.getBoundingClientRect();
      var originXFrac = (clickX - rect.left) / rect.width, originYFrac = (clickY - rect.top) / rect.height;
      var originPct = (originXFrac * 100).toFixed(1) + '% ' + (originYFrac * 100).toFixed(1) + '%';
      timelineView.style.transformOrigin = originPct;
      eventView.style.transformOrigin = originPct;
      WarpTransition.trigger(originXFrac, originYFrac, ev.tint);

      timelineView.classList.add('diving');
      document.body.classList.add('in-event');
      scrollHintText.textContent = 'usa as setas para o acontecimento anterior/seguinte';
      eventInfo.classList.add('collapsed');
      resetCam();
      currentEvent = ev;
      timelineApi.jumpTo(events.indexOf(ev));
      eventTitle.textContent = ev.nome;
      eventEra.textContent = ev.era;
      eventDesc.textContent = ev.desc;
      eventImportancia.textContent = ev.importancia;
      eventMensagem.textContent = ev.mensagem;
      eventContexto.textContent = ev.contexto || '';
      eventPassagens.innerHTML = ev.passagens.map(function (p) { return '<li>' + p + '</li>'; }).join('');
      eventIcon.innerHTML = window.EVENT_ICONS[ev.id] || '';
      eventAmbient.style.setProperty('--tint', ev.tint);
      eventView.style.setProperty('--tint', ev.tint);
      EventGraph.render(charLines, charButtons, ev.personagens, byId, data.edges, function (id) { focusChar(id); });
      panelBody.innerHTML = panelEmptyHtml;
      panel.classList.remove('open');
      document.getElementById('eventScroll').scrollTop = 0;
      requestAnimationFrame(function () { eventView.classList.add('shown'); });
      if (!fromHistory) {
        try {
          if (wasInEvent) history.replaceState({ ev: ev.id }, '', '#' + ev.id);
          else history.pushState({ ev: ev.id }, '', '#' + ev.id);
        } catch (e) {}
      }
    }

    // Parte visual da saída — sem tocar no histórico. `fx`/`fy` são frações
    // (0..1) da stage; por omissão o centro (usado quando a saída vem do
    // teclado ou do `popstate`, que não têm coordenadas de clique).
    function exitVisual(fx, fy) {
      if (typeof fx !== 'number') fx = 0.5;
      if (typeof fy !== 'number') fy = 0.5;
      var originPct = (fx * 100).toFixed(1) + '% ' + (fy * 100).toFixed(1) + '%';
      timelineView.style.transformOrigin = originPct;
      eventView.style.transformOrigin = originPct;
      WarpTransition.trigger(fx, fy, currentEvent ? currentEvent.tint : '#f0d060');
      eventView.classList.remove('shown');
      timelineView.classList.remove('diving');
      document.body.classList.remove('in-event');
      scrollHintText.textContent = 'arrasta a linha do tempo';
      currentEvent = null;
      panel.classList.remove('open');
    }
    // O botão "voltar" da app recua no histórico; o `popstate` faz a saída
    // visual — assim o botão "voltar" do telemóvel e o da app são o mesmo.
    backBtn.addEventListener('click', function () { history.back(); });

    function enterEventCentered(ev, fromHistory) {
      var rect = document.querySelector('.stage').getBoundingClientRect();
      enterEvent(ev, rect.left + rect.width / 2, rect.top + rect.height / 2, fromHistory);
    }
    function eventById(id) {
      for (var i = 0; i < events.length; i++) if (events[i].id === id) return events[i];
      return null;
    }
    window.addEventListener('popstate', function () {
      var id = location.hash ? location.hash.slice(1) : '';
      if (!id) {
        if (currentEvent) exitVisual();
        return;
      }
      var ev = eventById(id);
      if (ev && (!currentEvent || currentEvent.id !== ev.id)) enterEventCentered(ev, true);
    });

    // O menu inferior (setas + pontos de progresso) é partilhado com a
    // linha do tempo, mas dentro de um acontecimento passa a navegar
    // diretamente para o acontecimento anterior/seguinte (ou o escolhido),
    // em vez de só deslocar a calha invisível por trás — antes não fazia
    // nada de visível, a pedido da Isabel. `Timeline.init`'s próprios
    // handlers ignoram-se a si mesmos enquanto `isSuspended()` (in-event).
    function gotoAdjacentEvent(delta, e) {
      if (!currentEvent) return;
      var next = events[events.indexOf(currentEvent) + delta];
      if (!next) return;
      enterEvent(next, e.clientX, e.clientY);
    }
    document.getElementById('scrollLeft').addEventListener('click', function (e) {
      if (document.body.classList.contains('in-event')) gotoAdjacentEvent(-1, e);
    });
    document.getElementById('scrollRight').addEventListener('click', function (e) {
      if (document.body.classList.contains('in-event')) gotoAdjacentEvent(1, e);
    });
    document.getElementById('progressDots').addEventListener('click', function (e) {
      if (!document.body.classList.contains('in-event')) return;
      var dot = e.target.closest('.progress-dot');
      if (!dot) return;
      var target = events[parseInt(dot.getAttribute('data-idx'), 10)];
      if (target && target.id !== currentEvent.id) enterEvent(target, e.clientX, e.clientY);
    });

    // --- cartão de detalhe ---
    function familyOf(charId) {
      var family = EventGraph.deriveFamily(currentEvent.personagens, data.edges);
      var rel = [];
      family.casais.forEach(function (pair) {
        if (pair[0] === charId) rel.push({ id: pair[1], label: 'cônjuge' });
        else if (pair[1] === charId) rel.push({ id: pair[0], label: 'cônjuge' });
      });
      family.filhos.forEach(function (f) {
        if (f.filho === charId) f.pais.forEach(function (pid) { rel.push({ id: pid, label: 'progenitor' }); });
        else if (f.pais.indexOf(charId) !== -1) rel.push({ id: f.filho, label: 'filho(a)' });
      });
      family.irmaos.forEach(function (pair) {
        var label = pair[2] || 'irmão/irmã';
        if (pair[0] === charId) rel.push({ id: pair[1], label: label });
        else if (pair[1] === charId) rel.push({ id: pair[0], label: label });
      });
      return rel;
    }

    function crossEventRefsHtml(id) {
      var refs = [];
      var roster = currentEvent.personagens;
      data.edges.forEach(function (e) {
        if (e[0] !== id && e[1] !== id) return;
        var otherId = e[0] === id ? e[1] : e[0];
        if (roster.indexOf(otherId) !== -1) return;
        var other = byId[otherId];
        var otherEvent = firstEventOf[otherId];
        if (!other || !otherEvent || otherEvent.id === currentEvent.id) return;
        var typeLabel = { parent: 'Família', spouse: 'Casamento', sibling: 'Irmão/irmã', descendant: e[3] || 'Descendência', affinity: e[3] || 'Parentesco' }[e[2]] || e[2];
        refs.push('<span class="cross-event-ref" data-goto-id="' + escapeAttr(otherId) + '" tabindex="0" role="button" aria-label="Ir para ' + escapeAttr(other.nome) + '">' + other.nome + ' (' + typeLabel + ' · ' + otherEvent.nome + ')</span>');
      });
      return refs.length ? '<p class="card-section-title">Também aparece em</p><p>' + refs.join(', ') + '</p>' : '';
    }

    function focusChar(charId) {
      document.querySelectorAll('.char').forEach(function (el) { el.classList.toggle('focused', el.getAttribute('data-char-id') === charId); });
      // Uma personagem que aparece em vários acontecimentos (ex: Jesus em 9,
      // David em 3) tem texto próprio para cada aparição — `notas` do
      // acontecimento atual têm sempre prioridade sobre o registo global,
      // para nunca mostrar, por exemplo, a descrição do Jesus glorificado
      // do Apocalipse dentro do acontecimento do Nascimento.
      var base = byId[charId];
      var overrides = (currentEvent.notas && currentEvent.notas[charId]) || {};
      var d = Object.assign({}, base, overrides);
      var family = familyOf(charId);
      var familyHtml = family.length
        ? '<div class="family-chips">' + family.map(function (f) {
            var other = byId[f.id];
            return '<button class="family-chip" data-goto="' + escapeAttr(f.id) + '">' + (other ? other.nome : f.id) + '<span class="rel">' + f.label + '</span></button>';
          }).join('') + '</div>'
        : '<p class="no-family">Sem relações de família registadas neste acontecimento.</p>';
      var portrait = d.retrato
        ? '<div class="card-portrait"><img src="' + d.retrato + '" alt="Retrato de ' + escapeAttr(d.nome) + '"></div>'
        : '<div class="card-portrait"></div>';
      panelBody.innerHTML =
        portrait +
        '<span class="card-era">' + currentEvent.nome + '</span>' +
        '<h2 class="card-name">' + d.nome + '</h2>' +
        '<p class="card-refs">' + (d.refs || '') + '</p>' +
        '<hr class="card-divider">' +
        '<p class="card-summary">' + d.resumo + '</p>' +
        (d.importancia ? '<p class="card-section-title">Importância</p><p class="card-body">' + d.importancia + '</p>' : '') +
        (d.licao ? '<p class="card-section-title">O que aprendemos com Deus</p><p class="card-body">' + d.licao + '</p>' : '') +
        (d.citacao ? '<p class="card-section-title">Citação</p><p class="card-quote">' + d.citacao + '</p>' : '') +
        (d.contexto ? '<p class="card-section-title">Contexto histórico</p><p class="card-body">' + d.contexto + '</p>' : '') +
        '<p class="card-section-title">Família (neste acontecimento)</p>' +
        familyHtml +
        crossEventRefsHtml(charId);
      panelBody.querySelectorAll('.family-chip').forEach(function (chip) {
        chip.addEventListener('click', function () { focusChar(chip.getAttribute('data-goto')); });
      });
      panelBody.querySelectorAll('.cross-event-ref').forEach(function (span) {
        span.addEventListener('click', function () { jumpToPersonagem(span.getAttribute('data-goto-id')); });
        span.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); jumpToPersonagem(span.getAttribute('data-goto-id')); }
        });
      });
      panel.classList.add('open');
    }

    // Salta para uma personagem, mudando de acontecimento se for preciso —
    // usado pela pesquisa e por "também aparece em".
    function jumpToPersonagem(id) {
      var targetEvent = firstEventOf[id];
      if (!targetEvent) return;
      if (!currentEvent || targetEvent.id !== currentEvent.id) {
        var stageEl = document.querySelector('.stage');
        var rect = stageEl.getBoundingClientRect();
        var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        enterEvent(targetEvent, cx, cy);
      }
      setTimeout(function () { focusChar(id); }, currentEvent && currentEvent.id === targetEvent.id ? 0 : 700);
    }

    // --- pesquisa ---
    var searchBox = document.getElementById('searchBox');
    var searchResults = document.getElementById('searchResults');
    var searchablePeople = Object.keys(byId).filter(function (id) {
      return ['major', 'standard', 'minor'].indexOf(byId[id].tier) !== -1;
    });
    searchBox.addEventListener('input', function () {
      var q = normalize(searchBox.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      var matches = searchablePeople.filter(function (id) { return normalize(byId[id].nome).indexOf(q) !== -1; }).slice(0, 8);
      if (!matches.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
      searchResults.innerHTML = matches.map(function (id) {
        return '<div class="search-result" data-id="' + escapeAttr(id) + '" tabindex="0" role="button" aria-label="' + escapeAttr(byId[id].nome) + '">' + byId[id].nome + '<span class="sr-era">' + (firstEventOf[id] ? firstEventOf[id].nome : '') + '</span></div>';
      }).join('');
      searchResults.hidden = false;
    });
    function activateSearchResult(row) {
      searchResults.hidden = true;
      searchBox.value = byId[row.getAttribute('data-id')].nome;
      jumpToPersonagem(row.getAttribute('data-id'));
    }
    searchResults.addEventListener('click', function (ev) {
      var row = ev.target.closest('.search-result');
      if (row) activateSearchResult(row);
    });
    searchResults.addEventListener('keydown', function (ev) {
      var row = ev.target.closest('.search-result');
      if (!row) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activateSearchResult(row); }
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search-wrap')) searchResults.hidden = true;
    });

    // O espaçamento das colunas dentro de um acontecimento é calculado a
    // partir da largura real dos nomes (canvas measureText) — se a fonte
    // Cormorant Garamond ainda não tiver carregado nesse momento, a medição
    // usa a serif de recurso e pode ficar ligeiramente errada. Assim que a
    // fonte carrega a sério, volta a desenhar o acontecimento aberto (se
    // algum) com a medição correta.
    // Base de linha do tempo no histórico, para o "voltar" nunca sair do
    // site — mesmo quando se entra por deep-link (#id) já dentro de um
    // acontecimento. A hash tem de ser lida ANTES do replaceState, que a apaga.
    var initHash = location.hash ? location.hash.slice(1) : '';
    try { history.replaceState({}, '', location.pathname + location.search); } catch (e) {}
    if (initHash) {
      var initEv = eventById(initHash);
      if (initEv) enterEventCentered(initEv, false);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (currentEvent) EventGraph.render(charLines, charButtons, currentEvent.personagens, byId, data.edges, function (id) { focusChar(id); });
      });
    }
  }
})();
