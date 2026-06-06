import { useState } from 'react';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import { WagonWheelDisplay } from '../components/WagonWheelModal';
import type { MatchAward, BallEvent } from '../types';

export default function MatchSummaryScreen() {
  const { currentMatch, setScreen } = useStore();
  const [tab, setTab] = useState<'summary' | 'scorecard' | 'awards' | 'wagon'>('summary');

  if (!currentMatch) return null;
  const match = currentMatch;

  const getPlayerName = (id: string): string => {
    const all = [...match.teamA.players, ...match.teamB.players];
    return all.find(p => p.id === id)?.name || '?';
  };

  const getTeamName = (id: string): string => {
    return id === match.teamA.id ? match.teamA.name : match.teamB.name;
  };

  const renderAwardCard = (award: MatchAward) => (
    <div className="bg-gradient-to-br from-dark-700 to-dark-800 border border-dark-600 rounded-xl p-4 text-center animate-scaleIn">
      <div className="text-3xl mb-1">{award.icon}</div>
      <p className="text-cric-yellow text-xs font-bold uppercase">{award.title}</p>
      <p className="text-white font-bold text-lg mt-1">{award.playerName}</p>
      <p className="text-dark-300 text-xs">{award.teamName}</p>
      <p className="text-accent text-sm font-mono mt-1">{award.stat}</p>
    </div>
  );

  const getWicketText = (type?: string) => {
    if (!type) return '';
    const map: Record<string, string> = {
      bowled: 'b', caught: 'c', lbw: 'lbw', run_out: 'run out',
      stumped: 'st', hit_wicket: 'hit wkt', retired_hurt: 'retired',
    };
    return map[type] || type;
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <Header title="Match Summary" showBack onBack={() => setScreen('home')} />

      {/* Result banner */}
      <div className="shrink-0 bg-gradient-to-r from-accent-dark/30 to-cric-blue/20 border-b border-dark-600 px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-white text-xs font-bold" style={{ background: match.teamA.color }}>
              {match.teamA.shortName.substring(0, 2)}
            </div>
            <p className="text-white text-xs font-semibold mt-1">{match.teamA.shortName}</p>
            {match.innings[0] && (
              <p className="text-white font-mono font-bold text-lg">
                {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
              </p>
            )}
          </div>
          <span className="text-dark-400 font-bold text-sm">VS</span>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-white text-xs font-bold" style={{ background: match.teamB.color }}>
              {match.teamB.shortName.substring(0, 2)}
            </div>
            <p className="text-white text-xs font-semibold mt-1">{match.teamB.shortName}</p>
            {match.innings[1] && (
              <p className="text-white font-mono font-bold text-lg">
                {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
              </p>
            )}
          </div>
        </div>
        {match.result && (
          <p className="text-accent font-semibold text-sm">{match.result}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 shrink-0 bg-dark-800 border-b border-dark-700">
        {(['summary', 'scorecard', 'awards', 'wagon'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn-press flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all
              ${tab === t ? 'bg-accent text-white' : 'text-dark-300'}`}
          >
            {t === 'wagon' ? '🎯' : ''} {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-4">
        {tab === 'summary' && (
          <div className="space-y-4 animate-fadeIn">
            {match.innings.map((inn, idx) => {
              const teamName = getTeamName(inn.battingTeamId);
              return (
                <div key={idx} className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold text-sm">{teamName} Innings</p>
                    <p className="text-white font-mono font-bold">{inn.totalRuns}/{inn.totalWickets} <span className="text-dark-300 text-xs">({inn.totalOvers}.{inn.currentOverBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'no_ball').length} ov)</span></p>
                  </div>
                  
                  {/* Top batters */}
                  <div className="space-y-1 mb-3">
                    {[...inn.batters].sort((a, b) => b.runs - a.runs).slice(0, 3).map(bat => (
                      <div key={bat.playerId} className="flex items-center justify-between text-xs">
                        <span className={`${bat.isOut ? 'text-dark-400' : 'text-white'}`}>{getPlayerName(bat.playerId)}</span>
                        <span className="text-white font-mono">{bat.runs}({bat.balls})</span>
                      </div>
                    ))}
                  </div>

                  {/* Extras */}
                  <p className="text-dark-400 text-[10px]">
                    Extras: {inn.extras.total} (Wd {inn.extras.wides}, Nb {inn.extras.noBalls}, B {inn.extras.byes}, Lb {inn.extras.legByes})
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'scorecard' && (
          <div className="space-y-4 animate-fadeIn">
            {match.innings.map((inn, idx) => (
              <div key={idx} className="bg-dark-800 border border-dark-600 rounded-xl p-4">
                <p className="text-white font-bold text-sm mb-3">{getTeamName(inn.battingTeamId)} - {inn.totalRuns}/{inn.totalWickets}</p>
                
                {/* Batting */}
                <div className="mb-4">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 text-[10px] text-dark-400 font-medium mb-1 px-1">
                    <span>Batter</span><span>R</span><span>B</span><span>4s</span><span>6s</span>
                  </div>
                  {inn.batters.map(bat => (
                    <div key={bat.playerId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 py-1.5 border-b border-dark-700 items-center px-1">
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${bat.isOut ? 'text-dark-400' : 'text-white'}`}>
                          {getPlayerName(bat.playerId)}
                          {!bat.isOut && !bat.isRetired && <span className="text-accent ml-1">*</span>}
                        </p>
                        {bat.isOut && (
                          <p className="text-dark-500 text-[9px] truncate">
                            {getWicketText(bat.dismissalType)}
                            {bat.dismissalBowlerId && bat.dismissalType !== 'run_out' ? ` ${getPlayerName(bat.dismissalBowlerId)}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="text-white text-xs font-mono font-bold w-6 text-right">{bat.runs}</span>
                      <span className="text-dark-300 text-xs font-mono w-6 text-right">{bat.balls}</span>
                      <span className="text-four text-xs font-mono w-5 text-right">{bat.fours}</span>
                      <span className="text-six text-xs font-mono w-5 text-right">{bat.sixes}</span>
                    </div>
                  ))}
                </div>

                {/* Bowling */}
                <p className="text-dark-300 text-[10px] font-medium mb-1">BOWLING</p>
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 text-[10px] text-dark-400 font-medium mb-1 px-1">
                  <span>Bowler</span><span>O</span><span>R</span><span>W</span><span>Eco</span>
                </div>
                {inn.bowlers.map(bowl => (
                  <div key={bowl.playerId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 py-1.5 border-b border-dark-700 px-1">
                    <span className="text-white text-xs font-medium truncate">{getPlayerName(bowl.playerId)}</span>
                    <span className="text-dark-300 text-xs font-mono w-6 text-right">{bowl.overs}.{bowl.balls % 6}</span>
                    <span className="text-dark-300 text-xs font-mono w-6 text-right">{bowl.runs}</span>
                    <span className="text-wicket text-xs font-mono font-bold w-5 text-right">{bowl.wickets}</span>
                    <span className="text-dark-400 text-xs font-mono w-8 text-right">{bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(1) : '-'}</span>
                  </div>
                ))}

                <p className="text-dark-400 text-[10px] mt-2">
                  Extras: {inn.extras.total} (Wd {inn.extras.wides}, Nb {inn.extras.noBalls}, B {inn.extras.byes}, Lb {inn.extras.legByes})
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'awards' && match.awards && (
          <div className="space-y-3 animate-fadeIn">
            {/* MVP Card - Highlighted */}
            <div className="bg-gradient-to-br from-cric-yellow/20 to-cric-orange/10 border-2 border-cric-yellow/30 rounded-2xl p-5 text-center animate-scaleIn">
              <div className="text-5xl mb-2">{match.awards.manOfTheMatch.icon}</div>
              <p className="text-cric-yellow text-sm font-bold uppercase tracking-wider">Man of the Match</p>
              <p className="text-white font-black text-2xl mt-1">{match.awards.manOfTheMatch.playerName}</p>
              <p className="text-dark-300 text-sm">{match.awards.manOfTheMatch.teamName}</p>
              <p className="text-accent text-sm font-mono mt-1">{match.awards.manOfTheMatch.stat}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {renderAwardCard(match.awards.highestRuns)}
              {renderAwardCard(match.awards.bestBowler)}
              {renderAwardCard(match.awards.bestStrikeRate)}
              {renderAwardCard(match.awards.bestEconomy)}
              {renderAwardCard(match.awards.bestFielder)}
            </div>
          </div>
        )}

        {tab === 'wagon' && (
          <div className="animate-fadeIn">
            <p className="text-white font-bold text-sm text-center mb-4">Wagon Wheel</p>
            {match.innings.map((inn, idx) => {
              const ballsWithZone = inn.balls.filter((b: BallEvent) => b.shotZone !== undefined);
              if (ballsWithZone.length === 0) return (
                <div key={idx} className="text-center text-dark-400 text-sm py-8">
                  No wagon wheel data for {getTeamName(inn.battingTeamId)}
                </div>
              );
              return (
                <div key={idx} className="mb-6">
                  <p className="text-dark-300 text-xs text-center mb-2">{getTeamName(inn.battingTeamId)} Innings</p>
                  <WagonWheelDisplay balls={ballsWithZone} />
                </div>
              );
            })}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
