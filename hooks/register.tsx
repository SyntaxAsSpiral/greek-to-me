import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Tick } from '../types'

const LATIN = 'abcdefghijklmnopqrstuvwxyz'

// The tables below (the alphabets, pIqaD, Cirth, Tengwar letters) are written by scripts/sync-tables.py from
// esoscript.py in nix-os, which is their source of truth. Change them there, not here. Only the fictional scripts
// and greek live in the mod; any other script is the custom slot, with an alphabet of your own.
const alphabets: Record<string, { lower: string; upper?: string; digits?: string }> = {
  // a b c d e f g h i j k l m n o p q r s t u v w x y z
  greek: {
    lower: 'αβκδεφγηιξκλμνοπθρστυϝωχψζ',
    upper: 'ΑΒΚΔΕΦΓΗΙΞΚΛΜΝΟΠΘΡΣΤΥϜΩΧΨΖ',
  },
  // Grimdark: a skull, a cog, a cross and an ankh for the vowels you meet most, the elements of alchemy and
  // the Elder Futhark for the rest. All one cell wide and none of them an emoji; the only single-cell skull is U+2620.
  grimdark: { lower: '☠ᛒ🜂ᛞ⚙ᚠ🜃ᚺ✠🜄ᚲᛚᛗᚾ☥ᛈ🜔ᚱᛊᛏ⚜🜍ᚹ⚔⛧🜏' },
  // pIqaD, ConScript Unicode Registry U+F8D0..
  klingon: {
    lower: '',
    digits: '',
  },
}

export const buildMap = (name: string): Map<string, string> | null => {
  const a = alphabets[name]
  if (!a) return null
  const m = new Map<string, string>()
  const lo = [...a.lower]
  const up = a.upper ? [...a.upper] : lo
  ;[...LATIN].forEach((c, i) => {
    m.set(c, lo[i] ?? c)
    m.set(c.toUpperCase(), up[i] ?? lo[i] ?? c)
  })
  if (a.digits) [...a.digits].forEach((d, i) => m.set(String(i), d))
  return m
}

type Transform = (line: string) => string

const byMap = (map: Map<string, string>): Transform => line =>
  [...line].map(c => map.get(c) ?? c).join('')

// Aurebesh keeps its glyphs at plain ASCII, so fonts/AurebeshPUA.otf (Aurebesh.otf with
// every printable ASCII glyph also at U+F5000 + ascii) is what makes this mode drawable.
const aurebesh: Transform = line =>
  [...line].map(c => (/[A-Za-z0-9]/.test(c) ? String.fromCodePoint(0xf5000 + c.charCodeAt(0)) : c)).join('')

// Quenya in Tengwar (CSUR): consonants are letters; a vowel is a tehta drawn on the
// NEXT consonant, or on a short carrier when no consonant follows it.
const Q_CONS: [string, number][] = [
  ['qu', 0xe003], ['th', 0xe008], ['ng', 0xe006], ['nd', 0xe004], ['mb', 0xe005], ['ch', 0xe00a], ['hw', 0xe00b],
  ['t', 0xe000], ['p', 0xe001], ['c', 0xe002], ['k', 0xe002], ['q', 0xe003], ['d', 0xe004], ['b', 0xe005],
  ['g', 0xe006], ['f', 0xe009], ['n', 0xe010], ['m', 0xe011], ['v', 0xe015], ['w', 0xe017], ['s', 0xe020],
  ['z', 0xe021], ['h', 0xe024], ['y', 0xe026], ['j', 0xe026], ['r', 0xe030], ['l', 0xe032],
]
const Q_VOWELS: Record<string, number> = { a: 0xe040, e: 0xe046, i: 0xe044, o: 0xe04a, u: 0xe04c }
const CARRIER = 0xe02c

// Tengwar sits at CSUR U+E000, which Nerd Fonts claim for icons, so it is drawn from
// fonts/TengwarPUA.ttf: the same glyphs moved to U+F5100 + (cp - U+E000).
const T = (...cps: number[]): string => String.fromCodePoint(...cps.map(c => c - 0xe000 + 0xf5100))

// A vowel is a tiny mark with no width, which a terminal still gives a cell of its own, so each letter with
// its vowel is one precomposed character instead: U+F5200 + 5 * (the letter's place in TENGWAR_LETTERS) + the
// vowel's place in aeiou. scripts/build-tengwar.py draws them, and reads this very list.
const TENGWAR_LETTERS = [
  0xe000, 0xe001, 0xe002, 0xe003, 0xe004, 0xe005, 0xe006, 0xe008, 0xe009, 0xe00a, 0xe00b, 0xe010, 0xe011, 0xe015,
  0xe017, 0xe020, 0xe021, 0xe024, 0xe026, 0xe030, 0xe032, 0xe02c,
]
const syllable = (letter: number, vowel: string): string =>
  String.fromCodePoint(0xf5200 + TENGWAR_LETTERS.indexOf(letter) * 5 + 'aeiou'.indexOf(vowel))

// Quenya: a vowel is a tehta on the NEXT consonant, or on a short carrier when no consonant follows it.
const quenya: Transform = line => {
  const out: string[] = []
  const s = line.toLowerCase()
  let pending: string | null = null
  const flush = () => {
    if (pending) out.push(syllable(CARRIER, pending))
    pending = null
  }
  const letter = (cp: number) => {
    out.push(pending ? syllable(cp, pending) : T(cp))
    pending = null
  }
  for (let i = 0; i < s.length; ) {
    const c = s[i]!
    if (Q_VOWELS[c]) {
      flush()
      pending = c
      i += 1
      continue
    }
    if (c === 'x') {
      letter(0xe002)
      out.push(T(0xe020))
      i += 1
      continue
    }
    const hit = Q_CONS.find(([k]) => s.startsWith(k, i))
    if (hit) {
      letter(hit[1])
      i += hit[0].length
      continue
    }
    flush()
    out.push(line[i]!)
    i += 1
  }
  flush()
  return out.join('')
}

// The other convention, as in English and Sindarin: a vowel is a tehta on the consonant BEFORE it,
// or on a short carrier when no consonant stands there.
const tengwar: Transform = line => {
  const out: string[] = []
  const s = line.toLowerCase()
  let last = -1 // the letter just drawn, while it has no vowel yet; else -1
  const letter = (cp: number) => {
    out.push(T(cp))
    last = cp
  }
  for (let i = 0; i < s.length; ) {
    const c = s[i]!
    if (Q_VOWELS[c]) {
      if (last >= 0) out[out.length - 1] = syllable(last, c)
      else out.push(syllable(CARRIER, c))
      last = -1
      i += 1
      continue
    }
    if (c === 'x') {
      letter(0xe002)
      letter(0xe020)
      i += 1
      continue
    }
    const hit = Q_CONS.find(([k]) => s.startsWith(k, i))
    if (hit) {
      letter(hit[1])
      i += hit[0].length
      continue
    }
    last = -1
    out.push(line[i]!)
    i += 1
  }
  return out.join('')
}

// Cirth, from the ConScript Unicode Registry (U+E080..), moved with the Tengwar to U+F5100 + (cp - U+E000): a
// letter for a letter, a to z, in the registry's letters (c is k, x and z are z).
const CIRTH_CSUR = [
  0xe0b1, 0xe081, 0xe091, 0xe088, 0xe0af, 0xe082, 0xe092, 0xe0b9, 0xe0a7, 0xe08d, 0xe091, 0xe09e, 0xe085,
  0xe08b, 0xe0b3, 0xe080, 0xe096, 0xe09c, 0xe0a1, 0xe087, 0xe0aa, 0xe083, 0xe0ac, 0xe0a3, 0xe0df, 0xe0a3,
]
const cirth: Transform = line =>
  [...line].map(c => (/[A-Za-z]/.test(c) ? T(CIRTH_CSUR[c.toLowerCase().charCodeAt(0) - 97]!) : c)).join('')

// The open slot: an alphabet of your own, a to z (26 characters), then optionally the capitals (26 more) and the
// digits 0 to 9 (10 more, last), in any font the terminal has. Spaces are ignored. Anything else gives null, and the
// mod falls back to greek. So 26, 36 (letters + digits), 52 (+ capitals) or 62 (all three).
export const customMap = (alphabet: string): Map<string, string> | null => {
  const chars = [...alphabet.replace(/\s/g, '')]
  const n = chars.length
  if (n !== 26 && n !== 36 && n !== 52 && n !== 62) return null
  const caps = n >= 52
  const m = new Map<string, string>()
  ;[...LATIN].forEach((c, i) => {
    m.set(c, chars[i]!)
    m.set(c.toUpperCase(), chars[caps ? 26 + i : i]!)
  })
  if (n === 36 || n === 62) chars.slice(n - 10).forEach((d, i) => m.set(String(i), d))
  return m
}

const OPEN = /^(\s*)(`{3,}|~{3,})\s*([^\s`]*)/

// Rewrite fenced blocks only; an unclosed fence (streaming) runs to the end.
// Tool traces: only the fields that carry code are rewritten; names and paths stay readable.
// The tools the mod draws in script: their collapsed rows, and the folded groups that hold them (see drawsGroup).
// Every other tool is left to the engine, in Latin and with its own truncation: what a Write or an Edit puts
// in a file, for one, is worth reading as it is. Add a tool here only if its calls are shell commands, or carry code
// groupPreview can show; a tool whose preview is a path or a pattern (Read, Grep, Glob) gains nothing from it.
export const SCRIPT_GROUP_TOOLS = new Set(['Bash'])
const INPUT_KEYS = new Set(['command'])
const OUTPUT_KEYS = new Set(['stdout', 'stderr'])

// ANSI colour codes in a result must survive: transform the text between them only.
const ANSI = /(\x1b\[[0-9;?]*[ -/]*[@-~])/
export const ansiSafe = (tf: Transform): Transform => text => text.split(ANSI).map((part, i) => (i % 2 === 1 ? part : tf(part))).join('')

// A copy of value with the strings under the named keys transformed. Anything else, and the shape, is kept.
export const mapDeep = (value: unknown, keys: Set<string>, tf: Transform, hit = false): unknown => {
  if (typeof value === 'string') return hit ? tf(value) : value
  if (Array.isArray(value)) return value.map(v => mapDeep(v, keys, tf, hit))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapDeep(v, keys, tf, hit || keys.has(k))]))
  }
  return value
}

// A folded run of tool calls ("Searching for 1 pattern, running 2 shell commands…") is drawn by the engine
// and cannot be rewritten, so a group holding a shell command is drawn here instead: the same summary,
// and, while it runs, the latest call as a '⎿' line with its code in the script.
type GroupCall = { tool: string; input?: unknown }
const KINDS: Record<string, string> = { Read: 'read', Grep: 'search', Glob: 'search', LS: 'list', Bash: 'shell' }
// The mod draws a group with a shell command in it, mixed with reads and searches or not, as long as the summary
// can count every call the way the engine does. A group holding any other tool stays the engine's.
export const drawsGroup = (calls: readonly GroupCall[]): boolean =>
  calls.some(c => SCRIPT_GROUP_TOOLS.has(c.tool)) && calls.every(c => Object.hasOwn(KINDS, c.tool))
const PHRASES: Record<string, [string, string, string, string]> = {
  read: ['reading', 'read', 'file', 'files'],
  search: ['searching for', 'searched for', 'pattern', 'patterns'],
  list: ['listing', 'listed', 'directory', 'directories'],
  shell: ['running', 'ran', 'shell command', 'shell commands'],
}
export const groupSummary = (calls: readonly GroupCall[], active: boolean): string => {
  const n: Record<string, number> = {}
  for (const c of calls) n[KINDS[c.tool] ?? 'other'] = (n[KINDS[c.tool] ?? 'other'] ?? 0) + 1
  const parts = Object.entries(PHRASES)
    .filter(([k]) => n[k])
    .map(([k, [ing, ed, one, many]]) => `${active ? ing : ed} ${n[k]} ${n[k] === 1 ? one : many}`)
  if (n.other) parts.push(`${active ? 'running' : 'ran'} ${n.other} other ${n.other === 1 ? 'tool' : 'tools'}`)
  const line = parts.join(', ')
  return (line.charAt(0).toUpperCase() + line.slice(1)) + (active ? '…' : '')
}
// The lines of the latest call's preview; the group wraps them to the row and keeps PREVIEW_ROWS of them.
const PREVIEW_ROWS = 7
// Wrap lines into rows of at most width characters and keep max rows in all. If more would follow, the last row is
// the marker, `more(n)`, n being how many source lines have anything hidden (a line cut part-way counts), as the
// engine's own peek counts what it hides. Script characters are one cell wide, so characters are cells.
export const wrapRows = (
  lines: readonly string[],
  width: number,
  max: number,
  more: (n: number) => string = n => `(+${n} ${n === 1 ? 'line' : 'lines'})`,
): string[] => {
  const rows: { text: string; src: number }[] = []
  lines.forEach((line, src) => {
    const chars = [...line]
    if (chars.length === 0) rows.push({ text: '', src })
    for (let i = 0; i < chars.length; i += width) rows.push({ text: chars.slice(i, i + width).join(''), src })
  })
  if (rows.length <= max) return rows.map(r => r.text)
  const kept = rows.slice(0, max - 1)
  const hidden = new Set(rows.slice(max - 1).map(r => r.src)).size
  return [...kept.map(r => r.text), more(hidden)]
}

// While the latest call has no input yet (the next command is still streaming), keep the previous peek on screen
// instead of blinking; only a group with nothing to show yet gets the quiet ellipsis.
export const stickyPeek = (now: readonly string[], before: readonly string[]): string[] =>
  now.length ? [...now] : before.length ? [...before] : ['…']

export const groupPreview = (call: GroupCall, tf: Transform): string[] => {
  const i = (call.input ?? {}) as Record<string, unknown>
  if (call.tool === 'Bash' && typeof i.command === 'string' && i.command.trim() !== '') {
    return i.command.split('\n').map((l, n) => (n === 0 ? '$ ' : '  ') + tf(l))
  }
  if (typeof i.pattern === 'string' && i.pattern) return [i.pattern]
  if (typeof i.file_path === 'string' && i.file_path) return [i.file_path]
  if (typeof i.path === 'string' && i.path) return [i.path]
  // nothing to show: the input has not arrived yet, or has been cleared at the end. Never the tool's name, which
  // would be Latin; the group draws a quiet ellipsis instead.
  return []
}

export { byMap, quenya, tengwar, cirth, aurebesh }
export const greekify = (text: string, tf: Transform, keep: Set<string>): string => {
  const out: string[] = []
  let fence: { ch: string; len: number; hide: boolean } | null = null

  for (const line of text.split('\n')) {
    if (!fence) {
      const m = OPEN.exec(line)
      if (m) {
        const lang = (m[3] ?? '').toLowerCase()
        fence = { ch: m[2]![0]!, len: m[2]!.length, hide: !keep.has(lang) }
      }
      out.push(line) // the fence line keeps its language tag
      continue
    }
    const close = new RegExp(`^\\s*${fence.ch === '`' ? '`' : '~'}{${fence.len},}\\s*$`)
    if (close.test(line)) {
      fence = null
      out.push(line)
    } else {
      out.push(fence.hide ? tf(line) : line)
    }
  }
  return out.join('\n')
}

// 14s, then 1m 5s, like the spinner's readout
export const clockText = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

const tickAtom = atom({ plugin: 'greek-to-me', key: 'tick' } as const, 0 as Tick)

export const register: Register = (on, options) => {
  const script = String(options.script ?? 'greek')
  const keep = new Set(
    String(options.keep ?? 'markdown,md,json')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  )
  const special: Record<string, Transform> = { quenya, tengwar, cirth, aurebesh }
  const custom = script === 'custom' ? customMap(String(options.alphabet ?? '')) : null
  // a script the mod no longer has (hebrew, maya...) or an unusable custom alphabet falls back to greek, never to nothing
  const map = special[script] || script === 'off' || custom ? null : (buildMap(script) ?? buildMap('greek'))
  const tf: Transform | null = special[script] ?? (custom ? byMap(custom) : map ? byMap(map) : null)

  const traces = options.traces !== false && tf !== null
  let lastPeek: string[] = [] // the latest command's peek, kept while the next one's input arrives
  // each folded group's own clock: the group row is drawn here, so the engine's timer is not. A tick every second
  // redraws the live ones through tickAtom, and stops once none is running
  const clocks = new Map<string, { start: number; end?: number }>()
  let ticker: { cancel: () => void } | null = null
  const safe = tf ? ansiSafe(tf) : null

  // an expanded row (ctrl+o, --verbose) shows the real code; the collapsed one is in the script
  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    if (!traces || !safe || e.props.isExpanded || !SCRIPT_GROUP_TOOLS.has(e.props.tool)) return next(e)
    const p = e.props
    const props = { ...p, input: mapDeep(p.input, INPUT_KEYS, safe) }
    if (p.output !== undefined) props.output = mapDeep(p.output, OUTPUT_KEYS, safe)
    return next({ ...e, props })
  })

  on('ui.render', { component: 'ToolResult' }, ($, e, next) => {
    if (!traces || !safe || e.props.isExpanded || !SCRIPT_GROUP_TOOLS.has(e.props.tool)) return next(e)
    return next({ ...e, props: { ...e.props, output: mapDeep(e.props.output, OUTPUT_KEYS, safe) } })
  })

  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const p = e.props
    if (!traces || !safe || p.isExpanded || p.isCallsOnly === false) return next(e)
    if (!drawsGroup(p.calls)) return next(e)
    await read($, tickAtom) // the one-second tick redraws a running group
    const { Box, Text } = $.ui.resolve(e)
    const last = p.calls[p.calls.length - 1]
    const now = await $.clock.now()
    const id = String(e.requestId)
    let clock = clocks.get(id)
    if (p.isActive && !clock) {
      clock = { start: now }
      clocks.set(id, clock)
      if (clocks.size > 200) clocks.delete(clocks.keys().next().value!)
    }
    if (!p.isActive && clock && clock.end === undefined) clock.end = now
    if (p.isActive && !ticker) {
      ticker = $.clock.every(1000, async () => {
        await update($, tickAtom, (n: Tick): Tick => n + 1)
        if (![...clocks.values()].some(c => c.end === undefined)) {
          ticker?.cancel()
          ticker = null
        }
      })
    }
    const secs = clock ? ((clock.end ?? now) - clock.start) / 1000 : null
    const summary = groupSummary(p.calls, p.isActive) + (secs === null ? '' : ` (${clockText(secs)})`)
    if (!p.isActive || !last) {
      lastPeek = []
      return (
        <Box paddingTop={1}>
          <Text>{summary}</Text>
        </Box>
      )
    }
    const room = Math.max(20, (e.viewport?.columns ?? 100) - 8) // what the '  ⎿  ' mark and the margin leave
    const peek = groupPreview(last, safe)
    if (peek.length) lastPeek = peek
    const lines = wrapRows(stickyPeek(peek, lastPeek), room, PREVIEW_ROWS) // the (+N lines) count stays Latin, like the engine's
    const rows = lines.map((line, n) => (n === 0 ? '  ⎿  ' : '     ') + line)
    return (
      <Box flexDirection="column" paddingTop={1}>
        <Text>{summary}</Text>
        {rows.map((row, n) => (
          <Text key={String(n)} dimColor wrap="truncate-end">
            {row}
          </Text>
        ))}
      </Box>
    )
  })



  // code in a reply is left alone unless the replies setting is on; the tool traces are the point
  if (options.replies === true) on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    if (!tf) return next(e)
    const text = greekify(e.props.text, tf, keep)
    return next({ ...e, props: { ...e.props, text } })
  })
}
