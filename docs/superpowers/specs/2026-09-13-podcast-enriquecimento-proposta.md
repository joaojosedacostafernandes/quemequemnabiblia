# Proposta — enriquecer o conteúdo com o podcast "As Histórias da Bíblia"

**Data:** 2026-09-13
**Fonte:** podcast "As Histórias da Bíblia" (Rádio Observador) — 34 episódios, dois
padres (Daniel Nascimento, prof. na Universidade Católica; João Basto) + o
jornalista João Francisco Gomes. Transcrições em `podcast/transcricoes/`.

## Avaliação (porquê vale a pena)

Conteúdo acessível mas **teologicamente sólido**, em português, que cobre
exatamente o âmbito do projeto: cânone católico completo (incl. deuterocanónicos
e questões de canonicidade), Novo Testamento (Jesus, Pedro, Maria Madalena, João
Batista, Paulo, evangelhos, ressurreição, Apocalipse) e temas transversais. É
uma mina — mas é conteúdo **para adultos**, tem de ser **destilado e filtrado**
para catequese infantil, não colado.

**Encaixa nos campos que já existem** em `data/personagens.json`:
- `contexto` histórico muito mais rico;
- `citacao` e `licao`/`mensagem` por acontecimento mais fortes;
- ganchos de curiosidade ("sabias que") que prendem crianças;
- `edges` em falta (o podcast liga personagens entre livros o tempo todo).

**Preenche lacunas conhecidas** (handover): deuterocanónicos narrativos e mais
NT/Atos — há episódios sobre canonicidade/versões, Apocalipse, São Paulo,
evangelhos, profetas.

**Ideias novas que o formato desbloqueia:**
- os 13 "Perguntas dos ouvintes" (perguntas reais) → base para uma secção de
  perguntas adaptada a crianças;
- "Ouve a história" — ligar cada acontecimento ao episódio (ver cautelas).

**Cautelas:**
- **Tom:** adulto e por vezes crítico/académico (historicidade — "romance
  histórico"; nacionalismo; violência; o ep. do "poema erótico"). Simplificar e
  filtrar; usar factos e contexto, não o registo que confundiria uma criança
  sobre a fé. A Isabel decide o enquadramento.
- **NÃO referenciar o podcast (decisão do utilizador):** as transcrições são só
  **material de pesquisa**. O produto **nunca** menciona o podcast nem credita a
  fonte, e **nunca** copia frases/citações da transcrição. Usam-se apenas os
  **factos e o contexto** (de domínio público), **reescritos de raiz** na voz do
  projeto. Regra prática: se uma frase pudesse ser reconhecida como do podcast,
  reescreve-se até deixar de o ser.
- **Volume:** 34×~35KB exige curadoria, não integração automática.

## Fluxo proposto (ronda de conteúdo dedicada)
1. Mapear cada episódio → personagens/acontecimentos do `data/personagens.json`.
2. Por personagem/evento: o assistente **propõe** `contexto`/curiosidades/
   `citacao`/`licao` destilados e adequados a crianças, com a fonte creditada.
3. A **Isabel aprova/ajusta** (mantém a regra de ela editar o conteúdo).
4. Fechar as `edges` que o conteúdo revelar.

Opção de modelo de dados: as curiosidades podem (a) ser tecidas no `contexto`
existente (zero mudança de motor), ou (b) um campo novo `curiosidades: []`
mostrado como lista na ficha (pequena mudança de motor). Recomenda-se começar
por (a) no piloto.

---

## Piloto — Ester (rascunho para a Isabel rever)

A entrada atual da Ester já é boa (resumo/contexto/lição/citação preenchidos).
O piloto **acrescenta**, não duplica. Tudo abaixo é destilado do episódio 15
("Ester: como uma mulher judia se tornou Rainha da Pérsia") e **simplificado
para crianças**.

### Curiosidades ("sabias que") — adequadas a crianças
1. **A festa do Purim.** Ainda hoje os judeus festejam esta história todos os
   anos, numa festa muito alegre chamada Purim: leem o livro inteiro em voz alta
   e, sempre que ouvem o nome do vilão Amã, fazem barulho com matracas para o
   "apagar".
2. **A forca do vilão.** Amã mandou construir uma forca enorme para matar
   Mardoqueu — mas no fim foi ele próprio que acabou nela. O plano do vilão
   virou-se contra ele.
3. **Ester faz lembrar Maria.** Os cristãos veem nesta rainha humilde e corajosa,
   que arrisca tudo para salvar o seu povo, uma imagem que faz lembrar Maria.

### Curiosidade extra (mais para catequistas / crianças mais velhas)
4. **Duas versões do livro.** O livro de Ester tem duas versões: uma mais curta
   (hebraica), onde Deus nunca é nomeado, e uma mais longa (a da Bíblia
   católica), com orações em que Deus aparece.

### Ligação a acrescentar ao `contexto` (liga a personagens que já tens)
> O primo de Ester, Mardoqueu, era do povo do rei Saul; o vilão Amã descendia
> dos amalecitas, o antigo inimigo que Saul tinha enfrentado. A velha rivalidade
> regressa nesta história.

Isto sugere uma `edge` de tipo `descendant`/`affinity` **Ester/Mardoqueu ↔ Saul**
(a confirmar pela Isabel).

### Possíveis personagens novos (fora do âmbito do piloto — só assinalar)
Vasti (a rainha deposta) e uma âncora "amalecitas/Amã↔Saul" apareceriam se se
quisesse desenhar essa rivalidade — decisão da Isabel numa ronda futura.

### Atribuição
**Nenhuma** — por decisão do utilizador, o produto não referencia o podcast. O
piloto acima já está escrito na voz do projeto, sem citar a fonte.

---

## Programa aprovado (2026-09-13)

Decisões do utilizador:
- **Curiosidades tecidas no `contexto`** existente (sem mudança de motor).
- **Âmbito:** enriquecer o existente **+ preencher lacunas** (novas personagens/
  eventos + novas `edges`), com **retrato** para cada personagem nova.
- **Avançar em todos os lotes.**
- **Não referenciar o podcast** (ver cautela acima).
- Por defeito: rascunhos preparados em worktree isolado, **Isabel revê o diff
  antes do merge**; "Perguntas dos ouvintes" alimentam o contexto, mas uma
  secção de perguntas fica para outra ronda.

**Unidade de trabalho (por episódio):** transcrição → destilar factos/contexto/
curiosidades e simplificar para crianças → mapear a personagem/acontecimento →
enriquecer `contexto`/`licao`/`citacao`/`mensagem`/`notas` + `edges` novas + (se
lacuna) personagem/evento novo com retrato → rascunho → revisão da Isabel → merge.

**Lotes (cada um: spec → plano → worktree → revisão → Isabel → merge):**
- **A — Origens & Patriarcas:** Noé(01), Caim/Abel(22), Abraão(21), criação(33),
  o nome de Deus(32).
- **B — Juízes a Reis:** Josué(20), Sansão/Dalila(19), Rute(17), Ester(15),
  David/Salomão(31). *(começar por aqui — mais narrativo e já tem o piloto Ester)*
- **C — Profetas & Sabedoria:** Job/Jonas(13), "o que é um profeta"(28),
  Cânticos(30, filtrar).
- **D — NT (Evangelhos):** pais de Jesus(09), João Batista(11), Jesus(07), Maria
  Madalena(05), Pedro(03), ressurreição(25), parábolas/Messias(26), evangelhos(27).
- **E — Atos, Paulo & Apocalipse:** São Paulo(24), Apocalipse(23).
- Transversais (Q&A + trauma(29) + "livro mais vendido"(34)): factos aproveitados
  onde encaixarem nos lotes; sem secção própria nesta ronda.

**Ronda-irmã (fonte diferente, não o podcast):** deuterocanónicos narrativos
**Tobias / Judite / Macabeus** — sem episódios; preencher a partir da Escritura
numa ronda à parte, para não misturar fontes.

