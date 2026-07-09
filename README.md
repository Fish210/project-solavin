# project-solavin# Solavin — Photovoltaic Characterization Suite

A lab-grade web application for analysing photovoltaic **current–voltage (I-V)**
sweeps. Upload measured data, and Solavin extracts the standard figures of
merit — short-circuit current (I<sub>sc</sub>), open-circuit voltage
(V<sub>oc</sub>), maximum power (P<sub>max</sub>), fill factor (FF), series and
shunt resistance (R<sub>s</sub>, R<sub>sh</sub>) and power-conversion efficiency
(η) — with interactive I-V / P-V / radar visualisations and one-click CSV/Excel
export.

Built with React 18 + Vite + Recharts. The scientific core is plain,
dependency-free JavaScript covered by an automated test suite, so results are
reproducible and verifiable.

> Developed by **John Myron Uy**, under the guidance of **Prof. Raymund Sarmiento** —
> Research Laboratory, Solar Cell Characterization.

---

## Highlights

- **Parameter extraction** — I<sub>sc</sub>, V<sub>oc</sub>, P<sub>max</sub>,
  V<sub>mp</sub>, I<sub>mp</sub>, FF, R<sub>s</sub>, R<sub>sh</sub>, η.
- **Multi-channel** — load many sweep conditions per dataset and compare them.
- **Visualisations** — I-V, P-V (with MPP markers), normalised radar profile,
  and ranked P<sub>max</sub> comparison; brush-to-zoom and a voltage cursor
  lookup.
- **Data ingest** — drag-and-drop `.xlsx` / `.xls` / `.csv`; multi-sheet picker.
- **Export** — CSV and XLSX of the full metrics table, including η when area and
  irradiance are supplied.
- **Lab Assistant** — an offline, deterministic analyser that answers from the
  extracted metrics (summaries, rankings, fill-factor interpretation, suggested
  experiments). No external API, no keys.
- **Local operator profiles** — name a session to keep a persistent dataset
  library in your browser, or work in demo mode. No passwords, no backend.
- **Two build targets** — a normal web app for hosting, and a single
  self-contained `.html` you can email or run offline from `file://`.

## Accuracy & conventions

Photovoltaic figures of merit are computed in
[`src/lib/ivAnalysis.js`](src/lib/ivAnalysis.js) on the **signed** current
(generator convention: current is positive in the power-producing quadrant and
negative beyond V<sub>oc</sub>).

| Quantity | Definition used |
|----------|-----------------|
| I<sub>sc</sub> | Current at V = 0 (exact sample, else interpolated; extrapolated if the sweep starts above 0 V). |
| V<sub>oc</sub> | Voltage at the first I = 0 crossing (linear interpolation). Flagged if it lies beyond the sweep range. |
| P<sub>max</sub>, V<sub>mp</sub>, I<sub>mp</sub> | Maximum of V·I, **restricted to the power quadrant** (V ≥ 0, I ≥ 0). |
| FF | P<sub>max</sub> / (I<sub>sc</sub> · V<sub>oc</sub>) — always < 1 for physical data. |
| R<sub>s</sub> | \|dV/dI\| near V<sub>oc</sub> (slope estimate). |
| R<sub>sh</sub> | \|dV/dI\| near I<sub>sc</sub> (slope estimate). |
| η | P<sub>max</sub> / (G · A), with cell area in cm² and irradiance G in W/m². |

R<sub>s</sub> and R<sub>sh</sub> are first-order slope estimates from a single
light sweep; a dark I-V curve or a full single-diode fit gives more rigorous
values.

The test suite ([`src/lib/ivAnalysis.test.js`](src/lib/ivAnalysis.test.js))
asserts these invariants on every build — including that the fill factor is
always between 0 and 100 % — so the extraction cannot silently regress.

## Data format

Column **A** is voltage (volts); each subsequent column is one current sweep
(amperes, signed). Row 1 holds headers, which become channel labels.

```
Voltage(V), Focused Laser, -2mm, +6mm Focus
0,          1.539e-6,      1.46e-6, 1.583e-6
0.05,       1.528e-6,      1.456e-6, 1.565e-6
...
2.5,        -3.875e-6,     -3.052e-6, -2.923e-6
```

A ready-to-upload example lives in
[`examples/sample_iv_data.csv`](examples/sample_iv_data.csv) (the same dataset
the app loads by default).

## Getting started

```bash
npm install
npm run dev          # start the dev server (http://localhost:5173)
npm test             # run the physics unit tests
npm run build        # production build → dist/
npm run build:standalone   # single self-contained file → dist-standalone/index.html
npm run build:all    # both builds
```

### Standalone file

`npm run build:standalone` produces `dist-standalone/index.html` — a single file
with all JavaScript and CSS inlined. Open it directly (`file://…`) with no server;
it works offline (web fonts fall back to system fonts when there's no network).

## Deployment (Netlify)

This repo includes [`netlify.toml`](netlify.toml). To go live:

1. Push the repository to GitHub.
2. In the Netlify dashboard, **Add new site → Import an existing project** and
   pick this repo.
3. Netlify reads `netlify.toml` automatically (build `npm run build`, publish
   `dist`). No manual configuration needed.

Every push then redeploys. The continuous-integration workflow
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the unit tests and
both builds, and uploads the standalone HTML as a downloadable artifact.

## Project structure

```
src/
  lib/
    ivAnalysis.js        # parameter extraction + parsing + export helpers (pure)
    ivAnalysis.test.js   # physics invariants & reference-value tests
    assistant.js         # deterministic, offline dataset analyser
  components/
    ProfileGate.jsx      # local operator gate (no passwords)
    Tour.jsx             # guided walkthrough overlay
    Assistant.jsx        # lab-assistant side panel
    shared.jsx           # chart tooltip, channel toggles, lookup, raw-data table
    AboutPage.jsx
  App.jsx                # main application
  theme.js  icons.jsx  persistence.js  styles.css  main.jsx
examples/sample_iv_data.csv
tests/e2e.smoke.mjs      # optional browser smoke test (skips if no Chromium)
```

## Testing

- `npm test` — Vitest unit tests for the extraction math (run in CI).
- `npm run test:e2e` — optional Playwright smoke test that builds the standalone
  bundle, drives it in a real browser, and verifies the app mounts cleanly with
  physical fill factors. Playwright is **not** a default dependency; install it
  first with `npm i -D playwright && npx playwright install chromium`. The test
  skips automatically (exit 0) if Playwright or a browser is unavailable, so it
  never blocks CI.

## License

[MIT](LICENSE) © 2026 John Myron Uy.
