---
name: card-story
description: Monta a descrição de uma Story do Jira no formato fixo da equipe DeltaPag e devolve pronta pra colar. Use quando a pessoa quer abrir uma story, uma task de sprint, um card de backlog que cabe num sprint — gatilhos como "criar story", "abrir story", "nova task de sprint", "card de backlog", "escrever uma story no jira".
---

# Card Story

Você ajuda alguém a escrever uma **Story** no Jira, no formato fixo da equipe. A saída é a descrição **pronta pra colar**. Story é um **card de sprint**, não um documento — trabalho planejado que **cabe num sprint**, embaixo de uma Epic.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-story botão salvar fixo no rodapé mobile`), trate esse texto como a **descrição inicial**: pré-preencha o que der e **pule as perguntas que ele já responde**. Pergunte só o que falta.

## Story ou Feature? (decida antes de começar)
- **Story** — **1 a 2 dias**, com ênfase em **usabilidade e no fluxo em si**. "Como X, quero Y para Z". Use este template.
- **Feature** — **2 a 3 dias**. Entrega de capacidade/comportamento com spec e estados. Redirecione pra skill `card-feature`.
- Nada passa de **3 dias** — se não couber em 1–2 dias, veja se é uma Feature (2–3) ou se são **várias stories** (sugira quebrar). Aponte isso.
- **A estimativa vai em story points, não em dias.** Os dias são só heurística de corte. Régua inicial pra calibrar: **Story ≈ 2–3 pts** (recalibrar com a velocity depois de alguns sprints).

## Processo
1. **Leia o esqueleto** em `references/template.md` e siga a ordem.
2. **Entreviste em blocos curtos**:
   - Título curto orientado a resultado.
   - **História** no formato "Como <persona>, quero <ação> para <benefício>". Se a pessoa não conseguir escrever assim, a story ainda não está clara — ajude a lapidar antes de seguir.
   - **Critérios de aceite** em dado/quando/então (é o que review e QA checam). Inclua estado de erro/vazio se aplicável.
   - **Fora de escopo** — pra ela não crescer no meio do caminho.
   - Dependências / notas: bloqueios, feature flag, story anterior, atenção técnica.
   - O Definition of Done (padrão do time) já entra como lembrete no card.
   - Para **Tipo** (Story/Task), **Prioridade** e **Estimativa**, use AskUserQuestion.
3. **Não invente.** Campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.

## Campos do Jira (não vão na descrição — lembre a pessoa no fim)
Viram **campo do Jira**, não texto: **Tipo**, **Estimativa** (story points), **Prioridade**, **Status** (workflow do time: Backlog → To Do → WIP → Code Review → Design Review → Completed), **Plataforma afetada** (Web/Mobile/Backend), e o **Épico pai** (link).

## Saída
Entregue a descrição final em markdown num bloco copiável — a descrição **não** inclui os metadados acima (eles vão só nos campos do Jira). Ao final, liste em uma linha os **campos do Jira a preencher** (Tipo, Estimativa, Prioridade, Plataforma, Épico pai).
