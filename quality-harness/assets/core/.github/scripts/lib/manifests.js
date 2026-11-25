// 📦️ Versão do repositório. Fonte da verdade: VERSION. Os manifestos na raiz que existirem precisam bater.
const fs = require('fs');
const path = require('path');

const READERS = {
  VERSION: (s) => s.trim(),
  'package.json': (s) => JSON.parse(s).version,
  'pyproject.toml': (s) => (s.match(/^\[project\][\s\S]*?^version\s*=\s*"([^"]+)"/m) || s.match(/^\[tool\.poetry\][\s\S]*?^version\s*=\s*"([^"]+)"/m) || [])[1],
  'pubspec.yaml': (s) => ((s.match(/^version:\s*["']?([^\s"'#]+)/m) || [])[1] || '').split('+')[0] || undefined,
};

function read(root = '.') {
  const found = {};
  for (const [file, fn] of Object.entries(READERS)) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    try { const v = fn(fs.readFileSync(p, 'utf8')); if (v) found[file] = v; } catch { /* manifesto sem versão */ }
  }
  return found;
}

function version(root = '.') {
  const found = read(root);
  const values = [...new Set(Object.values(found))];
  if (!values.length) return { version: null, found, error: 'nenhuma versão encontrada (crie o arquivo VERSION)' };
  if (values.length > 1) return { version: null, found, error: `versões divergentes: ${Object.entries(found).map(([f, v]) => `${f}=${v}`).join(', ')}` };
  return { version: values[0], found, error: null };
}

module.exports = { read, version };
