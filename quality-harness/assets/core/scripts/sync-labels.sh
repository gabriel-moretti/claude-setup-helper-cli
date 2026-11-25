#!/usr/bin/env bash
# 🏷️ Cria/atualiza as labels de .github/labels.yml no repositório atual.
# Requer: gh (autenticado) e python3.  Uso: ./scripts/sync-labels.sh [OWNER/REPO]
set -euo pipefail
REPO_FLAG=${1:+--repo "$1"}
python3 - <<'PY' | while IFS=$'\t' read -r name color desc; do
import re
for line in open(".github/labels.yml", encoding="utf-8"):
    m = re.search(r'name:\s*"([^"]+)",\s*color:\s*"([0-9a-fA-F]{6})",\s*description:\s*"([^"]*)"', line)
    if m: print("\t".join(m.groups()))
PY
  echo "🏷️  $name"
  gh label create "$name" --color "$color" --description "$desc" --force $REPO_FLAG >/dev/null
done
echo "✅ Labels sincronizadas"
