'use client';

import { useParams } from 'next/navigation';
import ExamPage from '@/app/components/ExamPage';

export default function Page() {
  const params = useParams();
  const examId = params.id as string;

  return <ExamPage examId={examId} />;
}
