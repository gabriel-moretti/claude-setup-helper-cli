#!/usr/bin/env bash
# 🏷️ Define as custom properties de um repositório e aplica as configurações comuns.
# Uso: governance/enterprise/set-repo.sh ORG/REPO in_production=true [pci_dss=true] [stack=node,python]
#   A propriedade in_production seleciona o ruleset da main e é espelhada na variável IN_PRODUCTION do CI.
set -euo pipefail
REPO=${1:?"uso: set-repo.sh ORG/REPO chave=valor..."}; shift
DIR=$(cd "$(dirname "$0")" && pwd)
# criticality e hosting vêm do .github/standards.json quando não forem passados
if [ -f .github/standards.json ]; then
  for k in criticality hosting; do
    printf '%s\n' "$@" | grep -q "^$k=" || set -- "$@" "$k=$(node -p "require('./.github/standards.json').infra.$k")"
  done
fi
PROPS=$(node -e '
  const out = process.argv.slice(1).map((kv) => { const [k, v] = kv.split("=");
    return { property_name: k, value: k === "stack" ? v.split(",") : v }; });
  process.stdout.write(JSON.stringify({ properties: out }));' "$@")
gh api -X PATCH "repos/$REPO/properties/values" --input - --silent <<<"$PROPS" && echo "  ✅ properties: $*"
EM=$(gh api "repos/$REPO/properties/values" -q '.[] | select(.property_name=="in_production") | .value' 2>/dev/null || echo false)
IN_PRODUCTION=${EM:-false} "$DIR/../common/repo.sh" "$REPO"
