import { expect, test } from 'claude-code/testing'
import { capLines } from './register'

test('a group holding a shell command is drawn with its command in the script', { options: { script: 'greek' } }, async ($, on) => {
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: 'g1',
    props: {
      isActive: true, isExpanded: false, isCallsOnly: true,
      calls: [
        { tool: 'Grep', input: { pattern: 'x' }, isRunning: false, isErrored: false, isInterrupted: false },
        { tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false },
      ],
    },
  })
  expect(await ui.find({ type: 'Text' })).toBeTruthy()
  await ui.unmount()
})

test('a collapsed tool row is in the script, an expanded one is the real code', { options: { script: 'greek' } }, async ($, on) => {
  const seen: Record<string, unknown> = {}
  on('ui.render', ($: any, e: any) => {
    seen[e.props.isExpanded ? 'expanded' : 'collapsed'] = e.props.input?.command
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  for (const isExpanded of [false, true]) {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolUse', requestId: 'u' + isExpanded,
      props: { tool_use_id: 'u' + isExpanded, tool: 'Bash', input: { command: 'ls -la', description: 'list' }, isRunning: false, isErrored: false, isInterrupted: false, isExpanded },
    })
    await ui.unmount()
  }
  expect(seen.collapsed).toBe('λσ -λα')
  expect(seen.expanded).toBe('ls -la')
})

test('collapsed Write, Edit and NotebookEdit rows stay in Latin, a collapsed Bash row does not', { options: { script: 'greek' } }, async ($, on) => {
  const seen: Record<string, unknown> = {}
  on('ui.render', ($: any, e: any) => {
    seen[e.props.tool] = e.props.input?.content ?? e.props.input?.new_string ?? e.props.input?.new_source ?? e.props.input?.command
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const rows: [string, Record<string, string>][] = [
    ['Write', { file_path: '/x', content: 'ls -la' }],
    ['Edit', { file_path: '/x', old_string: 'a', new_string: 'ls -la' }],
    ['NotebookEdit', { notebook_path: '/x.ipynb', new_source: 'ls -la' }],
    ['Bash', { command: 'ls -la' }],
  ]
  for (const [tool, input] of rows) {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolUse', requestId: 'w' + tool,
      props: { tool_use_id: 'w' + tool, tool, input, isRunning: false, isErrored: false, isInterrupted: false, isExpanded: false },
    })
    await ui.unmount()
  }
  expect(seen.Write).toBe('ls -la')
  expect(seen.Edit).toBe('ls -la')
  expect(seen.NotebookEdit).toBe('ls -la')
  expect(seen.Bash).toBe('λσ -λα')
})

test('a group of shell commands is drawn by the mod, a mixed group is left to the engine', { options: { script: 'greek' } }, async ($, on) => {
  const reached: string[] = []
  on('ui.render', ($: any, e: any) => {
    reached.push(e.requestId)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const bash = { tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false }
  const edit = { tool: 'Edit', input: { file_path: '/x' }, isRunning: false, isErrored: false, isInterrupted: false }
  const groups: [string, any[]][] = [['only', [bash, bash]], ['mixed', [edit, bash]], ['grep', [{ ...edit, tool: 'Grep' }, bash]]]
  for (const [id, calls] of groups) {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: id,
      props: { isActive: true, isExpanded: false, isCallsOnly: true, calls },
    })
    await ui.unmount()
  }
  expect(reached).toEqual(['mixed', 'grep'])
})

test('a group whose latest call has no input yet draws a quiet ellipsis, not the tool name', { options: { script: 'greek' } }, async ($, on) => {
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: 'g2',
    props: {
      isActive: true, isExpanded: false, isCallsOnly: true,
      calls: [{ tool: 'Bash', input: undefined, isRunning: true, isErrored: false, isInterrupted: false }],
    },
  })
  expect(await ui.find({ type: 'Text' })).toBeTruthy()
  await ui.unmount()
})

test('capLines keeps seven rows and says how many it cut', () => {
  expect(capLines('a\nb\nc')).toBe('a\nb\nc')
  expect(capLines('1\n2\n3\n4\n5\n6\n7\n')).toBe('1\n2\n3\n4\n5\n6\n7\n')
  expect(capLines('1\n2\n3\n4\n5\n6\n7\n8\n9')).toBe('1\n2\n3\n4\n5\n6\n7\n… +2 lines')
})

test('a long collapsed Write row is cut to seven rows, in Latin; expanded it is whole', { options: { script: 'greek' } }, async ($, on) => {
  const seen: Record<string, string> = {}
  on('ui.render', ($: any, e: any) => {
    seen[e.props.isExpanded ? 'expanded' : 'collapsed'] = e.props.input?.content
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const content = Array.from({ length: 12 }, (_, i) => 'line ' + (i + 1)).join('\n')
  for (const isExpanded of [false, true]) {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolUse', requestId: 'cap' + isExpanded,
      props: { tool_use_id: 'cap' + isExpanded, tool: 'Write', input: { file_path: '/x', content }, isRunning: false, isErrored: false, isInterrupted: false, isExpanded },
    })
    await ui.unmount()
  }
  expect(seen.collapsed).toBe('line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\n… +5 lines')
  expect(seen.expanded).toBe(content)
})

// what a collapsed Bash row's command reaches the engine as, under the given options
const drawnCommand = async ($: any, on: any): Promise<unknown> => {
  let seen: unknown
  on('ui.render', ($: any, e: any) => {
    seen = e.props.input?.command
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'greek-to-me', surface: 'terminal', component: 'ToolUse', requestId: 'fb',
    props: { tool_use_id: 'fb', tool: 'Bash', input: { command: 'ls' }, isRunning: false, isErrored: false, isInterrupted: false, isExpanded: false },
  })
  await ui.unmount()
  return seen
}

test('a script the mod no longer has falls back to greek', { options: { script: 'hebrew' } }, async ($, on) => {
  expect(await drawnCommand($, on)).toBe('λσ')
})

test('a custom alphabet of the wrong length falls back to greek', { options: { script: 'custom', alphabet: 'too short' } }, async ($, on) => {
  expect(await drawnCommand($, on)).toBe('λσ')
})

test('a good custom alphabet is used', { options: { script: 'custom', alphabet: 'zyxwvutsrqponmlkjihgfedcba' } }, async ($, on) => {
  expect(await drawnCommand($, on)).toBe('oh') // l is o, s is h
})
