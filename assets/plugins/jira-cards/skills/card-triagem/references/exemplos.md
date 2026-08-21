# Exemplos de triagem (demanda → tipo)

Use como referência de desempate. A demanda em linguagem crua, e o card certo.

| Demanda (como chega) | Tipo | Por quê |
|---|---|---|
| "Precisamos lançar o novo módulo de conciliação, com telas, API e relatório" | **Epic + filhos** | Iniciativa que vira vários cards e precisa de PRD/contrato. |
| "A tela de login aceita e-mail sem @ e deixa passar" | **Bug** | Comportamento errado que o usuário vê agora. |
| "O checkout tá travando quando o cartão é recusado" | **Bug** | Algo quebrado em produção. |
| "Trocar o componente de data deprecated em toda a app" | **Chore** | Trabalho técnico, sem valor visível ao usuário. |
| "Padronizar os nomes das variáveis de ambiente" | **Chore** | Limpeza/padronização interna. |
| "NestJS ou FastAPI pro backend do CRM?" | **Spike** | Decisão técnica a resolver antes de construir. |
| "Dá pra usar WebSocket aqui ou vai estourar custo?" | **Spike** | Incerteza com timebox, produz decisão. |
| "Adicionar filtro por período no dashboard, com estados de vazio e loading" | **Feature** | Capacidade nova com spec e estados, ~2–3 dias. |
| "Exportar o relatório em CSV" | **Feature** | Capacidade com edge cases (colunas, encoding), ~2–3 dias. |
| "Deixar o botão de salvar fixo no rodapé no mobile" | **Story** | Ajuste de usabilidade/fluxo, 1–2 dias, "Como usuário, quero…". |
| "Mostrar mensagem amigável quando a busca não retorna nada" | **Story** | Fatia de fluxo/usabilidade, curta. |
| "Criar a migration da tabela de conciliação (da story X)" | **Subtask** | Passo operacional de um card já aberto. |
| "Escrever os testes e2e do fluxo de pagamento (da feature Y)" | **Subtask** | Desdobramento de um card pai. |

## Casos-limite
- **Demanda grande sem card pai e sem PRD** (ex.: "refazer toda a busca") → provavelmente é **Epic** (fraciona depois) ou **várias Features/Stories**. Não force numa Story só.
- **"Melhorar performance da listagem"** → se é ajuste pontual medido, **Chore**; se ninguém sabe onde está o gargalo, primeiro um **Spike**.
- **"Bug" que na verdade é comportamento nunca implementado** → não é Bug (nada quebrou); é **Feature/Story** nova.
- **Pedido vindo de fora (stakeholder/cliente)** → use a skill `card-request` como porta de entrada: ela registra o pedido cru, separa a dor da solução e tria o que o pedido deve virar.
