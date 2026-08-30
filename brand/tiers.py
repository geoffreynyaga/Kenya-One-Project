"""Cut the traced ostrich into optical-size tiers. Run: python3 brand/tiers.py

The mark is the original banner artwork, vectorised rather than redrawn. The
pipeline that produced `traced.svg`, from `docs/images/banner.png`:

    magick docs/images/banner.png -crop 340x350+470+40 +repage brand/source-crop.png
    magick brand/source-crop.png -background white -alpha remove -alpha off \\
        -colorspace Gray -resize 400% -threshold 62% brand/trace.pbm
    potrace brand/trace.pbm -s --alphamax 0 --opttolerance 0.2 --turdsize 20 \\
        -o brand/traced.svg

`--alphamax 0` forces polygonal corners, which is what the faceted source
wants; the default would round every vertex. Stripping alpha first matters:
`-threshold` applies to the alpha channel too, and thresholding a PNG that
still has one silently turns the ink transparent.

Small sizes then need heavier strokes so the facet cells close into a readable
mass instead of dissolving into grey noise, so each tier is the same path at a
different weight. Weights look large because potrace's group transform scales
by 0.1, so a stroke of 900 renders as 90 user units.
"""

import pathlib
import re

SRC = pathlib.Path("brand/traced.svg")

# Ink bounding box in source pixels, from `magick identify -format %@`.
INK = (247, 155, 900, 1128)
SRC_H = 1400
PAD = 0.09  # share of the long side left as margin

TIERS = {
    "brand/ostrich-mark.svg": 0,     # 128 px and up: the drawing as drawn
    "brand/ostrich-solid.svg": 620,   # 32 to 64 px
    "brand/ostrich-glyph.svg": 900,  # 16 px
}


def path_data():
    text = SRC.read_text()
    match = re.search(r'<path d="(.*?)"', text, re.S)
    if not match:
        raise SystemExit("no path found in traced.svg")
    return match.group(1)


def view_box():
    """Square, centred on the ink, with even margin."""
    x, y, w, h = INK
    side = max(w, h) * (1 + 2 * PAD)
    # The group transform already flips potrace's bottom-left origin back to
    # top-left, so user space matches the source bitmap's pixel coordinates.
    cx = x + w / 2
    cy = y + h / 2
    return f"{cx - side / 2:.0f} {cy - side / 2:.0f} {side:.0f} {side:.0f}"


def tier(weight):
    stroke = ""
    if weight:
        stroke = f' stroke="currentColor" stroke-width="{weight}" stroke-linejoin="round"'
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box()}">
  <g transform="translate(0,{SRC_H}) scale(0.1,-0.1)" fill="currentColor"{stroke}>
    <path d="{path_data()}"/>
  </g>
</svg>
"""


if __name__ == "__main__":
    for name, weight in TIERS.items():
        pathlib.Path(name).write_text(tier(weight))
        print("wrote", name, f"(stroke {weight})")
