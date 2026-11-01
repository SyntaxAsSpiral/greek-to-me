# greek-to-me

It's all Greek to me. A Claude Code mod that draws the code in collapsed tool-call traces in another script instead of Latin. Expand a row (ctrl+o) for the real text; permission prompts stay in Latin, and so do the Write, Edit and NotebookEdit rows.

It is a wink, and it also helps: shell commands are the rows that are hardest to skim anyway (long one-liners, heredocs), and the complicated ones need expanding to be understood either way. In another script they stand apart from everything else in the transcript, so you can see at a glance which rows to open.

```
/plugin install greek-to-me --marketplace SyntaxAsSpiral/greek-to-me
```

Set `script` in `/config`: `greek` (default), `quenya`, `tengwar`, `cirth`, `klingon`, `aurebesh`, `grimdark`, `custom` or `off`. The Tengwar, Cirth, Klingon and Aurebesh glyphs are private-use codepoints, so install `fonts/TengwarPUA.ttf` and `fonts/AurebeshPUA.otf` (SIL OFL, see `fonts/NOTICE.md`) on the machine whose terminal draws them, then restart the terminal.

## Your own alphabet

`script` = `custom` and 26 characters (a to z; 52 adds the capitals) in the `alphabet` row. One cell wide each, any font you have. A wrong length falls back to greek. Some to paste in:

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
