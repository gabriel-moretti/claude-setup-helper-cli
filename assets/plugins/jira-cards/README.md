# jira-cards — Templates de card do Jira (DeltaPag)

Plugin com uma skill por tipo de card. Cada skill entrevista quem está abrindo o card,
preenche o formato fixo da equipe e devolve a **descrição pronta pra colar** no Jira.
Não depende de conector — funciona escrevendo o texto do card.

## Skills

| Skill | Tipo de card | Quando usar |
|-------|--------------|-------------|
| `card-triagem` | — (roteador) | **Comece aqui** quando não sabe que card abrir. Classifica a demanda e chama a skill certa. |
| `card-request` | Request (entrada) | Pedido vindo de fora do time. Registra o pedido cru e tria o que ele deve virar. |
| `card-epic` | Epic (PRD) | Objetivo/produto maior. O "documento" que define o que construir. |
| `card-feature` | Feature | Capacidade nova com spec e estados. ~2–3 dias. Vive numa Epic. |
| `card-story` | Story | Fatia de fluxo/usabilidade. ~1–2 dias. "Como X, quero Y para Z". Vive numa Epic. |
| `card-bug` | Bug | Algo quebrado/comportamento errado. Reativo, pode ficar solto. |
| `card-chore` | Chore (Débito Técnico) | Refactor/limpeza/padronização. Reativo, pode ficar solto. |
| `card-spike` | Spike (Discovery) | Investigação com prazo que produz uma decisão. |

Como usar: cada skill é um comando (`/card-epic`, `/card-bug`, …). Você pode já mandar
a descrição junto — `/card-epic sistema de conciliação bancária` — que a skill usa esse
texto como descrição inicial, pré-preenche o que der e só pergunta o que falta. Também
funciona em linguagem natural ("quero abrir um bug no jira"). Se não souber qual card
criar, comece pela `card-triagem` ("me ajuda a decidir que card é esse").

## Por onde começar — árvore de decisão

```
É parte de um card que já existe? ── sim ──▶ Subtask (verbo no início, sem template)
        │ não
        ▼
É reativo ou entrega planejada?
   ├─ reativo ──▶ quebrou? ──────────▶ Bug
   │             dívida técnica? ────▶ Chore
   │             dúvida/investigar? ▶ Spike
   └─ planejada ▶ vira vários cards + PRD? ▶ Epic + filhos
                  2–3 dias, spec/estados? ─▶ Feature
                  1–2 dias, fluxo/UX? ─────▶ Story
```


## Hierarquia (3 níveis nativos do Jira)

```
Epic  (nível de cima — o objetivo)
  └─ Feature  OU  Story        (nível padrão — o "como")
        └─ Subtask             (nível de baixo — passo operacional)

Bug / Chore / Spike            (nível padrão, mas SOLTOS — sem Epic obrigatório)
  └─ Subtask
```

Feature, Story, Bug, Chore e Spike são **todos irmãos** no nível "standard" — um não
aninha no outro. A diferença é se penduram numa Epic (trabalho planejado) ou ficam
soltos (trabalho reativo/transversal). Subtask não tem template: é passo de checklist,
convenção de nome com verbo no início ("Criar migration X", "Testar fluxo Y").

## Feature vs Story (a regra)

Ambos são cards de execução com duração curta — a diferença é tamanho + foco:

- **Feature** — **2 a 3 dias**. Entrega de capacidade/comportamento; precisa de spec, estados e edge cases.
- **Story** — **1 a 2 dias**, com ênfase em **usabilidade e no fluxo em si**. "Como X, quero Y para Z".
- **Regra de corte:** nenhum card passa de **3 dias**. O que passar, quebra em mais de um.

## Fracionamento da Epic

Ao terminar de montar uma Epic, a skill `card-epic` **oferece fracionar** a Epic em cards
de Feature / Story / Spike / Chore já prontos pra criar. Ela primeiro propõe a **lista**
(tipo + título + 1 linha + tamanho), você confirma/ajusta, e então escreve cada card
completo no formato do tipo. Cada passo do fluxo principal e cada estado (erro/vazio/
carregando) vira candidato a card; trabalho habilitador (migração, CI, setup técnico) vira
Chore; decisão em aberto que trava o começo vira Spike. **Crie a Epic no Jira primeiro**
pra ter a key e preencher o Épico pai de cada filho.

## Campos do Jira × descrição

Metadado que você quer **filtrar, agrupar ou reportar** vai em **campo do Jira**, não no
texto da descrição — senão desincroniza e some dos dashboards. Os templates **não**
carregam esses metadados na descrição: ela é só a narrativa, e cada skill lista no fim os
campos a preencher no Jira:

- **Status** — workflow único do time: **Backlog → To Do → WIP → Code Review → Design Review → Completed**. Nunca no texto.
- **Estimativa** — **story points**. Régua inicial pra calibrar: **Story ≈ 2–3 pts**, **Feature ≈ 3–5 pts**, Chore pequeno ≈ 1–2 pts. Os dias (1–2 / 2–3) são só heurística de corte e **não** vão no card. Recalibrar com a velocity depois de alguns sprints. (Spike usa **Timebox** em dias, não pontos.)
- **Prioridade**, **Severidade** (Bug), **Ambiente** (Bug) — campos nativos/custom.
- **Plataforma afetada** — custom field sugerido (multi-select: Web / Mobile / Backend), útil pro time de Front + Mobile + Backend.
- **Reporter** e **Data (created)** — já são nativos; não repita no texto.

## Regras que as skills aplicam

- Não inventam dados: campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.
- Escopo negativo é obrigatório onde o template pede ("Fora do MVP", "Fora (explícito)").
- Redirecionam pro tipo certo quando o que a pessoa descreveu não bate com o card acionado.

## Versão

0.4.0 — 8 skills. Adiciona `card-request` (porta de entrada de pedidos externos). Limpa os
metadados (Status/Prioridade/Estimativa/Severidade…) da descrição — agora vão só nos campos
do Jira. Estimativa padronizada em **story points**; Status num workflow único (Backlog →
To Do → WIP → Code Review → Design Review → Completed). Fracionamento da Epic passa a incluir
**Chore**. Subtask segue sem template (convenção de nome).
