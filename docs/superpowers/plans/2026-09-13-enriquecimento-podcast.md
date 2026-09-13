# Enriquecimento de conteúdo (podcast → produto) — Plano de Implementação

> **For agentic workers:** trabalho de CONTEÚDO, não de código. As "tarefas" são
> lotes; os "passos" são por episódio. A verificação é integridade do JSON +
> zero cópia da fonte + render em browser + revisão da Isabel. Steps usam `- [ ]`.

**Goal:** Enriquecer `data/personagens.json` com o contexto histórico, curiosidades
e ligações destilados das transcrições do podcast (`podcast/transcricoes/`),
reescritos de raiz para catequese infantil, **sem nunca referenciar o podcast**.

**Architecture:** Só se edita `data/personagens.json` (o motor não muda; as
curiosidades são tecidas no campo `contexto` existente). Personagens novas (Job;
Vasti opcional) levam retrato SVG feito na mesma tarefa. Execução por **lotes por
era**, cada um num worktree isolado, revisto pela Isabel antes do merge.

**Tech Stack:** Site estático; dados em JSON. Node fora do PATH (prefixar o dir
winget). Verificação em browser real via CDP.

## Global Constraints
- **NUNCA referenciar o podcast** nem copiar frases/citações da transcrição. Só
  **factos e contexto** (domínio público), **reescritos** na voz do projeto.
  Teste: se uma frase pudesse ser reconhecida como da fonte, reescrever.
- **Curiosidades tecidas no campo `contexto`** (personagem e/ou `notas` do evento);
  **não** criar campo novo.
- **Tom de catequese infantil**, católico, em **português**. Filtrar registo
  adulto/crítico (historicidade, nacionalismo, violência, "poema erótico").
- **Personagem nova ⇒ retrato SVG** feito na mesma tarefa (regra do projeto).
- Toda a edição em **worktree isolado**; **Isabel revê o diff antes do merge**.
- Não inflacionar: cada `contexto` deve manter-se legível (não um muro de texto).

## Procedimento por episódio (reutilizável em todos os lotes)
1. Ler a transcrição do episódio em `podcast/transcricoes/`.
2. Extrair: (a) contexto histórico/cultural; (b) 2–4 curiosidades "sabias que"
   adequadas a crianças; (c) ligações entre personagens; (d) lacunas (personagem/
   evento em falta).
3. **Destilar e reescrever** (sem copiar) para 1–4 frases por item, tom infantil.
4. Mapear aos ids existentes (ver mapa em cada lote) e **tecer no `contexto`**
   da personagem e/ou nas `notas[charId]` do evento.
5. Acrescentar `edges` novas que o conteúdo revele (tipo correto).
6. Se lacuna real ⇒ criar personagem/evento + retrato.
7. Auto-verificação anti-cópia: reler cada frase nova e confirmar que não é
   reconhecível como da fonte.

## Verificação por lote (antes da revisão da Isabel)
- **Integridade do JSON:**
  `node -e "const d=require('./data/personagens.json'); const ids=new Set(d.personagens.map(p=>p.id)); let bad=0; d.edges.forEach(e=>{if(!ids.has(e[0])||!ids.has(e[1])){bad++;console.log('edge orfa',e)}}); d.acontecimentos.forEach(ev=>{(ev.personagens||[]).forEach(id=>{if(!ids.has(id)){bad++;console.log('ev char inexistente',ev.id,id)}}); if(ev.notas)Object.keys(ev.notas).forEach(k=>{if(!(ev.personagens||[]).includes(k)){bad++;console.log('nota sem char no evento',ev.id,k)}})}); console.log(bad?('FALHAS='+bad):'JSON OK')"`
  → deve imprimir `JSON OK`.
- **Testes do motor:** `node scripts/test-event-graph.js` → `ALL PASS` (o layout
  não deve regredir com dados novos).
- **Render real (CDP):** abrir 1–2 acontecimentos do lote, confirmar que o
  `contexto` enriquecido aparece na ficha e que a árvore/ligações continuam bem.
- **Anti-cópia:** revisão (subagent) que compara amostras do `contexto` novo com
  a transcrição e confirma que não há frases copiadas.

---

### Task A: Lote Origens & Patriarcas
**Episódios → alvos existentes:**
- 01 Noé → `noe`, evento `diluvio`
- 22 Caim e Abel → `caim`, `abel`, evento `origens`
- 33 "Deus criou as moscas" (criação) → `adao`, `eva`, evento `origens`
- 21 Abraão → `abraao`, `sara`, `agar`, `isaac`, `ismael`, evento `abraao_ev`
- 32 "o nome de Deus" → `moises`, evento `exodo_ev` (a revelação do nome YHWH)

**Passos:** aplicar o Procedimento por episódio aos 5 episódios acima; tecer
curiosidades no `contexto` de cada personagem/evento; acrescentar `edges` reveladas.
Sem personagens novas neste lote.

- [ ] Destilar+aplicar ep. 01, 22, 33, 21, 32 (um commit por episódio)
- [ ] Correr a Verificação por lote (JSON OK; ALL PASS; render; anti-cópia)
- [ ] Revisão da Isabel do diff → merge

### Task B: Lote Juízes a Reis  *(começar por aqui)*
**Episódios → alvos existentes:**
- 20 Josué → `josue`, evento `josue_ev`
- 19 Sansão e Dalila → `sansao`, `dalila`
- 17 Rute → `noemi`, `rute`, `booz`, evento `rute_ev`
- 15 Ester → `ester`, `mardoqueu`, `assuero`, `ama`, evento `ester_ev`
  *(piloto já rascunhado na spec: Purim, a forca de Amã, Ester↔Maria, Mardoqueu/Amã↔Saul)*
- 31 David e Salomão → `david`, `salomao`, eventos `reinado_david_ev`, `salomao_ev`

**Nova personagem (lacuna):** `job` **não** pertence a este lote (vai para o Lote C).
Possível `vasti` (rainha deposta, Ester) — criar só se a Isabel quiser (menor;
por defeito só mencionar no `contexto` da Ester).

**Ligação nova a propor:** Ester/`mardoqueu` ↔ `saul` (Mardoqueu do povo de Saul;
Amã amalecita) — tipo `descendant`/`affinity`, a confirmar.

- [ ] Aplicar o piloto da Ester (spec) ao `contexto`/`notas` + a ligação a Saul
- [ ] Destilar+aplicar ep. 20, 19, 17, 31 (um commit por episódio)
- [ ] Verificação por lote
- [ ] Revisão da Isabel → merge

### Task C: Lote Profetas & Sabedoria
**Episódios → alvos:**
- 13 Job e Jonas → **criar personagem `job` + retrato**; enriquecer `jonas`
- 28 "o que é um profeta" → tecer no `contexto` dos profetas já existentes
  (contexto transversal do que é um profeta, distribuído por 2–3 profetas-chave)
- 30 Cânticos ("poema erótico") → **filtrar fortemente**; no máximo uma nota
  sóbria no `contexto` do `salomao` sobre o Cântico dos Cânticos como poema de
  amor; se não houver forma adequada a crianças, **omitir**.

- [ ] Criar `job` (conteúdo + retrato) a partir do ep. 13
- [ ] Enriquecer `jonas` (ep. 13) e profetas (ep. 28); avaliar/omitir ep. 30
- [ ] Verificação por lote
- [ ] Revisão da Isabel → merge

### Task D: Lote Novo Testamento (Evangelhos)
**Episódios → alvos existentes:**
- 09 pais de Jesus → `maria`, `sao_jose`, evento `nascimento_ev`
- 11 João Batista → `joao_batista`, `santa_isabel`, `zacarias_sacerdote`
- 07 Jesus (história) → `jesus`
- 05 Maria Madalena → `maria_madalena`
- 03 Pedro → `pedro`
- 25 ressurreição → evento `paixao_ev` / `jesus`
- 26 Messias/parábolas → `jesus` (notas em vários eventos)
- 27 quatro evangelhos → `mateus`, `joao_apostolo`, (+ Marcos/Lucas se existirem)

- [ ] Destilar+aplicar ep. 09, 11, 07, 05, 03, 25, 26, 27 (um commit por episódio)
- [ ] Verificação por lote
- [ ] Revisão da Isabel → merge

### Task E: Lote Atos, Paulo & Apocalipse
**Episódios → alvos existentes:**
- 24 São Paulo → `paulo`
- 23 Apocalipse → `joao_apostolo` + evento de Apocalipse (confirmar id)

- [ ] Destilar+aplicar ep. 24, 23
- [ ] Verificação por lote
- [ ] Revisão da Isabel → merge

### Transversais (aproveitados, sem lote próprio)
Episódios Q&A (02,04,06,08,10,12,14,16,18), 29 (trauma), 34 (livro mais vendido):
factos úteis (ex.: porque há várias bíblias; canonicidade) tecidos no `contexto`
dos alvos relevantes durante os lotes acima; **secção de perguntas fica para
outra ronda**.

## Ronda-irmã (fonte diferente — NÃO o podcast)
Deuterocanónicos narrativos **Tobias / Judite / Macabeus**: sem episódios; a
preencher a partir da Escritura numa ronda à parte.

## Self-Review do plano
- Cobertura: os 21 episódios temáticos estão mapeados a alvos; os 13 Q&A + 3
  transversais estão explicitamente aproveitados/adiados. ✓
- Sem placeholders de conteúdo (o conteúdo é autorado na execução, por desenho —
  o plano especifica o procedimento e o mapeamento, não o texto final). ✓
- Regra anti-referência e anti-cópia repetida nas Global Constraints e no
  procedimento. ✓
