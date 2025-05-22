export type UserRole = 'admin' | 'candidate';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  candidateId?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  marks: number;
}

export interface Exam {
  id: string;
  title: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
}

export interface ExamResult {
  id: string;
  examId: string;
  candidateId: string;
  score: number;
  answers: {
    questionId: string;
    selectedOption: number;
  }[];
  startTime: Date;
  endTime: Date;
  passed: boolean;
}