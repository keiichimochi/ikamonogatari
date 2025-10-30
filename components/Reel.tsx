import React from 'react';
import type { Reel, SlotSymbolInfo, WinningLine } from '../types';
import SlotSymbolView from './SlotSymbolView';
import { VISIBLE_SYMBOLS, PAYLINES } from '../constants';

interface ReelProps {
  reel: Reel;
  isSpinning: boolean;
  finalSymbolIndex: number;
  visibleSymbols: SlotSymbolInfo[];
  winningLines: WinningLine[];
  reelIndex: number;
}

const ReelComponent: React.FC<ReelProps> = ({ reel, isSpinning, finalSymbolIndex, visibleSymbols, winningLines, reelIndex }) => {
  const symbolHeight = 100; // Assuming each symbol is 100px tall for calculation
  const finalPosition = -finalSymbolIndex * symbolHeight;

  // Find which symbols in this reel are part of a winning line
  const winningSymbolIndices = new Set<number>();
  winningLines.forEach(win => {
      const payline = PAYLINES[win.lineIndex];
      const symbolRowIndex = payline[reelIndex];
      if (win.symbolId === visibleSymbols[symbolRowIndex].id) {
          winningSymbolIndices.add(symbolRowIndex);
      }
  });

  return (
    <div className="relative h-[300px] w-full bg-blue-900/50 overflow-hidden rounded-md border-2 border-yellow-500/50 shadow-inner shadow-black/50">
      <div
        className={`flex flex-col transition-transform duration-[1000ms] ease-out ${isSpinning ? 'animate-spin-fast' : ''}`}
        style={{ transform: isSpinning ? 'translateY(-10000px)' : `translateY(${finalPosition}px)` }}
      >
         {reel.map((symbol, index) => (
           <SlotSymbolView key={index} symbol={symbol} isWinning={false} />
         ))}
      </div>
      {/* Static overlay for displaying results without moving with the reel */}
      {!isSpinning && (
          <div className="absolute top-0 left-0 w-full h-full flex flex-col">
              {visibleSymbols.map((symbol, index) => (
                  <SlotSymbolView 
                      key={index} 
                      symbol={symbol} 
                      isWinning={winningSymbolIndices.has(index)} 
                  />
              ))}
          </div>
      )}
    </div>
  );
};

export default ReelComponent;