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

test('only a collapsed Bash row is in the script; Write, Edit, NotebookEdit, Monitor and any other tool stay in Latin', { options: { script: 'greek' } }, async ($, on) => {
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
    ['Monitor', { command: 'ls -la', description: 'd' }],
    ['mcp__other__tool', { content: 'ls -la' }],
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
  expect(seen.Monitor).toBe('ls -la')
  expect(seen.mcp__other__tool).toBe('ls -la')
  expect(seen.Bash).toBe('λσ -λα')
})

test('only a group of shell commands is drawn by the mod; any other call in the group leaves it to the engine', { options: { script: 'greek' } }, async ($, on) => {
  on('clock.now', async () => ({ value: 0 }))
  on('clock.every', async () => ({ value: undefined }))
  const reached: string[] = []
  on('ui.render', ($: any, e: any) => {
    reached.push(e.requestId)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const bash = { tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false }
  const other = (tool: string) => ({ tool, input: { file_path: '/x' }, isRunning: false, isErrored: false, isInterrupted: false })
  const groups: [string, any[]][] = [
    ['only', [bash, bash]],
    ['edit', [other('Edit'), bash]],
    ['read', [other('Read'), bash]],
    ['write', [other('Write'), bash, other('Read')]],
    ['mcp', [bash, other('mcp__other__tool')]],
    ['no-shell', [other('Read'), other('Grep')]],
  ]
  for (const [id, calls] of groups) {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: id,
      props: { isActive: true, isExpanded: false, isCallsOnly: true, calls },
    })
    await ui.unmount()
  }
  expect(reached).toEqual(['edit', 'read', 'write', 'mcp', 'no-shell'])
})

test('a running group shows its counts, then after two seconds the latest command\'s description in -ing form; done, the counts again', { options: { script: 'greek' } }, async ($, on) => {
  let now = 0
  on('clock.now', async () => ({ value: now }))
  on('clock.every', async () => ({ value: undefined }))
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const bash = (description: string | undefined, isRunning: boolean) => ({ tool: 'Bash', input: { command: 'ls', description }, isRunning, isErrored: false, isInterrupted: false })
  const draw = async (id: string, calls: any[], isActive: boolean) => {
    const ui = await $.ui.mount({ plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: id, props: { isActive, isExpanded: false, isCallsOnly: true, calls } })
    const shown = (await ui.findAll({ type: 'Text' })).map(t => t.text)
    await ui.unmount()
    return shown
  }
  const calls = [bash('List the files', false), bash('Read screen for the summary', true)]
  expect((await draw('ph', calls, true))[0]).toBe('● Running 2 shell commands… (0s)') // the engine's gutter: a dot while it runs
  now = 2500
  const later = await draw('ph', calls, true)
  expect(later[0]).toBe('● Reading screen for the summary') // 2.5 s: an even second, the dot is on
  expect(later[1]?.trim()).toBe('⎿  $ λσ') // the peek stays, in the script
  now = 4000
  expect((await draw('ph', calls, false))[0]).toBe('  Ran 2 shell commands (4s)') // done: two spaces
  // no description: the counts stay
  now = 0
  await draw('nd', [bash(undefined, true)], true)
  now = 3000
  expect((await draw('nd', [bash(undefined, true)], true))[0]).toBe('  Running 1 shell command… (3s)') // 3 s: an odd second, the dot blinks off
})

test('a group whose latest call has no input yet draws a quiet ellipsis, not the tool name', { options: { script: 'greek' } }, async ($, on) => {
  on('clock.now', async () => ({ value: 0 }))
  on('clock.every', async () => ({ value: undefined }))
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

test('a running group whose command is longer than the preview ends in a (+N lines) count, in Latin', { options: { script: 'greek' } }, async ($, on) => {
  on('clock.now', async () => ({ value: 0 }))
  on('clock.every', async () => ({ value: undefined }))
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const command = Array.from({ length: 12 }, (_, i) => `echo ${i + 1}`).join('\n')
  const ui = await $.ui.mount({
    plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: 'g3',
    props: {
      isActive: true, isExpanded: false, isCallsOnly: true,
      calls: [{ tool: 'Bash', input: { command }, isRunning: true, isErrored: false, isInterrupted: false }],
    },
  })
  const shown = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  // 7 rows kept: the marker takes the last, so 6 lines show and 6 are counted; the count is Latin, not in the script
  expect(shown.at(-1)?.trim()).toBe('(+6 lines)')
  await ui.unmount()
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

test('a shell group carries its own clock while it runs and when it is done', { options: { script: 'greek' } }, async ($, on) => {
  let now = 1000
  on('clock.now', async () => ({ value: now }))
  on('clock.every', async () => ({ value: undefined }))
  const props = (isActive: boolean) => ({
    isActive, isExpanded: false, isCallsOnly: true,
    calls: [{ tool: 'Bash', input: { command: 'ls' }, isRunning: isActive, isErrored: false, isInterrupted: false }],
  })
  const summary = async (active: boolean) => {
    const ui = await $.ui.mount({ plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: 'clk', props: props(active) })
    const text = (await ui.find({ type: 'Text' }))?.text
    await ui.unmount()
    return text
  }
  expect(await summary(true)).toBe('  Running 1 shell command… (0s)') // 1 s on the clock: odd, the dot blinks off
  now = 7000
  expect(await summary(true)).toBe('  Running 1 shell command… (6s)') // 7 s on the clock: odd, off
  now = 9500
  expect(await summary(false)).toBe('  Ran 1 shell command (8s)')
})

test("a command's output is in the script, its error output stays readable", { options: { script: 'greek' } }, async ($, on) => {
  let seen: any
  on('ui.render', ($: any, e: any) => {
    seen = e.props.output
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'greek-to-me', surface: 'terminal', component: 'ToolResult', requestId: 'err',
    props: { tool_use_id: 'err', tool: 'Bash', output: { stdout: 'ls ok', stderr: 'ls: cannot access x\nShell cwd was reset to /tmp' }, isErrored: false, isExpanded: false },
  })
  await ui.unmount()
  expect(seen.stdout).toBe('λσ οκ')
  expect(seen.stderr).toBe('ls: cannot access x\nShell cwd was reset to /tmp')
})
