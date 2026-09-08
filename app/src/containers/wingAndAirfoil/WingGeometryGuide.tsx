import type { KeyboardEvent } from "react";

type WingGuideMode = "sref" | "planform";

export type WingGuideField =
  | "wingLoading"
  | "aspectRatio"
  | "wingAreaM2"
  | "spanM"
  | "taperRatio"
  | "rootChordM"
  | "tipChordM"
  | "meanChordM"
  | "yMgcM"
  | "sweepLeadingEdgeDeg"
  | "sweepQuarterDeg"
  | "sweepHalfDeg"
  | "dihedralDeg"
  | "incidenceDeg"
  | "twistDeg";

interface WingGeometryGuideProps {
  mode: WingGuideMode;
  active?: WingGuideField | string | null;
  values?: Partial<Record<WingGuideField, string>>;
  onSelect?: (field: WingGuideField) => void;
}

const FIELD_LABELS: Record<WingGuideField, string> = {
  wingLoading: "W/S",
  aspectRatio: "AR",
  wingAreaM2: "Sref",
  spanM: "b",
  taperRatio: "lambda",
  rootChordM: "Cr",
  tipChordM: "Ct",
  meanChordM: "MAC",
  yMgcM: "y at MAC",
  sweepLeadingEdgeDeg: "LE sweep",
  sweepQuarterDeg: "c/4 sweep",
  sweepHalfDeg: "c/2 sweep",
  dihedralDeg: "dihedral",
  incidenceDeg: "incidence",
  twistDeg: "twist",
};

const GUIDE_ROWS: Array<{
  field: WingGuideField;
  sref?: boolean;
  title: string;
  body: string;
}> = [
  {
    field: "wingLoading",
    sref: true,
    title: "Wing loading sets area",
    body: "For a fixed design weight, moving W/S left makes Sref larger; moving it right makes the wing smaller.",
  },
  {
    field: "aspectRatio",
    sref: true,
    title: "Aspect ratio sets span",
    body: "Once Sref is known, AR fixes the span scale. It still does not choose taper, sweep, root chord or tip chord.",
  },
  {
    field: "taperRatio",
    title: "Taper resolves root and tip chord",
    body: "Taper is tip chord divided by root chord. With Sref and AR carried in, it fixes the chord split.",
  },
  {
    field: "sweepLeadingEdgeDeg",
    title: "Sweep moves each chord aft",
    body: "Leading-edge sweep shifts the outboard leading edge and changes the visual planform.",
  },
  {
    field: "dihedralDeg",
    title: "Dihedral is a front-view angle",
    body: "The tip rises above the root in the front view. It is visible geometry before it is a stability derivative.",
  },
  {
    field: "twistDeg",
    title: "Twist is spanwise incidence change",
    body: "Negative twist is washout: the tip is rigged at lower incidence than the root.",
  },
];

function display(
  field: WingGuideField,
  values: WingGeometryGuideProps["values"],
) {
  return values?.[field]
    ? `${FIELD_LABELS[field]} = ${values[field]}`
    : FIELD_LABELS[field];
}

function selectableProps(
  field: WingGuideField,
  active: WingGeometryGuideProps["active"],
  onSelect: WingGeometryGuideProps["onSelect"],
) {
  const selected = active === field;
  return {
    className: selected ? "text-accent" : "text-ink",
    onClick: () => onSelect?.(field),
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(field);
      }
    },
    role: "button",
    tabIndex: 0,
    "aria-pressed": selected,
  } as const;
}

function Dimension({
  field,
  active,
  values,
  onSelect,
  labelX,
  labelY,
  path,
  textAnchor = "middle",
}: {
  field: WingGuideField;
  active?: WingGeometryGuideProps["active"];
  values?: WingGeometryGuideProps["values"];
  onSelect?: WingGeometryGuideProps["onSelect"];
  labelX: number;
  labelY: number;
  path: string;
  textAnchor?: "start" | "middle" | "end";
}) {
  const selected = active === field;
  return (
    <g {...selectableProps(field, active, onSelect)}>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={selected ? 2.4 : 1}
      />
      <text
        fill="currentColor"
        fontSize="13"
        fontWeight={selected ? 600 : 400}
        textAnchor={textAnchor}
        x={labelX}
        y={labelY}
      >
        {display(field, values)}
      </text>
    </g>
  );
}

export default function WingGeometryGuide({
  mode,
  active = null,
  values = {},
  onSelect,
}: WingGeometryGuideProps) {
  const srefMode = mode === "sref";
  const wingFill = active === "wingLoading" || active === "wingAreaM2";
  const solvedSizing = values.wingAreaM2
    ? "SOLVED SIZING"
    : "SYMBOLIC UNTIL SOLVED";
  const status = srefMode ? solvedSizing : "CURRENT ENTRIES";

  return (
    <section className="rounded-none border border-rule-mid bg-field">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule-mid px-4 py-3">
        <h3 className="font-mono text-label font-medium tracking-label text-ink-label">
          WING GEOMETRY GUIDE
        </h3>
        <span className="font-mono text-label tracking-band text-ink-faint">
          {status} · NOT TO SCALE
        </span>
      </div>

      <svg
        aria-label="Trapezoidal wing reference guide"
        className="block w-full"
        role="img"
        viewBox="0 0 520 330"
      >
        <rect fill="#fff" height="330" width="520" />
        <path
          d="M96 82L444 126L444 222L96 254Z"
          fill={wingFill ? "#fdece7" : "#f4f2ee"}
          stroke="#14171a"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path
          d="M96 82V254M96 82L444 126M96 254L444 222"
          fill="none"
          stroke="#14171a"
          strokeDasharray="6 6"
          strokeOpacity="0.38"
        />
        <path
          d="M182 94V266"
          fill="none"
          stroke="#14171a"
          strokeDasharray="5 5"
          strokeOpacity="0.65"
        />
        <path d="M96 125L444 160" stroke="#14171a" strokeOpacity="0.5" />
        <path d="M96 168L444 184" stroke="#14171a" strokeOpacity="0.35" />

        <Dimension
          active={active}
          field="spanM"
          labelX={270}
          labelY={48}
          onSelect={onSelect}
          path="M96 59V73M444 59V113M96 66H444"
          values={values}
        />
        <Dimension
          active={active}
          field="rootChordM"
          labelX={58}
          labelY={173}
          onSelect={onSelect}
          path="M75 82H90M75 254H90M82 82V254"
          values={values}
        />
        <Dimension
          active={active}
          field="tipChordM"
          labelX={482}
          labelY={178}
          onSelect={onSelect}
          path="M450 126H467M450 222H467M460 126V222"
          values={values}
        />
        <Dimension
          active={active}
          field="meanChordM"
          labelX={214}
          labelY={185}
          onSelect={onSelect}
          path="M214 102V244"
          values={values}
        />
        <Dimension
          active={active}
          field="yMgcM"
          labelX={155}
          labelY={289}
          onSelect={onSelect}
          path="M96 274V286M214 274V286M96 282H214"
          values={values}
        />
        <Dimension
          active={active}
          field="sweepLeadingEdgeDeg"
          labelX={246}
          labelY={116}
          onSelect={onSelect}
          path="M137 82C139 98 152 105 166 103"
          values={values}
        />
        <Dimension
          active={active}
          field="taperRatio"
          labelX={376}
          labelY={246}
          onSelect={onSelect}
          path="M366 236L420 225"
          values={values}
        />
        {srefMode ? (
          <>
            <Dimension
              active={active}
              field="wingLoading"
              labelX={318}
              labelY={201}
              onSelect={onSelect}
              path="M278 192H358"
              values={values}
            />
            <Dimension
              active={active}
              field="aspectRatio"
              labelX={318}
              labelY={70}
              onSelect={onSelect}
              path="M301 61H335"
              values={values}
            />
          </>
        ) : null}
      </svg>

      <div className="border-t border-rule-hair px-4 py-3">
        <p className="mb-3 text-note leading-5 text-ink-muted">
          {srefMode
            ? "Sref sizing can confirm reference area and span scale. Taper, sweep, root chord, tip chord and MAC remain symbolic until the wing geometry entries are resolved."
            : "This guide follows the current wing entries. Several carried quantities on this sheet are still seeded, so treat the readouts as current working geometry until their owners confirm them."}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {GUIDE_ROWS.filter((row) => !srefMode || row.sref).map((row) => (
            <button
              aria-pressed={active === row.field}
              className={`border px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                active === row.field
                  ? "border-accent bg-accent-wash text-accent-dark"
                  : "border-rule text-ink"
              }`}
              key={row.field}
              onClick={() => onSelect?.(row.field)}
              type="button"
            >
              <span className="block font-mono text-label tracking-band">
                {row.title}
              </span>
              <span className="mt-1 block text-note leading-5 text-ink-muted">
                {row.body}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
