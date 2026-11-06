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
