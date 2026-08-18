# Handover — Os Personagens da Bíblia

Projeto iniciado em 2026-08-16, já com 5 rondas de trabalho integradas em `master`. Última atualização: 2026-08-18, fim da Ronda 5 (Jeremias). Contexto para continuar este projeto noutra sessão.

## O projeto

Site para a **Paróquia da Póvoa de Santa Iria**: "Os Personagens da Bíblia" — um grafo navegável com as personagens da Bíblia, ordenadas cronologicamente, mostrando relações entre elas, referências bíblicas e a sua importância na história. Deve ser muito interativo, tipo jogo, para poder ser usado por crianças na catequese.

Promotora: Isabel, diretora técnica de uma farmácia militar, católica, envolvida na paróquia. Sem experiência técnica/programação.

## Decisões tomadas

- **Âmbito bíblico:** cânone católico completo, incluindo deuterocanónicos.
- **Estilo de interação:** exploração livre do grafo (sem quizzes, pontos ou missões).
- **Escala pretendida:** o máximo de personagens possível, sem limite artificial — mas sem prazo definido, ritmo livre.
- **Stack:** simplicidade acima de tudo, dado que a Isabel não tem experiência técnica. Site estático, conteúdo separado do "motor" (idealmente ficheiro de dados simples tipo JSON), hosting gratuito.

## O que foi feito

### Protótipo "Constelação Bíblica" → redesign visual e de conteúdo, já no repositório

O protótipo inicial (20 personagens) foi publicado como Artifact e é a origem do conceito. Esse Artifact continua acessível mas está desatualizado:
https://claude.ai/code/artifact/db49ef11-59ed-4cee-ba20-cf7c01c4b171

**O código a usar/manter é agora o deste repositório**, não o Artifact. Um plano de 7 tarefas ("redesign-visual-conteudo", 2026-08-16) reescreveu o motor e ampliou o conteúdo; desde então o conteúdo cresceu ao longo de várias rondas: Ronda 2 deu retrato único a cada personagem, Ronda 3 cobriu Juízes/Rute/Samuel/Reis até ao reino dividido, Ronda 4 acrescentou Isaías (elenco pequeno, sobretudo profecia) e a Ronda 5 (2026-08-18) acrescentou o livro de Jeremias (Jeremias, Baruque, Joaquim, Sedequias, Godolias, Ebede-Meleque, Nabucodonosor — elenco maior porque Jeremias narra episódios concretos, não só oráculo). Ficheiros:

- `index.html` — estrutura da página.
- `style.css` — visual (tema claro pergaminho/âmbar, tipografia serif Georgia para nomes + sans do sistema para o resto; layout responsivo com painel lateral em desktop e "bottom sheet" em mobile via `@media (max-width: 720px)`).
- `app.js` — motor do grafo: lê `data/personagens.json` via `fetch`, desenha nós/ligações em SVG, pan/zoom por arrasto e botões, abre o painel de detalhe ao clicar num nó.
- `data/personagens.json` — os dados: 82 personagens (`personagens[]`, cada um com id/nome/tipo/retrato/tier/x/y/era/refs/resumo/contexto/relacoes) e 75 ligações (`edges[]` — pai/mãe, casamento, irmãos, "várias gerações depois"). `layout` é `{ width: 3300, height: 820 }` — tem de bater certo com o `viewBox` do `<svg id="graph">` em `index.html`.
- `assets/icons/` — ícones SVG por `tipo` de personagem (reserva, caso falte um retrato).
- `assets/retratos/` — retratos SVG individuais por personagem (um por cada uma das 82), referenciados pelo campo `retrato` de cada entrada em `personagens.json`.

⚠️ **`index.html` não pode ser aberto diretamente com `file://`** — o `fetch("data/personagens.json")` falha por CORS na maioria dos browsers. É preciso servir a pasta por `http://` (ex: skill `run`, ou qualquer servidor estático simples).

QA final (2026-08-16, sessão inicial): mobile viewport confirmado (instruções e rodapé escondem-se, painel abre como bottom sheet com botão "Fechar ×" funcional); as 34 personagens então existentes confirmadas com contexto/resumo/relações preenchidos (verificado via clique real em todas, usando Chrome DevTools Protocol já que não havia Node/Python disponíveis na máquina). Corrigida uma sobreposição visual: a ligação de irmãos Arão↔Miriam passava em cima do medalhão de Moisés (os três estavam alinhados); Arão foi deslocado ligeiramente (`x: 1420` → `1460`).

### Processo de trabalho estabelecido (repetido em todas as rondas de conteúdo)

Cada ronda de conteúdo (Rondas 2 a 5) seguiu o mesmo fluxo, que resultou bem e vale a pena repetir:

1. **Brainstorming curto** com a Isabel para acordar o âmbito (que personagens, que livro).
2. **Spec** em `docs/superpowers/specs/YYYY-MM-DD-<tema>-design.md`.
3. **Plano de implementação** em `docs/superpowers/plans/YYYY-MM-DD-<tema>.md` — conteúdo e retrato sempre feitos juntos na mesma tarefa (decisão da Isabel a partir da Ronda 3).
4. **Execução via subagent-driven-development** (skill `superpowers:subagent-driven-development`) num **git worktree isolado** (skill `superpowers:using-git-worktrees`, tool `EnterWorktree`/`ExitWorktree`) — nunca implementar diretamente em `master`.
5. **Revisão de cada tarefa** por um subagent revisor (verifica cumprimento do plano + qualidade), depois **revisão final de branch inteira** por um subagent no modelo mais capaz disponível (`opus`). Nota (Ronda 5): se `opus` devolver erro 529 (sobrecarga do servidor) repetidamente, é razoável cair para `sonnet` para não bloquear a ronda — já há duas camadas de verificação independentes antes deste passo (revisão de tarefa + testes de clique real + auditoria geométrica), por isso a perda de rigor é pequena.
6. **Verificação num browser real** (não só `dispatchEvent` sintético — ver aviso técnico abaixo) e **auditoria automática de distinção geométrica** aos retratos (ver script abaixo).
7. **Merge local para `master`** via skill `superpowers:finishing-a-development-branch`, depois `git worktree remove` + `git branch -d` da branch de trabalho.
8. Atualizar `handover.md` e a memória persistente do projeto no fim.

### Ambiente técnico (armadilhas já resolvidas, para não repetir a descoberta)

- **Node.js** está instalado mas normalmente não fica no PATH da shell persistente — antepor sempre `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64` ao PATH em cada comando que precise de `node`.
- **Chrome** está em `C:\Program Files\Google\Chrome\Application\chrome.exe` — usado em modo `--headless=new --remote-debugging-port=<porta>` para testes de clique reais via protocolo CDP puro (WebSocket nativo do Node 24, sem dependências). Isto é importante: um bug real de clique só apareceu ao testar com um pipeline de rato real (`mousePressed`/`mouseReleased` via `Input.dispatchMouseEvent`), nunca com `dispatchEvent` sintético em JS — ver a lição gravada na memória do projeto. Nota: em Chrome recente, `/json/new` do CDP exige verbo **PUT**, não GET.
- **Servir o site**: `fetch("data/personagens.json")` falha por CORS se abrires `index.html` via `file://`. Um pequeno servidor Node estático (root + porta como argumentos) resolve — não existe um ficheiro deste tipo guardado no repositório, é reescrito de sessão para sessão a partir do scratchpad; pode valer a pena guardá-lo no repo (ex: `scripts/dev-server.js`) numa próxima ronda.
- **Auditoria geométrica de retratos**: também não está guardada no repositório — é um script Node que lê todos os `assets/retratos/*.svg`, extrai atributos de forma (ignorando `fill`/`stroke`) de cada elemento, e sinaliza pares com ≥60% de sobreposição de "tokens" de forma. Provou o seu valor na Ronda 4 (encontrou o par Adão/Abraão, não detetado antes) mas produz também bastante ruído (elementos genéricos como o retângulo do pescoço contam para a sobreposição) — os pares sinalizados precisam sempre de confirmação manual, não são veredito automático. Vale a pena formalizar este script no repositório e refinar o algoritmo (ex: dar menos peso a elementos reconhecidamente partilhados por convenção) numa próxima ronda, em vez de o reescrever de raiz sempre que é preciso.
- **`H:` (Google Drive) pode desmontar-se a meio da sessão** — já aconteceu uma vez (o worktree pareceu ter "desaparecido"). Se um comando disser que o diretório não existe, testar `Test-Path "H:\"` antes de assumir que algo foi apagado; o disco geralmente volta a montar-se sozinho.
- **`git worktree remove` pode falhar com "Permission denied"** — normalmente por um processo `node.exe` ainda a correr (servidor estático) ou por bloqueio de sincronização do Google Drive. Parar processos `node` (`Get-Process -Name node | Stop-Process -Force`) costuma resolver.

### Configuração do projeto

Criado `.claude/settings.json` na raiz do projeto com dois plugins:

```json
{
  "extraKnownMarketplaces": {
    "superpowers-marketplace": {
      "source": { "source": "github", "repo": "obra/superpowers-marketplace" }
    }
  },
  "enabledPlugins": {
    "superpowers@superpowers-marketplace": true,
    "frontend-design@claude-plugins-official": true
  }
}
```

- **superpowers** — biblioteca de skills (TDD, debugging, planeamento, colaboração) de Jesse Vincent.
- **frontend-design** — plugin oficial da Anthropic para trabalho de design de interface.

⚠️ **Pendente:** estas alterações só são lidas ao arrancar o Claude Code. É preciso **reiniciar a sessão** (sair e reabrir o Claude Code nesta pasta) para a marketplace `superpowers-marketplace` ser descarregada e os plugins ativarem. Confirmar depois com `/plugin`.

## Por decidir / próximos passos

1. A Isabel precisa de ver e dar feedback ao novo visual "Livro de Ilustrações" (já implementado nesta branch, substituindo o conceito anterior "mapa de estrelas") — validar se resulta bem para crianças, nomeadamente a legibilidade dos ícones nas personagens de menor destaque ("tier": "minor").
2. Validar o nível de detalhe dos cartões de personagem (resumo + família) — ajustar para catequese se necessário.
3. Expansão de conteúdo: Génesis, Êxodo, Juízes, Rute, Samuel, Reis (reino dividido), Isaías e agora Jeremias já estão cobertos — 82 personagens no total. Falta o resto da Bíblia — Ezequiel e os 12 profetas menores foram deliberadamente deixados fora da Ronda 5 (elenco quase só de visão/oráculo, sem episódios narrados) e ficam para uma ronda futura a decidir com a Isabel; depois disso, exílio/pós-exílio (Esdras, Neemias, Ester, Daniel), Evangelhos, Atos, Cartas.
4. ~~Ainda não há repositório git nem ficheiros de código na pasta do projeto~~ — feito: o código (`index.html`/`style.css`/`app.js`/`data/personagens.json`) já está no repositório, ver secção "O que foi feito" acima. Falta ainda decidir onde/como publicar (hosting gratuito) para a Isabel poder ver a versão a correr fora desta sessão.
5. Confirmar após reiniciar a sessão que os plugins **superpowers** e **frontend-design** ativaram corretamente.
6. **Retoque de retratos (achado da Ronda 4, ainda não corrigido):** ao correr um script de auditoria geométrica automática (compara formas, não só cores) a todo o elenco, apareceram 30 pares com ≥60% de sobreposição de forma — o mesmo conjunto de 30 se manteve ao correr de novo na Ronda 5 com os 82 personagens (nenhum retrato novo da Ronda 5 entrou nesta lista). A maioria é provavelmente ruído do próprio script (elementos genéricos partilhados de propósito, como o retângulo do pescoço), mas pelo menos um par é um quase-clone genuíno e não detetado antes: **Adão e Abraão** partilham o traço da roupa, o pescoço, o nariz e as sobrancelhas byte a byte idênticos — só cor de pele/cabelo/roupa muda. Continuam também por resolver os dois pares já identificados na Ronda 3: Jacob/José (olhos e nariz) e Mical/Sara (cara/orelhas). A revisão final da Ronda 5 encontrou ainda **Baruque e Godolias** como o par mais parecido entre os retratos novos — não é um clone (distinguem-se por cor e pequenos detalhes), mas foi o par mais próximo encontrado, vale a pena vigiar se se juntar mais alguém parecido no futuro. Vale a pena uma ronda dedicada só a retocar retratos antigos, correndo o script a sério contra falsos positivos.
7. **Texto desatualizado em `index.html`** — o cabeçalho ainda diz "Génesis & Êxodo", desatualizado desde a Ronda 2 (o grafo já vai até Jeremias). Correção pequena, por decidir quando fazer.

## Memória guardada

Memórias persistentes em `~/.claude/projects/.../memory/`, atualizadas até ao fim da Ronda 5:
- `user_profile.md` — perfil da Isabel (farmacêutica, diretora técnica, católica praticante, sem background técnico).
- `project_personagens_biblia.md` — decisões, progresso ronda a ronda, e lições de processo (quase-clones de retratos, testar cliques a sério em vez de sintético). É o ficheiro mais importante a rever ao retomar este projeto — tem mais detalhe do que este handover sobre o "porquê" de cada decisão.
