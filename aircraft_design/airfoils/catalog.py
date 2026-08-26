"""Wind-tunnel section data.

Only what cannot be derived lives here. Section shape and the theoretical
coefficients are generated in the browser from the designation, because the
4- and 5-digit families are closed form; storing them would be a second
implementation of the same equations. Thin-airfoil theory is inviscid, so it
has no stall and therefore no CL max, and no amount of geometry gives you one.
That is what this catalogue is for.

A section is added only with a named source.
"""
from __future__ import annotations

import json
import pathlib
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Optional

CATALOG_FILE = (
    pathlib.Path(__file__).resolve().parents[2]
    / "staticfiles"
    / "airfoils"
    / "tunnel-data.json"
)


class AirfoilNotFound(LookupError):
    """Asked for a section the catalogue holds no tunnel data for."""


@dataclass(frozen=True)
class ReynoldsRow:
    """Measured coefficients at one Reynolds number."""

    reynolds: float
    cl_max: float
    cd_min: float


@dataclass(frozen=True)
class TunnelSection:
    """One section's measured data, and where it came from."""

    designation: str
    name: str
    source: str
    reynolds: tuple[ReynoldsRow, ...]
    note: Optional[str] = None
    zero_lift_alpha_deg: Optional[float] = None
    lift_slope_per_deg: Optional[float] = None
    lift_at_zero_alpha: Optional[float] = None
    min_drag_lift_coefficient: Optional[float] = None
    warnings: tuple[str, ...] = field(default_factory=tuple)


def _load() -> dict[str, Any]:
    if not CATALOG_FILE.is_file():
        return {"sections": []}
    return json.loads(CATALOG_FILE.read_text())


@lru_cache(maxsize=1)
def list_airfoils() -> tuple[TunnelSection, ...]:
    """Every section with tunnel data, in designation order."""
    sections = []
    for row in _load().get("sections", []):
        warnings = (row["note"],) if row.get("note") else ()
        sections.append(
            TunnelSection(
                designation=row["designation"],
                name=row["name"],
                source=row["source"],
                note=row.get("note"),
                zero_lift_alpha_deg=row.get("zero_lift_alpha_deg"),
                lift_slope_per_deg=row.get("lift_slope_per_deg"),
                lift_at_zero_alpha=row.get("lift_at_zero_alpha"),
                min_drag_lift_coefficient=row.get("min_drag_lift_coefficient"),
                reynolds=tuple(ReynoldsRow(**r) for r in row.get("reynolds", [])),
                warnings=warnings,
            )
        )
    return tuple(sorted(sections, key=lambda s: s.designation))


@lru_cache(maxsize=64)
def get_airfoil(designation: str) -> TunnelSection:
    """Tunnel data for one section.

    Raises:
        AirfoilNotFound: when the catalogue has no measurements for it. That is
            an ordinary outcome, not an error: most sections have none, and the
            caller falls back to the generated theory.
    """
    key = (designation or "").strip().replace("naca-", "").replace("NACA ", "")
    for section in list_airfoils():
        if section.designation == key:
            return section
    raise AirfoilNotFound(designation)
