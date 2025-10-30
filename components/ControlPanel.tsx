
import React from 'react';

interface ControlPanelProps {
  credits: number;
  bet: number;
  onBetChange: (direction: 'up' | 'down') => void;
  onSpin: () => void;
  isSpinning: boolean;
  canSpin: boolean;
  musicOn: boolean;
  onMusicToggle: () => void;
  onStopNextReel: () => void;
  canStopNext: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ credits, bet, onBetChange, onSpin, isSpinning, canSpin, musicOn, onMusicToggle, onStopNextReel, canStopNext }) => {
  const buttonDisabled = isSpinning || !canSpin;

  return (
    <div className="mt-2 sm:mt-4 md:mt-6">
      {/* Music Toggle Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onMusicToggle}
          className={`
            px-2 py-1 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-lg text-xs sm:text-sm md:text-base font-game
            transition-all duration-200 ease-in-out
            border-2
            ${
              musicOn
                ? 'bg-yellow-500 hover:bg-yellow-400 text-white border-yellow-700 hover:border-yellow-600'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-300 border-gray-800 hover:border-gray-700'
            }
            active:scale-95 shadow-lg
          `}
        >
          {musicOn ? '🔇 MUSIC OFF' : '🔊 MUSIC ON'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4 items-center text-center">
        {/* Credits Display */}
        <div className="bg-black/50 rounded-lg p-1.5 sm:p-2 border border-yellow-600 sm:border-2">
          <p className="text-xs sm:text-sm md:text-lg text-yellow-300 font-bold">CREDITS</p>
          <p className="text-sm sm:text-lg md:text-2xl font-game tracking-tighter">{credits}</p>
        </div>

        {/* Bet Controls */}
        <div className="bg-black/50 rounded-lg p-1.5 sm:p-2 border border-yellow-600 sm:border-2 flex flex-col items-center">
          <p className="text-xs sm:text-sm md:text-lg text-yellow-300 font-bold">BET</p>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <button onClick={() => onBetChange('down')} disabled={isSpinning} className="text-base sm:text-lg md:text-2xl text-yellow-300 disabled:opacity-50 transition-transform active:scale-90">
              -
            </button>
            <p className="text-sm sm:text-lg md:text-2xl font-game tracking-tighter w-12 sm:w-16">{bet}</p>
            <button onClick={() => onBetChange('up')} disabled={isSpinning} className="text-base sm:text-lg md:text-2xl text-yellow-300 disabled:opacity-50 transition-transform active:scale-90">
              +
            </button>
          </div>
        </div>

        {/* Spin/Stop Button */}
        <div className="col-span-3 sm:col-span-1 mt-2 sm:mt-0 flex items-center justify-center">
          {isSpinning ? (
            <button
              onClick={onStopNextReel}
              disabled={!canStopNext}
              className={`
                w-full sm:w-32 md:w-36 h-14 sm:h-16 md:h-20 rounded-lg font-game text-lg sm:text-xl md:text-2xl
                transition-all duration-200 ease-in-out
                border-b-4 
                ${
                  !canStopNext
                    ? 'bg-gray-600 text-gray-400 border-gray-800 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-400 text-white border-orange-700 hover:border-orange-600 active:border-b-0 active:translate-y-1 transform'
                }
                shadow-lg
              `}
            >
              STOP
            </button>
          ) : (
            <button
              onClick={onSpin}
              disabled={!canSpin}
              className={`
                w-full sm:w-32 md:w-36 h-14 sm:h-16 md:h-20 rounded-lg font-game text-lg sm:text-xl md:text-2xl
                transition-all duration-200 ease-in-out
                border-b-4 
                ${
                  !canSpin
                    ? 'bg-gray-600 text-gray-400 border-gray-800 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-400 text-white border-green-700 hover:border-green-600 active:border-b-0 active:translate-y-1 transform'
                }
                ${canSpin ? 'animate-pulse' : ''}
                shadow-lg
              `}
            >
              SPIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
