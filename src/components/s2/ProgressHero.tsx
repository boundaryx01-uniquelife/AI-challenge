'use client';

import React, { useEffect } from 'react';
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { SEASON, daysLeft } from '@/lib/season';
import type { Certificate } from './types';

export default function ProgressHero({ certificates }: { certificates: Certificate[] }) {
  const reduce = useReducedMotion();
  const total = certificates.length;
  const goal = SEASON.goal;
  const pct = Math.min(1, total / goal);
  const done = total >= goal;

  const mv = useMotionValue(0);
  const shown = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const c = animate(mv, total, { duration: reduce ? 0 : 1.2, ease: 'easeOut' });
    return () => c.stop();
  }, [total, mv, reduce]);

  const today = new Date().toDateString();
  const todayCount = certificates.filter((c) => new Date(c.createdAt).toDateString() === today).length;
  const parentCount = certificates.filter((c) => c.classNum === 2).length;

  const R = 92;
  const C = 2 * Math.PI * R;

  return (
    <section className="mc-glass p-6 md:p-8 grid md:grid-cols-[auto_1fr] gap-8 items-center">
      <div className="relative w-56 h-56 mx-auto">
        <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="mcg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5ef2ff" />
              <stop offset="100%" stopColor="#c6ff4d" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="14" />
          <motion.circle
            cx="110" cy="110" r={R} fill="none" stroke="url(#mcg)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: reduce ? 0 : 1.4, ease: 'easeOut' }}
          />
        </svg>
        {/* 궤도를 도는 로켓 */}
        <motion.div
          className="absolute inset-0"
          initial={{ rotate: 0 }}
          animate={{ rotate: pct * 360 }}
          transition={{ duration: reduce ? 0 : 1.4, ease: 'easeOut' }}
        >
          <span className="absolute left-1/2 -top-1 -translate-x-1/2 text-2xl rotate-45">🚀</span>
        </motion.div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-6xl font-black tabular-nums">{shown}</motion.span>
          <span className="text-sm font-bold" style={{ color: 'var(--mc-dim)' }}>/ {goal} 인증</span>
        </div>
      </div>

      <div>
        <p className="font-black tracking-widest text-xs" style={{ color: 'var(--mc-cyan)' }}>MISSION · {SEASON.name.toUpperCase()}</p>
        <h2 className="text-3xl md:text-4xl font-black mt-1 leading-tight">
          {done ? '발사 성공! 🌌' : `${goal - total}개 더 모으면 발사!`}
        </h2>
        <p className="mt-2 font-semibold" style={{ color: 'var(--mc-dim)' }}>
          전교생의 인증서가 모이면 로켓이 궤도에 진입해요.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { k: '남은 기간', v: `D-${daysLeft()}` },
            { k: '오늘 인증', v: `${todayCount}` },
            { k: '학부모 참여', v: `${parentCount}` },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--mc-line)' }}>
              <div className="text-2xl font-black" style={{ color: 'var(--mc-lime)' }}>{s.v}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--mc-dim)' }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
