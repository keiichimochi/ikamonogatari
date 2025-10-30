
import React from 'react';

interface ControlPanelProps {
  credits: number;
  bet: number;
  onBetChange: (direction: 'up' | 'down') => void;
  onSpin: () => void;
  isSpinning: boolean;
  canSpin: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ credits, bet, onBetChange, onSpin, isSpinning, canSpin }) => {
  const buttonDisabled = isSpinning || !canSpin;

  return (
    <div className="mt-4 md:mt-6 grid grid-cols-3 gap-2 md:gap-4 items-center text-center">
      {/* Credits Display */}
      <div className="bg-black/50 rounded-lg p-2 border-2 border-yellow-600">
        <p className="text-sm md:text-lg text-yellow-300 font-bold">CREDITS</p>
        <p className="text-lg md:text-2xl font-game tracking-tighter">{credits}</p>
      </div>

      {/* Bet Controls */}
      <div className="bg-black/50 rounded-lg p-2 border-2 border-yellow-600 flex flex-col items-center">
        <p className="text-sm md:text-lg text-yellow-300 font-bold">BET</p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => onBetChange('down')} disabled={isSpinning} className="text-lg md:text-2xl text-yellow-300 disabled:opacity-50 transition-transform active:scale-90">
            -
          </button>
          <p className="text-lg md:text-2xl font-game tracking-tighter w-16">{bet}</p>
          <button onClick={() => onBetChange('up')} disabled={isSpinning} className="text-lg md:text-2xl text-yellow-300 disabled:opacity-50 transition-transform active:scale-90">
            +
          </button>
        </div>
      </div>

      {/* Spin Button */}
      <div className="col-span-3 md:col-span-1 mt-2 md:mt-0 flex items-center justify-center">
        <button
          onClick={onSpin}
          disabled={buttonDisabled}
          className={`
            w-full md:w-36 h-20 md:h-full rounded-lg font-game text-2xl
            transition-all duration-200 ease-in-out
            border-b-4 
            ${
              buttonDisabled
                ? 'bg-gray-600 text-gray-400 border-gray-800 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 text-white border-green-700 hover:border-green-600 active:border-b-0 active:translate-y-1 transform'
            }
            ${!isSpinning && canSpin ? 'animate-pulse' : ''}
            shadow-lg
          `}
        >
          SPIN
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
