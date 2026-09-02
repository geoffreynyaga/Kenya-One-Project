"""Gundmundsson Table 3-1: typical aerodynamic characteristics by class.

Static reference data, so it lives in Python and is served once through a
cached GET rather than repeated in every response (AGENTS.md, Where things
live).

What it is for: the constraint analysis needs C_Dmin, C_D_TO and C_L_TO
before the geometry that would produce them exists. The book's note (4) on
p. 61 is explicit about this — "one does not know important parameters such
as C_Dmin, C_DTO, C_LTO, and k. To resolve this issue, the designer must
look to existing aircraft in the same class" — and Table 3-1 is what it
offers in place of that study.

These are advisory ranges for a reviewer, never defaults. Nothing here is
written into a field: a range tells you whether the number you typed is
plausible for the class you are designing, which is a different job from
supplying the number.

C_L_TO is printed by the book as an approximation ("~0.7") rather than a
range, so it is carried as one number and the API marks it approximate.

One caveat worth knowing when comparing these against the workbook. Both
take-off coefficients here are ground-run values, at the ground attitude
with take-off flap. The workbook's performance sheet instead carries the
values at liftoff: its C_L_TO of 1.4869 is exactly (W/S) / q_LOF, the lift
coefficient at the moment of rotation, and its C_D_TO of 0.1496 is the drag
at that lift coefficient rather than at the ground attitude. Eq. (3-4) wants
the ground-run pair, so the workbook's numbers are being read as something
they are not. The net effect on that design is about +10% on the ground-run
T/W, which is conservative, so it does not change the sheet's verdict.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class AeroClass:
    """One row of Table 3-1."""

    #: Stable identifier for the row, for use as a key.
    value: str
    #: The class name as the book prints it.
    label: str
    #: Minimum drag coefficient, clean.
    cd_min_low: float
    cd_min_high: float
    #: Drag coefficient during the take-off run.
    cd_takeoff_low: float
    cd_takeoff_high: float
    #: Lift coefficient during the take-off run. The book gives one
    #: approximate value per class rather than a range.
    cl_takeoff: float
    #: The book's own note for the row — chiefly the flap configuration the
    #: take-off coefficients assume.
    comment: str


FLAPS_TAKEOFF = "Assumes flaps in T-O position."

#: Gundmundsson, *General Aviation Aircraft Design*, Table 3-1, p. 62. Rows
#: are in the book's order, which is neither alphabetical nor by size.
AERO_CLASSES: tuple[AeroClass, ...] = (
    AeroClass(
        "amphibious", "Amphibious",
        0.040, 0.055, 0.050, 0.065, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "agricultural", "Agricultural",
        0.035, 0.045, 0.045, 0.055, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "biplane", "Biplane",
        0.045, 0.050, 0.045, 0.050, 0.4, "Assumes no flaps.",
    ),
    AeroClass(
        "ga_trainer", "GA trainer",
        0.030, 0.035, 0.040, 0.045, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "ga_high_performance_single", "GA high-performance single",
        0.025, 0.027, 0.035, 0.037, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "ga_single_fixed_gear", "GA typical single, fixed gear",
        0.028, 0.035, 0.038, 0.045, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "turboprop_commuter", "Turboprop commuter",
        0.025, 0.035, 0.035, 0.045, 0.8, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "turboprop_military_trainer", "Turboprop military trainer",
        0.022, 0.027, 0.032, 0.037, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "turbofan_business_jet", "Turbofan business jet",
        0.020, 0.025, 0.030, 0.035, 0.8, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "modern_jetliner", "Modern passenger jetliner",
        0.020, 0.028, 0.030, 0.038, 0.8, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "sixties_jetliner", "1960s-70s passenger jetliner",
        0.022, 0.027, 0.032, 0.037, 0.6, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "wwii_bomber", "World War II bomber",
        0.035, 0.045, 0.045, 0.055, 0.7, FLAPS_TAKEOFF,
    ),
    AeroClass(
        "wwii_fighter", "World War II fighter",
        0.020, 0.025, 0.030, 0.035, 0.5, FLAPS_TAKEOFF,
    ),
)


__all__ = ["AeroClass", "AERO_CLASSES"]
