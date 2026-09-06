(function () {
  // Grelha do mapa de galáxias — um botão por capítulo. Só lê `defs`/
  // `memberCounts` (nunca os muda) e reporta a intenção de entrar numa
  // galáxia via `onEnter`, no mesmo espírito de `render-graph.js` (DOM só
  // aqui, decisão em app.js).
  function render(gridEl, defs, memberCounts, onEnter) {
    gridEl.innerHTML = '';
    Object.keys(defs)
      .filter(function (id) { return defs[id].kind === 'capitulo'; })
      .forEach(function (capId) {
        var d = defs[capId];
        var btn = document.createElement('button');
        btn.className = 'galaxy';
        btn.innerHTML =
          '<span class="galaxy-orb" style="animation-delay:' + (Math.random() * -6).toFixed(2) + 's"></span>' +
          '<span class="galaxy-name">' + d.nome + '</span>' +
          '<span class="galaxy-count">' + (memberCounts[capId] || 0) + ' personagens</span>';
        btn.addEventListener('click', function () { onEnter(capId); });
        gridEl.appendChild(btn);
      });
  }

  var GalaxyMap = { render: render };
  if (typeof module !== 'undefined' && module.exports) module.exports = GalaxyMap;
  if (typeof window !== 'undefined') window.GalaxyMap = GalaxyMap;
})();
