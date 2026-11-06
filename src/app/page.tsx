'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { SEASON, daysLeft } from '@/lib/season';

/* ------------------------------------------------------------------ */
/* 공통 유틸                                                           */
/* ------------------------------------------------------------------ */

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(to);
      return;
    }
    const c = animate(mv, to, { duration: 1.6, ease: 'easeOut' });
    return () => c.stop();
  }, [inView, reduce, to, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** 스크롤 구간 [a,b]에서 나타났다가 [c,d]에서 사라지는 불투명도 */
function useWindow(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
}

/* ------------------------------------------------------------------ */
/* 장면 요소                                                           */
/* ------------------------------------------------------------------ */

function Caption({
  p, range, title, sub,
}: {
  p: MotionValue<number>;
  range: [number, number, number, number];
  title: string;
  sub?: string;
}) {
  const opacity = useWindow(p, ...range);
  const y = useTransform(p, [range[0], range[1]], [24, 0]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-[13vh] px-6 text-center pointer-events-none">
      <h2 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,.5)]">{title}</h2>
      {sub && <p className="mt-3 text-base md:text-xl font-bold text-indigo-100 drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]">{sub}</p>}
    </motion.div>
  );
}

/** 로켓으로 날아와 빨려 들어가는 인증서/연료 카드 */
function Flyer({
  p, from, to, label, i, className = '',
}: {
  p: MotionValue<number>;
  from: [number, number]; // [vw, vh] 시작 오프셋
  to: [number, number];
  label: React.ReactNode;
  i: number;
  className?: string;
}) {
  const s = to[0]; // 구간 시작
  const e = to[1]; // 구간 끝
  const x = useTransform(p, [s, e], [`${from[0]}vw`, '0vw']);
  const y = useTransform(p, [s, e], [`${from[1]}vh`, '6vh']);
  const scale = useTransform(p, [s, e - 0.02, e], [1, 0.7, 0.1]);
  const opacity = useTransform(p, [s - 0.001, s, e - 0.01, e], [0, 1, 1, 0]);
  const rotate = useTransform(p, [s, e], [i % 2 ? 14 : -14, 0]);
  return (
    <motion.div
      style={{ x, y, scale, opacity, rotate }}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${className}`}
    >
      {label}
    </motion.div>
  );
}

function Cert({ n }: { n: number }) {
  return (
    <div className="w-24 md:w-32 aspect-[4/3] rounded-lg bg-white text-slate-900 shadow-xl border-4 border-yellow-300 p-2 flex flex-col justify-between">
      <div className="h-1.5 w-2/3 bg-indigo-400 rounded" />
      <div className="text-[10px] md:text-xs font-black text-center">🏅 인증서 #{n}</div>
      <div className="h-1.5 w-1/2 bg-slate-300 rounded self-end" />
    </div>
  );
}

function Fuel({ icon, text, hue }: { icon: string; text: string; hue: string }) {
  return (
    <div className="px-4 py-2 rounded-full font-black text-sm md:text-base shadow-xl border-2 border-white/60 flex items-center gap-2" style={{ background: hue, color: '#0b1020' }}>
      <span className="text-xl">{icon}</span>{text}
    </div>
  );
}

function Rocket({ fuel }: { fuel: MotionValue<number> }) {
  const fillY = useTransform(fuel, (v) => 178 - 125 * v); // 연료 표시 높이 (몸통 하단 170 아래에서 시작)
  return (
    <svg viewBox="0 0 120 260" className="w-28 md:w-36 drop-shadow-[0_0_24px_rgba(255,255,255,.35)]" aria-hidden>
      <defs>
        <clipPath id="body"><path d="M60 8 C95 40 100 90 96 170 L24 170 C20 90 25 40 60 8Z" /></clipPath>
        <linearGradient id="bodyg" x1="0" x2="1"><stop offset="0" stopColor="#e8edff" /><stop offset="1" stopColor="#b8c4ff" /></linearGradient>
      </defs>
      {/* 날개 */}
      <path d="M26 120 L0 190 L30 175Z" fill="#ff5d8f" />
      <path d="M94 120 L120 190 L90 175Z" fill="#ff5d8f" />
      <path d="M60 8 C95 40 100 90 96 170 L24 170 C20 90 25 40 60 8Z" fill="url(#bodyg)" />
      {/* 연료(채워지는 부분) */}
      <g clipPath="url(#body)">
        <motion.rect x="0" width="120" height="200" style={{ y: fillY }} fill="#c6ff4d" opacity="0.9" />
      </g>
      <path d="M60 8 C95 40 100 90 96 170 L24 170 C20 90 25 40 60 8Z" fill="none" stroke="#1e1b4b" strokeWidth="3" />
      <circle cx="60" cy="70" r="16" fill="#5ef2ff" stroke="#1e1b4b" strokeWidth="4" />
      <circle cx="55" cy="65" r="4" fill="#fff" opacity=".8" />
      <rect x="40" y="170" width="40" height="14" rx="4" fill="#1e1b4b" />
    </svg>
  );
}

function Flame({ strength }: { strength: MotionValue<number> }) {
  const scaleY = useTransform(strength, [0, 1], [0, 1]);
  return (
    <motion.div style={{ scaleY, opacity: strength, transformOrigin: 'top' }} className="absolute left-1/2 -translate-x-1/2 top-full -mt-8">
      <motion.div
        animate={{ scaleY: [1, 1.35, 0.9, 1.25, 1], scaleX: [1, 0.85, 1.1, 0.9, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: 'top' }}
      >
        <svg viewBox="0 0 60 140" className="w-12 md:w-16" aria-hidden>
          <path d="M30 0 C58 30 50 90 30 140 C10 90 2 30 30 0Z" fill="#ff8a3c" />
          <path d="M30 0 C48 30 42 70 30 100 C18 70 12 30 30 0Z" fill="#ffd54a" />
          <path d="M30 0 C38 24 36 50 30 66 C24 50 22 24 30 0Z" fill="#fff6d0" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function Cloud({ p, left, size, start }: { p: MotionValue<number>; left: string; size: number; start: number }) {
  // 로켓이 올라갈수록 구름이 위에서 아래로 스쳐 지나감
  const y = useTransform(p, [start, start + 0.1], ['-30vh', '120vh']);
  return (
    <motion.div style={{ y, left, top: 0, width: size }} className="absolute pointer-events-none" aria-hidden>
      <div className="h-8 rounded-full bg-white/90 relative">
        <div className="absolute -top-4 left-4 w-1/3 h-10 rounded-full bg-white/90" />
        <div className="absolute -top-6 left-1/2 w-1/3 h-12 rounded-full bg-white/90" />
      </div>
    </motion.div>
  );
}

function Stars({ p }: { p: MotionValue<number> }) {
  const [stars, setStars] = useState<{ x: number; y: number; s: number; t: number }[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(Array.from({ length: 80 }, () => ({ x: Math.random() * 100, y: Math.random() * 80, s: 1 + Math.random() * 2.5, t: 2 + Math.random() * 3 })));
  }, []);
  const opacity = useTransform(p, [0, 0.7, 0.95], [1, 1, 0]);
  return (
    <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none" aria-hidden>
      {stars.map((st, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: st.t, repeat: Infinity }}
        />
      ))}
    </motion.div>
  );
}

/** 장면 1: 클릭하는 커서와 물결 */
function ClickScene({ p }: { p: MotionValue<number> }) {
  const opacity = useWindow(p, 0, 0.03, 0.13, 0.18);
  const spots = [
    { x: '-22vw', y: '4vh', d: 0 },
    { x: '20vw', y: '-6vh', d: 0.5 },
    { x: '-8vw', y: '16vh', d: 1 },
    { x: '28vw', y: '14vh', d: 1.5 },
  ];
  return (
    <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none" aria-hidden>
      {spots.map((s, i) => (
        <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `translate(${s.x}, ${s.y})` }}>
          <motion.span
            className="absolute -left-6 -top-6 w-12 h-12 rounded-full border-4 border-cyan-300"
            animate={{ scale: [0.3, 2], opacity: [0.9, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: s.d }}
          />
          <motion.span className="absolute text-3xl" animate={{ scale: [1, 0.8, 1] }} transition={{ duration: 1.6, repeat: Infinity, delay: s.d }}>
            👆
          </motion.span>
        </div>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 스토리 (스크롤 연동 모션그래픽)                                      */
/* ------------------------------------------------------------------ */

function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // 하늘: 깊은 밤 → 밝은 새벽 (더 밝은 미래)
  const top = useTransform(p, [0, 0.45, 0.72, 0.92, 1], ['#02030d', '#0a0f33', '#1b1f5e', '#5a4fcf', '#7fd1ff']);
  const bottom = useTransform(p, [0, 0.45, 0.72, 0.92, 1], ['#0a0f33', '#1b2a7a', '#3b2a8c', '#ff9a6b', '#ffe7b0']);
  const sky = useMotionTemplate`linear-gradient(to bottom, ${top}, ${bottom})`;

  // 로켓
  const fuel = useTransform(p, [0.42, 0.62], [0, 1], { clamp: true });
  const flame = useTransform(p, [0.64, 0.74], [0, 1], { clamp: true });
  const rocketY = useTransform(p, [0.72, 0.93], ['0vh', '-120vh']);
  const shake = useTransform(p, (v) => (v > 0.64 && v < 0.8 ? Math.sin(v * 900) * (v < 0.72 ? 2 : 4) : 0));
  const glow = useTransform(p, [0.42, 0.62], [0, 0.7]);

  // 지상
  const groundY = useTransform(p, [0.72, 0.9], ['0vh', '60vh']);

  // 카운트다운
  const c3 = useWindow(p, 0.62, 0.635, 0.655, 0.665);
  const c2 = useWindow(p, 0.665, 0.68, 0.7, 0.71);
  const c1 = useWindow(p, 0.71, 0.725, 0.74, 0.75);

  // 목표 숫자
  const goalN = useTransform(p, [0.2, 0.4], [0, SEASON.goal]);
  const goalText = useTransform(goalN, (v) => `${Math.round(v)}`);
  const goalOpacity = useWindow(p, 0.2, 0.24, 0.4, 0.46);

  const hintOpacity = useTransform(p, [0, 0.04, 1], [1, 0, 0]);
  const finalOpacity = useTransform(p, [0.9, 0.97], [0, 1]);
  const finalPointer = useTransform(p, (v) => (v > 0.93 ? 'auto' : 'none'));

  return (
    <div ref={ref} className="relative" style={{ height: '640vh' }}>
      <motion.div style={{ backgroundImage: sky }} className="sticky top-0 h-screen overflow-hidden text-white">
        <Stars p={p} />

        {/* 건너뛰기 */}
        <a href="#info" className="absolute top-4 right-4 z-30 text-sm font-bold px-4 py-2 rounded-full bg-white/15 backdrop-blur border border-white/30">
          건너뛰기 ▸
        </a>

        {/* 자막 */}
        <Caption p={p} range={[0.0, 0.03, 0.13, 0.18]} title="내성초 친구들이 클릭온 AI를 시작했어요" sub="하나, 둘… 클릭! 새로운 AI 세상으로" />
        <Caption p={p} range={[0.2, 0.24, 0.38, 0.44]} title="인증서가 하나씩 모여요" sub="체험하고, 코딩하고, 데이터를 만나며 받은 인증서!" />
        <Caption p={p} range={[0.44, 0.48, 0.6, 0.64]} title="AI·디지털 능력이 로켓의 연료가 돼요" sub="배움이 쌓일수록 추진력이 가득 차오릅니다" />
        <Caption p={p} range={[0.78, 0.82, 0.9, 0.95]} title="더 높이, 더 밝은 미래를 향해!" sub="우리가 함께 쏘아 올린 로켓이 하늘을 가릅니다" />

        <ClickScene p={p} />

        {/* 목표 숫자 */}
        <motion.div style={{ opacity: goalOpacity }} className="absolute inset-x-0 top-[27vh] text-center pointer-events-none">
          <motion.span className="text-6xl md:text-8xl font-black text-yellow-300 tabular-nums drop-shadow-[0_0_24px_rgba(253,224,71,.5)]">{goalText}</motion.span>
          <div className="font-black text-indigo-100">목표 인증서</div>
        </motion.div>

        {/* 인증서 비행 */}
        {[
          { f: [-42, -10], s: 0.2 }, { f: [40, -16], s: 0.23 }, { f: [-38, 22], s: 0.26 }, { f: [42, 20], s: 0.29 },
          { f: [-20, -26], s: 0.31 }, { f: [22, 30], s: 0.34 }, { f: [-44, 4], s: 0.36 }, { f: [44, 2], s: 0.38 },
        ].map((c, i) => (
          <Flyer key={i} p={p} i={i} from={c.f as [number, number]} to={[c.s, c.s + 0.06]} label={<Cert n={i + 1} />} />
        ))}

        {/* 연료(AI 능력) 비행 */}
        {[
          { f: [-40, -8], s: 0.44, icon: '🎨', t: 'AI 활용', h: '#5ef2ff' },
          { f: [40, -12], s: 0.48, icon: '💻', t: 'AI 코딩', h: '#c6ff4d' },
          { f: [-38, 20], s: 0.52, icon: '📊', t: '데이터', h: '#ffd54a' },
          { f: [40, 20], s: 0.56, icon: '🧰', t: 'AI 서비스', h: '#ff9ad5' },
        ].map((c, i) => (
          <Flyer key={c.t} p={p} i={i} from={c.f as [number, number]} to={[c.s, c.s + 0.06]} label={<Fuel icon={c.icon} text={c.t} hue={c.h} />} />
        ))}

        {/* 카운트다운 */}
        {[[c3, '3'], [c2, '2'], [c1, '1']].map(([o, n]) => (
          <motion.div key={n as string} style={{ opacity: o as MotionValue<number> }} className="absolute inset-x-0 top-[18vh] text-center text-[28vw] md:text-[16rem] font-black leading-none text-white pointer-events-none">
            {n as string}
          </motion.div>
        ))}

        {/* 구름 */}
        <Cloud p={p} left="8%" size={180} start={0.74} />
        <Cloud p={p} left="62%" size={240} start={0.77} />
        <Cloud p={p} left="30%" size={200} start={0.8} />
        <Cloud p={p} left="75%" size={160} start={0.83} />
        <Cloud p={p} left="5%" size={220} start={0.86} />

        {/* 지상 + 발사대 */}
        <motion.div style={{ y: groundY }} className="absolute inset-x-0 bottom-0 h-[22vh]" aria-hidden>
          <div className="absolute inset-x-0 bottom-0 h-full bg-[#0b1230]" style={{ clipPath: 'ellipse(75% 100% at 50% 100%)' }} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[16vh] w-44 h-3 bg-slate-500 rounded" />
          <div className="absolute left-1/2 -translate-x-[110px] bottom-[16vh] w-2 h-28 bg-slate-500" />
          <div className="absolute left-1/2 translate-x-[102px] bottom-[16vh] w-2 h-28 bg-slate-500" />
        </motion.div>

        {/* 로켓 */}
        <motion.div style={{ y: rocketY, x: shake }} className="absolute left-1/2 -translate-x-1/2 bottom-[19vh] z-10">
          <motion.div style={{ opacity: glow }} className="absolute -inset-10 rounded-full bg-lime-300 blur-3xl" aria-hidden />
          <div className="relative">
            <Rocket fuel={fuel} />
            <Flame strength={flame} />
          </div>
        </motion.div>

        {/* 스크롤 안내 */}
        <motion.div style={{ opacity: hintOpacity }} className="absolute bottom-6 inset-x-0 text-center z-20 text-sm font-bold text-indigo-100">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            ▼ 스크롤해서 로켓을 발사해요
          </motion.div>
        </motion.div>

        {/* 피날레 */}
        <motion.div style={{ opacity: finalOpacity, pointerEvents: finalPointer }} className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-[14vh] text-center px-6">
          <p className="text-sm font-black tracking-widest text-slate-900/70">2026 클릭온 AI {SEASON.name} · D-{daysLeft()}</p>
          <h1 className="mt-2 text-4xl md:text-7xl font-black text-slate-900 leading-tight">
            내성초 AI 마스터 챌린지 <span className="text-indigo-700">2기</span>
          </h1>
          <p className="mt-3 font-bold text-slate-800 text-lg">다 같이 로켓을 쏘아 올려요 🚀</p>
          <Link href="/board" className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xl shadow-2xl hover:scale-105 transition-transform">
            게시판 입장하기 <ArrowRight className="w-6 h-6" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 모션 줄이기 설정용 정적 히어로                                       */
/* ------------------------------------------------------------------ */

function StaticHero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-[#0b1026] to-[#3b2a8c]">
      <div className="text-7xl">🚀</div>
      <h1 className="mt-4 text-4xl md:text-6xl font-black">내성초 AI 마스터 챌린지 2기</h1>
      <p className="mt-3 font-bold text-indigo-100">클릭온 AI로 쌓은 배움이 우리의 미래를 쏘아 올려요</p>
      <Link href="/board" className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-yellow-300 text-slate-900 font-black text-xl">
        게시판 입장하기 <ArrowRight className="w-6 h-6" />
      </Link>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 하단 안내 섹션                                                      */
/* ------------------------------------------------------------------ */

const CHANGES = [
  { badge: 'NEW', title: '신규 프로그램 10개', body: '시즌1 참가자 의견을 반영해 난이도를 다양화했어요.' },
  { badge: 'UP', title: '44개 프로그램 · 15개 기관', body: 'EBS를 포함한 15개 기관이 참여해요.' },
  { badge: 'NEW', title: '인증서 랭킹 이벤트', body: '이수 인증서 수량으로 순위를 겨뤄요. 우리 학교 랭킹보드와 딱 맞아요!' },
  { badge: 'UP', title: '체험·데이터 분야 강화', body: 'AI 활용 체험과 AI 데이터 활용 부문이 더 풍성해졌어요.' },
];

function Info() {
  const reduce = useReducedMotion();
  return (
    <div id="info" className="bg-[#0b1026] text-white">
      <section className="px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-14">숫자로 보는 클릭온 AI {SEASON.name}</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { n: SEASON.programs, s: '개', l: '프로그램' },
            { n: SEASON.institutions, s: '개', l: '참여 기관' },
            { n: SEASON.newPrograms, s: '개', l: '신규 프로그램' },
            { n: 42, s: '일', l: '10/15 ~ 11/25' },
          ].map((it) => (
            <motion.div key={it.l} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} className="rounded-3xl bg-white/10 border-2 border-white/30 p-6 text-center">
              <div className="text-5xl md:text-6xl font-black text-yellow-300"><CountUp to={it.n} suffix={it.s} /></div>
              <div className="mt-2 font-bold text-indigo-100">{it.l}</div>
            </motion.div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SEASON.areas.map((a, i) => (
            <motion.div key={a.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={reduce ? undefined : { y: -6 }} className="rounded-3xl bg-white text-slate-900 p-6 border-4 border-slate-900 shadow-[5px_5px_0_0_#0f172a]">
              <div className="text-4xl">{a.icon}</div>
              <div className="mt-3 text-xl font-black">{a.name}</div>
              <div className="font-bold text-indigo-600">{a.count}개 프로그램</div>
              {a.note && <span className="inline-block mt-2 px-2 py-0.5 text-xs font-black bg-pink-500 text-white rounded-full">{a.note}</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-14">🔄 1기와 이렇게 달라졌어요</h2>
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-pink-400 rounded" />
          {CHANGES.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-40px' }} className="relative pl-16 pb-10">
              <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-yellow-300 text-slate-900 font-black text-xs flex items-center justify-center border-4 border-[#0b1026]">{c.badge}</div>
              <h3 className="text-xl font-black">{i + 1}. {c.title}</h3>
              <p className="mt-1 text-indigo-200 font-bold">{c.body}</p>
            </motion.div>
          ))}
        </div>
        <p className="max-w-3xl mx-auto text-xs text-slate-400">출처: 클릭온 AI 공식 누리집, 과기정통부 보도자료. 세부 내용은 공식 안내서를 확인하세요.</p>
      </section>

      <section className="px-6 pb-24 text-center">
        <Link href="/board" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-yellow-300 text-slate-900 font-black text-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a]">
          🚀 지금 참여하러 가기
        </Link>
        <div className="mt-6">
          <a href={SEASON.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-indigo-200 underline">
            공식 클릭온 AI 바로가기 <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}

export default function Intro() {
  const reduce = useReducedMotion();
  return (
    <main className="bg-[#0b1026] text-white overflow-x-clip">
      {reduce ? <StaticHero /> : <Story />}
      <Info />
    </main>
  );
}
