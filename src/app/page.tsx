'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
  useTransform,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  animate,
  type MotionValue,
} from 'framer-motion';
import { SEASON, daysLeft } from '@/lib/season';
import {
  Sprite, P, rocketRows, ROCKET_PAL, ROCKET_LEVELS, FLAME_A, FLAME_B, FLAME_PAL,
  KID_A, KID_B, kidPal, CERT, CERT_PAL, BATTERY, batteryPal, CLOUD, CLOUD_PAL,
  SUN, SUN_PAL, MOON, MOON_PAL, SCHOOL, SCHOOL_PAL,
} from '@/components/pixel/Sprite';

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

const GROUND = '20vh'; // 지면 높이

// 재생 진행도(--p, 0~1)를 CSS 변수로 두고 불투명도를 CSS 수식으로 계산한다.
const V = 'var(--p, 0)';
/** [a,b]에서 서서히 나타나 [c,d]에서 사라짐 */
const winCss = (a: number, b: number, c: number, d: number) =>
  `clamp(0, min(calc((${V} - ${a}) / ${b - a}), calc((${d} - ${V}) / ${d - c})), 1)`;
const upCss = (a: number, b: number) => `clamp(0, calc((${V} - ${a}) / ${b - a}), 1)`;
const downCss = (a: number, b: number) => `clamp(0, calc((${b} - ${V}) / ${b - a}), 1)`;

/* ------------------------------------------------------------------ */
/* 장면 요소                                                           */
/* ------------------------------------------------------------------ */

const SKY_KEYS = [0, 0.45, 0.72, 0.9, 1];
const SKY: string[][] = [
  // [밤, 밤(조금 밝게), 보라 저녁, 노을, 맑은 낮] — 위에서 아래로 10띠
  ['#0b0f26', '#0e1330', '#121a3d', '#18224d', '#1f2c5e', '#283772', '#32448a', '#3d52a0', '#4a62b5', '#5a72c5'],
  ['#0d1230', '#11183a', '#162147', '#1c2a58', '#243569', '#2e427e', '#3a519a', '#4561b0', '#5271c4', '#6283d4'],
  ['#1a1440', '#241a55', '#2f2068', '#3b277a', '#4a2f8a', '#5c3a98', '#7344a4', '#8c50ac', '#a85fb0', '#c470b0'],
  ['#5a4fcf', '#7a5fd0', '#9a6fd0', '#ba7fcf', '#d98fc4', '#f09fb4', '#ffaf9f', '#ffbf8f', '#ffcf80', '#ffdf75'],
  ['#4aa8ff', '#5db4ff', '#70c0ff', '#84ccff', '#98d6ff', '#b0e0ff', '#c8eaff', '#ffe9b8', '#ffd89a', '#ffc27d'],
];
function SkyBand({ p, i }: { p: MotionValue<number>; i: number }) {
  const backgroundColor = useTransform(p, SKY_KEYS, SKY.map((s) => s[i]));
  return <motion.div style={{ backgroundColor }} className="flex-1" />;
}

function Stars() {
  const [stars, setStars] = useState<{ x: number; y: number; big: boolean; b: boolean }[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(Array.from({ length: 70 }, () => ({ x: Math.random() * 100, y: Math.random() * 70, big: Math.random() > 0.8, b: Math.random() > 0.5 })));
  }, []);
  return (
    <div style={{ opacity: downCss(0.7, 0.93) }} className="absolute inset-0 pointer-events-none" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.b ? 'px-slow-a' : 'px-slow-b'}`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `calc(var(--px) * ${s.big ? 2 : 1})`, height: `calc(var(--px) * ${s.big ? 2 : 1})`, background: s.big && s.b ? P.yellow : '#fff' }}
        />
      ))}
    </div>
  );
}

function Dialog({ range, title, sub }: { range: [number, number, number, number]; title: string; sub?: string }) {
  return (
    <div style={{ opacity: winCss(...range) }} className="absolute inset-x-0 top-[11vh] flex justify-center px-4 pointer-events-none">
      <div className="px-box px-4 md:px-6 py-3 max-w-xl text-center">
        <h2 className="font-black text-lg md:text-2xl leading-snug text-white">{title}</h2>
        {sub && <p className="mt-1.5 text-xs md:text-base" style={{ color: P.lime }}>{sub}</p>}
      </div>
    </div>
  );
}

/** 지면 기준 좌표(--px 단위)로 아치를 그리며 로켓으로 날아드는 아이템 */
function Flyer({
  p, s, e, from, children,
}: { p: MotionValue<number>; s: number; e: number; from: [number, number]; children: React.ReactNode }) {
  const x = useTransform(p, [s, e], [from[0], 0]);
  const y = useTransform(p, [s, (s + e) / 2, e], [from[1], Math.max(from[1], 20) + 26, 14]);
  const sc = useTransform(p, [s, e - 0.012, e], [1, 1, 0.3]);
  const opacity = useTransform(p, [s - 0.001, s, e - 0.006, e], [0, 1, 1, 0]);
  const transform = useMotionTemplate`translate(calc(var(--px) * ${x}), calc(var(--px) * ${y} * -1)) scale(${sc})`;
  return (
    <motion.div style={{ transform, opacity, left: '50%', bottom: GROUND }} className="absolute pointer-events-none z-10">
      <div style={{ transform: 'translate(-50%, 50%)' }}>{children}</div>
    </motion.div>
  );
}

const KIDS = [
  { x: -36, pal: kidPal('#3b2a1a', '#ff004d', '#29366f') },
  { x: -24, pal: kidPal('#ffcd75', '#29adff', '#5f574f') },
  { x: 24, pal: kidPal('#1a1c2c', '#ffec27', '#257179') },
  { x: 36, pal: kidPal('#b13e53', '#a7f070', '#3b5dc9') },
];

function Kid({ x, pal, i, wave }: { x: number; pal: ReturnType<typeof kidPal>; i: number; wave: boolean }) {
  return (
    <div className="absolute" style={{ left: `calc(50% + var(--px) * ${x - 4})`, bottom: GROUND }}>
      <div className="relative">
        <Sprite rows={KID_A} palette={pal} className={wave ? (i % 2 ? 'px-b' : 'px-a') : undefined} />
        {wave && <Sprite rows={KID_B} palette={pal} className={`absolute inset-0 ${i % 2 ? 'px-a' : 'px-b'}`} />}
      </div>
    </div>
  );
}

function RocketSprite({ fuel }: { fuel: MotionValue<number> }) {
  const [n, setN] = useState(0);
  useMotionValueEvent(fuel, 'change', (v) => {
    const next = Math.round(v * ROCKET_LEVELS);
    setN((cur) => (cur === next ? cur : next));
  });
  return <Sprite rows={rocketRows(n)} palette={ROCKET_PAL} />;
}

function Flame() {
  return (
    <div style={{ opacity: upCss(0.64, 0.66) }} className="absolute left-1/2 -translate-x-1/2" aria-hidden>
      <div style={{ marginTop: 'calc(var(--px) * -1)' }} className="relative">
        <Sprite rows={FLAME_A} palette={FLAME_PAL} className="px-a" />
        <Sprite rows={FLAME_B} palette={FLAME_PAL} className="px-b absolute left-0 top-0" />
      </div>
    </div>
  );
}

function Puffs() {
  const dxs = [-14, -8, -3, 3, 8, 14];
  return (
    <div style={{ opacity: winCss(0.64, 0.66, 0.78, 0.82), bottom: GROUND }} className="absolute left-1/2 z-[5] pointer-events-none" aria-hidden>
      {dxs.map((dx, i) => (
        <span
          key={i}
          className="absolute px-puff"
          style={{
            ['--dx' as string]: `calc(var(--px) * ${dx})`,
            left: `calc(var(--px) * ${dx / 2})`,
            width: 'calc(var(--px) * 3)', height: 'calc(var(--px) * 3)',
            background: i % 2 ? '#ffffff' : P.lgrey, animationDelay: `${i * 0.13}s`,
          }}
        />
      ))}
    </div>
  );
}

function Cloud({ p, left, scale, start }: { p: MotionValue<number>; left: string; scale: number; start: number }) {
  const y = useTransform(p, [start, start + 0.1], ['-25vh', '115vh']);
  return (
    <motion.div style={{ y, left }} className="absolute top-0 pointer-events-none" aria-hidden>
      <Sprite rows={CLOUD} palette={CLOUD_PAL} scale={scale} />
    </motion.div>
  );
}

function HudBody({ p }: { p: MotionValue<number> }) {
  const [fuelN, setFuelN] = useState(0);
  const [cert, setCert] = useState(0);
  const fuel = useTransform(p, [0.42, 0.62], [0, 10]);
  const certs = useTransform(p, [0.2, 0.4], [0, SEASON.goal]);
  useMotionValueEvent(fuel, 'change', (v) => setFuelN((c) => (c === Math.round(v) ? c : Math.round(v))));
  useMotionValueEvent(certs, 'change', (v) => setCert((c) => (c === Math.round(v) ? c : Math.round(v))));
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="w-12" style={{ color: P.yellow }}>CERT</span>
        <span className="tabular-nums">{String(cert).padStart(3, '0')}/{SEASON.goal}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12" style={{ color: P.lime }}>FUEL</span>
        <span className="flex gap-[3px]">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{ width: 8, height: 12, background: i < fuelN ? P.lime : '#3a3f5e' }} />
          ))}
        </span>
      </div>
    </>
  );
}

// 상태 갱신으로 다시 그려질 때 진행도 연동 스타일이 낡은 값으로 덮이지 않도록,
// 상태는 모두 자식 컴포넌트(HudBody, Kids, RocketSprite)에 둔다.
function Hud({ p }: { p: MotionValue<number> }) {
  return (
    <div style={{ opacity: winCss(0.17, 0.2, 0.9, 0.94) }} className="absolute left-3 top-3 z-20 px-box px-3 py-2 text-[11px] md:text-sm text-white space-y-1.5 pointer-events-none">
      <HudBody p={p} />
    </div>
  );
}

function Kids({ p }: { p: MotionValue<number> }) {
  const [waving, setWaving] = useState(false);
  useMotionValueEvent(p, 'change', (v) => setWaving((w) => (w === v > 0.72 ? w : v > 0.72)));
  return <>{KIDS.map((k, i) => <Kid key={i} x={k.x} pal={k.pal} i={i} wave={waving} />)}</>;
}

/* ------------------------------------------------------------------ */
/* 스토리                                                              */
/* ------------------------------------------------------------------ */

const DURATION = 13; // 초: 자동 재생 길이

function Story() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const p = useMotionValue(0);
  useMotionValueEvent(p, 'change', (v) => stage.current?.style.setProperty('--p', String(v)));

  // 열리자마자 자동 재생 (모션 줄이기 설정이면 마지막 화면으로 바로)
  const play = React.useCallback(() => {
    p.set(0);
    return animate(p, 1, { duration: DURATION, ease: 'linear' });
  }, [p]);
  useEffect(() => {
    stage.current?.style.setProperty('--p', String(p.get()));
    if (reduce) { p.set(1); return; }
    const controls = play();
    return () => controls.stop();
  }, [p, play, reduce]);

  const fuel = useTransform(p, [0.42, 0.62], [0, 1]);
  const rocketY = useTransform(p, [0.72, 0.93], ['0vh', '-125vh']);
  const shake = useTransform(p, (v) => (v > 0.64 && v < 0.8 ? (Math.round(v * 120) % 2 ? 1 : -1) * (v < 0.72 ? 1 : 2) * 3 : 0));
  const groundY = useTransform(p, [0.72, 0.9], ['0vh', '60vh']);

  // 최종 장면(피날레) 클릭 활성화는 자식 컴포넌트의 상태로 처리
  return (
    <div>
      <div ref={stage} className="relative h-[100dvh] overflow-hidden font-px text-white" style={{ ['--px' as string]: 'clamp(3px, 1.1vw, 6px)' }}>
        {/* 하늘 (10단 띠) */}
        <div className="absolute inset-0 flex flex-col" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => <SkyBand key={i} p={p} i={i} />)}
        </div>
        <Stars />

        {/* 달 → 해 */}
        <div style={{ opacity: downCss(0.35, 0.6) }} className="absolute right-[10%] top-[9vh]" aria-hidden>
          <Sprite rows={MOON} palette={MOON_PAL} scale={1.2} />
        </div>
        <div style={{ opacity: upCss(0.8, 0.84), transform: `translateY(calc(45vh * ${downCss(0.8, 0.97)}))` }} className="absolute right-[12%] top-[22vh]" aria-hidden>
          <Sprite rows={SUN} palette={SUN_PAL} scale={1.6} />
        </div>

        <Link href="/board" className="absolute top-3 right-3 z-30 px-box px-3 py-1.5 text-xs md:text-sm">SKIP ▶</Link>
        <Hud p={p} />

        <Dialog range={[0, 0.03, 0.13, 0.18]} title="내성초 친구들이 클릭온 AI를 시작했어요" sub="하나, 둘… 클릭! 새로운 AI 세상으로" />
        <Dialog range={[0.2, 0.24, 0.38, 0.44]} title="인증서가 하나씩 모여요" sub="체험하고, 코딩하고, 데이터를 만나며 받은 인증서!" />
        <Dialog range={[0.44, 0.48, 0.6, 0.64]} title="AI·디지털 능력이 로켓의 연료가 돼요" sub="배움이 쌓일수록 추진력이 가득 차오릅니다" />
        <Dialog range={[0.78, 0.82, 0.9, 0.95]} title="더 높이, 더 밝은 미래를 향해!" sub="우리가 함께 쏘아 올린 로켓이 하늘을 가릅니다" />

        {/* 구름 */}
        <Cloud p={p} left="8%" scale={2} start={0.74} />
        <Cloud p={p} left="62%" scale={2.6} start={0.77} />
        <Cloud p={p} left="30%" scale={2.2} start={0.8} />
        <Cloud p={p} left="76%" scale={1.8} start={0.83} />
        <Cloud p={p} left="4%" scale={2.4} start={0.86} />

        {/* 지상 */}
        <motion.div style={{ y: groundY, height: GROUND }} className="absolute inset-x-0 bottom-0" aria-hidden>
          <div className="absolute inset-x-0 top-0" style={{ height: 'calc(var(--px) * 2)', background: 'repeating-linear-gradient(90deg,#38b764 0 calc(var(--px)*4),#a7f070 calc(var(--px)*4) calc(var(--px)*6),#38b764 calc(var(--px)*6) calc(var(--px)*10))' }} />
          <div className="absolute inset-x-0 bottom-0" style={{ top: 'calc(var(--px) * 2)', background: 'repeating-linear-gradient(0deg,#733e39 0 calc(var(--px)*4),#5c2f2b calc(var(--px)*4) calc(var(--px)*8))' }} />
        </motion.div>

        {/* 학교 · 아이들 · 발사대 (지면과 함께 내려감) */}
        <motion.div style={{ y: groundY }} className="absolute inset-0 pointer-events-none">
          <div className="hidden sm:block absolute left-[3%]" style={{ bottom: GROUND }}>
            <Sprite rows={SCHOOL} palette={SCHOOL_PAL} scale={1.4} />
          </div>
          <Kids p={p} />
          {/* 발사대 */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: GROUND, width: 'calc(var(--px) * 20)', height: 'calc(var(--px) * 2)', background: P.grey, boxShadow: `inset 0 calc(var(--px)*0.7) 0 ${P.lgrey}` }} />
          <div className="absolute" style={{ left: 'calc(50% - var(--px) * 15)', bottom: GROUND, width: 'calc(var(--px) * 3)', height: 'calc(var(--px) * 26)', background: `repeating-linear-gradient(0deg, ${P.grey} 0 calc(var(--px)*2), ${P.lgrey} calc(var(--px)*2) calc(var(--px)*3))` }} />
        </motion.div>

        {/* 1장: CLICK! */}
        <div style={{ opacity: winCss(0, 0.03, 0.13, 0.18) }} className="absolute inset-0 pointer-events-none" aria-hidden>
          {KIDS.map((k, i) => (
            <div key={i} className="absolute" style={{ left: `calc(50% + var(--px) * ${k.x - 5})`, bottom: `calc(${GROUND} + var(--px) * 17)` }}>
              <span className={`${i % 2 ? 'px-slow-a' : 'px-slow-b'} block px-2 py-0.5 text-[10px] md:text-xs font-black`} style={{ background: P.yellow, color: P.ink, border: `2px solid ${P.ink}` }}>CLICK!</span>
            </div>
          ))}
        </div>

        {/* 2장: 인증서가 아이들 손에서 로켓으로 */}
        {KIDS.flatMap((k, i) => [0, 1].map((r) => {
          const s = 0.2 + (i * 2 + r) * 0.024;
          return (
            <Flyer key={`c${i}${r}`} p={p} s={s} e={s + 0.06} from={[k.x, 12]}>
              <Sprite rows={CERT} palette={CERT_PAL} scale={1.2} />
            </Flyer>
          );
        }))}

        {/* 3장: 연료 배터리가 하늘에서 로켓으로 */}
        {[
          { x: -46, c: '#29adff', t: 'AI 활용', s: 0.44 },
          { x: 46, c: '#a7f070', t: 'AI 코딩', s: 0.48 },
          { x: -46, c: '#ffec27', t: '데이터', s: 0.52 },
          { x: 46, c: '#ff77a8', t: 'AI 서비스', s: 0.56 },
        ].map((b) => (
          <Flyer key={b.t} p={p} s={b.s} e={b.s + 0.06} from={[b.x, 80]}>
            <div className="flex flex-col items-center">
              <Sprite rows={BATTERY} palette={batteryPal(b.c)} scale={1.5} />
              <span className="mt-1 px-1.5 text-[10px] md:text-xs font-black whitespace-nowrap" style={{ background: P.ink }}>{b.t}</span>
            </div>
          </Flyer>
        ))}

        {/* 카운트다운 */}
        {([[winCss(0.62, 0.635, 0.655, 0.665), '3'], [winCss(0.665, 0.68, 0.7, 0.71), '2'], [winCss(0.71, 0.725, 0.74, 0.75), '1']] as const).map(([o, n]) => (
          <div key={n} style={{ opacity: o }} className="absolute inset-x-0 top-[22vh] text-center font-black leading-none pointer-events-none text-[26vw] md:text-[14rem]" >
            <span style={{ color: '#fff', textShadow: `calc(var(--px)*1.5) calc(var(--px)*1.5) 0 ${P.red}` }}>{n}</span>
          </div>
        ))}

        {/* 로켓 */}
        <Puffs />
        <motion.div style={{ y: rocketY, x: shake, bottom: `calc(${GROUND} + var(--px) * 2)` }} className="absolute left-1/2 z-10" >
          <div style={{ transform: 'translateX(-50%)' }} className="relative">
            <RocketSprite fuel={fuel} />
            <Flame />
          </div>
        </motion.div>

        {/* 피날레 */}
        <Finale p={p}>
          <div className="px-box p-6 md:p-10 text-center max-w-xl">
            <p className="text-xs md:text-sm" style={{ color: P.lime }}>2026 클릭온 AI {SEASON.name} · D-{daysLeft()}</p>
            <h1 className="mt-3 font-black text-2xl md:text-5xl leading-snug text-white">
              내성초 AI 마스터<br />챌린지 <span style={{ color: P.yellow }}>2기</span>
            </h1>
            <p className="mt-3 text-sm md:text-lg">다 같이 로켓을 쏘아 올려요!</p>
            <ul className="mt-4 text-left text-xs md:text-sm space-y-1 inline-block" style={{ color: P.lgrey }}>
              <li><span style={{ color: P.cyan }}>▸</span> 10/15 ~ 11/25 · 프로그램 {SEASON.programs}개 · 기관 {SEASON.institutions}곳</li>
              <li><span style={{ color: P.cyan }}>▸</span> 신규 프로그램 {SEASON.newPrograms}개 + <span style={{ color: P.yellow }}>인증서 랭킹 이벤트</span></li>
            </ul>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/board" className="inline-block px-6 py-3 font-black text-lg md:text-2xl" style={{ background: P.yellow, color: P.ink, border: `4px solid ${P.ink}`, boxShadow: '4px 4px 0 #000' }}>
                <span className="px-slow-a inline-block">▶</span> PRESS START
              </Link>
              <button onClick={play} className="px-box px-3 py-2 text-xs md:text-sm" aria-label="다시 보기">↻ REPLAY</button>
            </div>
          </div>
        </Finale>
      </div>
    </div>
  );
}

function Finale({ p, children }: { p: MotionValue<number>; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  useMotionValueEvent(p, 'change', (v) => setOn((c) => (c === v > 0.93 ? c : v > 0.93)));
  return (
    <div style={{ opacity: upCss(0.9, 0.97), pointerEvents: on ? 'auto' : 'none' }} className="absolute inset-0 z-20 flex items-center justify-center px-4">
      {children}
    </div>
  );
}

export default function Intro() {
  return (
    <main className="h-[100dvh] overflow-hidden" style={{ background: SKY[0][0] }}>
      <Story />
    </main>
  );
}
