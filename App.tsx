import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Problem, Difficulty, BoxerState, FloatingEffect } from './types';
import { generateProblem } from './services/mathService';
import { getFightCommentary } from './services/geminiService';
import { initAudio, playCorrectSound, playWrongSound, playPunchSound, playWinSound, playLoseSound, playTextToSpeech, stopTTS } from './services/soundService';
import HealthBar from './components/HealthBar';
import Boxer from './components/Boxer';
import { Trophy, XCircle, Play, RefreshCw, Volume2, Flame, Swords, Star } from 'lucide-react';

const INITIAL_PLAYER_HP = 20;

export default function App() {
  // Game Logic State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Boxer States
  const [player, setPlayer] = useState<BoxerState>({ hp: INITIAL_PLAYER_HP, maxHp: INITIAL_PLAYER_HP, isHit: false, isAttacking: false });
  const [opponent, setOpponent] = useState<BoxerState>({ hp: 5, maxHp: 5, isHit: false, isAttacking: false });
  
  // UI/FX State
  const [commentary, setCommentary] = useState<string>("欢迎来到数学拳击擂台！");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [effects, setEffects] = useState<FloatingEffect[]>([]);

  // Load High Score on Mount
  useEffect(() => {
    const storedScore = localStorage.getItem('mathBoxingHighScore');
    if (storedScore) {
      setHighScore(parseInt(storedScore, 10));
    }
  }, []);

  const addEffect = (text: string, x: number, y: number, type: 'damage' | 'heal' | 'crit') => {
    const newEffect: FloatingEffect = {
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      type
    };
    setEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== newEffect.id));
    }, 1000);
  };

  const triggerCommentary = async (pHp: number, oHp: number, action: 'correct' | 'wrong' | 'start' | 'win' | 'lose') => {
    const text = await getFightCommentary(pHp, oHp, action);
    if (text) {
      setCommentary(text);
      playTextToSpeech(text);
    }
  };

  const startGame = async () => {
    initAudio();
    stopTTS();
    setGameState(GameState.PLAYING);
    setLevel(1);
    setCombo(0);
    setPlayer({ hp: INITIAL_PLAYER_HP, maxHp: INITIAL_PLAYER_HP, isHit: false, isAttacking: false });
    startLevel(1);
  };

  const startLevel = (lvl: number) => {
    // Difficulty Scaling: HP increases with level
    // Level 1: 5HP, Level 2: 8HP, Level 3: 11HP... max 50HP
    const newMaxHp = Math.min(50, 5 + (lvl - 1) * 3);
    
    setOpponent({ hp: newMaxHp, maxHp: newMaxHp, isHit: false, isAttacking: false });
    setIsProcessing(false);
    
    // Level 1 starts immediately, others might have a transition
    triggerCommentary(player.hp, newMaxHp, 'start');
    nextProblem(difficulty, true);
  };

  const nextProblem = (diff: Difficulty, isFirst = false) => {
    setTimeout(() => {
        const problem = generateProblem(diff);
        setCurrentProblem(problem);
        setFeedbackMessage(null);
    }, isFirst ? 0 : 800);
  };

  const handleAnswer = async (selectedOption: number) => {
    if (isProcessing || !currentProblem) return;
    setIsProcessing(true);

    const isCorrect = selectedOption === currentProblem.answer;

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  const handleCorrectAnswer = useCallback(async () => {
    const newCombo = combo + 1;
    setCombo(newCombo);
    
    // Combo Critical Logic: Every 3rd hit is critical
    const isCrit = newCombo % 3 === 0;
    const damage = isCrit ? 2 : 1;

    setFeedbackMessage(isCrit ? "暴击！！" : "答对了！");
    playCorrectSound(isCrit);

    // Phase 1: Player Attack
    setPlayer(p => ({ ...p, isAttacking: true }));
    
    setTimeout(() => {
       // Phase 2: Opponent Hit
       playPunchSound(isCrit);
       setPlayer(p => ({ ...p, isAttacking: false }));
       
       // Calculate new HP based on current state to ensure accuracy
       setOpponent(currentOpponent => {
         const newOpponentHp = Math.max(0, currentOpponent.hp - damage);
         return { ...currentOpponent, isHit: true, hp: newOpponentHp };
       });

       // Visual Effects
       addEffect(`-${damage}`, 70, 30, isCrit ? 'crit' : 'damage');

       // We need the value for logic, so we calculate it locally as well
       const estimatedNewHp = Math.max(0, opponent.hp - damage);

       // Commentary
       if (estimatedNewHp > 0) {
           triggerCommentary(player.hp, estimatedNewHp, 'correct');
       }

       setTimeout(() => {
          // Check win condition using the functional state to be safe, or just relying on the logic flow
          // Since we are in a closure, 'opponent.hp' is stale (the value before hit).
          // We must use the calculated value 'estimatedNewHp'.
          
          if (estimatedNewHp === 0) {
             handleLevelComplete();
          } else {
             setOpponent(o => ({ ...o, isHit: false }));
             setIsProcessing(false);
             nextProblem(difficulty);
          }
       }, 600);
    }, 300);
  }, [player.hp, opponent.hp, difficulty, combo]);

  const handleLevelComplete = () => {
      // Heal Player slightly
      const healAmount = 3;
      setPlayer(p => {
          const newHp = Math.min(p.maxHp, p.hp + healAmount);
          return { ...p, hp: newHp };
      });
      addEffect(`+${healAmount}`, 20, 30, 'heal');
      
      playWinSound();
      setGameState(GameState.LEVEL_TRANSITION);
      setCommentary(`太棒了！第 ${level} 关挑战成功！准备迎接下一关！`);
      
      setTimeout(() => {
          const nextLvl = level + 1;
          setLevel(nextLvl);
          setGameState(GameState.PLAYING);
          startLevel(nextLvl);
      }, 3000); // 3 seconds rest
  };

  const handleWrongAnswer = useCallback(async () => {
    setCombo(0); // Reset Combo
    setFeedbackMessage("哎哟！");
    playWrongSound();

    // Phase 1: Opponent Attack
    setOpponent(o => ({ ...o, isAttacking: true }));

    setTimeout(() => {
        // Phase 2: Player Hit
        playPunchSound();
        setOpponent(o => ({ ...o, isAttacking: false }));
        
        // Calculate logic values
        const newPlayerHp = Math.max(0, player.hp - 1);
        
        setPlayer(p => ({ ...p, isHit: true, hp: newPlayerHp }));
        addEffect("-1", 20, 30, 'damage');
        triggerCommentary(newPlayerHp, opponent.hp, 'wrong');

        setTimeout(() => {
            if (newPlayerHp === 0) {
                endGame();
            } else {
                setPlayer(p => ({ ...p, isHit: false }));
                setIsProcessing(false);
                nextProblem(difficulty);
            }
        }, 600);
    }, 300);
  }, [player.hp, opponent.hp, difficulty]);

  const endGame = async () => {
     // Check High Score
     if (level > highScore) {
         setHighScore(level);
         localStorage.setItem('mathBoxingHighScore', level.toString());
     }

     setGameState(GameState.GAME_OVER);
     playLoseSound();
     triggerCommentary(0, opponent.hp, 'lose');
  };

  // --- Render Functions ---

  const renderFloatingEffects = () => (
      <>
        {effects.map(effect => (
            <div 
                key={effect.id}
                className={`absolute z-50 pointer-events-none font-black text-4xl animate-pop`}
                style={{ 
                    top: `${effect.y}%`, 
                    left: `${effect.x}%`,
                    animation: 'floatUp 1s ease-out forwards'
                }}
            >
                <span className={`
                    ${effect.type === 'heal' ? 'text-green-400' : ''}
                    ${effect.type === 'damage' ? 'text-red-500' : ''}
                    ${effect.type === 'crit' ? 'text-yellow-400 text-6xl drop-shadow-lg' : ''}
                `} style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                    {effect.text}
                </span>
            </div>
        ))}
        <style>{`
            @keyframes floatUp {
                0% { transform: translateY(0) scale(0.5); opacity: 0; }
                20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                100% { transform: translateY(-60px) scale(1); opacity: 0; }
            }
        `}</style>
      </>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 p-4">
      <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border-4 border-blue-500 shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse"></div>
        
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-6 drop-shadow-sm">
          数学拳击赛
        </h1>
        
        {highScore > 0 && (
            <div className="mb-6 bg-slate-900/50 p-2 rounded-lg border border-yellow-500/30 inline-flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-yellow-200 font-bold">最高记录: 第 {highScore} 关</span>
            </div>
        )}

        <p className="text-slate-300 mb-8 text-lg">
          无尽闯关模式！<br/>
          每连续答对 3 题触发<span className="text-yellow-400 font-bold">暴击</span>！
        </p>
        
        <div className="space-y-4">
            <button 
                onClick={() => { setDifficulty(Difficulty.EASY); startGame(); }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
                <Play size={24} /> 简单模式 (1-5乘法)
            </button>
            <button 
                onClick={() => { setDifficulty(Difficulty.HARD); startGame(); }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
                <Flame size={24} /> 困难模式 (1-9乘法)
            </button>
        </div>
      </div>
    </div>
  );

  const renderEndScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900/90 z-50 fixed inset-0">
            <div className="bg-slate-800 p-10 rounded-3xl border-4 border-red-500 shadow-2xl text-center max-w-md animate-pop">
                <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                <h2 className="text-4xl font-black mb-2 text-white">
                    比赛结束
                </h2>
                <div className="text-yellow-400 text-2xl mb-6 font-bold flex flex-col gap-1">
                    <span>止步于第 {level} 关</span>
                    {level > highScore && <span className="text-sm text-green-400 animate-pulse">创下新纪录！</span>}
                </div>
                <div className="bg-slate-900 p-4 rounded-lg mb-6 text-slate-300 italic">
                    "{commentary}"
                </div>
                <button 
                    onClick={() => { stopTTS(); setGameState(GameState.MENU); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center gap-2 mx-auto"
                >
                    <RefreshCw size={20} /> 返回主菜单
                </button>
            </div>
        </div>
    );
  }

  const renderGame = () => (
    <div className="flex flex-col min-h-screen bg-slate-900 relative">
      {/* Background Arena Detail */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-red-500 rounded-full blur-[100px]"></div>
      </div>

      {/* Header / HUD */}
      <header className="relative z-10 p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto flex justify-between items-start gap-4">
            <HealthBar 
                current={player.hp} 
                max={player.maxHp} 
                isPlayer={true} 
                label="你" 
            />
             <div className="flex flex-col items-center pt-2 shrink-0">
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-yellow-500/50 text-yellow-400 font-bold tracking-widest shadow-lg flex flex-col items-center min-w-[80px]">
                    <span className="text-[10px] sm:text-xs text-slate-400 uppercase">当前关卡</span>
                    <span className="text-xl sm:text-2xl">{level}</span>
                </div>
             </div>
            <HealthBar 
                current={opponent.hp} 
                max={opponent.maxHp} 
                isPlayer={false} 
                label="机器人" 
            />
        </div>
      </header>

      {/* Main Ring Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 w-full max-w-4xl mx-auto">
        
        {/* Combo Indicator - Left Side */}
        {combo > 1 && (
             <div className="absolute left-4 top-1/3 z-20 animate-bounce hidden sm:block">
                <div className="text-5xl font-black italic text-yellow-400 drop-shadow-lg transform -rotate-12">
                    {combo} <span className="text-2xl not-italic text-white">连击!</span>
                </div>
                {combo % 3 === 2 && (
                    <div className="text-sm text-white bg-red-500 px-2 rounded mt-1 animate-pulse">
                        下一击暴击！
                    </div>
                )}
             </div>
        )}
        {/* Mobile Combo */}
        {combo > 1 && (
            <div className="sm:hidden absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
                 <div className="text-xl font-black italic text-yellow-400 drop-shadow-lg">
                    {combo} 连击!
                </div>
            </div>
        )}

        {/* Floating Numbers Layer */}
        {renderFloatingEffects()}

        {/* Level Transition Overlay */}
        {gameState === GameState.LEVEL_TRANSITION && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center animate-pop">
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-5xl font-black text-white mb-2">胜利!</h2>
                    <p className="text-green-400 text-xl font-bold">+3 生命值</p>
                    <p className="text-slate-300 mt-4">正在前往下一关...</p>
                </div>
            </div>
        )}

        {/* Commentary Bubble */}
        <div className="mb-4 bg-slate-800/80 px-6 py-3 rounded-xl border border-slate-600 max-w-2xl text-center shadow-lg transform transition-all mx-4 w-full">
            <div className="flex items-center gap-2 justify-center text-yellow-400 font-bold text-sm uppercase mb-1">
                <Volume2 size={14} /> 解说员
            </div>
            <p className="text-white font-medium md:text-lg min-h-[1.75rem] italic">
                {commentary || "..."}
            </p>
        </div>

        {/* The Boxers */}
        <div className="flex items-end justify-between w-full px-4 md:px-12 mb-8 h-56 sm:h-64 relative">
            <Boxer 
                isPlayer={true} 
                isHit={player.isHit} 
                isAttacking={player.isAttacking} 
                currentHp={player.hp}
                maxHp={player.maxHp}
            />
            
            <div className="self-center flex flex-col items-center opacity-50 absolute left-1/2 transform -translate-x-1/2">
                <Swords className="text-slate-600 w-8 h-8 sm:w-12 sm:h-12" />
                <span className="font-black text-xl sm:text-2xl text-slate-700 italic">VS</span>
            </div>

            <Boxer 
                isPlayer={false} 
                isHit={opponent.isHit} 
                isAttacking={opponent.isAttacking} 
                currentHp={opponent.hp}
                maxHp={opponent.maxHp}
            />
        </div>

        {/* Question Panel */}
        <div className="w-full max-w-2xl px-4">
            {(currentProblem && gameState === GameState.PLAYING) ? (
                 <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border-t-4 border-blue-500 animate-pop relative">
                    {/* Feedback Overlay */}
                    {feedbackMessage && (
                        <div className={`absolute -top-16 left-0 right-0 text-center font-black text-4xl animate-bounce ${feedbackMessage.includes('暴击') ? 'text-yellow-400 scale-125' : feedbackMessage.includes('漂亮') || feedbackMessage.includes('答对') ? 'text-green-400' : 'text-red-400'}`} style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8)' }}>
                            {feedbackMessage}
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <div className="text-5xl md:text-6xl font-black text-white mt-2 font-mono tracking-wider">
                            {currentProblem.question}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {currentProblem.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={isProcessing}
                                className={`
                                    py-4 px-6 rounded-xl text-3xl font-bold font-mono shadow-md transition-all transform
                                    ${isProcessing 
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed scale-95' 
                                        : 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white hover:scale-105 active:scale-95 border-b-4 border-blue-800 hover:border-blue-700'
                                    }
                                `}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                 </div>
            ) : (
                <div className="h-48 flex items-center justify-center text-white text-xl animate-pulse">
                    {gameState === GameState.LEVEL_TRANSITION ? "下一关加载中..." : "准备下一回合..."}
                </div>
            )}
        </div>

      </main>
    </div>
  );

  return (
    <>
      {gameState === GameState.MENU && renderMenu()}
      {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_TRANSITION) && renderGame()}
      {gameState === GameState.GAME_OVER && renderEndScreen()}
    </>
  );
}