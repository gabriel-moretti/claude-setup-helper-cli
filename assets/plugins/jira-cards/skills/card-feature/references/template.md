# Template — Feature

```
Feature — <Nome da feature>

1. Contexto
<Em qual tela/fluxo do produto isso entra. Uma linha.>

2. Problema / por quê
<A dor concreta que essa feature resolve. 1–2 frases. Sem isso, não constrói.>

3. A feature
* O que faz: <1–2 frases, comportamento visível pro usuário>
* Como sabemos que funcionou: <1 sinal mensurável. Ex: "X% dos que abrem a tela usam", "tarefa Y cai de N pra M cliques">

4. Escopo
Dentro: <o que essa feature entrega>
Fora (explícito): <o que fica pra outra feature — evita o escopo vazar>

5. Comportamento & estados
* Caminho feliz: <usuário faz X → sistema responde Y>
* Vazio: <sem dados / primeiro uso>
* Erro: <falha / timeout / entrada inválida>
* Carregando: <feedback enquanto processa>
* Edge cases: <permissão, limite, duplicado, offline… o que for relevante>

6. Critérios de aceite
Formato "dado / quando / então". Se todos passam, a feature está pronta.
* Dado <situação>, quando <ação>, então <resultado esperado>
* Dado <...>, quando <...>, então <...>
* <critério de erro/estado>
* <critério de acessibilidade/responsivo, se aplicável>

7. Impacto técnico (só o que muda — apague o resto)
* UI: <telas/componentes novos ou alterados>
* Dados: <campo/tabela novo ou alterado>
* API/contrato: <endpoint novo ou mudança — request/response>
* Dependências: <precisa de outra feature/serviço antes? feature flag?>

8. Dúvidas em aberto
* <pergunta> — <recomendação / dono>
```
