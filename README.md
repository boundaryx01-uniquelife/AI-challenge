# 🎓 내성초등학교 클릭온 AI 챌린지 갤러리 및 실시간 랭킹 시스템

교내 초등학생들이 '2026 클릭온 AI' 프로그램 참여 인증서(사진)를 로그인 없이 쉽게 업로드하고, 학년별/개인별 참여 현황을 실시간으로 확인 및 배포할 수 있는 웹 어플리케이션입니다.

---

## 🚀 1. 주요 핵심 기능

### 1) 로그인 없는 사진 업로드 (`UploadModal`)
- **학생/학부모 터치 토글**: 가정 연계를 위해 학생뿐만 아니라 **학부모 참여** 탭을 탑재했습니다.
- **원터치 학년 선택**: 조작이 번거로운 드롭다운 대신 초등학생들이 클릭하기 편한 큼직한 터치식 숫자 카드 그리드를 배치했습니다.
- **실시간 프리뷰**: 사진을 첨부하면 폴라로이드 형태로 즉각 미리보기를 띄워 입력 신뢰도를 높였습니다.

### 2) 300 로켓 챌린지 게이지 (`RocketChallenge`)
- **목표 지향성 위젯**: 전교생이 힘을 모아 300개의 인증서 목표를 향해 나아가는 수직 발사대 형태의 로켓 위젯을 제공합니다.
- **실시간 높이 변화 & 진동**: 인증서가 추가될 때마다 로켓이 비례하여 서서히 솟구치며, 발사 대기 중인 엔진 진동 효과(`framer-motion`)가 가미되었습니다.
- **발사 성공 세레머니**: 300개 달성 시 로켓이 화면 밖으로 날아가며 은하수 우주 배경으로 전환되고, 다채로운 폭죽(`canvas-confetti`)이 주기적으로 화면에 쏟아지는 세레머니를 제공합니다.

### 3) 반별 게시판 모아보기 및 차별화 디자인 (`CertificateGallery`)
- **학년별 필터 보드**: 상단 필터 패널에서 학년을 터치하면 해당 학급의 가상 게시판처럼 필터링되어 나타납니다. (반 구분이 없는 내성초의 1개 반 구조에 맞춰 반 선택은 지우고 학년만 필터링하도록 설계).
- **개인정보 보호**: 학생 이름의 가운데 글자를 백엔드 단에서 자동으로 마스킹 처리하여 개인정보 유출을 방지하며, 사진 보관(다운로드) 링크를 제거해 안전성을 강화했습니다.
- **학부모 참여 차별화**: 학부모가 올린 인증 카드는 **분홍색 점선 테두리(`border-pink-500`)**와 핑크색 뱃지가 붙어 시각적으로 예쁘게 돋보이며, 점수는 해당 학년 파워에 동일하게 자동 합산됩니다.

### 4) 실시간 랭킹보드 (`RankingDashboard`)
- **학년별 파워 ⚡**: 학년별 누적 인증 수량 순서대로 입체형 막대그래프를 제공합니다. 데이터가 실시간으로 갱신될 때마다 순위에 맞게 스르륵 바뀌는 레이아웃 변경 애니메이션을 적용했습니다.
- **AI 마스터의 전당 🏆**: 가장 많은 인증서를 모은 TOP 10 마스터 리스트를 보여줍니다. 금, 은, 동 트로피 뱃지와 학부모 구분 태그가 지원됩니다.

### 5) 📱 교내 배포용 원클릭 QR코드 팝업 (`QRCodeModal`)
- **실시간 주소 감지**: Vercel 배포 도메인을 자동으로 감지하여 고해상도 QR코드를 실시간 팝업으로 제공합니다.
- **인쇄(Print) 서식 지원**: `인쇄하기`를 누르면 교내 게시판, 교실 문앞 등에 그대로 뽑아 부착할 수 있는 깔끔한 A4 규격의 배포용 홍보 서식이 열려 자동 인쇄를 지원합니다.

---

## 🛠️ 2. 기술 스택 및 아키텍처

- **프론트엔드**: Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, Canvas Confetti
- **백엔드 (하이브리드 어댑터 설계)**:
  - **클라우드 모드**: Supabase Cloud PostgreSQL Database & Storage Bucket (환경 변수 존재 시 작동)
  - **로컬 모드 (Fallback)**: SQLite DB (Prisma ORM) & `public/uploads` 로컬 이미지 쓰기 (환경 변수 부재 시 작동)
- **버전 가치**: Prisma v7의 드라이버 어댑터 필수 요구 및 WASM 엔진 강제 정책을 극복하기 위해, Native Library 엔진을 탑재해 SQLite 로컬 구동이 매끄러운 **Prisma v6 (6.19.3)** 버전으로 안정화했습니다.

---

## 📊 3. 데이터베이스(DB) 및 스토리지 테이블 구성

### Supabase SQL (SQL Editor)
```sql
-- 1. certificates 테이블 생성
create table certificates (
  id uuid default gen_random_uuid() primary key,
  grade integer not null check (grade >= 1 and grade <= 6),
  class_num integer not null default 1, -- 1=학생, 2=학부모
  student_name text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 학년 기준 조회 속도를 위한 인덱스 생성
create index idx_certificates_grade on certificates(grade);
```

### Supabase Storage 설정
- 버킷 생성 이름: 반드시 **`certificates`** 로 생성
- 권한 정책: **Public Bucket** 옵션 필수로 활성화 (공개 이미지 링크 획득 목적)

---

## 🌐 4. 환경 변수 설정 (Vercel 배포 시 필수)

Vercel에 연동 및 배포할 때 아래 2가지 환경 변수를 주입해야 클라우드 서버에서 데이터가 영구 보존됩니다.

```env
NEXT_PUBLIC_SUPABASE_URL = 내 Supabase 프로젝트 URL 주소
NEXT_PUBLIC_SUPABASE_ANON_KEY = 내 Supabase 프로젝트 anon public API Key
```

---

## 💻 5. 개발자 로컬 구동 방법 (로컬 SQLite Fallback)

환경변수가 없는 로컬 컴퓨터 개발 환경에서도 즉시 구동 및 테스트할 수 있습니다.

1. **의존성 설치**:
   ```bash
   npm install
   ```
2. **SQLite 마이그레이션**:
   ```bash
   npx prisma db push
   ```
3. **가상 데이터 시딩 (시드 적재)**:
   ```bash
   node scripts/seed.js
   ```
4. **로컬 개발 서버 실행**:
   ```bash
   npm run dev
   ```
   이후 `http://localhost:3000`에서 브라우저로 갤러리 및 로켓 위젯 가동을 검증하실 수 있습니다.
