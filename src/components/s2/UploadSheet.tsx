'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, Loader2, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { resizeAndCompressImage } from '@/lib/image';

export default function UploadSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<1 | 2>(1);
  const [grade, setGrade] = useState(1);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setErr('이미지(png, jpg) 또는 PDF만 올릴 수 있어요.');
      return;
    }
    setFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setErr(null);
  };

  const next = () => {
    setErr(null);
    if (step === 1 && name.trim().length < 2) return setErr('이름을 두 글자 이상 적어 주세요.');
    setStep(step + 1);
  };

  const submit = async () => {
    if (!file) return setErr('인증서 사진을 올려 주세요.');
    setBusy(true);
    setErr(null);
    try {
      let send: File | Blob = file;
      if (file.type.startsWith('image/')) {
        const blob = await resizeAndCompressImage(file);
        send = new File([blob], `compressed-${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
      const fd = new FormData();
      fd.append('grade', String(grade));
      fd.append('classNum', String(role));
      fd.append('studentName', name.trim());
      fd.append('image', send);
      const res = await fetch('/api/certificates', { method: 'POST', body: fd });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { throw new Error(`서버 오류 (${res.status})`); }
      if (!res.ok || !json.success) throw new Error(json.error || '등록에 실패했어요.');
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors: ['#5ef2ff', '#c6ff4d', '#8b7bff', '#ff6ec7'] });
      setStep(0); setRole(1); setGrade(1); setName(''); setFile(null); setPreview(null);
      onDone();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '문제가 생겼어요.');
    } finally {
      setBusy(false);
    }
  };

  const titles = ['누가 올리나요?', '이름을 알려 주세요', '인증서를 올려 주세요'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="mc w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 pb-8 max-h-[92vh] overflow-y-auto"
            style={{ minHeight: 'auto', border: '1px solid var(--mc-line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} disabled={busy} aria-label="이전"><ArrowLeft /></button>
              ) : <span className="w-6" />}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-8 rounded-full" style={{ background: i <= step ? 'var(--mc-lime)' : 'var(--mc-line)' }} />
                ))}
              </div>
              <button onClick={onClose} disabled={busy} aria-label="닫기"><X /></button>
            </div>

            <h3 className="text-2xl font-black mb-5">{titles[step]}</h3>

            {step === 0 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {([[1, '🧑‍🎓 학생'], [2, '👨‍👩‍👧 학부모']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setRole(v)} className="mc-glass py-4 font-black text-lg"
                      style={role === v ? { borderColor: 'var(--mc-lime)', color: 'var(--mc-lime)' } : undefined}>{l}</button>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--mc-dim)' }}>{role === 2 ? '자녀 학년' : '학년'}</p>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <button key={g} onClick={() => setGrade(g)} className="mc-glass py-3 font-black text-lg"
                        style={grade === g ? { borderColor: 'var(--mc-lime)', color: 'var(--mc-lime)' } : undefined}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={10}
                placeholder={role === 2 ? '학부모 성함' : '내 이름'}
                className="w-full rounded-2xl px-5 py-4 text-xl font-bold outline-none"
                style={{ background: 'var(--mc-surface)', border: '1px solid var(--mc-line)', color: 'var(--mc-text)' }} />
            )}

            {step === 2 && (
              <div>
                <input ref={input} type="file" accept="image/*,application/pdf" className="hidden" onChange={pick} />
                <button onClick={() => input.current?.click()} className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden"
                  style={{ border: '2px dashed var(--mc-line)', background: 'var(--mc-surface)' }}>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="미리보기" className="w-full h-full object-contain" />
                  ) : file ? (
                    <span className="font-bold">📄 {file.name}</span>
                  ) : (
                    <>
                      <Camera className="w-10 h-10" style={{ color: 'var(--mc-cyan)' }} />
                      <span className="font-bold">사진 찍기 / 파일 선택</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {err && <p className="mt-4 text-sm font-bold" style={{ color: 'var(--mc-pink)' }}>{err}</p>}

            <button className="mc-btn w-full mt-6 text-lg" disabled={busy} onClick={step < 2 ? next : submit}>
              {busy ? <><Loader2 className="animate-spin" /> 올리는 중…</> : step < 2 ? '다음' : '🚀 올리기'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
