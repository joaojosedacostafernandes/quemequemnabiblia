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
- **Direitos/atribuição:** factos e contexto histórico reescrevem-se livremente;
  **não** copiar transcrições/citações longas; **creditar** a fonte. Os áudios
  têm anúncios (cortar).
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

### Nota de atribuição (a incluir onde a Isabel achar)
Conteúdo inspirado no podcast **"As Histórias da Bíblia" (Rádio Observador)**.

---

## Próximo passo sugerido
Se a Isabel aprovar o piloto da Ester, replicar o mesmo para a **Rute** (episódio
17) e validar o fluxo antes de escalar aos 34 episódios.
