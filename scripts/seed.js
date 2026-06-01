module.paths.push('C:/antigravity/AI challenge/node_modules');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

// 1x1 pixel transparent PNG to act as a placeholder certificate image
const transparentPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const mockCertificates = [
  { grade: 5, classNum: 1, name: '김민준' },
  { grade: 5, classNum: 1, name: '이서연' },
  { grade: 5, classNum: 2, name: '박지우' },
  { grade: 3, classNum: 4, name: '최예준' },
  { grade: 6, classNum: 2, name: '정지원' },
  { grade: 6, classNum: 2, name: '강동현' },
  { grade: 6, classNum: 2, name: '윤하은' },
  { grade: 1, classNum: 5, name: '송준우' },
  { grade: 2, classNum: 10, name: '한지민' },
  { grade: 4, classNum: 3, name: '조유진' },
];

async function main() {
  console.log('더미 인증서 데이터 파퓰레이션 시작...');
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(transparentPngBase64, 'base64');

  // Clear existing entries first
  await prisma.certificate.deleteMany({});
  console.log('이전 인증서 기록 삭제 완료.');

  for (let i = 0; i < mockCertificates.length; i++) {
    const data = mockCertificates[i];
    const filename = `seed-dummy-${i + 1}.png`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    await prisma.certificate.create({
      data: {
        grade: data.grade,
        classNum: data.classNum,
        studentName: data.name,
        imageUrl: imageUrl,
      },
    });
  }

  console.log('더미 인증서 데이터 10개 삽입 완료! 🎉');
}

main()
  .catch((e) => {
    console.error('시드 작업 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
