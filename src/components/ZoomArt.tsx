import { useId } from 'react';

/**
 * Two drawn video-call scenes for the Academy offers: a 1-on-1 lesson with a
 * shared whiteboard, and a camp session in gallery view. The call window is
 * dark in both themes (as video apps are); only its outer frame follows the
 * site's ink colour. Styling lives in visuals.css under .zoom-art.
 */

const C = {
  window: '#1b2b35',
  bar: '#24394a',
  tile: '#2e4556',
  barText: '#c9dbe5',
  board: '#fbfdfe',
  boardInk: '#0a2b3f',
  speaking: '#7cbb73',
  sub: '#f2b52c',
  leave: '#e2624a',
  label: 'rgba(5, 19, 29, 0.72)',
};

type Person = { skin: string; hair: string; shirt: string; style: 'short' | 'long' | 'bun' | 'curly' };

/** A head-and-shoulders figure centred in a video tile. */
function Figure({
  x,
  y,
  w,
  h,
  person,
  headset = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  person: Person;
  headset?: boolean;
}) {
  const cx = x + w / 2;
  const r = Math.min(w, h) * 0.19;
  const cy = y + h * 0.44;
  const shoulderTop = cy + r * 1.15;
  const { skin, hair, shirt, style } = person;
  return (
    <g>
      {style === 'long' && (
        <rect x={cx - r * 1.08} y={cy - r * 0.2} width={r * 2.16} height={r * 1.6} rx={r * 0.4} fill={hair} />
      )}
      <path
        d={`M${cx - r * 2.1} ${y + h} Q${cx - r * 2.1} ${shoulderTop} ${cx} ${shoulderTop} Q${cx + r * 2.1} ${shoulderTop} ${cx + r * 2.1} ${y + h} Z`}
        fill={shirt}
      />
      <circle cx={cx} cy={cy} r={r} fill={skin} />
      {style === 'curly' ? (
        <g fill={hair}>
          {[-0.75, -0.25, 0.25, 0.75].map((dx) => (
            <circle key={dx} cx={cx + dx * r} cy={cy - r * 0.78} r={r * 0.42} />
          ))}
        </g>
      ) : (
        <path d={`M${cx - r} ${cy - r * 0.05} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.05} L${cx + r * 0.7} ${cy - r * 0.42} L${cx - r * 0.7} ${cy - r * 0.42} Z`} fill={hair} />
      )}
      {style === 'bun' && <circle cx={cx} cy={cy - r * 1.15} r={r * 0.42} fill={hair} />}
      <circle cx={cx - r * 0.36} cy={cy + r * 0.12} r={r * 0.11} fill="#1a1a1a" />
      <circle cx={cx + r * 0.36} cy={cy + r * 0.12} r={r * 0.11} fill="#1a1a1a" />
      <path
        d={`M${cx - r * 0.3} ${cy + r * 0.45} Q${cx} ${cy + r * 0.68} ${cx + r * 0.3} ${cy + r * 0.45}`}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth={r * 0.1}
        strokeLinecap="round"
      />
      {headset && (
        <g fill="none" stroke="#11181d" strokeWidth={r * 0.18} strokeLinecap="round">
          <path d={`M${cx - r * 1.05} ${cy} A${r * 1.05} ${r * 1.05} 0 0 1 ${cx + r * 1.05} ${cy}`} />
          <path d={`M${cx - r * 1.02} ${cy + r * 0.25} Q${cx - r * 0.9} ${cy + r * 0.95} ${cx - r * 0.2} ${cy + r * 0.82}`} />
          <rect x={cx - r * 1.25} y={cy - r * 0.1} width={r * 0.3} height={r * 0.6} rx={r * 0.1} fill="#11181d" />
        </g>
      )}
    </g>
  );
}

function Tile({
  x,
  y,
  w,
  h,
  label,
  speaking = false,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  speaking?: boolean;
  children?: React.ReactNode;
}) {
  const id = useId();
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} rx={3} />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={C.tile} />
      <g clipPath={`url(#${id})`}>{children}</g>
      {label && (
        <g>
          <rect x={x + 3} y={y + h - 11} width={label.length * 4.2 + 6} height={8} rx={2} fill={C.label} />
          <text x={x + 6} y={y + h - 5} className="zoom-art__text" fontSize={6} fill="#fff">
            {label}
          </text>
        </g>
      )}
      {speaking && <rect x={x} y={y} width={w} height={h} rx={3} fill="none" stroke={C.speaking} strokeWidth={2} />}
    </g>
  );
}

/** Mic, camera, share, chat and hand, with a red Leave button. */
function Toolbar({ y, highlight }: { y: number; highlight: 'share' | 'hand' }) {
  const icons: Array<{ key: 'mic' | 'cam' | 'share' | 'chat' | 'hand'; x: number }> = [
    { key: 'mic', x: 96 },
    { key: 'cam', x: 124 },
    { key: 'share', x: 152 },
    { key: 'chat', x: 180 },
    { key: 'hand', x: 208 },
  ];
  const cy = y + 14;
  return (
    <g>
      <rect x={0} y={y} width={320} height={190 - y} fill={C.bar} />
      {icons.map(({ key, x }) => {
        const on = key === highlight;
        const ink = on ? C.window : C.barText;
        return (
          <g key={key}>
            {on && <rect x={x - 10} y={cy - 9} width={20} height={18} rx={4} fill={key === 'share' ? C.speaking : C.sub} />}
            {key === 'mic' && (
              <g fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round">
                <rect x={x - 2.5} y={cy - 6} width={5} height={8} rx={2.5} fill={ink} />
                <path d={`M${x - 4.5} ${cy} Q${x - 4.5} ${cy + 5} ${x} ${cy + 5} Q${x + 4.5} ${cy + 5} ${x + 4.5} ${cy}`} />
                <path d={`M${x} ${cy + 5} V${cy + 7}`} />
              </g>
            )}
            {key === 'cam' && (
              <g fill={ink}>
                <rect x={x - 6} y={cy - 4} width={8.5} height={8} rx={1.5} />
                <path d={`M${x + 3} ${cy - 1} L${x + 6.5} ${cy - 3.5} V${cy + 3.5} L${x + 3} ${cy + 1} Z`} />
              </g>
            )}
            {key === 'share' && (
              <g fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <rect x={x - 6} y={cy - 5} width={12} height={9} rx={1.5} />
                <path d={`M${x} ${cy + 2} V${cy - 2.5} M${x - 2.5} ${cy} L${x} ${cy - 2.5} L${x + 2.5} ${cy}`} />
              </g>
            )}
            {key === 'chat' && (
              <path
                d={`M${x - 6} ${cy - 5} H${x + 6} V${cy + 3} H${x - 1} L${x - 4} ${cy + 6} V${cy + 3} H${x - 6} Z`}
                fill="none"
                stroke={ink}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            )}
            {key === 'hand' && <Hand x={x} y={cy} size={7} fill={ink} />}
          </g>
        );
      })}
      <rect x={262} y={cy - 7} width={46} height={14} rx={7} fill={C.leave} />
      <text x={285} y={cy + 2.5} textAnchor="middle" className="zoom-art__text" fontSize={7} fill="#fff">
        Leave
      </text>
    </g>
  );
}

/** A raised hand: palm and four fingers. */
function Hand({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  const s = size / 7;
  return (
    <g fill={fill} transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-4} y={-1} width={8} height={7} rx={2.5} />
      {[-3.4, -1.2, 1, 3.2].map((fx, i) => (
        <rect key={fx} x={fx - 0.9} y={i === 0 || i === 3 ? -5 : -6.5} width={1.8} height={7} rx={0.9} />
      ))}
      <rect x={3.2} y={0} width={1.8} height={4.5} rx={0.9} transform="rotate(-35 4 2)" />
    </g>
  );
}

/** The window chrome both scenes share. */
function CallWindow({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  const clip = useId();
  return (
    <svg className="zoom-art" viewBox="0 0 320 190" role="img" aria-label={label}>
      <clipPath id={clip}>
        <rect x={0} y={0} width={320} height={190} rx={9} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect width={320} height={190} fill={C.window} />
        <rect width={320} height={20} fill={C.bar} />
        <circle cx={12} cy={10} r={3.5} fill={C.leave} />
        <circle cx={22} cy={10} r={3.5} fill={C.sub} />
        <circle cx={32} cy={10} r={3.5} fill={C.speaking} />
        <text x={160} y={13.5} textAnchor="middle" className="zoom-art__text" fontSize={8} fill={C.barText}>
          {title}
        </text>
        {children}
      </g>
      <rect className="zoom-art__frame" x={1.5} y={1.5} width={317} height={187} rx={8} />
    </svg>
  );
}

const TUTOR: Person = { skin: '#e8b98f', hair: '#2a1d16', shirt: '#4e93b5', style: 'short' };
const STUDENT: Person = { skin: '#f1cba6', hair: '#3a2a20', shirt: '#f2b52c', style: 'long' };

/** A 1-on-1 lesson: the tutor works a problem on a shared whiteboard. */
export function TutoringRoom() {
  return (
    <CallWindow
      title="1-on-1 lesson · screen shared"
      label="Illustration: a one-on-one video lesson. The tutor shares a whiteboard working an AMC 8 geometry problem, with the tutor and student on camera beside it."
    >
      {/* Shared whiteboard */}
      <rect x={10} y={28} width={204} height={126} rx={3} fill={C.board} />
      <text x={18} y={42} className="zoom-art__text" fontSize={8} fontWeight={700} fill={C.boardInk}>
        AMC 8 · Problem 14
      </text>
      <path d="M36 134 V72 L112 134 Z" fill="#fdf1cf" stroke={C.boardInk} strokeWidth={2} strokeLinejoin="round" />
      <path d="M36 126 H44 V134" fill="none" stroke={C.boardInk} strokeWidth={1.5} />
      <text x={25} y={106} className="zoom-art__text" fontSize={9} fill={C.boardInk}>3</text>
      <text x={70} y={147} className="zoom-art__text" fontSize={9} fill={C.boardInk}>4</text>
      <text x={78} y={98} className="zoom-art__text" fontSize={9} fontWeight={700} fill={C.leave}>?</text>
      <g className="zoom-art__text" fontSize={8.5} fill={C.boardInk}>
        <text x={124} y={74}>3² + 4² = c²</text>
        <text x={124} y={92}>9 + 16 = 25</text>
        <text x={124} y={112} fontWeight={700} fill="#3f7a3a">c = 5 ✓</text>
      </g>
      <path d="M126 116 Q150 122 176 115" fill="none" stroke="#3f7a3a" strokeWidth={1.6} strokeLinecap="round" />
      {/* the tutor's pen */}
      <g transform="translate(182 103) rotate(35)">
        <rect x={0} y={-2.5} width={18} height={5} rx={1} fill={C.sub} stroke={C.boardInk} strokeWidth={1} />
        <path d="M18 -2.5 L23 0 L18 2.5 Z" fill="#f1cba6" stroke={C.boardInk} strokeWidth={1} />
      </g>
      {/* Cameras */}
      <Tile x={220} y={28} w={90} h={60} label="Tutor" speaking>
        <Figure x={220} y={28} w={90} h={60} person={TUTOR} headset />
      </Tile>
      <Tile x={220} y={94} w={90} h={60} label="You">
        <Figure x={220} y={94} w={90} h={60} person={STUDENT} />
      </Tile>
      <Toolbar y={162} highlight="share" />
    </CallWindow>
  );
}

const CAMPERS: Person[] = [
  { skin: '#c68e63', hair: '#1a1210', shirt: '#7cbb73', style: 'curly' },
  { skin: '#f1cba6', hair: '#6b4426', shirt: '#e2624a', style: 'bun' },
  { skin: '#8d5a3b', hair: '#140e0b', shirt: '#9ed3ea', style: 'short' },
  { skin: '#e8b98f', hair: '#2a1d16', shirt: '#f2b52c', style: 'long' },
  { skin: '#f6d5b8', hair: '#c79a4a', shirt: '#c4cdd4', style: 'short' },
];

/** A camp session in gallery view: the coach talking, a hand up, the chat. */
export function CampRoom() {
  const cols = [10, 82, 154];
  const rows = [28, 94];
  const w = 66;
  const h = 60;
  const cells = rows.flatMap((y) => cols.map((x) => ({ x, y })));
  return (
    <CallWindow
      title="AMC 8 camp · live session"
      label="Illustration: a live camp session in gallery view. The coach is speaking, five students are on camera, one has a hand raised, and questions come in on the chat."
    >
      {cells.map(({ x, y }, index) =>
        index === 0 ? (
          <Tile key={index} x={x} y={y} w={w} h={h} label="Coach" speaking>
            <Figure x={x} y={y} w={w} h={h} person={TUTOR} headset />
          </Tile>
        ) : (
          <Tile key={index} x={x} y={y} w={w} h={h}>
            <Figure x={x} y={y} w={w} h={h} person={CAMPERS[index - 1]} />
          </Tile>
        ),
      )}
      {/* a hand up on the last tile */}
      <rect x={154 + w - 20} y={94 + 4} width={16} height={16} rx={4} fill={C.sub} />
      <Hand x={154 + w - 12} y={94 + 13} size={6} fill={C.window} />
      {/* chat */}
      <rect x={226} y={28} width={84} height={126} rx={3} fill={C.bar} />
      <text x={234} y={41} className="zoom-art__text" fontSize={7} fill={C.barText}>
        Chat
      </text>
      <g>
        <rect x={232} y={48} width={64} height={18} rx={5} fill={C.tile} />
        <rect x={237} y={53} width={44} height={3} rx={1.5} fill={C.barText} opacity={0.7} />
        <rect x={237} y={59} width={30} height={3} rx={1.5} fill={C.barText} opacity={0.7} />
        <rect x={244} y={72} width={60} height={14} rx={5} fill={C.speaking} />
        <rect x={249} y={77} width={40} height={3} rx={1.5} fill={C.window} opacity={0.8} />
        <rect x={232} y={92} width={56} height={18} rx={5} fill={C.tile} />
        <rect x={237} y={97} width={40} height={3} rx={1.5} fill={C.barText} opacity={0.7} />
        <rect x={237} y={103} width={24} height={3} rx={1.5} fill={C.barText} opacity={0.7} />
        <rect x={244} y={116} width={60} height={14} rx={5} fill={C.speaking} />
        <rect x={249} y={121} width={46} height={3} rx={1.5} fill={C.window} opacity={0.8} />
      </g>
      <rect x={232} y={138} width={72} height={10} rx={3} fill={C.window} />
      <Toolbar y={162} highlight="hand" />
    </CallWindow>
  );
}
