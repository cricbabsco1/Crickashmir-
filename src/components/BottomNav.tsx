import { useStore } from '../store/useStore';
import type { Screen } from '../types';

const tabs: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'home', label: 'Home', icon: '🏠' },
  { screen: 'matches', label: 'Matches', icon: '📋' },
  { screen: 'score', label: 'Score', icon: '🏏' },
  { screen: 'stats', label: 'Stats', icon: '📊' },
  { screen: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav() {
  const { screen, setScreen, currentMatch } = useStore();
  
  return (
    <nav className="flex items-center justify-around bg-dark-800 border-t border-dark-600 px-2 pb-[env(safe-area-inset-bottom)] h-16 shrink-0">
      {tabs.map(tab => {
        const isActive = screen === tab.screen;
        const isScoreTab = tab.screen === 'score';
        
        return (
          <button
            key={tab.screen}
            onClick={() => {
              if (isScoreTab && currentMatch && (currentMatch.status === 'live' || currentMatch.status === 'paused' || currentMatch.status === 'innings_break')) {
                setScreen('live_scoring');
              } else if (isScoreTab) {
                setScreen('match_setup');
              } else {
                setScreen(tab.screen);
              }
            }}
            className={`btn-press flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200
              ${isScoreTab ? 'relative -mt-5' : ''}
              ${isActive ? 'text-accent' : 'text-dark-300'}
            `}
          >
            {isScoreTab ? (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
                ${currentMatch?.status === 'live' ? 'bg-accent animate-pulse-glow' : 'bg-gradient-to-br from-accent to-accent-dark'}
              `}>
                {currentMatch?.status === 'live' ? '⚡' : tab.icon}
              </div>
            ) : (
              <span className="text-xl">{tab.icon}</span>
            )}
            <span className={`text-[10px] font-medium ${isActive ? 'text-accent' : 'text-dark-300'}`}>
              {isScoreTab && currentMatch?.status === 'live' ? 'LIVE' : tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
