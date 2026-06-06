import { useState } from 'react';
import { useStore } from '../store/useStore';
import Header from '../components/Header';

export default function MatchesScreen() {
  const { matches, setScreen, continueMatch, deleteMatch } = useStore();
  const [filter, setFilter] = useState<'all' | 'live' | 'completed'>('all');

  const filtered = matches
    .filter(m => {
      if (filter === 'live') return m.status !== 'completed';
      if (filter === 'completed') return m.status === 'completed';
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="Matches" />

      <div className="flex gap-2 px-4 py-3 shrink-0">
        {(['all', 'live', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-press px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all
              ${filter === f ? 'bg-accent text-white' : 'bg-dark-700 text-dark-300'}`}
          >
            {f} {f === 'all' ? `(${matches.length})` : `(${matches.filter(m => f === 'live' ? m.status !== 'completed' : m.status === 'completed').length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        {filtered.length === 0 && (
          <div className="text-center mt-16 animate-fadeIn">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-white font-bold text-lg">No Matches</p>
            <p className="text-dark-300 text-sm mt-2">Start your first match!</p>
            <button onClick={() => setScreen('match_setup')} className="btn-press mt-4 px-6 py-3 bg-accent rounded-xl text-white font-semibold">
              Start Match
            </button>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(match => (
            <div key={match.id} className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden animate-fadeIn">
              <button
                onClick={() => {
                  if (match.status === 'completed') {
                    useStore.setState({ currentMatch: match });
                    setScreen('match_summary');
                  } else {
                    continueMatch(match.id);
                  }
                }}
                className="btn-press w-full p-4 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {match.status === 'live' && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                    {match.status === 'paused' && <span className="w-2 h-2 rounded-full bg-cric-yellow" />}
                    <span className={`text-[10px] font-bold uppercase
                      ${match.status === 'live' ? 'text-accent' : match.status === 'completed' ? 'text-dark-400' : 'text-cric-yellow'}`}>
                      {match.status}
                    </span>
                  </div>
                  <span className="text-dark-400 text-[10px]">
                    {new Date(match.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: match.teamA.color }}>
                      {match.teamA.shortName.substring(0, 2)}
                    </div>
                    <span className="text-white font-semibold text-sm">{match.teamA.shortName}</span>
                  </div>

                  <div className="text-center px-3">
                    {match.innings[0] && (
                      <p className="text-white font-mono font-bold text-sm">
                        {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                      </p>
                    )}
                  </div>

                  <span className="text-dark-400 text-xs font-bold">vs</span>

                  <div className="text-center px-3">
                    {match.innings[1] && (
                      <p className="text-white font-mono font-bold text-sm">
                        {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                      </p>
                    )}
                    {!match.innings[1] && <span className="text-dark-500 text-xs">-</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{match.teamB.shortName}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: match.teamB.color }}>
                      {match.teamB.shortName.substring(0, 2)}
                    </div>
                  </div>
                </div>

                {match.result && (
                  <p className="text-accent text-xs font-medium mt-2 text-center">{match.result}</p>
                )}

                <p className="text-dark-400 text-[10px] text-center mt-1">{match.totalOvers} overs match</p>
              </button>

              <div className="border-t border-dark-700 flex">
                {match.status !== 'completed' && (
                  <button onClick={() => continueMatch(match.id)} className="btn-press flex-1 py-2 text-accent text-xs font-semibold">
                    Continue ▶
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete this match?')) deleteMatch(match.id); }}
                  className="btn-press px-4 py-2 text-dark-400 text-xs border-l border-dark-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
