// FIX: Removed unused and non-existent 'Payline' type from import.
import type { SlotSymbolInfo } from './types';

// To customize symbols, change the 'asset' property.
// For example, replace '🦑' with '/images/squid.png'.
export const SYMBOLS: SlotSymbolInfo[] = [
  { id: 'treasure', name: 'Treasure', asset: '/images/man-peace-sign.png', payouts: { 3: 100, 4: 500, 5: 2000 } },
  { id: 'octopus', name: 'Octopus', asset: '🐙', payouts: { 3: 50, 4: 200, 5: 800 } },
  { id: 'crab', name: 'Crab', asset: '🦀', payouts: { 3: 20, 4: 80, 5: 300 } },
  { id: 'shrimp', name: 'Shrimp', asset: '🦐', payouts: { 3: 10, 4: 40, 5: 150 } },
  { id: 'squid', name: 'Squid', asset: '🦑', payouts: { 3: 5, 4: 20, 5: 75 } },
  { id: 'fish', name: 'Fish', asset: '🐠', payouts: { 3: 2, 4: 10, 5: 40 } },
];

export const REEL_COUNT = 5;
export const VISIBLE_SYMBOLS = 3;

// Defines which row indices constitute a winning payline.
// 0 = top row, 1 = middle row, 2 = bottom row.
// V-shape and inverse V-shape lines are included for more excitement.
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // Middle horizontal
  [0, 0, 0, 0, 0], // Top horizontal
  [2, 2, 2, 2, 2], // Bottom horizontal
  [0, 1, 2, 1, 0], // V-shape
  [2, 1, 0, 1, 2], // Inverse V-shape
];

export const INITIAL_CREDITS = 1000;
export const BET_AMOUNTS = [10, 20, 50, 100];

// Durations in milliseconds
export const REEL_SPIN_DURATION = 1000;
export const REEL_STOP_DELAY = 200; // Staggered stop delay between reels
export const WIN_ANIMATION_DURATION = 2000; // How long to show win results before enabling spin again