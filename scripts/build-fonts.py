#!/usr/bin/env python3
"""Build the two private-use fonts the aurebesh and quenya scripts draw from.

usage: build-fonts.py AUREBESH.otf UNIFONT_CSUR.otf OUTDIR

AurebeshPUA.otf  Aurebesh glyphs also at U+F5000 + ASCII (aurebesh)
TengwarPUA.otf   Unifont CSUR Tengwar (U+E000..E07F) also at U+F5100.. (quenya)

Both sit in plane 15 so Nerd Font icons, which own U+E000 and U+EA00, cannot
shadow them. Needs fontTools: nix shell nixpkgs#python3Packages.fonttools -c python3 ...
"""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable


def build(src, out, mapping, family):
    f = TTFont(src)
    base = f.getBestCmap()
    if not any(t.isUnicode() and t.format == 12 for t in f["cmap"].tables):
        n = CmapSubtable.newSubtable(12)
        n.platformID, n.platEncID, n.language, n.cmap = 3, 10, 0, {}
        f["cmap"].tables.append(n)
    for t in f["cmap"].tables:
        if t.isUnicode() and t.format in (4, 12):
            for new, old in mapping.items():
                if old in base and (t.format == 12 or new < 0x10000):
                    t.cmap[new] = base[old]
    for r in f["name"].names:
        if r.nameID in (1, 4, 16):
            r.string = family
        elif r.nameID == 6:
            r.string = family.replace(" ", "") + "-Regular"
        elif r.nameID == 3:
            r.string = family.replace(" ", "")
    f.save(out)


if __name__ == "__main__":
    aure, csur, out = sys.argv[1:4]
    os.makedirs(out, exist_ok=True)
    build(aure, f"{out}/AurebeshPUA.otf", {0xF5000 + o: o for o in range(0x21, 0x7F)}, "Aurebesh PUA")
    build(csur, f"{out}/TengwarPUA.otf", {0xF5100 + i: 0xE000 + i for i in range(0x80)}, "Tengwar PUA")
