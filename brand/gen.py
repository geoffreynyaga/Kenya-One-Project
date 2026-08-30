"""Generate the Kenya One ostrich mark. Run: python3 brand/gen.py"""

import math

NAVY = "#1B2A6B"


def unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy)
    return dx / n, dy / n


def taper(a, b, wa, wb):
    """Tapered quad from a (width wa) to b (width wb), as an SVG points string."""
    ux, uy = unit(a, b)
    nx, ny = -uy, ux
    pts = [
        (a[0] + nx * wa / 2, a[1] + ny * wa / 2),
        (b[0] + nx * wb / 2, b[1] + ny * wb / 2),
        (b[0] - nx * wb / 2, b[1] - ny * wb / 2),
        (a[0] - nx * wa / 2, a[1] - ny * wa / 2),
    ]
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)


def leg(hip, knee, ankle, toe_a, toe_b, w_thigh=8.5, w_shank=3.4, w_foot=1.8):
    """A three-segment ostrich leg with hinge circles at knee and ankle."""
    return f"""
    <polygon class="hv" points="{taper(hip, knee, w_thigh, w_shank + 1)}"/>
    <polygon class="md" points="{taper(knee, ankle, w_shank, w_foot)}"/>
    <polygon class="md" points="{taper(ankle, toe_a, w_foot, 0.8)}"/>
    <polygon class="md" points="{taper(ankle, toe_b, w_foot * 0.7, 0.6)}"/>
    <circle class="pin" cx="{knee[0]}" cy="{knee[1]}" r="2.4"/>
    <circle class="pin" cx="{ankle[0]}" cy="{ankle[1]}" r="1.8"/>"""


BODY = [
    (64, 57), (48, 52), (30, 56), (17, 66), (15, 79),
    (25, 92), (43, 100), (62, 99), (76, 90), (82, 75), (77, 63),
]
WING = [(74, 68), (56, 62.5), (38, 68), (46, 80), (66, 78)]

SPOKES = [
    ((56, 62.5), (48, 52)), ((56, 62.5), (64, 57)),
    ((38, 68), (30, 56)), ((38, 68), (17, 66)),
    ((46, 80), (15, 79)), ((46, 80), (43, 100)),
    ((66, 78), (62, 99)), ((66, 78), (76, 90)),
    ((74, 68), (82, 75)), ((74, 68), (77, 63)),
]
RIBS = [((66, 65), (63, 78.5)), ((56, 62.5), (54, 79)), ((46, 65), (46, 80))]
NECK_BRACES = [((84, 21), (84, 36)), ((78, 34), (77, 48)), ((70, 46), (73, 57))]
TAIL_FAN = [((16, 72), (4, 50)), ((16, 72), (0, 61)), ((16, 72), (8, 76))]


def pts(seq):
    return " ".join(f"{x},{y}" for x, y in seq)


def lines(cls, ls):
    return "".join(
        f'\n    <line class="{cls}" x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}"/>'
        for a, b in ls
    )


def mark():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 3 130 138">
  <style>
    .hv,.md,.lt,.pin{{fill:none;stroke:{NAVY};stroke-linejoin:round;stroke-linecap:round}}
    .hv{{stroke-width:2.4}} .md{{stroke-width:1.7}} .lt{{stroke-width:0.95}}
    .pin{{stroke-width:1.2;fill:#fff}}
  </style>
  <g>
    <polygon class="hv" points="84,21 85,12 93,9 99,15 92,23"/>
    <polygon class="hv" points="99,15 109,17.5 98,20.5" fill="{NAVY}"/>
    <line class="lt" x1="85" y1="12" x2="92" y2="23"/>
    <circle cx="91" cy="14.5" r="1.5" fill="none" stroke="{NAVY}" stroke-width="1.1"/>

    <polyline class="hv" points="84,21 78,34 70,46 65,57"/>
    <polyline class="hv" points="92,23 84,36 77,48 73,57"/>{lines("lt", NECK_BRACES)}

    <polygon class="hv" points="17,66 4,50 0,61 8,76 15,79"/>{lines("lt", TAIL_FAN)}

    <polygon class="hv" points="{pts(BODY)}"/>
    <polygon class="md" points="{pts(WING)}"/>{lines("lt", RIBS)}{lines("lt", SPOKES)}
    {leg((49, 95), (31, 110), (21, 126), (9, 130), (15, 135))}
    {leg((63, 95), (81, 106), (71, 119), (84, 122), (78, 128))}
  </g>
</svg>
"""


HEAD = [(84, 21), (85, 12), (93, 9), (99, 15), (109, 17.5), (98, 20.5), (92, 23)]


def silhouette(fatten):
    """Solid one-colour bird, built from the mark's own geometry.

    `fatten` strokes every part in the fill colour so the neck and legs
    survive at small pixel sizes, where a hairline would drop out.
    """
    parts = [
        f'<polygon points="{pts(HEAD)}"/>',
        f'<polygon points="{taper((88, 22), (69, 57), 9, 15)}"/>',
        f'<polygon points="{pts(BODY)}"/>',
        '<polygon points="17,66 4,50 0,61 8,76 15,79"/>',
        f'<polygon points="{taper((49, 95), (31, 110), 11, 6)}"/>',
        f'<polygon points="{taper((31, 110), (21, 126), 6, 3.5)}"/>',
        f'<polygon points="{taper((63, 95), (81, 106), 11, 6)}"/>',
        f'<polygon points="{taper((81, 106), (71, 119), 6, 3.5)}"/>',
    ]
    body = "\n    ".join(parts)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 5 116 128">
  <g fill="{NAVY}" stroke="{NAVY}" stroke-width="{fatten}" stroke-linejoin="round">
    {body}
  </g>
</svg>
"""


if __name__ == "__main__":
    outputs = {
        "brand/ostrich-mark.svg": mark(),
        "brand/ostrich-solid.svg": silhouette(1.5),
        "brand/ostrich-glyph.svg": silhouette(4.5),
    }
    for path, content in outputs.items():
        with open(path, "w") as handle:
            handle.write(content)
        print("wrote", path)
