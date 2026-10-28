#!/usr/bin/env python3
"""Build the IPA-complete Noto Sans subset (Artic Noto Sans, weights 400 and 600).

Dev-only. Needs: pip install fonttools brotli
Usage: build-noto-sans-ipa.py <NotoSans[wdth,wght].ttf> <out-dir>
Source: google/fonts, ofl/notosans (OFL). See README.md for the pinned source.

Combining marks must live in the same file as their base letters, so one file
per weight holds every range. The script ends with a coverage assertion.
"""
import subprocess
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

UNICODES = (
    "U+0000-024F,U+0250-02FF,U+0300-036F,U+0370-03FF,U+1AB0-1AFF,U+1D00-1DBF,"
    "U+1DC0-1DFF,U+1E00-1EFF,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,"
    "U+2190-21FF,U+25CC,U+2C60-2C7F,U+A700-A7FF"
)

# IPA chart letters (U+0250-02AF), tone letters, diacritics, extras
REQUIRED = set(range(0x0250, 0x02B0))
REQUIRED |= set(range(0x02E5, 0x02EA))
REQUIRED |= {
    0x0325, 0x030A, 0x032C, 0x0324, 0x0330, 0x033C, 0x032A, 0x033A, 0x033B, 0x0303,
    0x031A, 0x0339, 0x031C, 0x031F, 0x0320, 0x0308, 0x033D, 0x0329, 0x032F, 0x0318,
    0x0319, 0x031D, 0x031E, 0x0334, 0x0361, 0x035C, 0x0300, 0x0301, 0x0302, 0x0304,
    0x030B, 0x030C, 0x030F, 0x1DC4, 0x1DC5, 0x1DC8,
    0xA71B, 0xA71C,  # ꜛ ꜜ
    0x207F,          # ⁿ
    0x03B2, 0x03B8, 0x03C7,  # β θ χ
}


def build(src: Path, out: Path, weight: int) -> Path:
    inst = out / f"NotoSans-{weight}.ttf"
    dst = out / f"ArticNotoSans-{weight}.woff2"
    subprocess.run(
        [sys.executable, "-m", "fontTools.varLib.instancer", str(src), "wdth=100", f"wght={weight}", "-o", str(inst)],
        check=True,
    )
    subprocess.run(
        [sys.executable, "-m", "fontTools.subset", str(inst), f"--unicodes={UNICODES}",
         "--layout-features=*", "--flavor=woff2", f"--output-file={dst}"],
        check=True,
    )
    inst.unlink()
    return dst


def assert_coverage(path: Path) -> None:
    cmap = TTFont(str(path)).getBestCmap()
    missing = sorted(cp for cp in REQUIRED if cp not in cmap)
    # Known gaps in Noto Sans, covered by the system font fallback
    missing = [cp for cp in missing if cp not in (0x2197, 0x2198)]
    if missing:
        print(f"{path.name}: missing {[hex(c) for c in missing]}", file=sys.stderr)
        sys.exit(1)
    print(f"{path.name}: {path.stat().st_size} B, coverage OK")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for w in (400, 600):
        assert_coverage(build(src, out, w))
