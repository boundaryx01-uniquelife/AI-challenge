'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { type Certificate, isPdf } from './types';

export default function Gallery({ certificates, limit }: { certificates: Certificate[]; limit?: number }) {
  const [grade, setGrade] = useState<number | 'all'>('all');
  const [role, setRole] = useState<'all' | 1 | 2>('all');
  const [sel, setSel] = useState<Certificate | null>(null);

  const list = certificates
    .filter((c) => (grade === 'all' || c.grade === grade) && (role === 'all' || c.classNum === role))
    .slice(0, limit ?? undefined);

  const fmt = (s: string) => {
    const d = new Date(s);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div>
      {!limit && (
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          <button className="mc-chip" data-on={grade === 'all'} onClick={() => setGrade('all')}>전체 학년</button>
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <button key={g} className="mc-chip" data-on={grade === g} onClick={() => setGrade(g)}>{g}학년</button>
          ))}
          <span className="w-0.5 bg-slate-300 mx-1 self-stretch" />
          <button className="mc-chip" data-on={role === 'all'} onClick={() => setRole('all')}>모두</button>
          <button className="mc-chip" data-on={role === 1} onClick={() => setRole(1)}>학생</button>
          <button className="mc-chip" data-on={role === 2} onClick={() => setRole(2)}>학부모</button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="py-16 text-center" style={{ color: 'var(--mc-dim)' }}>조건에 맞는 인증서가 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((c, i) => (
            <motion.button
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              onClick={() => setSel(c)}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden text-left group"
              style={{ border: c.classNum === 2 ? '3px solid var(--k-pink)' : '3px solid var(--mc-line)', background: '#fff', boxShadow: '3px 3px 0 0 var(--mc-line)' }}
            >
              {isPdf(c.imageUrl) ? (
                <div className="absolute inset-0 flex items-center justify-center"><FileText className="w-12 h-12 opacity-60" /></div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt={`${c.studentName} 인증서`} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              <div className="absolute inset-x-0 bottom-0 p-3 pt-10" style={{ background: 'linear-gradient(transparent,rgba(6,10,24,.92))' }}>
                <div className="font-black truncate text-white">{c.studentName}</div>
                <div className="text-xs font-bold text-slate-200">
                  {c.grade}학년 · {fmt(c.createdAt)}
                </div>
              </div>
              {c.classNum === 2 && (
                <span className="absolute top-2 left-2 text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: 'var(--k-pink)', color: '#fff' }}>학부모</span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {sel && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSel(null)}
          >
            <button aria-label="닫기" className="absolute top-4 right-4 p-3 rounded-full mc-glass text-slate-900"><X /></button>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              {isPdf(sel.imageUrl) ? (
                <iframe src={sel.imageUrl} className="w-full h-[75vh] rounded-2xl bg-white" title="PDF 인증서" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sel.imageUrl} alt="인증서" className="w-full max-h-[80vh] object-contain rounded-2xl" />
              )}
              <p className="text-center mt-3 font-black text-white">{sel.studentName} · {sel.grade}학년 {sel.classNum === 2 ? '학부모' : '학생'}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
