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
  
  // Debug: Log winning lines for this reel
  if (winningLines.length > 0 && !isSpinning) {
    console.log(`[Reel ${reelIndex}] Checking ${winningLines.length} winning lines`);
    console.log(`[Reel ${reelIndex}] Visible symbols:`, visibleSymbols.map((s, i) => `${i}:${s.name}`).join(', '));
  }
  
  winningLines.forEach(win => {
      win.positions.forEach(position => {
          if (position.reelIndex !== reelIndex) {
              return;
          }

          const rowIndex = position.rowIndex;
          const symbolAtPosition = visibleSymbols[rowIndex];
          
          // Debug: Log position check
          if (!isSpinning && winningLines.length > 0) {
            console.log(`[Reel ${reelIndex}] Checking position: rowIndex=${rowIndex}, expected=${win.symbolId}, actual=${symbolAtPosition?.id}, match=${rowIndex >= 0 && rowIndex < visibleSymbols.length && visibleSymbols[rowIndex].id === win.symbolId}`);
          }
          
          if (rowIndex >= 0 && rowIndex < visibleSymbols.length && visibleSymbols[rowIndex].id === win.symbolId) {
              winningSymbolIndices.add(rowIndex);
              if (!isSpinning && winningLines.length > 0) {
                console.log(`[Reel ${reelIndex}] ✓ Added winning symbol at rowIndex=${rowIndex}, symbol=${symbolAtPosition.name}`);
              }
          }
      });
  });
  
  // Debug: Log final winning indices for this reel
  if (winningSymbolIndices.size > 0 && !isSpinning) {
    console.log(`[Reel ${reelIndex}] Final winningSymbolIndices:`, Array.from(winningSymbolIndices));
    console.log(`[Reel ${reelIndex}] Winning symbols:`, Array.from(winningSymbolIndices).map(idx => `${idx}:${visibleSymbols[idx].name}`).join(', '));
  } else if (winningLines.length > 0 && !isSpinning) {
    console.log(`[Reel ${reelIndex}] ⚠️ No winning symbols found despite ${winningLines.length} winning lines`);
  }

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    console.log(`[Reel ${reelIndex}] handleTransitionEnd called, isSpinning=${isSpinning}, property=${e.propertyName}`);
    // Only handle transform transitions
    if (e.propertyName === 'transform' && !isSpinning) {
      console.log(`[Reel ${reelIndex}] Setting showResult to true via handleTransitionEnd`);
      setShowResult(true);
    }
  };
  
  // Also set showResult when isSpinning becomes false and result isn't shown yet
  useEffect(() => {
    if (!isSpinning && !showResult) {
      // Use a shorter timeout as fallback
      const timer = setTimeout(() => {
        console.log(`[Reel ${reelIndex}] Fallback: Setting showResult to true (transition may not have fired)`);
        setShowResult(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSpinning, showResult, reelIndex]);
  
  // Debug: Log showResult state changes
  useEffect(() => {
    console.log(`[Reel ${reelIndex}] showResult=${showResult}, isSpinning=${isSpinning}, winningLines.length=${winningLines.length}`);
  }, [showResult, isSpinning, winningLines.length, reelIndex]);

  return (
    <div className="relative h-[240px] sm:h-[270px] md:h-[300px] w-full bg-blue-900/50 rounded-md border border-yellow-500/50 sm:border-2 shadow-inner shadow-black/50">
      {/* Spinning reel wrapper with overflow-hidden */}
      <div className="absolute inset-0 w-full h-full overflow-hidden rounded-md">
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
      </div>
      {/* Static overlay for displaying results without moving with the reel */}
      {showResult && !isSpinning && (
          <div className="absolute top-0 left-0 w-full h-full flex flex-col pointer-events-none z-20">
              {visibleSymbols.map((symbol, index) => {
                  const isWinningSymbol = winningSymbolIndices.has(index);
                  console.log(`[Reel ${reelIndex}] Rendering symbol at index ${index}: ${symbol.name}, isWinning=${isWinningSymbol}`);
                  return (
                      <SlotSymbolView 
                          key={`result-${index}`} 
                          symbol={symbol} 
                          isWinning={isWinningSymbol} 
                      />
                  );
              })}
          </div>
      )}
    </div>
  );
};

export default ReelComponent;