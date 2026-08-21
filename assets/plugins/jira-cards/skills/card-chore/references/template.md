# Template — Chore (Débito Técnico)

```
Débito Técnico — <Título curto do que refatorar/melhorar>
<Uma frase: o que está ruim hoje e o que fica melhor depois.>

1. Contexto — o que é e onde
* Onde está: <arquivo, módulo, serviço, tela ou endpoint>
* O que é: <1–2 frases descrevendo o ponto de dívida técnica>
* Descoberto em: <PR, code review, incidente, observação durante outra task…>

2. Situação atual (como está hoje)
<código atual, log, ou descrição do comportamento — por que isso é dívida>

3. Proposta de melhoria (como deveria ficar)
* <mudança proposta>
* <...>

4. Por que importa (relevância)
* Impacto se NÃO fizer: <difícil de manter / risco baixo / só incomoda / pode virar bug>
* Ganho se fizer: <menos bug, mais performance, mais legível, menos retrabalho>
* Urgência: <pode esperar / fazer quando encostar no código / precisa antes de X>

5. Escopo
Dentro
* <o que essa melhoria cobre>
Fora (explícito)
* <o que fica de fora dessa card — pra não virar refactor sem fim>

6. Critérios de aceite (Definition of Done)
* [ ] comportamento igual ao de antes — sem regressão
* [ ] a melhoria específica foi aplicada
* [ ] testes passando / cobertura mantida
* [ ] sem novos warnings / lint limpo

7. Riscos e cuidados (se aplicável)
Risco — Cuidado/mitigação
* <mexe em código sem teste — adicionar teste antes de refatorar>

8. Referências (se aplicável)
* PR/commit relacionado: <link>
* Card/incidente de origem: <link>
* Docs / discussão: <link>
```
