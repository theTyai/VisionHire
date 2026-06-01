import React from 'react';

export default function ViolationWarning({ message, onDismiss }) {
  return (
    <div role="alert" aria-live="assertive" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-dark-800 border border-red-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl shadow-red-500/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Attention Required</h3>
          <p className="text-gray-300 mb-6">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors w-full"
            >
              I Understand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
