import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A workbook fixture is the specification a sheet was ported against, not a
 * data source. A page that imports one is showing the workbook's aeroplane
 * rather than the one being designed — the failure that put 520 hp of
 * installed power on the take-off sheet when the engine selected on Sheet 02
 * delivers 163. See the data-flow section of AGENTS.md.
 *
 * These five sheets predate the rule. The list may shrink; it must not grow.
 */
const PRE_EXISTING = [
  "containers/detailedWeights/DetailedWeights.tsx",
  "containers/drag/DragAnalysis.tsx",
  "containers/vn/VnDiagram.tsx",
  "containers/wingAndAirfoil/WingAndAirfoil.tsx",
  "containers/wingAndAirfoil/WingStructural.tsx",
];

const SRC = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

test("no page reads a workbook fixture", () => {
  const offenders = walk(SRC)
    .filter((path) => !/\.test\.tsx?$/.test(path))
    .filter((path) => /Fixture"/.test(readFileSync(path, "utf8")))
    .map((path) => path.slice(SRC.length + 1));

  expect(offenders.sort()).toEqual(PRE_EXISTING);
});
