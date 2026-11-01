# greek-to-me

It's all Greek to me. A Claude Code mod that draws shell commands and their output in another script instead of Latin. Only shell commands: every other tool, and every permission prompt, stays in Latin, and ctrl+o shows the real text.

It is a wink, and it also helps: shell commands are the rows that are hardest to skim anyway (long one-liners, heredocs), and the complicated ones need expanding to be understood either way. In another script they stand apart, so you can see at a glance which to open. The live peek under a running command is temporary; when the call finishes it folds to a summary line.

```
/plugin install greek-to-me --marketplace SyntaxAsSpiral/greek-to-me
```

Set `script` in `/config`: `greek` (default), `quenya`, `tengwar`, `cirth`, `klingon`, `aurebesh`, `grimdark`, `custom` or `off`. `quenya`, `tengwar`, `cirth`, `klingon` and `aurebesh` are drawn in private-use codepoints, so install `fonts/TengwarPUA.ttf` and `fonts/AurebeshPUA.otf` on the machine whose terminal draws them, then restart the terminal. `grimdark` needs a font with alchemical symbols.

Font licences and trademarks: see `fonts/NOTICE.md`.

## Your own alphabet

`script` = `custom` and 26 characters (a to z) in the `alphabet` row; add the 26 capitals, the ten digits 0 to 9 at the very end, or both (26, 36, 52 or 62 in all). One cell wide each, any font you have. A wrong length falls back to greek. Some to paste in:

<!-- alphabets -->
| Script | Alphabet, a to z, then digits where it has them | Font |
|---|---|---|
| runic | `ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᚲᚱᛊᛏᚢᚢᚹᛉᛃᛉ` | any font with it |
| braille | `⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵` | any font with it |
| hebrew | `אבכדעפגהישקלמנופקרסתטווצחז` | any font with it |
| katakana | `ｱﾊｾﾄｴﾌｹﾍｲｼｶﾘﾏﾅｵﾎｸﾗｻﾀｳﾋﾜｽﾔｿ` | any font with it |
| malayalam | `അബചദഎഫഗഹഇജകലമനഒപഖരസതഉവഴഷയശ൦൧൨൩൪൫൬൭൮൯` | any font with it |
| arabic | `ابثدعفغهيجكلمنوضقرستظزصحطذ٠١٢٣٤٥٦٧٨٩` | any font with it |
| hiero | `𓄿𓃀𓎡𓂧𓇋𓆑𓎼𓉔𓇋𓆓𓎡𓃭𓅓𓈖𓂝𓊪𓈎𓂋𓋴𓏏𓅱𓆑𓅱𓐍𓇌𓊃` | Noto Sans Egyptian Hieroglyphs |
| ogham | `ᚐᚁᚉᚇᚓᚃᚌᚆᚔᚉᚉᚂᚋᚅᚑᚊᚊᚏᚄᚈᚒᚃᚒᚎᚔᚎ` | DejaVu Sans |
| gothic | `𐌰𐌱𐌺𐌳𐌴𐍆𐌲𐌷𐌹𐌾𐌺𐌻𐌼𐌽𐍉𐍀𐌵𐍂𐍃𐍄𐌿𐍅𐍅𐍇𐌾𐌶` | Noto Sans Gothic |
| shavian | `𐑨𐑚𐑒𐑛𐑧𐑓𐑜𐑣𐑦𐑡𐑒𐑤𐑥𐑯𐑪𐑐𐑒𐑮𐑕𐑑𐑳𐑝𐑢𐑒𐑘𐑟` | Noto Sans Shavian |
<!-- /alphabets -->
