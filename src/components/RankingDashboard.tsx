'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Crown, School, User, Flame } from 'lucide-react';

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

interface RankingDashboardProps {
  classRankings: ClassRanking[];
  studentRankings: StudentRanking[];
  isLoading: boolean;
}

export default function RankingDashboard({
  classRankings,
  studentRankings,
  isLoading,
}: RankingDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'class' | 'student'>('class');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-extrabold text-lg text-slate-500">실시간 랭킹 분석 중이에요... 📊</p>
      </div>
    );
  }

  // Find max count for proportional bar width
  const maxClassCount = classRankings.length > 0 ? Math.max(...classRankings.map((r) => r.count)) : 1;

  // Render rank badge colors
  const getRankBadgeClass = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-400 text-slate-800 border-yellow-500';
      case 1:
        return 'bg-slate-300 text-slate-800 border-slate-400';
      case 2:
        return 'bg-amber-600 text-white border-amber-700';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-600 fill-yellow-400" />;
      case 1:
        return <Trophy className="w-5 h-5 text-slate-500 fill-slate-300" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-700 fill-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Navigation Tabs */}
      <div className="flex gap-4 p-2 bg-slate-100 border-3 border-slate-800 rounded-2xl mb-8 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('class')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-lg transition-all flex items-center justify-center space-x-2 border-2 ${
            activeTab === 'class'
              ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-5 h-5" />
          <span>학년별 파워 ⚡</span>
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-lg transition-all flex items-center justify-center space-x-2 border-2 ${
            activeTab === 'student'
              ? 'bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-5 h-5" />
          <span>AI 마스터 전당 🏆</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'class' ? (
          /* GRADE RANKINGS */
          <motion.div
            key="class-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {classRankings.length === 0 ? (
              <div className="text-center py-16 bg-white school-card p-6">
                <Flame className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-extrabold text-slate-500 text-lg">아직 등록된 기록이 없어요!</p>
                <p className="text-sm font-bold text-slate-400 mt-1">첫 번째 인증을 올리면 랭킹보드에 올라가요!</p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-2xl mx-auto">
                {classRankings.map((rank, idx) => {
                  const percent = Math.max(10, Math.min(100, (rank.count / maxClassCount) * 100));
                  return (
                    <motion.div
                      key={rank.grade}
                      layout
                      className="school-card bg-white p-4 flex items-center gap-4 transition-shadow"
                    >
                      {/* Rank Indicator */}
                      <div
                        className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-xl border-2 font-black text-xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] ${getRankBadgeClass(
                          idx
                        )}`}
                      >
                        {idx + 1}
                      </div>

                      {/* Info & Bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-black text-lg text-slate-800">
                            {rank.grade}학년
                          </span>
                          <span className="font-black text-indigo-600">
                            {rank.count}개 완료!
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full h-6 bg-slate-100 border-2 border-slate-800 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full border-r-2 border-slate-800 ${
                              idx === 0
                                ? 'bg-gradient-to-r from-yellow-300 to-yellow-500'
                                : idx === 1
                                ? 'bg-gradient-to-r from-slate-200 to-slate-400'
                                : idx === 2
                                ? 'bg-gradient-to-r from-amber-500 to-amber-700'
                                : 'bg-gradient-to-r from-indigo-300 to-indigo-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Icon */}
                      <div className="shrink-0 flex items-center justify-center w-8">
                        {getRankIcon(idx)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* INDIVIDUAL HALL OF FAME (Top 10) */
          <motion.div
            key="student-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 max-w-xl mx-auto"
          >
            {studentRankings.length === 0 ? (
              <div className="text-center py-16 bg-white school-card p-6">
                <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-extrabold text-slate-500 text-lg">아직 명예의 전당에 오른 마스터가 없어요!</p>
                <p className="text-sm font-bold text-slate-400 mt-1">가장 먼저 많은 인증서를 모아 명예의 전당에 등극해보세요!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {studentRankings.map((rank, idx) => (
                  <motion.div
                    key={`${rank.grade}-${rank.studentName}`}
                    layout
                    className={`school-card bg-white p-4 flex items-center justify-between border-3 ${
                      idx < 3 ? 'bg-yellow-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Badge Rank */}
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 font-black text-lg shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] ${getRankBadgeClass(
                          idx
                        )}`}
                      >
                        {idx + 1}
                      </div>

                      {/* Student info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-slate-800">{rank.studentName}</span>
                          {idx === 0 && <Crown className="w-5 h-5 text-yellow-500 fill-yellow-400" />}
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                          {rank.grade}학년
                        </span>
                      </div>
                    </div>

                    {/* Medal count */}
                    <div className="flex items-center gap-1.5 bg-indigo-50 border-2 border-slate-800 px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                      <span className="font-black text-indigo-700 text-sm">{rank.count}개 인증</span>
                      <Trophy className={`w-4 h-4 ${idx === 0 ? 'text-yellow-500 fill-yellow-400' : 'text-slate-400'}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
