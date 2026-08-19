# Redesenho da Navegação e Interação

Data: 2026-08-19
Estado: aprovado por Isabel, a aguardar plano de implementação do Sub-projeto A

## Contexto

Depois de 6 rondas de conteúdo (97 personagens), a Isabel testou o site e achou-o confuso: um único mapa SVG gigante (3800×820) com quase 100 nós dispersos, navegação só por arrastar/zoom, relações familiares pouco explícitas (linhas finas cruzando o canvas inteiro), pouca informação por personagem, e nenhuma sensação de "diversão" ou curiosidade — o oposto do objetivo original de ser "algo que um jovem queira usar".

Isabel pediu um redesenho mais radical, com: exploração interativa real (não só pan/zoom), pesquisa por personagem/época/livro, diferenciação clara por importância, e uma dupla perspetiva bíblica/histórica. Foi validado com mockups visuais (ver `.superpowers/brainstorm/mockup-standalone.html` e `mockup-narrativa-vs-historica.html`) que:

- A navegação principal deve ser um **percurso gamificado por era/livro** (não um mapa único).
- Dentro de cada era, as relações familiares devem aparecer como uma **árvore genealógica real** (calculada, não posicionada à mão) quando existem, e como grelha simples quando não existem.
- Uma **vista histórica alternativa** (datas aproximadas reais, não a ordem dos livros) tem valor educativo genuíno — demonstrado com o exemplo de Amós/Oséias, que na Bíblia aparecem depois de Jeremias/Ezequiel mas historicamente pregaram antes de Isaías.

Este documento cobre a arquitetura geral do redesenho e o âmbito detalhado do primeiro sub-projeto (navegação nova). Os sub-projetos seguintes (cartões mais ricos, vista histórica) ficam esboçados aqui e ganham a sua própria spec quando chegar a vez de os implementar.

## Decisões de arquitetura

### 1. Fim das coordenadas manuais — layout calculado

O maior problema estrutural do site atual é que `x`/`y` de cada personagem são escritos à mão em `data/personagens.json`, e cada ronda de conteúdo gastou esforço real a verificar sobreposições (halos, rótulos) manualmente. Isto não escala — já foi o motivo principal da confusão relatada.

**Decisão:** o motor passa a calcular as posições em tempo de execução, a partir de três coisas: a `era` de cada personagem, as `edges` de família, e o `tier`. Os campos `x`/`y` deixam de ser a fonte de verdade — o Sub-projeto A remove a necessidade de os manter à mão. (Detalhe de migração — manter ou remover os campos do JSON — fica para o plano de implementação.)

### 2. Navegação em duas camadas

**Camada 1 — Percurso por era/livro (ecrã inicial):** uma sequência visual de "estações", uma por valor distinto do campo `era` já existente. Este campo já não é "um por livro" — já tem granularidade narrativa (Génesis sozinho já tem várias eras distintas, como "As origens", "O Dilúvio", "Depois do Dilúvio"; 1-2 Reis tem duas; cada livro profético a partir de Isaías tem exatamente uma, com o nome do livro). O redesenho aproveita esta estrutura já existente, não inventa uma nova — só lhe dá uma ordem explícita (ver "Modelo de dados" abaixo) e uma apresentação visual de percurso. Cada estação mostra o nome, uma contagem de personagens, e visualmente lê-se como um percurso contínuo (a validação do mockup B).

**Camada 2 — Cluster focado por era:** ao entrar numa estação, o ecrã mostra só as personagens dessa era.
- **Se há relações de família dentro da mesma era** (ex: Génesis, 1-2 Reis): layout de árvore genealógica calculado automaticamente a partir das `edges` do tipo `parent`/`spouse`/`sibling`/`descendant` que ligam duas personagens da mesma era.
- **Se não há** (a maioria dos livros proféticos a partir de Isaías): grelha/constelação simples, personagens maiores (tier `major`) mais centrais e em destaque.
- **Relações que atravessam eras** (ex: `ezequias → sofonias`, que liga "1-2 Reis" a "Sofonias") não são desenhadas como linha através do mapa inteiro — aparecem no cartão da personagem como uma referência clicável ("Descendente de Ezequias · ver era 1-2 Reis") que navega diretamente para lá. Isto evita reintroduzir o problema de linhas longas atravessando o ecrã, mantendo a ligação genuína e navegável.

### 3. Tamanho por importância, mais pronunciado

O campo `tier` (major/standard/minor) já existe e já controla o tamanho do medalhão — no redesenho, a diferença de tamanho entre tiers torna-se mais acentuada visualmente (números exatos ficam para o plano de implementação), e aplica-se tanto na árvore genealógica como na grelha.

### 4. Pesquisa

Uma barra de pesquisa sempre visível (não só no ecrã inicial) que procura por nome (sem sensibilidade a acentos — "amos" encontra "Amós"), por `era`/livro, e opcionalmente por `tipo`. Selecionar um resultado navega diretamente para a era certa e abre o cartão dessa personagem.

### 5. Sem bibliotecas externas

Mantém-se o princípio já seguido desde o protótipo original: SVG + JavaScript simples, sem dependências externas. O algoritmo de árvore genealógica e o algoritmo de grelha são escritos de raiz — mais trabalho de implementação agora, zero risco de manutenção de dependências no futuro. Isabel confirmou esta escolha.

## Faseamento

- **Sub-projeto A — Navegação nova** (âmbito detalhado abaixo): percurso por era, clusters com árvore/grelha automática, pesquisa básica, tamanho por importância mais pronunciado. Resolve diretamente a confusão relatada.
- **Sub-projeto B — Cartões mais ricos**: familiares como referências clicáveis (já parcialmente coberto pelo ponto 2 acima, para relações cruzadas de era); a decidir com a Isabel se acrescenta também um destaque tipo "curiosidade" por personagem.
- **Sub-projeto C — Vista Histórica**: novo campo de período histórico aproximado por personagem (com hedging para datas incertas, como já se faz para a genealogia do Sofonias) preenchido nas 97 personagens existentes, mais o toggle Narrativa↔Histórica validado no mockup. Fica para depois de A e B, já que implica bastante curadoria de conteúdo adicional.

Cada sub-projeto ganha o seu próprio plano de implementação (e, se o âmbito justificar, a sua própria spec) quando chegar a vez de o implementar — não se escreve tudo de uma vez.

## Âmbito do Sub-projeto A

### Modelo de dados

- Novo bloco `eras` no topo de `data/personagens.json` (ao lado de `layout`, `personagens`, `edges`): lista ordenada de eras na ordem narrativa/canónica, cada uma com `{ nome, descricao }`. Esta lista é a fonte de verdade da ordem do percurso — não pode ser derivada de forma fiável só a partir da ordem de inserção das personagens no array.
- Campo `era` de cada personagem continua a existir e a ligar-se a um nome desta lista.
- Campos `x`/`y` por personagem deixam de alimentar o render (decisão de os manter como metadados históricos ou remover fica para o plano).
- `edges` mantém-se sem alterações de formato.

### Motor de renderização

- **Ecrã do percurso**: itera `eras`, desenha uma estação por era com contagem de personagens (derivada de `personagens.filter(p => p.era === nome)`).
- **Ecrã de cluster**: dado o conjunto de personagens de uma era, particiona as `edges` internas (ambas as pontas na mesma era) das externas (uma ponta fora). Corre o layout de árvore nas internas; qualquer personagem sem ligação interna entra na grelha.
- **Layout de árvore**: algoritmo simples de árvore genealógica (gerações em linhas, irmãos/cônjuges agrupados horizontalmente) — sem pretensão de otimização gráfica sofisticada, só legibilidade clara.
- **Layout de grelha**: distribuição regular, ordenada por `tier` (major primeiro/maior, depois standard, depois minor).
- **Navegação entre camadas**: clicar numa estação abre o cluster; um botão "voltar" regressa ao percurso; clicar numa personagem abre o cartão de detalhe (sem alterações ao conteúdo do cartão nesta fase — isso é o Sub-projeto B).

### Fora de âmbito do Sub-projeto A

- Conteúdo novo de personagens (nenhuma personagem nova nesta fase).
- Cartões com referências clicáveis para familiares (Sub-projeto B) — exceto a referência de era cruzada descrita no ponto 2 da arquitetura, que é estrutural à navegação em clusters e por isso faz parte de A.
- Vista histórica/toggle (Sub-projeto C).

## Validação

Mesma abordagem já estabelecida: JSON válido, clique real no browser (protocolo CDP), mais verificação visual de que (a) todas as 97 personagens continuam acessíveis a partir do percurso, (b) nenhuma personagem fica "órfã" (sem era correspondente na lista `eras`), (c) o layout de árvore não sobrepõe nós/rótulos dentro de cada cluster.
