# Cost Analysis spreadsheet reference

The files in this directory are generated, read-only references for the
`Cost Analysis` sheet in `spreadsheets/1. initial sizing.xlsx`.

- `cost_analysis_formula_manifest.json` records every populated constant and
  formula cell, including table, named-range, cross-sheet, and cached-value
  metadata.
- `cost_analysis_golden.json` records Excel's cached value for every formula
  cell. These values are the parity target for the Python implementation.

Regenerate both files without saving or changing the source workbook:

```sh
venv/bin/python -m tools.spreadsheets.extract_workbook \
  "spreadsheets/1. initial sizing.xlsx" \
  --sheet "Cost Analysis" \
  --manifest aircraft_design/reference/cost_analysis_formula_manifest.json \
  --golden aircraft_design/reference/cost_analysis_golden.json
```

The selected sheet's content hash is included in each generated file. Review
changes to the manifest and golden values whenever the workbook changes.
