# Template — Bug

```
Bug — <sintoma curto, o que o usuário vê de errado>

1. Resumo
<Uma frase: o que está errado.>

2. Esperado vs. Atual
* Esperado: <o que deveria acontecer>
* Atual: <o que acontece de fato>

3. Passos pra reproduzir
Determinístico. Um estranho tem que conseguir repetir só lendo isto.
1. <passo>
2. <passo>
3. <passo> → erro acontece aqui
Frequência: <sempre / intermitente (ex: 3 de 10 vezes) / só sob condição X>

4. Ambiente / contexto
* Versão / build / commit: <...>
* Device / OS / navegador: <...>
* App version (mobile): <...>
* Usuário / conta / tenant: <...>
* Quando começou: <sempre existiu / depois do deploy X / desde tal data>

5. Evidências
* Log / stack trace: <colar ou linkar>
* Request-id / correlation-id / timestamp: <...>
* Print / vídeo: <link>
* Payload / entrada que dispara: <...>

6. Impacto
* Quem/quantos afetados: <1 usuário / todos / X% / cliente Y>
* Tem workaround? <sim: qual / não>

7. Investigação (preencher durante a análise)
* Causa provável: <hipótese>
* Onde está: <arquivo / função / serviço>
* Notas: <o que já foi testado / descartado>

8. Definição de resolvido
* [ ] Os passos da seção 3 não reproduzem mais o erro
* [ ] <comportamento esperado confirmado no ambiente afetado>
* [ ] Teste de regressão adicionado (pra não voltar)
```
