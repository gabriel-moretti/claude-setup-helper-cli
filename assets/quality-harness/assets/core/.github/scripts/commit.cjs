#!/usr/bin/env node
// 😜 Hook commit-msg: remove trailers de IA inseridos por ferramentas e valida o gitmoji.
//    Uso: node .github/scripts/commit.cjs <arquivo-da-mensagem>   (lefthook passa {1})
const fs = require('fs');
const gitmoji = require('./lib/gitmoji.cjs');

const file = process.argv[2];
if (!file) { console.error('uso: commit.cjs <arquivo>'); process.exit(2); }
let msg = fs.readFileSync(file, 'utf8');
const cleaned = gitmoji.stripAiTrailers(msg);
if (cleaned.trim() !== msg.trim()) {
  fs.writeFileSync(file, cleaned);
  console.log('🧹 Trailer de atribuição a IA removido da mensagem.');
  msg = cleaned;
}
const { errors, gitmoji: g, skipped } = gitmoji.validate(msg, { pr: true });
if (skipped) process.exit(0);
if (errors.length) {
  console.error('\n🚨 Commit fora do padrão gitmoji (https://gitmoji.dev/specification):');
  for (const e of errors) console.error(`   • ${e}`);
  console.error('\n   Exemplos:  ✨ Add login page   ·   🐛 (header): Fix overlap on mobile   ·   :memo: Document setup\n');
  process.exit(1);
}
console.log(`✅ ${g.emoji} ${g.name}`);
