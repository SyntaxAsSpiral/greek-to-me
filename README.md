# greek-to-me

It's all Greek to me. A mod for Claude Code that draws the code in tool-call traces in another script instead of Latin: Greek by default, Tolkien's Quenya, Tengwar or Cirth, Klingon pIqaD, Aurebesh, a grimdark script of its own, or an alphabet you supply.

The traces are the collapsed peeks at what a tool is doing: the command in a `Bash(...)` row, and the output. A folded run of calls that is all shell commands ("Running 2 shell commands…") is drawn by the mod too, with the latest command beneath it, wrapped to up to five rows. Tool names and file paths stay readable and ANSI colours are kept. Expand a row (ctrl+o) and you get the real code. Code in the model's replies is left alone unless you turn on `replies`. Only the drawing changes; the stored message is untouched, so what the model read and what is saved never change.

## Legibility

This makes collapsed shell commands unreadable on purpose: it is a wink, not a security feature. Nothing is hidden. The real text is one ctrl+o away, and the permission prompt shows the real command in Latin. The rows of the tools that change files (`Write`, `Edit`, `NotebookEdit`) stay in Latin, since what goes into a file is worth reading as it is. Set `script` to `off` if you would rather read everything at a glance.

## Install

```
/plugin install greek-to-me --marketplace SyntaxAsSpiral/greek-to-me
```

Then open `/config` and set the `script` row of greek-to-me. `traces` (on by default) turns the tool-trace rewriting off. `replies` (off by default) also draws fenced code in the model's replies, and `keep` lists the fence languages left alone when it does. The change applies to the next reply drawn.

## Scripts and fonts

| `script` | Draws | Font it needs |
|---|---|---|
| `greek` | letter-for-letter Greek | any with Greek |
| `quenya` | Tengwar written as Quenya is: consonants as letters, each vowel a tehta on the *next* consonant (or a carrier) | `TengwarPUA.ttf`, shipped in `fonts/` |
| `tengwar` | the same Tengwar, written the way English and Sindarin often are: each vowel a tehta on the consonant *before* it (or a carrier) | `TengwarPUA.ttf`, shipped in `fonts/` |
| `cirth` | Angerthas Cirth (the dwarf-runes), a rune for a letter, from the ConScript Unicode Registry | `TengwarPUA.ttf`, shipped in `fonts/` |
| `klingon` | pIqaD, CSUR U+F8D0 | `TengwarPUA.ttf`, shipped in `fonts/` |
| `aurebesh` | Aurebesh | `AurebeshPUA.otf`, shipped in `fonts/` |
| `grimdark` | a skull, cog, cross and ankh among the letters, alchemical elements and Elder Futhark runes for the rest. The only single-cell skull is ☠, so there is one | Noto Sans Symbols or Symbola (alchemical), DejaVu Sans, a runic font |
| `custom` | an alphabet of your own, see below | whichever font has it |
| `off` | nothing | |

Aurebesh has no Unicode block, and the Tengwar and Cirth private-use home (U+E000) is claimed by Nerd Font icons, so these are drawn from fonts that put the glyphs in plane 15 (U+F5000, U+F5100), where nothing else lives. The mod emits those codepoints, and your terminal falls back to the font that has them.

- **Tengwar, Cirth and Klingon** ship with the mod in one font: `fonts/TengwarPUA.ttf` (SIL OFL, from Unifont CSUR; see `fonts/NOTICE.md`). Copy it to `~/.local/share/fonts/` and run `fc-cache -f`, then restart your terminal. A Tengwar letter and its vowel are one precomposed glyph, so each takes a single cell. `scripts/build-tengwar.py` rebuilds it from Unifont CSUR.
- **Aurebesh** ships with the mod: `fonts/AurebeshPUA.otf`, Neale Davidson's Aurebesh from [Pixel Sagas](https://www.pixelsagas.com/?page_id=4004) with its glyphs also at U+F5000 + ASCII. His download carries an SIL OFL 1.1 file, which is `fonts/OFL-Aurebesh.txt`; see `fonts/NOTICE.md`. Install it like Tengwar. `scripts/build-fonts.py` rebuilds it from his `Aurebesh.otf` ([PS_Aurebesh.zip](https://www.pixelsagas.com/wp-content/uploads/2014/08/PS_Aurebesh.zip)).

If you display a session remotely, install the fonts on the machine whose terminal draws it, not on the host that runs Claude Code.

## Your own alphabet

Set `script` to `custom` and put 26 characters in the `alphabet` row of `/config`: your letters, a to z in order. Give 52 and the second 26 are the capitals; otherwise capitals use the same signs. Spaces are ignored. Any font your terminal already has will draw it. If the alphabet is not 26 or 52 characters, the mod falls back to greek, and so it does for a script the mod used to have.

Each character must be one cell wide: Chinese, Japanese and Korean full-width forms and emoji take two and will not line up, and a terminal neither joins Arabic letters nor reorders right-to-left text, so those read as separate letters. These ones work, each a letter for a letter (some letters share a sign):

<!-- alphabets -->
| Script | Alphabet, a to z | Font |
|---|---|---|
| runic | `ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᚲᚱᛊᛏᚢᚢᚹᛉᛃᛉ` | any font with it |
| braille | `⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵` | any font with it |
| hebrew | `אבכדעפגהישקלמנופקרסתטווצחז` | any font with it |
| katakana | `ｱﾊｾﾄｴﾌｹﾍｲｼｶﾘﾏﾅｵﾎｸﾗｻﾀｳﾋﾜｽﾔｿ` | any font with it |
| malayalam | `അബചദഎഫഗഹഇജകലമനഒപഖരസതഉവഴഷയശ` | any font with it |
| arabic | `ابثدعفغهيجكلمنوضقرستظزصحطذ` | any font with it |
| hiero | `𓄿𓃀𓎡𓂧𓇋𓆑𓎼𓉔𓇋𓆓𓎡𓃭𓅓𓈖𓂝𓊪𓈎𓂋𓋴𓏏𓅱𓆑𓅱𓐍𓇌𓊃` | Noto Sans Egyptian Hieroglyphs |
| ogham | `ᚐᚁᚉᚇᚓᚃᚌᚆᚔᚉᚉᚂᚋᚅᚑᚊᚊᚏᚄᚈᚒᚃᚒᚎᚔᚎ` | DejaVu Sans |
| gothic | `𐌰𐌱𐌺𐌳𐌴𐍆𐌲𐌷𐌹𐌾𐌺𐌻𐌼𐌽𐍉𐍀𐌵𐍂𐍃𐍄𐌿𐍅𐍅𐍇𐌾𐌶` | Noto Sans Gothic |
| shavian | `𐑨𐑚𐑒𐑛𐑧𐑓𐑜𐑣𐑦𐑡𐑒𐑤𐑥𐑯𐑪𐑐𐑒𐑮𐑕𐑑𐑳𐑝𐑢𐑒𐑘𐑟` | Noto Sans Shavian |
<!-- /alphabets -->

## Try it

Ask for anything that runs a shell command and look at the row. Switch `script` in `/config` to step through each. A box instead of a glyph means the terminal has no font for that script; check with `fc-list ":charset=f5100"` (swap the codepoint).

## Test

```
claude plugin test .
claude plugin validate .
```
