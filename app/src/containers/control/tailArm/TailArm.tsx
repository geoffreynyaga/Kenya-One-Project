/*
 * Control 01 — the tail arm.
 *
 * It comes before the three control-surface sheets because they all size
 * against it: the elevator needs the arm to work a pitching moment, and the
 * rudder needs it for yaw. Until this sheet existed each of them held its own
 * number, and the three disagreed.
 */
import Plotly from "plotly.js-basic-dist";
import { ReactNode } from "react";
import createPlotlyComponent from "react-plotly.js/factory";

import { FigureExplainer } from "../../../components/sheet/FigureExplainer";
import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { UntilDrawnTag } from "../../../components/sheet/UntilDrawnTag";
import tokens from "../../../design-tokens";
import { RAYMER_ARM_FRACTIONS, wettedAreaCurve } from "../../../domain/tailSizing";
import TailGeometry from "./TailGeometry";
import { TailArmGuide, TailVolumeGuide } from "./TailArmGuides";
import {
  Method,
  MethodKey,
  TailArmView,
  useTailArmSheet,
} from "./useTailArmSheet";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

const nf = (value: number, digits = 2) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value)
    : "—";

const axis = (text: string) => ({
  title: {
    text,
    font: { family: MONO, size: 11, color: tokens.colors.ink.label, weight: 500 },
    standoff: 12,
  },
  gridcolor: tokens.colors.rule.grid,
  zeroline: false,
});

const layoutFor = (x: string, y: string) => ({
  autosize: true,
  height: 420,
  margin: { l: 62, r: 14, t: 18, b: 96 },
  paper_bgcolor: tokens.colors.field,
  plot_bgcolor: tokens.colors.field,
  font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
  legend: { orientation: "h" as const, y: -0.42, x: 0 },
  xaxis: axis(x),
  yaxis: axis(y),
  hovermode: "closest" as const,
});

function Figure({
  body,
  children,
  id,
  title,
}: {
  body: string;
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption>
        <FigureExplainer body={body} id={id} label={title} />
      </figcaption>
      <div className="p-3">{children}</div>
    </figure>
  );
}

interface NumberFieldProps {
  spec: HintSpec & { untilDrawn?: string };
  id: string;
  value: number;
  onChange?: (next: number) => void;
  unit?: string;
}

function NumberField({ spec, id, value, onChange, unit }: NumberFieldProps) {
  const readOnly = onChange === undefined;
  return (
    <label
      className={`flex flex-wrap items-baseline gap-2 py-[5px] pr-[18px] ${
        readOnly ? "shadow-carried pl-[16px]" : "pl-[18px]"
      }`}
      htmlFor={id}
    >
      <span className="min-w-0 flex-1 text-note text-ink-body">
        {spec.label}
        {unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{unit}]
          </span>
        ) : null}
        {spec.untilDrawn ? <UntilDrawnTag quantity={spec.untilDrawn} /> : null}
      </span>
      <Hint inputId={id} spec={spec} />
      <input
        className={`w-[92px] shrink-0 bg-transparent pb-[2px] text-right font-mono text-value outline-none ${
          readOnly
            ? "text-ink-muted"
            : "border-b border-dashed border-rule text-ink focus:border-solid focus:border-accent"
        }`}
        id={id}
        inputMode="decimal"
        onChange={(event) => onChange?.(Number(event.target.value))}
        readOnly={readOnly}
        value={readOnly ? nf(value, 4) : value}
      />
    </label>
  );
}

function MethodRow({
  method,
  chosen,
  onChoose,
}: {
  method: Method;
  chosen: boolean;
  onChoose: (key: MethodKey) => void;
}) {
  const { result } = method;
  return (
    <tr className={chosen ? "bg-accent-wash" : undefined}>
      <td className="border-b border-rule-hair px-3 py-[9px] align-top">
        <div className="flex items-baseline gap-2">
          <span className="text-note text-ink">{method.label}</span>
          <span className="font-mono text-tag text-ink-faint">{method.cite}</span>
        </div>
        <p className="mt-1 max-w-[46ch] font-mono text-meta leading-[1.6] text-ink-muted">
          {method.because}
        </p>
      </td>
      <td className="border-b border-rule-hair px-3 py-[9px] text-right align-top font-mono text-value text-ink">
        {nf(result.arm)}
      </td>
      <td className="border-b border-rule-hair px-3 py-[9px] text-right align-top font-mono text-value text-ink-muted">
        {result.horizontal ? nf(result.horizontal.area) : "—"}
      </td>
      <td className="border-b border-rule-hair px-3 py-[9px] text-right align-top font-mono text-value text-ink-muted">
        {result.vertical ? nf(result.vertical.area) : "—"}
      </td>
      <td className="border-b border-rule-hair px-3 py-[9px] text-right align-top font-mono text-value text-ink-muted">
        {nf(result.wettedArea)}
      </td>
      <td className="border-b border-rule-hair px-3 py-[9px] text-right align-top">
        {chosen ? (
          <span className="font-mono text-tag tracking-band text-accent">
            CARRIED
          </span>
        ) : (
          <button
            className="border border-rule px-[7px] py-[2px] font-mono text-tag tracking-band text-ink-faint hover:border-accent hover:text-accent"
            onClick={() => onChoose(method.key)}
            type="button"
          >
            CARRY FORWARD
          </button>
        )}
      </td>
    </tr>
  );
}

export default function TailArm() {
  const sheet = useTailArmSheet();
  const { inputs, methods, chosen, view } = sheet;

  const setNumber = (field: keyof TailArmView) => (next: number) =>
    sheet.setField(field, next as never);

  const shown = chosen ?? methods[3];
  const armRange: [number, number] = [
    Math.max(shown.result.arm * 0.25, 0.5),
    shown.result.arm * 2.2,
  ];
  const curve = wettedAreaCurve(inputs, "both", armRange[0], armRange[1], 120);

  // Fig. 11-60: the same trade at a range of horizontal tail volumes, so the
  // reader can see how far the optimum moves when the requirement changes.
  const volumeFamily = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((htVolume) => {
    const points = wettedAreaCurve(
      { ...inputs, htVolume },
      "both",
      armRange[0],
      armRange[1],
      120
    );
    const minimum = points.reduce((best, point) =>
      point.wettedArea < best.wettedArea ? point : best
    );
    return { htVolume, points, minimum };
  });

  const rail = (
    <>
      <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
        TAIL DEFINITION
      </div>

      <InputSection
        count={2}
        open={view.openSections.volumes}
        title="ENTRY · TAIL VOLUMES"
        onToggle={(open) => sheet.toggleSection("volumes", open)}
      >
        <NumberField
          id="tail-htVolume"
          onChange={setNumber("htVolume")}
          spec={{
            label: "Horizontal tail volume",
            guide: <TailVolumeGuide />,
            body: "V_HT = L_HT·S_HT ⁄ (c_REF·S_REF). Seeded from Table 11-4 for this class of aeroplane.",
            typical: "0.5 for a sailplane or homebuilt, 0.7 for a GA single, 1.0 for a transport.",
            cite: "Gudmundsson Table 11-4",
          }}
          value={view.htVolume}
        />
        <NumberField
          id="tail-vtVolume"
          onChange={setNumber("vtVolume")}
          spec={{
            label: "Vertical tail volume",
            guide: <TailVolumeGuide />,
            body: "V_VT = L_VT·S_VT ⁄ (b_REF·S_REF). It divides by the span, not the chord.",
            typical: "0.02 to 0.09 across the classes Table 11-4 covers.",
            cite: "Gudmundsson Table 11-4",
          }}
          value={view.vtVolume}
        />
      </InputSection>

      <InputSection
        count={3}
        open={view.openSections.tails}
        title="ENTRY · TAIL PLANFORMS"
        onToggle={(open) => sheet.toggleSection("tails", open)}
      >
        <NumberField
          id="tail-htAspectRatio"
          onChange={setNumber("htAspectRatio")}
          spec={{
            label: "H-tail aspect ratio",
            body: "Sets the span and chord the required tailplane area is drawn at.",
            typical: "3 to 5 on a conventional tailplane.",
          }}
          value={view.htAspectRatio}
        />
        <NumberField
          id="tail-vtAspectRatio"
          onChange={setNumber("vtAspectRatio")}
          spec={{
            label: "V-tail aspect ratio",
            body: "The same for the fin. Fins run at much lower aspect ratio than tailplanes.",
            typical: "1.2 to 2.0.",
          }}
          value={view.vtAspectRatio}
        />
        <label
          className="flex flex-col gap-[6px] px-[18px] py-[7px]"
          htmlFor="tail-armFraction"
        >
          <span className="text-note text-ink-body">
            Engine layout
            <span className="ml-[6px] font-mono text-label text-ink-faint">
              RAYMER
            </span>
          </span>
          <select
            className="border border-rule bg-transparent px-2 py-[3px] font-mono text-note text-ink outline-none focus:border-accent"
            id="tail-armFraction"
            onChange={(event) =>
              sheet.setField("armFractionKey", event.target.value)
            }
            value={view.armFractionKey}
          >
            {RAYMER_ARM_FRACTIONS.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.label} · {Math.round(entry.low * 100)}
                {entry.high === entry.low ? "" : `–${Math.round(entry.high * 100)}`}%
              </option>
            ))}
          </select>
          <span className="font-mono text-meta leading-[1.6] text-ink-muted">
            {sheet.fraction.because}
          </span>
        </label>
      </InputSection>

      <InputSection
        count={3}
        open={view.openSections.cone}
        title="TAIL CONE"
        provisional={2}
        onToggle={(open) => sheet.toggleSection("cone", open)}
      >
        <NumberField
          id="tail-fuselageLength"
          spec={{
            label: "Fuselage length",
            untilDrawn: "fuselageLengthM",
            body: "Raymer's fraction is taken from this. The optimisations do not use it.",
          }}
          unit="m"
          value={sheet.fuselageLength}
        />
        <NumberField
          id="tail-rootRadius"
          spec={{
            label: "Cone radius, R1",
            untilDrawn: "tailConeRootRadiusM",
            body: "Half the fuselage depth at the wing quarter chord, where the tail cone starts.",
            cite: "Gudmundsson Fig. 11-57",
          }}
          unit="m"
          value={inputs.rootRadius}
        />
        <NumberField
          id="tail-tipRadius"
          spec={{
            label: "Cone radius, R2",
            untilDrawn: "tailConeTipRadiusM",
            body: "Half the fuselage depth where the tail attaches.",
            cite: "Gudmundsson Fig. 11-57",
          }}
          unit="m"
          value={inputs.tipRadius}
        />
      </InputSection>

      <InputSection
        count={3}
        open={view.openSections.carried}
        title="CARRIED · UPSTREAM"
        onToggle={(open) => sheet.toggleSection("carried", open)}
      >
        <NumberField
          id="tail-wingArea"
          spec={{
            label: "Wing area, S_REF",
            body: "Reference area both tail volumes are defined against.",
            origin: "SHEET 02",
          }}
          unit="m²"
          value={inputs.wingArea}
        />
        <NumberField
          id="tail-meanChord"
          spec={{
            label: "Mean chord, c_REF",
            body: "The length the horizontal tail volume divides by.",
            origin: "SHEET 07",
          }}
          unit="m"
          value={inputs.meanChord}
        />
        <NumberField
          id="tail-span"
          spec={{
            label: "Span, b_REF",
            body: "The length the vertical tail volume divides by.",
            origin: "SHEET 07",
          }}
          unit="m"
          value={inputs.span}
        />
      </InputSection>

      <button
        className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
        onClick={sheet.reset}
        type="button"
      >
        RESET TAIL
      </button>
    </>
  );

  const summary: Array<[string, string]> = [
    ["TAIL ARM", chosen ? `${nf(chosen.result.arm)} m` : "—"],
    [
      "H-TAIL AREA",
      chosen?.result.horizontal ? `${nf(chosen.result.horizontal.area)} m²` : "—",
    ],
    [
      "V-TAIL AREA",
      chosen?.result.vertical ? `${nf(chosen.result.vertical.area)} m²` : "—",
    ],
    ["WETTED", chosen ? `${nf(chosen.result.wettedArea)} m²` : "—"],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Tail arm and initial tail sizing</h1>

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
            <span className="font-mono text-readout font-medium leading-none text-ink">
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
          {rail}
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              CONTROL 01 / TAIL ARM
            </div>
            <h2 className="text-sheet">How far back the tail goes</h2>
          </div>

          {chosen === null ? (
            <section
              className="mb-4 border border-accent bg-accent-wash px-4 py-3 font-mono text-note text-accent"
              role="alert"
            >
              No method carried forward yet. The elevator and rudder sheets are
              still working from the workbook’s tail arm.
            </section>
          ) : null}

          <section className="mb-4 border border-rule-mid bg-field">
            <div className="flex items-center justify-between border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              <span>FOUR WAYS TO PLACE THE TAIL</span>
              <span className="flex items-center gap-2 text-meta font-normal text-ink-faint">
                EXPLAINER
                <Hint
                  inputId="tail-methods"
                  spec={{
                    label: "Tail arm",
                    guide: <TailArmGuide />,
                    body: "Each method meets the same tail volumes; they differ in what they optimise.",
                  }}
                />
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="font-mono text-label tracking-tab text-ink-label">
                    <th className="border-b border-rule px-3 py-[8px] font-medium">
                      METHOD
                    </th>
                    <th className="border-b border-rule px-3 py-[8px] text-right font-medium">
                      ARM [m]
                    </th>
                    <th className="border-b border-rule px-3 py-[8px] text-right font-medium">
                      S_HT [m²]
                    </th>
                    <th className="border-b border-rule px-3 py-[8px] text-right font-medium">
                      S_VT [m²]
                    </th>
                    <th className="border-b border-rule px-3 py-[8px] text-right font-medium">
                      WETTED [m²]
                    </th>
                    <th className="border-b border-rule px-3 py-[8px] text-right font-medium">
                      {" "}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method) => (
                    <MethodRow
                      chosen={chosen?.key === method.key}
                      key={method.key}
                      method={method}
                      onChoose={sheet.carryForward}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-[9px] font-mono text-meta leading-[1.6] text-ink-muted">
              Every row is the tail cone plus both faces of both surfaces at
              that row’s arm, so the four are directly comparable. Gudmundsson
              asks that one method be chosen and kept to rather than averaged
              across, so pick the one whose argument fits this aeroplane.
            </p>
          </section>

          <div className="mb-4 grid gap-4 xl:grid-cols-2">
            <Figure
              body="The trade the optimisation solves. The cone's area grows with the arm while the tail's falls, and the sum turns over. Gudmundsson's Fig. 11-59."
              id="tail-wetted-curve"
              title="WETTED AREA · AGAINST TAIL ARM"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: curve.map((point) => point.arm),
                    y: curve.map((point) => point.coneArea),
                    mode: "lines",
                    line: { color: tokens.colors.series.compare, width: 1.4 },
                    name: "TAIL CONE",
                  },
                  {
                    x: curve.map((point) => point.arm),
                    y: curve.map((point) => 2 * point.htArea + 2 * point.vtArea),
                    mode: "lines",
                    line: { color: tokens.colors.series.faint, width: 1.4 },
                    name: "TAIL SURFACES",
                  },
                  {
                    x: curve.map((point) => point.arm),
                    y: curve.map((point) => point.wettedArea),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "TOTAL",
                  },
                  {
                    x: [shown.result.arm],
                    y: [shown.result.wettedArea],
                    mode: "markers",
                    marker: { color: tokens.colors.accent.DEFAULT, size: 9 },
                    name: "MINIMUM",
                  },
                ]}
                layout={layoutFor("TAIL ARM  [m]", "WETTED AREA  [m²]")}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              body="Where the minimum moves as the horizontal tail volume changes. A bigger tail requirement pushes the optimum arm aft. Gudmundsson's Fig. 11-60."
              id="tail-volume-family"
              title="MINIMUM · AGAINST TAIL VOLUME"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  ...volumeFamily.map((family, index) => ({
                    x: family.points.map((point) => point.arm),
                    y: family.points.map((point) => point.wettedArea),
                    mode: "lines" as const,
                    line: {
                      color: tokens.colors.ink.DEFAULT,
                      width: 1,
                      dash: index % 2 ? ("dot" as const) : undefined,
                    },
                    opacity: 0.35 + index * 0.1,
                    name: `V_HT ${family.htVolume.toFixed(1)}`,
                    showlegend: false,
                  })),
                  {
                    x: volumeFamily.map((family) => family.minimum.arm),
                    y: volumeFamily.map((family) => family.minimum.wettedArea),
                    mode: "lines+markers",
                    line: { color: tokens.colors.accent.DEFAULT, width: 1.6 },
                    marker: { size: 7 },
                    name: "MINIMA · V_HT 0.5 → 1.0",
                  },
                ]}
                layout={layoutFor("TAIL ARM  [m]", "WETTED AREA  [m²]")}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <TailGeometry
            arm={shown.result.arm}
            result={shown.result}
            rootRadius={inputs.rootRadius}
            tipRadius={inputs.tipRadius}
            wingChord={inputs.meanChord}
            wingSpan={inputs.span}
          />
        </div>
      </div>
    </main>
  );
}
