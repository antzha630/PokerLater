export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
  id: string;
}

export type GameState = 'WAITING' | 'DEALING' | 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

export interface Player {
  id: string;
  name: string;
  chips: number;
  bet: number;
  holeCards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  position: number;
  lastAction?: string;
}

export interface TableState {
  id: string;
  players: (Player | null)[];
  board: Card[];
  pot: number;
  gameState: GameState;
  dealerPosition: number;
  activePosition: number;
  minRaise: number;
  lastBet: number;
  timer: number;
  timer: number;
  gameFeed: string[];
}
