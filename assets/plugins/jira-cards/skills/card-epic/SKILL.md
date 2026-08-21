---
name: card-epic
description: Monta a descrição de uma Epic (PRD) do Jira no formato fixo da equipe DeltaPag e devolve pronta pra colar. Use quando a pessoa quer abrir/criar/escrever uma Epic, um PRD, um projeto novo ou o "documento do produto" no Jira — gatilhos como "criar epic", "abrir epic", "novo PRD", "documento do projeto", "epic no jira", "escrever a epic de X".
---

# Card Epic (PRD)

Você ajuda alguém a escrever a descrição de uma **Epic** no Jira, no formato fixo da equipe. Uma Epic aqui é o **PRD** — o nível de cima, que define *o que construir* e os contratos, não a stack. A saída é a descrição **pronta pra colar** no campo de descrição do card.

## Entrada inicial
Se a skill foi chamada com um texto junto (ex.: `/card-epic conciliação bancária` ou uma frase de contexto), trate esse texto como a **descrição inicial**: pré-preencha o que der e **pule as perguntas que ele já responde**. Pergunte só o que falta.

## Quando é Epic (e quando não é)
- **É Epic** quando é um objetivo/produto/iniciativa maior, que vai se desdobrar em várias Features/Stories. Trabalho planejado de médio/longo prazo.
- **Não é Epic** se cabe num sprint (é Story), se é uma capacidade isolada com spec (é Feature), se é conserto (Bug), dívida técnica (Chore) ou investigação (Spike). Nesses casos, avise a pessoa e sugira a skill correta.

## Processo
1. **Leia o esqueleto** em `references/template.md` — é a fonte da verdade do formato. Siga a ordem e os títulos das seções exatamente.
2. **Entreviste em blocos curtos**, não peça tudo de uma vez. Priorize nesta ordem, porque uma seção destrava a próxima:
   - Nome do projeto + a frase de uma linha ("o que é pra quem nunca ouviu falar").
   - Seção 1: o que é, dor real, diferencial e a **Meta única do MVP** (tem que ser mensurável — insista se vier vaga).
   - Seção 2: dentro do MVP e, com igual atenção, **fora do MVP** (não deixe pular — é o que segura o escopo).
   - Seção 3: o caminho feliz (um só) + estados de erro/vazio/carregando.
   - Seções 4–7 conforme o projeto: telas, modelo de dados, contrato de API, requisitos técnicos.
   - Seções 8–10: decisões em aberto, checklist de build, riscos.
   - Para escolhas fechadas (Status, Versão), use AskUserQuestion.
3. **Não invente.** Se a pessoa não souber um campo, mantenha o `<placeholder>` ou marque `⚠️ A DEFINIR` — nunca preencha com suposição. Seções "(se aplicável)" que não fizerem sentido, remova.
4. **Mire ~2 páginas.** Se estiver inflando, corte antes de entregar.

## Regras da equipe
- Frontend e backend só se falam pelo **contrato da seção 6**. Trocar um lado não pode obrigar a mexer no outro. Reforce isso na seção 7.
- Sempre preencha o "Fora do MVP" — escopo negativo é obrigatório.

## Campos do Jira (não vão na descrição — lembre a pessoa no fim)
Estes viram **campo do Jira**, não texto: **Status** (workflow, nunca no texto), **Prioridade**, **Plataforma afetada** (Web/Mobile/Backend, se já der pra saber). A Epic é o **pai** das Features/Stories — depois de criada, é sob ela que os outros cards se penduram.

## Saída
Entregue a descrição final em markdown, num bloco que a pessoa copia inteiro. Ao final, liste em uma linha os **campos do Jira a preencher** separados da descrição.

## Fracionamento (SEMPRE ofereça ao finalizar)
Depois de entregar a descrição da Epic, **pergunte se a pessoa quer já fracionar a Epic** em cards de Feature / Story / Spike prontos pra criar. Se sim:

1. **Proponha primeiro a lista** — não escreva os cards completos ainda. Para cada card: **tipo** (Feature / Story / Spike / Chore) + **título** + **1 linha** do que entrega + **tamanho** (o dia serve de guia de corte; a estimativa do card vai em **story points**).
2. **O tamanho é o guia do corte** (nenhum card de entrega passa de 3 dias — o que passar, quebre):
   - **Feature** — **2 a 3 dias** (≈ 3–5 pts). Capacidade/comportamento com spec, estados e edge cases.
   - **Story** — **1 a 2 dias** (≈ 2–3 pts). Ênfase em **usabilidade e no fluxo em si** — "Como X, quero Y para Z".
   - **Chore** — trabalho técnico do épico sem valor visível ao usuário (setup, migração, CI, padronização). Estime em pontos como os demais.
   - **Spike** — investigação com timebox, quando há incerteza a resolver antes de construir.
3. **Derive os cards do conteúdo da Epic**: cada passo do fluxo principal (seção 3) e cada estado (erro/vazio/carregando) costuma virar ao menos um card; trabalho habilitador (migração, CI, setup técnico) vira **Chore**; o "Fora do MVP" **não** vira card; decisão em aberto (seção 8) que trava o começo vira **Spike**.
4. **Confirme a lista** com a pessoa (ajuste/quebre o que ela pedir). Só depois, para cada card aprovado, **escreva o card completo** no formato do tipo — acione a skill correspondente (`card-feature`, `card-story`, `card-spike` ou `card-chore`) ou siga o esqueleto dela. **Crie a Epic no Jira primeiro** pra ter a key e usar no campo **Épico pai** de cada filho.
5. Entregue os cards fracionados um a um, cada um num bloco copiável, com os campos do Jira listados ao final de cada um.
