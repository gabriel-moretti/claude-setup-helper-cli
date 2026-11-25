# NOME DO PROJETO

[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)](https://semver.org)
[![gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg)](https://gitmoji.dev)
[![Conventional Branch](https://img.shields.io/badge/Conventional%20Branch-1.1.0-6699CC)](https://conventionalbranch.org)
[![Common Changelog](https://common-changelog.org/badge.svg)](https://common-changelog.org)
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

> Uma frase dizendo o que o projeto faz e para quem.

**Versão atual:** 0.1.0 · [CHANGELOG](CHANGELOG.md) · [Releases](https://github.com/OWNER/REPO/releases)

<!-- 📖 Este README é atualizado em TODA release: o check `release-check` exige que ele mude no PR e cite a nova versão.
     Projeto multilíngue (docs.languages com mais de um idioma)? Cada idioma extra tem README.<idioma>.md com as mesmas regras.
     Ex.: 🇺🇸 [English](README.md) · 🇧🇷 [Português](README.pt-BR.md) -->

## 🏗️ Stack e infraestrutura

| | |
|---|---|
| Hospedagem | AWS · criticidade medium (ver `.github/standards.json`) |
| Infra como código | Terraform em `infra/` |
| Banco | DEFINA o banco · ORM: DEFINA |

## 🌍 Ambientes

| Ambiente | Branch / tag | Para quê |
|---|---|---|
| 🚀 production | tags `vX.Y.Z` em `main` | Produção |
| 🧪 test *(opcional)* | `test` e tags `vX.Y.Z-rc.N` | Sandbox que consome o ambiente de produção |
| 🏖️ sandbox *(opcional)* | `sandbox` | Sandbox isolado |

## 🚀 Começando

```bash
# pré-requisitos: Node.js ≥ 20, lefthook (+ pnpm / uv / flutter conforme a stack)
git clone https://github.com/OWNER/REPO && cd REPO
lefthook install
# instale as dependências e rode o projeto
```

## 🧪 Qualidade

| Comando | O que faz |
|---|---|
| `…format:check` | 🎨 Formatação |
| `…lint` | 🚨 Lint |
| `…test:coverage` | 🧪 Testes com cobertura (lcov) — mínimo 75%, 85% para produção |

## 🤝 Contribuindo

Branches, commits, PRs, versões e releases seguem os padrões descritos em [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licença

DEFINA A LICENÇA.
