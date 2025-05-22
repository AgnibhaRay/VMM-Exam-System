'use client';

import { useRef } from 'react';
import { ExamResult, Exam } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExamCertificateProps {
  result: ExamResult;
  exam: Exam;
}

export default function ExamCertificate({ result, exam }: ExamCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${result.candidateName}-certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div>
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="p-8 rounded-lg shadow-lg max-w-2xl mx-auto my-8"
        style={{ 
          minHeight: '600px',
          backgroundColor: '#ffffff'
        }}
      >
        <div 
          className="p-6 h-full"
          style={{
            border: '8px double #2563eb'
          }}
        >
          <div className="text-center space-y-6">
            <h1 
              className="text-4xl font-bold"
              style={{ color: '#2563eb' }}
            >
              Certificate of Completion (Vishal Mega Mart)
            </h1>
            
            <div className="my-8">
              <p className="text-xl" style={{ color: '#4a5568' }}>
                This is to certify that
              </p>
              <h2 className="text-3xl font-bold mt-2 mb-4" style={{ color: '#1a202c' }}>
                {result.candidateName}
              </h2>
              <p className="text-xl" style={{ color: '#4a5568' }}>
                has successfully completed the security assessment of Vishal Mega Mart.
              </p>
              <h3 className="text-2xl font-semibold mt-4 mb-6" style={{ color: '#1a202c' }}>
                {exam.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-12">
              <div>
                <p className="text-lg font-semibold" style={{ color: '#1a202c' }}>Score Achieved</p>
                <p className="text-xl" style={{ color: '#2563eb' }}>{result.score} / {exam.totalMarks}</p>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: '#1a202c' }}>Status</p>
                <p 
                  className="text-xl"
                  style={{ color: result.passed ? '#059669' : '#dc2626' }}
                >
                  {result.passed ? 'PASSED' : 'FAILED'}
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Date of Completion: {result.endTime.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center mt-6 mb-8">
        <button
          onClick={generatePDF}
          style={{ backgroundColor: '#2563eb' }}
          className="px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center mx-auto space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Download Certificate</span>
        </button>
      </div>
    </div>
  );
}
