import React from 'react';

export type Palette = Record<string, string>;

/** 문자 격자로 그리는 픽셀 스프라이트. 크기 단위는 CSS 변수 --px */
export function Sprite({
  rows, palette, scale = 1, className, style,
}: {
  rows: string[];
  palette: Palette;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const w = rows[0].length;
  const h = rows.length;
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const ch = row[x];
      if (ch === '.' || !palette[ch]) { x++; continue; }
      let e = x;
      while (e < w && row[e] === ch) e++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={e - x} height={1} fill={palette[ch]} />);
      x = e;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
      style={{ display: 'block', width: `calc(var(--px) * ${w * scale})`, height: `calc(var(--px) * ${h * scale})`, ...style }}
    >
      {rects}
    </svg>
  );
}

/* ---------------- 팔레트 ---------------- */
export const P = {
  ink: '#1a1c2c', white: '#f4f4f4', red: '#ff004d', pink: '#ff77a8', cyan: '#29adff',
  lime: '#a7f070', yellow: '#ffec27', orange: '#ffa300', grey: '#5f574f', lgrey: '#c2c3c7',
  green: '#38b764', dgreen: '#257179', brown: '#733e39', skin: '#ffccaa',
};

/* ---------------- 로켓 (14x24) ---------------- */
const ROCKET = [
  '......kk......',
  '.....kRRk.....',
  '....kRRRRk....',
  '....kRRRRk....',
  '...kRRRRRRk...',
  '...kRRRRRRk...',
  '...kkkkkkkk...',
  '...kbbbbbbk...', // 7 ┐ 연료가 차오르는 몸통 (7~20)
  '..kbbkkkkbbk..',
  '..kbkccccKbk..'.replace('K', 'k'),
  '..kbkcWcckbk..',
  '..kbbkkkkbbk..',
  '..kbbbbbbbbk..',
  '..kbbbbbbbbk..',
  '..kbbbbbbbbk..',
  '..kbbbbbbbbk..',
  '.kkkbbbbbbkkk.',
  'kFFkbbbbbbkFFk',
  'kFFkbbbbbbkFFk',
  'kFFkbbbbbbkFFk',
  'kkkkbbbbbbkkkk',
  '...kkkkkkkk...',
  '....kDDDDk....',
  '....kkkkkk....',
];
export const ROCKET_LEVELS = 14;
const rocketCache = new Map<number, string[]>();
export function rocketRows(fill: number): string[] {
  const n = Math.max(0, Math.min(ROCKET_LEVELS, fill));
  const hit = rocketCache.get(n);
  if (hit) return hit;
  const rows = ROCKET.map((r, i) => (i >= 7 && i <= 20 && 20 - i < n ? r.replace(/b/g, 'g') : r));
  rocketCache.set(n, rows);
  return rows;
}
export const ROCKET_PAL: Palette = {
  k: P.ink, R: P.red, b: P.white, g: P.lime, F: P.pink, c: P.cyan, W: '#ffffff', D: P.grey,
};

/* ---------------- 불꽃 (6x8) 2프레임 ---------------- */
export const FLAME_A = ['oyyyyo', 'oyyyyo', '.oyyo.', '.oyyo.', '..oo..', '..oo..'];
export const FLAME_B = ['oyyyyo', 'oyWWyo', '.oyyo.', '.oyyo.', '..oo..', '..oo..', '..oo..', '...o..'];
export const FLAME_PAL: Palette = { o: P.orange, y: P.yellow, W: '#ffffff' };

/* ---------------- 아이 (8x14) ---------------- */
export const KID_A = [
  '..hhhh..', '.hhhhhh.', '.hssssh.', '.skssks.', '.ssssss.', '..ssss..', '.TTTTTT.',
  'sTTTTTTs', 'sTTTTTTs', '.TTTTTT.', '.PPPPPP.', '.PP..PP.', '.PP..PP.', '.kk..kk.',
];
export const KID_B = [ // 한 팔 들기
  '..hhhh..', '.hhhhhh.', '.hssssh.', '.skssks.', '.sssssss', '..ssss.s', '.TTTTTTs',
  'sTTTTTT.', 'sTTTTTT.', '.TTTTTT.', '.PPPPPP.', '.PP..PP.', '.PP..PP.', '.kk..kk.',
];
export const kidPal = (hair: string, shirt: string, pants: string): Palette => ({
  h: hair, s: P.skin, k: P.ink, T: shirt, P: pants,
});

/* ---------------- 인증서 (10x8) / 배터리 (8x8) / 구름 (20x5) ---------------- */
export const CERT = [
  'kkkkkkkkkk', 'kYYYYYYYYk', 'kYwwwwwwYk', 'kYwbbbbwYk', 'kYwwwwwwYk', 'kYwrrrwwYk', 'kYwwwwwwYk', 'kkkkkkkkkk',
];
export const CERT_PAL: Palette = { k: P.ink, Y: P.yellow, w: P.white, b: P.cyan, r: P.red };
export const BATTERY = ['..kkkk..', 'kkkkkkkk', 'kGGGGGGk', 'kGwGGGGk', 'kGGGGGGk', 'kGGGGGGk', 'kGGGGGGk', 'kkkkkkkk'];
export const batteryPal = (g: string): Palette => ({ k: P.ink, G: g, w: '#ffffff' });
export const CLOUD = [
  '.....wwww..........', '...wwwwwwww.wwww....', '.wwwwwwwwwwwwwwwww..', 'wwwwwwwwwwwwwwwwwwww', '.sssssssssssssssss..',
].map((r) => r.padEnd(20, '.').slice(0, 20));
export const CLOUD_PAL: Palette = { w: '#ffffff', s: '#b8d8f0' };

/* ---------------- 해 / 달 ---------------- */
export function disc(r: number, inner: string, outer?: string): string[] {
  const rows: string[] = [];
  for (let y = -r; y <= r; y++) {
    let row = '';
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= (r - 1.5) * (r - 1.5)) row += inner;
      else if (d <= r * r + r * 0.4) row += outer ?? inner;
      else row += '.';
    }
    rows.push(row);
  }
  return rows;
}
export const SUN = disc(7, 'y', 'o');
export const SUN_PAL: Palette = { y: P.yellow, o: P.orange };
export const MOON = disc(5, 'w', 's').map((r, i) => (i === 4 ? r.replace(/w/, 'c') : r));
export const MOON_PAL: Palette = { w: '#f4f4f4', s: '#c2c3c7', c: '#9a9aa8' };

/* ---------------- 학교 건물 (30x16) ---------------- */
export const SCHOOL = [
  '..............ff..............',
  '..............ffff............',
  '..............f...............',
  '.........rrrrrrrrrrr..........',
  '......rrrrrrrrrrrrrrrrr.......',
  '....bbbbbbbbbbbbbbbbbbbbb.....',
  '....bwwbbwwbbbbbwwbbwwbbb.....',
  '....bwwbbwwbbbbbwwbbwwbbb.....',
  '....bbbbbbbbbbbbbbbbbbbbb.....',
  '....bwwbbwwbbddbbwwbbwwbb.....',
  '....bwwbbwwbbddbbwwbbwwbb.....',
  '....bbbbbbbbbddbbbbbbbbbb.....',
  '....bbbbbbbbbddbbbbbbbbbb.....',
  '..kkkkkkkkkkkkkkkkkkkkkkkkk...',
];
export const SCHOOL_PAL: Palette = { f: P.red, r: P.brown, b: '#f0d9a8', w: P.cyan, d: P.brown, k: P.grey };
