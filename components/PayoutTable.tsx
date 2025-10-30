
import React from 'react';
import type { SlotSymbolInfo } from '../types';

interface PayoutTableProps {
  symbols: SlotSymbolInfo[];
}

const PayoutTable: React.FC<PayoutTableProps> = ({ symbols }) => {
  const midIndex = Math.ceil(symbols.length / 2);
  const column1Symbols = symbols.slice(0, midIndex);
  const column2Symbols = symbols.slice(midIndex);

  const renderPayoutLine = (symbol: SlotSymbolInfo) => {
    const isImageAsset = symbol.asset.startsWith('/images/');
    return (
      <div key={symbol.id} className="flex items-center justify-start w-full text-xs md:text-sm mb-1 space-x-2">
          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
              {isImageAsset ? (
                  <img src={symbol.asset} alt={symbol.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                  <span className="text-xl md:text-2xl text-center">{symbol.asset}</span>
              )}
          </div>
          {Object.entries(symbol.payouts)
              .sort(([a], [b]) => Number(b) - Number(a)) // Sort by match count: 5, 4, 3
              .map(([count, payout]) => (
                  <React.Fragment key={count}>
                      <span>x{count}</span>
                      <span className="font-game text-yellow-300 w-10 text-right">{payout}</span>
                  </React.Fragment>
              ))
          }
      </div>
    );
  };

  return (
    <div className="w-full bg-black/30 rounded-lg p-2 md:p-4 border-2 border-yellow-600 mb-4">
      <div className="grid grid-cols-2 gap-x-2 md:gap-x-4">
        <div>
          {column1Symbols.map(renderPayoutLine)}
        </div>
        <div>
          {column2Symbols.map(renderPayoutLine)}
        </div>
      </div>
    </div>
  );
};

export default PayoutTable;