---
name: card-bug
description: Monta a descrição de um Bug do Jira no formato fixo da equipe DeltaPag e devolve pronta pra colar. Use quando a pessoa quer reportar/abrir/registrar um bug, um defeito, um erro ou algo quebrado no Jira — gatilhos como "abrir bug", "reportar bug", "registrar um defeito", "tá quebrado", "erro no sistema", "card de bug".
---

# Card Bug

Você ajuda alguém a reportar um **Bug** no Jira, no formato fixo da equipe. A saída é a descrição **pronta pra colar**. Um Bug é trabalho **reativo** — pode viver solto (sem Epic) ou dentro da Epic a que pertence.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-bug login aceita e-mail sem @`), trate esse texto como a **descrição inicial**: pré-preencha o que der e **pule as perguntas que ele já responde**. Pergunte só o que falta.

## Objetivo do card
Fazer um dev acreditar no bug e localizá-lo rápido. Quanto mais concreto (passos determinísticos + evidências), mais rápido o fix. Se não dá pra reproduzir, foque em extrair evidências (logs, request-id, timestamp).

## Processo
1. **Leia o esqueleto** em `references/template.md` e siga a ordem das seções.
2. **Entreviste em blocos curtos**:
   - Sintoma curto (título) + resumo em uma frase.
   - **Esperado vs. Atual** — os dois lados, sempre.
   - **Passos pra reproduzir** — numerados, determinísticos. Um estranho tem que repetir só lendo. Pergunte a **frequência** (sempre / intermitente / condicional).
   - Ambiente/contexto: só o relevante. Para mobile, puxe **app version / build**; para web, navegador/OS.
   - Evidências: log/stack trace, request-id/correlation-id/timestamp, print/vídeo, payload que dispara.
   - Impacto: quem/quantos, e se tem workaround.
   - Seções 7–8 (investigação e definição de resolvido) já ficam prontas no card pra preencher durante a análise.
3. Para **Severidade** e **Ambiente**, use AskUserQuestion (opções abaixo). Não deduza severidade sozinho — pergunte.
4. **Não invente.** Campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.

## Escala de severidade (pergunte, não deduza)
- **S1** — derruba/bloqueia (sistema fora, ninguém trabalha)
- **S2** — quebra função sem workaround
- **S3** — incomoda mas tem contorno
- **S4** — cosmético

## Campos do Jira (não vão na descrição — lembre a pessoa no fim)
Viram **campo do Jira**, não texto: **Severidade** (custom field), **Status** (workflow do time: Backlog → To Do → WIP → Code Review → Design Review → Completed), **Prioridade**, **Ambiente** (prod/staging/dev), **Plataforma afetada** (Web/Mobile/Backend). **Reportado por** e **Data** já são nativos (reporter/created) — não repita no texto.

## Saída
Entregue a descrição final em markdown num bloco copiável — a descrição **não** inclui os metadados acima (eles vão só nos campos do Jira). Ao final, liste em uma linha os **campos do Jira a preencher** (Severidade, Ambiente, Plataforma, Prioridade).
