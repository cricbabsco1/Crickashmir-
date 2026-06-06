import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import WagonWheelModal from '../components/WagonWheelModal';
import type { WicketType, ExtraType } from '../types';

export default function LiveScoringScreen() {
  const {
    currentMatch, currentStrikerId, currentNonStrikerId, currentBowlerId,
    setCurrentBatters, setCurrentBowler, scoreBall, undoLastBall, swapStrike,
    completeInnings, pauseMatch, setScreen, setShowWagonWheel, showWagonWheel,
  } = useStore();

  const [_showBatterSelect, setShowBatterSelect] = useState(!currentStrikerId); void _showBatterSelect;
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showWicketPanel, setShowWicketPanel] = useState(false);
  const [showExtrasPanel, setShowExtrasPanel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showScorecardTab, setShowScorecardTab] = useState<'live' | 'scorecard' | 'commentary'>('live');
  const [wicketRuns, setWicketRuns] = useState(0);
  const [_pendingShotZone, setPendingShotZone] = useState<number | undefined>(); void _pendingShotZone;
  const [showEndInnings, setShowEndInnings] = useState(false);
  const [showCompleteMatch, setShowCompleteMatch] = useState(false);

  if (!currentMatch) return null;

  const match = currentMatch;

  // Innings break screen
  if (match.status === 'innings_break') {
    const firstInn = match.innings[0];
    const firstTeamName = firstInn.battingTeamId === match.teamA.id ? match.teamA.name : match.teamB.name;
    const secondTeamName = firstInn.bowlingTeamId === match.teamA.id ? match.teamA.name : match.teamB.name;
    const target = firstInn.totalRuns + 1;
    
    return (
      <div className="flex flex-col h-full bg-dark-900 items-center justify-center px-6">
        <div className="animate-scaleIn text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-white font-black text-2xl mb-2">Innings Break</h2>
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-4 w-full">
            <p className="text-dark-300 text-xs">{firstTeamName} scored</p>
            <p className="text-white font-mono font-bold text-3xl mt-1">
              {firstInn.totalRuns}/{firstInn.totalWickets}
            </p>
            <p className="text-dark-400 text-xs mt-1">
              ({firstInn.totalOvers}.{firstInn.currentOverBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'no_ball').length} overs)
            </p>
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 mb-6">
            <p className="text-accent text-sm font-semibold">
              {secondTeamName} need <span className="text-white font-bold text-lg">{target}</span> to win
            </p>
            <p className="text-dark-300 text-xs mt-1">in {match.totalOvers} overs</p>
          </div>
          <button
            onClick={() => {
              useStore.setState({ 
                currentMatch: { ...match, status: 'live' },
                currentStrikerId: null,
                currentNonStrikerId: null,
                currentBowlerId: null,
              });
              const updated = { ...match, status: 'live' as const };
              const ms = useStore.getState().matches.map(m => m.id === match.id ? updated : m);
              useStore.setState({ matches: ms });
            }}
            className="btn-press w-full py-4 bg-gradient-to-r from-accent-dark to-accent rounded-xl text-white font-bold text-lg shadow-lg shadow-accent/20"
          >
            Start 2nd Innings 🏏
          </button>
        </div>
      </div>
    );
  }

  const inn = match.innings[match.currentInnings];
  const battingTeam = inn.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const _bowlingTeam = inn.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB; void _bowlingTeam;
  const playingXI = inn.battingTeamId === match.teamA.id ? match.playingXIA : match.playingXIB;
  const bowlingXI = inn.bowlingTeamId === match.teamA.id ? match.playingXIA : match.playingXIB;

  const striker = inn.batters.find(b => b.playerId === currentStrikerId);
  const nonStriker = inn.batters.find(b => b.playerId === currentNonStrikerId);
  const bowler = inn.bowlers.find(b => b.playerId === currentBowlerId);

  const getPlayerName = (id: string): string => {
    const all = [...match.teamA.players, ...match.teamB.players];
    return all.find(p => p.id === id)?.name || '?';
  };

  const legalBallsInOver = inn.currentOverBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'no_ball').length;
  const currentOverStr = `${inn.totalOvers}.${legalBallsInOver}`;
  const runRate = inn.totalBalls > 0 ? ((inn.totalRuns / inn.totalBalls) * 6).toFixed(2) : '0.00';

  const target = match.currentInnings === 1 && match.innings[0] ? match.innings[0].totalRuns + 1 : null;
  const remaining = target ? target - inn.totalRuns : null;
  const ballsLeft = target ? (match.totalOvers * 6 - inn.totalBalls) : null;
  const reqRate = remaining && ballsLeft && ballsLeft > 0 ? ((remaining / ballsLeft) * 6).toFixed(2) : null;

  const needBatter = !currentStrikerId || !currentNonStrikerId;
  const needBowler = !currentBowlerId;

  // Available batters (not out, not already batting)
  const availableBatters = playingXI.filter(id => {
    const b = inn.batters.find(bi => bi.playerId === id);
    if (!b) return true;
    return !b.isOut && !b.isRetired && id !== currentStrikerId && id !== currentNonStrikerId;
  });

  // Available bowlers
  const availableBowlers = bowlingXI;

  const handleScore = useCallback((runs: number) => {
    if (needBatter || needBowler) return;
    // Show wagon wheel for boundaries
    if (runs >= 4) {
      setPendingShotZone(undefined);
      setShowWagonWheel(true);
      // Store pending score
      (window as any).__pendingScore = { runs };
      return;
    }
    scoreBall(runs, null, null, undefined);
  }, [needBatter, needBowler, scoreBall, setShowWagonWheel]);

  const handleWagonWheelSelect = (zone?: number) => {
    const pending = (window as any).__pendingScore;
    const pendingWicket = (window as any).__pendingWicket;
    const pendingExtra = (window as any).__pendingExtra;
    
    if (pending) {
      scoreBall(pending.runs, null, null, zone);
      (window as any).__pendingScore = null;
    } else if (pendingWicket) {
      scoreBall(pendingWicket.runs, null, pendingWicket.wicket, zone);
      (window as any).__pendingWicket = null;
    } else if (pendingExtra) {
      scoreBall(pendingExtra.runs, pendingExtra.extras, null, zone);
      (window as any).__pendingExtra = null;
    }
    setShowWagonWheel(false);
  };

  const handleExtra = (type: ExtraType, extraRuns: number = 0) => {
    if (needBatter || needBowler) return;
    scoreBall(0, { type, runs: extraRuns }, null, undefined);
    setShowExtrasPanel(false);
  };

  const handleWicket = (type: WicketType, dismissedId?: string) => {
    if (needBatter || needBowler) return;
    const dismissed = dismissedId || currentStrikerId || undefined;
    scoreBall(wicketRuns, null, { type, dismissedId: dismissed }, undefined);
    setShowWicketPanel(false);
    setWicketRuns(0);
  };

  // Check if innings/match should end
  const isInningsComplete = inn.isCompleted;
  const isMatchOver = match.currentInnings === 1 && inn.isCompleted;

  // Auto show completion dialogs
  const hasShownRef = useRef({ innings: false, match: false });
  useEffect(() => {
    if (isMatchOver && !showCompleteMatch && match.status !== 'completed' && !hasShownRef.current.match) {
      hasShownRef.current.match = true;
      const t = setTimeout(() => setShowCompleteMatch(true), 500);
      return () => clearTimeout(t);
    } else if (isInningsComplete && !isMatchOver && match.currentInnings === 0 && !showEndInnings && !hasShownRef.current.innings) {
      hasShownRef.current.innings = true;
      const t = setTimeout(() => setShowEndInnings(true), 500);
      return () => clearTimeout(t);
    }
  }, [isMatchOver, isInningsComplete, showCompleteMatch, showEndInnings, match.status, match.currentInnings]);

  const renderBallTimeline = () => {
    const balls = inn.currentOverBalls;
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {balls.map((ball, i) => {
          let bg = 'bg-dark-600';
          let text = `${ball.runs}`;
          
          if (ball.isWicket) { bg = 'bg-wicket'; text = 'W'; }
          else if (ball.runs === 6) { bg = 'bg-six'; text = '6'; }
          else if (ball.runs === 4) { bg = 'bg-four'; text = '4'; }
          else if (ball.runs === 0 && !ball.isExtra) { bg = 'bg-dot'; text = '•'; }
          else if (ball.isExtra) { bg = 'bg-extra'; text = ball.extraType === 'wide' ? 'Wd' : ball.extraType === 'no_ball' ? 'Nb' : ball.extraType === 'bye' ? 'B' : 'Lb'; }
          else { bg = 'bg-run'; }
          
          return (
            <div key={i} className={`${bg} w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 animate-ballRoll`}>
              {text}
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, 6 - legalBallsInOver) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-9 h-9 rounded-full border border-dark-600 border-dashed flex items-center justify-center text-dark-500 text-xs shrink-0">
            {legalBallsInOver + i + 1}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Top Score Bar */}
      <div className="shrink-0 bg-gradient-to-r from-dark-800 to-dark-700 border-b border-dark-600 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: battingTeam.color }}>
              {battingTeam.shortName.substring(0, 2)}
            </div>
            <div>
              <p className="text-white font-bold text-xl font-mono leading-none">
                {inn.totalRuns}<span className="text-dark-300 text-sm">/{inn.totalWickets}</span>
              </p>
              <p className="text-dark-300 text-[10px] font-mono">{currentOverStr} ov • RR {runRate}</p>
            </div>
          </div>
          <div className="text-right">
            {target && (
              <div>
                <p className="text-cric-yellow text-xs font-semibold">Target: {target}</p>
                <p className="text-dark-300 text-[10px]">Need {remaining} off {ballsLeft} • RRR {reqRate}</p>
              </div>
            )}
            {!target && match.currentInnings === 0 && (
              <p className="text-dark-400 text-xs">{match.totalOvers} overs match</p>
            )}
          </div>
          <button onClick={() => setShowMenu(true)} className="btn-press w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center text-dark-300">
            ⋮
          </button>
        </div>
      </div>

      {/* Batters & Bowler Info */}
      <div className="shrink-0 px-4 py-2 bg-dark-800/50 space-y-1.5">
        {/* Striker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-accent text-xs">●</span>
            <span className="text-white text-sm font-semibold">{currentStrikerId ? getPlayerName(currentStrikerId) : 'Select Batter'}</span>
          </div>
          <span className="text-white text-sm font-mono font-bold">
            {striker ? `${striker.runs}(${striker.balls})` : '-'}
            {striker && <span className="text-dark-400 text-[10px] ml-1">{striker.fours}×4 {striker.sixes}×6</span>}
          </span>
        </div>
        {/* Non-striker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-dark-400 text-xs">○</span>
            <span className="text-dark-300 text-sm">{currentNonStrikerId ? getPlayerName(currentNonStrikerId) : 'Select Batter'}</span>
          </div>
          <span className="text-dark-300 text-sm font-mono">
            {nonStriker ? `${nonStriker.runs}(${nonStriker.balls})` : '-'}
          </span>
        </div>
        {/* Bowler */}
        <div className="flex items-center justify-between pt-1 border-t border-dark-700">
          <div className="flex items-center gap-2">
            <span className="text-cric-red text-xs">◆</span>
            <span className="text-dark-300 text-sm">{currentBowlerId ? getPlayerName(currentBowlerId) : 'Select Bowler'}</span>
          </div>
          <span className="text-dark-300 text-sm font-mono">
            {bowler ? `${bowler.overs}.${bowler.balls % 6}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}` : '-'}
          </span>
        </div>
      </div>

      {/* Ball Timeline */}
      <div className="shrink-0 px-4 py-2 border-t border-b border-dark-700 bg-dark-800/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-dark-400 text-[10px] font-medium">OVER {inn.totalOvers + 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setShowScorecardTab('live')} className={`text-[10px] font-medium px-2 py-0.5 rounded ${showScorecardTab === 'live' ? 'bg-accent text-white' : 'text-dark-400'}`}>Live</button>
            <button onClick={() => setShowScorecardTab('scorecard')} className={`text-[10px] font-medium px-2 py-0.5 rounded ${showScorecardTab === 'scorecard' ? 'bg-accent text-white' : 'text-dark-400'}`}>Card</button>
          </div>
        </div>
        {showScorecardTab === 'live' && renderBallTimeline()}
        {showScorecardTab === 'scorecard' && (
          <MiniScorecard inn={inn} getPlayerName={getPlayerName} />
        )}
      </div>

      {/* Scoring Controls - Scrollable area */}
      <div className="flex-1 overflow-y-auto scrollable px-3 py-3">
        {/* Select batter/bowler prompts */}
        {needBatter && (
          <div className="mb-3 animate-fadeIn">
            <div className="bg-cric-blue/10 border border-cric-blue/30 rounded-xl p-3 text-center">
              <p className="text-cric-blue text-sm font-semibold mb-2">
                {!currentStrikerId ? 'Select Striker' : 'Select Non-Striker'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableBatters.map(id => (
                  <button
                    key={id}
                    onClick={() => {
                      if (!currentStrikerId) setCurrentBatters(id, currentNonStrikerId || '');
                      else setCurrentBatters(currentStrikerId, id);
                    }}
                    className="btn-press px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-xs font-medium"
                  >
                    {getPlayerName(id)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {needBowler && !needBatter && (
          <div className="mb-3 animate-fadeIn">
            <div className="bg-cric-red/10 border border-cric-red/30 rounded-xl p-3 text-center">
              <p className="text-cric-red text-sm font-semibold mb-2">Select Bowler</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableBowlers.map(id => (
                  <button
                    key={id}
                    onClick={() => setCurrentBowler(id)}
                    className="btn-press px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-xs font-medium"
                  >
                    {getPlayerName(id)}
                    {inn.bowlers.find(b => b.playerId === id) && (
                      <span className="text-dark-400 ml-1">({inn.bowlers.find(b => b.playerId === id)?.overs}ov)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Run Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[0, 1, 2, 3].map(r => (
            <button
              key={r}
              onClick={() => handleScore(r)}
              disabled={needBatter || needBowler}
              className={`btn-press py-5 rounded-xl text-2xl font-bold transition-all disabled:opacity-30
                ${r === 0 ? 'bg-dark-700 text-dark-300 border border-dark-600' : 'bg-dark-700 text-white border border-dark-600 active:bg-accent/20'}
              `}
            >
              {r === 0 ? '•' : r}
            </button>
          ))}
        </div>

        {/* Boundary buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => handleScore(4)}
            disabled={needBatter || needBowler}
            className="btn-press py-4 rounded-xl text-xl font-bold bg-gradient-to-br from-cric-blue to-cric-blue/70 text-white disabled:opacity-30 shadow-lg shadow-cric-blue/20"
          >
            4
          </button>
          <button
            onClick={() => handleScore(5)}
            disabled={needBatter || needBowler}
            className="btn-press py-4 rounded-xl text-xl font-bold bg-dark-700 text-white border border-dark-600 disabled:opacity-30"
          >
            5
          </button>
          <button
            onClick={() => handleScore(6)}
            disabled={needBatter || needBowler}
            className="btn-press py-4 rounded-xl text-xl font-bold bg-gradient-to-br from-six to-yellow-600 text-white disabled:opacity-30 shadow-lg shadow-six/20"
          >
            6
          </button>
        </div>

        {/* Extras & Wicket Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setShowExtrasPanel(true)}
            disabled={needBatter || needBowler}
            className="btn-press py-3 rounded-xl text-sm font-bold bg-extra/20 text-extra border border-extra/30 disabled:opacity-30"
          >
            Extras
          </button>
          <button
            onClick={() => setShowWicketPanel(true)}
            disabled={needBatter || needBowler}
            className="btn-press py-3 rounded-xl text-sm font-bold bg-wicket/20 text-wicket border border-wicket/30 disabled:opacity-30"
          >
            🔴 Wicket
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={undoLastBall}
            disabled={inn.balls.length === 0}
            className="btn-press flex-1 py-2.5 rounded-xl text-xs font-semibold bg-dark-700 border border-dark-600 text-dark-300 disabled:opacity-30"
          >
            ↩ Undo
          </button>
          <button
            onClick={swapStrike}
            disabled={needBatter}
            className="btn-press flex-1 py-2.5 rounded-xl text-xs font-semibold bg-dark-700 border border-dark-600 text-dark-300 disabled:opacity-30"
          >
            ⇄ Swap
          </button>
          <button
            onClick={() => setShowBowlerSelect(true)}
            className="btn-press flex-1 py-2.5 rounded-xl text-xs font-semibold bg-dark-700 border border-dark-600 text-dark-300"
          >
            🎯 Bowler
          </button>
        </div>
      </div>

      {/* Extras Modal */}
      <Modal isOpen={showExtrasPanel} onClose={() => setShowExtrasPanel(false)} title="Extras">
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { type: 'wide' as ExtraType, label: 'Wide', icon: 'Wd', color: 'bg-extra' },
            { type: 'no_ball' as ExtraType, label: 'No Ball', icon: 'Nb', color: 'bg-cric-red' },
            { type: 'bye' as ExtraType, label: 'Bye', icon: 'B', color: 'bg-cric-purple' },
            { type: 'leg_bye' as ExtraType, label: 'Leg Bye', icon: 'Lb', color: 'bg-cric-cyan' },
          ].map(extra => (
            <button
              key={extra.type}
              onClick={() => handleExtra(extra.type)}
              className={`btn-press ${extra.color}/20 border border-white/10 rounded-xl py-5 text-center`}
            >
              <p className="text-white font-bold text-lg">{extra.icon}</p>
              <p className="text-dark-300 text-xs mt-1">{extra.label}</p>
            </button>
          ))}
          <div className="col-span-2 mt-2">
            <p className="text-dark-300 text-xs mb-2">Wide/No Ball + Runs</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => { scoreBall(0, { type: 'wide', runs: r }, null); setShowExtrasPanel(false); }}
                  className="btn-press py-2 bg-dark-700 rounded-lg text-white text-sm font-mono">Wd+{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => { scoreBall(r, { type: 'no_ball', runs: 0 }, null); setShowExtrasPanel(false); }}
                  className="btn-press py-2 bg-dark-700 rounded-lg text-white text-sm font-mono">Nb+{r}</button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Wicket Modal */}
      <Modal isOpen={showWicketPanel} onClose={() => setShowWicketPanel(false)} title="Wicket">
        <div className="p-4">
          <div className="mb-4">
            <p className="text-dark-300 text-xs mb-2">Runs scored before wicket</p>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(r => (
                <button key={r} onClick={() => setWicketRuns(r)}
                  className={`btn-press flex-1 py-2 rounded-lg text-sm font-bold ${wicketRuns === r ? 'bg-accent text-white' : 'bg-dark-700 text-dark-300'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'bowled' as WicketType, label: 'Bowled', icon: '🏏' },
              { type: 'caught' as WicketType, label: 'Caught', icon: '🧤' },
              { type: 'lbw' as WicketType, label: 'LBW', icon: '🦵' },
              { type: 'run_out' as WicketType, label: 'Run Out', icon: '🏃' },
              { type: 'stumped' as WicketType, label: 'Stumped', icon: '🥅' },
              { type: 'hit_wicket' as WicketType, label: 'Hit Wicket', icon: '💥' },
              { type: 'retired_hurt' as WicketType, label: 'Retired Hurt', icon: '🤕' },
            ].map(w => (
              <button
                key={w.type}
                onClick={() => {
                  if (w.type === 'run_out') {
                    // For run out, let them pick who's dismissed
                    const who = confirm(`Is the STRIKER (${getPlayerName(currentStrikerId!)}) out?\n\nOK = Striker out\nCancel = Non-striker out`);
                    handleWicket(w.type, who ? currentStrikerId! : currentNonStrikerId!);
                  } else {
                    handleWicket(w.type);
                  }
                }}
                className="btn-press bg-wicket/10 border border-wicket/20 rounded-xl py-4 text-center"
              >
                <p className="text-2xl">{w.icon}</p>
                <p className="text-white text-sm font-semibold mt-1">{w.label}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Change Bowler Modal */}
      <Modal isOpen={showBowlerSelect} onClose={() => setShowBowlerSelect(false)} title="Change Bowler">
        <div className="p-4 space-y-2">
          {availableBowlers.map(id => {
            const b = inn.bowlers.find(bo => bo.playerId === id);
            return (
              <button
                key={id}
                onClick={() => { setCurrentBowler(id); setShowBowlerSelect(false); }}
                className={`btn-press w-full p-3 rounded-xl text-left flex items-center justify-between
                  ${id === currentBowlerId ? 'bg-accent/10 border border-accent/30' : 'bg-dark-700 border border-dark-600'}`}
              >
                <span className="text-white text-sm font-medium">{getPlayerName(id)}</span>
                {b && <span className="text-dark-300 text-xs font-mono">{b.overs}.{b.balls % 6}-{b.runs}-{b.wickets}</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Menu Modal */}
      <Modal isOpen={showMenu} onClose={() => setShowMenu(false)} title="Match Menu">
        <div className="p-4 space-y-2">
          <button onClick={() => { pauseMatch(); setShowMenu(false); setScreen('home'); }}
            className="btn-press w-full p-3 bg-dark-700 rounded-xl text-left text-white text-sm font-medium">
            ⏸️ Pause & Exit
          </button>
          <button onClick={() => { setShowMenu(false); setShowEndInnings(true); }}
            className="btn-press w-full p-3 bg-dark-700 rounded-xl text-left text-white text-sm font-medium">
            🔄 End Innings
          </button>
          <button onClick={() => { setShowMenu(false); setShowCompleteMatch(true); }}
            className="btn-press w-full p-3 bg-dark-700 rounded-xl text-left text-white text-sm font-medium">
            ✅ Complete Match
          </button>
          <button onClick={swapStrike}
            className="btn-press w-full p-3 bg-dark-700 rounded-xl text-left text-white text-sm font-medium">
            ⇄ Swap Strike
          </button>
          <button onClick={() => { setShowMenu(false); setShowBatterSelect(true); }}
            className="btn-press w-full p-3 bg-dark-700 rounded-xl text-left text-white text-sm font-medium">
            🏏 Change Batter
          </button>
        </div>
      </Modal>

      {/* End Innings Dialog */}
      <Modal isOpen={showEndInnings} onClose={() => setShowEndInnings(false)} title="End Innings">
        <div className="p-4 text-center">
          <p className="text-white text-lg font-bold mb-2">
            {battingTeam.name}: {inn.totalRuns}/{inn.totalWickets}
          </p>
          <p className="text-dark-300 text-sm mb-4">({currentOverStr} overs)</p>
          <button
            onClick={() => { completeInnings(); setShowEndInnings(false); }}
            className="btn-press w-full py-3 bg-accent rounded-xl text-white font-bold"
          >
            Start 2nd Innings
          </button>
        </div>
      </Modal>

      {/* Complete Match Dialog */}
      <MatchCompleteDialog
        isOpen={showCompleteMatch}
        onClose={() => setShowCompleteMatch(false)}
        match={match}
      />

      {/* Wagon Wheel */}
      <WagonWheelModal
        isOpen={showWagonWheel}
        onClose={() => { handleWagonWheelSelect(undefined); }}
        onSelectZone={(zone) => handleWagonWheelSelect(zone)}
      />
    </div>
  );
}

function MiniScorecard({ inn, getPlayerName }: { inn: any; getPlayerName: (id: string) => string }) {
  return (
    <div className="max-h-36 overflow-y-auto scrollable text-xs">
      {inn.batters.map((b: any) => (
        <div key={b.playerId} className="flex items-center justify-between py-1 border-b border-dark-700">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className={`truncate ${b.isOut ? 'text-dark-400' : 'text-white font-medium'}`}>{getPlayerName(b.playerId)}</span>
            {!b.isOut && !b.isRetired && <span className="text-accent text-[8px]">●</span>}
          </div>
          <span className="text-white font-mono font-medium ml-2">{b.runs}<span className="text-dark-400">({b.balls})</span></span>
        </div>
      ))}
    </div>
  );
}

function MatchCompleteDialog({ isOpen, onClose, match }: {
  isOpen: boolean; onClose: () => void; match: any;
}) {
  const { completeMatch } = useStore();
  const [result, setResult] = useState('');

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const teamA = match.teamA;
  const teamB = match.teamB;

  const battingFirstTeam = inn1?.battingTeamId === teamA.id ? teamA : teamB;
  const battingSecondTeam = inn2?.battingTeamId === teamA.id ? teamA : teamB;

  // Auto-generate result
  const autoResult = (() => {
    if (!inn1 || !inn2) return '';
    if (inn1.totalRuns > inn2.totalRuns) {
      return `${battingFirstTeam.name} won by ${inn1.totalRuns - inn2.totalRuns} runs`;
    } else if (inn2.totalRuns > inn1.totalRuns) {
      const wicketsLeft = (match.playingXIA.length > match.playingXIB.length ? match.playingXIA.length : match.playingXIB.length) - 1 - inn2.totalWickets;
      return `${battingSecondTeam.name} won by ${wicketsLeft} wickets`;
    }
    return 'Match Tied';
  })();

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Match">
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🏆</div>
          {inn1 && (
            <p className="text-white font-bold">
              {battingFirstTeam.shortName} {inn1.totalRuns}/{inn1.totalWickets}
              {inn2 && <> vs {battingSecondTeam.shortName} {inn2.totalRuns}/{inn2.totalWickets}</>}
            </p>
          )}
        </div>

        <div className="mb-3">
          <label className="text-dark-300 text-xs mb-1 block">Result</label>
          <input
            value={result || autoResult}
            onChange={e => setResult(e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <button
          onClick={() => { completeMatch(result || autoResult); onClose(); }}
          className="btn-press w-full py-3 bg-gradient-to-r from-accent-dark to-accent rounded-xl text-white font-bold"
        >
          Complete Match
        </button>
      </div>
    </Modal>
  );
}
