'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Trophy, LayoutGrid, Plus, QrCode, ExternalLink, Settings } from 'lucide-react';
import { SEASON, daysLeft } from '@/lib/season';
import ProgressHero from '@/components/s2/ProgressHero';
import Ranking from '@/components/s2/Ranking';
import Gallery from '@/components/s2/Gallery';
import UploadSheet from '@/components/s2/UploadSheet';
import QRSheet from '@/components/s2/QRSheet';
import type { Certificate, ClassRanking, StudentRanking } from '@/components/s2/types';

type Tab = 'home' | 'ranking' | 'gallery';
const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: '홈', Icon: Home },
  { id: 'ranking', label: '랭킹', Icon: Trophy },
  { id: 'gallery', label: '갤러리', Icon: LayoutGrid },
];

export default function Board() {
  const [tab, setTab] = useState<Tab>('home');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [classRank, setClassRank] = useState<ClassRanking[]>([]);
  const [studentRank, setStudentRank] = useState<StudentRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (first = false) => {
    try {
      const [c, r] = await Promise.all([fetch('/api/certificates'), fetch('/api/rankings')]);
      if (!c.ok || !r.ok) throw new Error('fetch failed');
      const cj = await c.json();
      const rj = await r.json();
      if (cj.success) setCerts(cj.data);
      if (rj.success) {
        setClassRank(rj.data.classRankings);
        setStudentRank(rj.data.studentRankings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (first) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(true);
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 10000);
    return () => clearInterval(id);
  }, [load]);

  const goalDone = certs.length >= SEASON.goal;
  useEffect(() => {
    if (!goalDone) return;
    const id = setInterval(() => {
      confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 } });
    }, 2500);
    return () => clearInterval(id);
  }, [goalDone]);

  return (
    <div className="mc">
      {/* 데스크톱 사이드 레일 */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col p-5 gap-2" style={{ background: '#fff', borderRight: '3px solid var(--mc-line)' }}>
        <Link href="/" className="font-black text-lg mb-6 leading-tight">
          🚀 내성초<br /><span style={{ color: 'var(--k-pink)' }}>AI 챌린지 2기</span>
        </Link>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition"
            style={tab === id ? { background: 'var(--k-primary)', border: '2px solid var(--mc-line)' } : { color: 'var(--mc-dim)', border: '2px solid transparent' }}>
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
        <button className="mc-btn mt-4" onClick={() => setUploadOpen(true)}><Plus className="w-5 h-5" /> 인증서 올리기</button>
        <div className="mt-auto space-y-2 text-sm font-bold" style={{ color: 'var(--mc-dim)' }}>
          <button onClick={() => setQrOpen(true)} className="flex items-center gap-2"><QrCode className="w-4 h-4" /> 배포용 QR</button>
          <a href={SEASON.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><ExternalLink className="w-4 h-4" /> 공식 클릭온 AI</a>
          <Link href="/admin" className="flex items-center gap-2"><Settings className="w-4 h-4" /> 관리자</Link>
        </div>
      </aside>

      <div className="md:pl-60">
        {/* 모바일 상단바 */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur" style={{ background: 'rgba(255,255,255,.95)', borderBottom: '3px solid var(--mc-line)' }}>
          <Link href="/" className="font-black">🚀 AI 챌린지 <span style={{ color: 'var(--k-pink)' }}>2기</span></Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'var(--k-primary)', border: '2px solid var(--mc-line)' }}>D-{daysLeft()}</span>
            <button onClick={() => setQrOpen(true)} aria-label="QR"><QrCode className="w-5 h-5" /></button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
              {loading ? (
                <p className="py-24 text-center font-bold" style={{ color: 'var(--mc-dim)' }}>불러오는 중이에요… 🚀</p>
              ) : (
                <>
                  {tab === 'home' && (
                    <>
                      <ProgressHero certificates={certs} />
                      <section>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-black text-xl">방금 올라온 인증</h3>
                          <button className="text-sm font-bold" style={{ color: 'var(--k-blue)' }} onClick={() => setTab('gallery')}>전체 보기 →</button>
                        </div>
                        <Gallery certificates={certs} limit={8} />
                      </section>
                      <a href={SEASON.officialUrl} target="_blank" rel="noopener noreferrer" className="mc-glass p-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black">아직 프로그램을 안 했나요?</p>
                          <p className="text-sm" style={{ color: 'var(--mc-dim)' }}>클릭온 AI 시즌2 · {SEASON.programs}개 프로그램 중에서 골라 보세요</p>
                        </div>
                        <ExternalLink className="shrink-0" />
                      </a>
                    </>
                  )}
                  {tab === 'ranking' && <Ranking classRankings={classRank} studentRankings={studentRank} />}
                  {tab === 'gallery' && <Gallery certificates={certs} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 모바일 하단 내비게이션 + 중앙 FAB */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 items-end px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur" style={{ background: 'rgba(255,255,255,.97)', borderTop: '3px solid var(--mc-line)' }}>
        {[TABS[0], TABS[1]].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold" style={{ color: tab === id ? 'var(--k-blue)' : 'var(--mc-dim)' }}>
            <Icon className="w-5 h-5" />{label}
          </button>
        ))}
        <button key="gallery" onClick={() => setTab('gallery')} className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold" style={{ color: tab === 'gallery' ? 'var(--k-blue)' : 'var(--mc-dim)' }}>
          <LayoutGrid className="w-5 h-5" />갤러리
        </button>
        <button onClick={() => setUploadOpen(true)} aria-label="인증서 올리기" className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-black" style={{ color: 'var(--mc-text)' }}>
          <span className="-mt-7 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--k-primary)', border: '3px solid var(--mc-line)', boxShadow: '0 4px 0 0 var(--mc-line)' }}>
            <Plus className="w-7 h-7" />
          </span>
          올리기
        </button>
      </nav>

      <UploadSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onDone={() => load()} />
      <QRSheet open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
