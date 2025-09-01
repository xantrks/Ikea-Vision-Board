/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onDownload: () => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, imageUrl, onDownload }) => {
  if (!isOpen || !imageUrl) {
    return null;
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-4 md:p-6 relative transform transition-all flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={handleModalContentClick}
        role="document"
      >
        <div className="text-center mb-4 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-zinc-800">Your New Room!</h2>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-grow rounded-lg overflow-hidden bg-zinc-100 mb-4 min-h-0">
            <img src={imageUrl} alt="Generated room scene" className="w-full h-full object-contain" />
        </div>
        
        <div className="flex-shrink-0 flex justify-center">
            <button
                onClick={onDownload}
                className="text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors flex items-center"
                style={{backgroundColor: 'var(--ikea-blue)'}}
                aria-label="Download generated image"
            >
                <DownloadIcon />
                <span>Download Image</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
