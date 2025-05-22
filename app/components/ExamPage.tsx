/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Exam } from '../types';
import { useRouter } from 'next/navigation';

export default function ExamPage({ examId }: { examId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tabSwitchWarningCount, setTabSwitchWarningCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  const calculateScore = useCallback(() => {
    if (!exam) return 0;
    let score = 0;
    exam.questions.forEach((question, index) => {
      const selectedAnswer = answers[index.toString()];
      if (selectedAnswer !== undefined && selectedAnswer === question.correctOption) {
        score += question.marks;
      }
    });
    return score;
  }, [exam, answers]);

  const handleSubmit = useCallback(async () => {
    if (!exam || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    const score = calculateScore();
    const passed = score >= exam.passingMarks;

    try {
      const resultDoc = await addDoc(collection(db, 'results'), {
        examId: exam.id,
        candidateId: user.uid,
        score,
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        })),
        startTime: new Date(Date.now() - exam.duration * 60 * 1000),
        endTime: new Date(),
        passed,
      });

      router.push(`/result/${resultDoc.id}`);
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  }, [exam, user, isSubmitting, answers, calculateScore, router]);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        const examData = examDoc.data();
        const formattedExam = {
          ...examData,
          id: examDoc.id,
          questions: examData.questions.map((q: any, index: number) => ({
            ...q,
            id: index.toString() // Ensure each question has a stable ID
          }))
        } as Exam;
        setExam(formattedExam);
        setTimeLeft(formattedExam.duration * 60); // Convert minutes to seconds
      }
    };
    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  useEffect(() => {
    // Add visibility change detection
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        if (tabSwitchWarningCount < 1) {
          // First warning
          setShowTabWarning(true);
          setTabSwitchWarningCount(prev => prev + 1);
        } else {
          // Auto submit on second tab switch
          handleSubmit();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabSwitchWarningCount, isSubmitting, handleSubmit]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              {exam.title}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Time Left: <span className="text-blue-600 dark:text-blue-400">{formatTime(timeLeft)}</span>
              </span>
              <button
                onClick={() => setShowConfirmation(true)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </h2>
              <p className="text-gray-700 dark:text-gray-200 text-lg mb-6">
                {currentQuestion.text}
              </p>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-4 rounded-xl bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="answer"
                      className="form-radio h-5 w-5 text-blue-600"
                      checked={answers[currentQuestion.id] === index}
                      onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-200">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  currentQuestionIndex === exam.questions.length - 1
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg h-fit">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Question Navigator
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[exam.questions[index].id] !== undefined
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTabWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              ⚠️ Tab Switch Warning
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Warning: You have switched away from the exam tab. The exam will be automatically submitted if you switch tabs again. Please stay on this tab until you complete the exam.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTabWarning(false)}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Confirm Submission
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to submit your exam? You wont be able to change your answers after submission.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
