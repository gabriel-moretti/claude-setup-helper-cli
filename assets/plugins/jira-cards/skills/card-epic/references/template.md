# Template — Epic (PRD)

> Esqueleto fiel do formato da equipe. Preencha os `<placeholders>`, apague as dicas
> em itálico e remova seções marcadas "(se aplicável)" que não fizerem sentido.
> Meta: caber em ~2 páginas.

```
PRD — <Nome do Projeto>
<Uma frase que descreve o produto pra alguém que nunca ouviu falar dele.>
· Versão: <0.2 / MVP 1.0> · Idioma: <PT-BR>

1. O que é / Por que
* O que é: <1–2 frases>
* Problema / dor real: <qual dor concreta isso resolve, e de quem>
* Diferencial: <por que essa solução e não a alternativa óbvia>
Meta única do MVP — o critério que, sozinho, valida o produto:
<1 frase mensurável. Ex: "usuário X consegue fazer Y em menos de Z segundos, sem instrução">

2. Escopo
Dentro do MVP
* <funcionalidade essencial>
* <...>
Fora do MVP (explícito)
* <coisa que dá vontade de fazer mas fica pra depois>
* <...>

3. Fluxo principal
<Usuário chega>
   → <passo>
   → <passo>
   → <resultado / valor entregue>
Estados que não são o caminho feliz:
* Erro: <o que mostrar>
* Vazio / sem resultado: <o que mostrar + o que logar>
* Carregando: <skeleton / feedback>

4. Telas / Etapas
* <etapa/tela> – <componentes principais / regras principais>
Regra visual única (se houver): <a decisão de design inviolável>

5. Modelo de dados (se aplicável)
{
  "id": "<slug>",
  "<campo>": "<valor exemplo>",
  "<campo>": "<valor exemplo>"
}
Notas: <enums, relações, regras de negócio importantes>

6. Contrato de integração / API (se aplicável)
<MÉTODO> <rota>
body:     { <request> }
resposta: { <response> }
Regras não-negociáveis:
* <o que a API sempre / nunca faz>
* <segurança: rate limit, auth, dados sensíveis>

7. Requisitos técnicos (o time escolhe a stack)
Frontend — não negociável (framework, css, lib)
* <ex: páginas indexáveis / performance / offline / acessibilidade> - <framework, CSS, libs>
Backend — não negociável (linguagem, lib, framework)
* <ex: cumprir o contrato da seção 6 / latência / proteger dado X> - <linguagem, framework, onde hospedar>
Base de dados
* MVP: <o mais simples que resolve — arquivo, SQLite, JSON…>
* Evolução: <pra onde migra sem quebrar o contrato>
Fixos (não são decisão de stack)
* <serviços externos já definidos: analytics, form, auth provider…>
Regra de ouro: frontend e backend só se falam pelo contrato da seção 6.

8. Decisões em aberto (resolver antes de codar)
1. <pergunta> — recomendação: <...>

9. Checklist de build (ordem sugerida)
* [ ] <ponto / todo para atingir resultado>

10. Riscos que importam agora
<RISCO REAL>
<o que fazer antes de virar problema / como contornar>
<RISCO REAL>
<o que tomar cuidado>
```
