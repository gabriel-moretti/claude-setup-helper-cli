// 🧭 Convenções do PR/push: branch, destino, título, commits e autores. Rodado via actions/github-script.
const branchLib = require('./lib/branch');
const gitmoji = require('./lib/gitmoji');

const AI_AUTHOR = new RegExp(`(${gitmoji.AI_TOOLS})|noreply@anthropic\\.com|cursoragent|\\[bot\\].*(claude|copilot|codex|devin)`, 'i');

async function run({ github, context, core }) {
  const { owner, repo } = context.repo;
  const errors = [], warnings = [];

  if (context.eventName === 'push') {
    // 🕵️ Auditoria pós-merge: no GitHub Free (privado) nada bloqueia o merge, então avisamos aqui.
    for (const c of context.payload.commits || []) {
      const r = gitmoji.validate(c.message);
      if (r.errors.length) errors.push(`\`${c.id.slice(0, 7)}\` "${c.message.split('\n')[0]}" — ${r.errors.join('; ')}`);
    }
    return report(core, errors, warnings, `Auditoria do push em ${context.ref.replace('refs/heads/', '')}`);
  }

  const pr = context.payload.pull_request;
  const head = pr.head.ref, base = pr.base.ref;

  // 🌳 Nome da branch
  const b = branchLib.validate(head);
  for (const e of b.errors) errors.push(`🌳 Branch \`${head}\`: ${e}`);

  // 🎯 Destino permitido
  let hasTest = false;
  try { await github.rest.repos.getBranch({ owner, repo, branch: 'test' }); hasTest = true; } catch { /* sem test */ }
  const target = branchLib.allowedTarget(head, base, hasTest);
  if (typeof target === 'string') errors.push(`🎯 ${head} → ${base}: ${target}`);

  // 🔀 Título do PR = mensagem do squash commit
  const t = gitmoji.validate(pr.title);
  for (const e of t.errors) errors.push(`🔀 Título do PR: ${e}`);
  const rv = branchLib.releaseVersion(head);
  if (rv && !pr.title.includes(rv)) errors.push(`🔖 Título do PR de release deve citar a versão (ex.: "🔖 Release v${rv}")`);
  if (b.type === 'hotfix' && t.gitmoji && !['🚑️', '🚑', '🔒️', '🔒'].includes(t.gitmoji.emoji)) warnings.push('🚑️ hotfix normalmente usa 🚑️ (ou 🔒️ para segurança) no título');

  // 😜 Commits e autores
  const commits = await github.paginate(github.rest.pulls.listCommits, { owner, repo, pull_number: pr.number, per_page: 100 });
  for (const c of commits) {
    const sha = c.sha.slice(0, 7);
    const r = gitmoji.validate(c.commit.message, { pr: true });
    if (r.errors.length) errors.push(`😜 \`${sha}\` "${c.commit.message.split('\n')[0]}" — ${r.errors.join('; ')}`);
    const who = [c.author?.login, c.committer?.login, c.commit.author?.name, c.commit.author?.email].filter(Boolean).join(' ');
    if (AI_AUTHOR.test(who)) errors.push(`🙅 \`${sha}\` tem autor de ferramenta de IA (${c.commit.author?.name}) — o autor deve ser a pessoa responsável`);
  }
  return report(core, errors, warnings, `PR #${pr.number} · ${head} → ${base}`);
}

async function report(core, errors, warnings, title) {
  const md = [`## 🧭 Convenções — ${title}`, '',
    errors.length ? '### 🚧 Pendências' : '### ✅ Tudo dentro do padrão', ...errors.map((e) => `- ${e}`),
    ...(warnings.length ? ['', '### ⚠️ Avisos', ...warnings.map((w) => `- ${w}`)] : []),
    '', '<sub>Padrões: [SemVer](https://semver.org) · [gitmoji](https://gitmoji.dev/specification) · [Conventional Branch](https://conventionalbranch.org) · [Common Changelog](https://common-changelog.org) — detalhes em CONTRIBUTING.md</sub>'].join('\n');
  await core.summary.addRaw(md).write();
  warnings.forEach((w) => core.warning(w));
  if (errors.length) core.setFailed(`${errors.length} pendência(s) de convenção — veja o resumo do job`);
}

module.exports = run;
