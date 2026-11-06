// 클라이언트 이미지 리사이즈/압축 (서버 업로드 한도 우회)
// Helper to resize and compress image client-side to bypass server upload limitations
export function resizeAndCompressImage(file: File, maxWidth = 1200, maxHeight = 900): Promise<Blob> {
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
