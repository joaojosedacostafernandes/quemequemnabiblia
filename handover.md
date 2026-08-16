# Handover — Os Personagens da Bíblia

Sessão de 2026-08-16. Contexto para continuar este projeto noutra sessão.

## O projeto

Site para a **Paróquia da Póvoa de Santa Iria**: "Os Personagens da Bíblia" — um grafo navegável com as personagens da Bíblia, ordenadas cronologicamente, mostrando relações entre elas, referências bíblicas e a sua importância na história. Deve ser muito interativo, tipo jogo, para poder ser usado por crianças na catequese.

Promotora: Isabel, diretora técnica de uma farmácia militar, católica, envolvida na paróquia. Sem experiência técnica/programação.

## Decisões tomadas

- **Âmbito bíblico:** cânone católico completo, incluindo deuterocanónicos.
- **Estilo de interação:** exploração livre do grafo (sem quizzes, pontos ou missões).
- **Escala pretendida:** o máximo de personagens possível, sem limite artificial — mas sem prazo definido, ritmo livre.
- **Stack:** simplicidade acima de tudo, dado que a Isabel não tem experiência técnica. Site estático, conteúdo separado do "motor" (idealmente ficheiro de dados simples tipo JSON), hosting gratuito.

## O que foi feito

### Protótipo "Constelação Bíblica" → redesign visual e de conteúdo, já no repositório

O protótipo inicial (20 personagens) foi publicado como Artifact e é a origem do conceito. Esse Artifact continua acessível mas está desatualizado:
https://claude.ai/code/artifact/db49ef11-59ed-4cee-ba20-cf7c01c4b171

**O código a usar/manter é agora o deste repositório**, não o Artifact. Um plano de 7 tarefas ("redesign-visual-conteudo", 2026-08-16) reescreveu o motor e ampliou o conteúdo para 34 personagens de Génesis e Êxodo. Ficheiros:

- `index.html` — estrutura da página.
- `style.css` — visual (tema claro pergaminho/âmbar, tipografia serif Georgia para nomes + sans do sistema para o resto; layout responsivo com painel lateral em desktop e "bottom sheet" em mobile via `@media (max-width: 720px)`).
- `app.js` — motor do grafo: lê `data/personagens.json` via `fetch`, desenha nós/ligações em SVG, pan/zoom por arrasto e botões, abre o painel de detalhe ao clicar num nó.
- `data/personagens.json` — os dados: 34 personagens (`personagens[]`, cada um com id/nome/tipo/tier/x/y/era/refs/resumo/contexto/relacoes) e 53 ligações (`edges[]` — pai/mãe, casamento, irmãos, "várias gerações depois").
- `assets/icons/` — ícones SVG por `tipo` de personagem.

⚠️ **`index.html` não pode ser aberto diretamente com `file://`** — o `fetch("data/personagens.json")` falha por CORS na maioria dos browsers. É preciso servir a pasta por `http://` (ex: skill `run`, ou qualquer servidor estático simples).

QA final (2026-08-16): mobile viewport confirmado (instruções e rodapé escondem-se, painel abre como bottom sheet com botão "Fechar ×" funcional); as 34 personagens confirmadas com contexto/resumo/relações preenchidos (verificado via clique real em todas, usando Chrome DevTools Protocol já que não havia Node/Python disponíveis na máquina). Corrigida uma sobreposição visual: a ligação de irmãos Arão↔Miriam passava em cima do medalhão de Moisés (os três estavam alinhados); Arão foi deslocado ligeiramente (`x: 1420` → `1460`).

### Configuração do projeto

Criado `.claude/settings.json` na raiz do projeto com dois plugins:

```json
{
  "extraKnownMarketplaces": {
    "superpowers-marketplace": {
      "source": { "source": "github", "repo": "obra/superpowers-marketplace" }
    }
  },
  "enabledPlugins": {
    "superpowers@superpowers-marketplace": true,
    "frontend-design@claude-plugins-official": true
  }
}
```

- **superpowers** — biblioteca de skills (TDD, debugging, planeamento, colaboração) de Jesse Vincent.
- **frontend-design** — plugin oficial da Anthropic para trabalho de design de interface.

⚠️ **Pendente:** estas alterações só são lidas ao arrancar o Claude Code. É preciso **reiniciar a sessão** (sair e reabrir o Claude Code nesta pasta) para a marketplace `superpowers-marketplace` ser descarregada e os plugins ativarem. Confirmar depois com `/plugin`.

## Por decidir / próximos passos

1. A Isabel precisa de ver e dar feedback ao novo visual "Livro de Ilustrações" (já implementado nesta branch, substituindo o conceito anterior "mapa de estrelas") — validar se resulta bem para crianças, nomeadamente a legibilidade dos ícones nas personagens de menor destaque ("tier": "minor").
2. Validar o nível de detalhe dos cartões de personagem (resumo + família) — ajustar para catequese se necessário.
3. Decidir o processo de expansão de conteúdo: cobrir o resto da Bíblia (Reis, Profetas, Evangelhos, Atos, Cartas...) é um trabalho grande de curadoria, não só técnico — decidir se a Isabel vai levantando os dados ou se isso é feito em conjunto, por "famílias"/blocos narrativos.
4. ~~Ainda não há repositório git nem ficheiros de código na pasta do projeto~~ — feito: o código (`index.html`/`style.css`/`app.js`/`data/personagens.json`) já está no repositório, ver secção "O que foi feito" acima. Falta ainda decidir onde/como publicar (hosting gratuito) para a Isabel poder ver a versão a correr fora desta sessão.
5. Confirmar após reiniciar a sessão que os plugins **superpowers** e **frontend-design** ativaram corretamente.

## Memória guardada

Duas memórias persistentes foram atualizadas nesta sessão (`~/.claude/projects/.../memory/`):
- `user_profile.md` — perfil da Isabel.
- `project_personagens_biblia.md` — decisões e progresso deste projeto.
