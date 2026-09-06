(function () {
  // Porto do efeito de "salto no hiperespaço" do protótipo
  // galaxias-mockup.html (testado e aprovado pela Isabel): canvas de fundo
  // com estrelas a cintilar sempre visível, mais um rasto de streaks
  // radiais disparado em cada transição entre o mapa de galáxias e o
  // interior de uma galáxia (ou diretamente entre duas galáxias).
  function createWarpTransition() {
    var canvas, ctx;
    var stars = [];
    var reduceMotion = false;
    var warpActive = false;
    var warpStart = 0;
    var WARP_DURATION = 550;
    var warpParticles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init(canvasEl) {
      canvas = canvasEl;
      ctx = canvas.getContext('2d');
      reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      resize();
      window.addEventListener('resize', resize);
      stars = [];
      for (var i = 0; i < 160; i++) {
        stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, o: Math.random() * 0.5 + 0.15, p: Math.random() * Math.PI * 2 });
      }
      requestAnimationFrame(drawFrame);
    }

    // Disparado a cada troca de vista (mapa->galáxia, galáxia->mapa, ou
    // diretamente entre duas galáxias via ligação cruzada/pesquisa).
    // Sem efeito se o utilizador pedir movimento reduzido ao sistema.
    function trigger() {
      if (reduceMotion) return;
      warpActive = true;
      warpStart = performance.now();
      warpParticles = [];
      for (var i = 0; i < 110; i++) {
        warpParticles.push({
          angle: Math.random() * Math.PI * 2,
          dist: Math.random() * 30,
          speed: 90 + Math.random() * 220
        });
      }
    }

    function drawWarp(t) {
      var elapsed = t - warpStart;
      var progress = Math.min(1, elapsed / WARP_DURATION);
      if (progress >= 1) { warpActive = false; return; }
      var cx = canvas.width / 2, cy = canvas.height / 2;
      var kick = 1 + progress * progress * 11;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      warpParticles.forEach(function (p) {
        var prevDist = p.dist;
        p.dist += p.speed * kick * 0.016;
        var x1 = cx + Math.cos(p.angle) * prevDist;
        var y1 = cy + Math.sin(p.angle) * prevDist * 0.6;
        var x2 = cx + Math.cos(p.angle) * p.dist;
        var y2 = cy + Math.sin(p.angle) * p.dist * 0.6;
        var fade = 1 - progress;
        ctx.strokeStyle = 'rgba(232,228,216,' + (0.55 * fade).toFixed(3) + ')';
        ctx.lineWidth = 1 + progress * 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      // breve clarão no pico do salto, como ao "emergir" do hiperespaço
      var flash = Math.max(0, 1 - Math.abs(progress - 0.82) * 6);
      if (flash > 0) {
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(canvas.width, canvas.height) * 0.5);
        grad.addColorStop(0, 'rgba(240,208,96,' + (flash * 0.22).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(240,208,96,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    }

    function drawFrame(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#cfd0f0';
      stars.forEach(function (s) {
        var tw = 0.6 + 0.4 * Math.sin(t / 900 + s.p);
        ctx.globalAlpha = s.o * tw;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (warpActive) drawWarp(t);
      requestAnimationFrame(drawFrame);
    }

    return { init: init, trigger: trigger };
  }

  var WarpTransition = createWarpTransition();
  if (typeof module !== 'undefined' && module.exports) module.exports = WarpTransition;
  if (typeof window !== 'undefined') window.WarpTransition = WarpTransition;
})();
