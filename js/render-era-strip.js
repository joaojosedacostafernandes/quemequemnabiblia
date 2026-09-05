(function () {
  // Draws the always-visible era strip: one button per era, in narrative
  // order, with a name + character count. Replaces the old spatial
  // "path" map now that the strip and the selected era's content
  // coexist on screen instead of being separate full-screen views.
  function renderEraStrip(erasWithCounts, activeEraNome, container, onSelectEra) {
    container.innerHTML = '';
    erasWithCounts.forEach(function (era) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'era-item' + (era.nome === activeEraNome ? ' active' : '');
      item.setAttribute('aria-label', era.nome + ', ' + era.count + ' personagens');
      item.setAttribute('aria-pressed', era.nome === activeEraNome ? 'true' : 'false');

      var name = document.createElement('span');
      name.className = 'era-name';
      name.textContent = era.nome;

      var count = document.createElement('span');
      count.className = 'era-count';
      count.textContent = era.count;

      item.appendChild(name);
      item.appendChild(count);
      item.addEventListener('click', function () { onSelectEra(era.nome); });
      container.appendChild(item);
    });
  }

  window.RenderEraStrip = { renderEraStrip: renderEraStrip };
})();
