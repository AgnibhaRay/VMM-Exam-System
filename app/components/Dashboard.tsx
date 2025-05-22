'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Exam, ExamResult } from '../types';
import AdminPanel from './AdminPanel';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeTab, setActiveTab] = useState<'exams' | 'admin'>('exams');
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        if (user.role === 'admin') {
          const examsSnapshot = await getDocs(collection(db, 'exams'));
          const examsData = examsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Exam);
          setExams(examsData);

          const resultsSnapshot = await getDocs(collection(db, 'results'));
          const resultsData = resultsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ExamResult);
          setResults(resultsData);
        } else {
          const examsSnapshot = await getDocs(collection(db, 'exams'));
          const examsData = examsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Exam);
          setExams(examsData);

          const resultsQuery = query(
            collection(db, 'results'),
            where('candidateId', '==', user.uid)
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          const resultsData = resultsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ExamResult);
          setResults(resultsData);
        }
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  const renderExamList = () => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
        {user.role === 'admin' ? 'Exams Overview' : 'Available Exams'}
      </h2>
      <div className="space-y-4">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {exam.title}
            </h3>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Duration: {exam.duration} minutes
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Total Marks: {exam.totalMarks}
              </p>
            </div>
            {user.role === 'candidate' && (
              <a
                href={`/exam/${exam.id}`}
                className="mt-4 block w-full px-6 py-3 text-sm font-medium text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Take Exam
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
        {user.role === 'admin' ? 'Recent Results' : 'Your Results'}
      </h2>
      <div className="space-y-4">
        {results.map((result) => {
          const exam = exams.find((e) => e.id === result.examId);
          return (
            <a
              key={result.id}
              href={`/result/${result.id}`}
              className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {exam?.title || 'Exam'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Score: {result.score}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.passed
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {result.passed ? 'Passed' : 'Failed'}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Welcome, {user.name || 'User'}
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Candidate'} Dashboard
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'admin' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('exams')}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === 'exams'
                      ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600'
                      : 'text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                >
                  View Exams
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === 'admin'
                      ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600'
                      : 'text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                >
                  Create Exam
                </button>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Sign Out
            </button>
          </div>
        </div>

        {user.role === 'admin' && activeTab === 'admin' ? (
          <AdminPanel />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderExamList()}
            {renderResults()}
          </div>
        )}
      </div>
    </div>
  );
}