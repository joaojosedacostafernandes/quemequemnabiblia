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

  // `n.rel` vem de `relacoes` (dados reais) — no mockup de onde este ficheiro
  // foi portado, o campo equivalente era uma etiqueta curta ("casada com
  // Adão"), mas aqui é prosa completa (mediana 69 carateres, até 213 em
  // Jacob). Sem recorte, uma etiqueta SVG centrada e não quebrada a ~8.5px
  // vira uma fita de texto de ~900px a atravessar o ecrã todo. Só a etiqueta
  // pequena do grafo é recortada — o texto completo continua, sem cortes, no
  // painel de detalhe (`app.js`, `renderCardFull`, secção "Família").
  var REL_LABEL_MAX = 30;
  function truncateRelLabel(str) {
    if (!str) return str;
    return str.length > REL_LABEL_MAX ? str.slice(0, REL_LABEL_MAX) + '…' : str;
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
      // Diff em vez de "limpar tudo e recriar tudo": só cria `<g>` para ids
      // genuinamente novos e só remove os que desapareceram (colapsados);
      // nunca recria um elemento que já existe. `innerHTML = ''` + recriar
      // tudo (versão anterior) destruía e recriava o `<g>` de TODAS as
      // personagens em ecrã sempre que qualquer coisa mudava — incluindo a
      // própria personagem que acabou de ser clicada. Com o rato parado
      // sobre essa posição, o Chrome trata o elemento recriado como
      // "novo" e volta a disparar `mouseenter` nele um frame depois, o
      // que chamava `onNodeHover` outra vez e reescrevia a prévia por
      // cima do cartão completo que o próprio clique acabara de mostrar
      // (bug real, encontrado na verificação em browser real da Task 7:
      // clicar numa personagem para ver a história completa mostrava a
      // prévia em vez disso). Nunca recriar um `<g>` já existente resolve
      // isto na origem.
      var existing = {};
      Array.prototype.forEach.call(nodeLayerEl.children, function (g) {
        existing[g.getAttribute('data-id')] = g;
      });
      var wanted = {};
      allNodes.forEach(function (n) { wanted[n.id] = true; });
      Object.keys(existing).forEach(function (id) {
        if (!wanted[id]) nodeLayerEl.removeChild(existing[id]);
      });
      allNodes.forEach(function (n) {
        if (existing[n.id]) return;
        var hasMore = (defs[n.id].reveals || []).length > 0;
        var isNew = performance.now() - n.born < 350;
        var g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', 'node ' + n.kind + ' ' + (hasMore && !n.expanded ? 'expandable' : '') + ' node-group' + (isNew ? ' pop-in' : ''));
        g.setAttribute('data-id', n.id);
        // Paridade de teclado com o clique de rato (js/render-cluster.js, o
        // ficheiro que este substituiu, já dava isto a todos os nós — regressão
        // encontrada na revisão final do branch). O losango de união (kind
        // 'uniao') fica de fora: não tem nome (`nome === ''`, ver reveal-graph.js),
        // por isso não há aria-label significativo para lhe dar, tal como já
        // não tem prévia ao passar o rato nem cartão completo ao clicar (ver
        // condições abaixo e em app.js `onNodeHover`/`onNodeClick`).
        var isFocusable = n.kind !== 'uniao';
        if (isFocusable) {
          var d0 = defs[n.id];
          var label = d0 && d0.era ? (n.nome + ', ' + d0.era) : n.nome;
          g.setAttribute('tabindex', '0');
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', label);
        }
        var r = radiusFor(n.kind);
        g.innerHTML =
          '<circle class="halo" r="' + (r + 6) + '"></circle>' +
          starShape(defs, n, r) +
          (n.kind !== 'uniao' ? '<text class="name" y="' + (r + 16) + '">' + n.nome + '</text>' : '') +
          (n.kind === 'capitulo' ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + (defs[n.id].reveals || []).length + ' personagens</text>' : '') +
          (n.rel ? '<text class="clabel" y="' + (r + 27) + '" style="fill:#d8c98a;">' + truncateRelLabel(n.rel) + '</text>' : '') +
          // Os elementos do badge existem sempre que a personagem alguma
          // vez pode ser expandida (mesmo já expandida) — a sua
          // visibilidade em cada frame é decidida no segundo `forEach`
          // abaixo (`!n.expanded`), que corre para elementos novos e já
          // existentes; só assim uma personagem que passa a expandida
          // depois de já estar em ecrã perde o "+" sem precisar de ser
          // recriada.
          (hasMore ? '<circle class="badge-bg" cx="' + (r - 2) + '" cy="' + (-r + 2) + '" r="7"></circle><text class="badge" x="' + (r - 2) + '" y="' + (-r + 5) + '">+</text>' : '');
        // Eventos delegados via `callbacks` — este módulo nunca chama
        // `Physics.toggleExpand` (ou qualquer método que mude estado)
        // diretamente, só reporta intenção do utilizador para cima. Sem
        // `mousemove`: já não há tooltip flutuante a seguir o cursor (essa
        // é agora a caixa fixa no painel, da responsabilidade do app.js).
        g.addEventListener('click', function () { callbacks.onNodeClick(n.id); });
        if (isFocusable) {
          g.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); callbacks.onNodeClick(n.id); }
          });
        }
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
      // Halo/badge de "dá para expandir" — recalculados todos os frames
      // (não só na criação) para que uma personagem já em ecrã perca o
      // "+"/halo assim que é expandida, sem precisar do `<g>` ser recriado
      // (ver nota acima, sobre porque já não recriamos elementos existentes).
      var hasMore = (defs[n.id].reveals || []).length > 0;
      g.classList.toggle('expandable', hasMore && !n.expanded);
      var r = n.visualR;
      var halo = g.querySelector('.halo'); if (halo) halo.setAttribute('r', r + 6);
      var star = g.querySelector('.star');
      if (star && star.tagName === 'circle') star.setAttribute('r', r);
      var nameEl = g.querySelector('.name'); if (nameEl) nameEl.setAttribute('y', r + 16);
      var clabel = g.querySelector('.clabel'); if (clabel) clabel.setAttribute('y', r + 27);
      var badgeBg = g.querySelector('.badge-bg');
      if (badgeBg) { badgeBg.setAttribute('cx', r - 2); badgeBg.setAttribute('cy', -r + 2); badgeBg.style.display = n.expanded ? 'none' : ''; }
      var badgeTxt = g.querySelector('.badge');
      if (badgeTxt) { badgeTxt.setAttribute('x', r - 2); badgeTxt.setAttribute('y', -r + 5); badgeTxt.style.display = n.expanded ? 'none' : ''; }
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
