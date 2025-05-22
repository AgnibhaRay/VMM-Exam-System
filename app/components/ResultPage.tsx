'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ExamResult, Exam } from '../types';

export default function ResultPage({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const resultDoc = await getDoc(doc(db, 'results', resultId));
        if (resultDoc.exists()) {
          const resultData = { ...resultDoc.data(), id: resultDoc.id } as ExamResult;
          setResult(resultData);
          
          // Fetch exam details
          const examDoc = await getDoc(doc(db, 'exams', resultData.examId));
          if (examDoc.exists()) {
            setExam({ ...examDoc.data(), id: examDoc.id } as Exam);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching result:', error);
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Result Not Found</h1>            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-2">
                Exam Results
              </h1>
              <h2 className="text-xl text-gray-600 dark:text-gray-300">
                {exam.title}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className={`text-center px-6 py-4 rounded-full ${
                  result.passed
                    ? 'bg-green-100 dark:bg-green-800'
                    : 'bg-red-100 dark:bg-red-800'
                }`}>
                  <span className={`text-4xl font-bold ${
                    result.passed
                      ? 'text-green-800 dark:text-green-100'
                      : 'text-red-800 dark:text-red-100'
                  }`}>
                    {result.score} / {exam.totalMarks}
                  </span>
                  <p className={`text-sm mt-1 ${
                    result.passed
                      ? 'text-green-700 dark:text-green-200'
                      : 'text-red-700 dark:text-red-200'
                  }`}>
                    {result.passed ? 'Passed!' : 'Failed'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Passing Score</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{exam.passingMarks}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Your Score</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{result.score}</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <button          onClick={() => router.push('/')}
          className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
