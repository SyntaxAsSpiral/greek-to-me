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
