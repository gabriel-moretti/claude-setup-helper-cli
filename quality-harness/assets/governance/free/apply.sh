#!/usr/bin/env bash
# 🆓 Caminho GitHub Free.  Uso: governance/free/apply.sh OWNER/REPO
#   • Repo PÚBLICO  → rulesets de branch e tag bloqueiam de verdade.
#   • Repo PRIVADO  → rulesets não existem no Free: os checks rodam e sinalizam, hooks locais previnem,
#                     e a auditoria pós-merge (🧭 conventions no push) avisa o que escapou.
set -euo pipefail
REPO=${1:?uso: apply.sh OWNER/REPO}
DIR=$(cd "$(dirname "$0")" && pwd)
"$DIR/../common/repo.sh" "$REPO"

echo "🛡️  Rulesets (repositório)"
VIS=$(gh api "repos/$REPO" -q .visibility)
upsert() { # arquivo
  local name; name=$(node -p "require('$1').name")
  local id; id=$(gh api "repos/$REPO/rulesets" -q ".[] | select(.name==\"$name\") | .id" 2>/dev/null || true)
  if [ -n "$id" ]; then gh api -X PUT "repos/$REPO/rulesets/$id" --input "$1" --silent; else gh api -X POST "repos/$REPO/rulesets" --input "$1" --silent; fi
}
FAILED=0
for f in "$DIR"/rulesets/*.json; do
  name=$(node -p "require('$f').name")
  if upsert "$f" 2>/tmp/ruleset.err; then echo "  ✅ $name"; else FAILED=1; echo "  ❌ $name — $(head -c 160 /tmp/ruleset.err)"; fi
done

if [ "$FAILED" = 1 ] && [ "$VIS" = "private" ]; then cat <<'MSG'

  ⚠️  Repositório privado no plano Free: rulesets/branch protection não estão disponíveis.
    O que continua valendo:
      1. Checks ci-ok · conventions · release-check · pr-template rodam em todo PR (sinalizam, não bloqueiam)
      2. Hooks locais (lefthook) barram commit/branch fora do padrão antes do push
      3. 🧭 conventions audita todo push em main/test/sandbox e fica vermelho se algo escapou
      4. Tags v* são criadas só pelo workflow — combine com o time não criar tags na mão
    Para bloquear de verdade: deixe o repo público, ou use GitHub Team/Pro (rulesets) ou Enterprise.
MSG
fi
echo "🏁 Pronto. Defina IN_PRODUCTION=true quando o projeto entrar em produção."
