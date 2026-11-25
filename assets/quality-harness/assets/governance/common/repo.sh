#!/usr/bin/env bash
# ⚙️ Configurações de repositório que funcionam em QUALQUER plano (Free e Enterprise).
# Uso: governance/common/repo.sh OWNER/REPO
# Env opcionais: IN_PRODUCTION=true|false · PROD_REVIEWER_TEAM=<slug-do-time> · COVERAGE_MIN · COVERAGE_MIN_PROD
set -euo pipefail
REPO=${1:?uso: repo.sh OWNER/REPO}
OWNER=${REPO%%/*}
ok()   { echo "  ✅ $*"; }
warn() { echo "  ⚠️  $*"; }

echo "⚙️  Merge e branches — $REPO"
# squash em trabalho (título do PR = commit gitmoji) · merge commit só para back-merge entre trunks
# a descrição do PR NÃO vai para o commit (a seção 🤖 do template fica só no PR)
gh api -X PATCH "repos/$REPO" --silent \
  -F allow_squash_merge=true -F allow_merge_commit=true -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=COMMIT_MESSAGES \
  -f merge_commit_title=PR_TITLE -f merge_commit_message=BLANK \
  -F delete_branch_on_merge=true -F allow_auto_merge=true -F allow_update_branch=true \
  -F web_commit_signoff_required=false && ok "squash + merge commit, título do PR como mensagem, apaga branch após merge"

echo "🔢 Variáveis do CI"
gh variable set IN_PRODUCTION       -R "$REPO" -b "${IN_PRODUCTION:-false}"     && ok "IN_PRODUCTION=${IN_PRODUCTION:-false}"
gh variable set COVERAGE_MIN      -R "$REPO" -b "${COVERAGE_MIN:-75}"       && ok "COVERAGE_MIN=${COVERAGE_MIN:-75}"
gh variable set COVERAGE_MIN_PROD -R "$REPO" -b "${COVERAGE_MIN_PROD:-85}"  && ok "COVERAGE_MIN_PROD=${COVERAGE_MIN_PROD:-85}"

echo "🌍 Environments"
REVIEWERS='[]'
if [ -n "${PROD_REVIEWER_TEAM:-}" ]; then
  TEAM_ID=$(gh api "orgs/$OWNER/teams/$PROD_REVIEWER_TEAM" -q .id 2>/dev/null || true)
  [ -n "$TEAM_ID" ] && REVIEWERS="[{\"type\":\"Team\",\"id\":$TEAM_ID}]"
fi
env_put() { # nome, json
  if gh api -X PUT "repos/$REPO/environments/$1" --input - --silent <<<"$2" 2>/dev/null; then ok "$1"
  else gh api -X PUT "repos/$REPO/environments/$1" --silent --input - <<<'{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' 2>/dev/null \
    && warn "$1 criado sem aprovação obrigatória (recurso indisponível neste plano/visibilidade)" || warn "$1 não pôde ser criado"; fi
}
env_put production "{\"reviewers\":$REVIEWERS,\"prevent_self_review\":true,\"deployment_branch_policy\":{\"protected_branches\":false,\"custom_branch_policies\":true}}"
gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" -f name='v*' -f type=tag --silent 2>/dev/null && ok "production só aceita tags v*" || true
for e in test sandbox; do
  if gh api "repos/$REPO/branches/$e" --silent 2>/dev/null; then
    env_put "$e" '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}'
    gh api -X POST "repos/$REPO/environments/$e/deployment-branch-policies" -f name="$e" -f type=branch --silent 2>/dev/null || true
    gh api -X POST "repos/$REPO/environments/$e/deployment-branch-policies" -f name='v*-rc.*' -f type=tag --silent 2>/dev/null || true
  else echo "  ➖ branch $e não existe (opcional) — environment não criado"; fi
done

echo "🔐 Segurança"
gh api -X PATCH "repos/$REPO" --silent --input - 2>/dev/null <<'JSON' && ok "secret scanning + push protection" || warn "secret scanning/push protection indisponível (repo privado sem Secret Protection)"
{"security_and_analysis":{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}}
JSON
gh api -X PUT "repos/$REPO/vulnerability-alerts" --silent 2>/dev/null && ok "Dependabot alerts" || warn "Dependabot alerts não habilitados"
gh api -X PUT "repos/$REPO/automated-security-fixes" --silent 2>/dev/null && ok "Dependabot security updates" || true

echo "🏷️  Labels"
"$(dirname "$0")/../../scripts/sync-labels.sh" "$REPO" | tail -1
