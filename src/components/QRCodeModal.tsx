'use client';

import React, { useEffect, useState } from 'react';
import { X, Printer, QrCode, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [appUrl, setAppUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    appUrl
  )}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      // Direct printing option by opening a simple print-only layout window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>내성초 클릭온 AI 챌린지 QR코드</title>
              <style>
                body {
                  font-family: 'Inter', system-ui, sans-serif;
                  text-align: center;
                  padding: 40px;
                  color: #1e293b;
                }
                .container {
                  border: 6px solid #1e293b;
                  border-radius: 30px;
                  padding: 40px;
                  display: inline-block;
                  background-color: #fff;
                  box-shadow: 10px 10px 0px 0px #1e293b;
                }
                h1 {
                  font-size: 28px;
                  font-weight: 900;
                  margin-bottom: 5px;
                }
                p {
                  font-size: 16px;
                  font-weight: 700;
                  color: #4f46e5;
                  margin-bottom: 30px;
                }
                img {
                  border: 4px solid #1e293b;
                  border-radius: 20px;
                  width: 250px;
                  height: 250px;
                }
                .footer {
                  margin-top: 30px;
                  font-size: 14px;
                  font-weight: 600;
                  color: #64748b;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🎓 내성초 클릭온 AI 챌린지 🚀</h1>
                <p>스마트폰 카메라로 스캔하여 즉시 인증서를 등록해 보세요!</p>
                <img src="${qrImageUrl}" alt="QR Code" />
                <div class="footer">접속 주소: ${appUrl}</div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-md school-card bg-white p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full border-2 border-slate-800 hover:bg-slate-100 active:translate-y-0.5 transition-all"
        >
          <X className="w-5 h-5 text-slate-800" />
        </button>

        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="p-2 bg-pink-100 border-2 border-slate-800 rounded-lg text-pink-600">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800">📱 학교 배포용 QR코드</h2>
        </div>

        <p className="text-sm font-extrabold text-slate-500 mb-6">
          이 QR코드를 인쇄해서 교실 문앞에 붙이거나 스마트폰으로 찍어 가정통신문에 올려보세요!
        </p>

        {/* QR Display Area */}
        <div className="bg-slate-50 border-3 border-slate-800 p-6 rounded-2xl inline-block mb-6 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
          {appUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto border-2 border-slate-800 rounded-xl bg-white"
            />
          ) : (
            <div className="w-48 h-48 mx-auto bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center font-bold text-slate-400">
              QR코드 생성 중...
            </div>
          )}
          <div className="mt-3 text-xs font-black text-slate-700 select-all truncate max-w-[240px] mx-auto">
            {appUrl}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 school-btn-secondary text-base flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            <span>프린트하기 (인쇄) 🖨️</span>
          </button>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 font-extrabold flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 fill-slate-300" />
          <span>집에서도 학교에서도 스캔만 하면 바로 참여 가능!</span>
        </div>

      </div>
    </div>
  );
}
