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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F0F1A] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mb-4">
            <span className="text-3xl">🎙️</span>
          </div>
          <h2 className="text-xl font-extrabold mb-2">PartyVibe Loading Error</h2>
          <p className="text-xs text-gray-400 max-w-sm mb-6">
            Something went wrong while loading the app. Please reload to try again.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-xs font-bold shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
          >
            Reload PartyVibe
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
