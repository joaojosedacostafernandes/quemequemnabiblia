# Ronda 14 — Navegação por Linha do Tempo

**Data:** 2026-09-07
**Estado:** aprovado por Isabel, depois de várias rondas de protótipo em Artifact (galáxias → linha do tempo → Antigo Testamento completo → Novo Testamento completo → Apocalipse)

## Contexto

A Ronda 12 substituiu o modelo de vários capítulos abertos por um mapa de "galáxias" (um por capítulo), com física real dentro de cada uma. A Isabel testou, gostou da ideia geral de navegação em profundidade ("entrar"/"sair" do ecrã), mas pediu para explorar uma alternativa: uma **linha do tempo de acontecimentos**, não de capítulos — o acontecimento como unidade principal, os personagens como camada de detalhe.

Depois de 4 iterações de protótipo (mecânica de navegação → polimento visual → retratos reais + conteúdo completo + nós de união → correções de usabilidade), a Isabel aprovou o resultado final e pediu a implementação real. Esta ronda **substitui por completo** o modelo de galáxias da Ronda 12 — não convivem os dois.

## Decisão de arquitetura mais importante

O motor de física da Ronda 11/12 (`js/physics.js`, simulação de repulsão/molas) **é removido por completo**. O protótipo validado usa um layout genealógico determinístico (gerações em filas, filhos centrados sob os pais) em vez de física — mais previsível, sem sobreposições de linhas, e testado exaustivamente com casos difíceis (14 personagens, três casamentos partilhando a mesma pessoa). Não há razão para reintroduzir física só para replicar um resultado que o layout determinístico já dá melhor.

Consequência ainda mais importante: **o sistema de "revelar progressivamente" (`js/reveal-graph.js`, cliques para expandir/colapsar filhos) desaparece também.** Um acontecimento mostra sempre todos os seus personagens de uma vez — não há "+" para expandir. Isto elimina de vez a classe de bug mais recorrente deste projeto (o grafo cíclico de `reveals` entre cônjuge e união, que já causou 4 bugs reais em rondas anteriores): sem revelação progressiva, não há estado nenhum para ficar inconsistente.

## Modelo de dados novo

`data/personagens.json`:

- **Cada personagem ganha 3 campos novos**: `importancia` (porque é que esta pessoa importa na história bíblica maior), `licao` ("o que aprendemos com Deus" — uma frase, tom catequético, nunca especulativo), `citacao` (uma citação bíblica real e verificável, com referência exata). Estes 3 campos já foram escritos, com cuidado teológico, para as 116 personagens do Antigo Testamento já existentes, e para as ~46 novas personagens do Novo Testamento, ao longo do processo de protótipo — a migração reaproveita esse texto tal e qual, não o reescreve.
- **`capitulos[]` é removido** — substituído por `acontecimentos[]`. Cada acontecimento: `{ id, nome, era, tint, desc, importancia, mensagem, passagens: [string], personagens: [ids] }`. `personagens` é a lista completa (não só "arranque") de quem aparece nesse acontecimento — mostrados todos de uma vez, sem revelação progressiva.
- **`edges[]` não muda de formato** — continua `[idA, idB, tipo, etiqueta?]` com os mesmos 5 tipos (`parent`, `spouse`, `sibling`, `descendant`, `affinity`). Ganha só as arestas novas do Novo Testamento (relações familiares reais: Maria/José/Jesus, Isabel/Zacarias/João Batista, Pedro/André irmãos, Tiago Maior/João Apóstolo irmãos, Lázaro/Marta/Maria de Betânia irmãos, Maria/Isabel primas). **As relações do Antigo Testamento não precisam de nenhuma aresta nova** — já existem todas no ficheiro atual; o motor passa a derivá-las por acontecimento em vez de as duplicar à mão (ver secção seguinte).
- **Personagens do Novo Testamento (~46) são todas novas** — nenhuma tem retrato ainda (`retrato: null`), aparecem com o círculo neutro já usado para qualquer personagem sem retrato. Desenhar os retratos fica para uma ronda futura dedicada — o mesmo já acontece com Ester/Mardoqueu/Assuero/Amã (Ronda 13), que também ficam sem retrato por agora.

## Derivação da família por acontecimento (substitui a síntese de uniões da Ronda 11)

Dado um acontecimento (lista de ids de personagens), uma nova função pura deriva a árvore de família **só a partir das arestas reais** (`edges`) filtradas a esse conjunto de ids:

- Pares `spouse` onde ambos os ids estão no acontecimento → um nó de união sintético entre os dois (losango, mesmo visual da Ronda 11).
- Pares `parent` onde o filho e (um ou os dois) progenitores estão no acontecimento → linha do progenitor único, ou da união, até ao filho. Quando um progenitor tem mais de um cônjuge no mesmo acontecimento (ex: Abraão com Sara e Agar, Jacob com Lia e Raquel, David com Mical e Abigail), cada casal sintetiza a sua própria união — nunca uma linha direta a um único progenitor quando os dois são conhecidos.
- Pares `sibling`/`descendant`/`affinity` onde ambos os ids estão no acontecimento → linha fraca tracejada, com a etiqueta real da aresta (não só "irmão/irmã" — ex: "sogra e nora", "2 gerações, via Jotão").

Isto é mais simples E mais correto do que a Ronda 11: nunca pode haver uma família inconsistente com os dados reais, porque não há dados duplicados a manter sincronizados — é sempre derivada.

## Layout: gerações em filas

Algoritmo determinístico já testado no protótipo (`layoutEvent`): calcula a geração de cada personagem por BFS a partir de quem não é filho de ninguém dentro do acontecimento (geração 0), atribui uma "coluna" a cada um mantendo casais adjacentes e filhos centrados sob a união/progenitor. Casos verificados no protótipo: 14 personagens numa só fila (As Doze Tribos) sem sobreposição; três uniões a partilhar a mesma pessoa (Saul e a Ascensão de David) sem colidirem entre si.

## Navegação

- **Linha do tempo horizontal**: acontecimentos em ordem cronológica, arrastar ou setas para percorrer, pontos de progresso em baixo (clicáveis, saltam direto). Traço curvo (não reto) através dos pontos.
- **Mergulho num acontecimento**: clicar "voa" para dentro a partir do ponto exato do clique (perspetiva 3D + streaks de canvas, reaproveitando `js/warp-transition.js` da Ronda 12 sem alterações). "← Voltar à linha do tempo" faz o inverso.
- **Dentro de um acontecimento**: zoom in/out/reset + arrastar (câmara simples, sem física), clicar num personagem abre o cartão de detalhe (retrato se existir, resumo, importância, "o que aprendemos com Deus", citação, família — com etiquetas clicáveis que mudam o foco dentro do mesmo acontecimento). Painel tem botão de fechar (×).
- **Cabeçalho compacto dentro de um acontecimento**: o cabeçalho do site encolhe para dar espaço à visualização; a secção "Importância/Mensagem/Passagens-chave" começa fechada, expansível.

## Tipografia e visual

O protótipo introduziu Cormorant Garamond (títulos/nomes) + Inter (etiquetas de interface) sobre a paleta escura já existente (gold/lavender/pink/violet/ink) — esta ronda leva essa dupla tipográfica para o `style.css` de todo o site, não só para o motor de linha do tempo, para não haver duas linguagens visuais diferentes dentro do mesmo site.

## Pesquisa e referências cruzadas

A pesquisa (já existente) continua a procurar por nome em todas as personagens; ao encontrar uma personagem, salta diretamente para o SEU acontecimento (usa o primeiro acontecimento em que essa personagem aparece, se estiver em mais do que um — ex: Jacob aparece em "Isaac, Jacob e Esaú" e em "As Doze Tribos"; David aparece em 3 acontecimentos da monarquia) e foca-a lá. As "ligações noutras eras" do cartão de detalhe (Ronda 11) tornam-se "também aparece em: <nome do acontecimento>" sempre que a aresta liga personagens de acontecimentos diferentes — mesmo padrão da Ronda 12, adaptado de "galáxia" para "acontecimento".

## Fora de âmbito

- Retratos de qualquer personagem do Novo Testamento, e de Ester/Mardoqueu/Assuero/Amã (Ronda 13) — ficam para uma ronda de conteúdo/arte dedicada.
- Qualquer alteração ao texto teológico já escrito e aprovado no protótipo — é migrado tal e qual.
- Opções de navegação alternativas (mini-mapa, rasto) — nunca chegaram a ser pedidas para a linha do tempo, só existiam como opções descartadas para o modelo de galáxias (Ronda 12), já retirado.

## Ficheiros afetados

- `data/personagens.json` — migração completa (ver acima), script de migração corre uma vez, não fica no repositório como ferramenta permanente.
- **Removidos**: `js/physics.js`, `js/reveal-graph.js`, `scripts/test-reveal-graph.js`, `js/galaxy-map.js`, `js/render-graph.js`.
- **Mantido sem alterações**: `js/warp-transition.js`.
- **Novos**: `js/timeline.js` (linha do tempo horizontal + pontos de progresso), `js/event-graph.js` (deriva família por acontecimento + layout genealógico + desenho SVG dos nós/linhas + cartão de detalhe).
- `index.html`, `style.css`, `app.js` — reescritos para o novo modelo.
- `handover.md` e memória do projeto — atualizados no fim.
