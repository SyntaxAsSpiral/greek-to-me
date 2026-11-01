# Fonts

`TengwarPUA.ttf` is a modified copy of GNU Unifont's *Unifont CSUR* (https://unifoundry.com/unifont/),
which is licensed under the SIL Open Font License 1.1 (and, alternatively, GNU GPL 2 or later with the font
embedding exception). This copy is distributed under the OFL; its text is in `OFL.txt`.

The changes are these. The glyphs of the Tengwar block and the Cirth after it (U+E000 to U+E0FF) are moved to U+F5100 to U+F51FF, clear of
the private-use codepoints Nerd Fonts take for icons. 110 glyphs are added at U+F5200 and up, each a Tengwar letter
with one of five vowel marks drawn onto it from the same font, so a letter and its vowel take a single cell. The
Klingon glyphs are kept where they are, the rest of Unifont is dropped, and the family is renamed "Tengwar PUA".
Unifont declares no Reserved Font Name. `scripts/build-tengwar.py` rebuilds the file from Unifont CSUR.

`AurebeshPUA.otf` is a modified copy of `Aurebesh.otf` by Neale Davidson (https://www.pixelsagas.com), whose download
carries the SIL Open Font License 1.1 (`OFL-Aurebesh.txt`, "Copyright (c) 2013-2016, Neale Davidson"). The font's own copyright
string still reads "All Rights Reserved"; it is kept unchanged, and the OFL file is the author's licence for it. The change is
that every printable ASCII glyph is also mapped at U+F5000 + its ASCII code, and the family is renamed "Aurebesh PUA".
`scripts/build-fonts.py` rebuilds it. This copy is distributed under the OFL.

## Licensing of the Klingon and Aurebesh glyphs

The scripts and the fonts are separate questions.

- The fonts. The Klingon glyphs come from Unifont CSUR, under the SIL OFL 1.1 or GNU GPL 2 or later with the font embedding exception, with no Reserved Font Name; they ship in the modified copy "Tengwar PUA", under the OFL (`OFL.txt`). The Aurebesh glyphs come from Neale Davidson's `Aurebesh.otf`, whose download carries the OFL 1.1 ("Copyright (c) 2013-2016, Neale Davidson", `OFL-Aurebesh.txt`); they ship in the modified copy "Aurebesh PUA", under the OFL. The changes to both are listed above.
- The scripts. Klingon belongs to Paramount/CBS, and Aurebesh, the Star Wars alphabet, to Lucasfilm/Disney. The OFL covers the font files only and gives no rights over those trademarks or franchises. No such rights are claimed and no endorsement is implied; this is fan-level text transformation.
- What the mod does: it maps Latin letters to glyphs one for one. It reproduces no film text, no dictionary and no copyrighted Klingon works.
