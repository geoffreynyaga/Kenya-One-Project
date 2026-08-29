export type FormField =
  | "altitude"
  | "serviceCeiling"
  | "clMax"
  | "stallSpeed"
  | "vmax"
  | "takeoffRun"
  | "rateOfClimb"
  | "ceilingRoc"
  | "cd0"
  | "aspectRatio"
  | "oswaldEfficiency"
  | "inducedDragFactor"
  | "ldMax"
  | "propEfficiencyCruise"
  | "propEfficiencyClimb"
  | "propEfficiencyTakeoff"
  | "clTakeoff"
  | "takeoffSpeed"
  | "takeoffGearDrag"
  | "rollingFriction"
  | "designWeight"
  | "taxiFraction"
  | "climbFraction"
  | "cruiseWeightRatio"
  | "cruiseSpeed"
  | "wingLoading"
  | "powerLoading"
  | "engineCount";

export type FormValues = Record<FormField, string>;

export const DERIVED_FIELDS = [
  "inducedDragFactor",
  "ldMax",
  "wingLoading",
] as const;

export type FieldSource = "choice" | "consequence" | "figure";

export interface FieldSpec {
  field: FormField;
  label: string;
  /** Symbol or unit shown after the label. */
  unit?: string;
  source: FieldSource;
  /** Workbook cell this field reproduces. */
  cell: string;
  /** For `carried`: the sheet that produces the value. */
  origin?: string;
  /** For `derived`: the formula, shown under the value. */
  formula?: string;
  /** What the number means and why it matters. */
  body: string;
  /** Ranges a reviewer would expect. */
  typical?: string;
  /** Where the range or formula comes from. */
  cite?: string;
  /**
   * Name of the shared quantity in `domain/atoms`, when this field is one.
   * Used to look the field up in the design loop registry.
   */
  quantity?: string;
}

export const requirementFields: FieldSpec[] = [
  {
    field: "clMax",
    label: "Max lift coefficient",
    unit: "CLmax",
    source: "choice",
    cell: "B10",
    body: "Maximum lift coefficient in the landing/stall configuration. With the stall speed it fixes the stall-limit wing loading — the vertical line on the matching plot.",
    typical: "GA with flaps deployed: 1.4–2.0.",
    cite: "Gudmundsson §9.5.9",
  },
  {
    field: "stallSpeed",
    label: "Stall speed",
    unit: "KCAS",
    source: "choice",
    cell: "B11",
    body: "Calibrated stall speed the design must not exceed. Everything right of the stall line on the plot stalls faster than this.",
    typical:
      "14 CFR Part 23 caps single-engine normal-category stall at 61 KCAS.",
    cite: "14 CFR §23.49",
  },
  {
    field: "vmax",
    label: "Maximum speed",
    unit: "kt",
    source: "choice",
    cell: "B14",
    body: "Level-flight top speed at cruise altitude. Drives the max-speed W/P curve: parasite drag rises with V³, so this constraint bites hardest at low wing loading.",
    typical: "Light piston twin: 150–200 kt.",
    cite: "Gudmundsson §3.2",
  },
  {
    field: "takeoffRun",
    label: "Take-off run",
    unit: "ft",
    source: "choice",
    cell: "B21",
    body: "Ground run available to reach lift-off speed. Usually the governing constraint on the left of the diagram.",
    typical: "Common Part 23 field-length target: ≤ 1,500 ft.",
    cite: "Gudmundsson §17.3.2",
  },
  {
    field: "rateOfClimb",
    label: "Rate of climb",
    unit: "fpm",
    source: "choice",
    cell: "G11",
    body: "Sea-level rate of climb at best-climb speed, at design gross weight.",
    typical: "Light twin: 1,000–1,600 fpm.",
    cite: "Gudmundsson §18.3",
  },
  {
    field: "serviceCeiling",
    label: "Service ceiling",
    unit: "ft",
    source: "choice",
    cell: "G15",
    body: "Altitude at which the aircraft can still manage the residual climb rate below. Sets the density ratio σ used in the ceiling curve.",
    typical: "Unpressurised GA: 14,000–25,000 ft.",
    cite: "Gudmundsson §18.3.12",
  },
  {
    field: "ceilingRoc",
    label: "Ceiling residual ROC",
    unit: "fpm",
    source: "choice",
    cell: "G18",
    body: "The climb rate that defines the ceiling. 100 fpm is the service-ceiling convention; 0 fpm would be the absolute ceiling.",
    typical: "100 fpm.",
    cite: "Gudmundsson §18.3.12",
  },
];

export const aerodynamicFields: FieldSpec[] = [
  {
    field: "cd0",
    quantity: "cd0",
    label: "Parasite drag coefficient",
    unit: "CD0",
    source: "consequence",
    cell: "B15",
    origin: "DRAG ANALYSIS · E15",
    body: "Zero-lift drag at cruise, built up component by component on the Drag Analysis sheet. Sets the flat part of the drag polar CD = CD0 + k·CL².",
    typical:
      "Clean GA airframe 0.020–0.035; fixed gear and struts add 0.005–0.015.",
    cite: "Raymer ch. 12",
  },
  {
    field: "aspectRatio",
    quantity: "aspectRatio",
    label: "Aspect ratio",
    unit: "AR",
    source: "choice",
    cell: "B17",
    body: "b²/S. Raising AR cuts induced drag and lifts L/Dmax, at the cost of span, wing structural weight and roll rate.",
    typical: "Light aircraft: 6–10.",
    cite: "Gudmundsson §9.2",
  },
  {
    field: "oswaldEfficiency",
    quantity: "oswaldEfficiency",
    label: "Oswald span efficiency",
    unit: "e",
    source: "consequence",
    cell: "B18",
    origin: "WING & AIRFOIL · M33",
    body: "How close the wing's spanwise lift distribution comes to elliptical. The Wing & Airfoil sheet fits it from Raymer's straight-wing expression e = 1.78(1 − 0.045·AR^0.68) − 0.64.",
    typical: "Propeller aircraft: 0.70–0.85.",
    cite: "Gudmundsson Eq. 9-89",
  },
  {
    field: "inducedDragFactor",
    label: "Induced drag factor",
    unit: "k",
    source: "consequence",
    cell: "B16",
    formula: "k = 1/(π·AR·e)",
    body: "Lift-induced drag constant in CD = CD0 + k·CL². Falls as aspect ratio or span efficiency rises, which is why it is computed rather than typed.",
    typical: "0.04–0.06 for this class.",
    cite: "Gudmundsson §15.2",
  },
  {
    field: "ldMax",
    label: "L/D maximum",
    source: "consequence",
    cell: "MTOW & WEIGHTS · B25",
    formula: "L/Dmax = 1/(2√(k·CD0))",
    body: "Best lift-to-drag ratio, reached where induced drag equals parasite drag. It scales the climb and ceiling curves and the Breguet cruise fraction.",
    typical: "Fixed-gear GA 10–14; clean retractable 14–17.",
    cite: "Gudmundsson Eq. 19-18",
  },
  {
    field: "propEfficiencyCruise",
    label: "Prop efficiency · cruise",
    unit: "ηp",
    source: "consequence",
    cell: "MTOW & WEIGHTS · B27",
    origin: "MTOW & WEIGHTS · B27",
    body: "Fraction of shaft power the propeller turns into thrust power at cruise. Appears in the Breguet range fraction and the max-speed curve.",
    typical: "Fixed-pitch metal prop ≈ 0.80; constant-speed 0.82–0.85.",
    cite: "Gudmundsson ch. 14",
  },
  {
    field: "propEfficiencyClimb",
    label: "Prop efficiency · climb",
    unit: "ηp",
    source: "choice",
    cell: "G12",
    body: "Prop efficiency at the climb condition. Lower than cruise: the blade sections run at a higher angle of attack than their design point.",
    typical: "0.65–0.75.",
    cite: "Gudmundsson ch. 14",
  },
  {
    field: "propEfficiencyTakeoff",
    label: "Prop efficiency · take-off estimate",
    unit: "ηp",
    source: "choice",
    cell: "B28",
    body: "Sizing estimate for low-speed propeller efficiency. Take-off later replaces it with the selected propeller model.",
    typical: "0.45–0.50 fixed-pitch climb; 0.35–0.45 fixed-pitch cruise; 0.45–0.60 constant-speed.",
    cite: "Gudmundsson §17.3.2",
  },
  {
    field: "clTakeoff",
    label: "Take-off lift coefficient",
    unit: "CL·TO",
    source: "consequence",
    cell: "B22",
    origin: "TAKE-OFF · M17",
    body: "Lift coefficient at lift-off with take-off flap. Feeds both the ground-roll drag CD_TO = CD0_TO + k·CL_TO² and the wheel-friction relief term.",
    typical: "Take-off flap setting: 1.4–1.6.",
    cite: "Gudmundsson §17.3",
  },
  {
    field: "takeoffSpeed",
    label: "Take-off speed",
    unit: "kt",
    source: "consequence",
    cell: "B23",
    origin: "TAKE-OFF · S26",
    body: "Lift-off speed VLOF, taken as 1.1 × the stall speed in the take-off configuration.",
    typical: "≈ 1.1 × Vs.",
    cite: "Gudmundsson Eq. 17-16",
  },
  {
    field: "takeoffGearDrag",
    label: "Fixed-gear drag add-on",
    unit: "ΔCD0",
    source: "choice",
    cell: "B24",
    body: "Extra parasite drag with gear down and take-off flaps out, added to CD0 for the ground roll only.",
    typical: "Fixed gear 0.005–0.015; retractable 0.",
    cite: "Raymer ch. 12",
  },
  {
    field: "rollingFriction",
    label: "Rolling friction",
    unit: "μ",
    source: "choice",
    cell: "B30",
    body: "Brakes-off rolling resistance between tyre and surface during the take-off roll.",
    typical:
      "Dry asphalt or concrete 0.03–0.05; hard turf 0.05; wet grass 0.08–0.10.",
    cite: "Gudmundsson Table 17-3",
  },
];

export const weightFields: FieldSpec[] = [
  {
    field: "designWeight",
    label: "Design gross weight",
    unit: "lb",
    source: "consequence",
    cell: "Table9 header",
    origin: "MTOW & WEIGHTS",
    body: "The weight the design point sizes against. Sref = W ÷ (W/S) and power = W ÷ (W/P), so this scales both outputs directly.",
    cite: "workbook: MTOW & WEIGHTS",
  },
  {
    field: "taxiFraction",
    label: "Taxi & take-off fraction",
    source: "consequence",
    cell: "MTOW & WEIGHTS · B19",
    origin: "MTOW & WEIGHTS · B19",
    body: "Mission weight remaining after engine start, taxi and take-off, as a fraction of ramp weight.",
    typical: "≈ 0.98.",
    cite: "Raymer Table 3.2",
  },
  {
    field: "climbFraction",
    label: "Climb fraction",
    source: "consequence",
    cell: "MTOW & WEIGHTS · B20",
    origin: "MTOW & WEIGHTS · B20",
    body: "Fraction remaining after the climb and acceleration to cruise altitude.",
    typical: "≈ 0.97.",
    cite: "Raymer Table 3.2",
  },
  {
    field: "cruiseWeightRatio",
    label: "Cruise weight ratio w6/w1",
    source: "consequence",
    cell: "MTOW & WEIGHTS · B28",
    origin: "MTOW & WEIGHTS · B28",
    body: "End-of-mission over start-of-mission weight: taxi × climb × cruise × descent × approach. The cruise term is the Breguet range fraction.",
    typical: "≈ 0.86 for this mission.",
    cite: "Raymer ch. 3",
  },
  {
    field: "cruiseSpeed",
    label: "Cruise speed",
    unit: "kt",
    source: "consequence",
    cell: "G6",
    origin: "TAKE-OFF · B16",
    body: "True cruise speed. Sets the cruise lift coefficient CLC = 2·W̄ / (ρalt · S · (Vc·1.688)²) reported in the derived block.",
    typical: "This class: 130–170 kt.",
  },
  {
    field: "altitude",
    label: "Cruise altitude",
    unit: "ft",
    source: "choice",
    cell: "B4",
    body: "Cruise altitude, converted to density by the troposphere fit ρalt = ρ₀·(1 − 6.8756e-6·h)^4.2561.",
    typical: "Unpressurised GA: 8,000–12,000 ft.",
    cite: "ISA troposphere model",
  },
];

export const pointFields: FieldSpec[] = [
  {
    field: "wingLoading",
    quantity: "wingArea",
    label: "Wing loading",
    unit: "lb/ft²",
    source: "consequence",
    cell: "D80 = K3",
    formula: "W/S = ½ρ₀·CLmax·(Vs·1.688)²",
    body: "The workbook parks the design point on the stall limit — the farthest right the diagram allows, which gives the smallest wing. Click anywhere in the feasible region on the plot to take it over.",
    typical: "Farther left means a bigger wing.",
    cite: "Gudmundsson §3.2",
  },
  {
    field: "powerLoading",
    label: "Power loading",
    unit: "lb/hp",
    source: "figure",
    cell: "D79",
    body: "Read off the matching plot. Higher means less installed power; it must sit below every constraint curve at the chosen wing loading.",
    typical: "Light piston twin: 10–14 lb/hp.",
    cite: "Gudmundsson §3.2",
  },
  {
    field: "engineCount",
    label: "Engines",
    unit: "NE",
    source: "choice",
    cell: "—",
    body: "Number of installed engines. Power per engine is the total requirement divided by this.",
    typical: "1 or 2.",
  },
];
