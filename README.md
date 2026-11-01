# greek-to-me

It's all Greek to me. A mod for Claude Code that draws the code in tool-call traces in another script instead of Latin: Greek by default, or runic, braille, Klingon pIqaD, Quenya or Tengwar, Hebrew, katakana, Malayalam, Arabic, Egyptian hieroglyphs, Maya glyphs or Aurebesh.

The traces are the collapsed peeks at what a tool is doing: the command in a `Bash(...)` row, file content and edit strings, and the output. A folded run of calls that includes a shell command ("Running 2 shell commands…") is drawn by the mod too, with the latest command beneath it, wrapped to up to five rows. Tool names and file paths stay readable and ANSI colours are kept. Expand a row (ctrl+o) and you get the real code. Code in the model's replies is left alone unless you turn on `replies`. Only the drawing changes; the stored message is untouched, so what the model read and what is saved never change.

## Install

```
/plugin install greek-to-me --marketplace SyntaxAsSpiral/greek-to-me
```

Then open `/config` and set the `script` row of greek-to-me. `traces` (on by default) turns the tool-trace rewriting off. `replies` (off by default) also draws fenced code in the model's replies, and `keep` lists the fence languages left alone when it does. The change applies to the next reply drawn.

## Scripts and fonts

| `script` | Draws | Font it needs |
|---|---|---|
| `greek` | letter-for-letter Greek | any with Greek |
| `runic` | Elder Futhark | any with Runic (U+16A0) |
| `braille` | Braille | any with Braille |
| `hebrew` | one Hebrew letter per Latin one (some share a sign); the terminal does not reorder it, so it runs left to right | any with Hebrew |
| `malayalam` | Malayalam letters and vowels, one per Latin letter, no conjuncts so each stays one cell | any with Malayalam, such as FreeSans |
| `arabic` | Arabic letters, one per Latin letter, in their separate forms; a terminal neither joins them nor runs them right to left | any with Arabic, such as DejaVu Sans |
| `katakana` | half-width katakana, one cell wide so code keeps its columns | any with CJK, such as Noto Sans CJK |
| `klingon` | pIqaD, CSUR U+F8D0 | Unifont CSUR |
| `quenya` | Tengwar written as Quenya is: consonants as letters, each vowel a tehta on the *next* consonant (or a carrier) | `TengwarPUA.otf`, built below |
| `tengwar` | the same Tengwar, written the way English and Sindarin often are: each vowel a tehta on the consonant *before* it (or a carrier) | `TengwarPUA.otf`, built below |
| `hiero` | the Egyptian uniliteral signs | Noto Sans Egyptian Hieroglyphs |
| `maya` | one fixed glyph per character, from Maya.otf (U+F6200..F6847); not real Maya writing | Maya.otf |
| `aurebesh` | Aurebesh | `AurebeshPUA.otf`, built below |
| `off` | nothing | |

Aurebesh has no Unicode block, and Tengwar's private-use home (U+E000) is claimed by Nerd Font icons, so both are drawn from fonts that put the glyphs in plane 15 (U+F5000, U+F5100), where nothing else lives. The mod emits those codepoints, and your terminal falls back to the font that has them.

- **Tengwar** ships with the mod: `fonts/TengwarPUA.otf` (SIL OFL, from Unifont; see `fonts/NOTICE.md`). It also carries the Klingon glyphs. Copy it to `~/.local/share/fonts/` and run `fc-cache -f`, then restart your terminal.
- **Aurebesh** and **Maya** are not open fonts, so the mod does not ship them. Use your own copies: for Maya, UFAS's `Maya.otf` (free for personal use only); for Aurebesh, build the mapped font from an `Aurebesh.otf` you have the right to use:

```
nix shell nixpkgs#python3Packages.fonttools -c \
  python3 scripts/build-fonts.py /path/to/Aurebesh.otf /path/to/unifont_csur.otf ~/.local/share/fonts
fc-cache -f
```

If you display a session remotely, install the fonts on the machine whose terminal draws it, not on the host that runs Claude Code.

## Try it

Ask for any code (`show me a python hello world`) and read the block. Switch `script` in `/config` to step through each. A box instead of a glyph means the terminal has no font for that script; check with `fc-list ":charset=f5100"` (swap the codepoint).

## Test

```
claude plugin test .
claude plugin validate .
```
