import { useStore } from '../store/useStore';
import Header from '../components/Header';

export default function HomeScreen() {
  const { setScreen, matches, teams, currentMatch, continueMatch } = useStore();

  const recentMatches = [...matches].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const liveMatch = currentMatch && (currentMatch.status === 'live' || currentMatch.status === 'paused' || currentMatch.status === 'innings_break');

  // Top performers from all teams
  const allPlayers = teams.flatMap(t => t.players);
  const topRunScorers = [...allPlayers].sort((a, b) => b.stats.runs - a.stats.runs).slice(0, 3);
  const topWicketTakers = [...allPlayers].sort((a, b) => b.stats.wickets - a.stats.wickets).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="KashmirCric" rightAction={
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-300 font-mono">{matches.length} matches</span>
        </div>
      } />

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        {/* Hero / Live Match */}
        {liveMatch && currentMatch && (
          <div className="mt-4 animate-fadeIn">
            <button
              onClick={() => continueMatch(currentMatch.id)}
              className="btn-press w-full bg-gradient-to-r from-accent-dark to-accent rounded-2xl p-4 relative overflow-hidden"
            >
              <div className="absolute top-2 right-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold text-white/90">LIVE</span>
              </div>
              <div className="text-left">
                <p className="text-white/70 text-xs font-medium mb-1">Continue Scoring</p>
                <p className="text-white font-bold text-lg">
                  {currentMatch.teamA.shortName} vs {currentMatch.teamB.shortName}
                </p>
                {currentMatch.innings[currentMatch.currentInnings] && (
                  <p className="text-white/80 text-sm mt-1 font-mono">
                    {currentMatch.innings[currentMatch.currentInnings].totalRuns}/
                    {currentMatch.innings[currentMatch.currentInnings].totalWickets}
                    {' '}({currentMatch.innings[currentMatch.currentInnings].totalOvers}.
                    {currentMatch.innings[currentMatch.currentInnings].currentOverBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'no_ball').length})
                  </p>
                )}
              </div>
              <div className="absolute bottom-0 right-0 text-6xl opacity-10">⚡</div>
            </button>
          </div>
        )}

        {/* Quick Start */}
        <div className="mt-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setScreen('match_setup')}
            className="btn-press w-full bg-gradient-to-r from-cric-blue to-cric-purple rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-cric-blue/20"
          >
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl">🏏</div>
            <div className="text-left flex-1">
              <p className="text-white font-bold text-lg">Start New Match</p>
              <p className="text-white/60 text-sm">Setup teams and begin scoring</p>
            </div>
            <span className="text-white/40 text-2xl">→</span>
          </button>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => setScreen('team_create')}
            className="btn-press bg-dark-800 border border-dark-600 rounded-xl p-4 text-left"
          >
            <span className="text-2xl">👥</span>
            <p className="text-white font-semibold text-sm mt-2">Create Team</p>
            <p className="text-dark-300 text-xs mt-0.5">{teams.length} teams</p>
          </button>
          <button
            onClick={() => setScreen('stats')}
            className="btn-press bg-dark-800 border border-dark-600 rounded-xl p-4 text-left"
          >
            <span className="text-2xl">📊</span>
            <p className="text-white font-semibold text-sm mt-2">View Stats</p>
            <p className="text-dark-300 text-xs mt-0.5">Leaderboards</p>
          </button>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="mt-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-base">Recent Matches</h2>
              <button onClick={() => setScreen('matches')} className="text-accent text-xs font-semibold">View All</button>
            </div>
            <div className="space-y-2">
              {recentMatches.map(match => (
                <button
                  key={match.id}
                  onClick={() => {
                    if (match.status === 'completed') {
                      useStore.setState({ currentMatch: match });
                      setScreen('match_summary');
                    } else {
                      continueMatch(match.id);
                    }
                  }}
                  className="btn-press w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">
                          {match.teamA.shortName} vs {match.teamB.shortName}
                        </p>
                        {match.status === 'live' && (
                          <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[10px] font-bold rounded">LIVE</span>
                        )}
                        {match.status === 'completed' && (
                          <span className="px-1.5 py-0.5 bg-dark-600 text-dark-300 text-[10px] font-bold rounded">DONE</span>
                        )}
                      </div>
                      {match.result && (
                        <p className="text-dark-300 text-xs mt-0.5">{match.result}</p>
                      )}
                      {!match.result && match.innings[0] && (
                        <p className="text-dark-300 text-xs mt-0.5 font-mono">
                          {match.innings.map((inn, i) => (
                            <span key={i}>{i > 0 ? ' | ' : ''}{inn.totalRuns}/{inn.totalWickets}</span>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="text-dark-400 text-xs">
                      {new Date(match.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Performers */}
        {topRunScorers.length > 0 && topRunScorers[0].stats.runs > 0 && (
          <div className="mt-6 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-white font-bold text-base mb-3">🏆 Top Performers</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-3">
                <p className="text-dark-300 text-xs font-medium mb-2">🏏 Most Runs</p>
                {topRunScorers.filter(p => p.stats.runs > 0).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 py-1">
                    <span className="text-xs font-bold text-dark-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{p.name}</p>
                    </div>
                    <span className="text-accent text-xs font-bold font-mono">{p.stats.runs}</span>
                  </div>
                ))}
              </div>
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-3">
                <p className="text-dark-300 text-xs font-medium mb-2">🎯 Most Wickets</p>
                {topWicketTakers.filter(p => p.stats.wickets > 0).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 py-1">
                    <span className="text-xs font-bold text-dark-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{p.name}</p>
                    </div>
                    <span className="text-cric-red text-xs font-bold font-mono">{p.stats.wickets}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {matches.length === 0 && teams.length === 0 && (
          <div className="mt-10 text-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="text-5xl mb-4">🏟️</div>
            <p className="text-white font-bold text-lg">Welcome to KashmirCric!</p>
            <p className="text-dark-300 text-sm mt-2 max-w-xs mx-auto">
              Start by creating teams, adding players, and begin scoring your first match.
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
