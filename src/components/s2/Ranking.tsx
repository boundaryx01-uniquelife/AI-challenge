'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ClassRanking, StudentRanking } from './types';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Ranking({
  classRankings,
  studentRankings,
}: {
  classRankings: ClassRanking[];
  studentRankings: StudentRanking[];
}) {
  const reduce = useReducedMotion();
  const byGrade = [...classRankings].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...byGrade.map((g) => g.count));
  const top3 = studentRankings.slice(0, 3);
  const rest = studentRankings.slice(3, 10);
  // 시상대 배치: 2위 · 1위 · 3위
  const podium = [top3[1], top3[0], top3[2]];
  const heights = ['h-24', 'h-36', 'h-16'];
  const place = [1, 0, 2];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="mc-glass p-6">
        <h3 className="font-black text-xl mb-1">학년 파워</h3>
        <p className="text-sm mb-5" style={{ color: 'var(--mc-dim)' }}>누적 인증 수 기준</p>
        {byGrade.length === 0 && <p style={{ color: 'var(--mc-dim)' }}>아직 인증이 없어요.</p>}
        <div className="space-y-3">
          {byGrade.map((g, i) => (
            <motion.div key={g.grade} layout transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex items-center gap-3">
              <span className="w-12 font-black text-sm">{g.grade}학년</span>
              <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: i === 0 ? 'linear-gradient(90deg,#5ef2ff,#c6ff4d)' : 'linear-gradient(90deg,#8b7bff,#5ef2ff)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(g.count / max) * 100}%` }}
                  transition={{ duration: reduce ? 0 : 0.9, ease: 'easeOut' }}
                />
              </div>
              <span className="w-10 text-right font-black tabular-nums">{g.count}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mc-glass p-6">
        <h3 className="font-black text-xl mb-1">AI 마스터 TOP 10</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--mc-dim)' }}>가장 많이 인증한 친구들</p>
        {top3.length === 0 ? (
          <p style={{ color: 'var(--mc-dim)' }}>아직 랭킹이 없어요.</p>
        ) : (
          <>
            <div className="flex items-end justify-center gap-3 mb-6">
              {podium.map((s, i) =>
                s ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * i }}
                    className="flex flex-col items-center w-24"
                  >
                    <span className="text-3xl">{MEDAL[place[i]]}</span>
                    <span className="font-black text-sm mt-1 truncate max-w-full">{s.studentName}</span>
                    <span className="text-xs" style={{ color: 'var(--mc-dim)' }}>{s.grade}학년 · {s.count}회</span>
                    <div
                      className={`${heights[i]} w-full mt-2 rounded-t-xl`}
                      style={{ background: place[i] === 0 ? 'linear-gradient(#c6ff4d,#5ef2ff33)' : 'linear-gradient(#8b7bff,#8b7bff22)' }}
                    />
                  </motion.div>
                ) : (
                  <div key={i} className="w-24" />
                )
              )}
            </div>
            <ol className="space-y-2">
              {rest.map((s, i) => (
                <li key={`${s.studentName}-${i}`} className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,.05)' }}>
                  <span className="w-6 font-black" style={{ color: 'var(--mc-dim)' }}>{i + 4}</span>
                  <span className="flex-1 font-bold truncate">{s.studentName}</span>
                  <span className="text-xs" style={{ color: 'var(--mc-dim)' }}>{s.grade}학년</span>
                  <span className="font-black tabular-nums">{s.count}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
