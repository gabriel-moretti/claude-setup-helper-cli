---
name: card-spike
description: Monta a descrição de um Spike (investigação/discovery) do Jira no formato fixo da equipe DeltaPag e devolve pronta pra colar. Use quando a pessoa quer abrir uma investigação técnica, um spike, um discovery, uma prova de conceito ou precisa decidir entre opções antes de construir — gatilhos como "abrir spike", "criar spike", "fazer um discovery", "investigar antes de codar", "POC", "decidir entre X e Y".
---

# Card Spike

Você ajuda alguém a abrir um **Spike** no Jira, no formato fixo da equipe. A saída é a descrição **pronta pra colar**. Spike é **investigação com prazo**, não desenvolvimento — produz uma **decisão ou entregável**, não código de produção. Vive solto ou ligado ao épico/story que ele destrava.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-spike NestJS ou FastAPI pro CRM`), trate esse texto como a **descrição inicial**: pré-preencha o que der e **pule as perguntas que ele já responde**. Pergunte só o que falta.

## Regra de ouro
Se virou "vou codando pra ver", **não é mais spike**. Reforce o timebox: quando o tempo acabar, decide com o que tem em mãos — não estende sozinho.

## Processo
1. **Leia o esqueleto** em `references/template.md` e siga a ordem das seções.
2. **Entreviste em blocos curtos**:
   - O que investigar (título) + **Timebox**, **Dono** e o que **Destrava**.
   - Seção 1: **uma pergunta específica**. Se a pessoa trouxer várias, provavelmente são vários spikes — aponte isso e sugira separar.
   - Seção 2: por que agora / o que está travado esperando a resposta.
   - Seção 3: opções/hipóteses a avaliar.
   - Seção 4: **critérios de decisão definidos ANTES de investigar** (evita viés) — insista nisso.
   - Seção 5: qual o entregável (recomendação escrita / ADR / POC descartável / doc comparativo).
   - Seção 6: quando parar (data/hora limite).
   - Seção 7 (resultado/decisão) fica pronta no card pra preencher no fim.
   - Para **Status** e **Timebox**, use AskUserQuestion.
3. **Não invente.** Campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.

## Campos do Jira (não vão na descrição — lembre a pessoa no fim)
Viram **campo do Jira**, não texto: **Status** (workflow do time: Backlog → To Do → WIP → Code Review → Design Review → Completed), **Prioridade**, **Timebox** (a duração-limite, em dias — não é story point), **Dono/Assignee** (nativo). Se o time chama "spike" de **discovery** no dia a dia, mantenha o nome que a equipe usa no título.

## Saída
Entregue a descrição final em markdown num bloco copiável — a descrição **não** inclui os metadados acima (eles vão só nos campos do Jira). Ao final, liste em uma linha os **campos do Jira a preencher** (Status, Timebox, Assignee/Dono, Prioridade).
