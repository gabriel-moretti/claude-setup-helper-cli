#!/usr/bin/env bash
# 🚀 Ponto único de deploy, chamado pelo workflow deploy.yml.
#   $1 = environment (production | test | sandbox)   $2 = ref (tag vX.Y.Z, vX.Y.Z-rc.N ou SHA)
# Substitua o bloco abaixo pelo deploy real (Docker/ECR/ECS, Vercel, Fastlane…).
set -euo pipefail
ENV=${1:?environment}; REF=${2:?ref}
echo "::warning::scripts/deploy.sh ainda não implementado — nada foi publicado em $ENV ($REF)"
