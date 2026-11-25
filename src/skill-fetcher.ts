import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import type { SkillSource } from './types.js'

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'claude-setup-helper' } }, (res) => {
        // GitHub archive URLs redirect to codeload; https.get does not follow.
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          download(res.headers.location, dest).then(resolve, reject)
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`))
          return
        }
        const file = fs.createWriteStream(dest)
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
        file.on('error', reject)
      })
      .on('error', reject)
  })
}

export async function fetchSkill(source: SkillSource, targetDir: string): Promise<void> {
  const ref = source.ref ?? 'main'
  const url = `https://github.com/${source.org}/${source.repo}/archive/refs/heads/${ref}.tar.gz`
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csh-'))
  const tarball = path.join(tmp, 'repo.tar.gz')

  try {
    await download(url, tarball)
    execFileSync('tar', ['xzf', tarball, '-C', tmp], { stdio: 'pipe' })

    // GitHub extrai para uma única pasta raiz, normalmente {repo}-{ref} — mas repos
    // renomeados usam o nome novo (ex.: everything-claude-code → ECC-main), então lê a pasta real.
    const roots = fs.readdirSync(tmp, { withFileTypes: true }).filter((d) => d.isDirectory())
    if (roots.length !== 1) throw new Error(`Unexpected archive layout for ${source.org}/${source.repo}`)
    const extractedRoot = path.join(tmp, roots[0].name)
    const src = source.subdir ? path.join(extractedRoot, source.subdir) : extractedRoot

    if (!fs.existsSync(src)) {
      throw new Error(`Path not found in archive: ${source.subdir ?? '(root)'}`)
    }

    fs.rmSync(targetDir, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(targetDir), { recursive: true })
    fs.cpSync(src, targetDir, { recursive: true })
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}
