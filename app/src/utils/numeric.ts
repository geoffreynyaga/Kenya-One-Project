/**
 * Numerical helpers with no aircraft in them.
 *
 * These exist because the workbooks lean on two spreadsheet facilities that
 * have no JavaScript equivalent: a matrix inverse multiplied through a vector,
 * and an approximate table lookup. Both are general, both are needed by more
 * than one sheet, and neither belongs to a stage of the design.
 */

/**
 * Solves `matrix · x = rhs` by Gauss-Jordan elimination with partial pivoting.
 * Returns a vector of NaN for a singular system rather than throwing, so a
 * sheet renders with dashes instead of blanking.
 *
 * The workbooks reach for MINVERSE and MMULT wherever they fit a curve through
 * a handful of conditions. Inverting is the wasteful way to solve a system, and
 * for a 4x4 the difference is not worth measuring, but there is no reason to
 * reproduce it either.
 */
export function solveLinearSystem(
  matrix: readonly (readonly number[])[],
  rhs: readonly number[]
): number[] {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];

    if (a[col][col] === 0) return new Array<number>(n).fill(NaN);

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = a[row][col] / a[col][col];
      for (let k = col; k <= n; k += 1) a[row][k] -= factor * a[col][k];
    }
  }

  return a.map((row, i) => row[n] / row[i]);
}

/**
 * The row with the largest key at or below the one asked for, or undefined if
 * every key is above it. Rows must already be sorted by key ascending.
 *
 * This is what the sheets do when they read a result off a table of integration
 * steps: they take the step at or below the speed they want rather than
 * interpolating between the two either side. Reproduced rather than improved,
 * because the step size is what controls the error and interpolating would
 * quietly change every number that depends on it.
 */
export function rowAtOrBelow<T>(
  rows: readonly T[],
  key: (row: T) => number,
  value: number
): T | undefined {
  let found: T | undefined;
  for (const row of rows) {
    if (key(row) > value) break;
    found = row;
  }
  return found;
}
