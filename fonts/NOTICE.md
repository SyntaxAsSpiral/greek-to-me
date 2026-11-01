# Fonts

`TengwarPUA.otf` is a modified copy of GNU Unifont's *Unifont CSUR* (https://unifoundry.com/unifont/),
which is licensed under the SIL Open Font License 1.1 (and, alternatively, GNU GPL 2 or later with the font
embedding exception). This copy is distributed under the OFL; its text is in `OFL.txt`.

The only change is that the glyphs of the Tengwar block (U+E000 to U+E07F) are also reachable at
U+F5100 to U+F517F, clear of the private-use codepoints Nerd Fonts take for icons, and the family is renamed
"Tengwar PUA". Unifont declares no Reserved Font Name. The outlines are not altered.

The mod does not bundle `Aurebesh.otf` or `Maya.otf`, which are not open fonts; see `scripts/build-fonts.py`
and the README for how to use your own copies.
