const R = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[96m'    // CLAUDE
const PURPLE = '\x1b[95m'  // SETUP
const GRAY = '\x1b[90m'    // By:

const CLAUDE = [
  ' ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗',
  '██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝',
  '██║     ██║     ███████║██║   ██║██║  ██║█████╗  ',
  '██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ',
  '╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗',
  ' ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝',
]

const SETUP = [
  '███████╗███████╗████████╗██╗   ██╗██████╗ ',
  '██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗',
  '███████╗█████╗     ██║   ██║   ██║██████╔╝',
  '╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ ',
  '███████║███████╗   ██║   ╚██████╔╝██║     ',
  '╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ',
]

// strip ANSI to measure real char width
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '')

export function printHeader(): void {
  process.stdout.write('\x1bc') // full clear + reset cursor

  const cols = process.stdout.columns || 100
  const indent = '  '

  process.stdout.write('\n')

  for (const line of CLAUDE) {
    process.stdout.write(`${indent}${BOLD}${CYAN}${line}${R}\n`)
  }

  process.stdout.write('\n')

  const setupLines = SETUP.map((line, i) => {
    // last line: right-align "By: Gabriel Moretti" on same row
    if (i < SETUP.length - 1) return `${indent}${BOLD}${PURPLE}${line}${R}\n`

    const rendered = `${indent}${BOLD}${PURPLE}${line}${R}`
    const usedCols = stripAnsi(rendered).length
    const by = 'By: Gabriel Moretti'
    const gap = Math.max(1, cols - usedCols - by.length - 1)
    return `${rendered}${' '.repeat(gap)}${DIM}${GRAY}${by}${R}\n`
  })

  for (const line of setupLines) process.stdout.write(line)

  process.stdout.write('\n')
}
