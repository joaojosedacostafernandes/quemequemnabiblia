(function () {
  // Porto do motor de simulação física do protótipo de brainstorming
  // (docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html, linhas
  // 157-358, 460-522, 550-558, 580-581, 643-650). Este módulo é só estado +
  // matemática: nenhuma chamada a `document.*` ou a qualquer API do DOM —
  // quem desenha é sempre o `render-graph.js` (via `onFrame`/`onChange`),
  // nunca este ficheiro.
  function createPhysics() {
    var defs = {};
    var weakRefs = [];
    var W = 0, H = 0, SAFE_TOP = 0;
    var sim = new Map(); // id -> {x,y,vx,vy,kind,nome,rel,expanded,born,visualR}
    var scale = 1, tx = 0, ty = 0;
    var capitulIds = [];

    // Margem à volta de cada nó, em unidades do mundo, que reserva espaço
    // para o nome e a etiqueta de parentesco por baixo.
    var LABEL_MARGIN = 44;
    var SIDE_RADIUS = 15;

    // Sono: a simulação adormece assim que assenta (ver `frame()`), e
    // volta a acordar sempre que `wake()` é chamado (abrir/fechar um nó,
    // fazer pan/zoom que a mexa, etc).
    var asleep = false;
    var calmFrames = 0;
    var alpha = 1;
    var SLEEP_SPEED = 0.12, SLEEP_AFTER = 15, ALPHA_DECAY = 0.975;

    var fitting = false;
    var camAnim = null;

    // Callback de redesenho guardado da última chamada a `tick(onFrame)` —
    // `wake()` e a animação de câmara (`stepCamAnim`) reutilizam-no, para
    // que o chamador nunca tenha de o passar mais do que uma vez.
    var _onFrame = null;

    function radiusFor(kind) {
      return kind === 'capitulo' ? 36 : kind === 'major' ? 24 : kind === 'standard' ? 16 : kind === 'uniao' ? 8 : 11;
    }

    // `spawnParentId` é quem estava a ser clicado quando este nó nasceu —
    // diferente de `defs[id].reveals`, que é sobre "o que É POSSÍVEL
    // revelar" (partilhado/simétrico entre cônjuges, ver nota em
    // `collapseSubtree`). `rootCapitulo` (o capítulo de onde este nó
    // descende, calculado uma vez ao nascer a partir do do seu progenitor)
    // isola a física por capítulo — ver `frame()`. Assunção não garantida
    // por código: fica fixo a partir de quem revelar este nó primeiro — se
    // os dados alguma vez ligarem um casamento entre dois capítulos
    // diferentes (nenhum caso real hoje), essa união ficaria parentada ao
    // capítulo errado sem aviso nenhum.
    function addNode(id, atX, atY, spawnParentId) {
      var def = defs[id];
      var parentNode = spawnParentId ? sim.get(spawnParentId) : null;
      var rootCapitulo = def.kind === 'capitulo' ? id : (parentNode ? parentNode.rootCapitulo : null);
      sim.set(id, {
        id: id, nome: def.nome, kind: def.kind, rel: def.rel || null,
        expanded: false, x: atX, y: atY, vx: 0, vy: 0, born: performance.now(),
        visualR: radiusFor(def.kind), spawnParent: spawnParentId || null, rootCapitulo: rootCapitulo
      });
    }

    // Quando um capítulo está aberto, os outros encolhem e vão para uma
    // faixa lateral — dão o ecrã todo às personagens do capítulo escolhido,
    // mas continuam visíveis e clicáveis para mudar de capítulo.
    function anyCapExpanded() {
      return capitulIds.some(function (cid) {
        var n = sim.get(cid);
        return n && n.expanded;
      });
    }

    function effectiveHome(id) {
      var d = defs[id];
      if (!d.home) return null;
      if (d.kind !== 'capitulo' || !anyCapExpanded()) return d.home;
      var n = sim.get(id);
      if (n && n.expanded) {
        // Palco principal, bem afastado da faixa lateral — um lugar
        // próprio por capítulo aberto, para não se empilharem uns sobre
        // os outros.
        var expandedIds = capitulIds.filter(function (cid) {
          var cn = sim.get(cid);
          return cn && cn.expanded;
        });
        var idx = Math.max(0, expandedIds.indexOf(id));
        return [560 + idx * 520, 460];
      }
      var idxSide = capitulIds.indexOf(id);
      return [70, 170 + idxSide * 68];
    }

    function targetRadiusFor(n) {
      var d = defs[n.id];
      if (d.kind !== 'capitulo' || !anyCapExpanded() || n.expanded) return radiusFor(n.kind);
      return SIDE_RADIUS;
    }

    // Todas as personagens-raiz (sem pais registados na Bíblia, mais os
    // capítulos) começam visíveis, fechadas, ancoradas na sua posição de
    // grelha.
    function bootstrap() {
      sim.clear();
      Object.keys(defs).filter(function (id) { return defs[id].home; }).forEach(function (id) {
        var home = defs[id].home;
        addNode(id, home[0], home[1]);
      });
    }

    // Quem decide redesenhar/repor a câmara é sempre quem chama
    // `collapseAll`, nunca este módulo — por isso não há aqui nenhuma
    // chamada equivalente a `resetView()`/`render()` do mockup.
    function collapseAll(onChange) {
      bootstrap();
      if (onChange) onChange();
      wake();
    }

    function edgeKind(fromId, toId) {
      if (defs[fromId].kind === 'uniao') return 'descent';
      if (defs[toId].kind === 'uniao') return 'stem';
      if (defs[fromId].spouseDirect && defs[fromId].spouseDirect.indexOf(toId) !== -1) return 'spouseDirect';
      return 'direct';
    }

    function edgesFor(id) {
      return (defs[id].reveals || []).filter(function (cid) { return sim.has(cid); }).map(function (cid) {
        return { a: id, b: cid, kind: edgeKind(id, cid) };
      });
    }

    function getEdges() {
      var out = [];
      Array.from(sim.keys()).forEach(function (id) { out = out.concat(edgesFor(id)); });
      // Cônjuge <-> união aparece duas vezes em `out`: a pessoa revela a
      // união (kind 'stem') E a união revela a pessoa de volta (kind
      // 'descent' — mesmo ciclo simétrico descrito em `collapseSubtree`).
      // Sem desduplicar, a mola aplicava-se duas vezes por par com dois
      // comprimentos de repouso diferentes a competir (o casamento assentava
      // numa distância de compromisso não intencional), e desenhavam-se duas
      // linhas sobrepostas — a "descent" (mais grossa, cor de descendência)
      // por cima da "stem" (mais fina, cor de casamento), escondendo a
      // distinção visual que o mockup original pretendia entre as duas.
      // Mantém sempre a direção 'stem' (pessoa -> união) quando existem as
      // duas; pares com uma só direção (ex: união -> filho, kind 'descent',
      // que é uma relação real, não duplicada) passam tal e qual.
      var byPair = {};
      out.forEach(function (e) {
        var key = [e.a, e.b].sort().join('|');
        if (!byPair[key] || (byPair[key].kind !== 'stem' && e.kind === 'stem')) {
          byPair[key] = e;
        }
      });
      return Object.keys(byPair).map(function (key) { return byPair[key]; });
    }

    function getWeakEdgesVisible() {
      return weakRefs.filter(function (w) { return sim.has(w.a) && sim.has(w.b); });
    }

    function restLengthFor(kind) {
      return kind === 'stem' ? 55 : kind === 'descent' ? 70 : kind === 'spouseDirect' ? 60 : 130;
    }

    function toggleExpand(id, onChange) {
      var n = sim.get(id);
      if (!n) return;
      var targets = defs[id].reveals || [];
      if (targets.length === 0) return;
      n.expanded = !n.expanded;
      if (n.expanded) {
        // Nasce já espalhado num pequeno leque à volta do pai — nascer
        // todos colados ao mesmo ponto obrigava a física a desfazer
        // sobreposições sozinha, e o "sono" rápido podia travar antes
        // disso acontecer.
        //
        // Origem do leque: o destino final do pai (`effectiveHome`), não a
        // sua posição atual em ecrã. Para um capítulo, expandir muda logo o
        // seu próprio alvo de âncora (palco principal em vez da faixa
        // lateral), mas o capítulo em si só lá chega ao fim de uma migração
        // gradual (âncora fraca, ERA_ANCHOR_K=0.05). Nascer os filhos à
        // volta da posição ainda-não-migrada (ex: ainda na faixa lateral,
        // x=70) deixava-os presos longe do capítulo quando este tinha vários
        // capítulos abertos ao mesmo tempo (2º slot em x=1080) — a mola que
        // os liga ao capítulo (SPRING_K=0.012) nunca ganhava ao decaimento
        // de `alpha`/ao amortecimento a tempo de percorrer essa distância
        // toda, e a simulação adormecia com eles a meio do ecrã, ligados
        // por linhas compridas ao capítulo lá longe (bug real, encontrado na
        // verificação em browser real da Task 7 ao abrir "Os Reis" com "Os
        // Patriarcas" já aberto). Nascer já no destino final resolve isto:
        // só falta espalhá-los localmente uns dos outros, que é o que a
        // repulsão/mola já fazem bem.
        var home = effectiveHome(id);
        var originX = home ? home[0] : n.x;
        var originY = home ? home[1] : n.y;
        var newTargets = targets.filter(function (cid) { return !sim.has(cid); });
        var baseAngle = Math.random() * Math.PI * 2;
        newTargets.forEach(function (cid, i) {
          var dist = restLengthFor(edgeKind(id, cid));
          var angle = baseAngle + (i / Math.max(newTargets.length, 1)) * Math.PI * 2;
          addNode(cid, originX + Math.cos(angle) * dist, originY + Math.sin(angle) * dist, id);
        });
      } else {
        collapseSubtree(id);
      }
      if (onChange) onChange();
      wake();
    }

    // Colapsar percorre quem `id` REALMENTE fez aparecer no ecrã (o
    // `spawnParent` gravado em `addNode`), nunca `defs[id].reveals` — esse
    // é um grafo cíclico sobre "o que é possível revelar" (um cônjuge revela
    // a sua união E a união revela os dois cônjuges de volta, para a Eva
    // aparecer mesmo não sendo alvo direto de mais ninguém), não uma árvore
    // de posse. Uma primeira correção (percurso iterativo com conjunto de
    // visitados sobre `reveals`) resolveu o estouro de pilha
    // (`RangeError: Maximum call stack size exceeded`, 24/33 personagens)
    // mas não este problema mais subtil: colapsar a Eva reentrava a união
    // partilhada e apagava o Adão e os filhos também — tudo o que a união
    // revela — mesmo o clique tendo sido nela, não no Adão. Percorrer a
    // árvore real de nascimento evita isto: colapsar a Eva não apaga nada
    // (o clique dela não gerou nenhum nó novo, já que a união já estava
    // visível); colapsar o Adão (ou a própria união) continua a remover
    // corretamente tudo o que essa cadeia gerou.
    function collapseSubtree(id) {
      var childrenOf = {};
      sim.forEach(function (n) {
        if (n.spawnParent) {
          (childrenOf[n.spawnParent] = childrenOf[n.spawnParent] || []).push(n.id);
        }
      });
      var stack = (childrenOf[id] || []).slice();
      while (stack.length) {
        var cid = stack.pop();
        if (!sim.has(cid)) continue;
        sim.delete(cid);
        if (childrenOf[cid]) stack = stack.concat(childrenOf[cid]);
      }
      var n = sim.get(id);
      if (n) n.expanded = false;
    }

    function wake() {
      alpha = 1;
      if (asleep) {
        asleep = false;
        calmFrames = 0;
        requestAnimationFrame(frame);
      }
    }

    function frame() {
      var nodes = Array.from(sim.values());
      var REPEL = 3200; // era 2200 no mockup — mais forte, para reduzir sobreposição de linhas/retratos
      var SPRING_K = 0.012;
      var DAMP = 0.6;
      var ERA_ANCHOR_K = 0.05; // "palco principal" do capítulo aberto (e caso geral)
      var SIDE_ANCHOR_K = 0.22; // só para capítulos encolhidos na faixa lateral

      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          // Dois capítulos abertos ao mesmo tempo não se devem influenciar
          // um ao outro (pedido da Isabel) — cada um é a sua própria "ilha"
          // física. `rootCapitulo` (ver `addNode`) identifica de que
          // capítulo cada nó descende; sem esta guarda, abrir um segundo
          // capítulo empurrava/mexia nas personagens do primeiro já
          // estabilizadas.
          //
          // Limitação residual conhecida (não introduzida por esta guarda,
          // já existia antes): `alpha`/`asleep`/`calmFrames` continuam
          // globais, não por capítulo. Abrir um novo capítulo chama
          // `wake()`, que repõe `alpha=1` para a simulação inteira — por
          // isso QUALQUER nó sem âncora de capítulo (não só os de união;
          // qualquer personagem, já que só os nós `kind:'capitulo'` têm
          // `effectiveHome`) sofre um pequeno reajuste do seu próprio grupo
          // ao acordar de novo, mesmo sem nenhuma força vinda do outro
          // capítulo. Medido: ~20 unidades (~1.5% da largura do mundo) numa
          // única personagem já ligada por mola (não só em nós de união
          // ainda sem cônjuge fixo), acumulando ao longo de vários capítulos
          // abertos em sequência. Imperceptível na prática hoje (mascarado
          // pelo próprio zoom da câmara ao ajustar-se para caber os dois
          // grupos), mas corrigir a sério exigiria `alpha`/sono por grupo,
          // não só a guarda de repulsão abaixo — candidato para uma ronda
          // futura se algum dia se tornar visível.
          if (a.rootCapitulo && b.rootCapitulo && a.rootCapitulo !== b.rootCapitulo) continue;
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1;
          var d = Math.sqrt(d2);
          var f = (REPEL / d2) * alpha;
          var fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }
      getEdges().forEach(function (e) {
        var ea = sim.get(e.a), eb = sim.get(e.b);
        var dx = eb.x - ea.x, dy = eb.y - ea.y;
        var d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        var rest = restLengthFor(e.kind);
        var diff = d - rest;
        var fx = (dx / d) * diff * SPRING_K * alpha, fy = (dy / d) * diff * SPRING_K * alpha;
        ea.vx += fx; ea.vy += fy;
        eb.vx -= fx; eb.vy -= fy;
      });
      var maxSpeed = 0;
      nodes.forEach(function (n) {
        var home = effectiveHome(n.id);
        if (home) {
          var d = defs[n.id];
          var inSideStrip = d.kind === 'capitulo' && anyCapExpanded() && !n.expanded;
          var k = inSideStrip ? SIDE_ANCHOR_K : ERA_ANCHOR_K;
          n.vx += (home[0] - n.x) * k; n.vy += (home[1] - n.y) * k;
        }
        n.visualR += (targetRadiusFor(n) - n.visualR) * 0.18;
        n.vx *= DAMP; n.vy *= DAMP;
        if (Math.abs(n.vx) < 0.05) n.vx = 0;
        if (Math.abs(n.vy) < 0.05) n.vy = 0;
        n.x += n.vx; n.y += n.vy;
        maxSpeed = Math.max(maxSpeed, Math.abs(n.vx), Math.abs(n.vy));
      });

      // Nó de casamento: como numa árvore genealógica em papel, fica
      // sempre exatamente sobre a linha que une os dois cônjuges — nunca
      // à deriva.
      sim.forEach(function (n) {
        if (defs[n.id].kind !== 'uniao') return;
        var spouses = defs[n.id].spouses;
        var sa = sim.get(spouses[0]), sb = sim.get(spouses[1]);
        if (!sa || !sb) return;
        n.x = (sa.x + sb.x) / 2;
        n.y = (sa.y + sb.y) / 2;
        n.vx = 0; n.vy = 0;
      });

      if (_onFrame) _onFrame();

      // Enquanto a física está acordada (algo acabou de abrir/fechar),
      // garante que tudo continua visível — nunca deixa nada sair do
      // ecrã sozinho.
      if (!fitting && !everythingInView()) {
        fitting = true;
        fitView();
      }

      alpha *= ALPHA_DECAY;
      if (maxSpeed < SLEEP_SPEED || alpha < 0.01) {
        calmFrames++;
        if (calmFrames > SLEEP_AFTER) { asleep = true; return; }
      } else {
        calmFrames = 0;
      }
      requestAnimationFrame(frame);
    }

    function tick(onFrame) {
      _onFrame = onFrame;
      asleep = false;
      requestAnimationFrame(frame);
    }

    function everythingInView() {
      // Tolerância de meio pixel: `fitView()` calcula o enquadramento mais
      // justo possível com esta mesma fórmula de `r`, por isso um nó
      // exatamente no limite devia sempre passar — mas a multiplicação por
      // `scale`/`tx`/`ty` acumula erro de vírgula flutuante (ex:
      // 109.99999999999991 em vez de 110.0 exatos), o que sem tolerância
      // fazia isto voltar `false` para sempre (encontrado na verificação em
      // browser real da Task 7: procurar "Jacob" deixava um capítulo já
      // encolhido na faixa lateral a "falhar" este teste por uma fração de
      // pixel, sem nada realmente cortado em ecrã, e sem qualquer chamada a
      // `fitView()` alguma vez conseguir fechar essa diferença, porque as
      // posições já não mudam).
      var EPS = 0.5;
      var ok = true;
      sim.forEach(function (n) {
        var r = radiusFor(n.kind) + LABEL_MARGIN;
        var sx = n.x * scale + tx, sy = n.y * scale + ty;
        var rs = r * scale;
        if (sx - rs < -EPS || sx + rs > W + EPS || sy - rs < SAFE_TOP - EPS || sy + rs > H + EPS) ok = false;
      });
      return ok;
    }

    function fitView() {
      var nodes = Array.from(sim.values());
      if (nodes.length === 0) { fitting = false; return; }
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach(function (n) {
        var r = radiusFor(n.kind) + LABEL_MARGIN;
        minX = Math.min(minX, n.x - r); maxX = Math.max(maxX, n.x + r);
        minY = Math.min(minY, n.y - r); maxY = Math.max(maxY, n.y + r);
      });
      var bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
      var availH = H - SAFE_TOP;
      var targetScale = Math.min(3, Math.max(0.2, Math.min(W / bw, availH / bh)));
      var targetTx = W / 2 - (minX + maxX) / 2 * targetScale;
      var targetTy = SAFE_TOP + availH / 2 - (minY + maxY) / 2 * targetScale;
      animateCameraTo(targetScale, targetTx, targetTy);
    }

    function animateCameraTo(targetScale, targetTx, targetTy, duration) {
      camAnim = {
        startScale: scale, startTx: tx, startTy: ty,
        targetScale: targetScale, targetTx: targetTx, targetTy: targetTy,
        startTime: performance.now(), duration: duration || 450
      };
      requestAnimationFrame(stepCamAnim);
    }

    function stepCamAnim(now) {
      if (!camAnim) return;
      var t = (now - camAnim.startTime) / camAnim.duration;
      if (t > 1) t = 1;
      var ease = 1 - Math.pow(1 - t, 3);
      scale = camAnim.startScale + (camAnim.targetScale - camAnim.startScale) * ease;
      tx = camAnim.startTx + (camAnim.targetTx - camAnim.startTx) * ease;
      ty = camAnim.startTy + (camAnim.targetTy - camAnim.startTy) * ease;
      // Animação de câmara autónoma (o seu próprio requestAnimationFrame,
      // independente de `frame()`) — reutiliza o `onFrame` guardado da
      // última chamada a `tick()` para pedir o redesenho de cada frame,
      // já que aqui não há "quem chamou" por frame para o fazer.
      if (_onFrame) _onFrame();
      if (t < 1) {
        requestAnimationFrame(stepCamAnim);
      } else {
        camAnim = null;
        fitting = false;
      }
    }

    function zoomBy(factor, cx, cy) {
      cx = (cx === undefined || cx === null) ? W / 2 : cx;
      cy = (cy === undefined || cy === null) ? H / 2 : cy;
      var newScale = Math.min(3, Math.max(0.35, scale * factor));
      var k = newScale / scale;
      tx = cx - (cx - tx) * k;
      ty = cy - (cy - ty) * k;
      scale = newScale;
    }

    // Só repõe o estado de câmara (scale/tx/ty) — quem decide redesenhar
    // a seguir é sempre quem chama, tal como no mockup `zoomBy`/`panBy`
    // nunca desenhavam a si próprios (era o listener a chamar `draw()`
    // depois).
    function resetView() {
      scale = 1; tx = 0; ty = 0;
    }

    function panBy(dx, dy) {
      tx += dx;
      ty += dy;
    }

    function focusNode(id) {
      var n = sim.get(id);
      if (!n) return;
      var targetScale = 1.5;
      var availH = H - SAFE_TOP;
      var targetTx = W / 2 - n.x * targetScale;
      var targetTy = SAFE_TOP + availH / 2 - n.y * targetScale;
      animateCameraTo(targetScale, targetTx, targetTy, 600);
    }

    function getNode(id) {
      return sim.get(id);
    }

    function getAllNodes() {
      return Array.from(sim.values());
    }

    // Estado atual da câmara — necessário porque `render-graph.js` precisa
    // de aplicar `scale`/`tx`/`ty` ao atributo `transform` do grupo `#world`
    // a cada frame (mockup linha 392), e essas três variáveis são internas
    // a este módulo (nunca chegam a sair via `onFrame`/`onChange`).
    function getCamera() {
      return { scale: scale, tx: tx, ty: ty };
    }

    function init(newDefs, newWeakRefs, canvasWidth, canvasHeight, safeTop) {
      defs = newDefs || {};
      weakRefs = newWeakRefs || [];
      W = canvasWidth;
      H = canvasHeight;
      SAFE_TOP = safeTop;
      capitulIds = Object.keys(defs).filter(function (id) { return defs[id].kind === 'capitulo'; });
      sim = new Map();
      scale = 1; tx = 0; ty = 0;
      asleep = false; calmFrames = 0; alpha = 1;
      fitting = false; camAnim = null; _onFrame = null;
    }

    return {
      init: init,
      bootstrap: bootstrap,
      toggleExpand: toggleExpand,
      tick: tick,
      wake: wake,
      getNode: getNode,
      getAllNodes: getAllNodes,
      getCamera: getCamera,
      getEdges: getEdges,
      getWeakEdgesVisible: getWeakEdgesVisible,
      everythingInView: everythingInView,
      fitView: fitView,
      animateCameraTo: animateCameraTo,
      collapseAll: collapseAll,
      zoomBy: zoomBy,
      resetView: resetView,
      panBy: panBy,
      focusNode: focusNode
    };
  }

  var Physics = createPhysics();
  if (typeof module !== 'undefined' && module.exports) module.exports = Physics;
  if (typeof window !== 'undefined') window.Physics = Physics;
})();
