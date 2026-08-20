# Ronda 7 — Personagens e Ligações em Falta

Data: 2026-08-20
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

Depois de testar o site redesenhado, a Isabel reparou que a Betsabé menciona no seu texto ter casado com Urias antes de David, mas Urias não existe como personagem no grafo — não há como representar essa relação. Uma auditoria ao ficheiro completo confirmou que não é um caso isolado: há mais personagens mencionadas por nome no texto de outras que nunca ganharam nó próprio, e há também ligações em falta entre personagens que já existem, apesar de o texto as descrever.

Isabel aprovou fechar 7 dessas lacunas (as de maior importância narrativa) mais 4 ligações em falta entre personagens já existentes. As menções de passagem sem peso narrativo próprio (ex: Manoá, pai de Sansão; Lapidote, marido de Débora) ficam de fora — mantêm-se como já estão, só em texto.

Não há mudanças de arquitetura. Ronda de conteúdo pura, no mesmo padrão das Rondas 3-6: conteúdo e retrato feitos juntos. Uma simplificação real trazida pelo redesenho da Ronda anterior: como as posições já não são calculadas a partir de `x`/`y` manuais, esta ronda não precisa de planear coordenadas nem verificar sobreposições — o layout automático trata disso.

## Âmbito

8 personagens novas:

- **Urias, o hitita** (urias) — primeiro marido de Betsabé, morto por ordem de David para encobrir o adultério. Tier minor.
- **Jessé** (jesse) — pai de David, neto de Booz e Rute. Tier standard.
- **Nabal** (nabal) — primeiro marido de Abigail. Tier minor.
- **Calebe** (calebe) — um dos dois espiões fiéis (com Josué), irmão mais velho de Otoniel. Tier standard.
- **Elcana** (elcana) — marido de Ana, pai de Samuel. Tier minor.
- **Hofni** (hofni) — filho corrupto de Eli. Tier minor.
- **Finéias** (fineias) — filho corrupto de Eli, irmão de Hofni. Tier minor.
- **Efraim** (efraim) — filho de José, antepassado de Josué. Tier minor.

Fora de âmbito (mantêm-se só em texto, sem nó): Acsa (filha de Calebe), Manoá, Héber o quenita, Lapidote, Gileade, os dois filhos do Isaías — todas menções de passagem sem peso narrativo próprio suficiente para justificar um retrato dedicado.

## Ligações novas (15 no total)

Ligadas às 7 personagens novas:
- `urias ↔ betsabe` (spouse)
- `jesse → david` (parent)
- `booz → jesse` e `rute → jesse` (descendant, "2 gerações, via Obede · Rt 4:17,22") — substitui a necessidade de uma ligação direta Booz/Rute→David saltando várias gerações: agora há uma ligação direta e curta até Jessé, que por sua vez liga diretamente a David.
- `abigail ↔ nabal` (spouse)
- `calebe ↔ otoniel` (sibling)
- `elcana ↔ ana` (spouse)
- `elcana → samuel` (parent)
- `eli → hofni` e `eli → fineias` (parent)
- `hofni ↔ fineias` (sibling)
- `jose → efraim` (parent)
- `efraim → josue` (descendant, "várias gerações, incerta · 1 Cr 7:20-27" — a genealogia de 1 Crónicas 7 é textualmente complexa e a contagem exata de gerações não é consensual)

Entre personagens já existentes, sem precisar de nó novo:
- `ana → samuel` (parent) — já descrito em texto por ambos, sem aresta.
- `absalao ↔ salomao` (sibling) — meios-irmãos, ambos filhos de David.

**Nota de contagem:** o resumo apresentado à Isabel disse "7 personagens no total" (4 de alta importância + 3 de importância moderada), mas a lista de importância moderada já incluía 4 pessoas, não 3 (Elcana, Hofni, Finéias, Efraim são quatro personagens distintas, não três) — um erro de contagem no resumo, não uma mudança de âmbito. O conjunto que a Isabel aprovou já incluía o Efraim desde o início. O total correto é **8 personagens novas**. Este esclarecimento é reportado à Isabel no fecho da ronda.

## Retratos

Mesma técnica e disciplina (viewBox 0 0 100 100, camadas roupa→pescoço→cara→orelhas→cabelo/barba→sobrancelhas→olhos→nariz→boca, paleta quente). Risco de quase-clone a vigiar especialmente: Hofni e Finéias são irmãos com destinos quase idênticos no texto — precisam de um detalhe visual que os distinga um do outro, não só cor. Jessé e Calebe são ambos personagens `povo` tier standard, idosos — precisam também de distinção clara entre si e face aos patriarcas já existentes (Abraão, Noé), dado que esse par já teve um quase-clone genuíno identificado numa ronda anterior (Adão/Abraão).

O script `scripts/geometry-audit.js` (agora no repositório desde a ronda de redesenho) deve ser corrido como parte da validação desta tarefa.

## Validação

Mesma abordagem: JSON válido, clique real no browser (o novo motor de navegação por percurso/cluster, não o mapa antigo), auditoria de distinção geométrica a todo o elenco (105 personagens no final, se Efraim entrar — ver correção de âmbito acima).
