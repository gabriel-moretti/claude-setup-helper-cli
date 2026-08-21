---
name: card-feature
description: Monta a descrição de uma Feature do Jira no formato fixo da equipe DeltaPag e devolve pronta pra colar. Use quando a pessoa quer especificar/abrir uma feature, uma capacidade nova do produto, uma funcionalidade que precisa de spec — gatilhos como "criar feature", "abrir feature", "spec de feature", "nova funcionalidade", "card de feature no jira".
---

# Card Feature

Você ajuda alguém a especificar uma **Feature** no Jira, no formato fixo da equipe. A saída é a descrição **pronta pra colar**. Feature é uma capacidade nova do produto — maior que uma Story, precisa de spec, tem estados e edge cases. Fica **embaixo de uma Epic**.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-feature filtro por período no dashboard`), trate esse texto como a **descrição inicial**: pré-preencha o que der e **pule as perguntas que ele já responde**. Pergunte só o que falta.

## Feature ou Story? (decida antes de começar)
- **Feature** — **2 a 3 dias**. Entrega de capacidade/comportamento; precisa de spec, tem estados e edge cases. Use este template.
- **Story** — **1 a 2 dias**, com ênfase em **usabilidade e no fluxo em si**. "Como X, quero Y para Z". Redirecione pra skill `card-story`.
- Nada passa de **3 dias** — se o que a pessoa descreveu é maior que isso, sugira quebrar em mais de um card.
- **A estimativa vai em story points, não em dias.** Os dias são só heurística de corte. Régua inicial pra calibrar: **Feature ≈ 3–5 pts** (recalibrar com a velocity depois de alguns sprints).
Se a pessoa acionou Feature mas o que descreveu é claramente uma Story (ou vice-versa), avise e ofereça a skill certa.

## Processo
1. **Leia o esqueleto** em `references/template.md` e siga a ordem das seções.
2. **Entreviste em blocos curtos**:
   - Nome da feature + em qual Epic/produto ela vive.
   - Seção 1–2: contexto (tela/fluxo) e o **problema/por quê** (sem isso, não constrói — insista).
   - Seção 3: o que faz + **como sabemos que funcionou** (1 sinal mensurável — insista se vier vago).
   - Seção 4: dentro e **fora (explícito)**.
   - Seção 5: caminho feliz + vazio + erro + carregando + edge cases. **É aqui que mora a maior parte dos bugs — não pule os estados.**
   - Seção 6: critérios de aceite no formato **dado / quando / então** (testáveis).
   - Seção 7: só o impacto técnico que muda (UI/Dados/API/Dependências) — apague o resto.
   - Seção 8: dúvidas em aberto, cada uma com recomendação/dono.
   - Para **Status**, use AskUserQuestion.
3. **Não invente.** Campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.

## Campos do Jira (não vão na descrição — lembre a pessoa no fim)
Viram **campo do Jira**, não texto: **Status** (workflow do time: Backlog → To Do → WIP → Code Review → Design Review → Completed), **Prioridade**, **Estimativa** (story points), **Plataforma afetada** (Web/Mobile/Backend), e o **Épico pai** (link). A Feature sempre se pendura numa Epic.

## Saída
Entregue a descrição final em markdown num bloco copiável — a descrição **não** inclui os metadados acima (eles vão só nos campos do Jira). Ao final, liste em uma linha os **campos do Jira a preencher** (Status, Prioridade, Estimativa, Plataforma, Épico pai).
