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

### Protótipo "Constelação Bíblica"

Publicado como Artifact (privado, conta da Isabel):
**https://claude.ai/code/artifact/db49ef11-59ed-4cee-ba20-cf7c01c4b171**

- 20 personagens de Génesis e Êxodo (Adão, Eva, Caim, Abel, Set, Noé, Sem, Abraão, Sara, Agar, Ismael, Isaac, Rebeca, Esaú, Jacob, Raquel, Lia, José, Moisés, Miriam).
- Grafo em forma de mapa de estrelas/constelação — nós = personagens, ligações = relações familiares. Ordenado da esquerda (mais antigo) para a direita (mais recente).
- 4 tipos de linha: pai/mãe (cheia), casamento (tracejado curto), irmãos (pontilhado), "várias gerações depois" (tracejado dourado, com referência bíblica, ex: "9 gerações · Gn 11" para Sem → Abraão).
- Clicar num nó abre um cartão com época, referências, resumo e família.
- Pan/zoom por arrasto e botões; em mobile o cartão vira "bottom sheet".
- Conceito visual: metáfora de céu noturno/constelação (liga-se a Gn 15:5, "a tua descendência será como as estrelas do céu"). Tema escuro único, deliberado (não segue claro/escuro do sistema). Tipografia serif (Georgia) para nomes/títulos + sans do sistema para o resto. Sem bibliotecas externas — tudo em SVG/JS puro, ficheiro único self-contained.
- **Ficheiro fonte ainda não está na pasta do projeto** — existe apenas no scratchpad temporário da sessão anterior (`constelacao-biblica.html`) e publicado como Artifact. Se for preciso recuperar/editar o código-fonte fora do Artifact, terá de ser reconstruído ou pedido via leitura do Artifact (WebFetch ao URL).

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

1. A Isabel precisa de ver e dar feedback ao protótipo — validar se o conceito visual "mapa de estrelas" resulta bem para crianças, ou se prefere outra estética (ex: árvore genealógica clássica, mais colorido/ilustrado).
2. Validar o nível de detalhe dos cartões de personagem (resumo + família) — ajustar para catequese se necessário.
3. Decidir o processo de expansão de conteúdo: cobrir o resto da Bíblia (Reis, Profetas, Evangelhos, Atos, Cartas...) é um trabalho grande de curadoria, não só técnico — decidir se a Isabel vai levantando os dados ou se isso é feito em conjunto, por "famílias"/blocos narrativos.
4. Ainda não há repositório git nem ficheiros de código na pasta do projeto — quando o protótipo for aprovado, criar a estrutura real do site ali (dados + motor de grafo) em vez de manter tudo apenas como Artifact.
5. Confirmar após reiniciar a sessão que os plugins **superpowers** e **frontend-design** ativaram corretamente.

## Memória guardada

Duas memórias persistentes foram atualizadas nesta sessão (`~/.claude/projects/.../memory/`):
- `user_profile.md` — perfil da Isabel.
- `project_personagens_biblia.md` — decisões e progresso deste projeto.
