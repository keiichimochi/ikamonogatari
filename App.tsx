import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SYMBOLS, REEL_COUNT, VISIBLE_SYMBOLS, INITIAL_CREDITS, BET_AMOUNTS, PAYLINES, PAYLINES_3_LEFT, PAYLINES_3_MIDDLE, PAYLINES_3_RIGHT, REEL_SPIN_DURATION, REEL_STOP_DELAY, WIN_ANIMATION_DURATION } from './constants';
import type { SlotSymbolInfo, Reel, GameState, WinningLine } from './types';
import { GameState as GameStateEnum } from './types';
import ReelComponent from './components/Reel';
import ControlPanel from './components/ControlPanel';
import PayoutTable from './components/PayoutTable';

const generateReel = (): Reel => {
    const reel: Reel = [];
    // Create a much longer strip of symbols than is visible for a better spinning illusion
    for (let i = 0; i < 20; i++) {
        reel.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }
    return reel;
};

const App: React.FC = () => {
    const [credits, setCredits] = useState(INITIAL_CREDITS);
    const [betIndex, setBetIndex] = useState(0);
    const [reels, setReels] = useState<Reel[]>(() => Array(REEL_COUNT).fill(0).map(generateReel));
    const [spinningReels, setSpinningReels] = useState<boolean[]>(Array(REEL_COUNT).fill(false));
    const [finalSymbolIndexes, setFinalSymbolIndexes] = useState<number[]>(Array(REEL_COUNT).fill(0));
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.IDLE);
    const [lastWin, setLastWin] = useState<number | null>(null);
    const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
    const [musicOn, setMusicOn] = useState(false);
    const [nextStopIndex, setNextStopIndex] = useState(0);
    
    // Audio refs
    const backgroundMusicRef = React.useRef<HTMLAudioElement | null>(null);
    const winSoundRef = React.useRef<HTMLAudioElement | null>(null);
    
    const currentBet = BET_AMOUNTS[betIndex];

    // Initialize background music on component mount
    useEffect(() => {
        backgroundMusicRef.current = new Audio('/sounds/casino.mp3');
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = 0.5;
        
        // Play background music when component mounts
        if (musicOn) {
            backgroundMusicRef.current.play().catch(err => {
                console.log('Background music play failed:', err);
            });
        }

        // Cleanup on unmount
        return () => {
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.pause();
                backgroundMusicRef.current = null;
            }
        };
    }, []);

    // Handle music on/off toggle
    useEffect(() => {
        if (backgroundMusicRef.current) {
            if (musicOn) {
                backgroundMusicRef.current.play().catch(err => {
                    console.log('Background music play failed:', err);
                });
            } else {
                backgroundMusicRef.current.pause();
            }
        }
    }, [musicOn]);

    // Initialize win sound
    useEffect(() => {
        winSoundRef.current = new Audio('/sounds/Levelup.mp3');
        winSoundRef.current.volume = 0.7;
    }, []);

    const handleSpin = () => {
        if (gameState !== GameStateEnum.IDLE || credits < currentBet) return;

        setGameState(GameStateEnum.SPINNING);
        setCredits(prev => prev - currentBet);
        setLastWin(null);
        setWinningLines([]);
        setNextStopIndex(0); // Reset stop index
        
        // Generate new reels for each spin
        const newReels = Array(REEL_COUNT).fill(0).map(generateReel);
        setReels(newReels);
        
        // Calculate final positions based on new reels
        const newFinalIndexes = newReels.map(reel => Math.floor(Math.random() * (reel.length - VISIBLE_SYMBOLS)));
        setFinalSymbolIndexes(newFinalIndexes);

        // Start all reels spinning (manual stop enabled)
        const newSpinningReels = Array(REEL_COUNT).fill(true);
        setSpinningReels(newSpinningReels);
    };

    const handleStopNextReel = () => {
        if (gameState !== GameStateEnum.SPINNING || nextStopIndex >= REEL_COUNT) {
            return; // Only allow stopping if spinning and there are reels to stop
        }

        // Stop the next reel from left to right
        setSpinningReels(prev => {
            const next = [...prev];
            next[nextStopIndex] = false;
            return next;
        });
        
        setNextStopIndex(prev => prev + 1);
    };
    
    const checkWins = useCallback(() => {
        const finalReelsMatrix: SlotSymbolInfo[][] = finalSymbolIndexes.map((finalIndex, reelIdx) => {
            return reels[reelIdx].slice(finalIndex, finalIndex + VISIBLE_SYMBOLS);
        });

        let totalWinnings = 0;
        const newWinningLines: WinningLine[] = [];

        // Check 5-column paylines (lineIndex 0-4)
        PAYLINES.forEach((line, lineIndex) => {
            const firstSymbol = finalReelsMatrix[0][line[0]];
            let matchCount = 1;
            for (let i = 1; i < REEL_COUNT; i++) {
                if (finalReelsMatrix[i][line[i]].id === firstSymbol.id) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const payout = (firstSymbol.payouts[matchCount] || 0) * (currentBet / BET_AMOUNTS[0]);
                if (payout > 0) {
                    totalWinnings += payout;
                    newWinningLines.push({ lineIndex, symbolId: firstSymbol.id, count: matchCount, payout });
                }
            }
        });

        // Check 3-column paylines (left side: columns 0-2, lineIndex 5-9)
        PAYLINES_3_LEFT.forEach((line, localIndex) => {
            const firstSymbol = finalReelsMatrix[0][line[0]];
            let matchCount = 1;
            for (let i = 1; i < 3; i++) {
                if (finalReelsMatrix[i][line[i]].id === firstSymbol.id) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const payout = (firstSymbol.payouts[matchCount] || 0) * (currentBet / BET_AMOUNTS[0]);
                if (payout > 0) {
                    const lineIndex = 5 + localIndex; // Map to ALL_PAYLINES index
                    totalWinnings += payout;
                    newWinningLines.push({ lineIndex, symbolId: firstSymbol.id, count: matchCount, payout });
                }
            }
        });

        // Check 3-column paylines (middle: columns 1-3, lineIndex 10-14)
        PAYLINES_3_MIDDLE.forEach((line, localIndex) => {
            const firstSymbol = finalReelsMatrix[1][line[0]];
            let matchCount = 1;
            for (let i = 1; i < 3; i++) {
                if (finalReelsMatrix[i + 1][line[i]].id === firstSymbol.id) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const payout = (firstSymbol.payouts[matchCount] || 0) * (currentBet / BET_AMOUNTS[0]);
                if (payout > 0) {
                    const lineIndex = 10 + localIndex; // Map to ALL_PAYLINES index
                    totalWinnings += payout;
                    newWinningLines.push({ lineIndex, symbolId: firstSymbol.id, count: matchCount, payout });
                }
            }
        });

        // Check 3-column paylines (right side: columns 2-4, lineIndex 15-19)
        PAYLINES_3_RIGHT.forEach((line, localIndex) => {
            const firstSymbol = finalReelsMatrix[2][line[0]];
            let matchCount = 1;
            for (let i = 1; i < 3; i++) {
                if (finalReelsMatrix[i + 2][line[i]].id === firstSymbol.id) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                const payout = (firstSymbol.payouts[matchCount] || 0) * (currentBet / BET_AMOUNTS[0]);
                if (payout > 0) {
                    const lineIndex = 15 + localIndex; // Map to ALL_PAYLINES index
                    totalWinnings += payout;
                    newWinningLines.push({ lineIndex, symbolId: firstSymbol.id, count: matchCount, payout });
                }
            }
        });

        if (totalWinnings > 0) {
            setLastWin(totalWinnings);
            setCredits(prev => prev + totalWinnings);
            setWinningLines(newWinningLines);
            
            // Play win sound
            if (winSoundRef.current) {
                winSoundRef.current.currentTime = 0;
                winSoundRef.current.play().catch(err => {
                    console.log('Win sound play failed:', err);
                });
            }
        }

        setTimeout(() => {
            setGameState(GameStateEnum.IDLE);
        }, totalWinnings > 0 ? WIN_ANIMATION_DURATION : 0);

    }, [finalSymbolIndexes, reels, currentBet]);

    useEffect(() => {
        if (gameState === GameStateEnum.SPINNING && !spinningReels.some(s => s)) {
            setGameState(GameStateEnum.SHOWING_RESULTS);
            checkWins();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinningReels, gameState, checkWins]);

    const handleBetChange = (direction: 'up' | 'down') => {
        if (gameState !== GameStateEnum.IDLE) return;
        if (direction === 'up') {
            setBetIndex(prev => (prev + 1) % BET_AMOUNTS.length);
        } else {
            setBetIndex(prev => (prev - 1 + BET_AMOUNTS.length) % BET_AMOUNTS.length);
        }
    };
    
    const visibleSymbolsMatrix = useMemo(() => {
        return finalSymbolIndexes.map((finalIndex, reelIdx) => {
            return reels[reelIdx].slice(finalIndex, finalIndex + VISIBLE_SYMBOLS);
        });
    }, [finalSymbolIndexes, reels]);

    return (
        <main className="w-full min-h-screen bg-gray-900 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
             <div className="relative w-full max-w-4xl bg-gradient-to-b from-indigo-900 to-purple-900 border-2 sm:border-4 border-yellow-400 rounded-xl sm:rounded-2xl shadow-2xl shadow-yellow-500/20 p-2 sm:p-4 md:p-8 text-white">
                <PayoutTable symbols={SYMBOLS} />
                
                <header className="text-center mb-2 sm:mb-4">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-game text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        イカ物語
                    </h1>
                </header>

                <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 p-1 sm:p-2 md:p-4 bg-black/30 rounded-lg border-2 border-yellow-600">
                    {reels.map((reel, i) => (
                        <ReelComponent
                            key={i}
                            reel={reel}
                            isSpinning={spinningReels[i]}
                            finalSymbolIndex={finalSymbolIndexes[i]}
                            visibleSymbols={visibleSymbolsMatrix[i]}
                            winningLines={winningLines}
                            reelIndex={i}
                        />
                    ))}
                </div>
                
                {lastWin && lastWin > 0 && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-30">
                        <div className="text-center animate-pulse">
                            <p className="text-xl sm:text-2xl md:text-4xl font-game text-white">WIN</p>
                            <p className="text-4xl sm:text-5xl md:text-8xl font-game text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
                                {lastWin}
                            </p>
                        </div>
                    </div>
                )}
                
                <ControlPanel
                    credits={credits}
                    bet={currentBet}
                    onBetChange={handleBetChange}
                    onSpin={handleSpin}
                    isSpinning={gameState !== GameStateEnum.IDLE}
                    canSpin={credits >= currentBet}
                    musicOn={musicOn}
                    onMusicToggle={() => setMusicOn(prev => !prev)}
                    onStopNextReel={handleStopNextReel}
                    canStopNext={gameState === GameStateEnum.SPINNING && nextStopIndex < REEL_COUNT}
                />
            </div>
        </main>
    );
};

export default App;