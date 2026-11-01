#!/usr/bin/env python3
"""Write the mod's script tables from esoscript.py, the source of truth.

usage: sync-tables.py [ESOSCRIPT.PY]   default /mnt/echo/nix-os/shared/home/esoscript/esoscript.py

esoscript (nix-os, shared/home/esoscript) owns every table: the alphabets, pIqaD, the Maya signs, the Tengwar
consonants and letters. This replaces those values in hooks/register.tsx in place, leaving the comments and the
code around them alone, so the mod follows the collection and never the other way round. Run it, then
`scripts/build-tengwar.py` if TENGWAR_LETTERS changed (the font reads that list).
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


for name, (lower, upper) in eso.ALPHABETS.items():
    if name == "greek":
        text = sub(r"(greek: \{\s*lower: ')[^']*(',\s*upper: ')[^']*(')", lambda m: m[1] + lower + m[2] + upper + m[3], text, name)
    else:
        text = sub(r"(\b%s: \{ lower: ')[^']*(')" % name, lambda m: m[1] + lower + m[2], text, name)

k = "".join(chr(c) for c in eso.KLINGON)
kd = "".join(chr(c) for c in eso.KLINGON_DIGITS)
text = sub(r"(klingon: \{\s*lower: ')[^']*(',\s*digits: ')[^']*(')", lambda m: m[1] + k + m[2] + kd + m[3], text, "klingon")
text = sub(r"(MAYA_SIGNS: number\[\] = ')[^']*(')", lambda m: m[1] + eso.MAYA_RANGES + m[2], text, "MAYA_SIGNS")

cons = ",\n".join("  " + ", ".join(f"['{k}', 0x{cp:x}]" for k, cp in eso.Q_CONS[i : i + 7]) for i in range(0, len(eso.Q_CONS), 7))
text = sub(r"(const Q_CONS: \[string, number\]\[\] = \[\n).*?(\n\])", lambda m: m[1] + cons + "," + m[2], text, "Q_CONS")
letters = ",\n".join("  " + ", ".join(f"0x{c:x}" for c in eso.TENGWAR_LETTERS[i : i + 14]) for i in range(0, len(eso.TENGWAR_LETTERS), 14))
text = sub(r"(TENGWAR_LETTERS = \[\n).*?(,\n\])", lambda m: m[1] + letters + m[2], text, "TENGWAR_LETTERS")

open(reg, "w", encoding="utf8").write(text)
print("register.tsx now follows", src_path)
