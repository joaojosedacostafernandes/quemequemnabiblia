# Ronda 4 — Isaías

Data: 2026-08-17
Estado: aprovado por Isabel, a aguardar plano de implementação

## Contexto

Depois da Ronda 3 (Juízes a Reis, reino dividido, 71 personagens), a Isabel pediu para continuar o mesmo trabalho com o "livro seguinte". Isaías é, ao contrário dos livros anteriores, sobretudo profecia — não uma narrativa densa em personagens. O elenco novo é por isso pequeno: o próprio Isaías, os reis Acaz e Uzias (contemporâneos cuja história cruza a do profeta) e o rei estrangeiro Senaqueribe (o cerco assírio a Jerusalém, Is 36-37). O Ezequias já existe do elenco da Ronda 3 e passa a ligar-se diretamente a este bloco.

Não há mudanças de arquitetura — mesma estrutura de ficheiros, mesmo modelo de dados, mesmo motor. Ronda de conteúdo pura, conteúdo e retrato feitos juntos como nas Rondas 3.

## Âmbito

4 personagens novas:
- **Isaías** (isaias) — profeta, personagem central. Tier major.
- **Acaz** (acaz) — rei de Judá, confrontado por Isaías (profecia do Emanuel, Is 7). Tier standard.
- **Uzias** (uzias) — rei de Judá, avô de Acaz; a sua morte marca a visão da vocação de Isaías (Is 6:1). Tier minor.
- **Senaqueribe** (senaqueribe) — rei assírio que cerca Jerusalém durante o reinado de Ezequias (Is 36-37; 2 Rs 18-19). Tier standard.

Fora de âmbito: os restantes profetas literários (Jeremias, Ezequiel, os 12 menores), o exílio babilónico, o pós-exílio — para rondas futuras.

## Correção de dados existentes (aproveitando a ligação a Ezequias)

Dois ajustes pequenos e diretamente relacionados com as personagens novas:
1. `ezequias.relacoes` passa a mencionar o pai (Acaz) — atualmente só menciona a descendência de Salomão.
2. Nova aresta `ezequias → josias` (descendant, 3 gerações via Manassés e Amon) — a Ronda 3 tinha deixado o texto de `josias.relacoes` a mencionar uma relação com Ezequias sem aresta correspondente (achado adiado do relatório final da Ronda 3). Esta ronda fecha essa lacuna.

## Grafo

`layout.width` cresce de 2900 para 3050 (altura mantém-se em 820 — há espaço vertical livre na zona x>2700). Zona nova fica à direita/acima do cluster de Ezequias/Josias (x=2850):

| id | x | y | tier |
|---|---|---|---|
| uzias | 2760 | 120 | minor |
| acaz | 2810 | 120 | standard |
| isaias | 2900 | 180 | major |
| senaqueribe | 2950 | 340 | standard |

Novo valor de `era` para as 4: "Isaías" (mesmo padrão usado para o bloco de Rute).

Arestas novas:
- `uzias → acaz` (descendant, "2 gerações, via Jotão · 2 Rs 15-16")
- `acaz → ezequias` (parent — ligação direta e precisa, complementa a aresta `descendant` já existente de Salomão)
- `ezequias → josias` (descendant, "3 gerações, via Manassés e Amon · 2 Rs 20-21")

Isaías e Senaqueribe não têm arestas familiares (mesmo padrão já usado para Rainha de Sabá, Faraó, Golias — figuras sem família registada no grafo).

## Retratos

Mesma técnica e disciplina já estabelecida (viewBox 0 0 100 100, camadas roupa→pescoço→cara→orelhas→cabelo/barba→sobrancelhas→olhos→nariz→boca, paleta quente, unicidade genuína). Com só 4 retratos novos, a comparação cruzada contra as 71 personagens existentes é viável dentro da própria tarefa — sem precisar de uma tarefa de auditoria separada como na Ronda 3. A auditoria geométrica automática (script já existente) corre no final na mesma, como rede de segurança.

## Validação

Mesma abordagem: JSON/SVG válidos, clique real no browser (protocolo CDP, não `dispatchEvent`), auditoria de distinção geométrica a todo o elenco (75 personagens no final).
