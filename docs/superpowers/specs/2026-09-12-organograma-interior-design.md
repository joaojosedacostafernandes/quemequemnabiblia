# Ecrã interior — organograma limpo com rótulos

**Data:** 2026-09-12
**Motor afetado:** o interior de um acontecimento (`js/event-graph.js` + `style.css`).
**Motivação (palavras da Isabel/utilizador):** o ecrã interior atual é confuso por
**"ser um grafo com linhas sobrepostas"**. Quer algo *menos confuso, mais direto*,
que deixe *perceber a relação entre os personagens*.

## Decisão de desenho

Direção escolhida em brainstorming: **árvore arrumada → organograma com rótulos**.
Mantém-se o que já foi validado (tema escuro, orbes-retrato, zoom/arrasto, layout por
gerações, painel de detalhe, pesquisa, linha do tempo, dados, `deriveFamily`). Muda-se
**como se desenham as ligações**: sai a teia de linhas diagonais e as linhas soltas de
irmãos; entram ligações **só em ângulo reto** e a relação **escrita por palavras**.

## Requisitos

### 1. Descendência em ângulo reto (elbow routing)
- De cada casal (ponto ♥) ou pai/mãe único desce **um traço vertical** até uma
  **barra horizontal** partilhada por todos os filhos desse casal/progenitor.
- Dessa barra desce **um traço vertical** a cada filho.
- **Nunca há linhas diagonais.** Todos os segmentos são verticais ou horizontais.
- A barra horizontal leva um rótulo de texto: **"pais de"** para um casal,
  **"pai de"**/**"mãe de"** quando é um único progenitor de sexo conhecido, e
  **"pais de"** como recurso quando o sexo não é conhecido. (Determinação do sexo:
  ver "Rótulos" abaixo — sem novo campo de dados obrigatório.)

### 2. Casamento
- Mantém-se **uma linha horizontal direta entre os dois orbes, com ♥ a meio**
  (já validado na Ronda de 2026-09-09). O ♥ continua a ser o ponto de onde a
  descendência arranca. Sem losango.
- Casais são desenhados na **mesma fila/geração** e **adjacentes** (ver Layout).

### 3. Grupos com rótulo (relações não pai→filho / não casamento)
Irmãos sem pai/mãe presentes no acontecimento, afinidade (`affinity`) e qualquer
outra ligação "fraca" (`sibling`/`descendant`/`affinity` que sobre depois de a árvore
ser montada) **deixam de ter linhas soltas**. Em vez disso:
- As pessoas ficam **lado a lado** e por baixo (ou por cima) recebem uma
  **chaveta/faixa horizontal** com um **rótulo de texto**.
- O rótulo vem do `label` da aresta quando existe; senão, um padrão por tipo:
  `sibling → "irmãos"`, `affinity → "família por casamento"`, `descendant →
  "descendentes"`. Grupos de companheiros que o acontecimento defina (ex.: os 12
  apóstolos) usam o rótulo apropriado herdado do conjunto de arestas fracas comuns.
- **Zero linhas a cruzar.** A relação lê-se por proximidade + rótulo.

### 4. Layout (adjacência de grupos)
`layoutEvent` passa a garantir que os membros de um mesmo grupo ficam **adjacentes**
na sua fila:
- Cônjuges de um casal → slots consecutivos (já parcialmente feito na geração 0;
  estender a todas as gerações).
- Filhos do mesmo casal/progenitor → já ficam contíguos (mantém-se).
- Membros de um grupo "fraco" (irmãos sem pai, companheiros, afinidade) → slots
  consecutivos, para a chaveta os poder abraçar sem saltar por cima de terceiros.
- Filas muito largas (ex.: 12 apóstolos) continuam a estender-se para além do
  contentor e navegam-se por arrasto/zoom — comportamento já existente, não regressão.

### 5. Movimento
- **Remover a flutuação perpétua** dos orbes (`floatChar`). Num organograma as linhas
  são estáticas em SVG; se os orbes flutuassem, as linhas descolar-se-iam deles (foi
  um bug real no passado). Fica **só uma entrada suave** (a cascata de entrada por
  geração pode manter-se) e depois o ecrã **fica quieto para ler**.
- Continua tudo desligado sob `prefers-reduced-motion`.

## O que NÃO muda
- `data/personagens.json`, o esquema de `edges`, os retratos.
- `deriveFamily(ids, edges)` — a derivação de casais/filhos/fracas a partir das
  arestas mantém-se (é o input do layout e do desenho).
- Painel de detalhe (`focusChar`), pesquisa, navegação na linha do tempo, warp.
- Tema escuro, orbes-retrato, zoom/arrasto.

## Ficheiros afetados
- `js/event-graph.js` — reescrita de `render` (roteamento em ângulo reto, rótulos,
  chavetas de grupo) + ajustes a `layoutEvent` (adjacência de grupos).
- `style.css` — estilo das linhas em ângulo reto, das chavetas, dos rótulos de
  relação; remover `floatChar` dos orbes.
- `scripts/test-event-graph.js` — testes novos para a **adjacência de grupos** em
  `layoutEvent` (casais consecutivos em qualquer geração; membros de grupo fraco
  consecutivos). `deriveFamily` mantém os testes atuais.

## Rótulos — regras
- Descendência de casal: **"pais de"**.
- Descendência de progenitor único: **"pai de"**/**"mãe de"** se o sexo for
  inferível sem novo campo (heurística leve a partir de `tipo`/nome conhecido);
  caso contrário **"pais de"**. Nunca inventar sexo — na dúvida, forma neutra.
- Casamento: o **♥** (sem palavra; já é entendido).
- Grupos fracos: `label` da aresta, ou padrão por tipo (ver §3).
- Todo o texto em **português**, adequado a crianças.

## Critérios de aceitação (verificação em browser real, CDP)
1. Em `origens` (Adão♥Eva → Caim/Abel/Set): descida vertical do ♥ → barra "pais de"
   → um traço vertical a cada filho; nenhuma diagonal; nenhuma linha cruza outra.
2. Em `saul_david_ev` (casais sem/​com filhos): cada casal adjacente, ♥ entre eles,
   sem linhas a cruzar.
3. Num acontecimento com afinidade (Noemi/Rute) ou irmãos sem pai (filhos de Jacob):
   grupo lado a lado sob chaveta com rótulo, **sem** linha solta a cruzar o ecrã.
4. Nos 12 apóstolos: grupo sob rótulo, navegável por arrasto/zoom, sem sobreposição
   de nomes.
5. Orbes quietos após a entrada; nenhuma linha descolada de um orbe (desvio
   orbe-âncora = 0, como já verificado antes).
6. `node scripts/test-event-graph.js` passa (inclui os testes novos de adjacência).

## Notas de execução
- Implementação a fazer **em worktree isolado** (nunca em `master`), com revisão de
  subagent e verificação em browser real (CDP, eventos reais) + auditoria geométrica,
  seguindo o fluxo de rondas do projeto.
- Pedido explícito do utilizador: **implementar com o modelo Fable 5**.
