# Melhorias de UX/UI — Dinamismo, Interatividade e Mobile (design)

**Data:** 2026-09-09
**Origem:** pedido para "passar a interface pelo Fable" e torná-la mais dinâmica, mais interativa, com UX/UI de topo e excelente em mobile. Auditoria feita por um agente com o modelo Fable, validada no código real (`index.html`, `style.css`, `app.js`, `js/timeline.js`, `js/event-graph.js`, `js/warp-transition.js`).

## Objetivo

Elevar a experiência da app de "um site bonito" para "um brinquedo mágico" para crianças em catequese — sem redesenhar a identidade nem mudar o modelo de navegação. O diagnóstico central: falta **fisicalidade** — quase nada responde ao toque como um objeto real. É por aí que uma criança decide se a app é "fixe".

## Constrangimentos (não negociáveis)

- **Zero bibliotecas JS externas.** Continua tudo CSS/JS à mão + a fonte do Google. Nada de frameworks/npm.
- **Zero alterações a `data/personagens.json` e ao fluxo de edição da Isabel.** Nenhuma melhoria pode obrigar a dona do projeto (sem experiência técnica) a mexer em código para manter conteúdo. Toda a interação lê os campos que já existem.
- **Manter e elevar o tema espacial** (escuro, "constelação", Cormorant Garamond + Inter). Sem redesign da paleta/tipografia.
- **Mobile-first no toque.** Alvos grandes, gestos reais (toque, pinch, swipe). Público usa tablet/telemóvel.
- **`prefers-reduced-motion` respeitado** em tudo o que for novo (crianças com sensibilidade vestibular).
- Manter o modelo de navegação atual (linha do tempo → acontecimento → árvore genealógica → ficha). Melhorias, não substituição de motor.

## Fora de âmbito (deliberado)

- Redesign visual ousado (paleta/tipografia novas).
- Alterar o modelo de dados ou o fluxo de edição de conteúdo.
- Expansão de conteúdo (personagens/acontecimentos novos) — é trabalho de outras rondas.
- Qualquer forma de quiz, pontos, missões ou competição. (Exceção acordada: "O meu céu" — ver Ronda 23 — é progresso pessoal visual, não competição; aprovado explicitamente como dentro do espírito de "exploração livre".)

## Princípios de execução (todas as Rondas)

- Cada Ronda é **independente e entregável por si**, e é **integrada em `master` antes de começar a seguinte** (lição registada no handover: manter correções por integrar durante várias rondas cria janelas em que o utilizador reencontra bugs sem ter havido regressão).
- Fluxo por Ronda: worktree isolado → implementação → verificação com **eventos reais** (rato + toque via CDP, `Input.dispatchMouseEvent`/`Input.dispatchTouchEvent`, nunca `.click()` sintético) → merge para `master` via finishing-a-development-branch → atualizar `handover.md` e memória.
- Cada peça de motion tem o seu par em `@media (prefers-reduced-motion: reduce)`.
- Ficheiros afetados são sempre um subconjunto de: `style.css`, `js/timeline.js`, `js/event-graph.js`, `js/warp-transition.js`, `app.js`, `index.html`. Nenhuma Ronda toca em `data/`.

## Fatiamento em Rondas

### Ronda 19 — Linha do tempo que não te perde

Corrige o que está genuinamente partido hoje.

- **Limite (clamp) elástico** em `js/timeline.js`: `railOffset` fica preso ao intervalo `[-(n-1)*SPACING, 0]`; nos extremos, o excesso é dividido (resistência elástica) e volta com ease-out ao largar. Elimina o "arrastar até ao vazio infinito".
- **Inércia + encaixe (snap):** guardar velocidade dos últimos movimentos; ao largar (`mouseup`/`touchend`), rAF loop com decaimento e, ao abrandar, animar até ao múltiplo de `SPACING` mais próximo (~300ms ease-out). O acontecimento fica sempre centrado e clicável.
- **Setas do tempo animadas e desativadas nos extremos** (`scrollLeft`/`scrollRight`); dentro de um acontecimento, `gotoAdjacentEvent` também desativa nos extremos (fim de `app.js` deixa de "falhar em silêncio").
- **History API:** `enterEvent` faz `history.pushState({ev: ev.id}, '', '#'+ev.id)`; `popstate` sai do acontecimento (origem no centro) ou entra no acontecimento do hash. Botão "voltar" do telemóvel volta à linha do tempo em vez de sair do site; links partilháveis (`#exodo`) de bónus. Fallback de origem central quando não há coordenadas de clique (ex: Enter no `backBtn`, `popstate`).

Ficheiros: `js/timeline.js`, `app.js`.

### Ronda 20 — O momento mágico

O maior salto de qualidade percebida.

- **Entrada em cascata dos personagens** (`js/event-graph.js` `render`): ordenar por `layout.gen`; keyframe `charEnter` com `animation-delay: gen*120 + indiceNaFila*40`ms, `from { opacity:0; transform: translate(-50%,-30%) scale(.3) }`, ease com overshoot `cubic-bezier(.34,1.56,.64,1)`. Pais primeiro, filhos "nascem" depois — o motion ensina a genealogia.
- **Linhas de família a traçarem-se:** cada `.cline` animada com `stroke-dasharray`/`stroke-dashoffset` (comprimento por distância calculada), alinhada com a geração do filho; casamentos primeiro, descendência depois.
- **Feedback tátil universal:** estados `:active` (`.char`, `.event-marker`, botões) com "squash" (`scale(.9)`, 80ms in / 250ms out com overshoot) + "pop" de brilho. Resolve o "toquei e não aconteceu nada" em ecrã tátil (onde `:hover` não dispara).
- **Micro-coreografia do warp** (`js/warp-transition.js` + `app.js`): sincronizar streaks → flash → revelação do `#eventView`, para o "uau" coincidir com a revelação do novo mundo.
- **Cross-fade no painel** ao trocar de personagem (`panelBody` opacity/translateY antes/depois do `innerHTML`).
- **Perf/polimento do motion existente:** `floatChar` passa a animar `transform` (não `margin-top`); `ringPulse` ganha `animation-delay` variado (deixa de pulsar tudo em sincronia mecânica).

Ficheiros: `js/event-graph.js`, `js/warp-transition.js`, `style.css`, `app.js`.

### Ronda 21 — Mobile a sério

- **Pinch-zoom + zoom ancorado** (`app.js`): aceitar `touches.length === 2` (distância → `camScale`, ponto médio fixo); a mesma matemática âncora o wheel-zoom no cursor (hoje escala sempre do centro e empurra para fora quem está no canto).
- **Câmara que centra no personagem** (`focusChar`): ao clicar num chip de família ou resultado, animar `camTx/camTy` (lerp em rAF ~400ms) até o orbe ficar visível na zona não coberta pelo painel (desktop: centro-esquerda; mobile: terço superior). Substitui o `setTimeout(700)` mágico por encadeamento fiável.
- **Alvos de toque ≥44px:** setas, zoom, `panel-close`, `back-btn`; dots mantêm 6px visuais mas hitbox alargada (`padding` + `background-clip: content-box`); `touch-action: manipulation` nos botões.
- **Bottom sheet com pega + swipe-down** (mobile): handle visual; `touchmove` traduz o painel e fecha se arrastado >30% ou com velocidade; fecha também ao tocar fora.
- **Grelha de info a 1 coluna** no `@media (max-width:720px)`; subir tamanhos mínimos de UI para 13–14px.
- **Teclado:** Escape fecha painel → sai do acontecimento (dois níveis); ←/→ navegam o tempo.
- **Verificação recomendada num dispositivo físico real** (as Rondas 14–18 só foram validadas por emulação CDP).

Ficheiros: `app.js`, `style.css`.

### Ronda 22 — Feito para crianças

- **Ficha com hierarquia infantil** (`focusChar` HTML + `style.css`): retrato maior, lição/citação em destaque visual, "Contexto histórico" (para catequistas) colapsado por defeito com toggle. Mesmos campos do JSON, ordem/estilo diferentes.
- **Anterior/seguinte de personagem** dentro do acontecimento: setas na ficha percorrem `currentEvent.personagens` sem fechar o painel (ver os 12 apóstolos um a um).
- **Pesquisa melhorada:** navegação por setas ↑↓ + Enter; estado "Sem resultados"; **indexar também `acontecimentos`** (um resultado do tipo "Acontecimento" entra direto no evento — "Arca", "Êxodo" passam a encontrar).
- **Cor por era na calha + nebulosa por era:** tingir o gradiente do `#railPath` por troços usando o `tint` que cada acontecimento já tem; a nebulosa dominante muda suavemente conforme o acontecimento mais próximo do centro. Eleva o tema espacial sem custo de conteúdo.

Ficheiros: `app.js`, `js/timeline.js`, `style.css`.

### Ronda 23 — Experiências memoráveis

Todas sem bibliotecas e sem tocar no JSON.

- **"Ouve a história":** botão de altifalante na ficha e na descrição do acontecimento, `speechSynthesis` com voz `pt-PT` (Web Speech API). Enquanto lê, halo pulsante no orbe. Degrada graciosamente (esconde o botão se `!('speechSynthesis' in window)` ou sem voz pt disponível). Duplica quem consegue usar sozinho (catequizandos que ainda não leem bem).
- **"O meu céu":** acontecimentos visitados gravados em `localStorage`; na linha do tempo a estrela acende-se a dourado e os não visitados ficam mais ténues; contador discreto "N de 40 estrelas acesas" no topo. Sem pontos/missões/competição — progresso pessoal, respeita "exploração livre". Zero alterações ao JSON.
- **Modo apresentação:** botão ▶ que percorre a linha do tempo automaticamente (desliza com easing até cada acontecimento, pausa ~4s com título + `desc`, segue; toque em qualquer sítio pausa/entra). Reaproveita `jumpTo`/`applyOffset`; para a catequista projetar na sala.

Ficheiros: `app.js`, `js/timeline.js`, `index.html`, `style.css`.

## Critérios de sucesso

- A linha do tempo nunca deixa o utilizador "perdido no vazio"; largar o arrasto encaixa sempre num acontecimento.
- O botão "voltar" do browser/telemóvel volta à linha do tempo, nunca sai do site.
- Entrar num acontecimento produz uma entrada animada legível (cascata + linhas), não um aparecimento instantâneo.
- Todos os alvos de toque acionáveis têm ≥44px (ou hitbox equivalente); pinch-zoom e swipe-down funcionam num dispositivo real.
- Nenhum nome de personagem é cortado (mantém a garantia da Ronda 16).
- `prefers-reduced-motion` desliga/reduz o motion novo de forma coerente.
- Nenhuma alteração a `data/personagens.json`; `node scripts/test-event-graph.js` continua a passar (e ganha cobertura se `event-graph.js` mudar de forma testável).

## Riscos e mitigações

- **Testar toque só por emulação** (armadilha das Rondas 14–18): a Ronda 21 recomenda explicitamente verificação num tablet/telemóvel real antes do merge.
- **Voz `pt-PT` inexistente nalguns dispositivos** (Ronda 23): detetar e esconder o botão; nunca falhar ruidosamente.
- **Regressão de performance com muitos personagens animados** (Ronda 20): usar só `transform`/`opacity` (compositáveis), medir num tablet fraco.
- **History API vs saltos internos** (Ronda 19): garantir que pesquisa e "também aparece em" (que mudam de acontecimento) mantêm a pilha de histórico coerente, sem entradas duplicadas.
