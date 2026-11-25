#!/usr/bin/env bash
# 🏢 Caminho GitHub Enterprise — governança na ORGANIZAÇÃO inteira.
# Uso: governance/enterprise/apply-org.sh ORG [--enforce] [--required-workflows OWNER/REPO]
#   • Sem --enforce, as regras de padrão (branch, commit, formato de tag) entram em modo "evaluate":
#     o GitHub registra quem violaria sem bloquear (Insights → Rule insights). Rode de novo com --enforce.
#   • --required-workflows: repositório central com .github/workflows/{ci,conventions}.yml para exigir em todos.
set -euo pipefail
ORG=${1:?uso: apply-org.sh ORG [--enforce] [--required-workflows OWNER/REPO]}; shift
ENFORCEMENT=evaluate; WF_REPO=""
while [ $# -gt 0 ]; do case "$1" in --enforce) ENFORCEMENT=active ;; --required-workflows) WF_REPO=$2; shift ;; esac; shift; done
DIR=$(cd "$(dirname "$0")" && pwd)

echo "🏷️  Custom properties — $ORG"
gh api -X PATCH "orgs/$ORG/properties/schema" --input "$DIR/properties.json" --silent && echo "  ✅ in_production · pci_dss · stack · criticality · hosting"

echo "🛡️  Rulesets da organização (padrões em modo: $ENFORCEMENT)"
render() { # arquivo → JSON final com regex e enforcement preenchidos
  node -e '
    const fs = require("fs"); const p = require(process.argv[2]);
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const fill = (o) => { for (const k in o) {
      if (typeof o[k] === "object" && o[k]) fill(o[k]);
      else if (o[k] === "__BRANCH_REGEX__") o[k] = p.BRANCH;
      else if (o[k] === "__COMMIT_REGEX__") o[k] = p.COMMIT;
      else if (o[k] === "__AI_REGEX__") o[k] = p.AI;
      else if (o[k] === "__ENFORCEMENT__") o[k] = process.argv[3]; } };
    fill(j); process.stdout.write(JSON.stringify(j));
  ' "$1" "$DIR/patterns.js" "$ENFORCEMENT"
}
upsert() { # json
  local name; name=$(node -p 'JSON.parse(process.argv[1]).name' "$1")
  local id; id=$(gh api "orgs/$ORG/rulesets" --paginate -q ".[] | select(.name==\"$name\") | .id" || true)
  if [ -n "$id" ]; then gh api -X PUT "orgs/$ORG/rulesets/$id" --input - --silent <<<"$1"
  else gh api -X POST "orgs/$ORG/rulesets" --input - --silent <<<"$1"; fi
  echo "  ✅ $name"
}
for f in "$DIR"/rulesets/*.json; do upsert "$(render "$f")"; done

if [ -n "$WF_REPO" ]; then
  echo "⚙️  Required workflows de $WF_REPO (repos em produção)"
  RID=$(gh api "repos/$WF_REPO" -q .id)
  upsert "$(node -e '
    const [rid] = process.argv.slice(1);
    const wf = (p) => ({ repository_id: +rid, path: p, ref: "refs/heads/main" });
    process.stdout.write(JSON.stringify({
      name: "⚙️ Workflows obrigatórios", target: "branch", enforcement: "active",
      bypass_actors: [{ actor_id: 1, actor_type: "OrganizationAdmin", bypass_mode: "always" }],
      conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] },
        repository_property: { include: [{ name: "in_production", property_values: ["true"], source: "custom" }], exclude: [] } },
      rules: [{ type: "workflows", parameters: { do_not_enforce_on_create: true,
        workflows: [wf(".github/workflows/ci.yml"), wf(".github/workflows/conventions.yml")] } }] }));
  ' "$RID")"
fi
echo "🏁 Pronto. Marque cada repo com governance/enterprise/set-repo.sh ORG/REPO in_production=true"
