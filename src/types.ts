export interface Player {
  id: string;
  name: string;
  teamId: string;
  battingStyle?: 'Right Hand' | 'Left Hand';
  bowlingStyle?: 'Right Arm Fast' | 'Right Arm Medium' | 'Left Arm Fast' | 'Left Arm Medium' | 'Right Arm Off Spin' | 'Right Arm Leg Spin' | 'Left Arm Spin' | 'Left Arm Chinaman';
  stats: PlayerStats;
}

export interface PlayerStats {
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  highestScore: number;
  bestBowling: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  captainId?: string;
  players: Player[];
  createdAt: number;
}

export type WicketType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'retired_hurt';
export type ExtraType = 'wide' | 'no_ball' | 'bye' | 'leg_bye';

export interface BallEvent {
  id: string;
  matchId: string;
  inningsIndex: number;
  overNumber: number;
  ballNumber: number;
  runs: number;
  isExtra: boolean;
  extraType?: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  batsmanId: string;
  bowlerId: string;
  nonStrikerId: string;
  dismissedPlayerId?: string;
  fielderId?: string;
  shotZone?: number;
  timestamp: number;
}

export interface BatterInnings {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: WicketType;
  dismissalBowlerId?: string;
  dismissalFielderId?: string;
  isOnStrike: boolean;
  isRetired: boolean;
}

export interface BowlerInnings {
  playerId: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  dots: number;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number; total: number };
  batters: BatterInnings[];
  bowlers: BowlerInnings[];
  balls: BallEvent[];
  currentOverBalls: BallEvent[];
  isCompleted: boolean;
  fallOfWickets: { runs: number; wickets: number; overs: string; playerId: string }[];
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  playingXIA: string[];
  playingXIB: string[];
  totalOvers: number;
  tossWonBy: string;
  tossDecision: 'bat' | 'bowl';
  innings: Innings[];
  currentInnings: number;
  status: 'setup' | 'live' | 'innings_break' | 'paused' | 'completed';
  result?: string;
  manOfTheMatch?: string;
  awards?: MatchAwards;
  createdAt: number;
  updatedAt: number;
  venue?: string;
}

export interface MatchAward {
  title: string;
  playerId: string;
  playerName: string;
  teamName: string;
  stat: string;
  icon: string;
}

export interface MatchAwards {
  manOfTheMatch: MatchAward;
  highestRuns: MatchAward;
  bestBowler: MatchAward;
  bestStrikeRate: MatchAward;
  bestEconomy: MatchAward;
  bestFielder: MatchAward;
}

export type Screen = 
  | 'splash'
  | 'home'
  | 'matches'
  | 'score'
  | 'stats'
  | 'settings'
  | 'match_setup'
  | 'live_scoring'
  | 'match_summary'
  | 'team_create'
  | 'team_detail'
  | 'player_detail'
  | 'scorecard'
  | 'select_playing_xi'
  | 'toss';
