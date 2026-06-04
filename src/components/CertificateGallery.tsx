'use client';

import React, { useState } from 'react';
import { ZoomIn, X, ImageIcon, Calendar, Filter, Sparkles, User, Users, FileText } from 'lucide-react';

interface Certificate {
  id: string;
  grade: number;
  classNum: number; // 1 = Student, 2 = Parent
  studentName: string;
  imageUrl: string;
  createdAt: string;
}

interface CertificateGalleryProps {
  certificates: Certificate[];
  isLoading: boolean;
}

export default function CertificateGallery({ certificates, isLoading }: CertificateGalleryProps) {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  
  // Filtering States
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'parent'>('all');

  // Format date helper (e.g. 2026.06.01)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
        date.getDate()
      ).padStart(2, '0')}`;
    } catch (e) {
      return '';
    }
  };

  // Filter logic
  const filteredCertificates = certificates.filter((cert) => {
    const matchesGrade = filterGrade === 'all' || cert.grade === filterGrade;
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'student' && cert.classNum === 1) ||
      (filterRole === 'parent' && cert.classNum === 2);
    return matchesGrade && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-extrabold text-lg text-slate-500">인증서 갤러리를 불러오는 중이에요... 🚚</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grade and Role filters */}
      <div className="school-card bg-white p-5 max-w-4xl mx-auto text-left">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-1.5 bg-indigo-100 border-2 border-slate-800 rounded-lg">
            <Filter className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">모아보기 게시판 🔍</h3>
        </div>

        <div className="space-y-4">
          {/* Grade Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-slate-500 w-20 shrink-0">학년별 조회:</span>
            <button
              onClick={() => setFilterGrade('all')}
              className={`px-3 py-1.5 text-sm font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                filterGrade === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              전체 학년
            </button>
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={`px-3.5 py-1.5 text-sm font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                  filterGrade === g
                    ? 'bg-yellow-400 text-slate-800 shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g}학년
              </button>
            ))}
          </div>

          {/* Role Selector (Student vs Parent filter) */}
          <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-slate-100 pt-3">
            <span className="text-sm font-extrabold text-slate-500 w-20 shrink-0">참여자 구분:</span>
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3.5 py-1.5 text-sm font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                filterRole === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              전체 보기
            </button>
            <button
              onClick={() => setFilterRole('student')}
              className={`px-3.5 py-1.5 text-sm font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                filterRole === 'student'
                  ? 'bg-indigo-500 text-white shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              학생 인증 👦
            </button>
            <button
              onClick={() => setFilterRole('parent')}
              className={`px-3.5 py-1.5 text-sm font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                filterRole === 'parent'
                  ? 'bg-pink-500 text-white shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              학부모 인증 👨‍👩‍👧‍👦
            </button>
          </div>
        </div>

        {/* Current Filter Info Banner */}
        <div className="mt-4 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs font-black text-indigo-700 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
            <span>
              필터: {filterGrade === 'all' ? '전체 학년' : `${filterGrade}학년`} ({filterRole === 'all' ? '학생+학부모' : filterRole === 'student' ? '학생만' : '학부모만'})
            </span>
          </div>
          <span>총 {filteredCertificates.length}개의 인증서가 있어요!</span>
        </div>
      </div>

      {/* Gallery Board Content */}
      {filteredCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 school-card bg-white max-w-lg mx-auto">
          <div className="p-4 bg-yellow-100 border-2 border-slate-800 rounded-full mb-4">
            <ImageIcon className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">인증 사진이 없어요!</h3>
          <p className="text-slate-500 font-bold">
            선택한 학년이나 참여 구분에 등록된 인증서가 없어요.<br />첫 번째 주인공이 되어 보세요! 🚀
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredCertificates.map((cert) => {
            const isParent = cert.classNum === 2;
            return (
              <div
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className={`group cursor-pointer bg-white p-3 border-4 rounded-2xl transition-all hover:translate-y-[-4px] flex flex-col justify-between ${
                  isParent
                    ? 'border-pink-500 shadow-[4px_4px_0px_0px_rgba(236,72,153,1)] hover:shadow-[6px_6px_0px_0px_rgba(236,72,153,1)]'
                    : 'border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]'
                }`}
              >
                {/* Image Wrap */}
                <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 border-2 ${
                  isParent ? 'border-pink-500' : 'border-slate-800'
                }`}>
                  {cert.imageUrl.toLowerCase().endsWith('.pdf') || cert.imageUrl.toLowerCase().includes('.pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-4 transition-transform duration-300 group-hover:scale-105">
                      <FileText className="w-12 h-12 text-red-500 mb-1" />
                      <span className="font-extrabold text-slate-800 text-xs text-center line-clamp-2">
                        {cert.studentName}의 인증서.pdf
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1">PDF 문서</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cert.imageUrl}
                      alt={`${cert.grade}학년 ${cert.studentName}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className={`p-2 bg-white rounded-full border-2 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] ${
                      isParent ? 'border-pink-500' : 'border-slate-800'
                    }`}>
                      <ZoomIn className="w-5 h-5 text-slate-800" />
                    </div>
                  </div>
                </div>

                {/* Content (Polaroid Margin) */}
                <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-200 text-left">
                  <div className="flex justify-between items-center gap-1 flex-wrap">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-black text-white bg-slate-800 border border-slate-900 rounded-full">
                      {cert.grade}학년
                    </span>
                    {isParent ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black text-white bg-pink-500 border border-pink-600 rounded-full">
                        👨‍👩‍👧‍👦 학부모
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black text-white bg-indigo-500 border border-indigo-600 rounded-full">
                        👦 학생
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-base text-slate-800 truncate mt-2">
                    👋 {cert.studentName}
                  </div>
                  <div className="flex items-center text-[10px] text-slate-400 font-semibold mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(cert.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Detail Viewer Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className={`relative w-full max-w-2xl bg-white p-5 border-4 rounded-3xl animate-in fade-in zoom-in-95 duration-200 ${
              selectedCert.classNum === 2
                ? 'border-pink-500 shadow-[8px_8px_0px_0px_rgba(236,72,153,1)]'
                : 'border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute -top-3 -right-3 bg-red-500 text-white font-black p-2 rounded-full border-3 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] active:translate-y-0.5 hover:bg-red-600 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Display */}
            <div className={`border-3 rounded-2xl overflow-hidden aspect-[4/3] w-full bg-slate-100 ${
              selectedCert.classNum === 2 ? 'border-pink-500' : 'border-slate-800'
            }`}>
              {selectedCert.imageUrl.toLowerCase().endsWith('.pdf') || selectedCert.imageUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={selectedCert.imageUrl}
                  className="w-full h-full border-0 bg-white"
                  title="인증서 PDF 미리보기"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedCert.imageUrl}
                  alt={`${selectedCert.grade}학년 ${selectedCert.studentName}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Info Row */}
            <div className="mt-4 text-left">
              <div className="flex gap-2 mb-2">
                <span className="inline-block px-3 py-0.5 text-xs font-black text-white bg-slate-800 border-2 border-slate-900 rounded-full">
                  {selectedCert.grade}학년
                </span>
                {selectedCert.classNum === 2 ? (
                  <span className="inline-block px-3 py-0.5 text-xs font-black text-white bg-pink-500 border-2 border-pink-600 rounded-full">
                    👨‍👩‍👧‍👦 학부모 참여
                  </span>
                ) : (
                  <span className="inline-block px-3 py-0.5 text-xs font-black text-white bg-indigo-500 border-2 border-indigo-600 rounded-full">
                    👦 학생 참여
                  </span>
                )}
              </div>
              <h4 className="text-2xl font-black text-slate-800">
                🎉 {selectedCert.studentName} {selectedCert.classNum === 2 ? '님의' : '학생의'} 인증서
              </h4>
              <p className="text-sm font-bold text-slate-400 mt-1">
                등록 날짜: {new Date(selectedCert.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
