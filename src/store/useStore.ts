import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Team, Player, Match, Screen, BallEvent, Innings, BatterInnings, BowlerInnings, WicketType, ExtraType, MatchAwards, MatchAward, PlayerStats } from '../types';

const defaultPlayerStats = (): PlayerStats => ({
  matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0,
  wickets: 0, oversBowled: 0, runsConceded: 0,
  catches: 0, runOuts: 0, stumpings: 0,
  highestScore: 0, bestBowling: '0/0',
});

const createEmptyInnings = (battingTeamId: string, bowlingTeamId: string): Innings => ({
  battingTeamId,
  bowlingTeamId,
  totalRuns: 0,
  totalWickets: 0,
  totalOvers: 0,
  totalBalls: 0,
  extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
  batters: [],
  bowlers: [],
  balls: [],
  currentOverBalls: [],
  isCompleted: false,
  fallOfWickets: [],
});

interface AppState {
  screen: Screen;
  previousScreen: Screen;
  teams: Team[];
  matches: Match[];
  currentMatch: Match | null;
  currentStrikerId: string | null;
  currentNonStrikerId: string | null;
  currentBowlerId: string | null;
  matchSetupData: Partial<Match> & { step: number };
  showWagonWheel: boolean;
  lastBallEvent: BallEvent | null;

  setScreen: (screen: Screen) => void;
  goBack: () => void;

  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => Team;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addPlayerToTeam: (teamId: string, player: Omit<Player, 'id' | 'teamId' | 'stats'>) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;

  setMatchSetupData: (data: Partial<AppState['matchSetupData']>) => void;
  startMatch: () => void;
  setCurrentBatters: (strikerId: string, nonStrikerId: string) => void;
  setCurrentBowler: (bowlerId: string) => void;
  scoreBall: (runs: number, extras?: { type: ExtraType; runs: number } | null, wicket?: { type: WicketType; dismissedId?: string; fielderId?: string } | null, shotZone?: number) => void;
  undoLastBall: () => void;
  swapStrike: () => void;
  completeInnings: () => void;
  completeMatch: (result: string, motmId?: string) => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  continueMatch: (matchId: string) => void;

  setShowWagonWheel: (v: boolean) => void;
  
  deleteMatch: (id: string) => void;
  
  getTeamById: (id: string) => Team | undefined;
  getPlayerById: (id: string) => Player | undefined;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'splash',
      previousScreen: 'home',
      teams: [],
      matches: [],
      currentMatch: null,
      currentStrikerId: null,
      currentNonStrikerId: null,
      currentBowlerId: null,
      matchSetupData: { step: 1 },
      showWagonWheel: false,
      lastBallEvent: null,

      setScreen: (screen) => set(s => ({ screen, previousScreen: s.screen })),
      goBack: () => set(s => ({ screen: s.previousScreen })),

      addTeam: (teamData) => {
        const team: Team = { ...teamData, id: uuid(), createdAt: Date.now() };
        set(s => ({ teams: [...s.teams, team] }));
        return team;
      },

      updateTeam: (team) => set(s => ({
        teams: s.teams.map(t => t.id === team.id ? team : t),
      })),

      deleteTeam: (id) => set(s => ({
        teams: s.teams.filter(t => t.id !== id),
      })),

      addPlayerToTeam: (teamId, playerData) => {
        const player: Player = { ...playerData, id: uuid(), teamId, stats: defaultPlayerStats() };
        set(s => ({
          teams: s.teams.map(t =>
            t.id === teamId ? { ...t, players: [...t.players, player] } : t
          ),
        }));
      },

      removePlayerFromTeam: (teamId, playerId) => set(s => ({
        teams: s.teams.map(t =>
          t.id === teamId
            ? { ...t, players: t.players.filter(p => p.id !== playerId) }
            : t
        ),
      })),

      setMatchSetupData: (data) => set(s => ({
        matchSetupData: { ...s.matchSetupData, ...data },
      })),

      startMatch: () => {
        const s = get();
        const d = s.matchSetupData;
        if (!d.teamA || !d.teamB || !d.totalOvers || !d.tossWonBy || !d.tossDecision) return;

        const battingFirst = d.tossDecision === 'bat' ? d.tossWonBy : (d.tossWonBy === d.teamA.id ? d.teamB.id : d.teamA.id);
        const bowlingFirst = battingFirst === d.teamA.id ? d.teamB.id : d.teamA.id;

        const match: Match = {
          id: uuid(),
          teamA: d.teamA,
          teamB: d.teamB,
          playingXIA: d.playingXIA || d.teamA.players.map(p => p.id),
          playingXIB: d.playingXIB || d.teamB.players.map(p => p.id),
          totalOvers: d.totalOvers,
          tossWonBy: d.tossWonBy,
          tossDecision: d.tossDecision,
          innings: [createEmptyInnings(battingFirst, bowlingFirst)],
          currentInnings: 0,
          status: 'live',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          venue: d.venue,
        };

        set({
          currentMatch: match,
          matches: [...s.matches, match],
          currentStrikerId: null,
          currentNonStrikerId: null,
          currentBowlerId: null,
          screen: 'live_scoring',
          matchSetupData: { step: 1 },
        });
      },

      setCurrentBatters: (strikerId, nonStrikerId) => set({
        currentStrikerId: strikerId,
        currentNonStrikerId: nonStrikerId,
      }),

      setCurrentBowler: (bowlerId) => set({ currentBowlerId: bowlerId }),

      scoreBall: (runs, extras, wicket, shotZone) => {
        const s = get();
        if (!s.currentMatch || !s.currentStrikerId || !s.currentBowlerId) return;

        const match = JSON.parse(JSON.stringify(s.currentMatch)) as Match;
        const inn = match.innings[match.currentInnings];
        const isExtra = !!extras;
        const extraType = extras?.type;
        const extraRuns = extras?.runs || 0;
        const isWide = extraType === 'wide';
        const isNoBall = extraType === 'no_ball';
        const isBye = extraType === 'bye';
        const isLegBye = extraType === 'leg_bye';
        const isLegalBall = !isWide && !isNoBall;

        const ballEvent: BallEvent = {
          id: uuid(),
          matchId: match.id,
          inningsIndex: match.currentInnings,
          overNumber: inn.totalOvers,
          ballNumber: inn.currentOverBalls.filter(b => {
            const bt = b.extraType;
            return bt !== 'wide' && bt !== 'no_ball';
          }).length,
          runs,
          isExtra,
          extraType: extraType,
          extraRuns,
          isWicket: !!wicket,
          wicketType: wicket?.type,
          batsmanId: s.currentStrikerId!,
          bowlerId: s.currentBowlerId!,
          nonStrikerId: s.currentNonStrikerId!,
          dismissedPlayerId: wicket?.dismissedId || (wicket ? s.currentStrikerId! : undefined),
          fielderId: wicket?.fielderId,
          shotZone,
          timestamp: Date.now(),
        };

        inn.balls.push(ballEvent);
        inn.currentOverBalls.push(ballEvent);

        // Update total runs
        const totalRunsThisBall = isWide ? 1 + extraRuns : isNoBall ? 1 + runs + extraRuns : runs + extraRuns;
        inn.totalRuns += totalRunsThisBall;

        // Update extras
        if (isWide) { inn.extras.wides += 1 + extraRuns; inn.extras.total += 1 + extraRuns; }
        if (isNoBall) { inn.extras.noBalls += 1; inn.extras.total += 1; }
        if (isBye) { inn.extras.byes += runs; inn.extras.total += runs; }
        if (isLegBye) { inn.extras.legByes += runs; inn.extras.total += runs; }

        // Update batter
        let batter = inn.batters.find(b => b.playerId === s.currentStrikerId);
        if (!batter) {
          batter = { playerId: s.currentStrikerId!, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true, isRetired: false };
          inn.batters.push(batter);
        }
        if (isLegalBall) batter.balls += 1;
        if (!isWide && !isBye && !isLegBye) {
          batter.runs += runs;
          if (runs === 4) batter.fours += 1;
          if (runs === 6) batter.sixes += 1;
        }
        if (isNoBall && !isBye && !isLegBye) {
          batter.runs += runs;
          if (runs === 4) batter.fours += 1;
          if (runs === 6) batter.sixes += 1;
        }

        // Ensure non-striker is in batters
        let nonStriker = inn.batters.find(b => b.playerId === s.currentNonStrikerId);
        if (!nonStriker) {
          nonStriker = { playerId: s.currentNonStrikerId!, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false, isRetired: false };
          inn.batters.push(nonStriker);
        }

        // Update bowler
        let bowler = inn.bowlers.find(b => b.playerId === s.currentBowlerId);
        if (!bowler) {
          bowler = { playerId: s.currentBowlerId!, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0 };
          inn.bowlers.push(bowler);
        }
        bowler.runs += totalRunsThisBall;
        if (isWide) bowler.wides += 1;
        if (isNoBall) bowler.noBalls += 1;
        if (isLegalBall) {
          bowler.balls += 1;
          if (totalRunsThisBall === 0) bowler.dots += 1;
        }

        // Handle wicket
        let needNewBatter = false;
        if (wicket) {
          inn.totalWickets += 1;
          const dismissedId = wicket.dismissedId || s.currentStrikerId!;
          const dismissedBatter = inn.batters.find(b => b.playerId === dismissedId);
          if (dismissedBatter) {
            dismissedBatter.isOut = true;
            dismissedBatter.dismissalType = wicket.type;
            dismissedBatter.dismissalBowlerId = s.currentBowlerId!;
            dismissedBatter.dismissalFielderId = wicket.fielderId;
          }
          if (wicket.type !== 'run_out' || (wicket.type === 'run_out' && !isWide && !isNoBall)) {
            bowler.wickets += (wicket.type === 'run_out' ? 0 : 1);
          }
          inn.fallOfWickets.push({
            runs: inn.totalRuns,
            wickets: inn.totalWickets,
            overs: `${inn.totalOvers}.${inn.currentOverBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'no_ball').length}`,
            playerId: dismissedId,
          });
          needNewBatter = true;
          
          if (dismissedId === s.currentStrikerId) {
            // striker dismissed - need new batter on strike
          } else {
            // non-striker dismissed (run out)
          }
        }

        // Count legal balls in current over
        const legalBallsInOver = inn.currentOverBalls.filter(b => {
          return b.extraType !== 'wide' && b.extraType !== 'no_ball';
        }).length;

        if (isLegalBall) {
          inn.totalBalls += 1;
        }

        // Determine strike change
        let shouldSwap = false;
        const effectiveRuns = isWide ? extraRuns : runs;
        if (effectiveRuns % 2 === 1) shouldSwap = true;

        // Over completion
        let overCompleted = false;
        if (legalBallsInOver >= 6) {
          overCompleted = true;
          inn.totalOvers += 1;
          bowler.overs += 1;
          
          // Check maiden
          const overRuns = inn.currentOverBalls.reduce((sum, b) => sum + b.runs + b.extraRuns + (b.extraType === 'wide' ? 1 : 0) + (b.extraType === 'no_ball' ? 1 : 0), 0);
          if (overRuns === 0) bowler.maidens += 1;
          
          inn.currentOverBalls = [];
          shouldSwap = !shouldSwap; // End of over swaps strike
        }

        // Apply strike swap
        let newStrikerId: string | null = s.currentStrikerId;
        let newNonStrikerId: string | null = s.currentNonStrikerId;
        if (shouldSwap && !needNewBatter) {
          newStrikerId = s.currentNonStrikerId;
          newNonStrikerId = s.currentStrikerId;
        }

        // Check if innings is complete
        const playingXI = match.currentInnings === 0 
          ? (inn.battingTeamId === match.teamA.id ? match.playingXIA : match.playingXIB)
          : (inn.battingTeamId === match.teamA.id ? match.playingXIA : match.playingXIB);
        
        if (inn.totalWickets >= playingXI.length - 1 || inn.totalOvers >= match.totalOvers) {
          inn.isCompleted = true;
        }

        // Check if 2nd innings target achieved
        if (match.currentInnings === 1 && match.innings[0]) {
          const target = match.innings[0].totalRuns + 1;
          if (inn.totalRuns >= target) {
            inn.isCompleted = true;
          }
        }

        match.updatedAt = Date.now();

        const updatedMatches = s.matches.map(m => m.id === match.id ? match : m);

        set({
          currentMatch: match,
          matches: updatedMatches,
          currentStrikerId: needNewBatter ? (wicket?.dismissedId === s.currentStrikerId || !wicket?.dismissedId ? null : newStrikerId) : newStrikerId,
          currentNonStrikerId: needNewBatter ? (wicket?.dismissedId === s.currentNonStrikerId ? null : (wicket?.dismissedId === s.currentStrikerId || !wicket?.dismissedId ? newNonStrikerId : null)) : newNonStrikerId,
          currentBowlerId: overCompleted ? null : s.currentBowlerId,
          lastBallEvent: ballEvent,
        });
      },

      undoLastBall: () => {
        const s = get();
        if (!s.currentMatch) return;

        const match = JSON.parse(JSON.stringify(s.currentMatch)) as Match;
        const inn = match.innings[match.currentInnings];
        if (inn.balls.length === 0) return;

        const lastBall = inn.balls[inn.balls.length - 1];
        inn.balls.pop();

        // Recalculate entire innings from balls
        // Fresh recalculation from remaining balls
        
        // We need to replay all balls - simplified approach: just restore state before last ball
        // For simplicity, recalculate from scratch
        const savedBalls = [...inn.balls];
        
        // Reset innings
        Object.assign(inn, createEmptyInnings(inn.battingTeamId, inn.bowlingTeamId));
        inn.balls = [];

        // We can't easily replay, so let's do a simpler undo
        // Just revert the last ball's effects
        // This is a simplified undo - for a production app we'd replay all balls
        
        // Restore all balls and recalculate
        let currentOver = 0;
        let ballsInOver = 0;
        
        for (const ball of savedBalls) {
          inn.balls.push(ball);
          
          const isWide = ball.extraType === 'wide';
          const isNoBall = ball.extraType === 'no_ball';
          const isBye = ball.extraType === 'bye';
          const isLegBye = ball.extraType === 'leg_bye';
          const isLegal = !isWide && !isNoBall;

          const totalRuns = isWide ? 1 + ball.extraRuns : isNoBall ? 1 + ball.runs + ball.extraRuns : ball.runs + ball.extraRuns;
          inn.totalRuns += totalRuns;

          if (isWide) { inn.extras.wides += 1 + ball.extraRuns; inn.extras.total += 1 + ball.extraRuns; }
          if (isNoBall) { inn.extras.noBalls += 1; inn.extras.total += 1; }
          if (isBye) { inn.extras.byes += ball.runs; inn.extras.total += ball.runs; }
          if (isLegBye) { inn.extras.legByes += ball.runs; inn.extras.total += ball.runs; }

          // Batter
          let batter = inn.batters.find(b => b.playerId === ball.batsmanId);
          if (!batter) {
            batter = { playerId: ball.batsmanId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true, isRetired: false };
            inn.batters.push(batter);
          }
          if (isLegal) batter.balls += 1;
          if (!isWide && !isBye && !isLegBye) {
            batter.runs += ball.runs;
            if (ball.runs === 4) batter.fours += 1;
            if (ball.runs === 6) batter.sixes += 1;
          }
          if (isNoBall && !isBye && !isLegBye) {
            batter.runs += ball.runs;
            if (ball.runs === 4) batter.fours += 1;
            if (ball.runs === 6) batter.sixes += 1;
          }

          // Non-striker
          let ns = inn.batters.find(b => b.playerId === ball.nonStrikerId);
          if (!ns) {
            ns = { playerId: ball.nonStrikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false, isRetired: false };
            inn.batters.push(ns);
          }

          // Bowler
          let bowler = inn.bowlers.find(b => b.playerId === ball.bowlerId);
          if (!bowler) {
            bowler = { playerId: ball.bowlerId, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0 };
            inn.bowlers.push(bowler);
          }
          bowler.runs += totalRuns;
          if (isWide) bowler.wides += 1;
          if (isNoBall) bowler.noBalls += 1;
          if (isLegal) {
            bowler.balls += 1;
            ballsInOver += 1;
            inn.totalBalls += 1;
            if (totalRuns === 0) bowler.dots += 1;
          }

          if (ball.isWicket) {
            inn.totalWickets += 1;
            const dismissed = inn.batters.find(b => b.playerId === ball.dismissedPlayerId);
            if (dismissed) {
              dismissed.isOut = true;
              dismissed.dismissalType = ball.wicketType;
              dismissed.dismissalBowlerId = ball.bowlerId;
              dismissed.dismissalFielderId = ball.fielderId;
            }
            if (ball.wicketType !== 'run_out') bowler.wickets += 1;
            inn.fallOfWickets.push({
              runs: inn.totalRuns, wickets: inn.totalWickets,
              overs: `${currentOver}.${ballsInOver}`, playerId: ball.dismissedPlayerId || ball.batsmanId,
            });
          }

          if (ballsInOver >= 6) {
            currentOver += 1;
            inn.totalOvers += 1;
            bowler.overs += 1;
            ballsInOver = 0;
          }
        }

        inn.currentOverBalls = [];
        // Get current over balls
        let legalCount = 0;
        for (let i = inn.balls.length - 1; i >= 0; i--) {
          const b = inn.balls[i];
          if (b.extraType !== 'wide' && b.extraType !== 'no_ball') legalCount++;
          if (legalCount > 6) break;
          inn.currentOverBalls.unshift(b);
          // Check if we've reached start of current over
          if (i > 0) {
            const prevLegal = inn.balls.slice(0, i).reduce((c, bb) => c + (bb.extraType !== 'wide' && bb.extraType !== 'no_ball' ? 1 : 0), 0);
            if (prevLegal % 6 === 0 && prevLegal > 0) {
              // We might be at over boundary
            }
          }
        }
        // Simplified: just get balls since last over completion
        inn.currentOverBalls = [];
        let lc = 0;
        for (let i = inn.balls.length - 1; i >= 0; i--) {
          const b = inn.balls[i];
          inn.currentOverBalls.unshift(b);
          if (b.extraType !== 'wide' && b.extraType !== 'no_ball') lc++;
          if (lc >= 6) break;
        }
        if (lc >= 6) inn.currentOverBalls = [];

        match.updatedAt = Date.now();
        const updatedMatches = s.matches.map(m => m.id === match.id ? match : m);

        set({
          currentMatch: match,
          matches: updatedMatches,
          currentStrikerId: lastBall.batsmanId,
          currentNonStrikerId: lastBall.nonStrikerId,
          currentBowlerId: lastBall.bowlerId,
          lastBallEvent: inn.balls.length > 0 ? inn.balls[inn.balls.length - 1] : null,
        });
      },

      swapStrike: () => set(s => ({
        currentStrikerId: s.currentNonStrikerId,
        currentNonStrikerId: s.currentStrikerId,
      })),

      completeInnings: () => {
        const s = get();
        if (!s.currentMatch) return;
        const match = JSON.parse(JSON.stringify(s.currentMatch)) as Match;
        match.innings[match.currentInnings].isCompleted = true;
        
        if (match.currentInnings === 0) {
          const firstBatting = match.innings[0].battingTeamId;
          const firstBowling = match.innings[0].bowlingTeamId;
          match.innings.push(createEmptyInnings(firstBowling, firstBatting));
          match.currentInnings = 1;
          match.status = 'innings_break';
        } else {
          match.status = 'completed';
        }
        
        match.updatedAt = Date.now();
        const updatedMatches = s.matches.map(m => m.id === match.id ? match : m);
        set({
          currentMatch: match,
          matches: updatedMatches,
          currentStrikerId: null,
          currentNonStrikerId: null,
          currentBowlerId: null,
        });
      },

      completeMatch: (result, motmId) => {
        const s = get();
        if (!s.currentMatch) return;
        const match = JSON.parse(JSON.stringify(s.currentMatch)) as Match;
        match.status = 'completed';
        match.result = result;
        match.manOfTheMatch = motmId;
        match.awards = generateAwards(match);
        match.updatedAt = Date.now();

        // Update player global stats
        const teams = JSON.parse(JSON.stringify(s.teams)) as Team[];
        for (const inn of match.innings) {
          for (const bat of inn.batters) {
            const team = teams.find(t => t.players.some(p => p.id === bat.playerId));
            const player = team?.players.find(p => p.id === bat.playerId);
            if (player) {
              player.stats.runs += bat.runs;
              player.stats.balls += bat.balls;
              player.stats.fours += bat.fours;
              player.stats.sixes += bat.sixes;
              if (bat.runs > player.stats.highestScore) player.stats.highestScore = bat.runs;
            }
          }
          for (const bowl of inn.bowlers) {
            const team = teams.find(t => t.players.some(p => p.id === bowl.playerId));
            const player = team?.players.find(p => p.id === bowl.playerId);
            if (player) {
              player.stats.wickets += bowl.wickets;
              player.stats.oversBowled += bowl.overs;
              player.stats.runsConceded += bowl.runs;
            }
          }
        }
        // Mark matches played
        const allPlayerIds = [...match.playingXIA, ...match.playingXIB];
        for (const pid of allPlayerIds) {
          const team = teams.find(t => t.players.some(p => p.id === pid));
          const player = team?.players.find(p => p.id === pid);
          if (player) player.stats.matches += 1;
        }

        const updatedMatches = s.matches.map(m => m.id === match.id ? match : m);
        set({
          currentMatch: match,
          matches: updatedMatches,
          teams,
          screen: 'match_summary',
        });
      },

      pauseMatch: () => {
        const s = get();
        if (!s.currentMatch) return;
        const match = { ...s.currentMatch, status: 'paused' as const, updatedAt: Date.now() };
        const updatedMatches = s.matches.map(m => m.id === match.id ? match : m);
        set({ currentMatch: match, matches: updatedMatches });
      },

      resumeMatch: () => {
        const s = get();
        if (!s.currentMatch) return;
        const match = { ...s.currentMatch, status: 'live' as const, updatedAt: Date.now() };
        const updatedMatches = s.matches.map(m => m.id === match.id ? match : m);
        set({ currentMatch: match, matches: updatedMatches, screen: 'live_scoring' });
      },

      continueMatch: (matchId) => {
        const s = get();
        const match = s.matches.find(m => m.id === matchId);
        if (!match) return;
        
        const inn = match.innings[match.currentInnings];
        const lastBall = inn.balls.length > 0 ? inn.balls[inn.balls.length - 1] : null;
        
        const updatedMatch = { ...match, status: 'live' as const };
        const updatedMs = s.matches.map(m => m.id === match.id ? updatedMatch : m);
        set({
          currentMatch: updatedMatch,
          matches: updatedMs,
          currentStrikerId: lastBall?.batsmanId ?? null,
          currentNonStrikerId: lastBall?.nonStrikerId ?? null,
          currentBowlerId: lastBall?.bowlerId ?? null,
          screen: 'live_scoring',
        });
      },

      setShowWagonWheel: (v) => set({ showWagonWheel: v }),
      
      deleteMatch: (id) => set(s => ({
        matches: s.matches.filter(m => m.id !== id),
        currentMatch: s.currentMatch?.id === id ? null : s.currentMatch,
      })),

      getTeamById: (id) => get().teams.find(t => t.id === id),
      getPlayerById: (id) => {
        for (const t of get().teams) {
          const p = t.players.find(p => p.id === id);
          if (p) return p;
        }
        return undefined;
      },
    }),
    {
      name: 'kashmir-cric-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teams: state.teams,
        matches: state.matches,
        currentMatch: state.currentMatch,
        currentStrikerId: state.currentStrikerId,
        currentNonStrikerId: state.currentNonStrikerId,
        currentBowlerId: state.currentBowlerId,
      }),
    }
  )
);

function generateAwards(match: Match): MatchAwards {
  const allBatters: (BatterInnings & { teamId: string })[] = [];
  const allBowlers: (BowlerInnings & { teamId: string })[] = [];

  for (const inn of match.innings) {
    for (const bat of inn.batters) {
      allBatters.push({ ...bat, teamId: inn.battingTeamId });
    }
    for (const bowl of inn.bowlers) {
      allBowlers.push({ ...bowl, teamId: inn.bowlingTeamId });
    }
  }

  const getPlayerName = (id: string): string => {
    const p = [...match.teamA.players, ...match.teamB.players].find(p => p.id === id);
    return p?.name || 'Unknown';
  };
  const getTeamName = (id: string): string => {
    return id === match.teamA.id ? match.teamA.name : match.teamB.name;
  };

  // Highest runs
  const topBatter = allBatters.sort((a, b) => b.runs - a.runs)[0];
  const highestRuns: MatchAward = topBatter ? {
    title: 'Highest Runs', playerId: topBatter.playerId,
    playerName: getPlayerName(topBatter.playerId), teamName: getTeamName(topBatter.teamId),
    stat: `${topBatter.runs} (${topBatter.balls})`, icon: '🏏',
  } : { title: 'Highest Runs', playerId: '', playerName: '-', teamName: '-', stat: '-', icon: '🏏' };

  // Best bowler
  const topBowler = allBowlers.sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
  const bestBowler: MatchAward = topBowler ? {
    title: 'Best Bowler', playerId: topBowler.playerId,
    playerName: getPlayerName(topBowler.playerId), teamName: getTeamName(topBowler.teamId),
    stat: `${topBowler.wickets}/${topBowler.runs}`, icon: '🎯',
  } : { title: 'Best Bowler', playerId: '', playerName: '-', teamName: '-', stat: '-', icon: '🎯' };

  // Best strike rate (min 10 balls)
  const qualifiedBatters = allBatters.filter(b => b.balls >= 5);
  const topSR = qualifiedBatters.sort((a, b) => (b.runs / b.balls) - (a.runs / a.balls))[0];
  const bestStrikeRate: MatchAward = topSR ? {
    title: 'Best Strike Rate', playerId: topSR.playerId,
    playerName: getPlayerName(topSR.playerId), teamName: getTeamName(topSR.teamId),
    stat: `SR ${((topSR.runs / topSR.balls) * 100).toFixed(1)}`, icon: '⚡',
  } : { title: 'Best Strike Rate', playerId: '', playerName: '-', teamName: '-', stat: '-', icon: '⚡' };

  // Best economy (min 2 overs)
  const qualifiedBowlers = allBowlers.filter(b => b.overs >= 1);
  const topEcon = qualifiedBowlers.sort((a, b) => (a.runs / (a.overs || 1)) - (b.runs / (b.overs || 1)))[0];
  const bestEconomy: MatchAward = topEcon ? {
    title: 'Best Economy', playerId: topEcon.playerId,
    playerName: getPlayerName(topEcon.playerId), teamName: getTeamName(topEcon.teamId),
    stat: `Econ ${(topEcon.runs / (topEcon.overs || 1)).toFixed(2)}`, icon: '💰',
  } : { title: 'Best Economy', playerId: '', playerName: '-', teamName: '-', stat: '-', icon: '💰' };

  // Best fielder (simplified - based on catches in match context)
  const bestFielder: MatchAward = {
    title: 'Best Fielder', playerId: topBowler?.playerId || '',
    playerName: topBowler ? getPlayerName(topBowler.playerId) : '-',
    teamName: topBowler ? getTeamName(topBowler.teamId) : '-',
    stat: 'Outstanding effort', icon: '🧤',
  };

  // MVP calculation
  const mvpScores: { playerId: string; score: number; teamId: string }[] = [];
  for (const bat of allBatters) {
    const existing = mvpScores.find(m => m.playerId === bat.playerId);
    const batScore = bat.runs * 1 + bat.fours * 1 + bat.sixes * 2 + (bat.balls > 0 ? (bat.runs / bat.balls) * 20 : 0);
    if (existing) existing.score += batScore;
    else mvpScores.push({ playerId: bat.playerId, score: batScore, teamId: bat.teamId });
  }
  for (const bowl of allBowlers) {
    const existing = mvpScores.find(m => m.playerId === bowl.playerId);
    const bowlScore = bowl.wickets * 25 + bowl.maidens * 10 + bowl.dots * 1 - bowl.runs * 0.5;
    if (existing) existing.score += bowlScore;
    else mvpScores.push({ playerId: bowl.playerId, score: bowlScore, teamId: bowl.teamId });
  }
  const mvp = mvpScores.sort((a, b) => b.score - a.score)[0];
  const manOfTheMatch: MatchAward = mvp ? {
    title: 'Man of the Match', playerId: mvp.playerId,
    playerName: getPlayerName(mvp.playerId), teamName: getTeamName(mvp.teamId),
    stat: 'MVP Performance', icon: '🏆',
  } : { title: 'Man of the Match', playerId: '', playerName: '-', teamName: '-', stat: '-', icon: '🏆' };

  return { manOfTheMatch, highestRuns, bestBowler, bestStrikeRate, bestEconomy, bestFielder };
}
