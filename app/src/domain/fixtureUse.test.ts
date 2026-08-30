import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A workbook fixture is the specification a sheet was ported against, not a
 * data source. A page that reads one is showing the workbook's aeroplane
 * rather than the one being designed — the failure that put 520 hp of
 * installed power on the take-off sheet when the engine selected on Sheet 02
 * delivers 163. See the data-flow section of AGENTS.md.
 *
 * Two checks. Fixtures live under a `tests/` directory, so that what may
 * import them is obvious from where they sit rather than from a convention
 * someone has to remember. And no page imports one.
 *
 * These sheets predate the rule. The list may shrink; it must not grow.
 */
const PRE_EXISTING = [
  "containers/drag/DragAnalysis.tsx",
  "containers/vn/VnDiagram.tsx",
  "containers/wingAndAirfoil/WingAndAirfoil.tsx",
  "containers/wingAndAirfoil/WingStructural.tsx",
];

/** The fixtures still sitting beside the code they are the spec for. */
const PRE_EXISTING_FIXTURES = [
  "containers/drag/dragFixture.ts",
  "containers/vn/vnFixture.ts",
  "containers/wingAndAirfoil/aerofoilFixture.ts",
  "containers/wingAndAirfoil/structureFixture.ts",
];

const SRC = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

const files = walk(SRC).map((path) => path.slice(SRC.length + 1));

test("no page reads a workbook fixture", () => {
  const offenders = files
    .filter((path) => !/\.test\.tsx?$/.test(path))
    .filter((path) => /[Ff]ixture"/.test(readFileSync(join(SRC, path), "utf8")))
    .map((path) => path.replace(/\\/g, "/"));

  expect(offenders.sort()).toEqual(PRE_EXISTING);
});

test("every fixture lives under a tests directory", () => {
  const stray = files
    .filter((path) => /[Ff]ixture\.tsx?$/.test(path))
    .map((path) => path.replace(/\\/g, "/"))
    .filter((path) => !path.includes("/tests/"));

  expect(stray.sort()).toEqual(PRE_EXISTING_FIXTURES);
});
