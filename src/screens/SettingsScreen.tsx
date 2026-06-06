import { useState } from 'react';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import Modal from '../components/Modal';

export default function SettingsScreen() {
  const { teams, matches } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleClearAll = () => {
    if (confirm('Are you SURE? This will delete ALL data permanently.')) {
      localStorage.removeItem('kashmir-cric-storage');
      window.location.reload();
    }
    setShowClearConfirm(false);
  };

  const storageUsed = (() => {
    try {
      const data = localStorage.getItem('kashmir-cric-storage');
      return data ? (new Blob([data]).size / 1024).toFixed(1) : '0';
    } catch { return '?'; }
  })();

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="Settings" />

      <div className="flex-1 overflow-y-auto scrollable px-4 py-4">
        {/* App info */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-4 text-center animate-fadeIn">
          <div className="text-4xl mb-2">🏏</div>
          <h2 className="text-white font-black text-xl">Kashmir<span className="text-accent">Cric</span></h2>
          <p className="text-dark-300 text-xs mt-1">Premium Cricket Scorer v1.0</p>
          <p className="text-dark-400 text-[10px] mt-1">Built for Kashmir cricket community</p>
        </div>

        {/* Stats */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <p className="text-white font-semibold text-sm mb-3">📊 App Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dark-300 text-sm">Total Teams</span>
              <span className="text-white font-mono">{teams.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-300 text-sm">Total Players</span>
              <span className="text-white font-mono">{teams.reduce((s, t) => s + t.players.length, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-300 text-sm">Total Matches</span>
              <span className="text-white font-mono">{matches.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-300 text-sm">Completed</span>
              <span className="text-white font-mono">{matches.filter(m => m.status === 'completed').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-300 text-sm">Storage Used</span>
              <span className="text-white font-mono">{storageUsed} KB</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowAbout(true)}
            className="btn-press w-full bg-dark-800 border border-dark-600 rounded-xl p-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="text-white font-medium text-sm">About</p>
              <p className="text-dark-400 text-xs">App information</p>
            </div>
          </button>

          <button
            onClick={() => {
              const data = localStorage.getItem('kashmir-cric-storage');
              if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kashmir-cric-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
            className="btn-press w-full bg-dark-800 border border-dark-600 rounded-xl p-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">💾</span>
            <div>
              <p className="text-white font-medium text-sm">Export Data</p>
              <p className="text-dark-400 text-xs">Download backup file</p>
            </div>
          </button>

          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = ev.target?.result as string;
                      JSON.parse(data); // Validate
                      localStorage.setItem('kashmir-cric-storage', data);
                      window.location.reload();
                    } catch {
                      alert('Invalid backup file');
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="btn-press w-full bg-dark-800 border border-dark-600 rounded-xl p-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">📂</span>
            <div>
              <p className="text-white font-medium text-sm">Import Data</p>
              <p className="text-dark-400 text-xs">Restore from backup</p>
            </div>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-press w-full bg-dark-800 border border-wicket/30 rounded-xl p-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">🗑️</span>
            <div>
              <p className="text-wicket font-medium text-sm">Clear All Data</p>
              <p className="text-dark-400 text-xs">Delete everything permanently</p>
            </div>
          </button>
        </div>

        <div className="text-center mt-8 mb-4">
          <p className="text-dark-500 text-xs">Made with ❤️ for Kashmir Cricket</p>
          <p className="text-dark-600 text-[10px] mt-1">Offline-first • No cloud • Your data stays yours</p>
        </div>
      </div>

      {/* About Modal */}
      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About KashmirCric">
        <div className="p-5 text-center">
          <div className="text-5xl mb-3">🏏</div>
          <h2 className="text-white font-black text-2xl">Kashmir<span className="text-accent">Cric</span></h2>
          <p className="text-dark-300 text-sm mt-2">Premium Cricket Scoring App</p>
          <p className="text-dark-400 text-xs mt-4 leading-relaxed">
            Built specifically for local cricket in Kashmir. Fast, offline-first scoring designed for umpires and scorers. No login required. All data stays on your device.
          </p>
          <div className="mt-4 pt-4 border-t border-dark-700">
            <p className="text-dark-400 text-xs">Version 1.0.0</p>
            <p className="text-dark-500 text-[10px] mt-1">React • TypeScript • Zustand</p>
          </div>
        </div>
      </Modal>

      {/* Clear confirm */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="⚠️ Clear All Data">
        <div className="p-5 text-center">
          <p className="text-white text-sm mb-4">This will permanently delete all teams, players, and match history.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowClearConfirm(false)} className="btn-press flex-1 py-3 bg-dark-700 rounded-xl text-white font-medium">Cancel</button>
            <button onClick={handleClearAll} className="btn-press flex-1 py-3 bg-wicket rounded-xl text-white font-bold">Delete All</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
