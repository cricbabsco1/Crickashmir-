import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function SplashScreen() {
  const { setScreen } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => setScreen('home'), 2000);
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-accent/5 -top-20 -left-20 animate-pulse" />
        <div className="absolute w-64 h-64 rounded-full bg-cric-blue/5 bottom-10 right-10 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-48 h-48 rounded-full bg-cric-purple/5 top-1/3 right-1/4 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 animate-scaleIn">
        {/* Cricket ball icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-2xl shadow-red-900/30 relative">
          <div className="absolute inset-2 rounded-full border-2 border-red-400/30" />
          <span className="text-4xl">🏏</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Kashmir<span className="text-accent">Cric</span>
          </h1>
          <p className="text-dark-300 text-sm mt-1 font-medium">Premium Cricket Scorer</p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-dark-700 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full shimmer-bg" style={{ animation: 'shimmer 1.5s infinite, loading 2s ease-in-out forwards' }} />
        </div>

        <p className="text-dark-400 text-xs mt-2">Powered by passion for cricket ❤️</p>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
