# Ronda 3 — Juízes e Reis

Data: 2026-08-16
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

Depois da Ronda 1 (redesign visual + fecho de Génesis/Êxodo, 34 personagens) e da Ronda 2 (retrato ilustrado único por personagem para essas 34), a Isabel pediu para avançar para o bloco narrativo seguinte: Juízes e Reis. Ao contrário da Ronda 2, que separou conteúdo (Ronda 1) de retratos (Ronda 2), desta vez a Isabel pediu explicitamente para as duas coisas nascerem juntas — cada personagem nova já entra com conteúdo completo e retrato único, no mesmo passo.

Não há mudanças de arquitetura nesta ronda — a estrutura de ficheiros, o modelo de dados (`data/personagens.json`, incluindo `tipo` e `retrato`), o motor (`app.js`) e o sistema de ícones por tipo já existem e não precisam de alterações. Esta é uma ronda de conteúdo pura.

## Âmbito

37 personagens novas, cobrindo Juízes, Rute, 1-2 Samuel e 1-2 Reis até ao início do reino dividido — um ponto de paragem natural antes dos grandes profetas literários (Isaías, Jeremias, etc.), que fica reservado para uma eventual Ronda 4.

Lista completa (id sugerido entre parênteses):
- **Juízes:** Josué (josue), Otoniel (otoniel), Eúde (eude), Débora (debora), Baraque (baraque), Jael (jael), Gideão (gideao), Abimeleque (abimeleque), Jefté (jefte), Sansão (sansao), Dalila (dalila)
- **Rute:** Rute (rute), Noemi (noemi), Booz (booz)
- **1 Samuel:** Ana (ana), Eli (eli), Samuel (samuel), Saul (saul), Jónatas (jonatas), David (david), Golias (golias), Abigail (abigail), Mical (mical)
- **2 Samuel:** Betsabé (betsabe), Absalão (absalao), Natã (natan)
- **1-2 Reis:** Salomão (salomao), Rainha de Sabá (rainha_seba), Roboão (roboao), Jeroboão (jeroboao), Elias (elias), Acab (acab), Jezabel (jezabel), Eliseu (eliseu), Naamã (naama), Ezequias (ezequias), Josias (josias)

Fora de âmbito: profetas literários (Isaías, Jeremias, Ezequiel, os 12 profetas menores), o exílio babilónico, o pós-exílio (Esdras, Neemias, Ester), os livros sapienciais como personagens autónomas — tudo isto fica para rondas futuras, a decidir com a Isabel.

## Modelo de dados — sem alterações à estrutura, só conteúdo novo

Cada uma das 37 personagens ganha uma entrada completa em `data/personagens.json` com os mesmos campos já usados por todas as 34 anteriores: `id`, `nome`, `tipo`, `retrato`, `tier`, `x`, `y`, `era`, `refs`, `resumo`, `contexto`, `relacoes`. O `tipo` continua a ser um dos 8 valores já existentes (patriarca, matriarca, profeta, rei, sacerdote, jovem, povo, estrangeiro) — nenhum tipo novo é necessário; "juiz" enquadra-se em "povo" ou "rei" consoante o papel (líder militar/carismático → povo; monarca → rei).

Novas eras (campo `era`, para o cabeçalho do cartão): "Josué", "Os Juízes", "Rute", "1 Samuel · Ana e Samuel", "1 Samuel · Saul e David", "2 Samuel · O reinado de David", "1 Reis · Salomão", "1-2 Reis · O reino dividido".

## Expansão do grafo

O `layout` em `data/personagens.json` (atualmente `{ "width": 1700, "height": 720 }`) tem de crescer substancialmente para caber as 37 novas personagens à direita das 34 atuais (que terminam por volta de x=1560-1620 com Moisés/Arão/Faraó). Proposta: `{ "width": 2900, "height": 820 }`. O `viewBox` inicial em `index.html` (`0 0 1700 720`) tem de ser atualizado para `0 0 2900 820` no mesmo passo — tal como aconteceu na Ronda 1 quando o grafo cresceu de 1560×660 para 1700×720.

A disposição mantém o princípio já estabelecido: esquerda (mais antigo) → direita (mais recente), sem eixo de datas explícito. Josué começa logo a seguir a Moisés (~x=1650). Depois seguem-se, em bandas horizontais aproximadamente cronológicas: Juízes (~x=1700-2050), Rute (~x=2050-2100, contemporânea dos Juízes), 1 Samuel (~x=2150-2400), 2 Samuel (~x=2400-2500), 1-2 Reis (~x=2500-2850). Dentro de cada banda, personagens da mesma história/família ficam próximas verticalmente. As coordenadas exatas ficam definidas no plano de implementação; nudges pontuais para evitar sobreposição de rótulos são trabalho normal de refinamento (como já aconteceu na Ronda 1), não uma alteração de âmbito.

## Retratos — mesma disciplina da Ronda 2, com uma correção de processo

Cada uma das 37 personagens ganha um retrato SVG único em `assets/retratos/<id>.svg`, seguindo exatamente a técnica já estabelecida (viewBox `0 0 100 100`, camadas: roupa → pescoço → cara → orelhas → cabelo/véu/barba → sobrancelhas → olhos → nariz → boca), a mesma paleta quente, e o mesmo requisito de unicidade genuína por personagem (nunca copiar-e-recolorir).

**Correção de processo face à Ronda 2:** a revisão final da Ronda 2 descobriu que a Lia e a Sara tinham ficado quase geometricamente idênticas — não porque alguém fosse descuidado, mas porque cada revisão de tarefa só comparava dentro do seu próprio lote, nunca contra lotes anteriores não mencionados explicitamente. Nesta ronda, cada lote de retratos tem de comparar explicitamente contra **todas** as personagens já existentes (as 34 da Ronda 1/2 e as já feitas desta ronda), não só contra o seu próprio lote — e o plano de implementação inclui uma tarefa final dedicada a uma auditoria de distinção cruzada a todo o elenco (agora 71 personagens), tal como recomendado nessa revisão.

## Validação

Mesma abordagem das rondas anteriores: verificação de validade de JSON/SVG a cada lote, mais verificação real no browser (incluindo clique real, não só inspeção de ficheiro — outra lição da Ronda 2, cuja revisão final descobriu que isso nunca tinha sido feito a sério). A tarefa final de auditoria de distinção cruzada mais um clique-through real a todas as 71 personagens fecham esta ronda.
