import { test } from 'node:test'
import assert from 'node:assert/strict'

test('printHeader: runs without throwing and outputs expected content', async () => {
  const chunks: string[] = []
  const original = process.stdout.write.bind(process.stdout)
  process.stdout.write = (chunk: any): boolean => { chunks.push(String(chunk)); return true }

  try {
    const { printHeader } = await import('../src/header.js')
    printHeader()
  } finally {
    process.stdout.write = original
  }

  const output = chunks.join('')
  assert.ok(output.includes('██████'), 'header should contain block ASCII art')
  assert.ok(output.includes('╚══════╝'), 'header should contain box-drawing chars')
  assert.ok(output.includes('Gabriel Moretti'), 'header should contain author name')
})
