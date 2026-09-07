(function () {
  // Linha do tempo horizontal — mapa de acontecimentos, substitui o mapa de
  // galáxias da Ronda 12. Só lê `events` (nunca os muda) e reporta a
  // intenção de mergulhar num acontecimento via `onEnter`.

  var SPACING = 340;
  var WAVE_AMP = 30;

  function markerY(i) { return Math.sin(i * 0.8) * WAVE_AMP; }

  function init(opts) {
    // opts: { view, rail, railPath, railSvg, progressDots, scrollLeftBtn,
    //         scrollRightBtn, events, onEnter }
    var view = opts.view, rail = opts.rail, railPath = opts.railPath, railSvg = opts.railSvg;
    var progressDots = opts.progressDots;
    var events = opts.events;
    var onEnter = opts.onEnter;
    var railOffset = 0;

    function render() {
      var totalWidth = (events.length - 1) * SPACING;
      rail.style.width = totalWidth + 'px';

      var buttonsHtml = '';
      events.forEach(function (ev, i) {
        var y = markerY(i);
        var avatarsHtml = ev.personagens.slice(0, 4).map(function (id) {
          var d = opts.defs[id];
          return '<span class="event-avatar">' + (d && d.retrato ? '<img src="' + d.retrato + '" alt="" draggable="false">' : '') + '</span>';
        }).join('');
        buttonsHtml += '<button class="event-marker" data-idx="' + i + '" style="left:' + (i * SPACING) + 'px; top:' + y + 'px; --tint:' + ev.tint + '">' +
          '<div class="event-avatars">' + avatarsHtml + '</div>' +
          '<div class="event-dot-wrap"><span class="event-dot-ring"></span><span class="event-dot"></span></div>' +
          '<span class="event-label">' + ev.nome + '<span class="event-era">' + ev.era + '</span></span>' +
          '</button>';
      });
      rail.insertAdjacentHTML('beforeend', buttonsHtml);
      Array.prototype.forEach.call(rail.querySelectorAll('.event-marker'), function (btn) {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        btn.addEventListener('click', function (e) { onEnter(events[idx], e.clientX, e.clientY); });
      });

      var pts = events.map(function (ev, i) { return { x: i * SPACING, y: 140 + markerY(i) }; });
      var d = 'M ' + pts[0].x + ' ' + pts[0].y;
      for (var i = 0; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        d += ' Q ' + pts[i].x + ' ' + pts[i].y + ' ' + mx + ' ' + my;
      }
      d += ' T ' + pts[pts.length - 1].x + ' ' + pts[pts.length - 1].y;
      railPath.setAttribute('d', d);
      railSvg.setAttribute('width', totalWidth + 200);
      railSvg.setAttribute('height', '320');
      railSvg.style.left = '-100px';
      railPath.setAttribute('transform', 'translate(100,0)');

      renderProgressDots();
      applyOffset();
    }

    function renderProgressDots() {
      progressDots.innerHTML = events.map(function (ev, i) {
        return '<button class="progress-dot" data-idx="' + i + '" title="' + ev.nome + '"></button>';
      }).join('');
      Array.prototype.forEach.call(progressDots.querySelectorAll('.progress-dot'), function (dot) {
        dot.addEventListener('click', function () {
          railOffset = -parseInt(dot.getAttribute('data-idx'), 10) * SPACING;
          applyOffset();
        });
      });
    }

    function applyOffset() {
      var stageWidth = view.parentElement.clientWidth;
      rail.style.transform = 'translateX(' + (stageWidth / 2 + railOffset) + 'px)';
      var nearest = Math.max(0, Math.min(events.length - 1, Math.round(-railOffset / SPACING)));
      Array.prototype.forEach.call(progressDots.querySelectorAll('.progress-dot'), function (dot, i) {
        dot.classList.toggle('active', i === nearest);
      });
    }

    var dragging = false, dragStartX = 0, dragStartOffset = 0;
    view.addEventListener('mousedown', function (e) {
      if (e.target.closest('.event-marker')) return;
      dragging = true; dragStartX = e.clientX; dragStartOffset = railOffset;
      view.classList.add('dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      railOffset = dragStartOffset + (e.clientX - dragStartX);
      applyOffset();
    });
    window.addEventListener('mouseup', function () { dragging = false; view.classList.remove('dragging'); });
    // Arrastar com o dedo — o toque nunca dispara `mousedown`/`mousemove`,
    // por isso sem isto a linha do tempo era completamente impossível de
    // percorrer por arrasto num telemóvel real (só as setas funcionavam).
    view.addEventListener('touchstart', function (e) {
      if (e.target.closest('.event-marker') || e.touches.length !== 1) return;
      dragging = true; dragStartX = e.touches[0].clientX; dragStartOffset = railOffset;
      view.classList.add('dragging');
    }, { passive: true });
    view.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      e.preventDefault();
      railOffset = dragStartOffset + (e.touches[0].clientX - dragStartX);
      applyOffset();
    }, { passive: false });
    window.addEventListener('touchend', function () { dragging = false; view.classList.remove('dragging'); });
    window.addEventListener('touchcancel', function () { dragging = false; view.classList.remove('dragging'); });
    view.addEventListener('wheel', function (e) {
      e.preventDefault();
      railOffset -= (e.deltaY || e.deltaX);
      applyOffset();
    }, { passive: false });
    if (opts.scrollLeftBtn) opts.scrollLeftBtn.addEventListener('click', function () { railOffset += SPACING; applyOffset(); });
    if (opts.scrollRightBtn) opts.scrollRightBtn.addEventListener('click', function () { railOffset -= SPACING; applyOffset(); });
    window.addEventListener('resize', applyOffset);

    render();
    return { applyOffset: applyOffset };
  }

  var Timeline = { init: init };
  if (typeof module !== 'undefined' && module.exports) module.exports = Timeline;
  if (typeof window !== 'undefined') window.Timeline = Timeline;
})();
