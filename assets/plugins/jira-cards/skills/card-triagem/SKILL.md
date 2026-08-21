---
name: card-triagem
description: Ajuda a decidir QUAL tipo de card do Jira criar antes de abrir — Epic (com filhos), Feature, Story, Spike, Chore ou Bug independentes, ou apenas uma Subtask de um card existente. Use quando a pessoa tem uma demanda solta e não sabe que card abrir, ou pergunta que tipo é — gatilhos como "que card criar", "qual tipo de card", "não sei se é feature ou story", "isso é bug ou chore", "é epic ou feature?", "me ajuda a classificar essa demanda", "que tipo de issue abrir".
---

# Card Triagem — qual card criar?

Você ajuda a classificar uma demanda solta no **tipo certo de card do Jira** e, depois, entrega pra skill correspondente montar o card. O objetivo é chegar a **um** destino. Não monte o card aqui — só decida o tipo e passe a régua.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-triagem preciso exportar relatório em CSV`), trate esse texto como a **demanda a classificar** e já comece a triagem por ele — pergunte só o que falta pra decidir o tipo.

## Destinos possíveis
1. **Epic + filhos** → skill `card-epic`
2. **Feature independente** → skill `card-feature`
3. **Story independente** → skill `card-story`
4. **Spike independente** → skill `card-spike`
5. **Chore independente** → skill `card-chore`
6. **Bug independente** → skill `card-bug`
7. **Subtask** de um card que já existe → sem template (convenção de nome)

## Processo
Faça perguntas **curtas, em ordem**, e pare assim que o destino ficar claro — não pergunte tudo de uma vez. Use AskUserQuestion nas bifurcações. Se a descrição inicial já responde uma pergunta, pule ela.

### Pergunta 0 — é parte de um card que JÁ existe?
Se a demanda é um passo operacional/desdobramento de um card já aberto ("criar a migration dessa story", "testar esse fluxo", "configurar o pipeline dessa feature") → **Subtask**. Subtask não tem template: convenção de nome com **verbo no início** ("Criar…", "Testar…", "Configurar…"). Encerre aqui — não precisa de skill.
Se não tem card pai, **não é subtask** — siga.

### Pergunta 1 — é reativo ou entrega planejada de produto?
- **Reativo** (algo quebrou / dívida técnica / dúvida a resolver antes de construir) → Pergunta 2.
- **Entrega planejada** (construir algo do produto) → Pergunta 3.

### Pergunta 2 — qual a natureza do reativo?
- Algo **quebrado** / comportamento errado / erro que o usuário vê → **Bug independente** (`card-bug`).
- Trabalho técnico **sem valor direto ao usuário**: refactor, limpeza, upgrade, padronização → **Chore independente** (`card-chore`).
- **Incerteza** a resolver antes de construir / decisão técnica / investigação com prazo que produz uma decisão (não código) → **Spike independente** (`card-spike`).

### Pergunta 3 — qual o tamanho/alcance da entrega?
- **Grande**: objetivo/iniciativa/projeto que vira **vários cards** e precisa de PRD (contexto, escopo, fluxo, talvez contrato/modelo de dados) → **Epic + filhos** (`card-epic` — que ao final oferece fracionar em Feature/Story/Spike).
- **Média (2 a 3 dias)**: entrega de capacidade/comportamento com spec, estados e edge cases → **Feature independente** (`card-feature`).
- **Pequena (1 a 2 dias)**: dá pra escrever "Como X, quero Y para Z", foco em **usabilidade e fluxo** → **Story independente** (`card-story`).
- **Corte:** nada passa de 3 dias. Se passa de 3 dias mas não é "vários cards / PRD", provavelmente são **várias Stories/Features** — sugira quebrar, ou subir pra Epic.

## Desempates comuns
- **Bug ou Chore?** Bug = usuário vê algo errado agora. Chore = incomoda o dev, usuário não percebe.
- **Feature ou Story?** Feature 2–3d, precisa de spec/estados. Story 1–2d, foco em fluxo/usabilidade. Na dúvida e passa de 2 dias → Feature.
- **Epic ou Feature?** Epic vira vários cards e tem PRD. Feature é um card só.
- **Spike ou já vou codar?** Se a pergunta é "qual caminho/tecnologia/abordagem?" e ainda não dá pra estimar → Spike. Se já sabe o caminho → Feature/Story.
- **Subtask ou Story?** Subtask não existe sozinha; precisa de um card pai. Sem pai, não é subtask.

Mais exemplos resolvidos em `references/exemplos.md` — consulte quando a demanda for ambígua.

## Saída
1. Diga o **tipo recomendado** + **1 linha** do porquê.
2. Se for **Subtask**, dê a convenção de nome e encerre.
3. Senão, **ofereça acionar a skill correspondente** pra já montar o card. Se a pessoa confirmar, siga pra essa skill.
Nunca crie/monte o card sem a pessoa confirmar o tipo.
