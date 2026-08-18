# Ronda 6 — Ezequiel e os 12 Profetas Menores

Data: 2026-08-18
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

Depois da Ronda 5 (Jeremias, 82 personagens), a Isabel pediu para avançar para "Ezequiel e os profetas menores" — o bloco que tinha ficado deliberadamente fora da Ronda 5. Ao contrário de Isaías e Jeremias, estes livros são quase todos oráculo/visão, com muito pouca narrativa. Ainda assim, dois dos 12 profetas menores têm episódios narrados com outras personagens: Oséias (mandado por Deus casar com Gómer, cujo casamento se torna sinal profético) e Amós (confrontado pelo sacerdote Amasias em Betel). Isabel confirmou incluir os 12 profetas + Ezequiel, mais Gómer e Amasias — 15 personagens no total — com o tema da infidelidade de Gómer tratado com linguagem cuidada e indireta, apropriada para catequese infantil (mesmo padrão já usado para temas maduros como o de Raabe).

Não há mudanças de arquitetura — mesma estrutura de ficheiros, mesmo modelo de dados, mesmo motor. Uma adição nova: o script de auditoria geométrica de retratos (usado informalmente desde a Ronda 4, sempre reescrito de raiz) passa finalmente a ficar guardado no repositório, em `scripts/geometry-audit.js`, conforme recomendado no `handover.md`.

## Âmbito

15 personagens novas:

- **Ezequiel** (ezequiel) — profeta-sacerdote no exílio babilónico, visões da glória de Deus e do vale dos ossos secos. Tier major.
- **Oséias** (oseias) — profeta do Reino de Israel, o seu casamento é sinal profético. Tier standard.
- **Gómer** (gomer) — mulher de Oséias. Tier minor.
- **Amós** (amos) — pastor de Tecoa, profeta da justiça social. Tier standard.
- **Amasias** (amasias) — sacerdote de Betel, confronta Amós. Tier minor.
- **Jonas** (jonas) — profeta enviado a Nínive, engolido por um grande peixe. Tier standard.
- **Miqueias** (miqueias) — contemporâneo de Isaías, profetiza Belém como berço do Messias. Tier minor.
- **Naum** (naum) — anuncia a queda de Nínive. Tier minor.
- **Habacuc** (habacuc) — questiona Deus sobre a injustiça, termina em confiança. Tier minor.
- **Sofonias** (sofonias) — profetiza durante o reinado de Josias; genealogia tradicionalmente ligada a Ezequias. Tier minor.
- **Ageu** (ageu) — anima a reconstrução do Templo pós-exílio. Tier minor.
- **Zacarias** (zacarias) — visões simbólicas sobre a reconstrução; a entrada do rei humilde em Jerusalém. Tier minor. **Nota:** não confundir com o Zacarias do Novo Testamento (pai de João Batista) — a desambiguação fica registada no campo `relacoes` deste personagem.
- **Malaquias** (malaquias) — último profeta do cânone tradicional do AT, anuncia um "mensageiro". Tier minor.
- **Joel** (joel) — a praga de gafanhotos como aviso do Dia do Senhor. Tier minor.
- **Abdias** (abdias) — o livro mais curto do AT, castigo de Edom. Tier minor.

Fora de âmbito (deliberadamente, para uma ronda futura): Zorobabel e o sumo sacerdote Josué (Jesua) — figuras históricas ligadas a Ageu/Zacarias mas que pertencem mais naturalmente a uma ronda futura de exílio/pós-exílio (junto com Esdras, Neemias, Ester, Daniel), onde a reconstrução do Templo é tratada em profundidade. Aqui ficam só mencionados em texto, sem nó próprio.

## Risco de quase-clone — o mais alto até agora

Esta ronda tem 10 personagens do mesmo `tipo: "profeta"` e 9 delas do mesmo `tier: "minor"` (Miqueias, Naum, Habacuc, Sofonias, Ageu, Zacarias, Malaquias, Joel, Abdias) — a maior densidade de personagens do mesmo tipo+tier já feita numa só ronda. Cada uma destas 9 precisa de **um detalhe visual âncora distinto**, escolhido a partir da sua mensagem/livro (ver tabela de casting na secção de retratos), e a tarefa que as desenha tem de as comparar exaustivamente entre si (36 pares), não só contra o elenco já existente.

## Modelo de dados — sem alterações à estrutura

Mesmos campos de sempre. `tipo`: `profeta` para os 13 profetas, `povo` para Gómer, `sacerdote` para Amasias. Cada profeta usa o nome do seu próprio livro como `era` (mesmo padrão de "Isaías", "Jeremias", "Rute", "Josué"): "Ezequiel", "Oséias", "Amós", "Jonas", "Miqueias", "Naum", "Habacuc", "Sofonias", "Ageu", "Zacarias", "Malaquias", "Joel", "Abdias". Gómer usa `era: "Oséias"`; Amasias usa `era: "Amós"`.

## Grafo

`layout.width` cresce de 3300 para 3800 (altura mantém-se em 820). Zona nova fica à direita do cluster de Jeremias (x=3000-3220), organizada numa grelha simples de 4 colunas por espaçamento de 100px em x e y (espaçamento generoso, seguindo o padrão já validado nas revisões finais das Rondas 4-5):

| id | x | y | tier |
|---|---|---|---|
| oseias | 3400 | 150 | standard |
| gomer | 3400 | 300 | minor |
| sofonias | 3400 | 450 | minor |
| ageu | 3400 | 600 | minor |
| amos | 3500 | 150 | standard |
| amasias | 3500 | 300 | minor |
| ezequiel | 3500 | 450 | major |
| zacarias | 3500 | 600 | minor |
| jonas | 3600 | 150 | standard |
| naum | 3600 | 300 | minor |
| abdias | 3600 | 450 | minor |
| malaquias | 3600 | 600 | minor |
| miqueias | 3700 | 150 | minor |
| habacuc | 3700 | 300 | minor |
| joel | 3700 | 450 | minor |

Arestas novas (2 apenas — mesmo padrão de sempre, só relações de família/casamento):
- `oseias ↔ gomer` (spouse)
- `ezequias → sofonias` (descendant, "4 gerações, tradicional · Sf 1:1" — a genealogia do livro de Sofonias remonta a um "Ezequias" que a tradição identifica com o rei de Judá; fraseado no conteúdo como identificação tradicional, não certeza histórica)

Nenhuma aresta para o confronto Amós/Amasias (não é relação familiar, mesmo padrão já usado para Elias/Acab).

## Retratos

Mesma técnica e disciplina (viewBox 0 0 100 100, camadas roupa→pescoço→cara→orelhas→cabelo/barba→sobrancelhas→olhos→nariz→boca, paleta quente, unicidade genuína). Direção de casting — cada um dos 9 profetas minor-tier ganha um detalhe visual âncora ligado à sua mensagem, para reduzir o risco de quase-clone identificado acima:

- **Ezequiel** — sacerdote-profeta no exílio: mais solene/formal que os outros, talvez um detalhe de vestes sacerdotais (faixa distinta), olhar fixo/visionário. **Comparar contra:** `isaias.svg`, `jeremias.svg` (os outros dois profetas major-tier — risco alto).
- **Oséias** — expressão de tristeza contida/mágoa amorosa (o profeta cujo próprio casamento é a sua mensagem). **Comparar contra:** `jeremias.svg` (evitar repetir o "olhar de dor" do profeta que chora — Oséias deve ler-se como mágoa pessoal/amorosa, não luto nacional).
- **Gómer** — expressão distante/evasiva, tratada com dignidade, sem qualquer insinuação visual. **Comparar contra:** outras personagens "povo"/"jovem" tier minor já existentes.
- **Amós** — robusto, exterior (pastor/agricultor), expressão firme e direta. **Comparar contra:** `eliseu.svg`, `booz.svg`.
- **Amasias** — vestes de sacerdote de um santuário real (distinto do sacerdócio legítimo de Jerusalém), expressão de autoridade defensiva. **Comparar contra:** `eli.svg` (o único outro sacerdote-tier existente).
- **Jonas** — expressão amuada/reticente (o profeta que não quer estar ali). **Comparar contra:** `elias.svg`, `natan.svg`.
- **Miqueias** — detalhe âncora: olhar sério de denúncia social, textura de barba curta e arrumada. **Comparar contra:** `isaias.svg` (contemporâneo de Isaías — risco de convergência).
- **Naum** — detalhe âncora: expressão de fúria/severidade contida (o profeta do juízo mais duro).
- **Habacuc** — detalhe âncora: olhar erguido/questionador (dialoga diretamente com Deus).
- **Sofonias** — detalhe âncora: expressão solene mas com um traço de serenidade (o livro termina em alegria).
- **Ageu** — detalhe âncora: aspeto prático/construtor, talvez uma ferramenta ou gesto associado à reconstrução sugerido na roupa.
- **Zacarias** — detalhe âncora: olhar muito aberto/visionário (livro cheio de visões simbólicas).
- **Malaquias** — detalhe âncora: aspeto mais velho e cansado (crítica aos sacerdotes desleixados).
- **Joel** — detalhe âncora: expressão de alarme/urgência (a praga de gafanhotos).
- **Abdias** — detalhe âncora: o mais breve e direto de todos — expressão austera, o mínimo de adornos.

Depois de desenhados, os 9 retratos minor-tier têm de ser comparados exaustivamente entre si, e a tarefa que os desenha corre o script `scripts/geometry-audit.js` (novo neste repositório, ver secção seguinte) como último passo antes de comitar, confirmando manualmente qualquer par sinalizado.

## Nova ferramenta: `scripts/geometry-audit.js`

Usado informalmente desde a Ronda 4 (sempre reescrito a partir do zero em scratchpad), este script fica agora guardado no repositório. Lê todos os ficheiros em `assets/retratos/*.svg`, extrai atributos de forma de cada elemento (ignorando `fill`/`stroke`/`class`/`id`) e sinaliza pares de ficheiros com ≥60% de sobreposição de "tokens" de forma. **Produz falsos positivos** (elementos genéricos partilhados por convenção, como o retângulo do pescoço, contam para a sobreposição) — todo o par sinalizado precisa de confirmação manual visual, nunca é veredito automático por si só. Uso: `node scripts/geometry-audit.js assets/retratos`.

## Validação

Mesma abordagem: JSON/SVG válidos, clique real no browser (protocolo CDP), auditoria de distinção geométrica a todo o elenco (97 personagens no final) — desta vez corrida também dentro da própria tarefa que desenha os 9 profetas minor-tier, não só no fim pelo controlador, dado o risco elevado identificado nesta ronda.
