import type { Register } from 'claude-code'

const LATIN = 'abcdefghijklmnopqrstuvwxyz'

const alphabets: Record<string, { lower: string; upper?: string; digits?: string }> = {
  // a b c d e f g h i j k l m n o p q r s t u v w x y z
  greek: {
    lower: 'αβκδεφγηιξκλμνοπθρστυϝωχψζ',
    upper: 'ΑΒΚΔΕΦΓΗΙΞΚΛΜΝΟΠΘΡΣΤΥϜΩΧΨΖ',
  },
  runic: { lower: 'ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᚲᚱᛊᛏᚢᚢᚹᛉᛃᛉ' },
  braille: { lower: '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵' },
  // one Hebrew letter for each Latin one, so some letters share a sign; a terminal does not reorder it, so it still reads left to right
  hebrew: { lower: 'אבכדעפגהישקלמנופקרסתטווצחז' },
  // half-width katakana: one cell wide, so code keeps its columns (full-width kana would take two)
  katakana: { lower: 'ｱﾊｾﾄｴﾌｹﾍｲｼｶﾘﾏﾅｵﾎｸﾗｻﾀｳﾋﾜｽﾔｿ' },
  // Malayalam base letters and vowels only, one sign for each Latin letter and no conjuncts, so each stays one cell
  malayalam: { lower: 'അബചദഎഫഗഹഇജകലമനഒപഖരസതഉവഴഷയശ' },
  // Arabic letters in their separate forms: a terminal neither joins them nor runs them right to left
  arabic: { lower: 'ابثدعفغهيجكلمنوضقرستظزصحطذ' },
  // Egyptian uniliteral signs (Noto Sans Egyptian Hieroglyphs)
  hiero: { lower: '𓄿𓃀𓎡𓂧𓇋𓆑𓎼𓉔𓇋𓆓𓎡𓃭𓅓𓈖𓂝𓊪𓈎𓂋𓋴𓏏𓅱𓆑𓅱𓐍𓇌𓊃' },
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

// Maya.otf (private use U+F6200-F6847) is no alphabet, and a third of its glyphs are zero-width marks that
// only overlay a main sign, which a terminal draws as a blank cell. So only the main signs that fit one cell
// are used (392 of 1608: advance 1000 to 1300 of 2048, ink inside it), and every distinct character gets one
// fixed sign, so a repeated letter is a repeated sign.
const MAYA_SIGNS: number[] = 'f656f-f6587,f6589-f658e,f6590-f659a,f659c-f65a2,f65a4-f65a6,f65a8-f65af,f65b2-f65c8,f65ca-f65ce,f65d0-f65d7,f65d9-f65e3,f65e6-f65f2,f65f4-f65fb,f65fd-f6600,f6603-f660a,f660c-f661a,f661c-f6620,f6622-f662b,f662d-f662f,f6632-f6636,f6638-f663a,f663c-f6643,f6647,f6649-f664a,f664c-f6651,f6653-f6655,f6657-f6658,f665c,f665f,f6661,f6664-f6671,f6675,f6678-f6679,f667b,f6682-f6683,f6686-f6687,f6689-f668c,f668f-f6690,f6696,f6698,f66a0,f66a4,f66a8,f66aa-f66ab,f66ad-f66ae,f66b5,f66b9-f66ba,f66be,f66c0,f66c4-f66c5,f66c8-f66c9,f66cf,f66d1,f66d3-f66d4,f66d7,f66da-f66db,f66e0,f66e4,f66e7,f66f3-f66f5,f66f8,f66fc,f6706,f670a-f670b,f670d-f670e,f6710,f6713,f6715,f6719-f671a,f671f,f6722,f6728,f672a,f6730-f6733,f6738,f673b,f673f,f6743,f6745-f6748,f674b-f674c,f674e-f6750,f6752,f6757-f6758,f675b-f675c,f6761,f6763,f6767-f6768,f676e-f676f,f6772-f6774,f6778-f6779,f677b-f677c,f677e,f6780,f6788-f6789,f678b,f678d,f6792-f6793,f6795-f6796,f679c,f679e-f679f,f67a3,f67a6,f67ab,f67ae,f67b5-f67b6,f67b9,f67c1,f67c3-f67c4,f67c6-f67c7,f67ca-f67cc,f67d0-f67f0,f67f2-f67f5,f67f9-f67fa,f67fe,f6800-f6801,f6804,f6806,f680a,f680e-f680f,f6816'
  .split(',')
  .flatMap(r => {
    const [lo = r, hi = r] = r.split('-')
    return Array.from({ length: parseInt(hi, 16) - parseInt(lo, 16) + 1 }, (_, i) => parseInt(lo, 16) + i)
  })
const maya: Transform = line =>
  [...line]
    .map(c => {
      if (!/[A-Za-z0-9]/.test(c)) return c
      const k = c.toLowerCase().codePointAt(0)!
      return String.fromCodePoint(MAYA_SIGNS[((k * 2654435761) >>> 0) % MAYA_SIGNS.length]!)
    })
    .join('')

// Aurebesh keeps its glyphs at plain ASCII, so assets/AurebeshPUA.otf (Aurebesh.otf with
// every printable ASCII glyph also at U+F5000 + ascii) is what makes this mode drawable.
const aurebesh: Transform = line =>
  [...line].map(c => (/[A-Za-z0-9]/.test(c) ? String.fromCodePoint(0xf5000 + c.charCodeAt(0)) : c)).join('')

// Quenya in Tengwar (CSUR): consonants are letters; a vowel is a tehta drawn on the
// NEXT consonant, or on a short carrier when no consonant follows it.
const Q_CONS: [string, number][] = [
  ['qu', 0xe003], ['th', 0xe008], ['ng', 0xe006], ['nd', 0xe004], ['mb', 0xe005],
  ['ch', 0xe00a], ['hw', 0xe00b],
  ['t', 0xe000], ['p', 0xe001], ['c', 0xe002], ['k', 0xe002], ['q', 0xe003],
  ['d', 0xe004], ['b', 0xe005], ['g', 0xe006], ['f', 0xe009], ['n', 0xe010],
  ['m', 0xe011], ['v', 0xe015], ['w', 0xe017], ['s', 0xe020], ['z', 0xe021],
  ['h', 0xe024], ['y', 0xe026], ['j', 0xe026], ['r', 0xe030], ['l', 0xe032],
]
const Q_VOWELS: Record<string, number> = { a: 0xe040, e: 0xe046, i: 0xe044, o: 0xe04a, u: 0xe04c }
const CARRIER = 0xe02c

// Tengwar sits at CSUR U+E000, which Nerd Fonts claim for icons, so it is drawn from
// assets/TengwarPUA.otf: the same glyphs moved to U+F5100 + (cp - U+E000).
const T = (...cps: number[]): string => String.fromCodePoint(...cps.map(c => c - 0xe000 + 0xf5100))

const quenya: Transform = line => {
  const out: string[] = []
  const s = line.toLowerCase()
  let pending: string | null = null
  const flush = () => {
    if (pending) out.push(T(CARRIER, Q_VOWELS[pending]!))
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
      out.push(T(0xe002))
      if (pending) out.push(T(Q_VOWELS[pending]!))
      pending = null
      out.push(T(0xe020))
      i += 1
      continue
    }
    const hit = Q_CONS.find(([k]) => s.startsWith(k, i))
    if (hit) {
      out.push(T(hit[1]))
      if (pending) out.push(T(Q_VOWELS[pending]!))
      pending = null
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
  let canAttach = false // the last thing drawn is a consonant that has no tehta yet
  for (let i = 0; i < s.length; ) {
    const c = s[i]!
    if (Q_VOWELS[c]) {
      out.push(canAttach ? T(Q_VOWELS[c]!) : T(CARRIER, Q_VOWELS[c]!))
      canAttach = false
      i += 1
      continue
    }
    if (c === 'x') {
      out.push(T(0xe002, 0xe020))
      canAttach = true
      i += 1
      continue
    }
    const hit = Q_CONS.find(([k]) => s.startsWith(k, i))
    if (hit) {
      out.push(T(hit[1]))
      canAttach = true
      i += hit[0].length
      continue
    }
    canAttach = false
    out.push(line[i]!)
    i += 1
  }
  return out.join('')
}

const OPEN = /^(\s*)(`{3,}|~{3,})\s*([^\s`]*)/

// Rewrite fenced blocks only; an unclosed fence (streaming) runs to the end.
// Tool traces: only the fields that carry code are rewritten; names and paths stay readable.
const INPUT_KEYS = new Set(['command', 'content', 'old_string', 'new_string', 'new_source', 'code', 'script'])
const OUTPUT_KEYS = new Set(['stdout', 'stderr', 'content', 'oldString', 'newString', 'old_string', 'new_string', 'lines', 'new_source'])

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
const PREVIEW_ROWS = 5
// Wrap lines into rows of at most width characters, and keep the first max rows; if more would follow, the
// last kept row ends in an ellipsis. Script characters are one cell wide, so characters are cells.
export const wrapRows = (lines: readonly string[], width: number, max: number): string[] => {
  const rows: string[] = []
  for (const line of lines) {
    const chars = [...line]
    if (chars.length === 0) rows.push('')
    for (let i = 0; i < chars.length; i += width) rows.push(chars.slice(i, i + width).join(''))
  }
  if (rows.length <= max) return rows
  const kept = rows.slice(0, max)
  kept[max - 1] = [...kept[max - 1]!].slice(0, Math.max(0, width - 2)).join('') + ' …'
  return kept
}

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

export { byMap, quenya, tengwar, maya, aurebesh }
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

export const register: Register = (on, options) => {
  const script = String(options.script ?? 'greek')
  const keep = new Set(
    String(options.keep ?? 'markdown,md,json')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  )
  const special: Record<string, Transform> = { quenya, tengwar, maya, aurebesh }
  const map = special[script] || script === 'off' ? null : buildMap(script)
  const tf: Transform | null = special[script] ?? (map ? byMap(map) : null)

  const traces = options.traces !== false && tf !== null
  const safe = tf ? ansiSafe(tf) : null

  // an expanded row (ctrl+o, --verbose) shows the real code; the collapsed one is in the script
  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    if (!traces || !safe || e.props.isExpanded) return next(e)
    const p = e.props
    const props = { ...p, input: mapDeep(p.input, INPUT_KEYS, safe) }
    if (p.output !== undefined) props.output = mapDeep(p.output, OUTPUT_KEYS, safe)
    return next({ ...e, props })
  })

  on('ui.render', { component: 'ToolResult' }, ($, e, next) => {
    if (!traces || !safe || e.props.isExpanded) return next(e)
    return next({ ...e, props: { ...e.props, output: mapDeep(e.props.output, OUTPUT_KEYS, safe) } })
  })

  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => {
    const p = e.props
    if (!traces || !safe || p.isExpanded || p.isCallsOnly === false) return next(e)
    if (!p.calls.some(c => c.tool === 'Bash')) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const last = p.calls[p.calls.length - 1]
    const summary = groupSummary(p.calls, p.isActive)
    if (!p.isActive || !last) return <Text>{summary}</Text>
    const room = Math.max(20, (e.viewport?.columns ?? 100) - 8) // what the '  ⎿  ' mark and the margin leave
    const peek = groupPreview(last, safe)
    const lines = wrapRows(peek.length ? peek : ['…'], room, PREVIEW_ROWS)
    return (
      <Box flexDirection="column">
        <Text>{summary}</Text>
        {lines.map((line, n) => (
          <Text key={String(n)} dimColor wrap="truncate-end">
            {(n === 0 ? '  ⎿  ' : '     ') + line}
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
