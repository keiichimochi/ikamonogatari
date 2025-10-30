
export interface SlotSymbolInfo {
  id: string;
  name: string;
  // This can be an emoji or a path to an image file, e.g., '/images/squid.png'
  asset: string;
  payouts: { [key: number]: number }; // e.g., { 3: 10, 4: 50, 5: 200 }
}

export type Reel = SlotSymbolInfo[];

export enum GameState {
  IDLE,
  SPINNING,
  SHOWING_RESULTS,
}

export interface WinningLine {
  lineIndex: number;
  symbolId: string;
  count: number;
  payout: number;
  positions: Array<{ reelIndex: number; rowIndex: number }>;
}
