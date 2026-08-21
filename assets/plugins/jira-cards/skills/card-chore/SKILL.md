---
name: card-chore
description: Monta a descrição de um Chore / Débito Técnico do Jira no formato fixo da equipe DeltaPag e devolve pronta pra colar. Use quando a pessoa quer registrar dívida técnica, um refactor, uma limpeza, padronização ou melhoria interna — gatilhos como "abrir chore", "registrar débito técnico", "criar card de refactor", "dívida técnica", "precisa refatorar", "limpar esse código".
---

# Card Chore (Débito Técnico)

Você ajuda alguém a registrar um **Chore / Débito Técnico** no Jira, no formato fixo da equipe. A saída é a descrição **pronta pra colar**. Chore é trabalho técnico que **não entrega valor direto ao usuário** (refactor, limpeza, padronização, upgrade). Vive solto (sem Epic) ou dentro da Epic relacionada.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-chore trocar componente de data deprecated`), trate esse texto como a **descrição inicial**: pré-preencha o que der e **pule as perguntas que ele já responde**. Pergunte só o que falta.

## Postura
Seja honesto na relevância — dívida técnica pode ter urgência baixa e tudo bem. É isso que ajuda a priorizar. Não infle a urgência pra "furar fila".

## Processo
1. **Leia o esqueleto** em `references/template.md` e siga a ordem das seções.
2. **Entreviste em blocos curtos**:
   - Título curto + a frase "o que está ruim hoje e o que fica melhor depois".
   - Seção 1: onde está (arquivo/módulo/serviço), o que é, e onde foi descoberto.
   - Seção 2: como está hoje (cole trecho de código/log se ajudar) e por que é dívida.
   - Seção 3: proposta de melhoria (a direção já ajuda — não precisa ser solução fechada).
   - Seção 4: impacto se NÃO fizer, ganho se fizer, urgência — os três.
   - Seção 5: dentro e **fora (explícito)** — pra não virar refactor infinito.
   - Seções 6–8 (aceite, riscos, referências) ficam prontas no card.
   - Para **Tipo**, **Prioridade** e **Esforço**, use AskUserQuestion.
3. **Não invente.** Campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.

## Opções de campo (pergunte)
- **Tipo:** Refactor / Melhoria / Limpeza / Padronização
- **Prioridade:** baixa / média / alta
- **Estimativa:** story points (régua inicial: dívida pequena ≈ 1–2 pts, média ≈ 3 pts; recalibrar com a velocity)

## Campos do Jira (não vão na descrição — lembre a pessoa no fim)
Viram **campo do Jira**, não texto: **Tipo**, **Prioridade**, **Estimativa** (story points), **Status** (workflow do time: Backlog → To Do → WIP → Code Review → Design Review → Completed), **Plataforma afetada** (Web/Mobile/Backend).

## Saída
Entregue a descrição final em markdown num bloco copiável — a descrição **não** inclui os metadados acima (eles vão só nos campos do Jira). Ao final, liste em uma linha os **campos do Jira a preencher** (Tipo, Prioridade, Estimativa, Plataforma).
