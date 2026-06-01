import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-8 m-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-red-400 font-medium mb-2 text-lg">Failed to render question</h3>
          <p className="text-red-300/70 text-sm max-w-sm">
            We encountered an unexpected error displaying this content. 
            You can try refreshing the page or navigating to the next question.
          </p>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
