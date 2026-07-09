/* Instrument logo + inline icon set (no external icon dependency). */

/**
 * Solavin mark — an I-V sweep curve rising like a vine out of the baseline,
 * sprouting a leaf at its tip, with an amber "sun" at the maximum-power knee.
 * Reads cleanly from 24px up to hero sizes. Each instance namespaces its
 * gradient ids by size so multiple logos on a page don't collide.
 */
export function Logo(p) {
  const sz = p.s || 28;
  const uid = "sv" + Math.round(sz);
  return (
    <svg width={sz} height={sz} viewBox="0 0 40 40" fill="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={uid + "bg"} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#0a1410" />
          <stop offset="1" stopColor="#0c1726" />
        </linearGradient>
        <linearGradient id={uid + "vine"} x1="6" y1="34" x2="34" y2="6">
          <stop stopColor="#10b981" />
          <stop offset=".5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={uid + "leaf"} x1="26" y1="16" x2="36" y2="4">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#a3e635" />
        </linearGradient>
        <radialGradient id={uid + "sun"} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <rect width="40" height="40" rx={sz * 0.26} fill={`url(#${uid}bg)`} stroke="rgba(52,211,153,.35)" strokeWidth="0.6" />
      {/* baseline + y-axis */}
      <path d="M8 31 L32 31 M8 9 L8 31" stroke="rgba(125,211,252,.32)" strokeWidth="0.8" strokeLinecap="round" />
      {/* the I-V "vine" rising from the soil line */}
      <path d="M9 31 Q12 20 19 17.5 Q27 14.5 29 8" stroke={`url(#${uid}vine)`} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* leaf at the tip */}
      <path d="M29 8 C33 8 36 6 37 2 C32.5 2.4 29.4 4.6 28.4 8.2 C28.2 9 28.4 9.4 29 8 Z" fill={`url(#${uid}leaf)`} />
      <path d="M30 6.6 C32 5.4 34 4.4 36 3.4" stroke="#0a1410" strokeWidth="0.5" strokeLinecap="round" opacity="0.5" />
      {/* small lower leaf */}
      <path d="M16 18.6 C13 19.8 11 19 9.5 16.6 C12.6 15.8 15 16.3 16 18.6 Z" fill="#34d399" opacity="0.85" />
      {/* amber sun at the maximum-power knee */}
      <circle cx="19" cy="17.5" r="2" fill={`url(#${uid}sun)`} stroke="#fff7e6" strokeWidth="0.5" />
    </svg>
  );
}

function SI(ch, p) {
  return (
    <svg
      width={p.s || 16}
      height={p.s || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || "currentColor"}
      strokeWidth={p.w || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={p.st || {}}
    >
      {ch}
    </svg>
  );
}

export const Ic = {
  Home: (p) => SI(<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, p),
  Act: (p) => SI(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />, p),
  Up: (p) => SI(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>, p),
  Bar3: (p) => SI(<><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>, p),
  Upl: (p) => SI(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>, p),
  Chv: (p) => SI(<><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></>, p),
  Sun: (p) => SI(<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>, p),
  Moon: (p) => SI(<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />, p),
  Out: (p) => SI(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>, p),
  Snd: (p) => SI(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>, p),
  Bot: (p) => SI(<><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></>, p),
  Xx: (p) => SI(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, p),
  Plus: (p) => SI(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, p),
  File: (p) => SI(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></>, p),
  Book: (p) => SI(<><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>, p),
  Rad: (p) => SI(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>, p),
  Search: (p) => SI(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>, p),
  Info: (p) => SI(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, p),
  Dl: (p) => SI(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>, p),
  Chart: (p) => SI(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>, p),
  Target: (p) => SI(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>, p),
  Play: (p) => SI(<polygon points="5 3 19 12 5 21 5 3" />, p),
  Table: (p) => SI(<><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></>, p),
  Arrow: (p) => SI(<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>, p),
  Eye: (p) => SI(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, p),
};
