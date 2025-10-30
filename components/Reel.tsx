import React, { useState, useEffect } from 'react';
import type { Reel, SlotSymbolInfo, WinningLine } from '../types';
import SlotSymbolView from './SlotSymbolView';
import { VISIBLE_SYMBOLS, ALL_PAYLINES, REEL_SPIN_DURATION, REEL_COUNT } from '../constants';

interface ReelProps {
  reel: Reel;
  isSpinning: boolean;
  finalSymbolIndex: number;
  visibleSymbols: SlotSymbolInfo[];
  winningLines: WinningLine[];
  reelIndex: number;
}

const ReelComponent: React.FC<ReelProps> = ({ reel, isSpinning, finalSymbolIndex, visibleSymbols, winningLines, reelIndex }) => {
  const [showResult, setShowResult] = useState(false);
  // Symbol height varies by screen size: 80px mobile, 90px tablet, 100px desktop
  const symbolHeight = typeof window !== 'undefined' ? (window.innerWidth >= 768 ? 100 : window.innerWidth >= 640 ? 90 : 80) : 80;
  const finalPosition = -finalSymbolIndex * symbolHeight;

  // Reset showResult when spinning starts
  useEffect(() => {
    if (isSpinning) {
      setShowResult(false);
    }
  }, [isSpinning]);

  // Find which symbols in this reel are part of a winning line
  // Only highlight symbols that are actually part of winning paylines
  const winningSymbolIndices = new Set<number>();
  winningLines.forEach(win => {
      const payline = ALL_PAYLINES[win.lineIndex];
      if (!payline || payline[reelIndex] === null || payline[reelIndex] === undefined) {
          return; // This reel is not part of this payline
      }
      
      const symbolRowIndex = payline[reelIndex] as number;
      
      // Verify the symbol matches
      if (symbolRowIndex >= visibleSymbols.length || 
          win.symbolId !== visibleSymbols[symbolRowIndex].id) {
          return; // Symbol doesn't match
      }
      
      // Determine the range of reels this payline covers
      let startReel = 0;
      let reelCount = 5; // 5-column payline by default
      
      if (win.lineIndex >= 5 && win.lineIndex < 10) {
          // 3-column left payline (reels 0-2)
          startReel = 0;
          reelCount = 3;
      } else if (win.lineIndex >= 10 && win.lineIndex < 15) {
          // 3-column middle payline (reels 1-3)
          startReel = 1;
          reelCount = 3;
      } else if (win.lineIndex >= 15 && win.lineIndex < 20) {
          // 3-column right payline (reels 2-4)
          startReel = 2;
          reelCount = 3;
      }
      
      // Only highlight if this reel is within the payline range
      // and within the actual match count (the number of consecutive matching symbols starting from startReel)
      const reelOffset = reelIndex - startReel;
      // Check if this reel is part of the winning sequence
      if (reelOffset >= 0 && reelOffset < win.count && reelIndex >= startReel && reelIndex < startReel + reelCount) {
          winningSymbolIndices.add(symbolRowIndex);
      }
  });

  const handleTransitionEnd = () => {
    if (!isSpinning) {
      setShowResult(true);
    }
  };

  return (
    <div className="relative h-[240px] sm:h-[270px] md:h-[300px] w-full bg-blue-900/50 overflow-hidden rounded-md border border-yellow-500/50 sm:border-2 shadow-inner shadow-black/50">
      {/* Spinning reel */}
      <div
        className={`flex flex-col absolute top-0 left-0 w-full ${isSpinning ? 'reel-spinning' : ''}`}
        style={isSpinning ? {} : { 
          transform: `translateY(${finalPosition}px)`,
          transition: `transform ${REEL_SPIN_DURATION}ms ease-out`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
         {reel.map((symbol, index) => (
           <SlotSymbolView key={`spinning-${index}`} symbol={symbol} isWinning={false} />
         ))}
      </div>
      {/* Static overlay for displaying results without moving with the reel */}
      {showResult && !isSpinning && (
          <div className="absolute top-0 left-0 w-full h-full flex flex-col pointer-events-none z-20">
              {visibleSymbols.map((symbol, index) => (
                  <SlotSymbolView 
                      key={`result-${index}`} 
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