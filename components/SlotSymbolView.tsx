
import React from 'react';
import type { SlotSymbolInfo } from '../types';

interface SlotSymbolViewProps {
  symbol: SlotSymbolInfo;
  isWinning: boolean;
}

const SlotSymbolView: React.FC<SlotSymbolViewProps> = ({ symbol, isWinning }) => {
  const winningClasses = isWinning
    ? 'animate-pulse scale-110 shadow-lg shadow-yellow-400 rounded-full z-10'
    : '';
  const isImageAsset = symbol.asset.startsWith('/images/');

  return (
    <div className="h-[100px] flex-shrink-0 flex items-center justify-center transition-all duration-300">
      <div className={`relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 ${winningClasses}`}>
        {isWinning && <div className="absolute inset-0 bg-yellow-400/50 rounded-full blur-xl"></div>}
        {isImageAsset ? (
          <img src={symbol.asset} alt={symbol.name} className="w-full h-full object-cover rounded-full drop-shadow-lg" />
        ) : (
          <span className="text-4xl md:text-6xl drop-shadow-lg">{symbol.asset}</span>
        )}
      </div>
    </div>
  );
};

export default SlotSymbolView;