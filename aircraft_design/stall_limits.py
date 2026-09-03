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
``derived_basis`` shows the working. It is a second-hand number and the two
are kept in separate fields so nothing can quote it as regulation.
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
        "Single seat, unpowered or under 5 US gal of fuel. The same rule "
        "caps full-power level flight at 55 knots CAS, so the speed range "
        "is bounded at both ends.",
    ),
    StallLimit(
        "light_sport",
        "Light-sport aircraft",
        45.0,
        "VS1",
        None,
        "",
        "14 CFR 1.1",
        "Clean — the definition takes the stall speed without lift-enhancing "
        "devices, so flaps buy nothing here. This is the green dotted line "
        "on Fig. 3-5. The MOSAIC rulemaking revises the light-sport "
        "definition; read the current section before certifying to it.",
    ),
    StallLimit(
        "far23_single",
        "Part 23 single-engine",
        61.0,
        "VS0",
        None,
        "",
        "14 CFR 23.49",
        "Landing configuration at maximum take-off weight. The green dashed "
        "line on Fig. 3-5, and the limit most general-aviation designs are "
        "sized against.",
    ),
    StallLimit(
        "far23_light_twin",
        "Part 23 multi-engine at or under 6,000 lb",
        61.0,
        "VS0",
        None,
        "",
        "14 CFR 23.49",
        "The same 61 knots, but only for a light twin that cannot meet the "
        "one-engine-inoperative climb gradient. A twin that does meet it has "
        "no stall speed ceiling.",
    ),
    StallLimit(
        "far23_amendment_64",
        "Part 23 as amended by Amendment 64",
        None,
        "",
        61.0,
        "The figure Part 23 carried before the restructuring, and the one "
        "the accepted consensus standards continue to work to. Confirm it "
        "against the standard the programme actually names.",
        "14 CFR 23.2110",
        "The 2017 restructuring made Part 23 performance-based: the rule now "
        "requires a stall speed to be determined, not to be under a number. "
        "The numeric ceilings moved into the accepted means of compliance, "
        "so the figure to design against comes from the consensus standard "
        "the programme is using, not from the CFR.",
    ),
    StallLimit(
        "far25_transport",
        "Part 25 transport category",
        None,
        "",
        107.0,
        "Not from Part 25 but from the approach category the aeroplane has "
        "to fit. § 97.3 grades an aircraft on VREF, or on 1.3·VS0 where no "
        "VREF is specified, and category C ends at 140 KCAS — so 140 / 1.3 "
        "= 107 KCAS is the stall speed that keeps a transport in category C, "
        "and 165 / 1.3 = 127 KCAS the one that keeps it in D. A category is "
        "a choice about which airports and which approach minima the design "
        "can use, so this is a requirement the programme sets, not one the "
        "CFR sets for it.",
        "14 CFR Part 25",
        "No stall speed ceiling. What bounds the wing loading instead is the "
        "landing field length of § 25.125 and the approach speed it implies, "
        "which is a longer calculation but the same argument — the "
        "constraint diagram alone will not see it.",
    ),
    StallLimit(
        "uas_part_107",
        "Small unmanned aircraft",
        None,
        "",
        None,
        "Nothing to derive. Recovery method sets the speed, and a "
        "hand-launched airframe, a net, and a runway do not agree on a "
        "number — this one belongs in the requirements document.",
        "14 CFR 107.51",
        "No stall speed ceiling, and none implied: Part 107 limits ground "
        "speed to 87 knots and altitude to 400 ft AGL, and says nothing "
        "about the low end. A fixed-wing UAS stall speed is set by how it is "
        "launched and recovered, so it is a design requirement rather than a "
        "regulatory one.",
    ),
)


__all__ = ["STALL_LIMITS", "StallLimit"]
