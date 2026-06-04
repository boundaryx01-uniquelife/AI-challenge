'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Lock, ArrowLeft, Trash2, FileText, Calendar, 
  User, Users, ShieldAlert, Loader2, Sparkles, RefreshCw
} from 'lucide-react';

interface Certificate {
  id: string;
  grade: number;
  classNum: number; // 1 = Student, 2 = Parent
  studentName: string;
  imageUrl: string;
  createdAt: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Filter States
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'parent'>('all');
  const [searchName, setSearchName] = useState('');

  // Check sessionStorage on mount
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword) {
      setPassword(savedPassword);
      verifySavedPassword(savedPassword);
    }
  }, []);

  const verifySavedPassword = async (savedPw: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/certificates', {
        method: 'GET',
        headers: {
          'x-admin-password': savedPw,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCertificates(result.data || []);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('admin_password');
        }
      } else {
        sessionStorage.removeItem('admin_password');
      }
    } catch (e) {
      console.error(e);
      sessionStorage.removeItem('admin_password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!password.trim()) {
      setAuthError('비밀번호를 입력해주세요!');
      return;
    }

    setIsAuthChecking(true);

    try {
      const response = await fetch('/api/certificates', {
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCertificates(result.data || []);
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_password', password);
      } else {
        setAuthError(result.error || '비밀번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      setAuthError('서버 연결에 실패했습니다.');
    } finally {
      setIsAuthChecking(false);
    }
  };

  const fetchCertificates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/certificates', {
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setCertificates(result.data || []);
      } else {
        setErrorMessage(result.error || '목록을 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      setErrorMessage('서버 연결 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`⚠️ 경고!\n[${name}]의 인증서 데이터를 영구 삭제하시겠습니까?\n이 작업은 복구할 수 없으며 저장소 파일도 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/certificates?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('인증서가 성공적으로 삭제되었습니다.');
        fetchCertificates();
      } else {
        alert(result.error || '삭제 중 문제가 발생했습니다.');
      }
    } catch (err: any) {
      alert('서버 요청에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
    setCertificates([]);
  };

  // Filter Logic
  const filteredCertificates = certificates.filter((cert) => {
    const matchesGrade = filterGrade === 'all' || cert.grade === filterGrade;
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'student' && cert.classNum === 1) ||
      (filterRole === 'parent' && cert.classNum === 2);
    const matchesSearch = cert.studentName.toLowerCase().includes(searchName.toLowerCase());
    return matchesGrade && matchesRole && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Statistics
  const totalCount = certificates.length;
  const studentCount = certificates.filter(c => c.classNum === 1).length;
  const parentCount = certificates.filter(c => c.classNum === 2).length;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 md:p-8 school-card text-center relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-red-400 border-b-2 border-slate-800" />
          
          <div className="flex justify-center mb-6 mt-4">
            <div className="p-3 bg-red-100 border-2 border-slate-800 rounded-2xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-800 mb-2">선생님 관리자 모드 🔒</h1>
          <p className="text-slate-500 font-bold text-sm mb-6">
            잘못 업로드된 인증서 삭제를 위한 비밀번호를 입력해 주세요.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label htmlFor="admin-password" className="block text-sm font-black text-slate-700 mb-1">
                관리자 비밀번호 입력
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 text-lg font-bold border-3 border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 focus:border-slate-800"
              />
            </div>

            {authError && (
              <div className="p-3 border-2 border-slate-800 bg-red-100 text-red-700 text-sm font-extrabold rounded-xl flex items-center gap-2 justify-center">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isAuthChecking}
                className="w-full py-3.5 text-lg font-extrabold bg-red-400 hover:bg-red-500 text-slate-800 rounded-xl border-3 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    인증 확인 중...
                  </>
                ) : (
                  '로그인 및 인증하기 🔐'
                )}
              </button>

              <Link
                href="/"
                className="w-full py-3 text-center text-sm font-black text-slate-500 hover:text-slate-800 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-xl transition-all flex items-center justify-center gap-1 mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                메인 페이지로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] py-10 px-4 md:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header Panel */}
      <div className="school-card bg-white p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-3 bg-red-400 border-b-2 border-slate-800" />
        
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-black text-white bg-red-500 rounded-full border border-red-600">
              Admin
            </span>
            <h1 className="text-2xl font-black text-slate-800">내성초 챌린지 관리자 대시보드 ⚙️</h1>
          </div>
          <p className="text-slate-500 font-bold text-sm">
            등록된 인증서를 검수하고 중복 업로드나 오류 파일을 완전히 삭제할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={fetchCertificates}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-800 rounded-xl font-extrabold text-sm flex items-center gap-2 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-slate-800 rounded-xl font-extrabold text-sm active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
          >
            로그아웃 🚪
          </button>
          
          <Link
            href="/"
            className="px-4 py-2.5 bg-yellow-300 hover:bg-yellow-400 border-2 border-slate-800 rounded-xl font-extrabold text-sm flex items-center gap-1 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
          >
            <ArrowLeft className="w-4 h-4" />
            메인 화면
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border-3 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] text-center">
          <div className="text-xs font-black text-slate-500 mb-1">총 업로드 건수 🚀</div>
          <div className="text-2xl font-black text-indigo-600">{totalCount}건</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border-3 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] text-center">
          <div className="text-xs font-black text-slate-500 mb-1">학생 등록 👦</div>
          <div className="text-2xl font-black text-slate-800">{studentCount}건</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border-3 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] text-center">
          <div className="text-xs font-black text-slate-500 mb-1">학부모 등록 👨‍👩‍👧‍👦</div>
          <div className="text-2xl font-black text-pink-500">{parentCount}건</div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="school-card bg-white p-5 text-left space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="text-lg font-black text-slate-800">인증서 검색 및 필터</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Grade Filter */}
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-500">학년 선택</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterGrade('all')}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                  filterGrade === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                전체
              </button>
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGrade(g)}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                    filterGrade === g
                      ? 'bg-yellow-400 text-slate-800'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-500">참여자 필터</span>
            <div className="flex gap-1">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                  filterRole === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterRole('student')}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                  filterRole === 'student'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                학생 👦
              </button>
              <button
                onClick={() => setFilterRole('parent')}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg border-2 border-slate-800 transition-all ${
                  filterRole === 'parent'
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                학부모 👨‍👩‍👧‍👦
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-1">
            <label htmlFor="search-name" className="text-xs font-black text-slate-500 block">이름 검색 (실명 기준)</label>
            <input
              id="search-name"
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="검색할 이름을 입력하세요..."
              className="w-full px-3 py-1.5 text-xs font-bold border-2 border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Main Listing View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-red-400 animate-spin" />
          <p className="font-extrabold text-slate-500">인증서 데이터를 가져오는 중입니다... 🚚</p>
        </div>
      ) : errorMessage ? (
        <div className="p-6 border-3 border-slate-800 bg-red-100 text-red-700 font-extrabold rounded-2xl text-center">
          ⚠️ {errorMessage}
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border-3 border-slate-800 text-slate-500 font-bold">
          검색된 인증서 파일이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCertificates.map((cert) => {
            const isParent = cert.classNum === 2;
            const isPdf = cert.imageUrl.toLowerCase().endsWith('.pdf') || cert.imageUrl.toLowerCase().includes('.pdf');
            return (
              <div
                key={cert.id}
                className={`bg-white p-3 border-4 rounded-2xl flex flex-col justify-between ${
                  isParent
                    ? 'border-pink-500 shadow-[3px_3px_0px_0px_rgba(236,72,153,1)]'
                    : 'border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]'
                }`}
              >
                {/* Thumbnail Area */}
                <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 border-2 ${
                  isParent ? 'border-pink-500' : 'border-slate-800'
                }`}>
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-4">
                      <FileText className="w-10 h-10 text-red-500 mb-1" />
                      <span className="font-extrabold text-slate-800 text-xs text-center line-clamp-2">
                        {cert.studentName}의 인증서.pdf
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold">PDF 문서</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cert.imageUrl}
                      alt={cert.studentName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Polaroid content */}
                <div className="mt-3 text-left space-y-1.5 flex-grow">
                  <div className="flex justify-between items-center gap-1 flex-wrap">
                    <span className="px-2 py-0.5 text-[9px] font-black text-white bg-slate-800 rounded-full">
                      {cert.grade}학년
                    </span>
                    {isParent ? (
                      <span className="px-2 py-0.5 text-[9px] font-black text-white bg-pink-500 rounded-full">
                        👨‍👩‍👧‍👦 학부모
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-black text-white bg-indigo-500 rounded-full">
                        👦 학생
                      </span>
                    )}
                  </div>
                  
                  {/* Name display is NOT masked in admin panel */}
                  <div className="font-extrabold text-sm text-slate-800 flex items-center justify-between">
                    <span>👋 {cert.studentName}</span>
                  </div>

                  <div className="flex items-center text-[9px] text-slate-400 font-bold">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(cert.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleDelete(cert.id, cert.studentName)}
                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-lg border-2 border-slate-800 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_0px_rgba(30,41,59,1)] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제하기 (🗑️)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
