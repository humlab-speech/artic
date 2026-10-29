# Artic Noto Sans

`src/assets/fonts/ArticNotoSans-{400,600}.woff2` are an IPA-complete subset of Noto Sans
(OFL, see `src/assets/fonts/OFL-NotoSans.txt`). Fontsource subsets split the IPA letters,
combining diacritics and tone letters across files, which breaks mark positioning, so one
file per weight holds every range.

Rebuild (dev only):

```bash
python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
curl -L -o NotoSans-VF.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
/tmp/fontenv/bin/python scripts/fonts/build-noto-sans-ipa.py NotoSans-VF.ttf src/assets/fonts
```

The script exits non-zero if an IPA letter, diacritic or tone letter is missing.
U+2197/U+2198 (↗ ↘) are absent from Noto Sans and fall back to the system font.

Source: `google/fonts` `ofl/notosans/NotoSans[wdth,wght].ttf`, fetched 2026-10-28 from `main`
(pin the commit here when rebuilding). Output: 99,768 B (400), 106,732 B (600).
