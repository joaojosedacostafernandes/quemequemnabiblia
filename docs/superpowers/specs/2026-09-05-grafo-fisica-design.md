# Grafo com Física — redesign visual e de navegação (Ronda 11)

## Motivação

Depois de a Ronda 10 (faixa de épocas) ficar integrada, a Isabel pediu para ver o site a correr e reagiu: "quero mais dinâmica". Ao explorar o que isso significava, descobrimos que já existia uma exploração visual muito mais avançada, feita numa sessão anterior que nunca chegou a ser documentada no `handover.md` nem integrada no código — dois mockups autónomos guardados em `.superpowers/brainstorm/` (`mockup-grafo-A-capitulos.html` e `mockup-grafo-B-comeco-unico.html`, ambos de 2026-08-28), com um motor de grafo com física real (repulsão, molas, amortecimento), tema escuro/estrelado, e praticamente todo o conteúdo real das 105 personagens já escrito à mão dentro do ficheiro. A Isabel confirmou que era esta a direção que tinha em mente.

Esta ronda formaliza essa direção como o novo motor de renderização do site, substituindo por completo o tema claro "Livro de Ilustrações" (pergaminho/âmbar) e o modelo de navegação por faixa de épocas das Rondas 7–10.

## Decisões tomadas (brainstorming, 2026-09-05)

- **Ponto de partida:** 7 nós "capítulo" (As Origens, Os Patriarcas, O Êxodo, Josué e os Juízes, Os Reis, Os Grandes Profetas, Os Profetas Menores), com física entre eles desde o arranque — não a Opção B (começar só com Adão).
- **Ao clicar num capítulo:** a "bola" (círculo com brilho) desse capítulo desaparece; fica só o texto do título, ancorado nessa mesma posição (não uma barra fixa no topo do ecrã — cada capítulo aberto mantém o seu próprio título, no seu próprio lugar, para que abrir vários capítulos ao longo da exploração não faça um substituir o outro). As personagens diretamente ligadas a esse capítulo aparecem à volta, presas a essa posição pela física tal como estavam presas ao nó antes de desaparecer.
- **Ao clicar numa personagem:** revela as personagens ligadas a ela (a árvore genealógica vai-se descobrindo progressivamente, nunca as 105 de uma vez) **e** abre o painel de detalhe completo (o mesmo conteúdo rico que já existe: resumo, contexto histórico, família, referências bíblicas, ligações a outras eras).
- **Ao passar o rato por cima de uma personagem:** mostra uma prévia rápida (nome, era, relação) numa **caixa fixa no canto direito do ecrã** — não uma tooltip flutuante que segue o cursor (como o mockup original tinha). Ao clicar, essa mesma caixa fixa preenche-se com a história completa. Isto aplica ao hover o mesmo princípio já pedido na Ronda 10 para o painel de detalhe: informação sempre fixa, nunca a sobrepor o que se está a explorar.
- **Capítulos não selecionados:** depois de se clicar num, os restantes devem afastar-se mais para a esquerda (ajuste de espaçamento na física, não uma reestruturação em lista — ao contrário da faixa de épocas da Ronda 10).
- **Limites do ecrã e sobreposições:** a simulação de física é obrigada a (a) nunca deixar um nó sair da área visível do ecrã, e (b) usar repulsão suficientemente forte para minimizar sobreposição de linhas/texto/imagens entre personagens. **Ressalva aceite pela Isabel:** uma simulação de física reduz muito estas sobreposições mas não as consegue garantir a 100% em todos os casos (clusters muito densos, como "Os Reis" com 13 personagens) — isto será verificado com testes reais durante a implementação, não é uma promessa absoluta.
- **Posição não é fixa por personagem:** ao contrário de uma alternativa considerada e rejeitada, a posição de cada personagem pode variar consoante o que já está no ecrã — só as duas regras acima (limites + repulsão) são obrigatórias.
- **Tema:** substituição completa do tema claro "Livro de Ilustrações" pelo tema escuro/estrelado do mockup — sem opção de alternar entre os dois.
- **Dados:** `data/personagens.json` continua a ser a única fonte de conteúdo. Não se duplicam dados manualmente à parte (ao contrário do mockup, que tinha tudo escrito à mão dentro do HTML) — o motor lê o ficheiro tal como hoje.
- **"Reveals" calculados automaticamente:** ao contrário do mockup (que tinha uma lista `reveals` escrita à mão por personagem), o novo motor deriva essa árvore de revelação automaticamente a partir dos `edges` que já existem (pai/mãe, casamento, irmãos) — para a Isabel continuar a conseguir acrescentar uma personagem nova só editando o JSON, sem escrever manualmente o que essa personagem "revela".

## Desenho técnico

### Novo array de dados: `capitulos`

Acrescenta-se um array de topo em `data/personagens.json`, irmão do já existente `eras`:

```json
"capitulos": [
  { "nome": "As Origens", "arranque": ["adao", "noe"] },
  { "nome": "Os Patriarcas", "arranque": ["abraao"] },
  { "nome": "O Êxodo", "arranque": ["moises", "miriam", "arao", "farao"] },
  { "nome": "Josué e os Juízes", "arranque": ["josue", "calebe", "otoniel", "eude", "debora", "baraque", "jael", "gideao", "jefte", "sansao", "dalila", "noemi", "rute"] },
  { "nome": "Os Reis", "arranque": ["elcana", "eli", "jesse", "golias", "natan", "rainha_seba", "jeroboao", "elias", "acab", "eliseu", "naama", "josias", "saul"] },
  { "nome": "Os Grandes Profetas", "arranque": ["acaz", "uzias", "isaias", "senaqueribe", "jeremias", "baruque", "godolias", "ebede_meleque", "nabucodonosor", "ezequiel"] },
  { "nome": "Os Profetas Menores", "arranque": ["oseias", "amos", "amasias", "jonas", "miqueias", "naum", "habacuc", "sofonias", "ageu", "zacarias", "malaquias", "joel", "abdias"] }
]
```

(Lista de arranque copiada do agrupamento já curado manualmente no mockup `mockup-grafo-A-capitulos.html`, campo `reveals` de cada `cap_N` — confirmar que todos os ids ainda existem em `personagens.json` antes de copiar, já que o mockup é de 2026-08-28 e pode não refletir ligações/personagens acrescentadas nas Rondas 8-10.)

Este array é pequeno (7 entradas) e muda raramente — ao contrário de escrever `reveals` para as 105+ personagens, é um custo de manutenção aceitável para a Isabel.

### `js/reveal-graph.js` (novo módulo, funções puras, sem DOM)

Recebe `personagens` e `edges` (o mesmo formato que já existe) e devolve uma estrutura que permite, dado um id já visível, saber o que revelar a seguir:

- **Nós de união:** para cada par de `edges` do tipo `spouse`, sintetiza um nó de união (id derivado, ex: `u_<a>_<b>`, sem conteúdo próprio).
- **Árvore de revelação:** para cada personagem com uma ligação `parent` a partir de dois cônjuges conhecidos, a criança é revelada a partir do nó de união desses dois cônjuges. Se só um progenitor for conhecido (ex: Eli não tem cônjuge registada, mas tem filhos `parent`), a criança é revelada diretamente a partir desse progenitor. Uma personagem sem nenhuma ligação `parent` de entrada e sem cônjuge não revela nada a partir de si própria (é uma "folha").
- **Ligações fracas (`weakRefs`):** todas as ligações do tipo `descendant` e `affinity` já existentes tornam-se ligações "fracas" — desenhadas com traço fino/tracejado entre dois nós **só quando ambos já estão visíveis** (nunca fazem parte da árvore de revelação, nunca trazem uma personagem nova para o ecrã sozinhas).
- Ligações `sibling` sem progenitor comum conhecido (caso documentado na Ronda 9 — Dan/Neftali, Gad/Aser, cujas mães Bila/Zilpa não existem como personagens): tratadas como ligação fraca também, não como parte da árvore de revelação, para não obrigar a inventar uma âncora de revelação onde os dados não a dão.

Testado com o seu próprio `scripts/test-reveal-graph.js` (equivalente ao `scripts/test-layout.js` já existente), cobrindo pelo menos: união com dois cônjuges conhecidos, progenitor único conhecido, personagem-folha sem revelações, ligação `descendant`/`affinity` a virar `weakRef`, e o caso sibling-sem-progenitor-comum.

**Adenda pós-implementação (achado na execução, não estava previsto aqui):** para garantir que um cônjuge que nunca é alvo direto de mais ninguém (ex: a Eva) ainda assim aparece no ecrã, a união sintética é **simétrica** — os dois cônjuges revelam a união, e a união revela os dois cônjuges de volta. Isto torna `reveals` um **grafo cíclico por desenho** (pessoa → união → a mesma pessoa), não uma árvore. Além disso, quando dois progenitores conhecidos partilham um filho mas não têm nenhuma aresta `spouse` formal entre eles (caso real: Agar, concubina de Abraão), o algoritmo sintetiza uma **união implícita** com a mesma forma e a mesma simetria. Qualquer travessia futura sobre `reveals` (revelar, colapsar, listar ligações) **tem de usar um conjunto de visitados** — a Ronda 11 encontrou este mesmo bug de ciclo em três sítios diferentes (pesquisa em `app.js`, colapso em `js/physics.js`, e ligações duplicadas em `getEdges()`) antes de todos ficarem corrigidos.

### `js/physics.js` (novo módulo, motor de simulação)

**Este módulo não é escrito de raiz — é o motor já escrito e testado no mockup, adaptado.** Uma cópia de referência do mockup vive em `docs/superpowers/specs/2026-09-05-grafo-fisica-mockup-A.html` (o original em `.superpowers/brainstorm/` está fora do git, não sobrevive a um worktree novo). O motor inclui: repulsão entre todos os nós visíveis, "molas" ao longo das ligações reveladas (não as fracas), amortecimento, estado "adormecido" quando estabiliza (constantes `REPEL`, `SPRING_K`, `DAMP`, `ERA_ANCHOR_K`, ciclo `tick()` a partir da linha 288), **e já resolve "nunca sair do ecrã"** — não por uma força que empurra cada nó individualmente, mas por `everythingInView()`/`fitView()`/`animateCameraTo()` (linhas 470-522): sempre que algum nó fica fora da área seguramente visível, a câmara (zoom/pan) ajusta-se sozinha, com uma animação suave, para voltar a mostrar tudo.

**Duas afinações obrigatórias em relação ao mockup original:**
1. **Repulsão reforçada:** a constante `REPEL` (hoje 2200) precisa de ser reafinada (valor mais alto, e/ou repulsão adicional entre uma ligação e os nós que não lhe pertencem) para reduzir sobreposição de linhas/texto/retratos — sem garantia absoluta em clusters muito densos (ex: "Os Reis", 13 personagens), conforme aceite pela Isabel.
2. **Afastamento dos capítulos não abertos:** no mockup original, depois de abrir um capítulo, os restantes 6 ficam demasiado próximos da área onde as personagens reveladas aparecem (ver `mockup-A-expanded.png` capturado durante o brainstorming — coluna à esquerda mas ainda a espremer-se contra o conteúdo, apesar de já terem `home=[70, ...]` e encolherem para `SIDE_RADIUS` quando outro capítulo está aberto — ver `effectiveHome`/`targetRadiusFor`, linhas 178-198). A força de âncora (`ERA_ANCHOR_K`, hoje 0.05, partilhada com o "palco principal" do capítulo aberto) precisa de ser mais forte especificamente para os capítulos encolhidos na faixa lateral, para vencerem a repulsão das personagens novas que vão sendo reveladas.

### Substituição do motor de renderização

- **Removidos por completo:** `js/render-era-strip.js`, `js/render-cluster.js`, `js/layout.js` e o seu `scripts/test-layout.js` (a física substitui o cálculo de layout estático; a árvore/grelha por época deixa de existir).
- **Novo `js/render-graph.js`:** também um porto do mockup (`draw()`, `starShape()`, criação de nós, linhas de ligação — linhas 368-450 da cópia de referência), não uma reescrita — desenha os nós (capítulos, personagens, uniões) e ligações no SVG único do `#stage`, aplica as classes/gradientes por `kind`/`tier` (CSS do mockup: `.node.major`/`.node.standard`/`.node.minor`/`.node.uniao`/`.node.capitulo`), gere a entrada/saída de nós (animação `pop-in` já presente) e liga aos eventos de clique/hover. **Adaptação necessária:** o mockup mantém sempre o círculo/brilho do capítulo aberto (`targetRadiusFor`, linha 194-198, só encolhe os capítulos fechados quando outro está aberto — o próprio capítulo aberto mantém raio normal); a Isabel pediu que o círculo do capítulo aberto desapareça por completo, ficando só o texto (`.node.capitulo text.name`) na mesma posição física — os filhos revelados continuam ligados a essa posição, tal como já ficavam ligados ao nó antes de o círculo desaparecer.
- **`app.js`** mantém o papel de orquestrador: carrega os dados, calcula o grafo de revelação (`reveal-graph.js`) uma vez no arranque, gere o estado de "quem já está visível", liga cliques a `RenderGraph`/`Physics`, mantém a pesquisa (porto de `revealPerson`/`pathToRoot`/`focusNode`, linhas 623-656 da cópia de referência — mesma lógica, adaptada à fonte de dados real) e o painel de detalhe. **Regra de precedência hover/clique:** guarda-se sempre qual foi a última personagem **clicada** (`selectedId`). Ao passar o rato por cima de outra personagem, o painel mostra a prévia dessa personagem; ao tirar o rato de cima sem clicar, o painel volta a mostrar o conteúdo completo de `selectedId` (ou o estado vazio, se nada tiver sido clicado ainda) — nunca fica preso na prévia depois do rato sair.
- **`style.css`:** tema escuro/estrelado a partir do CSS já escrito no mockup (paleta `#0d1024`/dourado/lavanda, tipografia Georgia mantida), incluindo a caixa fixa de hover/detalhe no canto direito (adaptação do painel `aside#panel` já existente, agora também a receber conteúdo no hover, não só no clique).
- **`index.html`:** estrutura simplificada para um único `<svg id="stage">` a ocupar o ecrã todo, barra de pesquisa centrada no topo (como no mockup), controlos de zoom/reset, e o painel de detalhe fixo à direita (reaproveitado da Ronda 7/10, agora também alimentado pelo hover).

### Mantêm-se sem alterações

- `data/personagens.json` (além do array `capitulos` novo) — nenhum campo por personagem muda.
- `assets/retratos/` e `assets/icons/`.
- O conteúdo do painel de detalhe (resumo, contexto histórico, família, referências, ligações a outras eras) e a lógica de pesquisa por nome/era.

## Fora de âmbito (não faz parte desta ronda)

- Sub-projetos B (cartões de personagem mais ricos) e C (vista histórica/cronológica) da spec original do redesign de navegação — continuam pendentes, independentes desta mudança de motor.
- Qualquer alteração ao conteúdo bíblico (personagens, ligações, textos) — só o motor de visualização muda.
- Suporte a alternar entre o tema antigo e o novo — decisão explícita da Isabel de substituir por completo.
- Posição fixa por personagem — decisão explícita de manter a física livre, sujeita só às duas regras (limites + repulsão).

## Testes

- `scripts/test-reveal-graph.js` (novo): testa `js/reveal-graph.js` isoladamente, casos descritos acima.
- Verificação manual num browser real (cliques reais via CDP, como sempre neste projeto): abrir cada um dos 7 capítulos e confirmar que a bola do capítulo desaparece e só o título fica; clicar em várias personagens em sequência e confirmar que nenhum nó fica fora da área visível; testar especificamente o cluster mais denso ("Os Reis", 13 personagens) para avaliar visualmente o nível de sobreposição residual; confirmar que o hover preenche a caixa fixa com a prévia e o clique com o conteúdo completo; confirmar que a pesquisa continua a revelar a personagem certa mesmo a partir do estado inicial (nenhum capítulo aberto).
