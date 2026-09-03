"""Certification stall-speed ceilings, by the rule the aircraft is built to.

Static reference data, so it lives in Python and is served once through a
cached GET (AGENTS.md, Where things live).

What it is for: Sheet 04 draws Gundmundsson's Fig. 3-5, which superimposes
two stall-speed isobars on the constraint diagram — 45 KCAS and 61 KCAS —
because those are the two that certify a light general-aviation aeroplane in
the United States. They are the right two lines for the aircraft the book is
sizing and the wrong two for most others, and nothing on that figure says
which rule you are actually under. This table does.

Two things it deliberately does not do. It is not a compliance reference:
every row names the section so the current text can be read, because these
numbers move. And it does not choose for you — the sheet shows the table and
the reader picks the row, the same arrangement as Table 3-1.

A ``limit_kcas`` of ``None`` is not missing data. It means the rule sets no
stall speed ceiling at all, which is itself the answer for the restructured
Part 23, for transport-category aeroplanes and for small unmanned aircraft,
and is the reason those rows exist.

Those rows are still not free to stall at any speed — something else bounds
them, it is just not a stall speed written into the CFR. Where that
something reduces to a speed, ``derived_kcas`` carries it and
``derived_basis`` says in one line where it came from. It is a second-hand
number, and the two live in separate fields so nothing can quote it as
regulation. Keep both short: this table is read beside a figure, not
instead of the section it cites.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class StallLimit:
    """The stall-speed ceiling one certification basis imposes."""

    #: Stable identifier for the row, for use as a key.
    value: str
    #: The class of aircraft, as the rule scopes it.
    label: str
    #: The ceiling in knots calibrated airspeed, or ``None`` where the rule
    #: sets no stall speed limit.
    limit_kcas: float | None
    #: Which stall speed the ceiling is written against: ``VS0`` in the
    #: landing configuration, ``VS1`` in the configuration named by the rule,
    #: or an empty string where there is no ceiling.
    speed: str
    #: Where the rule sets no ceiling, the stall speed the binding
    #: requirement works out to. ``None`` where the binding requirement is
    #: not a speed at all.
    derived_kcas: float | None
    #: How ``derived_kcas`` was arrived at. Empty where there is none.
    derived_basis: str
    #: The section to read. Not a substitute for reading it.
    citation: str
    #: What the row means in practice, including what bounds the design when
    #: the rule itself does not.
    note: str


#: Ordered by stalling speed, slowest rule first, so the table reads as a
#: ladder from the lightest category to the heaviest.
STALL_LIMITS: tuple[StallLimit, ...] = (
    StallLimit(
        "ultralight",
        "Ultralight vehicle",
        24.0,
        "VS1",
        None,
        "",
        "14 CFR 103.1(e)(4)",
        "Single seat. The same rule caps level flight at 55 KCAS.",
    ),
    StallLimit(
        "light_sport",
        "Light-sport aircraft",
        45.0,
        "VS1",
        None,
        "",
        "14 CFR 1.1",
        "Clean, so flaps buy nothing. MOSAIC revises this definition.",
    ),
    StallLimit(
        "far23_single",
        "Part 23 single-engine",
        61.0,
        "VS0",
        None,
        "",
        "14 CFR 23.49",
        "Landing configuration at maximum take-off weight.",
    ),
    StallLimit(
        "far23_light_twin",
        "Part 23 multi-engine at or under 6,000 lb",
        61.0,
        "VS0",
        None,
        "",
        "14 CFR 23.49",
        "Only for a twin that cannot meet the one-engine-out climb.",
    ),
    StallLimit(
        "far23_amendment_64",
        "Part 23 as amended by Amendment 64",
        None,
        "",
        61.0,
        "The pre-Amendment 64 figure, which the consensus standards keep.",
        "14 CFR 23.2110",
        "Performance-based since 2017. The number moved to the "
        "consensus standard, so read the one the programme names.",
    ),
    StallLimit(
        "far25_transport",
        "Part 25 transport category",
        None,
        "",
        107.0,
        "Approach category C, at 1.3·VS0 ≤ 140 KCAS (§ 97.3). "
        "Category D allows 127.",
        "14 CFR Part 25",
        "No ceiling. Landing field length (§ 25.125) bounds it instead.",
    ),
    StallLimit(
        "uas_part_107",
        "Small unmanned aircraft",
        None,
        "",
        None,
        "",
        "14 CFR 107.51",
        "No ceiling, and none to derive — recovery method sets it.",
    ),
)


__all__ = ["STALL_LIMITS", "StallLimit"]
