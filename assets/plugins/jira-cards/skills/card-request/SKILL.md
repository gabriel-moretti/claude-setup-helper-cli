---
name: card-request
description: Monta a descrição de um Request do Jira (porta de entrada de pedidos externos) no formato da equipe DeltaPag e ajuda a triar o que ele deve virar. Use quando chega um pedido de fora do time — stakeholder, outra área, cliente — e precisa ser registrado e classificado. Gatilhos como "registrar um pedido", "abrir request", "chegou uma solicitação", "pedido do cliente", "demanda do stakeholder", "o comercial pediu", "abrir uma request no jira".
---

# Card Request (porta de entrada)

Você ajuda a registrar um **Request** — um pedido vindo de **fora do time** (stakeholder, outra área, cliente) — e a decidir o que ele deve virar. A saída é a descrição **pronta pra colar** + uma **recomendação de triagem**. O Request é a *porta de entrada*, não execução: ele **não constrói nada**, ele **gera** outro card (ou é recusado).

## Regra central
Separe **o pedido** (o quê / por quê) da **solução** (como). Neste card, capture só o pedido cru e a dor — não escreva a solução. A solução vai no card de destino (Story/Feature/etc.), depois da triagem.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-request o comercial quer exportar relatório em PDF`), trate esse texto como a **descrição inicial** do pedido: pré-preencha o que der e pergunte só o que falta.

## Processo
1. **Leia o esqueleto** em `references/template.md` e siga a ordem das seções.
2. **Entreviste em blocos curtos**:
   - Uma frase do que está sendo pedido (título) + **quem** pediu.
   - Seção 1: o pedido **como veio** — nas palavras do solicitante, sem traduzir pra solução.
   - Seção 2: a **dor / resultado esperado** — o problema por trás do pedido. Se vier só a solução ("quero um botão X"), pergunte "pra resolver o quê?" e registre a dor.
   - Seção 3: urgência, prazo, dependências, canal de origem.
3. **Triagem** (seção 4): use a lógica da skill `card-triagem` pra recomendar o que o pedido deve virar — **Epic / Feature / Story / Bug / Chore / Spike**, ou **recusado**. Um pedido pode gerar **mais de um card** (ex.: vira uma Epic). Recusar também é resultado válido — registre o porquê. Se faltar informação pra decidir, deixe a triagem como **pendente** com a pergunta que falta; não force uma classificação.
4. **Não invente.** Campo sem resposta vira `<placeholder>` ou `⚠️ A DEFINIR`.

## Saída
1. Entregue a descrição do Request em markdown num bloco copiável — a descrição **não** inclui os campos do Jira (eles vão nos campos).
2. Diga a **recomendação de triagem** (o tipo que o pedido deve virar + 1 linha do porquê).
3. **Ofereça já montar o card de destino** acionando a skill correspondente (`card-epic`, `card-feature`, `card-story`, `card-spike`, `card-chore`). Se a pessoa confirmar, siga pra essa skill e, depois, registre o link do card gerado na seção 4 do Request.

## Campos do Jira (não vão na descrição)
Viram **campo do Jira**, não texto: **Status** (workflow do time: Backlog → To Do → WIP → Code Review → Design Review → Completed), **Prioridade**. O **link pro card gerado** vai na relação de issues (ou na seção 4). **Reporter** já é nativo.
