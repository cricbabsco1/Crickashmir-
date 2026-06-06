import { useState } from 'react';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import Modal from '../components/Modal';
import type { Team, Player } from '../types';

const TEAM_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];

export default function TeamCreateScreen() {
  const { setScreen, teams, addTeam, updateTeam, deleteTeam, addPlayerToTeam, removePlayerFromTeam } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamShortName, setTeamShortName] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const [playerName, setPlayerName] = useState('');
  const [playerBatStyle, setPlayerBatStyle] = useState<Player['battingStyle']>('Right Hand');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    const short = teamShortName.trim() || teamName.trim().substring(0, 3).toUpperCase();
    
    if (editingTeam) {
      updateTeam({ ...editingTeam, name: teamName.trim(), shortName: short, color: teamColor });
    } else {
      const t = addTeam({ name: teamName.trim(), shortName: short, color: teamColor, players: [] });
      setSelectedTeam(t);
    }
    
    setTeamName('');
    setTeamShortName('');
    setTeamColor(TEAM_COLORS[0]);
    setEditingTeam(null);
    setShowCreateModal(false);
  };

  const handleAddPlayer = () => {
    if (!playerName.trim() || !selectedTeam) return;
    addPlayerToTeam(selectedTeam.id, { name: playerName.trim(), battingStyle: playerBatStyle });
    setPlayerName('');
    // Refresh selected team
    const updated = useStore.getState().teams.find(t => t.id === selectedTeam.id);
    if (updated) setSelectedTeam(updated);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamShortName(team.shortName);
    setTeamColor(team.color);
    setShowCreateModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="Teams" showBack onBack={() => setScreen('home')} rightAction={
        <button
          onClick={() => { setEditingTeam(null); setTeamName(''); setTeamShortName(''); setShowCreateModal(true); }}
          className="btn-press px-3 py-1.5 bg-accent rounded-lg text-white text-sm font-semibold"
        >
          + New
        </button>
      } />

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        {teams.length === 0 && (
          <div className="text-center mt-16 animate-fadeIn">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-white font-bold text-lg">No Teams Yet</p>
            <p className="text-dark-300 text-sm mt-2">Create your first team to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-press mt-4 px-6 py-3 bg-accent rounded-xl text-white font-semibold"
            >
              Create Team
            </button>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {teams.map(team => (
            <div key={team.id} className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden animate-fadeIn">
              <button
                onClick={() => {
                  const updated = useStore.getState().teams.find(t => t.id === team.id);
                  setSelectedTeam(updated || team);
                }}
                className="btn-press w-full p-4 text-left flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: team.color }}>
                  {team.shortName.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{team.name}</p>
                  <p className="text-dark-300 text-xs">{team.players.length} players</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditTeam(team); }} className="btn-press w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-xs">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this team?')) deleteTeam(team.id); }} className="btn-press w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-xs">🗑️</button>
                </div>
              </button>

              {selectedTeam?.id === team.id && (
                <div className="border-t border-dark-600 p-3 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-dark-300 text-xs font-medium">PLAYERS</p>
                    <button onClick={() => setShowPlayerModal(true)} className="btn-press text-accent text-xs font-semibold">+ Add Player</button>
                  </div>
                  {selectedTeam.players.length === 0 && (
                    <p className="text-dark-400 text-xs text-center py-3">No players added yet</p>
                  )}
                  {selectedTeam.players.map((player, idx) => (
                    <div key={player.id} className="flex items-center gap-2 py-2 border-b border-dark-700 last:border-0">
                      <span className="text-dark-400 text-xs w-5 text-center font-mono">{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{player.name}</p>
                        {player.battingStyle && <p className="text-dark-400 text-[10px]">{player.battingStyle}</p>}
                      </div>
                      {player.stats.matches > 0 && (
                        <span className="text-dark-300 text-[10px] font-mono">{player.stats.runs}r / {player.stats.wickets}w</span>
                      )}
                      <button onClick={() => {
                        removePlayerFromTeam(team.id, player.id);
                        const updated = useStore.getState().teams.find(t => t.id === team.id);
                        if (updated) setSelectedTeam(updated);
                      }} className="btn-press text-dark-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={editingTeam ? 'Edit Team' : 'Create Team'}>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-dark-300 text-xs font-medium mb-1 block">Team Name *</label>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g., Downtown XI"
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="text-dark-300 text-xs font-medium mb-1 block">Short Name</label>
            <input
              value={teamShortName}
              onChange={e => setTeamShortName(e.target.value.toUpperCase())}
              placeholder="e.g., DTX"
              maxLength={4}
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-dark-300 text-xs font-medium mb-1 block">Team Color</label>
            <div className="flex gap-2 flex-wrap">
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setTeamColor(c)}
                  className={`btn-press w-10 h-10 rounded-xl transition-all ${teamColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800 scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateTeam}
            disabled={!teamName.trim()}
            className="btn-press w-full py-3 bg-accent rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingTeam ? 'Update Team' : 'Create Team'}
          </button>
        </div>
      </Modal>

      {/* Add Player Modal */}
      <Modal isOpen={showPlayerModal} onClose={() => setShowPlayerModal(false)} title="Add Player">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-dark-300 text-xs font-medium mb-1 block">Player Name *</label>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddPlayer(); }}
            />
          </div>
          <div>
            <label className="text-dark-300 text-xs font-medium mb-1 block">Batting Style</label>
            <div className="flex gap-2">
              {(['Right Hand', 'Left Hand'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setPlayerBatStyle(style)}
                  className={`btn-press flex-1 py-2 rounded-lg text-xs font-medium transition-all
                    ${playerBatStyle === style ? 'bg-accent text-white' : 'bg-dark-700 text-dark-300 border border-dark-600'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddPlayer}
              disabled={!playerName.trim()}
              className="btn-press flex-1 py-3 bg-accent rounded-xl text-white font-bold text-sm disabled:opacity-50"
            >
              Add Player
            </button>
            <button
              onClick={() => setShowPlayerModal(false)}
              className="btn-press px-4 py-3 bg-dark-700 rounded-xl text-white text-sm font-medium"
            >
              Done
            </button>
          </div>
          {selectedTeam && selectedTeam.players.length > 0 && (
            <div className="border-t border-dark-700 pt-3 mt-2">
              <p className="text-dark-400 text-xs mb-2">Added ({selectedTeam.players.length}):</p>
              <div className="flex flex-wrap gap-1">
                {selectedTeam.players.map(p => (
                  <span key={p.id} className="px-2 py-1 bg-dark-700 rounded-lg text-dark-300 text-xs">{p.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
