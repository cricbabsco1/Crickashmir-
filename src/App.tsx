import { useEffect } from 'react';
import { useStore } from './store/useStore';
import BottomNav from './components/BottomNav';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import TeamCreateScreen from './screens/TeamCreateScreen';
import MatchSetupScreen from './screens/MatchSetupScreen';
import LiveScoringScreen from './screens/LiveScoringScreen';
import MatchesScreen from './screens/MatchesScreen';
import MatchSummaryScreen from './screens/MatchSummaryScreen';
import StatsScreen from './screens/StatsScreen';
import SettingsScreen from './screens/SettingsScreen';

function App() {
  const { screen } = useStore();

  // Handle back button / swipe
  useEffect(() => {
    const handlePopState = () => {
      const s = useStore.getState();
      if (s.screen !== 'home' && s.screen !== 'splash') {
        useStore.getState().goBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Push state for navigation
  useEffect(() => {
    if (screen !== 'splash') {
      window.history.pushState({ screen }, '');
    }
  }, [screen]);

  const showBottomNav = !['splash', 'live_scoring', 'match_setup', 'team_create', 'match_summary'].includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen />;
      case 'home': return <HomeScreen />;
      case 'team_create': return <TeamCreateScreen />;
      case 'match_setup': return <MatchSetupScreen />;
      case 'live_scoring': return <LiveScoringScreen />;
      case 'matches': return <MatchesScreen />;
      case 'match_summary': return <MatchSummaryScreen />;
      case 'stats': return <StatsScreen />;
      case 'settings': return <SettingsScreen />;
      case 'score': return <MatchSetupScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-900 max-w-lg mx-auto relative overflow-hidden font-sans">
      {/* Status bar spacer for mobile */}
      {screen !== 'splash' && <div className="h-[env(safe-area-inset-top)] bg-dark-800 shrink-0" />}
      
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default App;
