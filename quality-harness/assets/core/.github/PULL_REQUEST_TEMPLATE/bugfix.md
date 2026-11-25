<!-- pr-template:bugfix -->
<!--
🐛 BUGFIX — branch `bugfix/…` ou `fix/…`
Título = commit do squash (gitmoji):  🐛 [(escopo):] <Verbo…>     ex.: 🐛 (header): Corrige sobreposição no mobile
⭐ = obrigatório · (opcional) = pode apagar
-->

## ⭐ 📋 Resumo
<!-- Qual bug foi corrigido, em 1–2 frases. -->

## ⭐ 🔗 Issue relacionada
<!-- Fixes #123 -->

## ⭐ 🔍 Causa raiz
<!-- Por que o bug acontecia? Não basta "corrigido". -->

## ⭐ 🩹 Correção aplicada
<!-- O que mudou e por que resolve. -->

## ⭐ 🧪 Como validar
<!-- Passos que reproduziam o bug e agora mostram o comportamento correto. -->
1.
2.

## ⭐ ✅ Checklist
- [ ] ⭐ 🧪 Teste de regressão que falhava antes e passa agora
- [ ] ⭐ 🚨 Lint e formatação passando
- [ ] ⭐ 🔐 Nenhum segredo, token ou dado pessoal no diff
- [ ] ⭐ 💻 Identificadores em inglês (variáveis, funções, tabelas, colunas)
- [ ] 📝 CHANGELOG atualizado

## 💳 Escopo PCI DSS (opcional)
<!-- Preencha se o PR toca dados de cartão, autenticação, criptografia, logs ou o ambiente de dados do titular (CDE). Em repo com pci_dss=true o ruleset exige 2 aprovações. -->
- [ ] Não toca dados de cartão, autenticação, criptografia nem logs
- [ ] Toca — descrevo abaixo onde o dado trafega/é armazenado, o que é logado e como é mascarado

## ⚠️ Efeitos colaterais / áreas afetadas (opcional)

## 🔊 Logs e evidências (opcional)

## 📸 Antes × depois (opcional)

## 💡 Notas para quem revisa (opcional)

## 🤖 Uso de IA (opcional)
<!-- Preencha só se usou IA. Apague as linhas que não se aplicam. -->
| Tarefa | Ferramenta | Modelo | Como ajudou |
|---|---|---|---|
| 🧐 Diagnóstico / causa raiz | | | |
| 🔊 Análise de logs / stack trace | | | |
| 🩹 Correção | | | |
| 🧪 Teste de regressão | | | |

- [ ] 🤖 A causa raiz foi confirmada por uma pessoa, não só sugerida pela IA
