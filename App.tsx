import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SYMBOLS, REEL_COUNT, VISIBLE_SYMBOLS, INITIAL_CREDITS, BET_AMOUNTS, BET_THRESHOLDS, REEL_SPIN_DURATION, REEL_STOP_DELAY, WIN_ANIMATION_DURATION } from './constants';
import type { SlotSymbolInfo, Reel, GameState, WinningLine } from './types';
import { GameState as GameStateEnum } from './types';
import ReelComponent from './components/Reel';
import ControlPanel from './components/ControlPanel';
import PayoutTable from './components/PayoutTable';
import Ranking from './components/Ranking';
import StampModal, { STAMPS } from './components/StampModal';

const HIGH_SCORE_KEY = 'ikamonogatari_high_score';
const STAMP_MILESTONES_KEY = 'ikamonogatari_stamp_milestones';

// スタンプがもらえるスコアのマイルストーン
const STAMP_MILESTONES = [5000, 10000, 20000, 30000, 50000];

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
    
    // Load achieved milestones from localStorage
    const [achievedMilestones, setAchievedMilestones] = useState<number[]>(() => {
        const saved = localStorage.getItem(STAMP_MILESTONES_KEY);
        return saved ? JSON.parse(saved) : [];
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
    const [showStamp, setShowStamp] = useState(false);
    const [currentStamp, setCurrentStamp] = useState<string | null>(null);
    const [isHurryMode, setIsHurryMode] = useState(false);
    
    // Audio refs
    const backgroundMusicRef = React.useRef<HTMLAudioElement | null>(null);
    const winSoundRef = React.useRef<HTMLAudioElement | null>(null);
    const gameOverSoundRef = React.useRef<HTMLAudioElement | null>(null);
    const currentMusicFileRef = React.useRef<string>('');
    
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
    
    // Helper function to give a stamp
    const giveStamp = useCallback(() => {
        // 既に獲得したスタンプを取得
        const savedStamps = JSON.parse(localStorage.getItem('ikamonogatari_stamps') || '[]');
        
        // まだ獲得していないスタンプを取得
        const uncollectedStamps = STAMPS.filter(stamp => !savedStamps.includes(stamp));
        
        let stampToGive: string | null = null;
        
        if (uncollectedStamps.length > 0) {
            // 未獲得のスタンプがある場合は、その中からランダムに選択
            stampToGive = uncollectedStamps[Math.floor(Math.random() * uncollectedStamps.length)];
        } else {
            // すべてのスタンプを獲得済みの場合は、既に獲得したスタンプからランダムに選択（重複OK）
            stampToGive = STAMPS[Math.floor(Math.random() * STAMPS.length)];
        }
        
        // スタンプを表示
        if (stampToGive) {
            setCurrentStamp(stampToGive);
            setShowStamp(true);
            
            // 獲得したスタンプをlocalStorageに保存（重複チェック）
            if (!savedStamps.includes(stampToGive)) {
                savedStamps.push(stampToGive);
                localStorage.setItem('ikamonogatari_stamps', JSON.stringify(savedStamps));
            }
        }
    }, []);
    
    // Update high score when credits increase
    useEffect(() => {
        if (credits > highScore) {
            setHighScore(credits);
            localStorage.setItem(HIGH_SCORE_KEY, credits.toString());
            
            // ハイスコア更新時にスタンプを配布
            giveStamp();
        }
    }, [credits, highScore, giveStamp]);
    
    // Check for milestone achievements
    useEffect(() => {
        // 達成したマイルストーンを確認
        const newMilestones = STAMP_MILESTONES.filter(milestone => 
            credits >= milestone && !achievedMilestones.includes(milestone)
        );
        
        if (newMilestones.length > 0) {
            // 新しいマイルストーンを達成した場合、スタンプを配布
            giveStamp();
            
            // 達成したマイルストーンを保存
            const updatedMilestones = [...achievedMilestones, ...newMilestones];
            setAchievedMilestones(updatedMilestones);
            localStorage.setItem(STAMP_MILESTONES_KEY, JSON.stringify(updatedMilestones));
        }
    }, [credits, achievedMilestones, giveStamp]);

    // Initialize background music on component mount
    useEffect(() => {
        if (!backgroundMusicRef.current) {
            backgroundMusicRef.current = new Audio('/sounds/casino.mp3');
            backgroundMusicRef.current.loop = true;
            backgroundMusicRef.current.volume = 0.5;
            currentMusicFileRef.current = '/sounds/casino.mp3';
            
            // 音楽がONの場合は再生
            if (musicOn) {
                backgroundMusicRef.current.play().catch(err => {
                    console.log('Background music play failed:', err);
                });
            }
        }

        // Cleanup on unmount
        return () => {
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.pause();
                backgroundMusicRef.current = null;
                currentMusicFileRef.current = '';
            }
        };
    }, []);

    // Update hurry mode status based on credits
    useEffect(() => {
        const newIsHurry = credits >= currentBet && credits < currentBet * 2;
        setIsHurryMode(newIsHurry);
    }, [credits, currentBet]);

    // Switch music when hurry mode changes
    useEffect(() => {
        if (!backgroundMusicRef.current) return;
        
        const musicFile = isHurryMode ? '/sounds/hurry.mp3' : '/sounds/casino.mp3';
        
        // 既に同じ音楽が再生中の場合は何もしない
        if (currentMusicFileRef.current === musicFile) {
            return;
        }
        
        // 現在の音楽を停止
        const wasPlaying = !backgroundMusicRef.current.paused;
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
        
        // 新しい音楽を読み込む
        backgroundMusicRef.current = new Audio(musicFile);
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = 0.5;
        currentMusicFileRef.current = musicFile;
        
        // 音楽がONだった場合は新しい音楽を再生
        if (wasPlaying && musicOn) {
            backgroundMusicRef.current.play().catch(err => {
                console.log('Background music play failed:', err);
            });
        }
    }, [isHurryMode]);

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
        
        // Initialize game over sound
        gameOverSoundRef.current = new Audio('/sounds/GameOver.mp3');
        gameOverSoundRef.current.volume = 0.7;
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

            // ペイアウトを計算（BETの倍率を掛ける）
            const payout = Math.floor(basePayout * (currentBet / BET_AMOUNTS[0]));
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
            // バックミュージックを一時停止
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.pause();
            }
            
            // GameOver.mp3を再生
            let cleanupGameOverSound: (() => void) | null = null;
            if (gameOverSoundRef.current) {
                gameOverSoundRef.current.currentTime = 0;
                
                // GameOver.mp3の再生が終わったら、casino.mp3に戻す
                const handleGameOverEnd = () => {
                    // バックミュージックをcasino.mp3に戻す
                    if (backgroundMusicRef.current) {
                        backgroundMusicRef.current.pause();
                        backgroundMusicRef.current = null;
                    }
                    backgroundMusicRef.current = new Audio('/sounds/casino.mp3');
                    backgroundMusicRef.current.loop = true;
                    backgroundMusicRef.current.volume = 0.5;
                    currentMusicFileRef.current = '/sounds/casino.mp3';
                    
                    // 音楽がONの場合は再生
                    if (musicOn) {
                        backgroundMusicRef.current.play().catch(err => {
                            console.log('Background music play failed:', err);
                        });
                    }
                };
                
                gameOverSoundRef.current.onended = handleGameOverEnd;
                gameOverSoundRef.current.play().catch(err => {
                    console.log('Game over sound play failed:', err);
                });
                
                // クリーンアップでonendedハンドラーを削除
                cleanupGameOverSound = () => {
                    if (gameOverSoundRef.current) {
                        gameOverSoundRef.current.onended = null;
                    }
                };
            }
            
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
            
            // クリーンアップ関数をまとめる
            return () => {
                clearTimeout(timer);
                if (cleanupGameOverSound) {
                    cleanupGameOverSound();
                }
            };
        }
    }, [showGameOver, musicOn]);

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
                
                {showStamp && currentStamp && (
                    <StampModal
                        stampUrl={currentStamp}
                        onClose={() => {
                            setShowStamp(false);
                            setCurrentStamp(null);
                        }}
                    />
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