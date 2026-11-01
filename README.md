# greek-to-me

It's all Greek to me. A mod for Claude Code that draws the code blocks in a reply in another script instead of Latin: Greek by default, or runic, braille, Klingon pIqaD, Quenya (Tengwar), Egyptian hieroglyphs, Maya glyphs or Aurebesh. Fences tagged `markdown`, `md` or `json` stay readable. The code in tool calls and their results is drawn the same way: commands, file content, edit strings and output, with tool names and file paths left readable and ANSI colours kept. Only the drawing changes; the stored message is untouched, so ctrl+o shows the real code.

## Install

```
/plugin install greek-to-me --marketplace SyntaxAsSpiral/greek-to-me
```

Then open `/config` and set the `script` row of greek-to-me. `keep` lists the fence languages left alone. `traces` (on by default) turns the tool-call rewriting off. The change applies to the next reply drawn.

## Scripts and fonts

| `script` | Draws | Font it needs |
|---|---|---|
| `greek` | letter-for-letter Greek | any with Greek |
| `runic` | Elder Futhark | any with Runic (U+16A0) |
| `braille` | Braille | any with Braille |
| `klingon` | pIqaD, CSUR U+F8D0 | Unifont CSUR |
| `quenya` | Tengwar: consonants as letters, each vowel a tehta on the next consonant (or a carrier) | `TengwarPUA.otf`, built below |
| `hiero` | the Egyptian uniliteral signs | Noto Sans Egyptian Hieroglyphs |
| `maya` | one fixed glyph per character, from Maya.otf (U+F6200..F6847); not real Maya writing | Maya.otf |
| `aurebesh` | Aurebesh | `AurebeshPUA.otf`, built below |
| `off` | nothing | |

Aurebesh has no Unicode block, and Tengwar's private-use home (U+E000) is claimed by Nerd Font icons. The two fonts below put those glyphs in plane 15 (U+F5000, U+F5100) where nothing else lives. The mod emits those codepoints, and your terminal falls back to the font that has them.

```
nix shell nixpkgs#python3Packages.fonttools -c \
  python3 scripts/build-fonts.py /path/to/Aurebesh.otf /path/to/unifont_csur.otf ~/.local/share/fonts
fc-cache -f
```

The built fonts are not in this repository: Aurebesh.otf is yours to supply and Unifont is its own project.

## Try it

Ask for any code (`show me a python hello world`) and read the block. Switch `script` in `/config` to step through each. A box instead of a glyph means the terminal has no font for that script; check with `fc-list ":charset=f5100"` (swap the codepoint).

## Test

```
claude plugin test .
claude plugin validate .
```
