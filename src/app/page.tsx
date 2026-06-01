'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Trophy, Image as ImageIcon, PlusCircle, Volume2, School, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import UploadModal from '@/components/UploadModal';
import CertificateGallery from '@/components/CertificateGallery';
import RankingDashboard from '@/components/RankingDashboard';
import QRCodeModal from '@/components/QRCodeModal';

interface Certificate {
  id: string;
  grade: number;
  classNum: number;
  studentName: string;
  imageUrl: string;
  createdAt: string;
}

interface ClassRanking {
  grade: number;
  count: number;
}

interface StudentRanking {
  grade: number;
  classNum: number;
  studentName: string;
  count: number;
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [classRankings, setClassRankings] = useState<ClassRanking[]>([]);
  const [studentRankings, setStudentRankings] = useState<StudentRanking[]>([]);
  const [activeTab, setActiveTab] = useState<'ranking' | 'gallery'>('ranking');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch all live data (certificates + rankings)
  const fetchLiveData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [certRes, rankRes] = await Promise.all([
        fetch('/api/certificates'),
        fetch('/api/rankings'),
      ]);

      if (!certRes.ok || !rankRes.ok) {
        throw new Error('데이터를 가져오는 데 실패했습니다.');
      }

      const certResult = await certRes.json();
      const rankResult = await rankRes.json();

      if (certResult.success) {
        setCertificates(certResult.data);
      }
      if (rankResult.success) {
        setClassRankings(rankResult.data.classRankings);
        setStudentRankings(rankResult.data.studentRankings);
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Initial loading & polling
  useEffect(() => {
    fetchLiveData(true);

    const intervalId = setInterval(() => {
      fetchLiveData(false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [fetchLiveData]);

  // Setup loop confetti if target achieved!
  useEffect(() => {
    if (certificates.length >= 300) {
      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffc01e', '#ff4785', '#10b981'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffc01e', '#ff4785', '#10b981'],
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [certificates.length]);

  const handleUploadSuccess = () => {
    fetchLiveData(false);
  };

  // Rocket calculations
  const totalCerts = certificates.length;
  const targetGoal = 300;
  const percentCompleted = Math.min(100, Math.floor((totalCerts / targetGoal) * 100));
  const isGoalAchieved = totalCerts >= targetGoal;

  return (
    <main className="min-h-screen pb-16 px-4 md:px-8 bg-[#fefcf6]">
      {/* Top Banner Area */}
      <div className="max-w-6xl mx-auto pt-8 pb-10">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-indigo-500 border-4 border-slate-800 p-6 md:p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] mb-8 text-white relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-yellow-400 rounded-full opacity-20 blur-xl"></div>
          
          <div className="flex items-center gap-4 relative z-10 text-center lg:text-left flex-col sm:flex-row">
            <div className="p-3 bg-yellow-300 border-3 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] flex items-center justify-center shrink-0 mx-auto lg:mx-0">
              <School className="w-10 h-10 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center justify-center lg:justify-start gap-1 bg-yellow-300/30 text-yellow-300 font-extrabold text-xs px-2.5 py-1 rounded-full border border-yellow-300/40 w-fit mx-auto lg:mx-0 mb-1">
                <Sparkles className="w-3.5 h-3.5 fill-yellow-400" />
                <span>내성초 클릭온 AI 챌린지</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-50">
                AI 마스터 챌린지 갤러리
              </h1>
              <p className="text-indigo-100 font-bold text-sm md:text-base mt-1.5">
                로그인 없이 학생과 학부모 모두 쉽고 편하게 참여 인증을 올려봐요! 🚀
              </p>
            </div>
          </div>

          {/* Action Button Set */}
          <div className="flex flex-wrap justify-center items-center gap-4 relative z-10 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="school-btn-secondary px-5 py-4 text-base md:text-lg flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span>QR코드 배포 📱</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="school-btn-primary px-6 py-4 text-lg md:text-xl flex items-center gap-2 group animate-pulse hover:animate-none"
            >
              <PlusCircle className="w-6 h-6 transition-transform group-hover:rotate-90" />
              인증서 올리기 📸
            </button>
          </div>
        </header>

        {/* Info Notification Area */}
        <div className="max-w-4xl mx-auto flex items-center gap-3 p-4 bg-yellow-50 border-3 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] mb-8 text-sm font-bold text-slate-800">
          <Volume2 className="w-5 h-5 shrink-0 text-yellow-600 animate-bounce" />
          <p>
            가정에서도 올릴 수 있어요! 학부모 참여 항목으로 올리면 분홍색 예쁜 테두리로 다르게 갤러리에 나타납니다! ✨
          </p>
        </div>

        {/* 300 ROCKET CHALLENGE WIDGET */}
        <div className="max-w-4xl mx-auto school-card bg-white p-6 mb-10 text-left relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1 px-3 bg-yellow-100 border-2 border-slate-800 rounded-full font-black text-xs text-yellow-700 animate-pulse">
            목표: {targetGoal}개 🏆
          </div>

          <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
            🚀 내성초 AI 마스터 300 로켓 발사대
          </h2>
          <p className="text-slate-500 font-bold text-xs md:text-sm mb-6">
            학교 전체에 올라온 인증서 수만큼 로켓이 하늘 높이 솟구쳐요! 300개가 되면 로켓이 발사됩니다!
          </p>

          <div className="flex flex-col md:flex-row items-center gap-6">
            
            {/* Visual Launchpad (Vertical Tower) */}
            <div className="w-full md:w-1/3 h-56 bg-slate-50 border-3 border-slate-800 rounded-2xl relative p-2 flex justify-center overflow-hidden">
              <div className="absolute inset-y-0 left-1/4 border-l-2 border-dashed border-slate-300"></div>
              <div className="absolute inset-y-0 right-1/4 border-r-2 border-dashed border-slate-300"></div>
              
              <div className="absolute right-4 top-2 text-[10px] font-black text-slate-400 border-b border-slate-200 w-12 text-right">300 (완성)</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 border-b border-slate-200 w-12 text-right">150 (반)</div>
              <div className="absolute right-4 bottom-2 text-[10px] font-black text-slate-400 border-b border-slate-200 w-12 text-right">0 (시작)</div>

              <div className="absolute bottom-0 w-12 bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-b-xl border-t-2 border-slate-800" style={{ height: `${percentCompleted}%` }}></div>

              <motion.div
                className="absolute w-12 h-12 flex items-center justify-center text-3xl cursor-pointer"
                style={{ bottom: `calc(${percentCompleted}% - 20px)` }}
                animate={
                  isGoalAchieved
                    ? { y: [-200, -300], scale: [1, 1.5, 0], opacity: [1, 1, 0] }
                    : {
                        y: [0, -2, 2, -1, 1, 0],
                        rotate: [0, -1, 1, -1, 1, 0],
                      }
                }
                transition={
                  isGoalAchieved
                    ? { duration: 2.5, ease: 'easeInOut', repeat: Infinity }
                    : { duration: 0.15, repeat: Infinity, repeatType: 'reverse' }
                }
              >
                🚀
              </motion.div>

              {isGoalAchieved && (
                <div className="absolute inset-0 bg-yellow-300/90 flex flex-col items-center justify-center p-4 border-2 border-slate-800 rounded-xl z-10 animate-bounce">
                  <span className="text-2xl">🌌</span>
                  <span className="font-black text-slate-800 text-sm text-center">우주선 발사 성공! ⭐️</span>
                </div>
              )}
            </div>

            {/* Progress Text Description */}
            <div className="flex-1 w-full flex flex-col justify-center">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-black text-indigo-600">
                  {percentCompleted}% 충전 중!
                </span>
                <span className="font-extrabold text-slate-700 text-sm">
                  ({totalCerts} / {targetGoal}개 완료)
                </span>
              </div>

              <div className="w-full h-8 bg-slate-100 border-3 border-slate-800 rounded-2xl overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentCompleted}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-yellow-400 border-r-3 border-slate-800"
                />
              </div>

              <div className="mt-4 p-3 bg-slate-50 border-2 border-slate-800 rounded-xl font-extrabold text-slate-700 text-sm">
                {isGoalAchieved ? (
                  <span className="text-yellow-600">
                    🎉 축하합니다! 내성초 친구들의 참여로 300 로켓이 우주로 힘차게 날아올랐습니다! 멋진 AI 챌린지 완성! 🌌
                  </span>
                ) : (
                  <span>
                    💡 {targetGoal - totalCerts}개의 인증서가 더 채워지면 로켓이 우주로 발사됩니다! 친구들과 함께 올려볼까요?
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Content Navigation Area */}
        <div className="flex justify-center border-b-4 border-slate-800 mb-8 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-8 py-3 text-lg font-black tracking-wide border-t-4 border-x-4 border-transparent rounded-t-2xl translate-y-[4px] transition-all flex items-center space-x-2 ${
              activeTab === 'ranking'
                ? 'bg-[#fefcf6] border-slate-800 text-slate-800 z-10'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Trophy className={`w-5 h-5 ${activeTab === 'ranking' ? 'text-yellow-500 fill-yellow-400' : ''}`} />
            <span>실시간 랭킹보드</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-8 py-3 text-lg font-black tracking-wide border-t-4 border-x-4 border-transparent rounded-t-2xl translate-y-[4px] transition-all flex items-center space-x-2 ${
              activeTab === 'gallery'
                ? 'bg-[#fefcf6] border-slate-800 text-slate-800 z-10'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ImageIcon className={`w-5 h-5 ${activeTab === 'gallery' ? 'text-indigo-500 fill-indigo-100' : ''}`} />
            <span>인증 갤러리</span>
          </button>
        </div>

        {/* Dynamic Display Area */}
        <div className="w-full">
          {activeTab === 'ranking' ? (
            <RankingDashboard
              classRankings={classRankings}
              studentRankings={studentRankings}
              isLoading={isLoading}
            />
          ) : (
            <CertificateGallery certificates={certificates} isLoading={isLoading} />
          )}
        </div>
      </div>

      {/* Upload Form Modal Popup */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* QR Code Modal Popup */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </main>
  );
}
