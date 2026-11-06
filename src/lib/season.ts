// 클릭온 AI 시즌2 공통 설정 (출처: aichallenge4all.or.kr, 과기정통부 보도자료)
export const SEASON = {
  name: '시즌2',
  start: '2026-10-15T00:00:00+09:00',
  end: '2026-11-25T23:59:59+09:00',
  goal: 300,
  officialUrl: 'https://aichallenge4all.or.kr/competitions/click-on-ai',
  programs: 44,
  institutions: 15,
  newPrograms: 10,
  areas: [
    { icon: '🎨', name: 'AI 활용 체험', count: 14, note: '중점 보강' },
    { icon: '🧰', name: 'AI 서비스 활용', count: 4, note: '' },
    { icon: '💻', name: 'AI 코딩', count: 17, note: '시즌1 참여율 1위' },
    { icon: '📊', name: 'AI 데이터 활용', count: 9, note: '중점 보강' },
  ],
} as const;

export function daysLeft(now = new Date()): number {
  const ms = new Date(SEASON.end).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/** 인정 시작 시각: 2026-11-06 00:00 (한국시간). 이 시각 이전에 올라온 1기 자료는
 *  게시판·랭킹·카운팅에서 모두 제외한다. (공식 프로그램 기간 SEASON.start 와는 별개)
 *  서버 환경 변수 SEASON_START 로 바꿀 수 있다(예: 모든 자료를 보려면 2000-01-01). */
export const RECOGNITION_START = '2026-11-06T00:00:00+09:00';

export function seasonStartISO(): string {
  const v = (process.env.SEASON_START || '').trim();
  return v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : new Date(RECOGNITION_START).toISOString();
}
