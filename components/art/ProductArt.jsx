import { useId } from "react";
import { C } from "./palette.js";

function Frame({ uid, tone = "champagne", children, label }) {
  const glow =
    tone === "burgundy" ? C.burgundy : tone === "green" ? C.pine : C.champagne;
  return (
    <svg viewBox="0 0 400 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <defs>
        <radialGradient id={`${uid}-bgf`} cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor={C.bg2} />
          <stop offset="100%" stopColor={C.bg} />
        </radialGradient>
        <radialGradient id={`${uid}-gl`} cx="50%" cy="44%" r="52%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.4" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="360" fill={`url(#${uid}-bgf)`} />
      <ellipse cx="200" cy="168" rx="150" ry="130" fill={`url(#${uid}-gl)`} />
      {children}
      <ellipse cx="200" cy="316" rx="96" ry="12" fill="#000" opacity="0.28" />
    </svg>
  );
}

function sheen(uid, cx, cy, r, color) {
  const gid = `${uid}-s-${Math.round(cx)}-${Math.round(cy)}`;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.3} ry={r * 0.16} fill="#fff" opacity="0.3" />
      <radialGradient id={gid} cx="38%" cy="32%" r="78%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
        <stop offset="26%" stopColor={color} />
        <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
    </g>
  );
}

const ART = {
  bauble: (uid) => (
    <g>
      <line x1="200" y1="92" x2="200" y2="128" stroke={C.champagne} strokeWidth="2" opacity="0.5" />
      <rect x="190" y="84" width="20" height="18" rx="3" fill={C.champagne} />
      {sheen(uid, 200, 196, 78, C.champagne)}
    </g>
  ),
  ribbon: (uid) => (
    <g transform="translate(200 180)">
      <path d="M0 0 q -70 -34 -86 20 q -8 40 86 12 Z" fill={C.burgundy} />
      <path d="M0 0 q 70 -34 86 20 q 8 40 -86 12 Z" fill={C.burgundy} />
      <path d="M0 0 q -70 -34 -86 20 q -8 40 86 12 Z" fill="#fff" opacity="0.08" />
      <path d="M0 0 q -20 70 -44 94 q 30 6 50 -74 Z" fill={C.wine} />
      <path d="M0 0 q 20 70 44 94 q -30 6 -50 -74 Z" fill={C.wine} />
      <circle r="18" fill={C.champagne} />
    </g>
  ),
  candle: (uid) => (
    <g>
      <linearGradient id={`${uid}-wx`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8a6b4b" />
        <stop offset="42%" stopColor={C.champagne} />
        <stop offset="100%" stopColor="#7c5c3e" />
      </linearGradient>
      <rect x="160" y="150" width="80" height="150" rx="6" fill={`url(#${uid}-wx)`} />
      <ellipse cx="200" cy="150" rx="40" ry="9" fill="#efe0cb" />
      <line x1="200" y1="150" x2="200" y2="132" stroke="#2a1c12" strokeWidth="3" />
      <path d="M200 132 C 214 112 208 96 200 84 C 192 96 186 112 200 132 Z" fill={C.flame} />
      <path d="M200 128 C 208 114 204 104 200 96 C 196 104 192 114 200 128 Z" fill={C.emberWarm} />
    </g>
  ),
  wreath: () => (
    <g transform="translate(200 176)">
      <circle r="92" fill="none" stroke={C.pineDark} strokeWidth="42" />
      <circle r="92" fill="none" stroke={C.pine} strokeWidth="32" />
      <circle r="92" fill="none" stroke={C.pineLight} strokeWidth="9" opacity="0.5" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * 92} cy={Math.sin(a) * 92} r="6" fill={i % 2 ? C.champagne : C.burgundy} />;
      })}
      <g transform="translate(0 92)">
        <path d="M0 0 q -26 -10 -30 8 q -3 16 30 4 Z" fill={C.burgundy} />
        <path d="M0 0 q 26 -10 30 8 q 3 16 -30 4 Z" fill={C.burgundy} />
        <circle r="7" fill={C.champagne} />
      </g>
    </g>
  ),
  tree: (uid) => (
    <g transform="translate(200 70)">
      <linearGradient id={`${uid}-tf`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.pineLight} />
        <stop offset="100%" stopColor={C.pineDark} />
      </linearGradient>
      <rect x="-10" y="212" width="20" height="24" rx="3" fill="#3a2a1d" />
      {[{ w: 120, y: 20 }, { w: 98, y: 76 }, { w: 74, y: 130 }, { w: 52, y: 178 }].map((t, i) => (
        <path key={i} d={`M0 ${t.y - 4} L ${t.w / 2} ${t.y + 70} L ${-t.w / 2} ${t.y + 70} Z`} fill={`url(#${uid}-tf)`} />
      ))}
      {[[-30, 70], [26, 96], [-14, 120], [20, 150], [-24, 170], [4, 196]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? C.champagne : C.burgundy} />
      ))}
      {[[-34, 52], [30, 64], [0, 108], [-18, 150], [22, 182]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill={C.emberWarm} />
      ))}
      <path d="M0 4 l5 12 l13 0 l-10 8 l4 13 l-12 -8 l-12 8 l4 -13 l-10 -8 l13 0 Z" transform="translate(0 -4)" fill={C.champagneBright} />
    </g>
  ),
  lights: (uid) => (
    <g>
      {[110, 170, 230].map((sy, si) => {
        const dots = Array.from({ length: 7 }, (_, i) => ({ x: 44 + i * 52, y: sy + Math.sin(i + si) * 20 }));
        return (
          <g key={si}>
            <path d={`M20 ${sy} ${dots.map((d) => `L ${d.x} ${d.y}`).join(" ")} L 380 ${sy}`} fill="none" stroke={C.champagne} strokeOpacity="0.2" strokeWidth="1.4" />
            {dots.map((d, i) => (
              <g key={i}>
                <circle cx={d.x} cy={d.y} r="8" fill={`url(#${uid}-lg)`} />
                <circle cx={d.x} cy={d.y} r="2.4" fill={C.cream} />
              </g>
            ))}
          </g>
        );
      })}
      <radialGradient id={`${uid}-lg`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={C.emberWarm} stopOpacity="0.9" />
        <stop offset="100%" stopColor={C.emberWarm} stopOpacity="0" />
      </radialGradient>
    </g>
  ),
  garland: (uid) => (
    <g>
      <path d="M30 150 q 90 80 170 4 q 80 -72 170 6" fill="none" stroke={C.pineDark} strokeWidth="34" strokeLinecap="round" />
      <path d="M30 150 q 90 80 170 4 q 80 -72 170 6" fill="none" stroke={C.pine} strokeWidth="22" strokeLinecap="round" />
      {[70, 130, 200, 270, 330].map((x, i) => (
        <circle key={i} cx={x} cy={150 + Math.sin(i) * 20 + 14} r="7" fill={i % 2 ? C.champagne : C.burgundy} />
      ))}
      {[100, 170, 240, 300].map((x, i) => (
        <circle key={i} cx={x} cy={150 + Math.cos(i) * 18} r="2.4" fill={C.emberWarm} />
      ))}
    </g>
  ),
  votive: (uid) => (
    <g>
      <radialGradient id={`${uid}-vg`} cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor={C.champagneBright} />
        <stop offset="100%" stopColor="#6c543a" />
      </radialGradient>
      <path d="M150 170 q 50 -16 100 0 l -8 110 q -42 14 -84 0 Z" fill={`url(#${uid}-vg)`} />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={160 + (i % 5) * 20} cy={190 + Math.floor(i / 5) * 24} r="2" fill="#fff" opacity="0.25" />
      ))}
      <ellipse cx="200" cy="170" rx="50" ry="10" fill="#2a1c12" />
      <path d="M200 170 C 212 150 206 136 200 126 C 194 136 188 150 200 170 Z" fill={C.flame} />
      <path d="M200 166 C 206 154 203 146 200 140 C 197 146 194 154 200 166 Z" fill={C.emberWarm} />
    </g>
  ),
  star: () => (
    <g transform="translate(200 176)">
      <circle r="70" fill="none" stroke={C.champagne} strokeWidth="2" opacity="0.25" />
      <path d="M0 -84 L20 -26 L82 -26 L32 12 L52 72 L0 36 L-52 72 L-32 12 L-82 -26 L-20 -26 Z" fill={C.burgundy} />
      <path d="M0 -58 L13 -18 L55 -18 L22 8 L35 50 L0 24 L-35 50 L-22 8 L-55 -18 L-13 -18 Z" fill={C.champagne} />
      <circle r="10" fill={C.cream} />
    </g>
  ),
  minitree: (uid) => (
    <g transform="translate(200 96)">
      <linearGradient id={`${uid}-mt`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.pineLight} />
        <stop offset="100%" stopColor={C.pineDark} />
      </linearGradient>
      <path d="M160 200 q 40 24 80 0 l -10 40 q -30 14 -60 0 Z" fill="#6b7076" transform="translate(-160 0)" />
      {[{ w: 96, y: 30 }, { w: 72, y: 84 }, { w: 50, y: 134 }].map((t, i) => (
        <path key={i} d={`M0 ${t.y - 4} L ${t.w / 2} ${t.y + 64} L ${-t.w / 2} ${t.y + 64} Z`} fill={`url(#${uid}-mt)`} />
      ))}
      {[[-22, 70], [20, 96], [-6, 130], [14, 150]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={C.emberWarm} />
      ))}
      <circle cx="0" cy="26" r="5" fill={C.champagneBright} />
    </g>
  ),
  pomander: (uid) => (
    <g>
      <radialGradient id={`${uid}-po`} cx="40%" cy="34%" r="70%">
        <stop offset="0%" stopColor="#f2a65a" />
        <stop offset="100%" stopColor="#a85a1e" />
      </radialGradient>
      <line x1="200" y1="96" x2="200" y2="128" stroke={C.burgundy} strokeWidth="4" />
      <circle cx="200" cy="190" r="66" fill={`url(#${uid}-po)`} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const rr = 20 + (i % 3) * 16;
        return <circle key={i} cx={200 + Math.cos(a) * rr} cy={190 + Math.sin(a) * rr} r="2.4" fill="#5a3310" />;
      })}
      <path d="M200 256 q -16 20 -6 30 q 6 -6 6 -12 q 0 6 6 12 q 10 -10 -6 -30 Z" fill={C.burgundy} />
    </g>
  ),
  curtain: (uid) => (
    <g>
      <radialGradient id={`${uid}-cg`} cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor={C.emberWarm} stopOpacity="0.8" />
        <stop offset="100%" stopColor={C.emberWarm} stopOpacity="0" />
      </radialGradient>
      {Array.from({ length: 9 }, (_, col) => {
        const x = 50 + col * 38;
        const n = 5 + (col % 3);
        return (
          <g key={col}>
            <line x1={x} y1="80" x2={x} y2={80 + n * 44} stroke={C.champagne} strokeOpacity="0.15" strokeWidth="1" />
            {Array.from({ length: n }, (_, r) => {
              const y = 100 + r * 44;
              return (
                <g key={r}>
                  <circle cx={x} cy={y} r="7" fill={`url(#${uid}-cg)`} />
                  <circle cx={x} cy={y} r="2" fill={C.cream} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  ),
};

export default function ProductArt({ art, tone, className, label }) {
  const uid = useId().replace(/[:]/g, "");
  const render = ART[art] || ART.bauble;
  return (
    <div className={className}>
      <Frame uid={uid} tone={tone} label={label || "Product illustration"}>
        {render(uid)}
      </Frame>
    </div>
  );
}
