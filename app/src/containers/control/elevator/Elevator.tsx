/*
 * Control 02 — Elevator. Sized to rotate the aeroplane at take-off, then
 * checked against the elevator needed to trim it at every speed and loading.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { elevator, elevatorWarnings } from "./elevatorCompute";
import { EntryField, useElevatorSheet } from "./useElevatorSheet";
import { TrimPoint } from "./utils";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

const nf = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const q = (value: number, unit: string, digits = 0) =>
  Number.isFinite(value) ? `${nf(value, digits)} ${unit}` : "—";

const axis = (text: string) => ({
  title: { text },
  gridcolor: tokens.colors.rule.grid,
  zerolinecolor: tokens.colors.rule.DEFAULT,
});

const figureLayout = (x: string, y: string, left = 62) => ({
  autosize: true,
  height: 290,
  margin: { l: left, r: 14, t: 10, b: 50 },
  paper_bgcolor: tokens.colors.field,
  plot_bgcolor: tokens.colors.field,
  font: { family: MONO, size: 10, color: tokens.colors.ink.label },
  showlegend: true,
  legend: { orientation: "h" as const, y: -0.3 },
  xaxis: axis(x),
  yaxis: axis(y),
});

function Figure({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        {title}
      </figcaption>
      <div className="p-3">{children}</div>
      <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
        {caption}
      </p>
    </figure>
  );
}

interface EntrySpec extends HintSpec {
  field: EntryField;
  unit?: string;
}

const SURFACE_FIELDS: EntrySpec[] = [
  {
    field: "maxDeflectionDeg",
    label: "Max deflection",
    unit: "°",
    cell: "B1",
    body: "How far the elevator throws, trailing edge up. Negative, because up-elevator is a negative deflection by convention and it is what rotates the nose.",
    typical: "−20 to −25°.",
  },
  {
    field: "chordFraction",
    label: "Chord fraction",
    unit: "c",
    cell: "B29",
    body: "Elevator chord as a fraction of the tailplane's. It should follow from the effectiveness the rotation demands rather than be picked independently.",
    typical: "0.30–0.45.",
  },
  {
    field: "spanFraction",
    label: "Span fraction",
    unit: "b",
    cell: "B40",
    body: "How much of the tail span the elevator covers. One means the whole tail hinges, which is usual when there is no trim tab.",
    typical: "0.9–1.0.",
  },
];

const ROTATION_FIELDS: EntrySpec[] = [
  {
    field: "thrustN",
    label: "Thrust at rotation",
    unit: "N",
    cell: "B13",
    body: "Total thrust from all engines as the nose comes up. It takes a lever about the wheels, so it pitches the aeroplane as well as accelerating it.",
  },
  {
    field: "pitchAccelerationDegS2",
    label: "Pitch acceleration",
    unit: "°/s²",
    cell: "E12",
    body: "How briskly the nose is asked to come up. The tail has to supply this on top of balancing everything else, and it is what turns the sizing from a static balance into a dynamic one.",
    typical: "8–12°/s² for a light aeroplane.",
  },
];

const GEOMETRY_FIELDS: EntrySpec[] = [
  {
    field: "mainGearXM",
    label: "Main wheels, x",
    unit: "m",
    cell: "B17",
    body: "The datum. Everything rotates about this point, so it is where all the moments are taken.",
  },
  {
    field: "cgXM",
    label: "Centre of gravity, x",
    unit: "m",
    cell: "B18",
    body: "Ahead of the wheels, which is what keeps the aeroplane sitting on its nosewheel and what the elevator has to lift.",
  },
  {
    field: "wingAcXM",
    label: "Wing AC, x",
    unit: "m",
    cell: "B21",
    body: "Where the wing and fuselage lift acts, measured from the wheels.",
  },
  {
    field: "tailAcXM",
    label: "Tail AC, x",
    unit: "m",
    cell: "B24",
    body: "Where the tail load acts. It is the lever the elevator works on, so it matters more than any other length here.",
  },
  {
    field: "cgZM",
    label: "Centre of gravity, z",
    unit: "m",
    cell: "B22",
    body: "Height of the centre of gravity above the wheels. With the acceleration it makes an inertial pitching moment.",
  },
  {
    field: "dragZM",
    label: "Drag line, z",
    unit: "m",
    cell: "B19",
    body: "Height the airframe drag acts at.",
  },
  {
    field: "thrustZM",
    label: "Thrust line, z",
    unit: "m",
    cell: "B23",
    body: "Height the thrust acts at. Above the wheels it pitches the nose down as power comes on.",
  },
  {
    field: "mainGearZM",
    label: "Wheels, z",
    unit: "m",
    cell: "B20",
    body: "Zero by construction — it is the datum the heights are measured from.",
  },
  {
    field: "cgArmM",
    label: "CG from the leading edge",
    unit: "m",
    cell: "H16",
    body: "How far back the centre of gravity sits along the chord. With the aerodynamic centre below it, it sets the static stability.",
  },
  {
    field: "acArmM",
    label: "AC from the leading edge",
    unit: "m",
    cell: "H17",
    body: "The same for the aerodynamic centre. The distance between the two is the stability margin.",
  },
  {
    field: "forwardTailArmM",
    label: "Tail arm, forward CG",
    unit: "m",
    cell: "P38",
    body: "The tail arm when the aeroplane is loaded as far forward as it may be. Longer, since the centre of gravity has moved away from the tail.",
  },
  {
    field: "forwardCgToAcM",
    label: "CG to AC, forward",
    unit: "m",
    cell: "T38",
    body: "The stability margin at the forward limit. Larger, which is why the forward loading needs more elevator to trim.",
  },
];

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
  digits?: number;
}

export default function Elevator() {
  const sheet = useElevatorSheet();
  const { inputs } = sheet;

  const result = useMemo(() => elevator(inputs), [inputs]);
  const warnings = useMemo(
    () => elevatorWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      label: "Design weight",
      unit: "kg",
      value: result.massKg,
      digits: 1,
      cell: "Aileron!B5",
      origin: "SHEET 01",
      body: "Maximum take-off mass. It sets both the weight taking a lever about the wheels and the inertia the nose has to be swung through.",
    },
    {
      label: "Wing area",
      unit: "m²",
      value: inputs.wingAreaM2,
      digits: 3,
      cell: "Aileron!B7",
      origin: "SHEET 02",
      body: "Reference area.",
    },
    {
      label: "Mean chord",
      unit: "m",
      value: inputs.meanChordM,
      digits: 4,
      cell: "Aileron!B15",
      origin: "SHEET 02",
      body: "The length every pitching moment is non-dimensionalised on.",
    },
    {
      label: "Rotation speed",
      unit: "m/s",
      value: inputs.rotationSpeedMps,
      digits: 3,
      cell: "B10",
      origin: "SHEET 02",
      body: "The nose comes up at the stall speed. It is the slowest the tail ever has to work, which is what makes rotation the sizing case.",
    },
    {
      label: "CLα wing",
      unit: "1/rad",
      value: inputs.wingLiftSlopePerRad,
      digits: 4,
      cell: "Aileron!B11",
      origin: "SHEET 06",
      body: "Lift per radian of wing incidence. It appears in the trim solution and in the downwash the tail sees.",
    },
    {
      label: "CL at zero incidence",
      value: inputs.liftAtZeroIncidence,
      digits: 4,
      cell: "B7",
      origin: "SHEET 06",
      body: "The lift a cambered wing makes with its chord level. The tail trims against it at every speed.",
    },
    {
      label: "Cm wing and body",
      value: inputs.wingMomentCoefficient,
      digits: 5,
      cell: "E3",
      origin: "SHEET 06",
      body: "The wing's own nose-down pitching moment, scaled from the section's onto the wing's lift slope.",
    },
    {
      label: "Wing incidence",
      unit: "°",
      value: inputs.wingIncidenceDeg,
      digits: 2,
      cell: "E4",
      origin: "SHEET 06",
      body: "How the wing is rigged relative to the fuselage. It sets the downwash the tail flies in.",
    },
    {
      label: "CD0, gear and flap",
      value: inputs.takeoffDragCoefficient,
      digits: 5,
      cell: "B5",
      origin: "SHEET 02",
      body: "Parasite drag on the ground roll, wheels down and take-off flap out.",
    },
    {
      label: "CL, ground roll",
      value: inputs.takeoffLiftCoefficient,
      digits: 4,
      cell: "E7",
      origin: "TAKE-OFF",
      body: "Lift the wing makes in the ground attitude. It takes weight off the wheels before the nose ever moves.",
    },
    {
      label: "Ground-run coefficient",
      value: inputs.groundRunCoefficient,
      digits: 5,
      cell: "B11",
      origin: "SHEET 02",
      body: "The drag coefficient less the rolling friction times the lift coefficient — a grouping from the ground-run equation, used on this sheet as though it were a friction coefficient.",
    },
    {
      label: "Rolling friction",
      value: inputs.rollingFriction,
      digits: 3,
      cell: "Sref!B30",
      origin: "SHEET 02",
      body: "What the tyres actually resist with, for comparison with the line above.",
    },
    {
      label: "Tail area",
      unit: "m²",
      value: inputs.horizontalTailAreaM2,
      digits: 3,
      cell: "Aileron!B8",
      origin: "AIRFRAME",
      body: "Horizontal tail area. The elevator is a fraction of it.",
    },
    {
      label: "Tail aspect ratio",
      value: inputs.horizontalTailAspectRatio,
      digits: 2,
      cell: "Aileron!B17",
      origin: "AIRFRAME",
      body: "Sets the tail's own lift-curve slope and its span.",
    },
    {
      label: "Clα tail section",
      unit: "1/°",
      value: inputs.tailSectionLiftSlopePerDeg,
      digits: 4,
      cell: "H2",
      origin: "AIRFRAME",
      body: "Section lift slope of the tailplane, usually a symmetric section.",
    },
    {
      label: "Tail incidence",
      unit: "°",
      value: inputs.tailIncidenceDeg,
      digits: 4,
      cell: "H4",
      origin: "AIRFRAME",
      body: "How the tailplane is rigged. Slightly negative, so it carries a download in the cruise.",
    },
    {
      label: "Tail efficiency",
      value: inputs.tailEfficiency,
      digits: 3,
      cell: "H6",
      origin: "AIRFRAME",
      body: "How much of the free-stream dynamic pressure reaches the tail, after the wing and body have taken their share.",
    },
    {
      label: "Stall angle",
      unit: "°",
      value: inputs.wingStallAngleDeg,
      digits: 1,
      cell: "E6",
      origin: "SHEET 06",
      body: "The wing's stalling angle. Rotation is taken two degrees short of it, and the tail's own stall is checked against the same figure.",
    },
    {
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKtas,
      digits: 1,
      cell: "B6",
      origin: "SHEET 02",
      body: "Where the trim is quoted.",
    },
    {
      label: "Cruise altitude",
      unit: "ft",
      value: inputs.cruiseAltitudeFt,
      digits: 0,
      cell: "cruise!B6",
      origin: "SHEET 02",
      body: "The second trim curve is flown here, where thinner air needs more elevator at the same speed.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    <label
      className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
      htmlFor={`el-${spec.field}`}
      key={spec.field}
      title={spec.label}
    >
      <span className="min-w-0 flex-1 truncate text-note text-ink-body">
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}
      </span>
      <Hint inputId={`el-${spec.field}`} spec={spec} />
      <input
        className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`el-${spec.field}`}
        inputMode="decimal"
        onChange={(event) =>
          sheet.setEntry(spec.field, Number(event.target.value))
        }
        value={inputs[spec.field]}
      />
    </label>
  );

  const carriedRow = (spec: CarriedSpec) => (
    <div
      className="flex items-baseline gap-2 py-[5px] pl-[16px] pr-[18px] shadow-carried"
      key={spec.label}
    >
      <span className="min-w-0 flex-1 truncate text-note text-ink-body">
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}
      </span>
      <Hint inputId={`el-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, spec.digits ?? 4)}
      </span>
    </div>
  );

  const worstTrim = [...result.trimSeaLevel, ...result.trimCruise].reduce(
    (most, point) =>
      Math.max(most, Math.abs(point.aftDeg), Math.abs(point.forwardDeg)),
    0
  );

  const summary: Array<[string, string]> = [
    ["ELEVATOR AREA", q(result.elevatorAreaM2, "m²", 3)],
    ["TAIL LOAD TO ROTATE", q(result.tailLoadN, "N", 0)],
    ["WORST TRIM", q(worstTrim, "°", 1)],
    ["AVAILABLE", q(Math.abs(inputs.maxDeflectionDeg), "°", 0)],
  ];

  const rotation: Array<[string, string, string, string]> = [
    [
      "Pitching inertia",
      q(result.pitchInertiaKgM2, "kg·m²", 0),
      "B2",
      "What the nose has to be swung through. It turns the pitch rate asked for into a moment the tail must supply on top of the balance.",
    ],
    [
      "Drag at rotation",
      q(result.dragAtRotationN, "N", 0),
      "H11",
      "Airframe drag with the gear and flap out, at the speed the nose comes up.",
    ],
    [
      "Wing lift at rotation",
      q(result.liftAtRotationN, "N", 0),
      "H12",
      "The wing is already carrying most of the weight before the nose moves, which is why the friction is small.",
    ],
    [
      "Ground friction",
      q(result.frictionN, "N", 0),
      "B14",
      "What the tyres hold back with, on the weight still on the wheels.",
    ],
    [
      "Acceleration",
      q(result.accelerationMps2, "m/s²", 3),
      "B15",
      "What is left of the thrust. It makes an inertial pitching moment through the height of the centre of gravity.",
    ],
    [
      "Wing and body moment",
      q(result.moments.aerodynamicNm, "N·m", 0),
      "E15",
      "The wing's own nose-down moment. Negative, and the tail has to carry it.",
    ],
    [
      "Weight moment",
      q(result.moments.weightNm, "N·m", 0),
      "E16",
      "Weight acting ahead of the wheels holds the nose down. It is the largest single term here.",
    ],
    [
      "Drag moment",
      q(result.moments.dragNm, "N·m", 0),
      "E17",
      "Drag acting above the wheels pitches the nose up, which helps.",
    ],
    [
      "Thrust moment",
      q(result.moments.thrustNm, "N·m", 0),
      "E18",
      "Thrust above the wheels pitches the nose down, which does not.",
    ],
    [
      "Wing lift moment",
      q(result.moments.liftNm, "N·m", 0),
      "E19",
      "Lift acting behind the wheels helps lift the nose.",
    ],
    [
      "Inertial moment",
      q(result.moments.accelerationNm, "N·m", 0),
      "E20",
      "The aeroplane accelerating forward with its mass above the wheels.",
    ],
    [
      "Tail load required",
      q(result.tailLoadN, "N", 0),
      "E22",
      "Everything left over, plus the moment to pitch at the rate asked for. Negative means the tail pushes down.",
    ],
    [
      "As a tail CL",
      nf(result.tailLiftCoefficient, 4),
      "E23",
      "That load as a lift coefficient on the tailplane. It is what the elevator has to produce.",
    ],
  ];

  const surface: Array<[string, string, string, string]> = [
    [
      "CLα tail",
      q(result.tailLiftSlopePerRad, "1/rad", 4),
      "H3",
      "The tailplane's own lift-curve slope, lifted from its section by its aspect ratio.",
    ],
    [
      "Downwash at zero lift",
      q(result.downwashAtZeroLiftRad * (180 / Math.PI), "°", 3),
      "H22",
      "How far the wing has already turned the air down before the tail sees it.",
    ],
    [
      "Downwash slope",
      nf(result.downwashSlope, 4),
      "H24",
      "How much of every degree the wing pitches through the tail loses to downwash. Nearly two-fifths here.",
    ],
    [
      "Tail angle of attack",
      q(result.tailAngleOfAttackDeg, "°", 3),
      "B26",
      "What the tailplane actually flies at, once rigging and downwash are accounted for.",
    ],
    [
      "Effectiveness required",
      nf(result.requiredEffectiveness, 4),
      "B27",
      "How much of a whole-tail incidence change the elevator must be worth to make the load rotation demands. The chord fraction should be read off a chart against this.",
    ],
    [
      "Zero-lift shift",
      q(result.zeroLiftShiftDeg, "°", 3),
      "B30",
      "How far full deflection moves the tail's zero-lift angle.",
    ],
    [
      "Tail volume coefficient",
      nf(result.tailVolumeCoefficient, 4),
      "B31",
      "Tail area times arm, over wing area times chord. The single number that says how much tail there is.",
    ],
    [
      "Cmα",
      q(result.momentSlopePerRad, "1/rad", 4),
      "G29",
      "How the pitching moment changes with incidence. Negative means the aeroplane is statically stable — it pitches back down when disturbed up.",
    ],
    [
      "CmδE",
      q(result.momentPerElevatorRad, "1/rad", 4),
      "B32",
      "Pitching moment per radian of elevator. This is the control power.",
    ],
    [
      "CLδE",
      q(result.liftPerElevatorRad, "1/rad", 4),
      "B33",
      "Lift per radian of elevator, on the whole aeroplane.",
    ],
    [
      "Elevator span",
      q(result.elevatorSpanM, "m", 4),
      "B41",
      "A fraction of the tail span.",
    ],
    [
      "Elevator chord",
      q(result.elevatorChordM, "m", 4),
      "E41",
      "A fraction of the tail chord.",
    ],
    [
      "Elevator area",
      q(result.elevatorAreaM2, "m²", 4),
      "B43",
      "The surface itself.",
    ],
  ];

  const tailCheck: Array<[string, string, string, string]> = [
    [
      "Angle of attack at rotation",
      q(result.rotationAngleOfAttackDeg, "°", 1),
      "J29",
      "The nose is brought up to two degrees short of the wing's stall.",
    ],
    [
      "Angle the tail sees",
      q(result.tailAngleAtRotationDeg, "°", 3),
      "J30",
      "Much less, because the wing turns the air down before it gets there.",
    ],
    [
      "Angle the tail stalls at",
      q(result.tailStallMarginDeg, "°", 1),
      "J31",
      "The section's stalling angle less the allowance for the body ahead of it.",
    ],
  ];

  const curve = (points: TrimPoint[], key: "aftDeg" | "forwardDeg") =>
    points.map((point) => point[key]);
  const speeds = result.trimSeaLevel.map((point) => point.speedKtas);

  const trimFigure = (points: TrimPoint[]) => (
    <Plot
      config={{ displayModeBar: false, responsive: true }}
      data={[
        {
          x: speeds,
          y: curve(points, "aftDeg"),
          mode: "lines+markers",
          line: { color: tokens.colors.ink.DEFAULT, width: 2 },
          marker: { size: 5 },
          name: "AFT CG",
        },
        {
          x: speeds,
          y: curve(points, "forwardDeg"),
          mode: "lines+markers",
          line: { color: tokens.colors.accent.DEFAULT, width: 2 },
          marker: { size: 5 },
          name: "FORWARD CG",
        },
        {
          x: [speeds[0], speeds[speeds.length - 1]],
          y: [inputs.maxDeflectionDeg, inputs.maxDeflectionDeg],
          mode: "lines",
          line: {
            color: tokens.colors.series.compare,
            width: 1,
            dash: "dash",
          },
          name: "AVAILABLE",
        },
      ]}
      layout={figureLayout("AIRSPEED  [KTAS]", "ELEVATOR  [°]", 58)}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Elevator sizing</h1>

      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-4 sm:gap-px">
        {summary.map(([label, value], index) => (
          <div
            className={`flex flex-col gap-[7px] bg-paper px-[18px] py-[11px] ${
              index === 0 ? "shadow-edited" : ""
            }`}
            key={label}
          >
            <span className="font-mono text-label tracking-tab text-ink-label">
              {label}
            </span>
            <span
              className={`font-mono text-readout font-medium leading-none ${
                index === 2 && worstTrim > Math.abs(inputs.maxDeflectionDeg)
                  ? "text-accent-dark"
                  : "text-ink"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 xl:grid-cols-[296px_minmax(560px,1fr)]">
        <form
          className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
            ELEVATOR DEFINITION
          </div>
          <InputSection
            count={SURFACE_FIELDS.length}
            open={sheet.openSections.surface}
            title="ENTRY · THE SURFACE"
            onToggle={(open) => sheet.toggleSection("surface", open)}
          >
            {SURFACE_FIELDS.map(entryRow)}
          </InputSection>
          <InputSection
            count={ROTATION_FIELDS.length}
            open={sheet.openSections.rotation}
            title="ENTRY · ROTATION"
            onToggle={(open) => sheet.toggleSection("rotation", open)}
          >
            {ROTATION_FIELDS.map(entryRow)}
          </InputSection>
          <InputSection
            count={GEOMETRY_FIELDS.length}
            open={sheet.openSections.geometry}
            title="ENTRY · WHERE THINGS SIT"
            onToggle={(open) => sheet.toggleSection("geometry", open)}
          >
            {GEOMETRY_FIELDS.map(entryRow)}
          </InputSection>
          <InputSection
            count={carried.length}
            open={sheet.openSections.carried}
            title="CARRIED · UPSTREAM"
            onToggle={(open) => sheet.toggleSection("carried", open)}
          >
            {carried.map(carriedRow)}
          </InputSection>
          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
            onClick={sheet.reset}
            type="button"
          >
            RESET ELEVATOR
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              CONTROL 02 / ELEVATOR
            </div>
            <h2 className="text-sheet">Rotating the nose, and holding it</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="Slow, the wing needs a high angle and the tail a large download to hold it, so the elevator is nearly hard over. As speed builds the same moment comes from far less deflection and the curves flatten towards zero. The forward loading asks for more, which is what sets the forward limit."
              title="TRIM · AT SEA LEVEL"
            >
              {trimFigure(result.trimSeaLevel)}
            </Figure>

            <Figure
              caption="The same aeroplane in thinner air. Every speed here is a true airspeed, so the dynamic pressure at a given reading is lower and the elevator has to work harder for the same moment — the whole family shifts down by several degrees."
              title="TRIM · AT CRUISE ALTITUDE"
            >
              {trimFigure(result.trimCruise)}
            </Figure>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                ROTATION · MOMENTS ABOUT THE WHEELS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {rotation.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`el-rot-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE SURFACE
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {surface.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`el-sur-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                DOES THE TAIL STILL FLY?
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {tailCheck.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`el-chk-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              <p
                className={`border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] ${
                  result.tailFlies ? "text-ink-muted" : "text-accent-dark"
                }`}
              >
                {result.tailFlies
                  ? "The tail is well short of its own stall when the nose comes up, which is what has to be true for the aeroplane to rotate at all."
                  : "The tail reaches its stalling angle as the nose comes up. It would let go at the moment it is most needed."}
              </p>
            </section>
          </div>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>TRIM · EVERY SPEED</span>
              <span className="font-normal text-ink-faint">
                {result.trimSeaLevel.length} speeds
              </span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    {[
                      ["V", "kt"],
                      ["q", "Pa"],
                      ["CL", ""],
                      ["δE aft", "°"],
                      ["δE fwd", "°"],
                      ["δE aft, cruise", "°"],
                      ["δE fwd, cruise", "°"],
                    ].map(([label, unit]) => (
                      <th className="px-3 py-2 font-medium" key={label}>
                        {label}
                        {unit ? (
                          <span className="ml-1 text-ink-faint">[{unit}]</span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {result.trimSeaLevel.map((point, index) => (
                    <tr key={point.speedKtas}>
                      {[
                        nf(point.speedKtas, 0),
                        nf(point.dynamicPressurePa, 0),
                        nf(point.cl, 3),
                        nf(point.aftDeg, 2),
                        nf(point.forwardDeg, 2),
                        nf(result.trimCruise[index].aftDeg, 2),
                        nf(result.trimCruise[index].forwardDeg, 2),
                      ].map((cell, column) => (
                        <td
                          className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]"
                          // eslint-disable-next-line react/no-array-index-key
                          key={column}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              NOTES
            </h3>
            <ul className="px-4 py-2">
              {warnings.map((warning) => (
                <li
                  className="flex gap-3 border-b border-rule-hair py-[9px] last:border-b-0"
                  key={warning.key}
                >
                  <span
                    className={`shrink-0 font-mono text-tag leading-none tracking-band ${
                      warning.severity === "defect"
                        ? "text-accent"
                        : "text-ink-faint"
                    }`}
                  >
                    {warning.severity === "defect" ? "DEFECT" : "CHECK"}
                  </span>
                  <span className="font-mono text-meta leading-[1.6] text-ink-muted">
                    {warning.message}
                    {warning.cell ? (
                      <span className="ml-2 inline-flex align-middle">
                        <Hint
                          inputId={`el-warn-${warning.key}`}
                          spec={{
                            label: "Where this comes from",
                            body: warning.message,
                            cell: warning.cell,
                          }}
                        />
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
