// FIX: Removed unused and non-existent 'Payline' type from import.
import type { SlotSymbolInfo } from './types';

// To customize symbols, change the 'asset' property.
// For example, replace '🦑' with '/images/squid.png'.
export const SYMBOLS: SlotSymbolInfo[] = [
  { id: 'ooto', name: 'ooto', asset: '/images/ooto.png', payouts: { 3: 777, 4: 7777, 5: 77777 } },
  { id: 'yasuo', name: 'yasuo', asset: '/images/yasuo.png', payouts: { 3: 800, 4: 1500, 5: 50000 } },
  { id: 'ika', name: 'ika', asset: '/images/ika.png', payouts: { 3: 150, 4: 2400, 5: 10000 } },
  { id: 'tori', name: 'tori', asset: '/images/tori.png', payouts: { 3: 100, 4: 3000, 5: 5000} },
  { id: 'abebe', name: 'abebe', asset: '/images/abebe.png', payouts: { 3: 50, 4: 2000, 5: 1000 } },
  { id: 'kiyo', name: 'kiyo', asset: '/images/kiyo.png', payouts: { 3: 1, 4: 2, 5: 3 } },
];

export const REEL_COUNT = 5;
export const VISIBLE_SYMBOLS = 3;

// Defines which row indices constitute a winning payline.
// 0 = top row, 1 = middle row, 2 = bottom row.
// V-shape and inverse V-shape lines are included for more excitement.
// 5-column paylines
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // Middle horizontal
  [0, 0, 0, 0, 0], // Top horizontal
  [2, 2, 2, 2, 2], // Bottom horizontal
  [0, 1, 2, 1, 0], // V-shape
  [2, 1, 0, 1, 2], // Inverse V-shape
];

// 3-column paylines (left side: columns 0-2)
export const PAYLINES_3_LEFT: number[][] = [
  [0, 0, 0], // Top horizontal (left 3)
  [1, 1, 1], // Middle horizontal (left 3)
  [2, 2, 2], // Bottom horizontal (left 3)
  [0, 1, 2], // Diagonal up (left 3)
  [2, 1, 0], // Diagonal down (left 3)
];

// 3-column paylines (middle: columns 1-3)
export const PAYLINES_3_MIDDLE: number[][] = [
  [0, 0, 0], // Top horizontal (middle 3)
  [1, 1, 1], // Middle horizontal (middle 3)
  [2, 2, 2], // Bottom horizontal (middle 3)
  [0, 1, 2], // Diagonal up (middle 3)
  [2, 1, 0], // Diagonal down (middle 3)
];

// 3-column paylines (right side: columns 2-4)
export const PAYLINES_3_RIGHT: number[][] = [
  [0, 0, 0], // Top horizontal (right 3)
  [1, 1, 1], // Middle horizontal (right 3)
  [2, 2, 2], // Bottom horizontal (right 3)
  [0, 1, 2], // Diagonal up (right 3)
  [2, 1, 0], // Diagonal down (right 3)
];

// Combined paylines for display purposes (expanded to 5 columns)
// 5-column paylines are already 5 columns
// 3-column paylines are expanded with null values for columns not in the payline
export const ALL_PAYLINES: (number | null)[][] = [
  // 5-column paylines
  [1, 1, 1, 1, 1], // Middle horizontal
  [0, 0, 0, 0, 0], // Top horizontal
  [2, 2, 2, 2, 2], // Bottom horizontal
  [0, 1, 2, 1, 0], // V-shape
  [2, 1, 0, 1, 2], // Inverse V-shape
  // 3-column paylines (left side)
  [0, 0, 0, null, null], // Top horizontal (left 3)
  [1, 1, 1, null, null], // Middle horizontal (left 3)
  [2, 2, 2, null, null], // Bottom horizontal (left 3)
  [0, 1, 2, null, null], // Diagonal up (left 3)
  [2, 1, 0, null, null], // Diagonal down (left 3)
  // 3-column paylines (middle)
  [null, 0, 0, 0, null], // Top horizontal (middle 3)
  [null, 1, 1, 1, null], // Middle horizontal (middle 3)
  [null, 2, 2, 2, null], // Bottom horizontal (middle 3)
  [null, 0, 1, 2, null], // Diagonal up (middle 3)
  [null, 2, 1, 0, null], // Diagonal down (middle 3)
  // 3-column paylines (right side)
  [null, null, 0, 0, 0], // Top horizontal (right 3)
  [null, null, 1, 1, 1], // Middle horizontal (right 3)
  [null, null, 2, 2, 2], // Bottom horizontal (right 3)
  [null, null, 0, 1, 2], // Diagonal up (right 3)
  [null, null, 2, 1, 0], // Diagonal down (right 3)
];

export const INITIAL_CREDITS = 500;
export const BET_AMOUNTS = [100, 200, 300, 500, 1000];

// BETが上がるクレジットの閾値
export const BET_THRESHOLDS = [500, 1000, 2000, 5000, 10000];

// Durations in milliseconds
export const REEL_SPIN_DURATION = 1000;
export const REEL_STOP_DELAY = 200; // Staggered stop delay between reels
export const WIN_ANIMATION_DURATION = 3000; // How long to show win results before enabling spin again