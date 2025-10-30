import React, { useState, useEffect } from 'react';
import type { Reel, SlotSymbolInfo, WinningLine } from '../types';
import SlotSymbolView from './SlotSymbolView';
import { REEL_SPIN_DURATION } from '../constants';

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
      win.positions.forEach(position => {
          if (position.reelIndex !== reelIndex) {
              return;
          }

          const rowIndex = position.rowIndex;
          if (rowIndex >= 0 && rowIndex < visibleSymbols.length && visibleSymbols[rowIndex].id === win.symbolId) {
              winningSymbolIndices.add(rowIndex);
          }
      });
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