'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
  animate,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { SEASON, daysLeft } from '@/lib/season';

// 숫자 카운트업 (뷰포트 진입 시 1회)
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
    const controls = animate(mv, to, { duration: 1.6, ease: 'easeOut' });
    return () => controls.stop();
  }, [inView, reduce, to, mv]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

// 별 배경 (SSR/CSR 불일치 방지를 위해 마운트 후 생성)
function Stars() {
  const [stars, setStars] = useState<
    { x: number; y: number; s: number; d: number; t: number }[]
  >([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 70 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 1 + Math.random() * 2.5,
        d: Math.random() * 3,
        t: 2 + Math.random() * 3,
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((st, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: st.t, delay: st.d, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

const CHANGES = [
  {
    badge: 'NEW',
    title: '신규 프로그램 10개',
    body: '시즌1 참가자 의견을 반영해 난이도를 다양화했어요.',
  },
  {
    badge: 'UP',
    title: '44개 프로그램 · 15개 기관',
    body: 'EBS를 포함한 15개 기관이 참여해요.',
  },
  {
    badge: 'NEW',
    title: '인증서 랭킹 이벤트',
    body: '이수 인증서 수량으로 순위를 겨뤄요. 우리 학교 랭킹보드와 딱 맞아요!',
  },
  {
    badge: 'UP',
    title: '체험·데이터 분야 강화',
    body: 'AI 활용 체험과 AI 데이터 활용 부문이 더 풍성해졌어요.',
  },
];

const UPGRADES = [
  '3초 상시 갱신 → 10초 갱신(보이는 화면에서만)으로 가볍게',
  '2기 D-day · 공식 일정 연동',
  '모션그래픽 인트로 + 달라진 점 안내',
  '300 로켓 챌린지는 그대로 유지',
];

export default function Intro() {
  const reduce = useReducedMotion();
  const dday = useMemo(() => daysLeft(), []);

  return (
    <main className="relative bg-[#0b1026] text-white overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1026] via-[#1b1f5e] to-[#3b2a8c]" />
        <Stars />

        {/* 떠다니는 행성 */}
        {!reduce && (
          <>
            <motion.div
              className="absolute -left-24 top-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-pink-400 to-orange-300 opacity-80 blur-[1px]"
              animate={{ y: [0, -30, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
            <motion.div
              className="absolute -right-16 bottom-1/4 w-44 h-44 rounded-full bg-gradient-to-br from-cyan-300 to-indigo-400 opacity-80"
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
          </>
        )}

        {/* 발사되는 로켓 */}
        <motion.div
          className="absolute bottom-[-80px] left-1/2 text-7xl md:text-8xl select-none"
          style={{ x: '-50%' }}
          initial={{ y: 0, opacity: 1 }}
          animate={reduce ? { y: -260 } : { y: [0, -40, -900], opacity: [1, 1, 0] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 3.2, times: [0, 0.25, 1], ease: 'easeIn', delay: 0.4 }
          }
          aria-hidden
        >
          🚀
        </motion.div>

        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 2.4, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-300 text-slate-900 font-black text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            2026 클릭온 AI {SEASON.name} · D-{dday}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: reduce ? 0 : 2.6,
              type: 'spring',
              stiffness: 120,
              damping: 12,
            }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-tight"
          >
            내성초
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
              AI 마스터 챌린지 2기
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 3.1, duration: 0.8 }}
            className="mt-6 text-lg md:text-xl font-bold text-indigo-100"
          >
            인증서를 올리고, 로켓을 쏘아 올리고, 랭킹 1위에 도전하세요!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 3.4, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/board"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-yellow-300 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[5px_5px_0_0_#0f172a] hover:translate-y-0.5 transition"
            >
              게시판 입장하기
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={SEASON.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/10 border-2 border-white/40 font-bold hover:bg-white/20 transition"
            >
              공식 클릭온 AI <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-6 text-sm text-indigo-200 font-bold"
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          ▼ 1기와 달라진 점
        </motion.div>
      </section>

      {/* ===== 숫자로 보는 시즌2 ===== */}
      <section className="relative px-6 py-24 bg-[#3b2a8c]">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-14">
          숫자로 보는 클릭온 AI {SEASON.name}
        </h2>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { n: SEASON.programs, s: '개', l: '프로그램' },
            { n: SEASON.institutions, s: '개', l: '참여 기관' },
            { n: SEASON.newPrograms, s: '개', l: '신규 프로그램' },
            { n: 42, s: '일', l: '10/15 ~ 11/25' },
          ].map((it) => (
            <motion.div
              key={it.l}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl bg-white/10 border-2 border-white/30 p-6 text-center"
            >
              <div className="text-5xl md:text-6xl font-black text-yellow-300">
                <CountUp to={it.n} suffix={it.s} />
              </div>
              <div className="mt-2 font-bold text-indigo-100">{it.l}</div>
            </motion.div>
          ))}
        </div>

        {/* 4개 영역 */}
        <div className="max-w-5xl mx-auto mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SEASON.areas.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, rotate: -3, y: 30 }}
              whileInView={{ opacity: 1, rotate: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileHover={reduce ? undefined : { y: -6, rotate: 1 }}
              className="rounded-3xl bg-white text-slate-900 p-6 border-4 border-slate-900 shadow-[5px_5px_0_0_#0f172a]"
            >
              <div className="text-4xl">{a.icon}</div>
              <div className="mt-3 text-xl font-black">{a.name}</div>
              <div className="font-bold text-indigo-600">{a.count}개 프로그램</div>
              {a.note && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-black bg-pink-500 text-white rounded-full">
                  {a.note}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 달라진 점 ===== */}
      <section className="px-6 py-24 bg-[#0b1026]">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-14">
          🔄 1기와 이렇게 달라졌어요
        </h2>
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-pink-400 rounded" />
          {CHANGES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="relative pl-16 pb-10"
            >
              <motion.div
                className="absolute left-0 top-0 w-11 h-11 rounded-full bg-yellow-300 text-slate-900 font-black text-xs flex items-center justify-center border-4 border-[#0b1026]"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', delay: 0.15 }}
              >
                {c.badge}
              </motion.div>
              <h3 className="text-xl font-black">
                {i + 1}. {c.title}
              </h3>
              <p className="mt-1 text-indigo-200 font-bold">{c.body}</p>
            </motion.div>
          ))}
        </div>
        <p className="max-w-3xl mx-auto mt-2 text-xs text-slate-400">
          출처: 클릭온 AI 공식 누리집, 과기정통부 보도자료. 세부 내용은 공식 안내서를 확인하세요.
        </p>
      </section>

      {/* ===== 우리 게시판 업그레이드 ===== */}
      <section className="px-6 py-24 bg-gradient-to-b from-[#0b1026] to-[#1b1f5e]">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-10">
          🛠 우리 게시판도 업그레이드!
        </h2>
        <ul className="max-w-2xl mx-auto space-y-3">
          {UPGRADES.map((u, i) => (
            <motion.li
              key={u}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-4 font-bold"
            >
              <span className="text-yellow-300">✔</span> {u}
            </motion.li>
          ))}
        </ul>

        <div className="text-center mt-14">
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="inline-block"
          >
            <Link
              href="/board"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-yellow-300 text-slate-900 font-black text-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a]"
            >
              🚀 지금 참여하러 가기
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
