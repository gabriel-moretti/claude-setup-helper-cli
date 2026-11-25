# 🗂️ Templates de issue e PR

Parte do kit de padrões do repositório. Versão melhorada do [`emoji-guide`](https://github.com/stevemao/github-issue-templates/tree/master/emoji-guide), com a cara do [gitmoji](https://gitmoji.dev): cada tipo de issue tem seu emoji, título, labels e campos **obrigatórios** e **opcionais** validados pelo próprio GitHub.

## 🆚 O que mudou em relação ao original

| Original | emoji-guide+ |
|---|---|
| Markdown livre — nada impede issue em branco | 📋 **Issue Forms (YAML)**: campos obrigatórios bloqueiam o envio |
| Específico do Babel | 🧩 Genérico, agnóstico de stack |
| 5 templates (2 são só links) | 🗂️ 7 formulários + 4 links de contato no seletor |
| Labels precisam existir na mão | 🏷️ `labels.yml` + script de sincronização |
| Sem template de PR | 🔀 6 templates de PR por tipo de branch, aplicados e validados automaticamente |
| Segurança via issue pública | 🔒️ Encaminha para Security Advisory privado |

## 🗂️ Templates

| | Template | Título gerado | Obrigatórios | Opcionais |
|---|---|---|---|---|
| 🐛 | Bug | `🐛 bug: …` | pré-checagem, atual, esperado, passos, severidade, frequência, versão, ambiente | reprodução mínima, código, logs, solução, prints, contribuir |
| 💥 | Regressão | `💥 regressão: …` | pré-checagem, versão ok, versão quebrada, descrição, passos, ambiente | commit suspeito, config, logs, contorno |
| ✨ | Nova funcionalidade | `✨ feat: …` | pré-checagem, problema, solução, tipo, impacto | alternativas, critérios de aceite, doc/migração, breaking, mockups, contribuir |
| ⚡️ | Performance | `⚡️ perf: …` | o que está lento, medição, benchmark, ambiente | meta esperada, profiling |
| 📝 | Documentação | `📝 docs: …` | tipo, local, problema | sugestão, contribuir |
| ♻️ | Refactor / débito técnico | `♻️ refactor: …` | motivação, área, situação atual, proposta | plano, riscos, garantias |
| 💄 | Interface / UX | `💄 ui: …` | tela, problema, prints | dispositivos, navegador, acessibilidade ♿️, proposta |

**Links no seletor** (`config.yml`, issues em branco desativadas): 💬 Dúvidas → Discussions · 🔒️ Vulnerabilidade → advisory privado · 📚 Docs · 💸 Apoie o projeto.

### Como obrigatório × opcional aparece

- Obrigatório → `validations.required: true` — o GitHub mostra <kbd>*</kbd> vermelho e não deixa enviar.
- Opcional → rótulo termina com **(opcional)**, para ficar claro também em clientes que não mostram o asterisco.
- Cada formulário abre com uma legenda explicando a convenção.

## 🔀 Templates de Pull Request

Um template por momento do fluxo, escolhido **automaticamente pelo prefixo da branch**:

| | Branch | Template | Label | Obrigatórios ⭐ | Opcionais |
|---|---|---|---|---|---|
| ✨ | `feature/` · `feat/` | `feature.md` | ✨ feature | resumo, issue, o que foi implementado, como testar, checklist | prints, feature flag, breaking, observabilidade, notas, 🤖 IA |
| 🐛 | `bugfix/` · `fix/` | `bugfix.md` | 🐛 bug | resumo, issue, causa raiz, correção, como validar, checklist (com teste de regressão) | efeitos colaterais, logs, antes × depois, notas, 🤖 IA |
| 🚑️ | `hotfix/` | `hotfix.md` | 🚑️ hotfix | incidente, impacto, causa raiz, correção mínima, rollback, validação, checklist | monitoramento, postmortem, logs, 🤖 IA |
| 🔖 | `release/vX.Y.Z` | `release.md` | 🔖 release | versão, tipo semver, o que entra, checklist de release | breaking, migrações, flags, rollback, comunicação, 🤖 IA |
| 🔧 | `chore/` | `chore.md` | 🔧 chore | resumo, tipo, impacto em runtime, checklist | dependências alteradas, issue, notas, 🤖 IA |
| 🔀 | qualquer outra | `other.md` | 🔀 outros | resumo, natureza, motivação, como validar, checklist | issue, prints, notas, 🤖 IA |

### ⚙️ Como funciona

O GitHub não tem formulário para PR, então a obrigatoriedade é garantida pelo workflow `.github/workflows/pr-template.yml`:

1. **Abriu o PR** com a descrição vazia ou com o seletor padrão → o template do tipo da branch é aplicado na descrição.
2. **Label do tipo** é adicionada (✨, 🐛, 🚑️, 🔖, 🔧, 🔀).
3. **Validação** — toda seção `## ⭐` precisa ter conteúdo; seções de checkbox precisam de ao menos uma opção marcada; itens `- [ ] ⭐` precisam estar todos marcados; campos `- Campo:` não podem ficar vazios; seções ⭐ não podem ser apagadas.
4. Se faltar algo, o check **⭐ Template preenchido** falha e um comentário fixo lista as pendências. Ao editar a descrição o check roda de novo e o comentário some quando estiver tudo certo.
5. PRs em **draft** recebem o template mas só são validados ao ficarem prontos para revisão.

> 💡 Torne o check **⭐ Template preenchido** obrigatório em *Settings → Branches → Branch protection* para bloquear o merge.

Quem prefere escolher na mão pode usar o seletor do `pull_request_template.md` (aba **Preview** ao abrir o PR) ou a URL `…/compare/main...minha-branch?template=hotfix.md`.

### 🤖 Seção de IA

Todo template termina com **🤖 Uso de IA (opcional)**: uma tabela *Tarefa · Ferramenta · Modelo · Como ajudou*, com as tarefas típicas daquele tipo de PR, mais um checkbox de responsabilidade:

| Tipo | Tarefas pré-listadas |
|---|---|
| ✨ feature | implementação, testes, UI/design, documentação, revisão do próprio código |
| 🐛 bugfix | diagnóstico/causa raiz, análise de logs, correção, teste de regressão |
| 🚑️ hotfix | triagem de logs/alertas, hipótese de causa, correção, rascunho de postmortem |
| 🔖 release | CHANGELOG, release notes, revisão de diff, checagem de breaking changes |
| 🔧 chore | upgrade de dependências, CI/build, documentação, lint em massa |
| 🔀 outros | código, pesquisa/POC, testes, documentação |

Se alguma linha tiver ferramenta ou modelo preenchido, o PR ganha a label **🤖 ia-assistida** (e perde, se for apagada) — dá para filtrar e medir onde a IA está sendo usada.

## 🚀 Instalação

Veja [SETUP.md](SETUP.md) — os templates fazem parte do kit completo.

## 🔧 Personalizando

- **Linguagem do código** no bug report: troque `render: js` por `python`, `dart`, `ts`…
- **Ordem no seletor**: segue o nome do arquivo — por isso os prefixos `01-`, `02-`…
- **Remover um tipo**: apague o `.yml`; o seletor se ajusta sozinho.
- **Novo tipo de branch**: crie `.github/PULL_REQUEST_TEMPLATE/<tipo>.md` com o marcador `<!-- pr-template:<tipo> -->` e adicione o prefixo em `TYPES` no `.github/scripts/pr-template.cjs`.
- **Novo tipo de issue**: escolha o emoji em [gitmoji.dev](https://gitmoji.dev), copie um formulário próximo e adicione a label em `labels.yml`.

## 🏷️ Labels

Definidas em [`.github/labels.yml`](.github/labels.yml): 🐛 bug · 💥 regressão · ✨ feature · ⚡️ performance · 📝 docs · ♻️ refactor · 💄 ui/ux · 🧐 triagem · 🔒️ segurança · 🚧 em andamento · 🙋 ajuda bem-vinda · 🌱 good first issue · 🗑️ wontfix · 👥 duplicada
