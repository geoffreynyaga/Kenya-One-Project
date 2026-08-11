# Cost Analysis parity specification

This specification translates the `Cost Analysis` worksheet into domain terms
without changing its arithmetic. It is the contract for the first Python
implementation; model corrections belong in later, separately reviewed work.

## Source sections

| Worksheet area | Purpose | Primary outputs |
| --- | --- | --- |
| `A5:L29` | DAPCA IV development and production | certification cost `L19`, production cost `L28`, minimum selling price `L29` |
| `A32:X53` | break-even scenarios and chart series | break-even units `C39` |
| `A50:F77` | annual operating costs | yearly cost `E76`, cost per flight hour `E77` |
| `J57:M63` | loan amortization | monthly payment `L62`, annual payment `L63` |

## Explicit inputs

The Python interface must accept named values rather than worksheet addresses.

### Development and production

| Domain input | Cell | Default | Unit or meaning |
| --- | --- | ---: | --- |
| `airframe_weight_lb` | `B5` | 1740.1367540708186 | structural skeleton weight, derived from Detailed Weights |
| `production_quantity` | `B6` | 1 | aircraft over five years |
| `certification_factor` | `B7` | 1 | LSA 0.67; Part 23 1 |
| `complex_flap_factor` | `B8` | 1 | complex 1.03; simple 1 |
| `composite_fraction` | `B9` | 0 | fraction of airframe |
| `pressurization_factor` | `B11` | 1 | pressurized 1.03; unpressurized 1 |
| `taper_factor` | `B13` | 1 | constant chord 0.95; tapered 1 |
| `project_years` | `H5` | 1 | project duration |
| `work_weeks_per_year` | `H6` | 48 | weeks |
| `work_hours_per_week` | `H7` | 24 | hours |
| `engineering_rate` | `F16` | 0 | currency/hour |
| `cpi_2012_factor` | `F17` | 1 | workbook escalation factor |
| `prototype_count` | `F18` | 1 | aircraft |
| `tooling_rate` | `F19` | 0 | currency/hour |
| `manufacturing_rate` | `F20` | 0 | currency/hour |
| `vmax_knots` | `Table2` header | 170 | maximum speed |
| `engine_count` | `K86` | 2 | linked from Sref and Power Sizing |
| `engine_power_hp` | `M96` | 260 | linked from Sref and Power Sizing |
| `liability_insurance` | `L27` | 300000 | manufacturer liability insurance |

### Break-even, operations, and finance

| Domain input | Cell | Default | Unit or meaning |
| --- | --- | ---: | --- |
| `selling_prices` | `C34:C36` | 800000, 1200000, 1300000 | three scenarios |
| `maintenance_factors` | `E50:E57` | -0.15, 0, 0, 0.02, 0, 0, 0, 0 | eight workbook adjustments |
| `technician_rate` | `E59` | 10 | currency/hour |
| `flight_hours_per_year` | `E60` | 1040 | hours |
| `storage_per_month` | `E61` | 250 | currency/month |
| `fuel_price_per_gallon` | `E62` | 5.59 | currency/gallon |
| `fuel_flow_gallons_per_hour` | `E63` | 32.33390119250426 | cached external-link result |
| `crew_rate` | `E65` | 0 | currency/hour/person |
| `pilot_count` | `MTOW B14` | 2 | linked from MTOW and Weights |
| `inspection_per_year` | `E71` | 500 | currency/year |
| `loan_term_years` | `L59` | 5 | years |
| `annual_interest_percent` | `L60` | 9 | nominal annual rate, despite worksheet label |

The constants embedded by the worksheet must become named assumptions:
insurance base `500`, insurance rate `0.015`, overhaul reserve
`5` per engine-flight-hour, fixed-gear discount `7500` per aircraft, avionics
`15000` per aircraft, engine cost factor `174`, and propeller cost factor
`3145`.

## Workbook dependencies

- `B5` subtracts non-airframe items from `Detailed Weights!L19`.
- `Table2[[#Headers],[170]]` uses the text header `170` from
  `Sref and POWER SIZING!A14:C18` as `vmax_knots` through Excel coercion.
- Engine count and power come from `Sref and POWER SIZING!K86` and `M96`.
- Pilot count comes from `MTOW & WEIGHTS!B14`.
- Fuel flow uses the external link `[1]cruise!B8` and `[1]cruise!E8` from
  `2. Performance.xlsx`. Until that workbook is ported, fuel flow is an
  explicit input using the cached value above.

## Parity rules and known anomalies

- Excel `^` maps to Python `**`; calculations use floats and round only for
  presentation.
- `C33` is labelled unit variable cost but contains quantity-scaled terms. The
  break-even chart multiplies it by units again, which can double-count when
  production quantity exceeds one. Preserve this for parity first.
- `C38` always selects the first selling price, so `C39` reports only scenario
  one. Python should return all three scenarios while retaining scenario one as
  the workbook-parity result.
- The workbook has no guards for selling price at or below variable cost, zero
  flight hours, zero interest, or a non-positive loan term. Python must validate
  invalid denominators and support the standard zero-interest payment branch.
- The loan formula treats `L60=9` as annual APR by dividing by `12 * 100`, even
  though the worksheet calls it a monthly rate.
- The cached fuel-flow value depends on an external workbook and may be stale.
- Zero engineering, tooling, manufacturing, and crew rates encode the workbook's
  university-project assumption that those services are free.
- `L23` is a negative fixed-gear discount. `L27` is included in minimum selling
  price, while `L28` deliberately excludes it.
