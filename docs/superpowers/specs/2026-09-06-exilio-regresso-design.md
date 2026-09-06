# Ronda 13 — O Exílio e o Regresso

Data: 2026-09-06
Estado: aprovado por Isabel (elenco confirmado), a aguardar plano de implementação

## Contexto

Depois da Ronda 6 (Ezequiel + Profetas Menores), o bloco natural seguinte — exílio/pós-exílio (Daniel, Esdras, Neemias, Ester) — tinha ficado deliberadamente fora de âmbito, para decidir com a Isabel numa ronda própria. Com a Ronda 12 (navegação por galáxias) integrada, esta ronda acrescenta esse bloco como uma **8ª galáxia**, fechando o Antigo Testamento antes de uma futura ronda saltar para os Evangelhos.

Não há mudanças de arquitetura do motor — mesma estrutura de ficheiros, mesmo modelo de dados. Ronda de conteúdo pura, conteúdo e retrato feitos juntos (padrão desde a Ronda 3). A única mudança estrutural é o `capitulos[]` de `data/personagens.json` ganhar uma 8ª entrada.

## Âmbito

11 personagens novas, bundladas numa única galáxia "O Exílio e o Regresso" (Daniel, Esdras-Neemias e Ester são narrativas distintas mas do mesmo período histórico — mesmo padrão de bundling já usado em "Os Grandes Profetas" e "Os Profetas Menores", que juntam vários livros numa só galáxia):

- **Daniel** (daniel) — profeta/sábio na corte babilónica e persa, fiel a Deus apesar da pressão para se assimilar. Tier major.
- **Belsazar** (belsazar) — rei que vê "a escrita na parede" (Dn 5). Tier standard.
- **Dario o Medo** (dario) — governante sob quem Daniel é lançado à cova dos leões (Dn 6). Tier standard.
- **Esdras** (esdras) — sacerdote-escriba que lidera o regresso e restaura a Lei. Tier major.
- **Neemias** (neemias) — copeiro real que se torna governador e reconstrói as muralhas de Jerusalém. Tier major.
- **Zorobábel** (zorobabel) — descendente da linhagem davídica, lidera a reconstrução do Templo. Tier standard.
- **Jesua** (jesua) — sumo sacerdote do regresso (Ed 3; Zc 3) — **nome escolhido deliberadamente diferente de "Josué"** (id já usado pelo conquistador de Canaã, `josue`) para não confundir os dois na interface, apesar de ser a mesma forma hebraica do nome. Tier minor.
- **Ester** (ester) — jovem judia que se torna rainha da Pérsia e salva o seu povo. Tier major.
- **Mardoqueu** (mardoqueu) — primo e pai adotivo de Ester (Et 2:7: "porque ela não tinha pai nem mãe... Mardoqueu a tinha tomado como sua própria filha"). Tier major.
- **Assuero** (assuero) — rei persa, marido de Ester. Tier standard.
- **Amã** (ama) — vizir antagonista que trama a destruição dos judeus. Tier standard.

Fora de âmbito: os Evangelhos e o resto do Novo Testamento (próxima ronda a decidir com a Isabel); Zorobábel/Jesua da narrativa de Ageu-Zacarias já referida textualmente nesses profetas (Ronda 6) não precisa de alteração retroativa lá — só a ligação nova descrita abaixo.

## Modelo de dados — sem alterações à estrutura de `personagens[]`

Mesmos campos de sempre (`id, nome, tipo, retrato, tier, era, refs, resumo, contexto, relacoes`) — **sem `x`/`y`**, tal como todas as personagens desde a Ronda 8 (a posição é decidida pela física, não por coordenadas). `tipo` usa valores já existentes, sem nenhum novo:

| id | tipo | tier | era |
|---|---|---|---|
| daniel | profeta | major | Daniel |
| belsazar | rei | standard | Daniel |
| dario | rei | standard | Daniel |
| esdras | sacerdote | major | Esdras-Neemias |
| neemias | povo | major | Esdras-Neemias |
| zorobabel | povo | standard | Esdras-Neemias |
| jesua | sacerdote | minor | Esdras-Neemias |
| ester | matriarca | major | Ester |
| mardoqueu | povo | major | Ester |
| assuero | rei | standard | Ester |
| ama | povo | standard | Ester |

(`povo` para Neemias/Zorobábel/Mardoqueu/Amã segue o precedente já estabelecido para líderes/figuras importantes sem ser realeza/sacerdócio — ex: Godolias, governador, também `povo`.)

## Grafo — arestas dentro da galáxia nova

- `mardoqueu → ester` (parent) — a Bíblia enquadra explicitamente a adoção como relação pai-filha (Et 2:7), por isso `parent` é a aresta certa, não uma invenção.
- `assuero ↔ ester` (spouse).
- Daniel, Belsazar, Dario, Esdras, Zorobábel, Jesua, Amã ficam sem arestas familiares dentro desta galáxia — mesmo padrão já usado para figuras importantes sem família registada no grafo (Faraó, Golias, Senaqueribe, Nabucodonosor).

## Grafo — ligações cruzadas com galáxias já existentes (`descendant`/weak, nunca `parent`)

⚠️ **Importante para quem implementar:** desde a Ronda 12, a galáxia (capítulo) a que uma personagem pertence é decidida por `RevealGraph.groupByCapitulo`, que segue exatamente as mesmas arestas `reveals` da física (sintetizadas a partir de `parent`/`spouse`). Uma aresta `parent` a ligar esta galáxia nova a uma personagem de OUTRA galáxia já existente faria essa personagem ser "roubada" para a galáxia errada (a que for processada primeiro). Por isso, qualquer ligação a uma personagem de outra galáxia **tem de ser `sibling`/`descendant`/`affinity`** (viram sempre `weakRefs`, nunca entram em `reveals` — ver `js/reveal-graph.js`, Passo 3), nunca `parent`/`spouse`.

Uma ligação cruzada real e bem fundamentada a incluir:
- `zorobabel` ↔ `joaquim` (descendant, "3 gerações, via Jeconias — 1 Cr 3:17-19") — Zorobábel é bisneto do rei Joaquim/Jeconias (não confundir: o `joaquim` já existente no ficheiro, da Ronda 5, é o rei Jeoiaquim, pai de Jeconias — a cadeia real é Joaquim → Jeconias → Salatiel/Pedaías → Zorobábel; Jeconias não existe como personagem própria neste ficheiro, por isso a aresta salta 2 gerações, tal como o padrão já usado em `sem → abraao` "9 gerações"). Isto aparecerá no cartão de Zorobábel como "Também aparece em: Os Grandes Profetas" (ligação cruzada de galáxia).

Considerada e **descartada** por precisão histórica: uma ligação Nabucodonosor↔Belsazar. Daniel 5 chama Belsazar "filho" de Nabucodonosor, mas historicamente Belsazar era filho de Nabonido, um rei posterior não coberto neste ficheiro — a relação "filho" do texto bíblico é entendida por historiadores como título dinástico, não parentesco literal. Uma aresta arriscaria sugerir uma genealogia que não é real. Em vez de uma aresta, esta nuance fica explicada em prosa no campo `contexto` de Belsazar.

## Retratos

Mesma técnica e disciplina (viewBox 0 0 100 100, camadas roupa→pescoço→cara→orelhas→cabelo/barba→sobrancelhas→olhos→nariz→boca, paleta quente, unicidade genuína). Direção de casting, com lista explícita de comparação para cada personagem:

- **Daniel** — jovem/adulto sereno mas firme, mantém-se distinto mesmo sob pressão de assimilação: expressão calma e resoluta, não o olhar pesaroso de Jeremias nem o distante de Isaías. **Comparar contra:** `jeremias.svg`, `isaias.svg`, `ezequiel.svg` (risco alto — quatro "profeta"-tier major consecutivos no elenco).
- **Belsazar** — rei jovem e imprudente, festeiro, expressão de choque/medo súbito (a cena da escrita na parede é o seu momento definidor). **Comparar contra:** `nabucodonosor.svg` (risco alto — dois reis babilónicos consecutivos, mas gerações/temperamentos diferentes: conquistador vs. herdeiro imprudente), `acab.svg`.
- **Dario o Medo** — governante idoso, relutante a condenar Daniel, expressão de angústia/remorso. **Comparar contra:** `saul.svg`, `senaqueribe.svg`.
- **Esdras** — escriba-sacerdote de meia-idade, expressão de autoridade textual/legal (o "restaurador da Lei"). **Comparar contra:** `eli.svg`, `natan.svg`, `baruque.svg` (outro escriba).
- **Neemias** — funcionário da corte tornado construtor/governador, expressão prática e determinada, postura de quem organiza trabalho manual. **Comparar contra:** `esdras.svg` (risco alto — dois líderes do regresso na mesma galáxia), `godolias.svg`.
- **Zorobábel** — jovem príncipe davídico, herança régia visível mas sem coroa (não é rei coroado). **Comparar contra:** `david.svg`, `salomao.svg`, `roboao.svg`.
- **Jesua** — sumo sacerdote, vestes sacerdotais distintas de Esdras (sacerdote-escriba) e de Eli/Finéias (sacerdotes anteriores). **Comparar contra:** `eli.svg`, `fineias.svg`, `esdras.svg`.
- **Ester** — jovem rainha, beleza serena mas com firmeza/coragem por trás (o momento "para tal hora como esta"). **Comparar contra:** `abigail.svg`, `betsabe.svg`, `rebeca.svg` (risco alto — várias "matriarca" jovens/belas já no elenco).
- **Mardoqueu** — judeu de meia-idade/idoso, fiel e vigilante, postura protetora. **Comparar contra:** `elcana.svg`, `eli.svg`.
- **Assuero** — rei persa, iconografia distinta dos reis babilónicos/assírios já existentes (Nabucodonosor, Senaqueribe, Belsazar) — coroa/traje de estilo persa, não recolorir os mesmos padrões. **Comparar contra:** `nabucodonosor.svg`, `belsazar.svg`, `senaqueribe.svg` (risco alto — quatro reis estrangeiros no elenco total).
- **Amã** — vizir antagonista, expressão de orgulho ferido/ódio contido (o oposto da lealdade serena de Mardoqueu). **Comparar contra:** `golias.svg`, `acab.svg`, `jezabel.svg`.

Depois de desenhados, os 11 retratos novos devem também ser comparados entre si (elenco denso de reis estrangeiros e de sacerdotes/escribas nesta ronda).

## Navegação — nova galáxia

`data/personagens.json`, array `capitulos[]`, nova 8ª entrada:

```json
{ "nome": "O Exílio e o Regresso", "arranque": ["daniel", "belsazar", "dario", "esdras", "neemias", "zorobabel", "jesua", "ester", "mardoqueu", "assuero", "ama"] }
```

Todas as 11 personagens entram diretamente em `arranque` (mesmo padrão já usado em "Os Reis"/"Os Grandes Profetas"/"Os Profetas Menores" — a maioria das personagens destas rondas mais recentes não tem cadeia de revelação profunda, aparecem todas já visíveis ao entrar na galáxia).

## Validação

Mesma abordagem: JSON válido, `node scripts/test-reveal-graph.js` (a nova galáxia não deve quebrar nenhum teste existente), clique real no browser (protocolo CDP, entrar na galáxia nova, confirmar as 11 personagens + as 2 arestas internas + a ligação cruzada para "Os Grandes Profetas" a partir de Zorobábel), auditoria de distinção geométrica a todo o elenco (116 personagens no final). Confirmar também que `groupByCapitulo` atribui as 11 personagens novas à galáxia certa (não a nenhuma das 7 já existentes).
