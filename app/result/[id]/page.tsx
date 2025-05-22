'use client';

import { useParams } from 'next/navigation';
import ResultPage from '@/app/components/ResultPage';

export default function Page() {
  const params = useParams();
  const resultId = params.id as string;

  return <ResultPage resultId={resultId} />;
}
