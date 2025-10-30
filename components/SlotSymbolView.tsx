
import React, { useState } from 'react';
import type { SlotSymbolInfo } from '../types';

interface SlotSymbolViewProps {
  symbol: SlotSymbolInfo;
  isWinning: boolean;
}

const SlotSymbolView: React.FC<SlotSymbolViewProps> = ({ symbol, isWinning }) => {
  const [imageError, setImageError] = useState(false);
  const isImageAsset = symbol.asset.startsWith('/images/');

  return (
    <div className="h-[100px] flex-shrink-0 flex items-center justify-center transition-all duration-300">
      <div className={`relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 ${isWinning ? 'winning-symbol' : ''}`}>
        {/* Multiple glow layers for more dramatic effect */}
        {isWinning && (
          <>
            <div className="absolute inset-0 bg-yellow-400/70 rounded-full blur-2xl winning-glow animate-pulse"></div>
            <div className="absolute inset-0 bg-yellow-300/50 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute inset-0 bg-orange-400/40 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            {/* Sparkle particles */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.9s' }}></div>
          </>
        )}
        {isImageAsset ? (
          imageError ? (
            <span className={`text-2xl md:text-4xl drop-shadow-lg text-yellow-400 ${isWinning ? 'winning-symbol' : ''}`}>{symbol.name}</span>
          ) : (
            <img 
              src={symbol.asset} 
              alt={symbol.name} 
              className={`w-full h-full object-cover rounded-full drop-shadow-lg ${isWinning ? 'winning-symbol' : ''}`}
              onError={() => setImageError(true)}
            />
          )
        ) : (
          <span className={`text-4xl md:text-6xl drop-shadow-lg ${isWinning ? 'winning-symbol' : ''}`}>{symbol.asset}</span>
        )}
      </div>
    </div>
  );
};

export default SlotSymbolView;