<!-- pr-template:release -->
<!--
🔖 RELEASE — branch `release/vX.Y.Z`
Título = commit do squash (gitmoji):  🔖 Release vX.Y.Z
⭐ = obrigatório · (opcional) = pode apagar
-->

## ⭐ 🔖 Versão
- Versão:
- Data prevista do deploy:

## ⭐ 🏷️ Tipo de versão
- [ ] 💥 Major — tem breaking change
- [ ] ✨ Minor — funcionalidades novas compatíveis
- [ ] 🐛 Patch — só correções
- [ ] 🧪 Pré-release (alpha, beta, rc)

## ⭐ 📝 O que entra
<!-- PRs e issues incluídos. Pode colar o CHANGELOG da versão. -->
-

## ⭐ ✅ Checklist de release
- [ ] ⭐ 🔖 Versão atualizada nos manifestos (package.json, pyproject, pubspec…)
- [ ] ⭐ 📝 CHANGELOG no formato Common Changelog (rascunho: `git cliff --unreleased --tag vX.Y.Z --prepend CHANGELOG.md`, depois revise)
- [ ] ⭐ 📖 README de cada idioma do projeto atualizado e citando a nova versão
- [ ] ⭐ 💚 CI verde na branch de release
- [ ] ⭐ 🧪 Validado em staging / homologação
- [ ] ⭐ 📣 Release notes revisadas
- [ ] 🗃️ Migrações de banco revisadas e reversíveis

## 💥 Breaking changes e guia de migração (opcional)

## 🗃️ Migrações de banco (opcional)

## 🚩 Feature flags a ativar (opcional)

## ⏪️ Plano de rollback (opcional)

## 📣 Comunicação (opcional)
<!-- Quem precisa ser avisado: suporte, comercial, clientes, parceiros. -->

## 🤖 Uso de IA (opcional)
<!-- Preencha só se usou IA. Apague as linhas que não se aplicam. -->
| Tarefa | Ferramenta | Modelo | Como ajudou |
|---|---|---|---|
| 📝 Geração do CHANGELOG | | | |
| 📣 Release notes / comunicação | | | |
| 🧐 Revisão do diff entre versões | | | |
| 💥 Checagem de breaking changes | | | |

- [ ] 🤖 Release notes geradas por IA conferidas contra os PRs reais
