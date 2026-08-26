"""Wind-tunnel section data.

Section geometry is generated in the browser rather than stored — the 4- and
5-digit families are closed form, so keeping coordinates here would be a second
implementation of the same equations. This package holds only what cannot be
derived: measured coefficients, and the source they came from.
"""
from .catalog import (
    AirfoilNotFound,
    ReynoldsRow,
    TunnelSection,
    get_airfoil,
    list_airfoils,
)

__all__ = [
    "AirfoilNotFound",
    "ReynoldsRow",
    "TunnelSection",
    "get_airfoil",
    "list_airfoils",
]
