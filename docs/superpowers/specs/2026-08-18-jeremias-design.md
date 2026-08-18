# Ronda 5 — Jeremias

Data: 2026-08-18
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

Depois da Ronda 4 (Isaías, 75 personagens), a Isabel pediu para avançar para "os próximos profetas", deixando a escolha de âmbito ao critério do agente. Jeremias é o candidato natural: ao contrário de Isaías (sobretudo oráculo), o livro de Jeremias narra episódios concretos com vários intervenientes — a queima do rolo profético, a prisão na cisterna, o cerco final de Jerusalém — o que dá um elenco mais rico. Ezequiel e os 12 profetas menores ficam propositadamente fora desta ronda (são quase só visão/oráculo, com pouquíssimos personagens narrativos) — decisão a retomar com a Isabel numa ronda futura própria.

Não há mudanças de arquitetura — mesma estrutura de ficheiros, mesmo modelo de dados, mesmo motor. Ronda de conteúdo pura, conteúdo e retrato feitos juntos (padrão desde a Ronda 3).

## Âmbito

7 personagens novas, cronologicamente a seguir ao bloco de Isaías (reinado de Josias em diante, até à queda de Jerusalém em 587 a.C.):

- **Jeremias** (jeremias) — profeta, personagem central. Tier major.
- **Baruque** (baruque) — escriba fiel de Jeremias, escreve os seus oráculos por ditado. Tier standard.
- **Joaquim** (joaquim) — rei de Judá, filho de Josias, queima o rolo profético. Tier minor.
- **Sedequias** (sedequias) — último rei de Judá, filho de Josias, reina durante o cerco final. Tier standard.
- **Godolias** (godolias) — governador nomeado pelos babilónios após a queda de Jerusalém, protege Jeremias, é assassinado. Tier minor.
- **Ebede-Meleque** (ebede_meleque) — funcionário do palácio de origem cuxita (etíope), resgata Jeremias de uma cisterna. Tier minor.
- **Nabucodonosor** (nabucodonosor) — rei do Império Babilónico, conquista Jerusalém e destrói o Templo. Tier standard.

Fora de âmbito: Ezequiel, os 12 profetas menores, Daniel, o resto do exílio/pós-exílio (Esdras, Neemias, Ester) — para rondas futuras a decidir com a Isabel.

## Modelo de dados — sem alterações à estrutura

Mesmos campos de sempre (`id, nome, tipo, retrato, tier, x, y, era, refs, resumo, contexto, relacoes`). `tipo` usa valores já existentes: `profeta` (Jeremias), `povo` (Baruque, Godolias — nenhum dos dois é realeza nem sacerdote, mas ambos têm um papel de liderança/serviço), `rei` (Joaquim, Sedequias, Nabucodonosor), `estrangeiro` (Ebede-Meleque). Nenhum tipo novo necessário. Novo valor de `era`: "Jeremias" para as 7 (mesmo padrão de "Isaías", "Rute", "Josué" — nome do livro como era, mesmo quando o período se sobrepõe a eras vizinhas).

## Grafo

`layout.width` cresce de 3050 para 3300 (altura mantém-se em 820 — a zona nova usa y=140-420, dentro do já existente). Zona nova fica à direita do cluster de Isaías (x=2760-2950):

| id | x | y | tier |
|---|---|---|---|
| joaquim | 3000 | 140 | minor |
| sedequias | 3070 | 140 | standard |
| jeremias | 3080 | 260 | major |
| baruque | 3150 | 180 | standard |
| godolias | 3180 | 320 | minor |
| ebede_meleque | 3130 | 420 | minor |
| nabucodonosor | 3220 | 180 | standard |

Arestas novas (3, mesmo padrão de sempre — só relações de família, nunca de mentoria/companheirismo, tal como Elias/Eliseu ou Jeremias/Baruque não têm aresta):
- `josias → joaquim` (parent)
- `josias → sedequias` (parent)
- `joaquim ↔ sedequias` (sibling)

Godolias, Ebede-Meleque e Nabucodonosor ficam sem arestas familiares (mesmo padrão já usado para Rainha de Sabá, Faraó, Golias, Senaqueribe — figuras sem família registada no grafo).

## Retratos

Mesma técnica e disciplina (viewBox 0 0 100 100, camadas roupa→pescoço→cara→orelhas→cabelo/barba→sobrancelhas→olhos→nariz→boca, paleta quente, unicidade genuína). Direção de casting, com lista explícita de comparação para cada personagem (para evitar quase-clones — o problema mais recorrente deste projeto):

- **Jeremias** — o "profeta que chora": mais jovem do que Isaías na sua vocação, rosto marcado por tristeza/dor, sobrancelhas franzidas, olhar pesaroso (não o olhar calmo/distante de Isaías). **Comparar contra:** `isaias.svg` (o par de maior risco — dois profetas major-tier consecutivos), `elias.svg`, `natan.svg`, `samuel.svg`, `moises.svg` (achado da Ronda 4: nunca comparado com Isaías, corrigir agora à partida).
- **Baruque** — escriba, classe letrada mas não realeza: expressão atenta e prática. **Comparar contra:** `booz.svg` (outro "povo" tier standard), `natan.svg`, `eliseu.svg`.
- **Joaquim** — rei jovem e desdenhoso, o oposto do Acaz "evasivo": olhar direto e desafiador, quase um sorriso de desprezo. **Comparar contra:** `acaz.svg` (risco alto — dois reis jovens/minor da mesma linhagem de Josias, mas com leituras emocionais opostas: desafio vs. evasão), `roboao.svg`, `jeroboao.svg`.
- **Sedequias** — rei fraco e indeciso, procura garantias em vez de as recusar: sobrancelha preocupada, olhar em busca de ajuda (não evasivo como o Acaz, nem desafiador como o Joaquim). **Comparar contra:** `acaz.svg`, `acab.svg`, `saul.svg`.
- **Godolias** — administrador competente e de confiança: expressão serena e aberta. **Comparar contra:** `eli.svg`, `natan.svg`.
- **Ebede-Meleque** — cuxita (origem núbia/etíope), representação respeitosa e não caricatural: tom de pele e textura de cabelo coerentes com essa origem, expressão de urgência corajosa. **Comparar contra:** `naama.svg`, `rainha_seba.svg` (os outros "estrangeiro" já existentes).
- **Nabucodonosor** — rei conquistador babilónico: iconografia real distinta da assíria já usada em Senaqueribe (evitar recolorir o mesmo desenho — coroa/toucado de estilo diferente, não o mesmo padrão de barba em blocos). **Comparar contra:** `senaqueribe.svg` (risco alto — dois reis estrangeiros conquistadores consecutivos), `farao.svg`, `golias.svg`.

Depois de desenhados, os 7 retratos novos devem também ser comparados entre si.

## Validação

Mesma abordagem: JSON/SVG válidos, clique real no browser (protocolo CDP), auditoria de distinção geométrica a todo o elenco (82 personagens no final). O script de auditoria (ainda não guardado no repositório, ver `handover.md`) deve ser corrido e os pares sinalizados confirmados manualmente — sabe-se de rondas anteriores que produz falsos positivos por elementos genéricos partilhados de propósito.
