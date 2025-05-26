/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSecurityContext } from '../contexts/SecurityContext';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Exam } from '../types';
import { useRouter } from 'next/navigation';

export default function ExamPage({ examId }: { examId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const examContainerRef = useRef<HTMLDivElement>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  const { 
    isSecureMode,
    enableSecureMode,
    violations,
    addViolation
  } = useSecurityContext();

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
        candidateName: user.name,
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

  const [showSecurityPrompt, setShowSecurityPrompt] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isEnablingSecureMode, setIsEnablingSecureMode] = useState(false);

  const startSecureExam = async () => {
    // Validate the exam container ref
    if (!examContainerRef.current) {
      setSecurityError('Critical: Exam container not initialized. Please refresh the page.');
      return;
    }
    
    setIsEnablingSecureMode(true);
    try {
      setSecurityError(null);
      
      // Handle fullscreen initialization
      await enableSecureMode(examContainerRef.current);
      
      // Only proceed if fullscreen was successfully enabled
      if (!isSecureMode) {
        throw new Error('Failed to initialize secure mode. Please ensure fullscreen permissions are granted.');
      }
      
      setShowSecurityPrompt(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to start secure exam:', error);
      
      // Provide more specific error messages based on the error type
      if (errorMessage.toLowerCase().includes('permission')) {
        setSecurityError(
          'Browser permission denied. Please ensure:\n' +
          '1. You allow fullscreen when prompted\n' +
          '2. No browser settings are blocking fullscreen\n' +
          '3. Try clicking the button again'
        );
      } else if (errorMessage.includes('timed out')) {
        setSecurityError(
          'The request timed out. Please:\n' +
          '1. Check your browser settings\n' +
          '2. Respond to any permission prompts quickly\n' +
          '3. Try again'
        );
      } else {
        setSecurityError(`Failed to start secure exam: ${errorMessage}`);
      }
    } finally {
      setIsEnablingSecureMode(false);
    }
  };

  useEffect(() => {
    if (violations.length > 0) {
      const latestViolation = violations[violations.length - 1];
      setSecurityWarnings(prev => [...prev, `Security Warning: ${latestViolation.type} detected at ${latestViolation.timestamp.toLocaleTimeString()}`]);
      
      if (violations.length >= 3) {
        handleSubmit(); // Auto-submit after 3 violations
      }
    }
  }, [violations, handleSubmit]);

  // Add visibility change detection with security context
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        addViolation({
          type: 'tab_switch',
          timestamp: new Date(),
          details: 'Switched to another tab or window'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [addViolation, isSubmitting]);

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

  useEffect(() => {
    // Remove Grammarly attributes if they exist
    const body = document.body;
    if (body) {
      ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'].forEach(attr => {
        if (body.hasAttribute(attr)) {
          body.removeAttribute(attr);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Clean up any extension-added attributes from the exam container
    if (examContainerRef.current) {
      const container = examContainerRef.current;
      const attributesToRemove = [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-gramm',
        'data-gramm_editor',
        'data-enable-grammarly'
      ];
      
      attributesToRemove.forEach(attr => {
        if (container.hasAttribute(attr)) {
          container.removeAttribute(attr);
        }
      });

      // Disable Grammarly
      container.setAttribute('data-enable-grammarly', 'false');
    }
  }, []); // Empty dependency array since we only need to run this once

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div ref={examContainerRef} className="min-h-screen">
      {showSecurityPrompt ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Start Secure Exam
            </h2>
            <div className="text-gray-600 dark:text-gray-300 mb-6">
              <p className="mb-2">To maintain exam integrity, we need to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Enter fullscreen mode</li>
                <li>Disable certain keyboard shortcuts</li>
                <li>Monitor tab switching</li>
                <li>Prevent right-clicking</li>
              </ul>
            </div>

            {securityError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg">
                <p>{securityError}</p>
                <div className="mt-2">
                  <p className="mb-1">Please ensure:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Your browser supports fullscreen mode</li>
                    <li>You have granted fullscreen permissions</li>
                    <li>No other program is preventing fullscreen</li>
                  </ul>
                </div>
              </div>
            )}
            
            <button
              onClick={startSecureExam}
              disabled={isEnablingSecureMode}
              className={`w-full px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl transition-all duration-200 shadow-md transform 
                ${isEnablingSecureMode 
                  ? 'opacity-75 cursor-not-allowed' 
                  : 'hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                }`}
            >
              {isEnablingSecureMode ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enabling Secure Mode...
                </div>
              ) : (
                'Start Exam in Secure Mode'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {!isSecureMode && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50">
              <p className="text-sm">
                Warning: Secure mode is not active. Some exam features may be limited.
              </p>
            </div>
          )}
          {/* Security Warnings */}
          {securityWarnings.length > 0 && (
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {securityWarnings.map((warning, index) => (
                <div
                  key={index}
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
                  role="alert"
                >
                  <p className="text-sm">{warning}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
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
        </div>
      )}
    </div>
  );
}
