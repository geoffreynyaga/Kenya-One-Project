"""Data contracts for initial unmanned-aircraft sizing.

Source: Gundlach, *Designing Unmanned Aircraft Systems: A Comprehensive
Approach* (AIAA, 2012), chapter 3. Equation numbers in this package refer to
that chapter.

Nothing here carries a workbook default. A drone project starts with its
fixed weights and mass fractions unfilled, and the sheet says so; the only
defaults are factors whose neutral value is a statement of fact (an
installation factor of one adds nothing, a load factor of one draws no
generator power).
"""

from dataclasses import dataclass
from enum import Enum


class UasSizingError(ValueError):
    """Raised when the inputs cannot produce a physically meaningful result."""


class PropulsionType(str, Enum):
    """The propulsion families chapter 3 sizes.

    Reciprocating covers turboprops too: both are fuel-burning shaft-power
    generators driving a propeller, and share Eq. 3.6 and Eq. 3.24–3.27.
    """

    RECIPROCATING = "reciprocating"
    JET = "jet"
    BATTERY = "battery"


class MissionObjective(str, Enum):
    RANGE = "range"
    ENDURANCE = "endurance"


@dataclass(frozen=True)
class FixedWeights:
    """Weights that do not scale with take-off weight, lb. Eq. 3.17."""

    payload_lb: float
    avionics_lb: float
    other_lb: float = 0.0


@dataclass(frozen=True)
class ScalingFractions:
    """Mass fractions taken from similar aircraft. Eq. 3.4 and Eq. 3.10."""

    structure: float
    subsystems: float


@dataclass(frozen=True)
class Propulsion:
    """How the propulsion group is sized.

    Either the propulsion mass fraction is entered directly (from a similar
    aircraft, as Example 3.2 does), or it is derived from the aircraft's
    required power-to-weight and the specific power of each component
    (Eq. 3.6, 3.7, 3.9). A fixed, already-chosen engine is the third case,
    Eq. 3.21: its weight is known and moves into the fixed weights.

    All power-to-weight ratios are in hp/lb; thrust-to-weight is
    dimensionless. A component that is folded into another (Example 3.1
    counts the propeller inside the powerplant) is left at None.
    """

    type: PropulsionType
    mass_fraction: float | None = None

    # Rubber-engine sizing.
    aircraft_power_to_weight: float | None = None
    aircraft_thrust_to_weight: float | None = None
    install_factor: float = 1.0
    powerplant_power_to_weight: float | None = None
    powerplant_thrust_to_weight: float | None = None
    propeller_power_to_weight: float | None = None
    motor_power_to_weight: float | None = None
    controller_power_to_weight: float | None = None

    # Fixed-engine sizing.
    fixed_weight_lb: float | None = None
    fixed_power_hp: float | None = None
    fixed_thrust_lbf: float | None = None


@dataclass(frozen=True)
class Mission:
    """The single sizing segment. Eq. 3.24–3.27, 3.32–3.35, 3.52–3.54."""

    objective: MissionObjective
    range_nm: float | None = None
    endurance_h: float | None = None
    airspeed_kt: float | None = None
    lift_to_drag: float | None = None
    # f_Load: multiplies the fuel consumption to pay for generator, cooling
    # fan and other non-propulsive loads. One draws nothing.
    load_factor: float = 1.0


@dataclass(frozen=True)
class FuelPerformance:
    """A shaft-power engine driving a propeller."""

    bsfc_lb_per_hp_h: float
    propeller_efficiency: float


@dataclass(frozen=True)
class JetPerformance:
    tsfc_per_h: float


@dataclass(frozen=True)
class BatteryPerformance:
    """A battery feeding a motor, controller and propeller. Eq. 3.43, 3.48."""

    specific_energy_wh_per_kg: float
    battery_efficiency: float
    usable_fraction: float
    propeller_efficiency: float
    motor_efficiency: float
    controller_efficiency: float
    gearbox_efficiency: float = 1.0
    distribution_efficiency: float = 1.0


@dataclass(frozen=True)
class Energy:
    """How the energy mass fraction is found.

    A directly entered fraction wins over the mission; otherwise the mission
    and the performance block matching the propulsion type produce it.
    """

    mass_fraction: float | None = None
    mission: Mission | None = None
    fuel: FuelPerformance | None = None
    jet: JetPerformance | None = None
    battery: BatteryPerformance | None = None


@dataclass(frozen=True)
class UasSizingInputs:
    fixed_weights: FixedWeights
    fractions: ScalingFractions
    propulsion: Propulsion
    energy: Energy
    # Raymer Table 3.1 category, for the statistical comparison. None skips it.
    raymer_category: str | None = None


@dataclass(frozen=True)
class WeightBreakdown:
    """Every term of Eq. 3.3 at the solved take-off weight, lb."""

    takeoff_lb: float
    payload_lb: float
    avionics_lb: float
    other_lb: float
    structure_lb: float
    subsystems_lb: float
    propulsion_lb: float
    energy_lb: float
    # Everything that is not payload or energy.
    empty_lb: float


@dataclass(frozen=True)
class SweepPoint:
    """One point of the Fig. 3.6 curve: take-off weight against energy fraction."""

    energy_mass_fraction: float
    takeoff_lb: float


@dataclass(frozen=True)
class EmptyWeightCheck:
    """Raymer's statistical empty-weight fraction against this design's.

    Both are evaluated at the take-off weight the mass fractions solved, so
    this compares a fraction with a fraction and nothing is extrapolated.

    Raymer's Eq. 3.4 closure is deliberately not used. It divides the crew and
    payload weight by what the empty and fuel fractions leave, and an unmanned
    aircraft has no crew, so for a drone whose sensor is its avionics the
    numerator goes to zero and the solve walks to the singularity where the
    weight is unbounded. It returns a plausible-looking number there rather
    than failing, which is the worst way to be wrong.

    The two empty weights mean the same thing: Raymer counts structure,
    engines, gear, fixed equipment and avionics, which is exactly what is left
    here once payload and stored energy come out."""

    category: str
    a: float
    c: float
    #: A·W0^C at the solved weight — what the statistics expect of this class.
    statistical_fraction: float
    #: What the entered mass fractions actually add up to.
    design_fraction: float


@dataclass(frozen=True)
class UasSizingResult:
    propulsion_mass_fraction: float
    energy_mass_fraction: float
    structure_mass_fraction: float
    subsystems_mass_fraction: float
    # The denominator's sum; feasible only below one. Eq. 3.18.
    scaling_fraction_sum: float
    weight_escalation_factor: float
    fixed_weight_lb: float
    weights: WeightBreakdown
    empty_weight_fraction: float
    # What the take-off weight asks of the powerplant. Example 3.1.
    required_power_hp: float | None
    required_thrust_lbf: float | None
    # For a fixed engine, what it actually delivers per pound of aircraft.
    installed_power_to_weight: float | None
    installed_thrust_to_weight: float | None
    # Battery only: pack mass and the energy the mission can draw from it.
    battery_mass_kg: float | None
    usable_energy_wh: float | None
    sweep: tuple[SweepPoint, ...]
    empty_weight_check: EmptyWeightCheck | None
    warnings: tuple[str, ...]
