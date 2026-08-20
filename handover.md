# Handover — Os Personagens da Bíblia

Projeto iniciado em 2026-08-16, já com 6 rondas de conteúdo integradas em `master`, mais Ronda 7 (redesign de navegação, Sub-projeto A) e Ronda 8 (personagens e ligações em falta). Última atualização: 2026-08-20, fim da Ronda 8. Contexto para continuar este projeto noutra sessão.

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

**O código a usar/manter é agora o deste repositório**, não o Artifact. Um plano de 7 tarefas ("redesign-visual-conteudo", 2026-08-16) reescreveu o motor e ampliou o conteúdo; desde então o conteúdo cresceu ao longo de várias rondas: Ronda 2 deu retrato único a cada personagem, Ronda 3 cobriu Juízes/Rute/Samuel/Reis até ao reino dividido, Ronda 4 acrescentou Isaías, Ronda 5 acrescentou Jeremias, e a Ronda 6 (2026-08-18) acrescentou Ezequiel e os 12 profetas menores (Oséias + Gómer, Amós + Amasias, Jonas, Miqueias, Naum, Habacuc, Sofonias, Ageu, Zacarias, Malaquias, Joel, Abdias — 15 personagens, a maior densidade de personagens do mesmo tipo "profeta" já feita numa só ronda). Ficheiros:

- `index.html` — estrutura da página.
- `style.css` — visual (tema claro pergaminho/âmbar, tipografia serif Georgia para nomes + sans do sistema para o resto; layout responsivo com painel lateral em desktop e "bottom sheet" em mobile via `@media (max-width: 720px)`).
- `app.js` — desde a Ronda 7, já não é o motor de desenho: ficou reduzido a **orquestrador** — estado de navegação (percurso ↔ era), pesquisa, e o painel de detalhe de cada personagem (incluindo as ligações a outras eras). O desenho em si está agora em `js/render-path.js` e `js/render-cluster.js` (ver abaixo).
- `js/layout.js` — funções puras de cálculo de layout (árvore genealógica + grelha), sem dependência do DOM; tem o seu próprio script de teste, `scripts/test-layout.js`.
- `js/render-path.js` e `js/render-cluster.js` — desenham, respetivamente, o ecrã do percurso (as 33 eras, uma espécie de "mapa" narrativo) e o ecrã de cada era/cluster (a árvore genealógica + grelha de uma era).
- `data/personagens.json` — os dados: 105 personagens (`personagens[]`, cada um com id/nome/tipo/retrato/tier/era/refs/resumo/contexto/relacoes) e 92 ligações (`edges[]` — pai/mãe, casamento, irmãos, "várias gerações depois"). **Desde a Ronda 7, os campos `x`/`y` por personagem e o bloco `layout` de topo (`{ width, height }`) são vestigiais** — continuam nas 97 personagens mais antigas mas já não são lidos por nada, e as 8 personagens novas da Ronda 8 já nem sequer os têm (deixaram de ser precisos desde que a posição passou a ser calculada em tempo real a partir da era, das ligações familiares e do `tier`). O ficheiro tem também um array de topo `eras` (33 entradas, `{nome, descricao}`) que define a ordem narrativa usada pelo ecrã do percurso.
- `assets/icons/` — ícones SVG por `tipo` de personagem (reserva, caso falte um retrato).
- `assets/retratos/` — retratos SVG individuais por personagem (um por cada uma das 97), referenciados pelo campo `retrato` de cada entrada em `personagens.json`.
- `scripts/geometry-audit.js` — **novo na Ronda 6**: script Node que estava sempre a ser reescrito de raiz em sessões anteriores, agora guardado no repositório. Uso: `node scripts/geometry-audit.js assets/retratos`. Ver secção de armadilhas técnicas abaixo para detalhe e limitações.

### Ronda 7 — Redesign de navegação, Sub-projeto A (2026-08-19)

O grafo original desenhava as 97 personagens todas de uma vez num único mapa achatado, com coordenadas `x`/`y` colocadas à mão em `personagens.json` — a Isabel achou o resultado "confuso" à medida que o elenco cresceu. Esta ronda (Sub-projeto A do redesign) substitui esse modelo por uma navegação em duas camadas: um ecrã de **percurso** com as 33 eras da narrativa bíblica como "estações" (novo `js/render-path.js`), e ao escolher uma era, um ecrã de **cluster** dessa era só (novo `js/render-cluster.js`), com a genealogia das personagens ligadas desenhada como árvore e as restantes numa grelha. As posições deixaram de ser dados fixos e passaram a ser calculadas em tempo real (`js/layout.js`, testado por `scripts/test-layout.js`) a partir da era, das ligações familiares e do `tier` de cada personagem. Foi também acrescentada pesquisa por nome/era (com resultados navegáveis por teclado) e ligações clicáveis entre personagens de eras diferentes dentro do cartão de detalhe ("Ligações noutras eras"). `app.js` deixou de desenhar seja o que for e passou a orquestrador (estado de navegação, pesquisa, painel). Isto fecha a queixa de "confuso" que motivou todo o redesign. Uma revisão final de branch inteira encontrou 8 problemas (1 crítico — o ecrã de percurso ainda ficava demasiado esticado/ilegível numa só fila — mais 7 de acessibilidade, sobreposição visual e limpeza) que foram todos corrigidos antes do merge; ver secção "Por decidir" para o que ficou deliberadamente fora desta ronda.

### Ronda 8 — Personagens e Ligações em Falta (2026-08-20)

Depois de testar o site redesenhado, a Isabel reparou que a Betsabé mencionava ter casado com Urias, mas Urias não existia como personagem — não havia como mostrar essa relação. Uma auditoria ao ficheiro completo confirmou que não era um caso isolado: 8 pessoas mencionadas pelo nome no texto de outras personagens nunca tinham ganho nó próprio, e havia 2 ligações em falta entre personagens já existentes apesar de o texto as descrever. Esta ronda acrescentou **Urias, Jessé, Nabal, Calebe, Elcana, Hofni, Finéias e Efraim** (8 personagens, conteúdo+retrato juntos como sempre) e fechou as 15 ligações correspondentes (13 novas + `ana→samuel` + `absalao→salomao`). Uma simplificação real trazida pela Ronda 7: como a posição já não depende de `x`/`y`, esta ronda não precisou de planear coordenadas nem verificar sobreposições. A revisão de tarefa apanhou uma contradição de conteúdo real (a nova entrada do Calebe dizia "irmão de Otoniel", mas a entrada já existente do Otoniel dizia "sobrinho de Calebe") — corrigida antes do merge. A revisão final de branch, ao alargar essa verificação a todo o elenco, descobriu que este tipo de lacuna é muito mais comum do que se pensava — ver item 12 abaixo.

⚠️ **`index.html` não pode ser aberto diretamente com `file://`** — o `fetch("data/personagens.json")` falha por CORS na maioria dos browsers. É preciso servir a pasta por `http://` (ex: skill `run`, ou qualquer servidor estático simples).

QA final (2026-08-16, sessão inicial): mobile viewport confirmado (instruções e rodapé escondem-se, painel abre como bottom sheet com botão "Fechar ×" funcional); as 34 personagens então existentes confirmadas com contexto/resumo/relações preenchidos (verificado via clique real em todas, usando Chrome DevTools Protocol já que não havia Node/Python disponíveis na máquina). Corrigida uma sobreposição visual: a ligação de irmãos Arão↔Miriam passava em cima do medalhão de Moisés (os três estavam alinhados); Arão foi deslocado ligeiramente (`x: 1420` → `1460`).

### Processo de trabalho estabelecido (repetido em todas as rondas de conteúdo)

Cada ronda de conteúdo (Rondas 2 a 6, e novamente a Ronda 8) seguiu o mesmo fluxo, que resultou bem e vale a pena repetir:

1. **Brainstorming curto** com a Isabel para acordar o âmbito (que personagens, que livro).
2. **Spec** em `docs/superpowers/specs/YYYY-MM-DD-<tema>-design.md`.
3. **Plano de implementação** em `docs/superpowers/plans/YYYY-MM-DD-<tema>.md` — conteúdo e retrato sempre feitos juntos na mesma tarefa (decisão da Isabel a partir da Ronda 3).
4. **Execução via subagent-driven-development** (skill `superpowers:subagent-driven-development`) num **git worktree isolado** (skill `superpowers:using-git-worktrees`, tool `EnterWorktree`/`ExitWorktree`) — nunca implementar diretamente em `master`.
5. **Revisão de cada tarefa** por um subagent revisor (verifica cumprimento do plano + qualidade), depois **revisão final de branch inteira** por um subagent no modelo mais capaz disponível (`opus`). Nota (Ronda 5): se `opus` devolver erro 529 (sobrecarga do servidor) repetidamente, é razoável cair para `sonnet` para não bloquear a ronda — já há duas camadas de verificação independentes antes deste passo (revisão de tarefa + testes de clique real + auditoria geométrica), por isso a perda de rigor é pequena. Nota (Ronda 6): se a revisão final for interrompida por limite de sessão (não erro de servidor) e a Isabel disser para avançar sem insistir em mais verificação, é aceitável o próprio controlador fazer uma verificação final direta (consistência do JSON, arestas, viewBox, `git diff --stat` para disciplina de âmbito) em vez de voltar a despachar a revisão completa — mas registar claramente no handover/memória o que ficou por verificar de forma exaustiva, para não passar por "revisão final completa" quando não foi.
6. **Verificação num browser real** (não só `dispatchEvent` sintético — ver aviso técnico abaixo) e **auditoria automática de distinção geométrica** aos retratos (ver script abaixo).
7. **Merge local para `master`** via skill `superpowers:finishing-a-development-branch`, depois `git worktree remove` + `git branch -d` da branch de trabalho.
8. Atualizar `handover.md` e a memória persistente do projeto no fim.

### Ambiente técnico (armadilhas já resolvidas, para não repetir a descoberta)

- **Node.js** está instalado mas normalmente não fica no PATH da shell persistente — antepor sempre `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64` ao PATH em cada comando que precise de `node`.
- **Chrome** está em `C:\Program Files\Google\Chrome\Application\chrome.exe` — usado em modo `--headless=new --remote-debugging-port=<porta>` para testes de clique reais via protocolo CDP puro (WebSocket nativo do Node 24, sem dependências). Isto é importante: um bug real de clique só apareceu ao testar com um pipeline de rato real (`mousePressed`/`mouseReleased` via `Input.dispatchMouseEvent`), nunca com `dispatchEvent` sintético em JS — ver a lição gravada na memória do projeto. Nota: em Chrome recente, `/json/new` do CDP exige verbo **PUT**, não GET.
- **Servir o site**: `fetch("data/personagens.json")` falha por CORS se abrires `index.html` via `file://`. Um pequeno servidor Node estático (root + porta como argumentos) resolve — não existe um ficheiro deste tipo guardado no repositório, é reescrito de sessão para sessão a partir do scratchpad; pode valer a pena guardá-lo no repo (ex: `scripts/dev-server.js`) numa próxima ronda.
- **Auditoria geométrica de retratos**: desde a Ronda 6 vive no repositório em `scripts/geometry-audit.js` (uso: `node scripts/geometry-audit.js assets/retratos`) — deixou de ser reescrito de sessão para sessão. Lê todos os `assets/retratos/*.svg`, extrai atributos de forma (ignorando `fill`/`stroke`) de cada elemento, e sinaliza pares com ≥60% de sobreposição de "tokens" de forma. Provou o seu valor na Ronda 4 (encontrou o par Adão/Abraão, não detetado antes) mas produz também bastante ruído (elementos genéricos como o retângulo do pescoço contam para a sobreposição) — os pares sinalizados precisam sempre de confirmação manual, não são veredito automático. O algoritmo em si ainda não foi refinado (ex: dar menos peso a elementos reconhecidamente partilhados por convenção) — continua a ser um alvo razoável para uma próxima ronda técnica.
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
3. Expansão de conteúdo: Génesis, Êxodo, Juízes, Rute, Samuel, Reis (reino dividido), Isaías, Jeremias, Ezequiel e os 12 profetas menores já estão cobertos — 105 personagens no total (97 + 8 da Ronda 8). **Deliberadamente fora da Ronda 6** (para uma ronda futura de exílio/pós-exílio): Zorobabel e o sumo sacerdote Josué (Jesua), ligados a Ageu/Zacarias mas mais naturalmente tratados junto de Esdras/Neemias/Ester/Daniel, onde a reconstrução do Templo é aprofundada. Falta o resto da Bíblia: exílio/pós-exílio, Evangelhos, Atos, Cartas.
4. ~~Ainda não há repositório git nem ficheiros de código na pasta do projeto~~ — feito: o código (`index.html`/`style.css`/`app.js`/`data/personagens.json`) já está no repositório, ver secção "O que foi feito" acima. Falta ainda decidir onde/como publicar (hosting gratuito) para a Isabel poder ver a versão a correr fora desta sessão.
5. Confirmar após reiniciar a sessão que os plugins **superpowers** e **frontend-design** ativaram corretamente.
6. **Retoque de retratos (achado da Ronda 4, ainda não corrigido):** ao correr o script de auditoria geométrica (agora em `scripts/geometry-audit.js`) a todo o elenco, aparecem 30 pares com ≥60% de sobreposição de forma — o mesmo conjunto exato de 30 mantém-se desde a Ronda 4 até à Ronda 6 (97 personagens), nenhum retrato das Rondas 5-6 entrou nesta lista. A maioria é provavelmente ruído do próprio script (elementos genéricos partilhados de propósito, como o retângulo do pescoço), mas pelo menos um par é um quase-clone genuíno e não detetado antes: **Adão e Abraão** partilham o traço da roupa, o pescoço, o nariz e as sobrancelhas byte a byte idênticos — só cor de pele/cabelo/roupa muda. Continuam também por resolver os dois pares já identificados na Ronda 3: Jacob/José (olhos e nariz) e Mical/Sara (cara/orelhas). Pares "mais próximos mas não-clone" identificados em rondas seguintes, a vigiar: Baruque/Godolias (Ronda 5), Ezequiel/Nabucodonosor — eco do mesmo motivo de turbante/faixa dourada, mas com coordenadas diferentes (Ronda 6), e a família de "cabelo em três picos" partilhada por Naum/Sofonias/Joel — parametrizada de forma diferente em cada um, não sinalizada pelo script (Ronda 6). Vale a pena uma ronda dedicada só a retocar retratos antigos, correndo o script a sério contra falsos positivos.
7. **Texto desatualizado em `index.html`** — o cabeçalho ainda diz "Génesis & Êxodo", desatualizado desde a Ronda 2 (o grafo já vai até Ezequiel e os profetas menores). Correção pequena, por decidir quando fazer.
8. **Revisão final da Ronda 6 incompleta (achado desta ronda):** a revisão final de branch em `opus` foi interrompida por limite de sessão antes de terminar a comparação exaustiva dos 15 retratos novos entre si. A Isabel pediu explicitamente para não insistir nisso agora e avançar — o controlador fez uma verificação final mais leve (consistência do JSON, arestas, viewBox, disciplina de âmbito, todos confirmados corretos), apoiada em duas revisões de tarefa já aprovadas e na própria auditoria geométrica do controlador (sem novos pares sinalizados). Ainda assim, esta ronda não teve o mesmo nível de comparação manual exaustiva de retratos que as Rondas 4-5 tiveram — vale a pena ter isto em mente se aparecerem problemas de semelhança entre os 15 personagens desta ronda no futuro.
9. **Sub-projetos B e C do redesign de navegação, ainda por fazer:** a Ronda 7 só implementou o Sub-projeto A (navegação em duas camadas percurso → cluster). Ficam pendentes o **Sub-projeto B** (cartões de personagem mais ricos) e o **Sub-projeto C** (vista histórica/cronológica alternativa) da spec original do redesign.
10. **Lacuna de conteúdo encontrada na revisão final da Ronda 7:** 40 das 97 personagens não têm nenhuma ligação (`edges`) a mais ninguém, e pelo menos uma era ("1 Samuel · Ana e Samuel") não tem sequer uma ligação interna entre as suas próprias personagens-título. Não é um problema de código — é uma lacuna de curadoria de conteúdo para uma ronda futura.
11. **Ideia para uma futura ronda técnica:** um script `scripts/layout-audit.js` que percorra todas as 33 eras a verificar automaticamente o que esta revisão final verificou à mão — filas de pai/filho invertidas, pares cônjuge/irmão fora da mesma fila, halos sobrepostos, linhas a passar em cima de medalhões, proporção largura/altura razoável por era. Mecanizaria este tipo de revisão em vez de a repetir manualmente a cada ronda.
12. **Lacuna de conteúdo muito maior do que se pensava (achado da Ronda 8):** a revisão final dessa ronda alargou a verificação manual (que apanhou a contradição Calebe/Otoniel) a todo o elenco e encontrou **67 pares** de personagens já existentes cujo texto descreve uma relação entre si sem que exista a aresta correspondente — por exemplo, Noemi e Rute descrevem-se mutuamente como sogra/nora em ambos os textos, mas não há nenhuma ligação entre elas (Noemi não tem, aliás, nenhuma ligação a ninguém). Isto é exatamente o mesmo tipo de lacuna que motivou a Ronda 8, só que em muito maior escala — candidato forte a uma ronda dedicada própria (não cabe numa correção pontual). Achados menores relacionados, também por corrigir: a nova personagem Efraim não é mencionada no texto do José (só no do Josué), e duas pessoas mencionadas nesta ronda (Penina, mulher de Elcana; Icabode, neto de Eli) continuam sem nó, por decisão deliberada (menções de passagem).

## Memória guardada

Memórias persistentes em `~/.claude/projects/.../memory/`, atualizadas até ao fim da Ronda 8:
- `user_profile.md` — perfil da Isabel (farmacêutica, diretora técnica, católica praticante, sem background técnico).
- `project_personagens_biblia.md` — decisões, progresso ronda a ronda, e lições de processo (quase-clones de retratos, testar cliques a sério em vez de sintético). É o ficheiro mais importante a rever ao retomar este projeto — tem mais detalhe do que este handover sobre o "porquê" de cada decisão.
