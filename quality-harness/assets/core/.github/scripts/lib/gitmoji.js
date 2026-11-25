// 😜 Mensagens de commit no formato https://gitmoji.dev/specification
//    <intention> [scope?][:?] <message>
//    ex.: ✨ Add login page · ♻️ (auth): Extract token service · :bug: Fix header overlap
const fs = require('fs');
const path = require('path');

const LIST = JSON.parse(fs.readFileSync(path.join(__dirname, '../../gitmoji/gitmojis.json'), 'utf8')).gitmojis;
const norm = (s) => s.replace(/\uFE0F/g, '');
const BY_EMOJI = new Map(LIST.map((g) => [norm(g.emoji), g]));
const BY_CODE = new Map(LIST.map((g) => [g.code, g]));
const EMOJIS_BY_LEN = [...BY_EMOJI.keys()].sort((a, b) => b.length - a.length);
const MAX_HEADER = 100;

// Atribuição de autoria a IA — nunca entra em commits nem em nomes de branch.
const AI_TOOLS = 'claude|anthropic|copilot|openai|chatgpt|gpt-?\\d|codex|cursor|gemini|devin|windsurf|codeium|aider|tabnine';
const AI_TRAILER = new RegExp(`^\\s*(co-authored-by|generated-by|assisted-by|ai-assisted)\\s*:.*(${AI_TOOLS}|\\bai\\b|\\bia\\b|noreply@anthropic\\.com)`, 'i');
const AI_FOOTER = new RegExp(`^\\s*(🤖\\s*)?(generated|created|written|made|gerado|criado|escrito|feito)\\s+(with|by|using|com|por|usando)\\s+.*(${AI_TOOLS}|\\bai\\b|\\bia\\b)`, 'i');
const AI_INLINE = new RegExp(`\\b(generated|written|created|made|gerado|escrito|criado|feito)\\s+(with|by|using|com|por|usando|pela?|pelo)\\s+(a\\s+|o\\s+)?(${AI_TOOLS}|\\bai\\b|\\bia\\b|intelig[eê]ncia artificial)`, 'i');
const AI_ROBOT = /🤖/;

function parseHeader(header) {
  let rest = null, gitmoji = null;
  const code = header.match(/^(:[a-z0-9_+-]+:)/);
  if (code && BY_CODE.has(code[1])) { gitmoji = BY_CODE.get(code[1]); rest = header.slice(code[1].length); }
  else {
    const h = norm(header);
    const e = EMOJIS_BY_LEN.find((x) => h.startsWith(x));
    if (e) { gitmoji = BY_EMOJI.get(e); rest = h.slice(e.length); }
  }
  if (!gitmoji) return { error: 'não começa com um gitmoji válido (veja https://gitmoji.dev)' };
  const m = rest.match(/^ (?:\(([A-Za-z0-9][\w./-]*)\):? |:? ?)(\S.*)$/);
  if (!m) return { gitmoji, error: 'formato esperado: `<gitmoji> [(escopo)][:] <mensagem>`' };
  return { gitmoji, scope: m[1] || null, subject: m[2] };
}

// Retorna as linhas de atribuição a IA encontradas na mensagem
function aiAttribution(message) {
  return message.split(/\r?\n/).filter((l) => AI_TRAILER.test(l) || AI_FOOTER.test(l) || AI_INLINE.test(l) || AI_ROBOT.test(l));
}

// Remove só trailers/rodapés de atribuição (o que as ferramentas inserem sozinhas)
function stripAiTrailers(message) {
  const kept = message.split(/\r?\n/).filter((l) => !(AI_TRAILER.test(l) || AI_FOOTER.test(l)));
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
}

// ctx: { pr: true } aceita fixup!/squash!/merge de "Update branch" (somem no squash)
function validate(message, ctx = {}) {
  const errors = [];
  const lines = message.replace(/^#.*$/gm, '').trim().split(/\r?\n/);
  const header = (lines[0] || '').trim();
  if (!header) return { errors: ['mensagem vazia'] };
  if (ctx.pr && /^(fixup|squash|amend)! /.test(header)) return { errors: [], skipped: true };
  if (ctx.pr && /^Merge (branch|remote-tracking branch|pull request) /.test(header)) return { errors: [], skipped: true };

  const p = parseHeader(header);
  if (p.error) errors.push(p.error);
  if ([...header].length > MAX_HEADER) errors.push(`cabeçalho com mais de ${MAX_HEADER} caracteres`);
  if (lines.length > 1 && lines[1].trim() !== '') errors.push('deixe uma linha em branco entre o cabeçalho e o corpo');
  const ai = aiAttribution(message);
  if (ai.length) errors.push(`não mencione autoria de IA no commit: ${ai.map((l) => `"${l.trim()}"`).join(', ')}`);
  return { errors, ...p };
}

module.exports = { LIST, parseHeader, validate, aiAttribution, stripAiTrailers, AI_TOOLS, norm, BY_EMOJI };
