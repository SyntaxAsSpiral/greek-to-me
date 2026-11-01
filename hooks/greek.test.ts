import { test, expect } from 'claude-code/testing'
import { greekify, byMap, buildMap, quenya, tengwar, maya, aurebesh, mapDeep, ansiSafe, groupSummary, groupPreview, wrapRows, stickyPeek } from './register'

const map = byMap(new Map([['a', 'α'], ['b', 'β']]))
const keep = new Set(['json'])

test('code fence is transliterated, prose is not', () => {
  expect(greekify('ab\n```js\nab\n```\nab', map, keep)).toBe('ab\n```js\nαβ\n```\nab')
})
test('kept language is left alone', () => {
  expect(greekify('```json\nab\n```', map, keep)).toBe('```json\nab\n```')
})
test('unclosed fence (streaming) is transliterated to the end', () => {
  expect(greekify('```\nab', map, keep)).toBe('```\nαβ')
})

test('quenya: tehta rides the next consonant, carrier at word end', () => {
  // "tal": tinco, lambe + a-tehta ; "ta": tinco, carrier + a-tehta
  expect(quenya('tal')).toBe('\u{F5100}\u{F5132}\u{F5140}')
  expect(quenya('ta')).toBe('\u{F5100}\u{F512C}\u{F5140}')
  expect(quenya('a_b')).toBe('\u{F512C}\u{F5140}_\u{F5105}')
})

test('maya: stable per character, case-folded, punctuation kept', () => {
  const o = maya('aA, b')
  expect([...o][0]).toBe([...o][1])
  expect(o[0]! >= '\u{F6200}' || [...o][0]!.codePointAt(0)! >= 0xf6200).toBe(true)
  expect(o.includes(', ')).toBe(true)
})

test('aurebesh: alphanumerics go to U+EA00+ascii, rest kept', () => {
  expect(aurebesh('a 1')).toBe('\u{F5061} \u{F5031}')
})

test('traces: only code-bearing keys change, paths and shape are kept', () => {
  const tf = byMap(new Map([['a', 'α'], ['b', 'β']]))
  const out = mapDeep({ command: 'ab', file_path: '/a/b', edits: [{ old_string: 'a', new_string: 'b' }], n: 3 }, new Set(['command', 'old_string', 'new_string']), tf)
  expect(out).toEqual({ command: 'αβ', file_path: '/a/b', edits: [{ old_string: 'α', new_string: 'β' }], n: 3 })
})
test('traces: a result keeps its shape and a nested content string changes', () => {
  const tf = byMap(new Map([['a', 'α']]))
  const out: any = mapDeep({ type: 'text', file: { filePath: 'a.txt', content: 'aa', numLines: 1 }, interrupted: false }, new Set(['content']), tf)
  expect(out).toEqual({ type: 'text', file: { filePath: 'a.txt', content: 'αα', numLines: 1 }, interrupted: false })
})

test('traces: ANSI colour codes survive, the text between them changes', () => {
  const tf = ansiSafe(byMap(new Map([['m', 'μ'], ['a', 'α']])))
  expect(tf('\x1b[31mamm\x1b[0m a')).toBe('\x1b[31mαμμ\x1b[0m α')
})

test("group summary reads like the engine's, in both tenses", () => {
  const calls = [{ tool: 'Grep' }, { tool: 'Bash' }, { tool: 'Bash' }]
  expect(groupSummary(calls, true)).toBe('Searching for 1 pattern, running 2 shell commands…')
  expect(groupSummary(calls, false)).toBe('Searched for 1 pattern, ran 2 shell commands')
})
test('group preview puts a command in the script and leaves other calls readable', () => {
  const tf = byMap(new Map([['l', 'λ'], ['s', 'σ']]))
  expect(groupPreview({ tool: 'Bash', input: { command: 'ls' } }, tf)).toEqual(['$ λσ'])
  expect(groupPreview({ tool: 'Grep', input: { pattern: 'foo' } }, tf)).toEqual(['foo'])
})

test('tengwar: a vowel sits on the consonant before it, a carrier when none does', () => {
  expect(tengwar('ta')).toBe('\u{F5100}\u{F5140}') // tinco with an a-tehta
  expect(tengwar('at')).toBe('\u{F512C}\u{F5140}\u{F5100}') // carrier with a-tehta, then tinco
  expect(tengwar('tal')).toBe('\u{F5100}\u{F5140}\u{F5132}') // the tehta stays on the t, then lambe
  expect(tengwar('t_a')).toBe('\u{F5100}_\u{F512C}\u{F5140}') // other characters break the attachment
})

test('hebrew and katakana: every letter maps, case folds, and katakana stays one cell wide', () => {
  const h = byMap(buildMap('hebrew')!)
  const k = byMap(buildMap('katakana')!)
  expect(h('abc ABC 1')).toBe('אבכ אבכ 1')
  expect(k('abc ABC 1')).toBe('ｱﾊｾ ｱﾊｾ 1')
  for (const c of 'abcdefghijklmnopqrstuvwxyz') expect(k(c)).toMatch(/^[\uFF71-\uFF9D]$/) // half-width katakana only
  expect(new Set([...'abcdefghijklmnopqrstuvwxyz'].map(k)).size).toBe(26)
})

test('malayalam and arabic: 26 distinct signs each, case folds, other characters kept', () => {
  for (const name of ['malayalam', 'arabic']) {
    const f = byMap(buildMap(name)!)
    expect(new Set([...'abcdefghijklmnopqrstuvwxyz'].map(f)).size).toBe(26)
    expect(f('a_B 1')).toBe(f('a') + '_' + f('b') + ' 1')
  }
  expect(byMap(buildMap('arabic')!)('ab')).toBe('اب')
  expect(byMap(buildMap('malayalam')!)('ab')).toBe('അബ')
})

test('maya: only full-width signs, never a zero-width mark, and stable per character', () => {
  const o = maya('abcdefghijklmnopqrstuvwxyz0123456789')
  expect([...o].length).toBe(36)
  expect(new Set([...o]).size).toBeGreaterThan(30) // a hash may collide now and then, never wholesale
  for (const c of o) {
    const cp = c.codePointAt(0)!
    expect(cp >= 0xf6200 && cp <= 0xf6847).toBe(true)
  }
  expect(maya('aa')).toBe(maya('a') + maya('a'))
})

test('group preview: every line is previewed, with the first marked as a command', () => {
  const tf = byMap(new Map([['l', 'λ'], ['s', 'σ']]))
  expect(groupPreview({ tool: 'Bash', input: { command: 'ls\nls\nls' } }, tf)).toEqual(['$ λσ', '  λσ', '  λσ'])
})
test('wrapRows: a long line wraps into rows, capped, with an ellipsis on the last kept one', () => {
  expect(wrapRows(['abcdefghij'], 4, 5)).toEqual(['abcd', 'efgh', 'ij'])
  expect(wrapRows(['a', 'b'], 4, 5)).toEqual(['a', 'b'])
  const out = wrapRows(['x'.repeat(30)], 10, 2)
  expect(out.length).toBe(2)
  expect(out[1]).toBe('xxxxxxxx …')
})

test('group preview: a call with no input yet, or none left, shows nothing, never the tool name', () => {
  const tf = byMap(new Map([['l', 'λ']]))
  expect(groupPreview({ tool: 'Bash' }, tf)).toEqual([])
  expect(groupPreview({ tool: 'Bash', input: {} }, tf)).toEqual([])
  expect(groupPreview({ tool: 'Bash', input: { command: '   ' } }, tf)).toEqual([])
  expect(groupPreview({ tool: 'Grep', input: {} }, tf)).toEqual([])
  expect(groupPreview({ tool: 'Read', input: { file_path: '' } }, tf)).toEqual([])
})

test('stickyPeek: the previous peek stays until the next arrives, and only an empty group shows the ellipsis', () => {
  expect(stickyPeek(['$ new'], ['$ old'])).toEqual(['$ new'])
  expect(stickyPeek([], ['$ old', '  more'])).toEqual(['$ old', '  more'])
  expect(stickyPeek([], [])).toEqual(['…'])
})
