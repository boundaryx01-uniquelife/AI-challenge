// PDF 첫 페이지를 JPEG 이미지로 변환 (브라우저에서 실행)
// 인증서는 한 장짜리라 첫 페이지만 저장해 용량을 크게 줄인다.
// 변환 라이브러리(pdfjs)는 PDF를 고를 때만 불러온다.

const MAX_SIDE = 1400; // px
const JPEG_QUALITY = 0.82;

export async function pdfFirstPageToJpeg(file: File): Promise<Blob> {
  // 구형 브라우저 호환을 위해 legacy 빌드 사용
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const pdf = await task.promise;
  try {
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_SIDE / Math.max(base.width, base.height), 3);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas를 만들 수 없어요.');
    // JPEG는 투명이 없으므로 흰 배경을 먼저 칠한다
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했어요.'))), 'image/jpeg', JPEG_QUALITY)
    );
  } finally {
    await task.destroy();
  }
}
