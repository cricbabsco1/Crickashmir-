import { useState } from 'react';
import { useStore } from '../store/useStore';
import Header from '../components/Header';

type StatTab = 'runs' | 'wickets' | 'strikeRate' | 'allRounders';

export default function StatsScreen() {
  const { teams, matches } = useStore();
  const [tab, setTab] = useState<StatTab>('runs');

  const allPlayers = teams.flatMap(t => t.players.map(p => ({
    ...p,
    teamName: t.name,
    teamColor: t.color,
    teamShortName: t.shortName,
  })));

  const playersWithStats = allPlayers.filter(p => p.stats.matches > 0);

  const sortedByRuns = [...playersWithStats].sort((a, b) => b.stats.runs - a.stats.runs);
  const sortedByWickets = [...playersWithStats].sort((a, b) => b.stats.wickets - a.stats.wickets);
  const sortedBySR = [...playersWithStats]
    .filter(p => p.stats.balls >= 10)
    .sort((a, b) => ((b.stats.runs / b.stats.balls) * 100) - ((a.stats.runs / a.stats.balls) * 100));
  const sortedAllRounders = [...playersWithStats]
    .filter(p => p.stats.runs > 0 && p.stats.wickets > 0)
    .sort((a, b) => (b.stats.runs + b.stats.wickets * 20) - (a.stats.runs + a.stats.wickets * 20));

  const currentList = {
    runs: sortedByRuns,
    wickets: sortedByWickets,
    strikeRate: sortedBySR,
    allRounders: sortedAllRounders,
  }[tab];

  const getStat = (p: typeof allPlayers[0]) => {
    switch (tab) {
      case 'runs': return `${p.stats.runs} runs (${p.stats.matches} matches)`;
      case 'wickets': return `${p.stats.wickets} wickets (${p.stats.matches} matches)`;
      case 'strikeRate': return `SR ${((p.stats.runs / p.stats.balls) * 100).toFixed(1)}`;
      case 'allRounders': return `${p.stats.runs}r / ${p.stats.wickets}w`;
    }
  };

  const getHighlight = (p: typeof allPlayers[0]) => {
    switch (tab) {
      case 'runs': return p.stats.runs.toString();
      case 'wickets': return p.stats.wickets.toString();
      case 'strikeRate': return ((p.stats.runs / p.stats.balls) * 100).toFixed(0);
      case 'allRounders': return `${p.stats.runs}/${p.stats.wickets}`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="Stats & Leaderboards" />

      {/* Summary cards */}
      <div className="shrink-0 px-4 py-3 grid grid-cols-3 gap-2">
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white font-mono">{matches.length}</p>
          <p className="text-dark-300 text-[10px]">Matches</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white font-mono">{teams.length}</p>
          <p className="text-dark-300 text-[10px]">Teams</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white font-mono">{allPlayers.length}</p>
          <p className="text-dark-300 text-[10px]">Players</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-1 shrink-0 overflow-x-auto">
        {([
          { key: 'runs' as StatTab, label: '🏏 Runs' },
          { key: 'wickets' as StatTab, label: '🎯 Wickets' },
          { key: 'strikeRate' as StatTab, label: '⚡ SR' },
          { key: 'allRounders' as StatTab, label: '🌟 All-round' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn-press px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
              ${tab === t.key ? 'bg-accent text-white' : 'bg-dark-700 text-dark-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-3">
        {playersWithStats.length === 0 && (
          <div className="text-center mt-16 animate-fadeIn">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-white font-bold text-lg">No Stats Yet</p>
            <p className="text-dark-300 text-sm mt-2">Complete a match to see player statistics</p>
          </div>
        )}

        <div className="space-y-2">
          {currentList.map((player, idx) => (
            <div key={player.id} className={`bg-dark-800 border border-dark-600 rounded-xl p-3 flex items-center gap-3 animate-fadeIn ${idx === 0 ? 'border-cric-yellow/30 bg-cric-yellow/5' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${idx === 0 ? 'bg-cric-yellow text-dark-900' : idx === 1 ? 'bg-dark-400 text-dark-900' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-dark-700 text-dark-300'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: player.teamColor }} />
                  <p className="text-dark-400 text-[10px]">{player.teamShortName} • {getStat(player)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold font-mono text-lg ${idx === 0 ? 'text-cric-yellow' : 'text-accent'}`}>
                  {getHighlight(player)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
