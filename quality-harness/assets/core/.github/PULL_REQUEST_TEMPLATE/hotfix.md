<!-- pr-template:hotfix -->
<!--
🚑️ HOTFIX — branch `hotfix/…`  (correção urgente direto para produção)
Título = commit do squash (gitmoji):  🚑️ [(escopo):] <Verbo…>    ex.: 🔒️ (auth): Aplica patch de segurança
⭐ = obrigatório · (opcional) = pode apagar
Mudança MÍNIMA. Refactors e melhorias vão em outro PR.
-->

## ⭐ 🚨 Incidente
- Link / ID do incidente:
- Severidade:
- Início:

## ⭐ 💥 Impacto
<!-- Quem foi afetado, quanto, desde quando. -->

## ⭐ 🔍 Causa raiz
<!-- Pode ser preliminar; o detalhe vai no postmortem. -->

## ⭐ 🩹 Correção mínima aplicada
<!-- O que mudou, em poucas linhas. -->

## ⭐ ⏪️ Plano de rollback
<!-- Como desfazer em minutos se piorar. -->

## ⭐ 🧪 Como foi validado
<!-- Ambiente (staging/homologação/canário) e evidência. -->

## ⭐ ✅ Checklist
- [ ] ⭐ 🩹 Diff contém só o necessário para estancar o problema
- [ ] ⭐ ⏪️ Rollback documentado e viável
- [ ] ⭐ 👥 Revisado por pelo menos uma pessoa do plantão/time responsável
- [ ] ⭐ 🔀 Back-merge para a branch de desenvolvimento planejado
- [ ] ⭐ 🔖 Versão PATCH em VERSION/manifestos + entrada no CHANGELOG
- [ ] ⭐ 📖 README atualizado e citando a nova versão
- [ ] ⭐ 🔐 Nenhum segredo, token ou dado pessoal no diff
- [ ] 🧪 Teste de regressão incluído (ou issue aberta para incluir depois)

## 💳 Escopo PCI DSS (opcional)
<!-- Preencha se o PR toca dados de cartão, autenticação, criptografia, logs ou o ambiente de dados do titular (CDE). Em repo com pci_dss=true o ruleset exige 2 aprovações. -->
- [ ] Não toca dados de cartão, autenticação, criptografia nem logs
- [ ] Toca — descrevo abaixo onde o dado trafega/é armazenado, o que é logado e como é mascarado

## 📈 Monitoramento pós-deploy (opcional)
<!-- Dashboards, alertas e métricas para acompanhar. -->

## 📝 Postmortem (opcional)
<!-- Link ou data prevista. -->

## 🔊 Logs e evidências (opcional)

## 🤖 Uso de IA (opcional)
<!-- Em hotfix, revise o que a IA produziu com atenção redobrada. Apague as linhas que não se aplicam. -->
| Tarefa | Ferramenta | Modelo | Como ajudou |
|---|---|---|---|
| 🔊 Triagem de logs / alertas | | | |
| 🧐 Hipótese de causa | | | |
| 🩹 Correção | | | |
| 📝 Rascunho de postmortem / comunicação | | | |

- [ ] 🤖 A correção sugerida por IA foi validada em ambiente antes do deploy
