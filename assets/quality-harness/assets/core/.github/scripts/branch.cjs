#!/usr/bin/env node
// 🌳 Valida o nome da branch (hook pre-push e CI).  Uso: node .github/scripts/branch.cjs <nome>
const branch = require('./lib/branch.cjs');
const name = process.argv[2];
const r = branch.validate(name || '');
if (!r.ok) {
  console.error(`\n🚨 Branch "${name}" fora do padrão Conventional Branch:`);
  for (const e of r.errors) console.error(`   • ${e}`);
  console.error('\n   Exemplos:  feature/add-login-page · fix/header-bug · hotfix/security-patch · release/v1.2.0 · chore/update-dependencies');
  console.error(`   Renomeie com:  git branch -m ${name} <tipo>/<descricao>\n`);
  process.exit(1);
}
