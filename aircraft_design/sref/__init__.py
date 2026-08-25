"""Constraint-analysis sizing translated from the 'Sref and POWER SIZING' sheet."""

from .calculate import ENGINE_CATALOG, SrefCalculationError, calculate_sref
from .contracts import (
    Aerodynamics,
    AtmosphereInputs,
    AtmosphereResult,
    CurvePoint,
    DesignPoint,
    EngineSpec,
    EngineType,
    PerformanceRequirements,
    SrefInputs,
    SrefResult,
    SizingResult,
    WeightsAndCruise,
)

__all__ = [
    "ENGINE_CATALOG",
    "Aerodynamics",
    "AtmosphereInputs",
    "AtmosphereResult",
    "CurvePoint",
    "DesignPoint",
    "EngineSpec",
    "EngineType",
    "PerformanceRequirements",
    "SrefCalculationError",
    "SrefInputs",
    "SrefResult",
    "SizingResult",
    "WeightsAndCruise",
    "calculate_sref",
]
