/**
 * ivAnalysis.js — Photovoltaic I-V curve parameter extraction.
 *
 * This module is the scientific core of Solavin. Every figure of merit
 * shown in the UI, written to exports, or quoted by the assistant is computed
 * here. It is intentionally free of any UI/DOM/React dependency so it can be
 * unit-tested in isolation (see ivAnalysis.test.js).
 *
 * SIGN CONVENTION
 * ---------------
 * We use the generator convention: in the power-producing (first) quadrant the
 * cell sources current, so photocurrent is POSITIVE while voltage is positive.
 * Past the open-circuit voltage the current goes NEGATIVE (the cell sinks
 * current). All extraction below operates on the *signed* current — this is the
 * fix for the historical bug where absolute-value current was fed into a
 * zero-crossing detector, which pushed the maximum-power search into the
 * reverse-bias region and produced fill factors above 100 %.
 *
 * A measured datapoint is { voltage, current, rawCurrent } where:
 *   - voltage    : terminal voltage in volts (V)
 *   - rawCurrent : measured signed current in amperes (A)   <-- used for physics
 *   - current    : |rawCurrent|, kept only for legacy display helpers
 */

/** Linear interpolation of y at target x between (x0,y0) and (x1,y1). */
function lerp(x, x0, y0, x1, y1) {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/** Least-squares slope of y(x); null when degenerate (fewer than 2 points or all x equal). */
function lsqSlope(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let k = 0; k < n; k++) {
    sx += xs[k]; sy += ys[k]; sxx += xs[k] * xs[k]; sxy += xs[k] * ys[k];
  }
  const den = n * sxx - sx * sx;
  if (den === 0) return null;
  return (n * sxy - sx * sy) / den;
}

/**
 * Return the signed current for a datapoint, tolerating either the
 * { rawCurrent } shape (preferred) or a bare { current } that is already signed.
 */
function signedCurrent(pt) {
  if (pt == null) return NaN;
  if (typeof pt.rawCurrent === "number") return pt.rawCurrent;
  return Number(pt.current);
}

/**
 * Extract photovoltaic figures of merit from a single I-V sweep.
 *
 * @param {Array<{voltage:number, current?:number, rawCurrent?:number}>} pts
 *   Measured points. Order does not matter — points are sorted by voltage.
 * @returns {null | {
 *   isc:number, voc:number, pmax:number, vmp:number, imp:number,
 *   ff:number, rs:number, rsh:number, crossIndex:number,
 *   notes:{ iscExtrapolated:boolean, vocBeyondRange:boolean },
 *   warnings:string[]
 * }}  All electrical quantities in SI base units (V, A, W, Ω). `ff` is a
 *   fraction in [0,1]. `warnings` lists human-readable data-quality flags
 *   (empty for a clean sweep). Returns null when fewer than 3 valid points
 *   are given.
 */
export function calcMetrics(pts) {
  if (!Array.isArray(pts) || pts.length < 3) return null;

  // Build clean, voltage-sorted arrays of finite samples.
  const clean = pts
    .map((p) => ({ v: Number(p.voltage), i: signedCurrent(p) }))
    .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.i))
    .sort((a, b) => a.v - b.v);
  const n = clean.length;
  if (n < 3) return null;

  const v = clean.map((p) => p.v);
  const i = clean.map((p) => p.i);

  const notes = { iscExtrapolated: false, vocBeyondRange: false };

  // ── Short-circuit current Isc = I(V = 0) ─────────────────────────────────
  // Prefer an exact V=0 sample, else interpolate across the bracketing pair,
  // else linearly extrapolate from the two lowest-voltage points to V=0.
  let isc;
  const zeroExact = v.indexOf(0);
  if (zeroExact !== -1) {
    isc = i[zeroExact];
  } else {
    let bracket = -1;
    for (let j = 0; j < n - 1; j++) {
      if ((v[j] <= 0 && v[j + 1] >= 0) || (v[j] >= 0 && v[j + 1] <= 0)) {
        bracket = j;
        break;
      }
    }
    if (bracket !== -1) {
      isc = lerp(0, v[bracket], i[bracket], v[bracket + 1], i[bracket + 1]);
    } else {
      // All samples on one side of V=0: extrapolate from the nearest two.
      isc = lerp(0, v[0], i[0], v[1], i[1]);
      notes.iscExtrapolated = true;
    }
  }

  // ── Open-circuit voltage Voc = V where I first crosses 0 going negative ───
  let voc = null;
  let crossIndex = -1;
  for (let j = 1; j < n; j++) {
    if (i[j - 1] > 0 && i[j] <= 0) {
      voc = lerp(0, i[j - 1], v[j - 1], i[j], v[j]); // interpolate V at I=0
      crossIndex = j;
      break;
    }
  }
  if (voc === null) {
    // Current never reaches zero within the sweep — report the last voltage
    // and flag that Voc lies beyond the measured range.
    voc = v[n - 1];
    notes.vocBeyondRange = true;
  }

  // ── Maximum power point — restricted to the power quadrant (V≥0, I≥0) ─────
  // The sweep is treated as piecewise-linear between samples. On a segment
  // with I(V) = a + bV the power P(V) = aV + bV² is quadratic, so its maximum
  // over the segment lies either at an endpoint or at the interior stationary
  // point V* = −a/(2b) (a true maximum only when b < 0). Scanning every sample
  // point plus every interior stationary point therefore finds the exact
  // maximum of the interpolated P-V curve — finer than the measured voltage
  // grid, without assuming any diode model.
  let pmax = 0;
  let vmp = 0;
  let imp = 0;
  const considerMpp = (vv, ii) => {
    if (vv < 0 || ii < 0) return;
    const p = vv * ii;
    if (p > pmax) { pmax = p; vmp = vv; imp = ii; }
  };
  for (let j = 0; j < n; j++) considerMpp(v[j], i[j]);
  for (let j = 0; j < n - 1; j++) {
    const dv = v[j + 1] - v[j];
    if (dv <= 0) continue; // duplicate abscissa — no interior to search
    const b = (i[j + 1] - i[j]) / dv;
    if (b >= 0) continue; // parabola opens upward or is flat: endpoints suffice
    const a = i[j] - b * v[j];
    const vStar = -a / (2 * b);
    if (vStar > v[j] && vStar < v[j + 1]) considerMpp(vStar, a + b * vStar);
  }

  // ── Fill factor FF = Pmax / (Isc · Voc) ──────────────────────────────────
  // Uses the Pmax actually found on the P-V curve above — never the
  // Voc·Isc·(assumed FF) shortcut.
  const ff = isc > 0 && voc > 0 ? pmax / (isc * voc) : 0;

  // ── Series resistance Rs ≈ −dV/dI at the I = 0 crossing (near Voc) ────────
  // Slope of the single segment that brackets the crossing — the most local
  // estimate available from one light sweep.
  let rs = 0;
  if (crossIndex >= 1) {
    const dv = v[crossIndex] - v[crossIndex - 1];
    const di = i[crossIndex] - i[crossIndex - 1];
    if (di !== 0) rs = Math.abs(dv / di);
  }

  // ── Shunt resistance Rsh ≈ (dI/dV)⁻¹ near short circuit ──────────────────
  // Least-squares slope of I(V) over the low-voltage plateau (V ≤ 30 % of Voc,
  // including any reverse-bias samples) — more noise-robust than a two-point
  // difference. Falls back to the three lowest-voltage samples when the
  // plateau holds fewer than three points.
  let rsh = Infinity;
  {
    const cut = voc > 0 ? 0.3 * voc : v[0] + 0.3 * (v[n - 1] - v[0]);
    let xs = [], ys = [];
    for (let j = 0; j < n; j++) if (v[j] <= cut) { xs.push(v[j]); ys.push(i[j]); }
    if (xs.length < 3) { xs = v.slice(0, 3); ys = i.slice(0, 3); }
    const slope = lsqSlope(xs, ys);
    if (slope !== null && slope !== 0) rsh = Math.abs(1 / slope);
  }

  // ── Data-quality warnings ─────────────────────────────────────────────────
  // Sanity checks a reviewer would run by eye; surfaced verbatim in the UI.
  const warnings = [];
  if (notes.iscExtrapolated)
    warnings.push("No samples bracket V = 0 — Isc is a linear extrapolation from the two lowest-voltage points.");
  if (notes.vocBeyondRange)
    warnings.push("Current never crosses zero within the sweep — the quoted Voc is the last measured voltage (a lower bound).");
  if (isc <= 0)
    warnings.push("Isc ≤ 0. For an illuminated cell in generator convention Isc should be positive — check the current sign or column mapping.");
  // Monotonicity: between V = 0 and Voc an illuminated cell's current should
  // fall as voltage rises. Tolerate noise up to 2 % of the Isc scale.
  {
    const scale = Math.abs(isc) > 0 ? Math.abs(isc) : Math.max(...i.map((x) => Math.abs(x)));
    const tol = 0.02 * scale;
    let rises = 0;
    for (let j = 1; j < n; j++) {
      if (v[j - 1] < 0 || v[j] > voc + 1e-12) continue;
      if (i[j] - i[j - 1] > tol) rises++;
    }
    if (rises > 0)
      warnings.push(`Current increases with voltage at ${rises} point(s) between 0 V and Voc — an illuminated I-V curve should fall monotonically; check for noise or sweep artefacts.`);
  }
  // Sampling density: too few power-quadrant points make Vmp/Imp unreliable.
  {
    let quad = 0;
    for (let j = 0; j < n; j++) if (v[j] >= 0 && i[j] >= 0) quad++;
    if (quad < 5)
      warnings.push(`Only ${quad} sweep point(s) fall in the power quadrant (V ≥ 0, I ≥ 0) — Vmp/Imp resolution is limited; use a finer voltage step.`);
  }

  return { isc, voc, pmax, vmp, imp, ff, rs, rsh, crossIndex, notes, warnings };
}

/**
 * Pick an SI display scale for a quantity: siPrefix(1.5e-6) → { div: 1e-6,
 * prefix: "µ" } so `value / div` reads in µ-units. Chooses the largest prefix
 * that keeps the scaled magnitude ≥ 1 (i.e. in [1, 1000) for in-range values),
 * so µA-scale lab cells and A-scale production cells both display naturally.
 * Returns the identity scale for zero/non-finite input.
 */
export function siPrefix(maxAbs) {
  const TABLE = [
    [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""],
    [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"],
  ];
  if (!Number.isFinite(maxAbs) || maxAbs <= 0) return { div: 1, prefix: "" };
  for (const [div, prefix] of TABLE) if (maxAbs >= div) return { div, prefix };
  return { div: 1e-12, prefix: "p" };
}

/** Format one value with its own auto-picked SI prefix: fmtSI(1.54e-6, "A") → "1.540 µA". */
export function fmtSI(value, unit, digits = 3) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return (0).toFixed(digits) + " " + unit;
  const { div, prefix } = siPrefix(Math.abs(value));
  return (value / div).toFixed(digits) + " " + prefix + unit;
}

/**
 * Power-conversion efficiency η = Pmax / (G · A).
 *
 * @param {number} pmaxW       Maximum power in watts.
 * @param {number} areaCm2     Illuminated cell area in cm².
 * @param {number} irradiance  Incident irradiance G in W/m² (STC = 1000).
 * @returns {number|null} Efficiency in percent, or null for invalid inputs.
 */
export function computeEfficiency(pmaxW, areaCm2, irradiance) {
  const a = Number(areaCm2);
  const g = Number(irradiance);
  if (!Number.isFinite(a) || !Number.isFinite(g) || a <= 0 || g <= 0) return null;
  const areaM2 = a * 1e-4; // cm² → m²
  return (pmaxW / (g * areaM2)) * 100;
}

/**
 * Parse an array-of-arrays worksheet (column A = voltage, columns B+ = current
 * sweeps, row 0 = headers) into a structured dataset fragment.
 *
 * @param {Array<Array<*>>} rows
 * @returns {null | { conditions:string[], ivData:Record<string, Array> }}
 */
export function extractIV(rows) {
  if (!rows || rows.length < 3) return null;
  const header = rows[0]
    .slice(1)
    .map((x, idx) => (x == null || x === "" ? `Channel ${idx + 1}` : String(x)));
  const conditions = header.filter((_, idx) => rows[0][idx + 1] != null && rows[0][idx + 1] !== "");
  if (conditions.length === 0) return null;

  const dataRows = rows.slice(1).filter((r) => r[0] != null && r[0] !== "");
  const ivData = {};
  conditions.forEach((name, ci) => {
    ivData[name] = dataRows
      .map((r) => {
        const voltage = Number(r[0]);
        const raw = Number(r[ci + 1] ?? 0);
        return { voltage, current: Math.abs(raw), rawCurrent: raw };
      })
      .filter((p) => Number.isFinite(p.voltage) && Number.isFinite(p.rawCurrent));
  });
  return { conditions, ivData };
}

/**
 * Build the bundled demo dataset: a real solar-cell I-V sweep measured under
 * room lighting across seven laser-focus conditions. Voltage in V, current in A.
 */
export function buildSampleDataset() {
  const conditions = [
    "Focused Laser",
    "-2mm",
    "-4mm Focus",
    "-6mm Focus",
    "+2mm",
    "+4mm",
    "+6mm Focus",
  ];
  // [V, I_cond1 … I_cond7] in amperes (signed).
  const R = [
    [0, 1.539e-6, 1.46e-6, 1.35e-6, 1.113e-6, 1.562e-6, 1.541e-6, 1.583e-6],
    [0.05, 1.528e-6, 1.456e-6, 1.348e-6, 1.128e-6, 1.525e-6, 1.541e-6, 1.565e-6],
    [0.1, 1.489e-6, 1.458e-6, 1.319e-6, 1.099e-6, 1.541e-6, 1.527e-6, 1.576e-6],
    [0.2, 1.471e-6, 1.42e-6, 1.291e-6, 1.091e-6, 1.507e-6, 1.498e-6, 1.545e-6],
    [0.3, 1.446e-6, 1.393e-6, 1.302e-6, 1.063e-6, 1.482e-6, 1.496e-6, 1.517e-6],
    [0.5, 1.4e-6, 1.352e-6, 1.234e-6, 1.033e-6, 1.44e-6, 1.435e-6, 1.478e-6],
    [0.7, 1.369e-6, 1.287e-6, 1.184e-6, 9.85e-7, 1.374e-6, 1.382e-6, 1.412e-6],
    [0.9, 1.318e-6, 1.256e-6, 1.15e-6, 9.39e-7, 1.311e-6, 1.309e-6, 1.36e-6],
    [1.1, 1.245e-6, 1.176e-6, 1.063e-6, 8.66e-7, 1.253e-6, 1.247e-6, 1.297e-6],
    [1.3, 1.158e-6, 1.1e-6, 9.96e-7, 7.82e-7, 1.173e-6, 1.171e-6, 1.226e-6],
    [1.5, 1.058e-6, 9.96e-7, 8.88e-7, 6.96e-7, 1.07e-6, 1.06e-6, 1.109e-6],
    [1.7, 8.89e-7, 8.33e-7, 7.37e-7, 5.59e-7, 9e-7, 8.9e-7, 9.34e-7],
    [1.9, 5.27e-7, 5.4e-7, 4.74e-7, 3.44e-7, 5.98e-7, 5.9e-7, 6.42e-7],
    [2, 2.47e-7, 3.22e-7, 2.72e-7, 1.87e-7, 3.71e-7, 3.58e-7, 4.15e-7],
    [2.05, 7.8e-8, 1.73e-7, 1.42e-7, 8.3e-8, 2.22e-7, 2.14e-7, 2.72e-7],
    [2.1, -1.08e-7, 2.3e-8, -1.3e-8, -3.2e-8, 5.8e-8, 4.6e-8, 1e-7],
    [2.2, -6.48e-7, -3.94e-7, -4.08e-7, -3.67e-7, -3.59e-7, -3.77e-7, -3.19e-7],
    [2.4, -2.397e-6, -1.837e-6, -1.797e-6, -1.6e-6, -1.777e-6, -1.816e-6, -1.73e-6],
    [2.5, -3.875e-6, -3.052e-6, -2.978e-6, -2.663e-6, -2.968e-6, -3.025e-6, -2.923e-6],
  ];
  const ivData = {};
  conditions.forEach((c, ci) => {
    ivData[c] = R.map((r) => ({
      voltage: r[0],
      current: Math.abs(r[ci + 1]),
      rawCurrent: r[ci + 1],
    }));
  });
  return { name: "Sample: Solar Cell (Room Lights)", conditions, ivData };
}

/**
 * Build the rows (array-of-arrays) for a metrics export table. Pure — the
 * caller decides whether to serialise to CSV or hand off to a workbook writer.
 * Column units are auto-ranged to the dataset's magnitudes (one shared scale
 * per column so values stay comparable down a column), with ASCII-safe unit
 * spellings ("uA", "kOhm") for CSV portability.
 *
 * @param {{conditions:string[]}} dataset
 * @param {Record<string, ReturnType<typeof calcMetrics>>} allMetrics
 * @param {Record<string, number>|null} [efficiency]  optional η (%) per condition
 */
export function metricsToRows(dataset, allMetrics, efficiency) {
  const ms = dataset.conditions.map((c) => allMetrics[c]).filter(Boolean);
  const iScale = siPrefix(Math.max(0, ...ms.map((m) => Math.abs(m.isc)), ...ms.map((m) => Math.abs(m.imp))));
  const pScale = siPrefix(Math.max(0, ...ms.map((m) => Math.abs(m.pmax))));
  const rsScale = siPrefix(Math.max(0, ...ms.map((m) => Math.abs(m.rs))));
  const rshScale = siPrefix(Math.max(0, ...ms.filter((m) => Number.isFinite(m.rsh)).map((m) => Math.abs(m.rsh))));
  const ascii = (p) => (p === "µ" ? "u" : p);
  const header = [
    "Condition",
    `Isc (${ascii(iScale.prefix)}A)`,
    "Voc (V)",
    `Pmax (${ascii(pScale.prefix)}W)`,
    "Vmp (V)",
    `Imp (${ascii(iScale.prefix)}A)`,
    "FF (%)",
    `Rs (${ascii(rsScale.prefix)}Ohm)`,
    `Rsh (${ascii(rshScale.prefix)}Ohm)`,
  ];
  if (efficiency) header.push("Efficiency (%)");
  const rows = [header];
  dataset.conditions.forEach((c) => {
    const m = allMetrics[c];
    if (!m) return;
    const row = [
      c,
      +(m.isc / iScale.div).toFixed(4),
      +m.voc.toFixed(4),
      +(m.pmax / pScale.div).toFixed(4),
      +m.vmp.toFixed(4),
      +(m.imp / iScale.div).toFixed(4),
      +(m.ff * 100).toFixed(2),
      +(m.rs / rsScale.div).toFixed(3),
      m.rsh === Infinity ? "Inf" : +(m.rsh / rshScale.div).toFixed(3),
    ];
    if (efficiency) row.push(efficiency[c] != null ? +efficiency[c].toPrecision(4) : "");
    rows.push(row);
  });
  return rows;
}

/** Serialise export rows to a CSV string. */
export function rowsToCsv(rows) {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}
