import { Logo, Ic } from "../icons.jsx";

export function AboutPage(p) {
  const t = p.t;
  const card = { background: t.card, borderRadius: 14, border: "1px solid " + t.border, padding: "28px 32px", marginBottom: 16 };
  return (
    <div className="slideup" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ margin: "0 auto 18px", display: "inline-block" }}><Logo s={64} /></div>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.03em" }}><span style={{ background: t.grad, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Solavin</span></h2>
        <p style={{ fontSize: 13, color: t.textM, marginTop: 6 }}>Photovoltaic Characterization &amp; Analysis Suite</p>
      </div>
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Ic.Info s={17} c={t.accent} />How It Works</h3>
        <div style={{ fontSize: 12, color: t.textM, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 10 }}>Solavin processes current-voltage data from photovoltaic cells to extract standard figures of merit for research characterization.</p>
          <p style={{ marginBottom: 6 }}>1. <strong style={{ color: t.text }}>Data ingestion</strong> — upload .xlsx/.csv with voltage in column A and one current sweep per following column.</p>
          <p style={{ marginBottom: 6 }}>2. <strong style={{ color: t.text }}>Parameter extraction</strong> — Isc (current at V=0), Voc (the I=0 crossing), Pmax/Vmp/Imp in the power quadrant, FF = Pmax/(Isc·Voc), and slope-based Rs &amp; Rsh.</p>
          <p style={{ marginBottom: 6 }}>3. <strong style={{ color: t.text }}>Efficiency</strong> — cell area and irradiance inputs give η = Pmax/(G·A).</p>
          <p style={{ marginBottom: 6 }}>4. <strong style={{ color: t.text }}>Visualization</strong> — I-V, P-V, radar, and comparative charts with MPP overlays and zoom.</p>
          <p>5. <strong style={{ color: t.text }}>Export</strong> — one-click CSV/Excel export of all metrics.</p>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Accuracy &amp; conventions</h3>
        <div style={{ fontSize: 12, color: t.textM, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 6 }}>Extraction operates on <strong style={{ color: t.text }}>signed</strong> current (generator convention): positive in the power quadrant, negative beyond Voc. The maximum-power search is restricted to V≥0, I≥0, so fill factor is always physical (&lt; 100%).</p>
          <p style={{ marginBottom: 6 }}>Isc and Voc are <strong style={{ color: t.text }}>linearly interpolated</strong> between the two samples that bracket V = 0 and I = 0 — never nearest-neighbour. The maximum-power point is located on the piecewise-linear P-V curve itself, including between measured samples, so Pmax does not snap to the voltage grid. Automated sanity checks flag non-positive Isc, non-monotonic sweeps and sparse sampling.</p>
          <p>The core math is validated against single-diode reference silicon cells (FF ≈ 0.83 at STC) by an automated test suite that runs on every build, so results stay reproducible.</p>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Technology</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 12, color: t.textM }}>
          <div><span style={{ color: t.text, fontWeight: 600 }}>Frontend:</span> React 18 + Vite</div>
          <div><span style={{ color: t.text, fontWeight: 600 }}>Charts:</span> Recharts</div>
          <div><span style={{ color: t.text, fontWeight: 600 }}>Excel:</span> SheetJS</div>
          <div><span style={{ color: t.text, fontWeight: 600 }}>Tests:</span> Vitest</div>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg," + t.accent + "08,#7c3aed06)", borderRadius: 14, border: "1px solid " + t.accent + "1a", padding: "30px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 9, color: t.textM, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Developed by</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>John Myron Uy</div>
        <div style={{ fontSize: 12, color: t.textM, marginTop: 4 }}>Research Laboratory — Solar Cell Characterization</div>
        <div style={{ fontSize: 11, color: t.textD, marginTop: 6 }}>Under the guidance of Prof. Raymund Sarmiento</div>
      </div>
    </div>
  );
}
