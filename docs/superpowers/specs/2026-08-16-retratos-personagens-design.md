# Sistema de retratos ilustrados por personagem

Data: 2026-08-16
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

Depois do redesign "Livro de Ilustrações" (ver `2026-08-16-redesign-visual-conteudo-design.md`), a Isabel viu o site a funcionar e pediu duas coisas: alargar o conteúdo para o resto da Bíblia, e substituir os ícones genéricos por tipo por **retratos ilustrados únicos por personagem**.

Não existe nenhuma ferramenta de geração de imagens fotorrealistas disponível — os retratos são ilustração vetorial (SVG) desenhada em código, no mesmo espírito dos ícones atuais mas com muito mais detalhe (olhos, boca, cabelo, roupa). A Isabel viu 3 opções de fidelidade lado a lado (ícone atual / avatar geométrico / retrato detalhado) e escolheu explicitamente a mais detalhada, sabendo que isso significa mais trabalho por personagem. Escolheu também explicitamente retratos **100% únicos por personagem**, não uma composição a partir de peças reutilizáveis (essa alternativa mais barata foi proposta e recusada).

Dado o volume ("a Bíblia toda"), o trabalho fica dividido em rondas. Esta spec cobre a **Ronda 2**: construir o sistema de retratos e ilustrar as 34 personagens já existentes (Génesis/Êxodo). Uma Ronda 3 (fora de âmbito aqui) trata do próximo bloco de conteúdo (Juízes e Reis), já usando este sistema desde o início.

## Objetivo desta ronda

Adicionar um campo `retrato` a cada uma das 34 personagens existentes, apontando para uma ilustração SVG única, e mudar o motor de renderização para mostrar esse retrato (recortado em círculo) no lugar do ícone por tipo — tanto no medalhão do grafo como, maior, no topo do cartão lateral. Personagens sem `retrato` (todas as futuras, até serem ilustradas) continuam a mostrar o ícone por tipo — o sistema nunca fica "partido" por faltar um retrato.

**Fora de âmbito:** conteúdo novo / mais personagens (Ronda 3); qualquer motor de composição automática de retratos a partir de peças (recusado explicitamente).

## Direção artística (para manter consistência entre os 34 retratos)

- Mesmo viewBox para todos: `0 0 100 100`, retrato pensado para ser visto pequeno (recortado a um círculo no grafo) e grande (~140px no cartão) — por isso os traços principais (contorno da cara, olhos, cabelo) têm de ler bem em ambos os tamanhos.
- Paleta: reutilizar as cores já definidas no projeto — tons de pele em ocres/terracotas claros (ex: `#e8c9a0`, `#d9b483`, `#c99a6b`, `#8a6238` — variar por personagem), cabelo em castanhos/pretos/grisalhos (`#3d2a1a`, `#6b3d1c`, `#8a5a2b`, `#a8a8a8` para grisalho), roupa em tons que já existem no sistema (`#c1652f` terracota, `#7fb88a` verde oliva, `#a8763f` ocre, `#5f7a52`, `#b4763f`) — nunca cores fora desta paleta quente.
- Composição: forma da cara (elipse/redonda/angulosa) + cabelo/barba/véu (forma e cor) + dois olhos simples + uma boca simples (linha ou curva, sem dentes/detalhe excessivo) + uma faixa de "roupa/ombros" na base do círculo. Sem fundo (transparente) — o medalhão por trás já dá o fundo creme.
- Uma característica distintiva por personagem sempre que a Bíblia ou a tradição sugerir uma (ex: Noé mais velho e grisalho; Sansão — fora de âmbito aqui — cabelo comprido; José com uma pinta de cor na roupa lembrando a túnica multicolor; Miriam com um véu; Moisés com barba mais longa e um ar mais maduro que na juventude). Onde a Bíblia não dá pistas, escolher algo razoável e consistente com a idade/papel indicados no campo `era`/`resumo` já existente.
- Nunca desenhar os mesmos traços exatos em duas personagens — mesmo entre membros da mesma família (ex: Isaac e Jacob não podem ser visualmente intercambiáveis), para cumprir o pedido de unicidade.

## Ficha de direção por personagem (34)

Usada pelos implementadores como ponto de partida — não é uma descrição rígida, é para garantir que cada retrato é deliberado e não improvisado às cegas.

| id | idade/género | pele | cabelo/rosto | nota visual |
|---|---|---|---|---|
| adao | homem jovem/meia-idade | `#d9b483` | castanho curto, sem barba | primeiro homem, simples, sem adornos |
| eva | mulher jovem | `#e8c9a0` | castanho longo solto | simples, sem adornos |
| caim | homem jovem | `#c99a6b` | preto curto | expressão mais carregada/séria |
| abel | homem jovem | `#d9b483` | castanho claro curto | expressão mais serena |
| sete | homem jovem | `#d9b483` | castanho médio | neutro |
| noe | homem idoso | `#c99a6b` | grisalho, barba longa grisalha | rugas leves, ar sereno/sábio |
| sem | homem meia-idade | `#c99a6b` | castanho escuro, barba curta | neutro |
| abraao | homem idoso | `#c99a6b` | grisalho, barba grisalha média | ar de autoridade calma |
| sara | mulher idosa | `#e8c9a0` | grisalho, véu/lenço claro | leve sorriso (Gn 18:12) |
| agar | mulher jovem/meia-idade | `#8a6238` | preto, lenço simples | expressão resiliente |
| ismael | homem jovem | `#8a6238` | preto curto | ar de caçador/ar livre |
| isaac | homem meia-idade | `#d9b483` | castanho, barba curta | traços distintos do pai Abraão |
| rebeca | mulher jovem/meia-idade | `#e8c9a0` | castanho escuro, véu leve | expressão atenta/hospitaleira |
| esau | homem jovem/meia-idade | `#c99a6b` | ruivo/castanho avermelhado, barba mais desalinhada | ar rústico, ao ar livre |
| jacob | homem jovem/meia-idade | `#d9b483` | castanho escuro, sem barba ou barba rala | traços distintos do irmão Esaú |
| raquel | mulher jovem | `#e8c9a0` | preto longo | expressão suave |
| lia | mulher jovem/meia-idade | `#d9b483` | castanho, véu simples | expressão mais contida |
| jose | homem jovem | `#d9b483` | preto encaracolado curto | um toque de cor na "roupa" a lembrar a túnica multicolor |
| moises | homem idoso | `#c99a6b` | grisalho, barba longa grisalha | ar grave/profético |
| miriam | mulher meia-idade | `#e8c9a0` | grisalho a castanho, véu | expressão de quem canta/celebra |
| ruben | homem jovem | `#d9b483` | castanho curto | neutro |
| simeao | homem jovem | `#c99a6b` | preto curto | expressão mais dura |
| levi | homem jovem | `#d9b483` | castanho médio | ar mais sério/formal |
| juda | homem jovem/meia-idade | `#c99a6b` | castanho escuro, barba curta | ar de liderança |
| issacar | homem jovem | `#d9b483` | castanho | neutro |
| zabulao | homem jovem | `#c99a6b` | castanho escuro | neutro |
| dan | homem jovem | `#8a6238` | preto curto | neutro |
| neftali | homem jovem | `#8a6238` | preto curto, traços distintos do irmão Dan | neutro |
| gad | homem jovem | `#c99a6b` | castanho | neutro |
| aser | homem jovem | `#c99a6b` | castanho, traços distintos do irmão Gad | neutro |
| dina | mulher jovem | `#e8c9a0` | castanho longo | única filha — expressão própria, não repetir Raquel/Lia |
| benjamim | homem jovem (criança/adolescente) | `#d9b483` | castanho claro | traços mais jovens/redondos que os irmãos mais velhos |
| arao | homem idoso | `#c99a6b` | grisalho, barba longa | traços distintos do irmão Moisés; leve toque cerimonial na roupa |
| farao | homem meia-idade | `#8a6238` | preto, sem barba ou barba fina à egípcia | único traço não-israelita do conjunto — pode ter um detalhe de roupa/cor diferente para o marcar como estrangeiro à narrativa |

## Modelo de dados

Cada personagem em `data/personagens.json` ganha um campo:

```json
"retrato": "assets/retratos/<id>.svg"
```

O campo é opcional — uma personagem sem `retrato` usa o ícone por tipo (comportamento atual, inalterado).

## Motor de renderização

No medalhão do grafo: se `n.retrato` existir, desenhar um `<image>` do retrato recortado a um `<clipPath>` circular do tamanho do medalhão, por cima do círculo de fundo `medallion`, no lugar do `<image class="icon">` atual (o ícone por tipo deixa de ser desenhado para essa personagem). Se `n.retrato` não existir, o comportamento é exatamente o atual (ícone por tipo).

No cartão lateral: se `n.retrato` existir, mostrar o retrato num círculo maior (~120-140px) no topo do cartão, antes da época/nome. Se não existir, o cartão não mostra imagem nenhuma (comportamento atual).

## Ficheiros

```
assets/retratos/
├── adao.svg
├── eva.svg
├── ... (34 no total, um por personagem desta ronda)
```

## Validação

Sem testes automatizados (mesma abordagem das rondas anteriores). Validação: verificar que cada um dos 34 ficheiros SVG é XML válido; verificar visualmente no browser (via skill `run`) que os retratos aparecem nos medalhões e nos cartões, que nenhum é visualmente indistinguível de outro (sobretudo dentro da mesma família), e que a paleta se mantém consistente com o resto do site.
