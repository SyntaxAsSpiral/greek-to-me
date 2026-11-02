import { test, expect } from 'claude-code/testing'
import { clockText, greekify, byMap, buildMap, quenya, tengwar, cirth, customMap, aurebesh, mapDeep, ansiSafe, groupSummary, groupPreview, wrapRows, stickyPeek, ingForm, livePhrase } from './register'

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

test('quenya: the vowel joins the NEXT consonant as one character, a carrier syllable at word end', () => {
  // tal: tinco, then lambe+a as ONE character (letter 20 of 22, vowel a: U+F5200 + 5*20)
  expect(quenya('tal')).toBe('\u{F5100}\u{F5264}')
  // ta: tinco, then the carrier+a syllable (carrier is letter 21)
  expect(quenya('ta')).toBe('\u{F5100}\u{F5269}')
  expect(quenya('a_b')).toBe('\u{F5269}_\u{F5105}')
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

test('tengwar: the vowel joins the consonant BEFORE it as one character, a carrier syllable when none', () => {
  expect(tengwar('ta')).toBe('\u{F5200}') // tinco+a, one cell
  expect(tengwar('at')).toBe('\u{F5269}\u{F5100}') // carrier+a, then tinco
  expect(tengwar('tal')).toBe('\u{F5200}\u{F5132}') // tinco+a, then lambe
  expect(tengwar('t_a')).toBe('\u{F5100}_\u{F5269}') // a break: the vowel takes a carrier
  expect([...tengwar('tale')].length).toBe(2) // two syllables, two cells
})

test('group preview: every line is previewed, with the first marked as a command', () => {
  const tf = byMap(new Map([['l', 'λ'], ['s', 'σ']]))
  expect(groupPreview({ tool: 'Bash', input: { command: 'ls\nls\nls' } }, tf)).toEqual(['$ λσ', '  λσ', '  λσ'])
})
test('wrapRows: lines wrap into rows; past the cap the last row counts the source lines that have anything hidden', () => {
  expect(wrapRows(['abcdefghij'], 4, 5)).toEqual(['abcd', 'efgh', 'ij'])
  expect(wrapRows(['a', 'b'], 4, 5)).toEqual(['a', 'b'])
  expect(wrapRows(['a', 'b', 'c', 'd', 'e'], 4, 5)).toEqual(['a', 'b', 'c', 'd', 'e']) // exactly the cap: no marker
  expect(wrapRows(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 4, 5)).toEqual(['a', 'b', 'c', 'd', '(+3 lines)'])
  expect(wrapRows(['a', 'b', 'c', 'd', 'e', 'f'], 4, 5)).toEqual(['a', 'b', 'c', 'd', '(+2 lines)'])
  expect(wrapRows(['x'.repeat(30)], 10, 2)).toEqual(['xxxxxxxxxx', '(+1 line)']) // one long line, cut: one line
  expect(wrapRows(['a', 'b', 'c', 'd'], 4, 3, n => `<${n}>`)).toEqual(['a', 'b', '<2>']) // the marker is the caller's to draw
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

test('grimdark: 26 distinct one-cell signs, none an emoji, case folds', () => {
  const f = byMap(buildMap('grimdark')!)
  const signs = [...'abcdefghijklmnopqrstuvwxyz'].map(f)
  expect(new Set(signs).size).toBe(26)
  for (const s of signs) {
    expect([...s].length).toBe(1)
    expect(/\p{Emoji_Presentation}/u.test(s)).toBe(false) // an emoji would be two cells wide
  }
  expect(f('aE_1')).toBe('☠⚙_1')
})

test('cirth: a letter for a letter in the registry\'s letters, moved to U+F5180 and up, others kept', () => {
  expect(cirth('pa b!')).toBe('\u{F5180}\u{F51B1} \u{F5181}!')
  expect(cirth('K')).toBe(cirth('c')) // c and k are the same rune, case folds
  for (const c of cirth('abcdefghijklmnopqrstuvwxyz')) expect(c.codePointAt(0)! >= 0xf5180 && c.codePointAt(0)! <= 0xf51ff).toBe(true)
})

test('customMap: 26 characters map a to z, 52 give the capitals their own, spaces are ignored, anything else is null', () => {
  const lower = 'ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᚲᚱᛊᛏᚢᚢᚹᛉᛃᛉ' // runic, as the README gives it
  const m = byMap(customMap(lower)!)
  expect(m('ab Ab 1')).toBe('ᚨᛒ ᚨᛒ 1')
  const both = byMap(customMap(lower + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')!)
  expect(both('aA')).toBe('ᚨA')
  expect(byMap(customMap('z y x w v u t s r q p o n m l k j i h g f e d c b a')!)('abc')).toBe('zyx')
  expect(customMap('abc')).toBeNull()
  expect(customMap('')).toBeNull()
  expect(customMap(lower + 'x')).toBeNull()
})

test('customMap: ten more characters at the end are the digits 0 to 9, with or without the capitals', () => {
  const lower = 'ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᚲᚱᛊᛏᚢᚢᚹᛉᛃᛉ'
  const digits = '٠١٢٣٤٥٦٧٨٩'
  expect(byMap(customMap(lower + digits)!)('a 042 A')).toBe('ᚨ ٠٤٢ ᚨ')
  const all = byMap(customMap(lower + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + digits)!)
  expect(all('aA9')).toBe('ᚨA٩')
  expect(byMap(customMap(lower)!)('9')).toBe('9') // no digits given: left as they are
  expect(customMap(lower + digits + 'x')).toBeNull()
  expect(customMap(lower + '12345')).toBeNull()
})

test('clockText: seconds, then minutes and seconds', () => {
  expect(clockText(0)).toBe('0s')
  expect(clockText(14.9)).toBe('14s')
  expect(clockText(60)).toBe('1m 0s')
  expect(clockText(65)).toBe('1m 5s')
  expect(clockText(-3)).toBe('0s')
})

test('ingForm: the first word of a description turns to -ing as English spells it', () => {
  const cases: [string, string][] = [
    ['Read', 'Reading'], ['Record', 'Recording'], ['Search', 'Searching'], ['Write', 'Writing'], ['Run', 'Running'],
    ['Set', 'Setting'], ['Commit', 'Committing'], ['Fix', 'Fixing'], ['Show', 'Showing'], ['Tie', 'Tying'],
    ['See', 'Seeing'], ['Edit', 'Editing'], ['Open', 'Opening'], ['Check', 'Checking'], ['List', 'Listing'],
    ['Running', 'Running'], ['./run.sh', './run.sh'],
  ]
  for (const [word, ing] of cases) expect(ingForm(word)).toBe(ing)
  expect(livePhrase('Read  context around\nthe strings')).toBe('Reading context around the strings')
  expect(livePhrase(undefined)).toBe(null)
  expect(livePhrase('git status in the repo')).toBe('gitting status in the repo') // zk: it works
  expect(livePhrase('Check CI')).toBe('Checking CI')
})
