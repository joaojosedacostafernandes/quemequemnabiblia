# Faixa de Épocas (Ronda 10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o ecrã de percurso (mapa espacial das 33 épocas com botão "voltar") por uma faixa de épocas sempre visível à esquerda do ecrã, permitindo trocar de época sem fechar a anterior manualmente, mantendo o painel de detalhe da personagem fixo à direita e dando o máximo de espaço à área de exploração da época selecionada.

**Architecture:** `js/render-path.js` (que hoje calcula posições espaciais para desenhar 33 "estações" ligadas por um caminho em SVG) é substituído por `js/render-era-strip.js`, um módulo muito mais simples que gera uma lista HTML (não SVG) de botões, um por época. `js/render-cluster.js` e `js/layout.js` não são tocados — continuam a desenhar a árvore genealógica/grelha da época ativa, sempre na mesma área central. `app.js` perde a lógica de "ecrã de percurso" (`goToPath`, breadcrumb, botão voltar) e passa a manter um estado simples de "época ativa", re-renderizando a faixa sempre que ela muda.

**Tech Stack:** HTML/CSS/JS puro (sem frameworks, sem build step) — site estático servido diretamente, consistente com o resto do projeto.

**Spec:** `docs/superpowers/specs/2026-09-05-faixa-epocas-design.md`

## Global Constraints

- Não introduzir nenhuma dependência nova (sem npm packages, sem frameworks, sem build step) — site estático puro, tal como todo o projeto até agora.
- Nenhuma alteração a `data/personagens.json` — a faixa usa exatamente os campos que já existem (`eras[].nome`, contagem derivada de `personagens[].era`).
- Implementar num git worktree isolado, nunca diretamente em `master` (convenção já estabelecida no projeto — ver `handover.md`).
- Reutilizar as variáveis de tema já existentes em `:root` de `style.css` (`--accent`, `--accent-2`, `--border`, `--bg-2`, `--surface`, `--text`, `--text-muted`, `--font-body`, `--font-mono`) — não introduzir cores ou fontes novas.
- `js/render-cluster.js` e `js/layout.js` não são modificados por este plano.

---

### Task 1: Substituir `js/render-path.js` por `js/render-era-strip.js`

**Files:**
- Create: `js/render-era-strip.js` (via `git mv js/render-path.js js/render-era-strip.js` seguido de reescrita do conteúdo)
- Delete: `js/render-path.js` (via o `git mv` acima — não fica nenhum ficheiro com o nome antigo)

**Interfaces:**
- Produces: `window.RenderEraStrip.renderEraStrip(erasWithCounts, activeEraNome, container, onSelectEra)` — usado pela Task 4. `erasWithCounts` é um array `[{nome, descricao, count}, ...]` (mesmo formato que `js/render-path.js` já recebia). `activeEraNome` é uma string (nome da época ativa) ou `null` se nenhuma estiver selecionada. `container` é o elemento DOM onde a lista é desenhada. `onSelectEra` é chamado com o nome da época quando um item é clicado.

- [ ] **Step 1: Mover o ficheiro**

Run: `git mv "js/render-path.js" "js/render-era-strip.js"`

- [ ] **Step 2: Substituir todo o conteúdo do ficheiro**

Escrever em `js/render-era-strip.js`:

```js
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
```

- [ ] **Step 3: Verificar sintaxe**

Run (antepor o PATH do Node conforme `handover.md`):
```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node --check "js/render-era-strip.js"
```
Expected: sem output (significa sintaxe válida).

- [ ] **Step 4: Commit**

```bash
git add js/render-era-strip.js
git commit -m "refactor: replace spatial path renderer with era strip list"
```

---

### Task 2: Atualizar `index.html`

**Files:**
- Modify: `index.html:24-49` (bloco `.stage`), `index.html:54` (script tag)

**Interfaces:**
- Consumes: nada de tarefas anteriores diretamente, mas o nome do ficheiro `js/render-era-strip.js` (Task 1) tem de coincidir com o `src` do novo script tag.
- Produces: elementos `#eraStrip` (aside vazio, preenchido em runtime pela Task 4) e `#graphEmpty` (mensagem de estado vazio) — usados pela Task 3 (CSS) e Task 4 (`app.js`). Remove os elementos `#breadcrumbBar`, `#backBtn`, `#breadcrumbLabel`.

- [ ] **Step 1: Substituir o bloco `.stage`**

Substituir (linhas 24-49 de `index.html`):

```html
  <div class="stage">
    <div class="graph-wrap">
      <div class="breadcrumb-bar" id="breadcrumbBar" hidden>
        <button id="backBtn" class="back-btn" type="button">&larr; Voltar ao percurso</button>
        <span id="breadcrumbLabel" class="breadcrumb-label"></span>
      </div>
      <!-- viewBox is a pre-load fallback only; app.js recomputes it at runtime for whichever view is showing -->
      <svg id="graph" class="graph" viewBox="0 0 1200 500" role="group" aria-label="Mapa de personagens bíblicas e as suas relações">
        <defs id="defs"></defs>
        <g id="edges"></g>
        <g id="nodes"></g>
      </svg>
      <div class="controls">
        <button id="zoomIn" type="button" aria-label="Ampliar">+</button>
        <button id="zoomOut" type="button" aria-label="Reduzir">&minus;</button>
        <button id="zoomReset" type="button" aria-label="Repor vista">&#8634;</button>
      </div>
    </div>

    <aside id="panel">
      <button class="panel-close" id="panelClose" type="button">Fechar &times;</button>
      <div id="panelBody">
        <p class="panel-empty">Escolhe uma personagem no mapa para conheceres a sua história, o contexto histórico, as referências bíblicas e a família.</p>
      </div>
    </aside>
  </div>
```

por:

```html
  <div class="stage">
    <aside id="eraStrip" class="era-strip" aria-label="Lista de épocas"></aside>

    <div class="graph-wrap">
      <div id="graphEmpty" class="graph-empty">Escolhe uma época à esquerda para começares.</div>
      <!-- viewBox is a pre-load fallback only; app.js recomputes it at runtime for whichever view is showing -->
      <svg id="graph" class="graph" viewBox="0 0 1200 500" role="group" aria-label="Personagens bíblicas da época selecionada e as suas relações">
        <defs id="defs"></defs>
        <g id="edges"></g>
        <g id="nodes"></g>
      </svg>
      <div class="controls">
        <button id="zoomIn" type="button" aria-label="Ampliar">+</button>
        <button id="zoomOut" type="button" aria-label="Reduzir">&minus;</button>
        <button id="zoomReset" type="button" aria-label="Repor vista">&#8634;</button>
      </div>
    </div>

    <aside id="panel">
      <button class="panel-close" id="panelClose" type="button">Fechar &times;</button>
      <div id="panelBody">
        <p class="panel-empty">Escolhe uma personagem para conheceres a sua história, o contexto histórico, as referências bíblicas e a família.</p>
      </div>
    </aside>
  </div>
```

- [ ] **Step 2: Atualizar o `src` do script**

Em `index.html:54`, substituir:
```html
<script src="js/render-path.js"></script>
```
por:
```html
<script src="js/render-era-strip.js"></script>
```

- [ ] **Step 3: Verificar que não sobra nenhuma referência ao nome antigo**

Run: `grep -n "render-path\|breadcrumbBar\|backBtn\|breadcrumbLabel" index.html`
Expected: nenhum resultado.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace breadcrumb/back-button markup with era strip + empty-state placeholder"
```

---

### Task 3: Atualizar `style.css`

**Files:**
- Modify: `style.css:102-111` (inserir novas regras depois de `.graph-wrap`), `style.css:304-332` (media query mobile), `style.css:377-432` (remover regras mortas)

**Interfaces:**
- Consumes: os IDs/classes criados na Task 2 (`#eraStrip.era-strip`, `#graphEmpty.graph-empty`, `.era-item`, `.era-name`, `.era-count`).
- Produces: aparência visual completa da faixa e do estado vazio, para a Task 4 usar sem precisar de mais CSS.

- [ ] **Step 1: Inserir as novas regras a seguir a `.graph-wrap { ... }` (depois da linha 111)**

```css
.era-strip {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  background: var(--bg-2);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.era-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  border: none;
  background: none;
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: left;
  cursor: pointer;
}
.era-item:hover { background: var(--surface); color: var(--text); }
.era-item.active {
  background: var(--accent);
  color: var(--surface);
  font-weight: 600;
}
.era-name { flex: 1; }
.era-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  opacity: 0.8;
}

.graph-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  pointer-events: none;
}
```

Nota: `.era-item` está dentro de um `<aside>` (`#eraStrip`), por isso já herda a regra de foco existente `aside button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` (linha 205-207) — não é preciso adicionar nenhuma regra de foco nova.

- [ ] **Step 2: Remover o bloco de regras mortas (linhas 377-432)**

Remover por completo este bloco (deixa de haver breadcrumb/botão-voltar/estações SVG):

```css
.breadcrumb-bar {
  position: absolute;
  top: 0.8rem;
  left: 1rem;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.back-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  color: var(--text);
  cursor: pointer;
}
.back-btn:hover { border-color: var(--accent); color: var(--accent); }
.breadcrumb-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.station { cursor: pointer; }
.station-circle {
  fill: var(--surface);
  stroke: var(--accent);
  stroke-width: 2.6px;
  transition: stroke 0.2s ease, filter 0.2s ease;
}
.station:hover .station-circle, .station:focus-visible .station-circle {
  stroke: var(--accent-2);
  filter: drop-shadow(0 0 6px var(--accent-soft));
}
.station-count {
  font-family: var(--font-mono);
  font-size: 12px;
  fill: var(--accent-2);
  text-anchor: middle;
  pointer-events: none;
}
.station-label {
  font-family: var(--font-body);
  font-size: 11px;
  fill: var(--text-muted);
  pointer-events: none;
}
.path-line {
  stroke: var(--border);
  stroke-width: 4px;
  stroke-linecap: round;
}
```

(Substituir por nada — o ficheiro passa a terminar em `.cross-era-ref { ... }`, que já vinha a seguir a este bloco.)

- [ ] **Step 3: Atualizar a media query mobile (dentro do bloco `@media (max-width: 720px) { ... }`, linhas 304-332)**

Adicionar estas regras dentro do bloco existente (a seguir a `.topbar .instructions { display: none; }`, antes de `aside#panel { ... }`):

```css
  .stage { flex-direction: column; }
  .era-strip {
    width: auto;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    border-right: none;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .era-item { flex-shrink: 0; white-space: nowrap; }
```

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "style: add era-strip layout, remove dead breadcrumb/station CSS"
```

---

### Task 4: Atualizar `app.js` (orquestrador)

**Files:**
- Modify: `app.js:60-97` (declarações + `goToPath` + `goToEra` + listener do botão voltar), `app.js:280` (chamada inicial)

**Interfaces:**
- Consumes: `window.RenderEraStrip.renderEraStrip(erasWithCounts, activeEraNome, container, onSelectEra)` (Task 1); elementos `#eraStrip` e `#graphEmpty` (Task 2); classes `.era-item`/`.era-item.active` (Task 3, usadas indiretamente via `querySelector`).
- Produces: comportamento final de navegação — nada de outras tarefas depende disto.

- [ ] **Step 1: Substituir as três variáveis do breadcrumb**

Em `app.js:60-62`, substituir:
```js
    var breadcrumbBar = document.getElementById("breadcrumbBar");
    var breadcrumbLabel = document.getElementById("breadcrumbLabel");
    var backBtn = document.getElementById("backBtn");
```
por:
```js
    var eraStrip = document.getElementById("eraStrip");
    var graphEmpty = document.getElementById("graphEmpty");
```

- [ ] **Step 2: Substituir `goToPath` + `goToEra` + o listener do botão voltar**

Em `app.js:79-97`, substituir todo este bloco:
```js
    function goToPath() {
      defsLayer.innerHTML = '';
      breadcrumbBar.hidden = true;
      var dims = RenderPath.renderPath(erasWithCounts, edgeLayer, nodeLayer, goToEra);
      edgeEls = []; nodeEls = {};
      resetViewTo(dims);
      closePanel();
    }

    function goToEra(eraNome) {
      breadcrumbBar.hidden = false;
      breadcrumbLabel.textContent = eraNome;
      var result = RenderCluster.renderCluster(eraNome, NODES, EDGES, defsLayer, edgeLayer, nodeLayer, selectCharacter);
      edgeEls = result.edgeEls; nodeEls = result.nodeEls;
      resetViewTo(result);
      closePanel();
    }

    backBtn.addEventListener("click", goToPath);
```
por:
```js
    var activeEra = null;

    function renderStrip() {
      RenderEraStrip.renderEraStrip(erasWithCounts, activeEra, eraStrip, goToEra);
      var activeItem = eraStrip.querySelector('.era-item.active');
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    function goToEra(eraNome) {
      activeEra = eraNome;
      graphEmpty.hidden = true;
      var result = RenderCluster.renderCluster(eraNome, NODES, EDGES, defsLayer, edgeLayer, nodeLayer, selectCharacter);
      edgeEls = result.edgeEls; nodeEls = result.nodeEls;
      resetViewTo(result);
      renderStrip();
      closePanel();
    }
```

- [ ] **Step 3: Substituir a chamada inicial**

Em `app.js:280`, substituir:
```js
    goToPath();
```
por:
```js
    renderStrip();
```

- [ ] **Step 4: Verificar sintaxe**

Run:
```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node --check "app.js"
```
Expected: sem output.

- [ ] **Step 5: Verificar que não sobra nenhuma referência a `RenderPath`, `goToPath` ou `breadcrumb`**

Run: `grep -n "RenderPath\|goToPath\|breadcrumb" app.js`
Expected: nenhum resultado.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: wire era strip into orchestrator, remove path-screen navigation"
```

---

### Task 5: Verificação num browser real + regressão

**Files:** nenhum ficheiro modificado nesta tarefa (só verificação); corrigir inline qualquer problema encontrado nos ficheiros das Tasks 1-4 se necessário.

**Interfaces:** N/A — tarefa de verificação.

- [ ] **Step 1: Correr os testes de regressão de `js/layout.js` (não deve ter sido tocado)**

```bash
export PATH="/c/Users/isabel.c.a.faria/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"
node "scripts/test-layout.js"
```
Expected: todos os testes existentes continuam a passar (nenhuma alteração a `js/layout.js` nesta ronda).

- [ ] **Step 2: Servir o site localmente**

`index.html` não pode ser aberto via `file://` (o `fetch("data/personagens.json")` falha por CORS) — servir por `http://`. Criar um servidor estático mínimo (ex: reaproveitar o padrão já usado em rondas anteriores, um `http.createServer` em Node que serve ficheiros da raiz do projeto por extensão) e arrancá-lo numa porta local, ex. 8080.

- [ ] **Step 3: Abrir num Chrome headless com CDP e verificar cliques reais (não `dispatchEvent` sintético — ver aviso técnico do `handover.md`)**

Lançar `chrome.exe --headless=new --remote-debugging-port=<porta> --user-data-dir=<pasta temporária>`, abrir uma página apontada para `http://localhost:8080/index.html` via `PUT /json/new`, e usar `Input.dispatchMouseEvent` (mousePressed/mouseReleased) via WebSocket para simular cliques reais. Confirmar, por captura de ecrã (`Page.captureScreenshot`) em cada passo:

1. **Estado inicial:** a área central mostra a mensagem "Escolhe uma época à esquerda para começares." e nenhum item da faixa está `.active`.
2. **Selecionar uma época** (ex: clicar em "Os Patriarcas · Jacob" na faixa): a área central mostra a árvore/grelha dessa época; o item fica destacado (`.active`) na faixa.
3. **Selecionar outra época diretamente** (ex: clicar em "Rute" sem tocar em mais nada): a área central troca imediatamente para a nova época — sem precisar de nenhum botão "voltar" (que já não existe) e sem conteúdo da época anterior a aparecer por cima.
4. **Selecionar uma personagem** (ex: clicar num medalhão): o painel de detalhe abre à direita, fixo (sem sobrepor a faixa nem a área central).
5. **Trocar de época com o painel de detalhe aberto:** confirmar que o painel volta ao estado vazio ("Escolhe uma personagem…") ao trocar de época.
6. **"Ligações noutras eras"** a partir do cartão de uma personagem: confirmar que muda a época ativa na faixa (o item certo fica `.active` e visível, mesmo que estivesse fora da área visível da faixa antes) e abre a personagem certa no painel.
7. **Pesquisa** por nome: escolher um resultado de uma época diferente da atual e confirmar o mesmo comportamento do ponto 6.
8. **Viewport mobile** (redimensionar para largura ≤720px via `Emulation.setDeviceMetricsOverride`): confirmar que a faixa passa a barra horizontal no topo com scroll lateral, e que o painel de detalhe continua a abrir como bottom sheet.

- [ ] **Step 4: Corrigir inline qualquer problema encontrado**

Se algum dos pontos do Step 3 falhar, corrigir o ficheiro relevante (`app.js`, `style.css` ou `js/render-era-strip.js`) e repetir a verificação a partir do ponto que falhou.

- [ ] **Step 5: Parar os processos de apoio**

Parar o Chrome headless e o servidor estático (`Get-Process -Name node,chrome | Stop-Process -Force` ou equivalente) para não deixar processos pendurados.

- [ ] **Step 6: Commit (só se o Step 4 tiver alterado algum ficheiro)**

```bash
git add -A
git commit -m "fix: address issues found in real-browser verification of era strip"
```
