import { test, expect } from 'claude-code/testing'
import { greekify, byMap, quenya, maya, aurebesh } from './register'

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
