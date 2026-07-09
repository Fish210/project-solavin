// Solavin signature gradient: vine-emerald → cyan → violet, with amber as the
// "solar" highlight. Used for the logo, headlines, primary CTAs and accents.
export const GRAD = "linear-gradient(135deg,#10b981 0%,#22d3ee 48%,#7c3aed 100%)";
export const GRAD_SOFT = "linear-gradient(135deg,#34d399 0%,#38bdf8 55%,#a78bfa 100%)";
export const SUN = "#f59e0b";

/** Build the theme palette for dark (true) or light (false) mode. */
export function mkT(dark) {
  const common = { grad: GRAD, gradSoft: GRAD_SOFT, vine: "#34d399", sun: SUN };
  return dark
    ? {
        ...common,
        // Muted text tiers (textM/textD) were lightened from the original
        // #7186a8/#3d4d6e for readability — the gray copy previously sat too
        // close to the background to scan comfortably.
        bg: "#04070e", card: "#0a0f1c", cardAlt: "#0c1220", border: "#152038",
        borderS: "#1d2a45", text: "#e6edf7", textM: "#9db0d0", textD: "#63769b",
        accent: "#22d3ee", accent2: "#7c3aed", accentS: "rgba(34,211,238,.06)",
        accentG: "rgba(34,211,238,.18)", danger: "#f43f5e", success: "#34d399",
        warn: "#f59e0b", inputBg: "#070b16", sidebar: "#06090f", sideH: "#0f1828",
        shadow: "0 12px 48px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.02) inset",
        chatBg: "#05080f", chan: C8,
      }
    : {
        ...common,
        // Light mode darkens both the gray tiers and (via `chan`) the channel
        // colours so coloured table text and axis labels stay legible on white
        // instead of washing out.
        bg: "#f5f7fb", card: "#ffffff", cardAlt: "#fafbfd", border: "#e2e8f0",
        borderS: "#cbd5e1", text: "#0f172a", textM: "#475569", textD: "#64748b",
        accent: "#0891b2", accent2: "#7c3aed", accentS: "rgba(8,145,178,.05)",
        accentG: "rgba(8,145,178,.14)", danger: "#dc2626", success: "#059669",
        warn: "#d97706", inputBg: "#f9fafb", sidebar: "#fafbfd", sideH: "#eef2ff",
        shadow: "0 12px 48px rgba(15,23,42,.06)", chatBg: "#fafbfd", chan: C8_DARK,
      };
}

/** Channel colour palette (cyan → teal sweep) — used for chart strokes. */
export const C8 = [
  "#38bdf8", "#22d3ee", "#a78bfa", "#f472b6", "#fb923c",
  "#facc15", "#34d399", "#f87171", "#818cf8", "#2dd4bf",
];

/** Darker channel palette, index-matched to C8, for coloured *text* on light
 *  backgrounds (raw-data cells, metric values) where the bright strokes lack
 *  contrast. Exposed on the theme as `t.chan`. */
export const C8_DARK = [
  "#0284c7", "#0891b2", "#7c3aed", "#db2777", "#ea580c",
  "#ca8a04", "#059669", "#dc2626", "#4f46e5", "#0d9488",
];
