#!/usr/bin/env node
// 🧩 Gera as regex dos rulesets a partir das MESMAS fontes do CI (gitmojis.json e lib/branch.cjs),
//    para o que o GitHub barra no push ser idêntico ao que o check `conventions` valida.
//    Só usa sintaxe comum (sem lookbehind/escapes \u) para ser aceita pelo motor de regex dos rulesets.
const path = require('path');
const root = path.join(__dirname, '../..');
const gitmoji = require(path.join(root, '.github/scripts/lib/gitmoji'));
const branch = require(path.join(root, '.github/scripts/lib/branch'));

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const forms = new Set();
for (const g of gitmoji.LIST) { forms.add(g.emoji); forms.add(gitmoji.norm(g.emoji)); }
const emojis = [...forms].sort((a, b) => b.length - a.length).map(esc).join('|');

const COMMIT = `^(?:(?:${emojis}|:[a-z0-9_+-]+:) (?:\\([A-Za-z0-9][A-Za-z0-9_./-]*\\):? |:? ?)[^ ]|(?:fixup|squash|amend)! |Merge (?:branch|remote-tracking branch|pull request) )`;
const AI = `(?i)(?:co-authored-by|generated-by|assisted-by|ai-assisted)\\s*:.*(?:${gitmoji.AI_TOOLS}|noreply@anthropic\\.com)|🤖|(?:generated|written|created|made|gerado|escrito|criado|feito)\\s+(?:with|by|using|com|por|usando)\\s+(?:a\\s+|o\\s+)?(?:${gitmoji.AI_TOOLS}|ai|ia)\\b`;

module.exports = { COMMIT, AI, BRANCH: branch.REGEX };
if (require.main === module) console.log(JSON.stringify(module.exports, null, 2));
