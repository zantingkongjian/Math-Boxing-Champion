export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION', // New state for between levels
  GAME_OVER = 'GAME_OVER'
}

export enum MathType {
  MULTIPLICATION = 'MULTIPLICATION',
  DIVISION = 'DIVISION'
}

export interface Problem {
  id: string;
  question: string;
  answer: number;
  options: number[];
  type: MathType;
}

export interface BoxerState {
  hp: number;
  maxHp: number;
  isHit: boolean;
  isAttacking: boolean;
}

export enum Difficulty {
  EASY = 'EASY', // 1-5 times tables
  HARD = 'HARD'  // 1-9 times tables
}

// New Interface for Visual Effects
export interface FloatingEffect {
  id: number;
  text: string;
  x: number; // percentage relative to container or absolute pixels
  y: number;
  type: 'damage' | 'heal' | 'crit';
}
