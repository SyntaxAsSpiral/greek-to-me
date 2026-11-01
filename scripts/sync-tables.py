#!/usr/bin/env python3
"""Write the mod's script tables from esoscript.py, the source of truth.

usage: sync-tables.py [ESOSCRIPT.PY]   default /mnt/echo/nix-os/shared/home/esoscript/esoscript.py

esoscript (nix-os, shared/home/esoscript) owns every table. The mod keeps only greek, the fictional scripts (Tengwar
and Quenya, Cirth, pIqaD, grimdark) and a custom slot, so this replaces just those values in hooks/register.tsx in
place, leaving the comments and the code around them alone. It also writes the README's table of alphabets to paste
into the custom slot, from every other script in esoscript, between its alphabets markers. Run it, then
`scripts/build-tengwar.py` if TENGWAR_LETTERS or the Cirth range changed (the font reads that list).
"""
import importlib.util
import os
import re
import sys

here = os.path.dirname(os.path.abspath(__file__))
src_path = sys.argv[1] if len(sys.argv) > 1 else "/mnt/echo/nix-os/shared/home/esoscript/esoscript.py"
spec = importlib.util.spec_from_file_location("esoscript", src_path)
eso = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eso)

reg = os.path.join(here, "..", "hooks", "register.tsx")
text = open(reg, encoding="utf8").read()


def sub(pattern, repl, text, what):
    new, n = re.subn(pattern, lambda m: repl(m), text, count=1, flags=re.S)
    if n != 1:
        sys.exit(f"sync-tables: cannot find {what} in register.tsx")
    return new


MOD_ALPHABETS = ("greek", "grimdark")  # the rest of esoscript's alphabets are for the custom slot
for name in MOD_ALPHABETS:
    lower, upper = eso.ALPHABETS[name]
    if name == "greek":
        text = sub(r"(greek: \{\s*lower: ')[^']*(',\s*upper: ')[^']*(')", lambda m: m[1] + lower + m[2] + upper + m[3], text, name)
    else:
        text = sub(r"(\b%s: \{ lower: ')[^']*(')" % name, lambda m: m[1] + lower + m[2], text, name)

k = "".join(chr(c) for c in eso.KLINGON)
kd = "".join(chr(c) for c in eso.KLINGON_DIGITS)
text = sub(r"(klingon: \{\s*lower: ')[^']*(',\s*digits: ')[^']*(')", lambda m: m[1] + k + m[2] + kd + m[3], text, "klingon")
cirth = ",\n".join("  " + ", ".join(f"0x{c:x}" for c in eso.CIRTH_CSUR[i : i + 13]) for i in range(0, 26, 13))
text = sub(r"(const CIRTH_CSUR = \[\n).*?(,\n\])", lambda m: m[1] + cirth + m[2], text, "CIRTH_CSUR")

cons = ",\n".join("  " + ", ".join(f"['{k}', 0x{cp:x}]" for k, cp in eso.Q_CONS[i : i + 7]) for i in range(0, len(eso.Q_CONS), 7))
text = sub(r"(const Q_CONS: \[string, number\]\[\] = \[\n).*?(\n\])", lambda m: m[1] + cons + "," + m[2], text, "Q_CONS")
letters = ",\n".join("  " + ", ".join(f"0x{c:x}" for c in eso.TENGWAR_LETTERS[i : i + 14]) for i in range(0, len(eso.TENGWAR_LETTERS), 14))
text = sub(r"(TENGWAR_LETTERS = \[\n).*?(,\n\])", lambda m: m[1] + letters + m[2], text, "TENGWAR_LETTERS")

open(reg, "w", encoding="utf8").write(text)

# the README's alphabets to paste into the custom slot: everything esoscript has that the mod does not
rows = []
for name in eso.ORDER:
    if name in MOD_ALPHABETS or name in ("klingon", "quenya", "tengwar", "cirth", "aurebesh", "maya"):
        continue
    letters = eso.ALPHABETS[name][0] if name in eso.ALPHABETS else "".join(chr(c) for c in eso.BLOCKS[name])
    assert len([*letters]) == 26, (name, len([*letters]))
    digits = eso.DIGITS.get(name, "")  # scripts with a numeral per digit; braille and maya number in runs, not here
    rows.append(f"| {name} | `{letters}{digits}` | {eso.FONTS.get(name) or 'any font with it'} |")
table = "| Script | Alphabet, a to z, then digits where it has them | Font |\n|---|---|---|\n" + "\n".join(rows)
readme = os.path.join(here, "..", "README.md")
doc = open(readme, encoding="utf8").read()
new, n = re.subn(r"(<!-- alphabets -->\n).*?(<!-- /alphabets -->)", lambda m: m[1] + table + "\n" + m[2], doc, count=1, flags=re.S)
if n != 1:
    sys.exit("sync-tables: no alphabets markers in README.md")
open(readme, "w", encoding="utf8").write(new)
print("register.tsx and the README table now follow", src_path)
