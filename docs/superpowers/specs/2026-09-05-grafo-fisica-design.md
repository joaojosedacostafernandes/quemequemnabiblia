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

### `js/physics.js` (novo módulo, motor de simulação)

Baseado no motor já escrito e testado no mockup (`mockup-grafo-A-capitulos.html`, ver constantes `REPEL`, `SPRING_K`, `DAMP`, `ERA_ANCHOR_K` e o ciclo de simulação a partir da linha ~289): repulsão entre todos os nós visíveis, "molas" ao longo das ligações reveladas (não as fracas), amortecimento, e um estado "adormecido" quando o sistema estabiliza (para poupar CPU em vez de correr a simulação para sempre).

**Três regras novas obrigatórias, não presentes no mockup original:**
1. **Força de contenção:** um nó que se aproxime da margem da área visível do `viewBox` atual sofre uma força a empurrá-lo de volta para dentro — nenhum nó deve ficar fora da área visível sem o utilizador ter de fazer pan/zoom para o encontrar.
2. **Repulsão reforçada:** a constante `REPEL` do mockup precisa de ser reafinada (valor mais alto, e/ou repulsão adicional entre uma ligação e os nós que não lhe pertencem) para reduzir sobreposição de linhas/texto/retratos — sem garantia absoluta em clusters muito densos (ex: "Os Reis", 13 personagens), conforme aceite pela Isabel.
3. **Afastamento dos capítulos não abertos:** no mockup original, depois de abrir um capítulo, os restantes 6 ficam demasiado próximos da área onde as personagens reveladas aparecem (ver `mockup-A-expanded.png` capturado durante o brainstorming — coluna à esquerda mas ainda a espremer-se contra o conteúdo). Ajustar a âncora desses nós (`ERA_ANCHOR_K` no mockup, ou equivalente) para os empurrar mais para a margem esquerda assim que deixam de ser o capítulo mais recentemente aberto, dando mais espaço à área central de exploração — sem os deixar sair da área visível (regra 1).

### Substituição do motor de renderização

- **Removidos por completo:** `js/render-era-strip.js`, `js/render-cluster.js`, `js/layout.js` e o seu `scripts/test-layout.js` (a física substitui o cálculo de layout estático; a árvore/grelha por época deixa de existir).
- **Novo `js/render-graph.js`:** desenha os nós (capítulos, personagens, uniões) e ligações no SVG único do `#stage`, aplica as classes/gradientes por `kind`/`tier` (ver CSS do mockup: `.node.major`/`.node.standard`/`.node.minor`/`.node.uniao`/`.node.capitulo`), gere a entrada/saída de nós (animação `pop-in` já presente no mockup) e liga aos eventos de clique/hover. Ao clicar num capítulo: remove o círculo/brilho desse nó (`.star`, `.halo`) mas mantém o seu texto (`.node.capitulo text.name`) e a sua posição física — os filhos revelados continuam ligados a essa mesma posição pela física, exatamente como estavam ligados ao nó antes de o círculo desaparecer.
- **`app.js`** mantém o papel de orquestrador: carrega os dados, calcula o grafo de revelação (`reveal-graph.js`) uma vez no arranque, gere o estado de "quem já está visível", liga cliques a `RenderGraph`/`Physics`, mantém a pesquisa (mesma lógica de hoje, adaptada para revelar a personagem encontrada mesmo que os capítulos ainda não tenham sido abertos até lá) e o painel de detalhe (conteúdo inalterado — só o tema visual à volta muda).
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
