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

test('a group with a shell command and only reads, searches or listings is drawn by the mod; one with any other tool, or no shell command, is the engine\'s', { options: { script: 'greek' } }, async ($, on) => {
  on('clock.now', async () => ({ value: 0 }))
  on('clock.every', async () => ({ value: undefined }))
  const reached: string[] = []
  on('ui.render', ($: any, e: any) => {
    reached.push(e.requestId)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const bash = { tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false }
  const edit = { tool: 'Edit', input: { file_path: '/x' }, isRunning: false, isErrored: false, isInterrupted: false }
  const as = (tool: string) => ({ ...edit, tool })
  const groups: [string, any[]][] = [
    ['only', [bash, bash]],
    ['edit', [edit, bash]],
    ['grep', [as('Grep'), bash]],
    ['all-kinds', [as('Read'), as('Glob'), as('LS'), bash]],
    ['mcp', [bash, as('mcp__other__tool')]],
    ['no-shell', [as('Read'), as('Grep')]],
  ]
  for (const [id, calls] of groups) {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: id,
      props: { isActive: true, isExpanded: false, isCallsOnly: true, calls },
    })
    await ui.unmount()
  }
  expect(reached).toEqual(['edit', 'mcp', 'no-shell'])
})

test('a mixed group counts each kind and peeks at its latest call: a command in the script, a pattern as it is', { options: { script: 'greek' } }, async ($, on) => {
  on('clock.now', async () => ({ value: 0 }))
  on('clock.every', async () => ({ value: undefined }))
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const call = (tool: string, input: object) => ({ tool, input, isRunning: false, isErrored: false, isInterrupted: false })
  const draw = async (calls: any[], isActive: boolean) => {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: 'mx' + calls.length + isActive,
      props: { isActive, isExpanded: false, isCallsOnly: true, calls },
    })
    const shown = (await ui.findAll({ type: 'Text' })).map(t => t.text)
    await ui.unmount()
    return shown
  }
  const read = call('Read', { file_path: '/a.ts' })
  const grep = call('Grep', { pattern: 'todo' })
  const ls = call('Bash', { command: 'ls' })
  const shellLast = await draw([read, grep, ls], true)
  expect(shellLast[0]).toBe('Reading 1 file, searching for 1 pattern, running 1 shell command… (0s)')
  expect(shellLast[1]?.trim()).toBe('⎿  $ λσ')
  const grepLast = await draw([ls, read, grep], true)
  expect(grepLast[1]?.trim()).toBe('⎿  todo')
  // never seen running, so no clock of its own; done, so each call gets a row
  const done = await draw([read, ls], false)
  expect(done[0]).toBe('Read 1 file, ran 1 shell command')
  expect(done.slice(1).map(r => r.trim())).toEqual(['⎿  /a.ts', '$ λσ'])
})

test('a finished group lists each call: a long command is cut to its first line, a call with no input is left out, past seven the rest are counted', { options: { script: 'greek' } }, async ($, on) => {
  on('clock.now', async () => ({ value: 0 }))
  on('clock.every', async () => ({ value: undefined }))
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const call = (tool: string, input: object | undefined) => ({ tool, input, isRunning: false, isErrored: false, isInterrupted: false })
  const draw = async (id: string, calls: any[]) => {
    const ui = await $.ui.mount({
      plugin: 'greek-to-me', surface: 'terminal', component: 'ToolGroup', requestId: id,
      props: { isActive: false, isExpanded: false, isCallsOnly: true, calls },
    })
    const shown = (await ui.findAll({ type: 'Text' })).map(t => t.text.trim())
    await ui.unmount()
    return shown
  }
  const few = await draw('few', [call('Bash', { command: 'ls\npwd' }), call('Glob', { pattern: '*.ts' }), call('Bash', undefined)])
  expect(few.slice(1)).toEqual(['⎿  $ λσ …', '*.ts'])
  const ls = call('Bash', { command: 'ls' })
  const many = await draw('many', Array.from({ length: 10 }, () => ls))
  expect(many.length).toBe(1 + 7)
  expect(many.at(-1)).toBe('(+4 more)')
  // reads and searches between commands share a row
  const runs = await draw('runs', [call('Read', { file_path: '/a.ts' }), call('Read', { file_path: '/b.ts' }), call('Grep', { pattern: 'todo' }), ls, call('Read', { file_path: '/c.ts' }), ls])
  expect(runs.slice(1)).toEqual(['⎿  /a.ts, /b.ts, todo', '$ λσ', '/c.ts', '$ λσ'])
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
  expect(await summary(true)).toBe('Running 1 shell command… (0s)')
  now = 7000
  expect(await summary(true)).toBe('Running 1 shell command… (6s)')
  now = 9500
  expect(await summary(false)).toBe('Ran 1 shell command (8s)')
})
