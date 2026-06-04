'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Loader2, Sparkles, User, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

// Helper to resize and compress image client-side to bypass server upload limitations
function resizeAndCompressImage(file: File, maxWidth = 1200, maxHeight = 900): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be acquired'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas back to jpeg blob with 80% compression quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression conversion failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [grade, setGrade] = useState<number>(1);
  const [role, setRole] = useState<1 | 2>(1); // 1 = Student, 2 = Parent
  const [studentName, setStudentName] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when modal closes or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('이미지 파일(png, jpg, jpeg)만 올릴 수 있어요!');
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentName.trim()) {
      setErrorMessage('이름을 입력해주세요!');
      return;
    }
    if (studentName.trim().length < 2) {
      setErrorMessage('이름을 두 글자 이상 적어주세요.');
      return;
    }
    if (!imageFile) {
      setErrorMessage('인증서 사진을 올려주세요!');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Compress image client-side to safely bypass Vercel 4.5MB file limit
      setErrorMessage('사진을 최적화 크기로 압축하는 중이에요...');
      const compressedBlob = await resizeAndCompressImage(imageFile);
      const compressedFile = new File([compressedBlob], `compressed-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      setErrorMessage(null); // Clear compression placeholder

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('grade', grade.toString());
      formData.append('classNum', role.toString()); // map role to classNum
      formData.append('studentName', studentName.trim());
      formData.append('image', compressedFile);

      // 3. Post to backend
      const response = await fetch('/api/certificates', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse server response as JSON. Raw response:', responseText);
        const errorSnippet = responseText.trim().substring(0, 120);
        throw new Error(`서버에서 오류가 발생했습니다. (상태코드: ${response.status}) 내용: ${errorSnippet}`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || '인증서 등록에 실패했습니다.');
      }

      // Celebrate with confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffc01e', '#4f46e5', '#ff4785', '#10b981', '#ffffff'],
      });

      // Clear fields
      setGrade(1);
      setRole(1);
      setStudentName('');
      setImageFile(null);
      setPreviewUrl(null);
      
      // Success feedback & close
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '인증서를 올리는 도중 문제가 생겼어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto school-card bg-white p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full border-2 border-slate-800 hover:bg-slate-100 active:translate-y-0.5 transition-all"
        >
          <X className="w-6 h-6 text-slate-800" />
        </button>

        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-yellow-300 border-2 border-slate-800 rounded-lg">
            <Sparkles className="w-6 h-6 text-slate-800 fill-slate-800" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">📸 내 인증서 자랑하기</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Grade Selector (Large visual cards) */}
          <div>
            <label className="block text-lg font-extrabold text-slate-800 mb-2">
              1. 학년을 골라요! 🎓
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`py-3 text-lg font-black rounded-xl border-2 border-slate-800 transition-all ${
                    grade === g
                      ? 'bg-yellow-400 text-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] translate-y-[-2px]'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Role Toggle Selector (Student vs Parent) */}
          <div>
            <label className="block text-lg font-extrabold text-slate-800 mb-2">
              2. 누가 올리는 인증서인가요? 👦👨‍👩‍👧‍👦
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole(1)}
                className={`py-4 rounded-xl border-3 border-slate-800 font-black text-lg transition-all flex items-center justify-center space-x-2 ${
                  role === 1
                    ? 'bg-indigo-500 text-white shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] translate-y-[-3px]'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-5 h-5" />
                <span>학생 참여 👦👧</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(2)}
                className={`py-4 rounded-xl border-3 border-slate-800 font-black text-lg transition-all flex items-center justify-center space-x-2 ${
                  role === 2
                    ? 'bg-pink-500 text-white shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] translate-y-[-3px]'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>학부모 참여 👨‍👩‍👧‍👦</span>
              </button>
            </div>
          </div>

          {/* Student Name */}
          <div>
            <label htmlFor="student-name" className="block text-lg font-extrabold text-slate-800 mb-2">
              3. 이름을 적어줘요! ✍️
            </label>
            <input
              id="student-name"
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={role === 1 ? "예: 김민우" : "예: 민우 엄마"}
              maxLength={12}
              className="w-full px-4 py-3 text-lg font-bold border-3 border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-slate-800"
            />
          </div>

          {/* Image Upload Zone */}
          <div>
            <label className="block text-lg font-extrabold text-slate-800 mb-2">
              4. 인증서 사진을 찍거나 올려줘요! 📷
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={triggerFileSelect}
                className="w-full flex flex-col items-center justify-center py-8 border-4 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-slate-50 text-slate-500 transition-colors"
              >
                <div className="p-3 bg-white border-2 border-slate-800 rounded-full shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] mb-3">
                  <Camera className="w-8 h-8 text-slate-800" />
                </div>
                <span className="font-extrabold text-lg text-slate-800">여기를 눌러 사진 선택</span>
                <span className="text-sm text-slate-400 mt-1">파일 선택 또는 카메라 촬영</span>
              </button>
            ) : (
              <div className="relative border-4 border-slate-800 p-3 bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="인증서 미리보기"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white font-black p-1.5 rounded-full border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-black underline"
                  >
                    다른 사진으로 바꿀래요
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 border-2 border-slate-800 bg-red-100 text-red-700 font-extrabold rounded-xl">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 text-xl font-extrabold school-btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin inline" />
                처리 중...
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 mr-2 inline" />
                다 적었어요! 인증서 올리기 🚀
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
