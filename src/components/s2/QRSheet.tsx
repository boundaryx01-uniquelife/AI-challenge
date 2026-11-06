'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';

export default function QRSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // 열렸을 때만 렌더되므로 클라이언트에서만 평가됨
  const url = open && typeof window !== 'undefined' ? window.location.origin : '';
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>내성초 클릭온 AI 2기 QR</title><style>body{font-family:system-ui,sans-serif;text-align:center;padding:48px;color:#0f172a}h1{font-size:40px}p{font-size:22px}img{width:380px;height:380px;margin:24px 0}</style></head><body><h1>🚀 내성초 AI 마스터 챌린지 2기</h1><p>QR을 찍고 인증서를 올려 주세요!</p><img src="${qr}" alt="QR"/><p>${url}</p><script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()}
            className="mc w-full max-w-sm rounded-3xl p-6 text-center" style={{ minHeight: 'auto', border: '1px solid var(--mc-line)' }}>
            <button onClick={onClose} className="float-right" aria-label="닫기"><X /></button>
            <h3 className="text-xl font-black mb-4 clear-both">배포용 QR</h3>
            <div className="bg-white p-4 rounded-2xl inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {url && <img src={qr} alt="QR" className="w-56 h-56" />}
            </div>
            <p className="text-xs mt-3 break-all" style={{ color: 'var(--mc-dim)' }}>{url}</p>
            <button className="mc-btn w-full mt-5" onClick={print}><Printer className="w-5 h-5" /> 인쇄하기</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
