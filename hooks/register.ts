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
  // Egyptian uniliteral signs (Noto Sans Egyptian Hieroglyphs)
  hiero: { lower: '𓄿𓃀𓎡𓂧𓇋𓆑𓎼𓉔𓇋𓆓𓎡𓃭𓅓𓈖𓂝𓊪𓈎𓂋𓋴𓏏𓅱𓆑𓅱𓐍𓇌𓊃' },
  // pIqaD, ConScript Unicode Registry U+F8D0..
  klingon: {
    lower: '',
    digits: '',
  },
}

const buildMap = (name: string): Map<string, string> | null => {
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

// Maya.otf (private use U+F6200-F6847, 1608 glyphs) is no alphabet: every distinct
// character gets one fixed glyph, so a repeated letter is a repeated sign.
const MAYA_LO = 0xf6200
const MAYA_N = 1608
const maya: Transform = line =>
  [...line]
    .map(c => {
      if (!/[A-Za-z0-9]/.test(c)) return c
      const k = c.toLowerCase().codePointAt(0)!
      return String.fromCodePoint(MAYA_LO + ((k * 2654435761) >>> 0) % MAYA_N)
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

export { byMap, quenya, maya, aurebesh }
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
  const special: Record<string, Transform> = { quenya, maya, aurebesh }
  const map = special[script] || script === 'off' ? null : buildMap(script)
  const tf: Transform | null = special[script] ?? (map ? byMap(map) : null)

  const traces = options.traces !== false && tf !== null
  const safe = tf ? ansiSafe(tf) : null

  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    if (!traces || !safe) return next(e)
    const p = e.props
    const props = { ...p, input: mapDeep(p.input, INPUT_KEYS, safe) }
    if (p.output !== undefined) props.output = mapDeep(p.output, OUTPUT_KEYS, safe)
    return next({ ...e, props })
  })

  on('ui.render', { component: 'ToolResult' }, ($, e, next) => {
    if (!traces || !safe) return next(e)
    return next({ ...e, props: { ...e.props, output: mapDeep(e.props.output, OUTPUT_KEYS, safe) } })
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    if (!tf) return next(e)
    const text = greekify(e.props.text, tf, keep)
    return next({ ...e, props: { ...e.props, text } })
  })
}
