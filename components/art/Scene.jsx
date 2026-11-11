import { useId } from "react";
import { C } from "./palette.js";

/* Reusable bits ---------------------------------------------------------- */

function Bauble({ cx, cy, r, color, uid, i }) {
  const gid = `${uid}-b${i}`;
  return (
    <g>
      <line x1={cx} y1={cy - r - 10} x2={cx} y2={cy - r} stroke={C.champagne} strokeWidth="1" opacity="0.5" />
      <circle cx={cx} cy={cy - r - 10} r="2" fill={C.champagne} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity="0.28" />
      <radialGradient id={gid} cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="24%" stopColor={color} />
        <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
    </g>
  );
}

function Flame({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C 10 -14 6 -26 0 -34 C -7 -25 -10 -14 0 0 Z" fill={C.flame} opacity="0.95" />
      <path d="M0 -3 C 6 -13 3 -21 0 -27 C -4 -20 -6 -12 0 -3 Z" fill={C.emberWarm} />
    </g>
  );
}

function Bokeh({ uid, dots }) {
  return (
    <g>
      {dots.map((d, i) => {
        const gid = `${uid}-bo${i}`;
        return (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={d.r * 3} fill={`url(#${gid})`} opacity={d.o ?? 0.5} />
            <circle cx={d.x} cy={d.y} r={d.r} fill={C.champagneBright} opacity={(d.o ?? 0.5) + 0.3} />
            <radialGradient id={gid} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={C.emberWarm} stopOpacity="0.8" />
              <stop offset="100%" stopColor={C.emberWarm} stopOpacity="0" />
            </radialGradient>
          </g>
        );
      })}
    </g>
  );
}

/* Tree used in hero + trees category ------------------------------------ */
function Tree({ uid, x, y, scale = 1 }) {
  const g = `${uid}-tree`;
  const tiers = [
    { w: 150, h: 92, y: 0 },
    { w: 125, h: 84, y: 58 },
    { w: 98, h: 76, y: 116 },
    { w: 70, h: 66, y: 170 },
  ];
  const lights = [
    [-48, 40], [38, 52], [-20, 70], [30, 96], [-40, 104], [12, 128],
    [-28, 150], [26, 160], [-6, 186], [-34, 70], [48, 88], [6, 56],
  ];
  const baubles = [
    { x: -40, y: 56, c: C.burgundy }, { x: 34, y: 74, c: C.champagne },
    { x: -14, y: 104, c: C.champagne }, { x: 24, y: 132, c: C.burgundy },
    { x: -34, y: 150, c: C.champagne }, { x: 6, y: 170, c: C.burgundy },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-14" y="226" width="28" height="30" rx="3" fill="#3a2a1d" />
      {tiers.map((t, i) => (
        <path
          key={i}
          d={`M0 ${t.y - 6} L ${t.w / 2} ${t.y + t.h} L ${-t.w / 2} ${t.y + t.h} Z`}
          fill={`url(#${g}-f)`}
          stroke={C.pineDark}
          strokeWidth="1"
        />
      ))}
      {lights.map(([lx, ly], i) => (
        <g key={i}>
          <circle cx={lx} cy={ly} r="6" fill={`url(#${g}-l)`} />
          <circle cx={lx} cy={ly} r="1.7" fill={C.cream} />
        </g>
      ))}
      {baubles.map((b, i) => (
        <Bauble key={i} cx={b.x} cy={b.y} r={7} color={b.c} uid={`${uid}t`} i={i} />
      ))}
      {/* star */}
      <g transform="translate(0 -22)">
        <circle cx="0" cy="0" r="26" fill={`url(#${g}-s)`} />
        <path
          d="M0 -16 L4 -5 L15 -5 L6 2 L9 13 L0 6 L-9 13 L-6 2 L-15 -5 L-4 -5 Z"
          fill={C.champagneBright}
        />
      </g>
      <defs>
        <linearGradient id={`${g}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.pineLight} />
          <stop offset="100%" stopColor={C.pineDark} />
        </linearGradient>
        <radialGradient id={`${g}-l`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.emberWarm} stopOpacity="0.95" />
          <stop offset="100%" stopColor={C.emberWarm} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${g}-s`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.champagneBright} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.champagneBright} stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
}

function Present({ x, y, w, h, color, ribbon }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width={w} height={h} rx="3" fill={color} />
      <rect x={w / 2 - 4} y="0" width="8" height={h} fill={ribbon} opacity="0.9" />
      <rect x="0" y={h / 2 - 4} width={w} height="8" fill={ribbon} opacity="0.9" />
      <path d={`M${w / 2} 0 q -12 -12 -2 -14 q 4 8 2 14`} fill={ribbon} />
      <path d={`M${w / 2} 0 q 12 -12 2 -14 q -4 8 -2 14`} fill={ribbon} />
    </g>
  );
}

/* Scenes ----------------------------------------------------------------- */

function Hero({ uid }) {
  const snow = Array.from({ length: 22 }, (_, i) => ({
    x: 30 + ((i * 53) % 160) + (i % 3) * 6,
    y: 70 + ((i * 37) % 150),
    r: 1 + (i % 3) * 0.6,
  }));
  return (
    <svg viewBox="0 0 820 620" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A warm, candlelit living room decorated for Christmas">
      <defs>
        <radialGradient id={`${uid}-bg`} cx="62%" cy="58%" r="85%">
          <stop offset="0%" stopColor="#38191a" />
          <stop offset="48%" stopColor={C.wine} />
          <stop offset="100%" stopColor={C.bg} />
        </radialGradient>
        <linearGradient id={`${uid}-win`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.night} />
          <stop offset="100%" stopColor={C.nightDeep} />
        </linearGradient>
        <radialGradient id={`${uid}-fire`} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={C.emberWarm} />
          <stop offset="55%" stopColor={C.flame} />
          <stop offset="100%" stopColor={C.wine} />
        </radialGradient>
        <radialGradient id={`${uid}-fireglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.ember} stopOpacity="0.55" />
          <stop offset="100%" stopColor={C.ember} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="820" height="620" fill={`url(#${uid}-bg)`} />
      {/* floor */}
      <rect x="0" y="516" width="820" height="104" fill="#000" opacity="0.32" />

      {/* window, left */}
      <g>
        <rect x="46" y="96" width="196" height="300" rx="6" fill="#20140f" />
        <rect x="56" y="106" width="176" height="280" rx="4" fill={`url(#${uid}-win)`} />
        {snow.map((s, i) => (
          <circle key={i} cx={56 + s.x} cy={106 + s.y} r={s.r} fill="#cfe0ef" opacity="0.7" />
        ))}
        <rect x="142" y="106" width="4" height="280" fill="#20140f" />
        <rect x="56" y="244" width="176" height="4" fill="#20140f" />
        <rect x="40" y="388" width="208" height="12" rx="3" fill="#2a1a12" />
      </g>

      {/* wreath on wall, upper right */}
      <g transform="translate(626 150)">
        <circle r="54" fill="none" stroke={C.pine} strokeWidth="20" />
        <circle r="54" fill="none" stroke={C.pineLight} strokeWidth="7" opacity="0.6" />
        <circle cx="-30" cy="-40" r="4" fill={C.burgundy} />
        <circle cx="34" cy="-30" r="4" fill={C.champagne} />
        <circle cx="44" cy="26" r="4" fill={C.burgundy} />
        <circle cx="-38" cy="30" r="4" fill={C.champagne} />
        <path d="M0 52 q -14 24 -4 34 q 4 -8 4 -16 q 0 8 4 16 q 10 -10 -4 -34 Z" fill={C.burgundy} />
      </g>

      {/* mantel + fireplace, right */}
      <g>
        <rect x="470" y="430" width="330" height="190" fill="#1a0f0c" />
        <rect x="486" y="446" width="150" height="150" rx="6" fill={`url(#${uid}-fire)`} />
        <circle cx="561" cy="540" r="150" fill={`url(#${uid}-fireglow)`} />
        <rect x="498" y="560" width="126" height="16" rx="4" fill="#2b1a12" />
        <Flame x={540} y={566} s={1.5} />
        <Flame x={566} y={566} s={2.1} />
        <Flame x={592} y={566} s={1.4} />
        <rect x="458" y="414" width="360" height="22" rx="4" fill="#241410" />
        {/* garland on mantel */}
        <path d="M470 418 q 60 36 120 2 q 60 -34 120 2 q 40 24 90 2" fill="none" stroke={C.pine} strokeWidth="14" strokeLinecap="round" />
        {[500, 560, 620, 690, 760].map((gx, i) => (
          <circle key={i} cx={gx} cy={420 + (i % 2) * 8} r="4" fill={i % 2 ? C.champagne : C.burgundy} />
        ))}
      </g>

      {/* tree, centre */}
      <Tree uid={uid} x={352} y={214} scale={1.06} />

      {/* presents at the base */}
      <g>
        <Present x={300} y={470} w={64} h={46} color={C.burgundy} ribbon={C.champagne} />
        <Present x={366} y={486} w={52} h={32} color="#7c5a3a" ribbon={C.cream} />
        <Present x={258} y={492} w={46} h={26} color={C.champagne} ribbon={C.burgundy} />
      </g>

      {/* bokeh */}
      <Bokeh
        uid={uid}
        dots={[
          { x: 300, y: 150, r: 2.4, o: 0.5 }, { x: 710, y: 300, r: 2, o: 0.45 },
          { x: 440, y: 470, r: 2.6, o: 0.5 }, { x: 150, y: 470, r: 2, o: 0.4 },
          { x: 660, y: 470, r: 2.2, o: 0.5 }, { x: 390, y: 120, r: 1.8, o: 0.4 },
        ]}
      />
      {/* vignette */}
      <rect width="820" height="620" fill="url(#noop)" />
      <rect width="820" height="620" fill="#000" opacity="0.0" />
    </svg>
  );
}

function Ornaments({ uid }) {
  const items = [
    { x: 150, y: 150, r: 46, c: C.burgundy, h: 70 },
    { x: 300, y: 120, r: 54, c: C.champagne, h: 60 },
    { x: 452, y: 158, r: 44, c: C.wine, h: 64 },
    { x: 226, y: 250, r: 40, c: C.champagne, h: 150 },
    { x: 386, y: 262, r: 38, c: C.burgundy, h: 140 },
  ];
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Christmas baubles">
      <rect width="600" height="460" fill={C.bg2} />
      <rect width="600" height="460" fill={`url(#${uid}-v)`} />
      {items.map((b, i) => (
        <g key={i}>
          <line x1={b.x} y1={b.y - b.r - b.h} x2={b.x} y2={b.y - b.r} stroke={C.champagne} strokeWidth="1.2" opacity="0.4" />
          <circle cx={b.x} cy={b.y - b.r - b.h} r="3" fill={C.champagne} opacity="0.6" />
          <rect x={b.x - 6} y={b.y - b.r - 10} width="12" height="12" rx="2" fill={C.champagne} />
          <Bauble cx={b.x} cy={b.y} r={b.r} color={b.c} uid={`${uid}o`} i={i} />
        </g>
      ))}
      <Bokeh uid={uid} dots={[{ x: 90, y: 360, r: 2.4 }, { x: 520, y: 330, r: 2.6 }, { x: 300, y: 400, r: 2 }]} />
      <defs>
        <radialGradient id={`${uid}-v`} cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor={C.wine} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.bg} stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function FairyLights({ uid }) {
  const strands = [60, 150, 240, 330];
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Warm fairy lights">
      <rect width="600" height="460" fill={C.bg} />
      <rect width="600" height="460" fill={`url(#${uid}-g)`} />
      {strands.map((sy, si) => {
        const dots = Array.from({ length: 11 }, (_, i) => ({
          x: 20 + i * 56,
          y: sy + Math.sin(i * 0.9 + si) * 22 + 40,
          r: 2 + ((i + si) % 3) * 0.7,
          o: 0.4 + ((i + si) % 3) * 0.2,
        }));
        return (
          <g key={si}>
            <path
              d={`M0 ${sy + 40} ${dots.map((d) => `L ${d.x} ${d.y}`).join(" ")} L 600 ${sy + 40}`}
              fill="none"
              stroke={C.champagne}
              strokeOpacity="0.18"
              strokeWidth="1.2"
            />
            <Bokeh uid={`${uid}s${si}`} dots={dots} />
          </g>
        );
      })}
      <defs>
        <radialGradient id={`${uid}-g`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={C.wine} stopOpacity="0.45" />
          <stop offset="100%" stopColor={C.bg} stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Candles({ uid }) {
  const set = [
    { x: 210, y: 300, w: 44, h: 150 },
    { x: 300, y: 270, w: 50, h: 196 },
    { x: 392, y: 300, w: 44, h: 150 },
  ];
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Pillar candles">
      <rect width="600" height="460" fill={C.bg2} />
      <radialGradient id={`${uid}-glow`} cx="50%" cy="42%" r="55%">
        <stop offset="0%" stopColor={C.ember} stopOpacity="0.5" />
        <stop offset="100%" stopColor={C.ember} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-wax`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8a6b4b" />
        <stop offset="40%" stopColor={C.champagne} />
        <stop offset="100%" stopColor="#7c5c3e" />
      </linearGradient>
      <ellipse cx="300" cy="230" rx="240" ry="150" fill={`url(#${uid}-glow)`} />
      {set.map((c, i) => (
        <g key={i}>
          <rect x={c.x - c.w / 2} y={c.y} width={c.w} height={c.h} rx="4" fill={`url(#${uid}-wax)`} />
          <ellipse cx={c.x} cy={c.y} rx={c.w / 2} ry="6" fill="#efe0cb" />
          <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - 10} stroke="#2a1c12" strokeWidth="2" />
          <Flame x={c.x} y={c.y - 10} s={1.5} />
          <ellipse cx={c.x} cy={c.y + c.h} rx={c.w / 2 + 10} ry="7" fill="#000" opacity="0.3" />
        </g>
      ))}
    </svg>
  );
}

function Wreaths({ uid }) {
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Evergreen wreath">
      <rect width="600" height="460" fill={C.bg} />
      <radialGradient id={`${uid}-g`} cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor={C.wine} stopOpacity="0.5" />
        <stop offset="100%" stopColor={C.bg} stopOpacity="0" />
      </radialGradient>
      <rect width="600" height="460" fill={`url(#${uid}-g)`} />
      <g transform="translate(300 220)">
        <circle r="132" fill="none" stroke={C.pineDark} strokeWidth="56" />
        <circle r="132" fill="none" stroke={C.pine} strokeWidth="46" />
        <circle r="132" fill="none" stroke={C.pineLight} strokeWidth="14" opacity="0.5" />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const col = i % 2 ? C.champagne : C.burgundy;
          return <circle key={i} cx={Math.cos(a) * 132} cy={Math.sin(a) * 132} r="8" fill={col} />;
        })}
        {/* bow */}
        <g transform="translate(0 132)">
          <path d="M0 0 q -34 -14 -40 10 q -4 20 40 6 Z" fill={C.burgundy} />
          <path d="M0 0 q 34 -14 40 10 q 4 20 -40 6 Z" fill={C.burgundy} />
          <path d="M0 0 q -10 34 -22 46 q 16 2 24 -36 Z" fill={C.wine} />
          <path d="M0 0 q 10 34 22 46 q -16 2 -24 -36 Z" fill={C.wine} />
          <circle r="9" fill={C.champagne} />
        </g>
      </g>
    </svg>
  );
}

function Trees({ uid }) {
  return (
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Decorated Christmas tree">
      <rect width="600" height="460" fill={C.bg2} />
      <radialGradient id={`${uid}-g`} cx="50%" cy="46%" r="62%">
        <stop offset="0%" stopColor={C.wine} stopOpacity="0.55" />
        <stop offset="100%" stopColor={C.bg} stopOpacity="0" />
      </radialGradient>
      <rect width="600" height="460" fill={`url(#${uid}-g)`} />
      <Tree uid={uid} x={300} y={110} scale={1.25} />
      <ellipse cx="300" cy="440" rx="130" ry="16" fill="#000" opacity="0.3" />
    </svg>
  );
}

function Presents({ uid }) {
  return (
    <svg viewBox="0 0 760 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Wrapped Christmas presents">
      <defs>
        <radialGradient id={`${uid}-g`} cx="70%" cy="60%" r="80%">
          <stop offset="0%" stopColor="#7a2230" />
          <stop offset="100%" stopColor={C.burgundy} />
        </radialGradient>
      </defs>
      <rect width="760" height="420" fill={`url(#${uid}-g)`} />
      {/* pine sprig, top */}
      <g transform="translate(590 40)" opacity="0.9">
        <path d="M0 0 q 60 10 120 -6" stroke={C.pine} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M30 2 l -8 -18 M70 0 l 2 -20 M110 -6 l 10 -16" stroke={C.pine} strokeWidth="6" strokeLinecap="round" />
      </g>
      <Present x={300} y={210} w={150} h={120} color="#8a6a46" ribbon={C.cream} />
      <Present x={470} y={240} w={140} h={120} color={C.wine} ribbon={C.champagne} />
      <Present x={250} y={300} w={120} h={80} color={C.champagne} ribbon={C.burgundy} />
      <g>
        <Bauble cx={620} cy={300} r={26} color={C.champagne} uid={`${uid}p`} i={0} />
        <Bauble cx={226} cy={250} r={20} color={C.burgundy} uid={`${uid}p`} i={1} />
      </g>
      <Bokeh uid={uid} dots={[{ x: 120, y: 120, r: 2.6 }, { x: 680, y: 150, r: 2.2 }, { x: 420, y: 90, r: 2 }]} />
    </svg>
  );
}

const SCENES = {
  hero: Hero,
  ornaments: Ornaments,
  fairylights: FairyLights,
  candles: Candles,
  wreaths: Wreaths,
  trees: Trees,
  presents: Presents,
};

export default function Scene({ name, className }) {
  const uid = useId().replace(/[:]/g, "");
  const Cmp = SCENES[name] || Ornaments;
  return (
    <div className={className} aria-hidden="true">
      <Cmp uid={uid} />
    </div>
  );
}
