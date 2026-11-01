import { expect, test } from 'claude-code/testing'

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

test('collapsed Write and Edit rows stay in Latin, a collapsed Bash row does not', { options: { script: 'greek' } }, async ($, on) => {
  const seen: Record<string, unknown> = {}
  on('ui.render', ($: any, e: any) => {
    seen[e.props.tool] = e.props.input?.content ?? e.props.input?.new_string ?? e.props.input?.command
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const rows: [string, Record<string, string>][] = [
    ['Write', { file_path: '/x', content: 'ls -la' }],
    ['Edit', { file_path: '/x', old_string: 'a', new_string: 'ls -la' }],
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
  expect(seen.Bash).toBe('λσ -λα')
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
