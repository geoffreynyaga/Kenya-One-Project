/**
 * Field catalogue for the Performance Sizing sheet (03 MISSION).
 *
 * Same four-kind split as the Sref sheet, adapted for a sink stage:
 *
 *   choice    typed on this sheet — the mission requirements
 *   carried   produced by another stage or an external workbook; read-only
 *             here, because this stage consumes and exports nothing
 *   derived   a formula over carried values; read-only, caption shows it
 *
 * The external-workbook seeds (V_LOF, CD_TO, CL_TO, climb/cruise speed,
 * eta_p) are editable even though they are "carried": their source workbooks
 * ([1]take-off, [1]climb) are not ported yet, so until they arrive through
 * the API someone has to be able to correct them by hand. The caption says
 * where each seed came from.
 *
 * Provenance is the "PERFORMANCE SIZING " sheet cell in
 * `spreadsheets/1. initial sizing.xlsx` unless another sheet is named.
 */

export type MissionField =
  | "groundRun"
  | "altitude"
  | "turnLoadFactor"
  | "rateOfClimb"
  | "serviceCeiling"
  | "climbSpeed"
  | "cruiseSpeed"
  | "propEfficiencyAltitude"
  | "liftoffSpeed"
  | "cdTakeoff"
  | "clTakeoff"
  | "rollingFriction"
  | "mtow"
  | "cd0"
  | "aspectRatio"
  | "stallSpeed"
  | "desiredWingLoading"
  | "wingArea"
  | "oswaldEfficiency"
  | "inducedDragFactor"
  | "sigma"
  | "sigmaServiceCeiling";

export type FieldSource = "choice" | "carried" | "derived" | "seed";

export interface FieldSpec {
  field: MissionField;
  label: string;
  unit?: string;
  source: FieldSource;
  /** Workbook cell this field reproduces. */
  cell: string;
  /** For `carried`: the sheet or workbook that produces the value. */
  origin?: string;
  /** For `derived`: the formula, shown under the value. */
  formula?: string;
  /** What the number means and why it matters. */
  body: string;
  /** Ranges a reviewer would expect. */
  typical?: string;
  /** Where the range or formula comes from. */
  cite?: string;
}

/** The mission requirements — the only numbers this sheet asks you for. */
export const requirementFields: FieldSpec[] = [
  {
    field: "turnLoadFactor",
    label: "Turn load factor",
    unit: "n",
    source: "choice",
    cell: "B19",
    body: "Load factor held in a constant-velocity level turn. Sets how hard the turn constraint pulls: T/W grows with n² through the induced term.",
    typical: "1.4 for a 30° bank at modest speed; aerobatic designs run 3+.",
    cite: "Raymer §5.3.3, Gudmundsson §5.4.1",
  },
  {
    field: "rateOfClimb",
    label: "Rate of climb",
    unit: "fpm",
    source: "choice",
    cell: "B20",
    body: "Sea-level rate of climb the aircraft must sustain at the climb speed. Usually the binding constraint for a lightly loaded twin — here it is what sizes the power.",
    typical: "Light twin: 1,000–1,600 fpm.",
    cite: "Raymer §5.3.4, Gudmundsson §5.4.2",
  },
  {
    field: "climbSpeed",
    label: "Climb speed",
    unit: "kt",
    source: "seed",
    cell: "B21",
    body: "Best-rate-of-climb speed the climb requirement is evaluated at. Seeded by hand until the climb sheet is part of the app.",
    typical: "≈ 1.1–1.2 × stall speed.",
    origin: "TAKE-OFF WB · climb B19",
  },
  {
    field: "groundRun",
    label: "Ground run",
    unit: "ft",
    source: "choice",
    cell: "B12",
    body: "Take-off ground run the energy-method constraint must achieve from brakes release to liftoff.",
    typical: "800–1,500 ft for a light twin off pavement.",
    cite: "Raymer §5.3.5, Gudmundsson §5.4.3",
  },
  {
    field: "serviceCeiling",
    label: "Service ceiling",
    unit: "ft",
    source: "choice",
    cell: "B23",
    body: "Altitude at which the aircraft can still climb at a useful rate. The ceiling constraint is evaluated at the density up here.",
    typical: "This design: 25,000 ft, pressurised-class altitude for an unpressurised cabin.",
  },
  {
    field: "altitude",
    label: "Cruise altitude",
    unit: "ft",
    source: "choice",
    cell: "B13",
    body: "Altitude the cruise and turn constraints are evaluated at; sets the density ratio used throughout.",
    typical: "8,000–12,000 ft for an unpressurised piston twin.",
  },
  {
    field: "propEfficiencyAltitude",
    label: "Prop efficiency",
    unit: "ηp",
    source: "seed",
    cell: "B26",
    body: "Propeller efficiency at cruise altitude. Converts thrust required into brake horsepower. Seeded by hand until the take-off sheet is part of the app.",
    typical: "0.70–0.80 for a constant-speed prop.",
    origin: "TAKE-OFF WB · G16",
  },
];

/**
 * Values other stages already produced. Read-only: this stage is a sink
 * (domain/stages) and nothing here flows back upstream.
 */
export const carriedFields: FieldSpec[] = [
  {
    field: "mtow",
    label: "Max take-off weight",
    unit: "lbf",
    source: "carried",
    cell: "B5",
    origin: "MTOW & WEIGHTS · I32",
    body: "The gross weight every T/W and BHP figure on this sheet is scaled by.",
  },
  {
    field: "cd0",
    label: "Parasite drag coefficient",
    unit: "CDmin",
    source: "carried",
    cell: "B6",
    origin: "DRAG ANALYSIS · E15",
    body: "Clean parasite drag from the drag build-up. CAUTION: it closes the CD0 ⇄ AREA loop — this sheet sizes power against a wing the drag was computed from.",
    typical: "Clean GA airframe: 0.020–0.035.",
  },
  {
    field: "aspectRatio",
    label: "Aspect ratio",
    unit: "AR",
    source: "carried",
    cell: "B7",
    origin: "SREF · B17",
    body: "Span² over area, from the Sref sheet.",
    typical: "6–10 for this class.",
  },
  {
    field: "rollingFriction",
    label: "Rolling friction",
    unit: "μ",
    source: "carried",
    cell: "B8",
    origin: "SREF · B30",
    body: "Rolling resistance during the ground run.",
    typical: "0.03 typical on pavement (Raymer §6.5); 0.04 used here.",
  },
  {
    field: "liftoffSpeed",
    label: "Liftoff speed",
    unit: "kt",
    source: "seed",
    cell: "B9",
    origin: "TAKE-OFF WB · S26",
    body: "Speed at the moment of liftoff; the ground-run constraint integrates to it.",
    typical: "≈ 1.1 × stall speed.",
  },
  {
    field: "cdTakeoff",
    label: "Take-off drag coefficient",
    unit: "CD·TO",
    source: "seed",
    cell: "B10",
    origin: "TAKE-OFF WB · M16",
    body: "Total drag coefficient in the take-off configuration, gear down, flaps set.",
  },
  {
    field: "clTakeoff",
    label: "Take-off lift coefficient",
    unit: "CL·TO",
    source: "seed",
    cell: "B11",
    origin: "TAKE-OFF WB · M17",
    body: "Lift coefficient with take-off flaps; offsets rolling friction in the ground-run constraint.",
    typical: "1.4–1.6.",
  },
  {
    field: "cruiseSpeed",
    label: "Cruise airspeed",
    unit: "ktas",
    source: "seed",
    cell: "B22",
    origin: "TAKE-OFF WB · B16",
    body: "Speed the cruise and turn constraints must hold at the cruise altitude.",
    typical: "Matches the Sref Vmax requirement when the design is honest.",
  },
  {
    field: "stallSpeed",
    label: "Stall speed",
    unit: "KCAS",
    source: "carried",
    cell: "B29",
    origin: "SREF · B11",
    body: "Reference stall speed for the stall-sensitivity figure.",
    typical: "61 KCAS per 14 CFR §23.49.",
  },
  {
    field: "desiredWingLoading",
    label: "Desired wing loading",
    unit: "lb/ft²",
    source: "carried",
    cell: "B25",
    origin: "SREF · K3",
    body: "The W/S the matching plot produced. The vertical rule on every figure sits here — this sheet checks that point, it does not move it.",
  },
  {
    field: "wingArea",
    label: "Wing area",
    unit: "ft²",
    source: "derived",
    cell: "B28",
    formula: "MTOW ÷ desired W/S",
    body: "Reference area that follows from the desired wing loading.",
  },
];

/** Consequences of the carried values, computed on this sheet. Read-only. */
export const derivedFields: FieldSpec[] = [
  {
    field: "oswaldEfficiency",
    label: "Oswald span efficiency",
    unit: "e",
    source: "derived",
    cell: "B14",
    formula: "1.78(1 − 0.045·AR^0.68) − 0.64",
    body: "Raymer's straight-wing estimate, computed here from aspect ratio alone. Deliberately independent of Wing & Airfoil's fitted value that Sref uses — agreement between the two is itself a check.",
    typical: "0.7–0.85 for propeller aircraft.",
    cite: "Raymer eq. (12.49)",
  },
  {
    field: "inducedDragFactor",
    label: "Induced drag factor",
    unit: "k",
    source: "derived",
    cell: "B15",
    formula: "1 ÷ (3.142·AR·e)",
    body: "Induced drag factor. This sheet evaluates it with a literal 3.142 for pi rather than the full constant, so it differs from the same quantity elsewhere in the fifth decimal.",
    typical: "0.04–0.06.",
  },
  {
    field: "sigma",
    label: "Density ratio at cruise",
    unit: "σ",
    source: "derived",
    cell: "B18",
    formula: "ρ_alt ÷ ρ₀",
    body: "Density ratio at the cruise altitude; scales the cruise, turn and normalisation terms.",
  },
  {
    field: "sigmaServiceCeiling",
    label: "Density ratio at ceiling",
    unit: "σ",
    source: "derived",
    cell: "B27",
    formula: "ρ_SC ÷ ρ₀",
    body: "Density ratio at the service ceiling; drives the ceiling constraint.",
  },
];
