# Privacy

greek-to-me does not collect, store or send any data about you.

- It changes only how text is drawn: it rewrites the code in a tool call and in its result on the way to the screen, and, only if you turn on `replies`, the code in a reply. The stored message and what the model reads are never touched.
- It reads five settings of its own, `script`, `alphabet`, `keep`, `traces` and `replies`. It reads no credentials and no other settings.
- To say which key sends a running call to the background, it reads the `HOME` environment variable and, read-only, `~/.claude/keybindings.json` if there is one, looking for the `task:background` binding. It reads nothing else from that file, and never writes it. No other environment variable or file is read.
- It times each folded group of shell commands in memory, to show how long it ran. Nothing is stored.
- It makes no network requests, writes no files, and starts no processes.
- It has no analytics or telemetry.

## What code runs

All of the plugin's code is in `hooks/register.tsx`, which `hooks/hooks.json` declares as a hooks module. It runs inside Claude Code's mod runtime and uses only the rendering hooks (`ui.render` on assistant messages, tool rows, tool results and folded tool groups) and the engine's drawing helpers. It declares no MCP servers and runs no shell commands.

`scripts/build-fonts.py` is a helper you run yourself, by hand, to build two fonts from font files you supply. The plugin never runs it.
