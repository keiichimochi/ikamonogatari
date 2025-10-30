import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SYMBOLS, REEL_COUNT, VISIBLE_SYMBOLS, INITIAL_CREDITS, BET_AMOUNTS, BET_THRESHOLDS, REEL_SPIN_DURATION, REEL_STOP_DELAY, WIN_ANIMATION_DURATION } from './constants';
import type { SlotSymbolInfo, Reel, GameState, WinningLine } from './types';
import { GameState as GameStateEnum } from './types';
import ReelComponent from './components/Reel';
import ControlPanel from './components/ControlPanel';
import PayoutTable from './components/PayoutTable';
import Ranking from './components/Ranking';

const HIGH_SCORE_KEY = 'ikamonogatari_high_score';

const generateReel = (): Reel => {
    const reel: Reel = [];
    // Create a much longer strip of symbols than is visible for a better spinning illusion
    for (let i = 0; i < 20; i++) {
        reel.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }
    return reel;
};

const App: React.FC = () => {
    // Load high score from localStorage
    const [highScore, setHighScore] = useState<number>(() => {
        const saved = localStorage.getItem(HIGH_SCORE_KEY);
        return saved ? parseInt(saved, 10) : 0;
    });
    
    const [credits, setCredits] = useState(INITIAL_CREDITS);
    const [betIndex, setBetIndex] = useState(0);
    const [maxBetIndex, setMaxBetIndex] = useState(0); // 到達した最高BETインデックス
    const [reels, setReels] = useState<Reel[]>(() => Array(REEL_COUNT).fill(0).map(generateReel));
    const [spinningReels, setSpinningReels] = useState<boolean[]>(Array(REEL_COUNT).fill(false));
    const [finalSymbolIndexes, setFinalSymbolIndexes] = useState<number[]>(Array(REEL_COUNT).fill(0));
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.IDLE);
    const [lastWin, setLastWin] = useState<number | null>(null);
    const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
    const [musicOn, setMusicOn] = useState(false);
    const [nextStopIndex, setNextStopIndex] = useState(0);
    const [showOops, setShowOops] = useState(false);
    const [oopsImage, setOopsImage] = useState<string | null>(null);
    const [showGameOver, setShowGameOver] = useState(false);
    
    // Audio refs
    const backgroundMusicRef = React.useRef<HTMLAudioElement | null>(null);
    const winSoundRef = React.useRef<HTMLAudioElement | null>(null);
    
    // Calculate current bet based on betIndex (ユーザーが選択したBETを使用)
    // クレジットがBETより少ない場合は、クレジット全額をBETとして使用
    const currentBet = useMemo(() => {
        const selectedBet = BET_AMOUNTS[betIndex];
        return Math.min(selectedBet, credits);
    }, [betIndex, credits]);
    
    // Auto-adjust bet index based on credits (一度上がったBETは下がらない)
    useEffect(() => {
        // クレジットに応じて新しいBETインデックスを計算
        let newBetIndex = 0;
        for (let i = BET_THRESHOLDS.length - 1; i >= 0; i--) {
            if (credits >= BET_THRESHOLDS[i]) {
                newBetIndex = i;
                break;
            }
        }
        
        // 最高到達BETインデックスを更新（下がらない）
        if (newBetIndex > maxBetIndex) {
            setMaxBetIndex(newBetIndex);
            setBetIndex(newBetIndex);
        } else {
            // 現在のBETインデックスは最高到達BETインデックスを超えない
            if (betIndex > maxBetIndex) {
                setBetIndex(maxBetIndex);
            }
        }
    }, [credits, maxBetIndex, betIndex]);
    
    // Update high score when credits increase
    useEffect(() => {
        if (credits > highScore) {
            setHighScore(credits);
            localStorage.setItem(HIGH_SCORE_KEY, credits.toString());
        }
    }, [credits, highScore]);

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

    // Check for game over when credits drop below minimum bet
    useEffect(() => {
        const minimumBet = BET_AMOUNTS[0]; // 最低BET（100）
        // クレジットが最低BET未満の場合はゲームオーバー
        if (gameState === GameStateEnum.IDLE && !showGameOver) {
            if (credits < minimumBet) {
                setShowGameOver(true);
            }
        }
    }, [credits, gameState, showGameOver]);

    const handleSpin = () => {
        // currentBetは常にcredits以下になるので、credits < currentBetのチェックは実質不要だが、安全のため残す
        if (gameState !== GameStateEnum.IDLE || credits < currentBet || showGameOver) return;

        setGameState(GameStateEnum.SPINNING);
        setCredits(prev => prev - currentBet);
        setLastWin(null);
        setWinningLines([]);
        setNextStopIndex(0); // Reset stop index
        setShowOops(false); // Reset oops display
        setOopsImage(null); // Reset oops image
        
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

        const rows = VISIBLE_SYMBOLS;
        const cols = REEL_COUNT;

        // Debug: Log final reel matrix
        console.log('=== Win Check Debug ===');
        console.log('Final Reel Matrix:', finalReelsMatrix.map((reel, idx) =>
            `Reel ${idx}: [${reel.map(s => s.name).join(', ')}]`
        ).join('\n'));

        let totalWinnings = 0;
        const newWinningLines: WinningLine[] = [];
        let lineCounter = 0;

        const getSymbol = (col: number, row: number) => {
            if (col < 0 || col >= cols || row < 0 || row >= rows) {
                return null;
            }
            return finalReelsMatrix[col]?.[row] ?? null;
        };

        const registerWin = (kind: string, symbol: SlotSymbolInfo, positions: Array<{ reelIndex: number; rowIndex: number }>) => {
            const count = positions.length;
            const basePayout = symbol.payouts[count] || 0;
            if (basePayout <= 0) {
                console.log(`[${kind}] Symbol ${symbol.name} matched ${count} but has no payout.`);
                return;
            }

            const payout = basePayout * (currentBet / BET_AMOUNTS[0]);
            if (payout <= 0) {
                return;
            }

            totalWinnings += payout;
            newWinningLines.push({
                lineIndex: lineCounter++,
                symbolId: symbol.id,
                count,
                payout,
                positions,
            });
            console.log(`[${kind}] Symbol: ${symbol.name}, Count: ${count}, Payout: ${payout}, Positions:`, positions);
        };

        // Horizontal checks
        for (let row = 0; row < rows; row++) {
            let col = 0;
            while (col < cols) {
                const symbol = getSymbol(col, row);
                if (!symbol) {
                    col++;
                    continue;
                }

                const positions: Array<{ reelIndex: number; rowIndex: number }> = [{ reelIndex: col, rowIndex: row }];
                let nextCol = col + 1;
                while (nextCol < cols) {
                    const nextSymbol = getSymbol(nextCol, row);
                    if (!nextSymbol || nextSymbol.id !== symbol.id) {
                        break;
                    }
                    positions.push({ reelIndex: nextCol, rowIndex: row });
                    nextCol++;
                }

                if (positions.length >= 3) {
                    registerWin(`Horizontal Row ${row}`, symbol, positions);
                }

                col = nextCol;
            }
        }

        // Vertical checks
        for (let col = 0; col < cols; col++) {
            let row = 0;
            while (row < rows) {
                const symbol = getSymbol(col, row);
                if (!symbol) {
                    row++;
                    continue;
                }

                const positions: Array<{ reelIndex: number; rowIndex: number }> = [{ reelIndex: col, rowIndex: row }];
                let nextRow = row + 1;
                while (nextRow < rows) {
                    const nextSymbol = getSymbol(col, nextRow);
                    if (!nextSymbol || nextSymbol.id !== symbol.id) {
                        break;
                    }
                    positions.push({ reelIndex: col, rowIndex: nextRow });
                    nextRow++;
                }

                if (positions.length >= 3) {
                    registerWin(`Vertical Reel ${col}`, symbol, positions);
                }

                row = nextRow;
            }
        }

        // Diagonal checks (top-left to bottom-right)
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const symbol = getSymbol(col, row);
                if (!symbol) {
                    continue;
                }

                const prevSymbol = getSymbol(col - 1, row - 1);
                if (prevSymbol && prevSymbol.id === symbol.id) {
                    continue; // Already part of a previously counted diagonal
                }

                const positions: Array<{ reelIndex: number; rowIndex: number }> = [{ reelIndex: col, rowIndex: row }];
                let nextCol = col + 1;
                let nextRow = row + 1;
                while (nextCol < cols && nextRow < rows) {
                    const nextSymbol = getSymbol(nextCol, nextRow);
                    if (!nextSymbol || nextSymbol.id !== symbol.id) {
                        break;
                    }
                    positions.push({ reelIndex: nextCol, rowIndex: nextRow });
                    nextCol++;
                    nextRow++;
                }

                if (positions.length >= 3) {
                    registerWin(`Diagonal ↘ start (${col}, ${row})`, symbol, positions);
                }
            }
        }

        // Diagonal checks (bottom-left to top-right)
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const symbol = getSymbol(col, row);
                if (!symbol) {
                    continue;
                }

                const prevSymbol = getSymbol(col - 1, row + 1);
                if (prevSymbol && prevSymbol.id === symbol.id) {
                    continue; // Already counted in this diagonal direction
                }

                const positions: Array<{ reelIndex: number; rowIndex: number }> = [{ reelIndex: col, rowIndex: row }];
                let nextCol = col + 1;
                let nextRow = row - 1;
                while (nextCol < cols && nextRow >= 0) {
                    const nextSymbol = getSymbol(nextCol, nextRow);
                    if (!nextSymbol || nextSymbol.id !== symbol.id) {
                        break;
                    }
                    positions.push({ reelIndex: nextCol, rowIndex: nextRow });
                    nextCol++;
                    nextRow--;
                }

                if (positions.length >= 3) {
                    registerWin(`Diagonal ↗ start (${col}, ${row})`, symbol, positions);
                }
            }
        }

        // Debug: Log winning lines summary
        console.log(`Total Winning Lines: ${newWinningLines.length}`);
        if (newWinningLines.length > 0) {
            newWinningLines.forEach((win, idx) => {
                console.log(`  Win ${idx + 1}: LineIndex=${win.lineIndex}, Symbol=${win.symbolId}, Count=${win.count}, Payout=${win.payout}, Positions:`, win.positions);
            });
        }
        console.log(`Total Winnings: ${totalWinnings}`);

        if (totalWinnings > 0) {
            setLastWin(totalWinnings);
            setCredits(prev => prev + totalWinnings);
            setWinningLines(newWinningLines);
            setShowOops(false);

            // Play win sound
            if (winSoundRef.current) {
                winSoundRef.current.currentTime = 0;
                winSoundRef.current.play().catch(err => {
                    console.log('Win sound play failed:', err);
                });
            }
        } else {
            console.log('No wins detected');
            // Show random oops image when no win
            const oopsImages = [
                '/images/oops/atama.png',
                '/images/oops/ganbare.png',
                '/images/oops/oops.png',
                '/images/oops/pooh.png',
                '/images/oops/tequira.png',
            ];
            const randomImage = oopsImages[Math.floor(Math.random() * oopsImages.length)];
            setOopsImage(randomImage);
            setShowOops(true);
        }
        
        console.log('=== End Win Check ===');

        if (totalWinnings > 0) {
            // Clear winning lines after animation duration to stop the visual effects
            setTimeout(() => {
                setWinningLines([]);
                console.log('Clearing winning lines after animation');
            }, WIN_ANIMATION_DURATION);
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

    // Auto-hide oops image after 1.5 seconds
    useEffect(() => {
        if (showOops) {
            const timer = setTimeout(() => {
                setShowOops(false);
                setOopsImage(null);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [showOops]);

    // Handle game over animation and reset
    useEffect(() => {
        if (showGameOver) {
            const timer = setTimeout(() => {
                // Reset game state
                setCredits(INITIAL_CREDITS);
                setBetIndex(0);
                setMaxBetIndex(0); // BETもリセット
                setGameState(GameStateEnum.IDLE);
                setLastWin(null);
                setWinningLines([]);
                setShowOops(false);
                setOopsImage(null);
                setShowGameOver(false);
                setNextStopIndex(0);
                // Reset reels
                const newReels = Array(REEL_COUNT).fill(0).map(generateReel);
                setReels(newReels);
                setFinalSymbolIndexes(Array(REEL_COUNT).fill(0));
                setSpinningReels(Array(REEL_COUNT).fill(false));
                console.log('Game reset: Credits reset to 500');
            }, 3000); // Wait for animation to complete
            return () => clearTimeout(timer);
        }
    }, [showGameOver]);

    const handleBetChange = (direction: 'up' | 'down') => {
        if (gameState !== GameStateEnum.IDLE) return;
        if (direction === 'up') {
            // 最高到達BETインデックスまでしか上げられない
            setBetIndex(prev => Math.min(prev + 1, maxBetIndex));
        } else {
            // 最高到達BETインデックスより下には下がらない（一度上がったBETは下がらない）
            setBetIndex(prev => Math.max(maxBetIndex, prev - 1));
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
                    {highScore > 0 && (
                        <div className="mt-2 text-xs sm:text-sm md:text-base text-yellow-200">
                            <span className="font-bold">最高得点: </span>
                            <span className="font-game">{highScore}</span>
                        </div>
                    )}
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
                
                {showOops && oopsImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-30">
                        <img 
                            src={oopsImage} 
                            alt="Oops" 
                            className="max-w-[80%] sm:max-w-[60%] md:max-w-[50%] h-auto animate-pulse"
                        />
                    </div>
                )}
                
                {showGameOver && (
                    <div className="absolute inset-0 bg-red-600/90 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
                        <div className="game-over-text absolute whitespace-nowrap">
                            <p className="text-4xl sm:text-6xl md:text-8xl font-game text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
                                GAME OVER
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
                
                <Ranking currentScore={highScore} />
            </div>
        </main>
    );
};

export default App;