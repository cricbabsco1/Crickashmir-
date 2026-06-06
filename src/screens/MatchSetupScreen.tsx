import { useState } from 'react';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import type { Team } from '../types';

const OVER_OPTIONS = [5, 6, 8, 10, 15, 20, 25, 30, 50];

export default function MatchSetupScreen() {
  const { setScreen, matchSetupData, setMatchSetupData, startMatch } = useStore();
  const step = matchSetupData.step || 1;

  // Quick add team inline
  const [quickTeamName, setQuickTeamName] = useState('');
  const [quickPlayers, setQuickPlayers] = useState('');

  const handleQuickAddTeam = () => {
    if (!quickTeamName.trim()) return;
    const playerNames = quickPlayers.split('\n').map(n => n.trim()).filter(Boolean);
    const team = useStore.getState().addTeam({
      name: quickTeamName.trim(),
      shortName: quickTeamName.trim().substring(0, 3).toUpperCase(),
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`,
      players: [],
    });
    for (const name of playerNames) {
      useStore.getState().addPlayerToTeam(team.id, { name });
    }
    setQuickTeamName('');
    setQuickPlayers('');
  };

  const allTeams = useStore(s => s.teams);

  const selectTeamA = (team: Team) => {
    setMatchSetupData({ teamA: team, step: 2 });
  };

  const selectTeamB = (team: Team) => {
    setMatchSetupData({ teamB: team, step: 3 });
  };

  const selectOvers = (overs: number) => {
    setMatchSetupData({ totalOvers: overs, step: 4 });
  };

  const selectPlayingXI = () => {
    const teamA = matchSetupData.teamA;
    const teamB = matchSetupData.teamB;
    if (!teamA || !teamB) return;
    setMatchSetupData({
      playingXIA: matchSetupData.playingXIA || teamA.players.map(p => p.id),
      playingXIB: matchSetupData.playingXIB || teamB.players.map(p => p.id),
      step: 5,
    });
  };

  const handleToss = (teamId: string, decision: 'bat' | 'bowl') => {
    setMatchSetupData({ tossWonBy: teamId, tossDecision: decision, step: 6 });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-full">
                <span className="text-cric-blue font-bold text-sm">Step 1/5</span>
                <span className="text-dark-300 text-sm">Select Team A</span>
              </div>
            </div>

            {allTeams.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-white font-semibold mb-2">No teams created yet</p>
                <p className="text-dark-300 text-sm mb-4">Create a team first or quick-add below</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => selectTeamA(team)}
                    className="btn-press w-full bg-dark-800 border border-dark-600 rounded-xl p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: team.color }}>
                      {team.shortName.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{team.name}</p>
                      <p className="text-dark-300 text-xs">{team.players.length} players</p>
                    </div>
                    <span className="text-dark-400">→</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Add Team */}
            <div className="mt-6 bg-dark-800 border border-dark-600 rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-3">⚡ Quick Add Team</p>
              <input
                value={quickTeamName}
                onChange={e => setQuickTeamName(e.target.value)}
                placeholder="Team name"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent mb-2"
              />
              <textarea
                value={quickPlayers}
                onChange={e => setQuickPlayers(e.target.value)}
                placeholder="Player names (one per line)"
                rows={4}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent mb-2"
              />
              <button
                onClick={handleQuickAddTeam}
                disabled={!quickTeamName.trim()}
                className="btn-press w-full py-2 bg-accent/20 text-accent rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Create & Add
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fadeIn">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-full">
                <span className="text-cric-blue font-bold text-sm">Step 2/5</span>
                <span className="text-dark-300 text-sm">Select Team B</span>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: matchSetupData.teamA?.color }}>
                {matchSetupData.teamA?.shortName?.substring(0, 2)}
              </div>
              <div>
                <p className="text-dark-300 text-[10px]">Team A</p>
                <p className="text-white font-semibold text-sm">{matchSetupData.teamA?.name}</p>
              </div>
              <span className="text-dark-400 text-lg ml-auto font-bold">VS</span>
              <span className="text-dark-400 ml-2">?</span>
            </div>

            <div className="space-y-2">
              {allTeams.filter(t => t.id !== matchSetupData.teamA?.id).map(team => (
                <button
                  key={team.id}
                  onClick={() => selectTeamB(team)}
                  className="btn-press w-full bg-dark-800 border border-dark-600 rounded-xl p-4 flex items-center gap-3 text-left"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: team.color }}>
                    {team.shortName.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{team.name}</p>
                    <p className="text-dark-300 text-xs">{team.players.length} players</p>
                  </div>
                  <span className="text-dark-400">→</span>
                </button>
              ))}
            </div>

            {allTeams.filter(t => t.id !== matchSetupData.teamA?.id).length === 0 && (
              <div className="text-center py-8">
                <p className="text-dark-300 text-sm">No other teams available. Create another team first.</p>
                <button onClick={() => setScreen('team_create')} className="btn-press mt-3 px-4 py-2 bg-accent rounded-lg text-white text-sm font-semibold">
                  Create Team
                </button>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-full">
                <span className="text-cric-blue font-bold text-sm">Step 3/5</span>
                <span className="text-dark-300 text-sm">Select Overs</span>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 mb-6 flex items-center justify-center gap-3">
              <span className="text-white font-semibold text-sm">{matchSetupData.teamA?.shortName}</span>
              <span className="text-accent font-bold text-sm">VS</span>
              <span className="text-white font-semibold text-sm">{matchSetupData.teamB?.shortName}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {OVER_OPTIONS.map(o => (
                <button
                  key={o}
                  onClick={() => selectOvers(o)}
                  className="btn-press bg-dark-800 border border-dark-600 rounded-xl py-5 text-center hover:border-accent transition-colors"
                >
                  <p className="text-white font-bold text-2xl font-mono">{o}</p>
                  <p className="text-dark-300 text-xs mt-1">overs</p>
                </button>
              ))}
            </div>

            {/* Custom overs */}
            <div className="mt-4">
              <CustomOversInput onSelect={selectOvers} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-full">
                <span className="text-cric-blue font-bold text-sm">Step 4/5</span>
                <span className="text-dark-300 text-sm">Playing XI</span>
              </div>
            </div>

            <PlayingXISelector
              teamA={matchSetupData.teamA!}
              teamB={matchSetupData.teamB!}
              selectedA={matchSetupData.playingXIA || matchSetupData.teamA!.players.map(p => p.id)}
              selectedB={matchSetupData.playingXIB || matchSetupData.teamB!.players.map(p => p.id)}
              onChangeA={(ids) => setMatchSetupData({ playingXIA: ids })}
              onChangeB={(ids) => setMatchSetupData({ playingXIB: ids })}
            />

            <button
              onClick={selectPlayingXI}
              className="btn-press w-full mt-4 py-3 bg-accent rounded-xl text-white font-bold text-sm"
            >
              Confirm Playing XI →
            </button>
          </div>
        );

      case 5:
        return (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-full">
                <span className="text-cric-blue font-bold text-sm">Step 5/5</span>
                <span className="text-dark-300 text-sm">Toss</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🪙</div>
              <p className="text-white font-bold text-lg">Who won the toss?</p>
            </div>

            <div className="space-y-3">
              {[matchSetupData.teamA!, matchSetupData.teamB!].map(team => (
                <div key={team.id} className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: team.color }}>
                      {team.shortName.substring(0, 2)}
                    </div>
                    <p className="text-white font-semibold">{team.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToss(team.id, 'bat')}
                      className="btn-press flex-1 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-semibold text-sm hover:border-accent transition-colors"
                    >
                      🏏 Bat First
                    </button>
                    <button
                      onClick={() => handleToss(team.id, 'bowl')}
                      className="btn-press flex-1 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-semibold text-sm hover:border-accent transition-colors"
                    >
                      🎯 Bowl First
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        const battingFirst = matchSetupData.tossDecision === 'bat'
          ? (matchSetupData.tossWonBy === matchSetupData.teamA?.id ? matchSetupData.teamA : matchSetupData.teamB)
          : (matchSetupData.tossWonBy === matchSetupData.teamA?.id ? matchSetupData.teamB : matchSetupData.teamA);
        const _bowlingFirst = battingFirst?.id === matchSetupData.teamA?.id ? matchSetupData.teamB : matchSetupData.teamA; void _bowlingFirst;

        return (
          <div className="animate-fadeIn text-center">
            <div className="text-5xl mb-4">🏟️</div>
            <p className="text-white font-bold text-xl mb-2">Ready to Start!</p>

            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mt-4 mb-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300 text-xs">Match</span>
                <span className="text-white text-sm font-semibold">{matchSetupData.teamA?.shortName} vs {matchSetupData.teamB?.shortName}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300 text-xs">Overs</span>
                <span className="text-white text-sm font-mono">{matchSetupData.totalOvers}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300 text-xs">Toss</span>
                <span className="text-white text-sm">{matchSetupData.tossWonBy === matchSetupData.teamA?.id ? matchSetupData.teamA?.name : matchSetupData.teamB?.name} won</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300 text-xs">Batting First</span>
                <span className="text-accent text-sm font-semibold">{battingFirst?.name}</span>
              </div>
            </div>

            <button
              onClick={startMatch}
              className="btn-press w-full py-4 bg-gradient-to-r from-accent-dark to-accent rounded-xl text-white font-bold text-lg shadow-lg shadow-accent/20 animate-pulse-glow"
            >
              🏏 Start Match
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="Match Setup" showBack onBack={() => {
        if (step > 1) setMatchSetupData({ step: step - 1 });
        else setScreen('home');
      }} />

      {/* Progress bar */}
      <div className="px-4 pt-3 shrink-0">
        <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-4">
        {renderStep()}
      </div>
    </div>
  );
}

function CustomOversInput({ onSelect }: { onSelect: (o: number) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value.replace(/\D/g, ''))}
        placeholder="Custom overs"
        className="flex-1 bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
        type="number"
        min={1}
        max={99}
      />
      <button
        onClick={() => { const n = parseInt(val); if (n > 0 && n <= 99) onSelect(n); }}
        disabled={!val || parseInt(val) <= 0}
        className="btn-press px-4 bg-accent rounded-xl text-white font-semibold text-sm disabled:opacity-50"
      >
        Set
      </button>
    </div>
  );
}

function PlayingXISelector({
  teamA, teamB, selectedA, selectedB, onChangeA, onChangeB,
}: {
  teamA: Team; teamB: Team;
  selectedA: string[]; selectedB: string[];
  onChangeA: (ids: string[]) => void;
  onChangeB: (ids: string[]) => void;
}) {
  const [tab, setTab] = useState<'a' | 'b'>('a');
  const team = tab === 'a' ? teamA : teamB;
  const selected = tab === 'a' ? selectedA : selectedB;
  const onChange = tab === 'a' ? onChangeA : onChangeB;

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(i => i !== id));
    else onChange([...selected, id]);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('a')} className={`btn-press flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'a' ? 'bg-accent text-white' : 'bg-dark-700 text-dark-300'}`}>
          {teamA.shortName} ({selectedA.length})
        </button>
        <button onClick={() => setTab('b')} className={`btn-press flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'b' ? 'bg-accent text-white' : 'bg-dark-700 text-dark-300'}`}>
          {teamB.shortName} ({selectedB.length})
        </button>
      </div>

      <div className="space-y-1">
        {team.players.map(player => (
          <button
            key={player.id}
            onClick={() => toggle(player.id)}
            className={`btn-press w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
              ${selected.includes(player.id) ? 'bg-accent/10 border border-accent/30' : 'bg-dark-800 border border-dark-600'}`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all
              ${selected.includes(player.id) ? 'bg-accent text-white' : 'bg-dark-700 text-dark-400'}`}>
              {selected.includes(player.id) ? '✓' : ''}
            </div>
            <p className="text-white text-sm font-medium">{player.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
