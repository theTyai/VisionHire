import React from 'react';
export default function LoadingSpinner({ fullScreen, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-2 border-brand-600 border-t-transparent rounded-full animate-spin`} />
  );
  if (fullScreen) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        {spinner}
        <p className="mt-3 text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
  return spinner;
}
