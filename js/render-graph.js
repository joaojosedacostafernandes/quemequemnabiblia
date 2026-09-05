(function () {
  // Porto do motor de desenho do protótipo de brainstorming
  // (docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html, linhas
  // 360-459). Este módulo só lê o estado exposto por `window.Physics`
  // (nunca o muda) e só mexe nos elementos DOM recebidos como parâmetros
  // (mais os que ele próprio cria como filhos de `nodeLayerEl`) — nunca
  // chama `document.getElementById`. Intenção do utilizador ao clicar/passar
  // o rato sobe através de `callbacks`, nunca chamando `Physics.*` que
  // mude estado diretamente.

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Equivalente a `needsFullRender`/`render()` do mockup (linhas 364,
  // 368-370): `markDirty()` só levanta a flag; quem a chama tem sempre de
  // garantir que `draw()` corre a seguir (na prática via `Physics.wake()`).
  var needsFullRender = true;

  function markDirty() {
    needsFullRender = true;
  }

  function radiusFor(kind) {
    return kind === 'capitulo' ? 36 : kind === 'major' ? 24 : kind === 'standard' ? 16 : kind === 'uniao' ? 8 : 11;
  }

  function starShape(defs, n, r) {
    var d = defs[n.id];
    if (n.kind === 'uniao') {
      // losango (quadrado a 45°) para o nó de casamento
      return '<rect class="star" x="' + (-r) + '" y="' + (-r) + '" width="' + (r * 2) + '" height="' + (r * 2) +
        '" transform="rotate(45)" filter="url(#glow)"></rect>';
    }
    if (d.retrato && n.kind !== 'capitulo') {
      var clipId = 'clip_' + n.id;
      // Sem o prefixo "../../" do mockup (que só existia porque o mockup
      // vive dentro de .superpowers/brainstorm/) — aqui `d.retrato` é usado
      // diretamente, tal como `js/render-cluster.js` já faz hoje.
      return '' +
        '<clipPath id="' + clipId + '"><circle r="' + r + '"></circle></clipPath>' +
        '<circle class="star" r="' + r + '" filter="url(#glow)"></circle>' +
        '<image href="' + d.retrato + '" x="' + (-r) + '" y="' + (-r) + '" width="' + (r * 2) + '" height="' + (r * 2) +
        '" clip-path="url(#' + clipId + ')" preserveAspectRatio="xMidYMid slice"></image>' +
        '<circle r="' + r + '" fill="none" stroke="rgba(20,15,10,.35)" stroke-width="1"></circle>';
    }
    return '<circle class="star" r="' + r + '" filter="url(#glow)"></circle>';
  }

  function draw(svgWorldEl, edgeLayerEl, nodeLayerEl, defs, physics, callbacks) {
    // Transformação de câmara (pan/zoom): o mockup lê `tx`/`ty`/`scale`
    // internos do motor de física diretamente (linha 392). O contrato do
    // `js/physics.js` desta ronda não expõe nenhum getter equivalente
    // (nem `getCamera`, nem `getScale`/`getTx`/`getTy`) — sinalizado no
    // relatório desta tarefa. Degradação graciosa: se/quando `physics`
    // ganhar esse getter (nome sugerido `getCamera()` → `{scale, tx, ty}`),
    // este módulo passa a aplicar a transformação sem precisar de mudanças.
    if (typeof physics.getCamera === 'function') {
      var cam = physics.getCamera();
      svgWorldEl.setAttribute('transform', 'translate(' + cam.tx + ',' + cam.ty + ') scale(' + cam.scale + ')');
    }

    var allNodes = physics.getAllNodes();

    if (needsFullRender) {
      nodeLayerEl.innerHTML = '';
      allNodes.forEach(function (n) {
        var hasMore = (defs[n.id].reveals || []).length > 0;
        var isNew = performance.now() - n.born < 350;
        var g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', 'node ' + n.kind + ' ' + (hasMore && !n.expanded ? 'expandable' : '') + ' node-group' + (isNew ? ' pop-in' : ''));
        g.setAttribute('data-id', n.id);
        var r = radiusFor(n.kind);
        g.innerHTML =
          '<circle class="halo" r="' + (r + 6) + '"></circle>' +
          starShape(defs, n, r) +
          (n.kind !== 'uniao' ? '<text class="name" y="' + (r + 16) + '">' + n.nome + '</text>' : '') +
          (n.kind === 'capitulo' ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + (defs[n.id].reveals || []).length + ' personagens</text>' : '') +
          (n.rel ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + n.rel + '</text>' : '') +
          (hasMore && !n.expanded ? '<circle class="badge-bg" cx="' + (r - 2) + '" cy="' + (-r + 2) + '" r="7"></circle><text class="badge" x="' + (r - 2) + '" y="' + (-r + 5) + '">+</text>' : '');
        // Eventos delegados via `callbacks` — este módulo nunca chama
        // `Physics.toggleExpand` (ou qualquer método que mude estado)
        // diretamente, só reporta intenção do utilizador para cima. Sem
        // `mousemove`: já não há tooltip flutuante a seguir o cursor (essa
        // é agora a caixa fixa no painel, da responsabilidade do app.js).
        g.addEventListener('click', function () { callbacks.onNodeClick(n.id); });
        if (n.kind !== 'uniao' && n.kind !== 'capitulo') {
          g.addEventListener('mouseenter', function () { callbacks.onNodeHover(n.id); });
          g.addEventListener('mouseleave', function () { callbacks.onNodeUnhover(); });
        }
        nodeLayerEl.appendChild(g);
      });
      needsFullRender = false;
    }

    allNodes.forEach(function (n) {
      var g = nodeLayerEl.querySelector('[data-id="' + n.id + '"]');
      if (!g) return;
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      g.classList.toggle('side', defs[n.id].kind === 'capitulo' && n.visualR < radiusFor('capitulo') - 4);
      // Capítulo aberto perde o círculo/halo/badge (pedido da Isabel) — o
      // mockup original mantinha sempre o círculo visível; aqui a classe
      // `chapter-opened` é só marcada/desmarcada, a ocultação em si é CSS
      // (Task 5, style.css), fora da responsabilidade deste ficheiro.
      var isOpenChapter = defs[n.id].kind === 'capitulo' && n.expanded;
      g.classList.toggle('chapter-opened', isOpenChapter);
      var r = n.visualR;
      var halo = g.querySelector('.halo'); if (halo) halo.setAttribute('r', r + 6);
      var star = g.querySelector('.star');
      if (star && star.tagName === 'circle') star.setAttribute('r', r);
      var nameEl = g.querySelector('.name'); if (nameEl) nameEl.setAttribute('y', r + 16);
      var clabel = g.querySelector('.clabel'); if (clabel) clabel.setAttribute('y', r + 27);
      var badgeBg = g.querySelector('.badge-bg'); if (badgeBg) { badgeBg.setAttribute('cx', r - 2); badgeBg.setAttribute('cy', -r + 2); }
      var badgeTxt = g.querySelector('.badge'); if (badgeTxt) { badgeTxt.setAttribute('x', r - 2); badgeTxt.setAttribute('y', -r + 5); }
    });

    var edgeSvg = '';
    physics.getEdges().forEach(function (e) {
      var a = physics.getNode(e.a), b = physics.getNode(e.b);
      edgeSvg += '<line class="cline ' + e.kind + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    });
    // Referências fracas (várias gerações, parentesco por casamento) — a
    // filtragem de visibilidade (ambas as pontas já em cena) já vem feita
    // por `physics.getWeakEdgesVisible()`.
    physics.getWeakEdgesVisible().forEach(function (ref) {
      var a = physics.getNode(ref.a), b = physics.getNode(ref.b);
      if (!a || !b) return;
      edgeSvg += '<line class="cline weak" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    });
    edgeLayerEl.innerHTML = edgeSvg;
  }

  // Estrelas de fundo decorativas, desenhadas uma única vez (fora da
  // transformação de `#world`, tal como no mockup). Não faz parte do
  // contrato `draw(svgWorldEl, edgeLayerEl, nodeLayerEl, defs, physics,
  // callbacks)` porque `#bgLayer` e as dimensões do mundo não são
  // parâmetros de `draw()` — quem chama isto uma vez (na inicialização,
  // não a cada frame) é o app.js (Task 6).
  function drawBackground(bgLayerEl, width, height) {
    var bgSvg = '';
    for (var i = 0; i < 140; i++) {
      var x = Math.random() * width, y = Math.random() * height, r = Math.random() * 1.3 + 0.3, o = Math.random() * 0.5 + 0.1;
      bgSvg += '<circle class="bgstar" cx="' + x + '" cy="' + y + '" r="' + r + '" opacity="' + o + '"></circle>';
    }
    bgLayerEl.innerHTML = bgSvg;
  }

  var RenderGraph = {
    draw: draw,
    markDirty: markDirty,
    drawBackground: drawBackground
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = RenderGraph;
  if (typeof window !== 'undefined') window.RenderGraph = RenderGraph;
})();
