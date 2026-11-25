import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { detectStack } from '../src/detect.js'

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'csh-detect-'))
}

test('detectStack: empty dir detects nothing', () => {
  const dir = tmpDir()
  try {
    const d = detectStack(dir)
    assert.deepEqual(d, { languages: [], frameworks: [], devops: [], flutterTargets: [] })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: Next.js + TypeScript + Supabase from package.json', () => {
  const dir = tmpDir()
  try {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({
        dependencies: { next: '^15.0.0', '@supabase/supabase-js': '^2.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
    )
    const d = detectStack(dir)
    assert.ok(d.languages.includes('typescript'))
    assert.ok(d.frameworks.includes('nextjs'))
    assert.ok(d.devops.includes('supabase'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: FastAPI from pyproject.toml, AWS from cdk.json', () => {
  const dir = tmpDir()
  try {
    fs.writeFileSync(path.join(dir, 'pyproject.toml'), '[project]\ndependencies = ["fastapi", "boto3"]\n')
    fs.writeFileSync(path.join(dir, 'cdk.json'), '{}')
    const d = detectStack(dir)
    assert.ok(d.languages.includes('python'))
    assert.ok(d.frameworks.includes('fastapi'))
    assert.ok(d.devops.includes('aws'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: Python from requirements.txt', () => {
  const dir = tmpDir()
  try {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'fastapi==0.110.0\n')
    const d = detectStack(dir)
    assert.ok(d.languages.includes('python'))
    assert.ok(d.frameworks.includes('fastapi'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: Flutter and Swift by manifest files', () => {
  const dir = tmpDir()
  try {
    fs.writeFileSync(path.join(dir, 'pubspec.yaml'), 'name: app\n')
    fs.writeFileSync(path.join(dir, 'Package.swift'), '// swift-tools-version:5.9\n')
    const d = detectStack(dir)
    assert.ok(d.languages.includes('flutter'))
    assert.ok(d.languages.includes('swift'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: Flutter platform targets from generated folders', () => {
  const dir = tmpDir()
  try {
    fs.writeFileSync(path.join(dir, 'pubspec.yaml'), 'name: app\n')
    for (const d of ['ios', 'android', 'linux']) fs.mkdirSync(path.join(dir, d))
    const d = detectStack(dir)
    assert.deepEqual(d.flutterTargets.sort(), ['android', 'desktop', 'ios'])
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: platform folders ignored without pubspec.yaml', () => {
  const dir = tmpDir()
  try {
    fs.mkdirSync(path.join(dir, 'web'))
    assert.deepEqual(detectStack(dir).flutterTargets, [])
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('detectStack: supabase dir and malformed package.json tolerated', () => {
  const dir = tmpDir()
  try {
    fs.mkdirSync(path.join(dir, 'supabase'))
    fs.writeFileSync(path.join(dir, 'package.json'), 'not json')
    const d = detectStack(dir)
    assert.ok(d.devops.includes('supabase'))
    assert.deepEqual(d.languages, [])
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
