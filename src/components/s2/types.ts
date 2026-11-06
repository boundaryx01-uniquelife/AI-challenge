export interface Certificate {
  id: string;
  grade: number;
  classNum: number; // 1 = 학생, 2 = 학부모
  studentName: string;
  imageUrl: string;
  createdAt: string;
}
export interface ClassRanking {
  grade: number;
  count: number;
}
export interface StudentRanking {
  grade: number;
  classNum: number;
  studentName: string;
  count: number;
}
export const isPdf = (url: string) => url.toLowerCase().includes('.pdf');
