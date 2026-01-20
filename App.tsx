
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
    const newMaxHp = Math.min(50, 5 + (lvl - 1) * 3);
    setOpponent({ hp: newMaxHp, maxHp: newMaxHp, isHit: false, isAttacking: false });
    setIsProcessing(false);
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
    const isCrit = newCombo % 3 === 0;
    const damage = isCrit ? 2 : 1;

    setFeedbackMessage(isCrit ? "暴击！！" : "答对了！");
    playCorrectSound(isCrit);

    setPlayer(p => ({ ...p, isAttacking: true }));
    
    setTimeout(() => {
       playPunchSound(isCrit);
       setPlayer(p => ({ ...p, isAttacking: false }));
       
       setOpponent(currentOpponent => {
         const newOpponentHp = Math.max(0, currentOpponent.hp - damage);
         return { ...currentOpponent, isHit: true, hp: newOpponentHp };
       });

       addEffect(`-${damage}`, 70, 30, isCrit ? 'crit' : 'damage');

       const estimatedNewHp = Math.max(0, opponent.hp - damage);

       if (estimatedNewHp > 0) {
           triggerCommentary(player.hp, estimatedNewHp, 'correct');
       }

       setTimeout(() => {
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
      }, 3000);
  };

  const handleWrongAnswer = useCallback(async () => {
    setCombo(0); 
    setFeedbackMessage("哎哟！");
    playWrongSound();

    setOpponent(o => ({ ...o, isAttacking: true }));

    setTimeout(() => {
        playPunchSound();
        setOpponent(o => ({ ...o, isAttacking: false }));
        
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
     if (level > highScore) {
         setHighScore(level);
         localStorage.setItem('mathBoxingHighScore', level.toString());
     }
     setGameState(GameState.GAME_OVER);
     playLoseSound();
     triggerCommentary(0, opponent.hp, 'lose');
  };

  const renderFloatingEffects = () => (
      <>
        {effects.map(effect => (
            <div 
                key={effect.id}
                className={`absolute z-50 pointer-events-none font-black text-3xl sm:text-4xl animate-pop`}
                style={{ 
                    top: `${effect.y}%`, 
                    left: `${effect.x}%`,
                    animation: 'floatUp 1s ease-out forwards'
                }}
            >
                <span className={`
                    ${effect.type === 'heal' ? 'text-green-400' : ''}
                    ${effect.type === 'damage' ? 'text-red-500' : ''}
                    ${effect.type === 'crit' ? 'text-yellow-400 text-5xl sm:text-6xl drop-shadow-lg' : ''}
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
      <div className="bg-slate-800/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl border-4 border-blue-500 shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-6 drop-shadow-sm">
          数学拳击赛
        </h1>
        {highScore > 0 && (
            <div className="mb-6 bg-slate-900/50 p-2 rounded-lg border border-yellow-500/30 inline-flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-yellow-200 font-bold">最高关卡: {highScore}</span>
            </div>
        )}
        <p className="text-slate-300 mb-8 text-base sm:text-lg">
          无尽闯关模式！<br/>
          连续答对 3 题触发<span className="text-yellow-400 font-bold">暴击</span>！
        </p>
        <div className="space-y-4">
            <button 
                onClick={() => { setDifficulty(Difficulty.EASY); startGame(); }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
                <Play size={24} /> 简单模式 (1-5)
            </button>
            <button 
                onClick={() => { setDifficulty(Difficulty.HARD); startGame(); }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
                <Flame size={24} /> 困难模式 (1-9)
            </button>
        </div>
      </div>
    </div>
  );

  const renderEndScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900/95 z-50 fixed inset-0 p-4">
        <div className="bg-slate-800 p-8 rounded-3xl border-4 border-red-500 shadow-2xl text-center max-w-md w-full animate-pop">
            <XCircle className="w-16 h-16 sm:w-20 sm:h-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black mb-2 text-white">比赛结束</h2>
            <div className="text-yellow-400 text-xl sm:text-2xl mb-6 font-bold">止步于第 {level} 关</div>
            <button 
                onClick={() => { stopTTS(); setGameState(GameState.MENU); }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-transform flex items-center justify-center gap-2 mx-auto"
            >
                <RefreshCw size={20} /> 返回主菜单
            </button>
        </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex flex-col h-screen max-h-screen bg-slate-900 relative overflow-hidden">
      <header className="relative z-10 p-3 sm:p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2 sm:gap-4">
            <HealthBar current={player.hp} max={player.maxHp} isPlayer={true} label="你" />
             <div className="flex flex-col items-center shrink-0 min-w-[60px] sm:min-w-[80px]">
                <div className="bg-slate-900 px-3 py-1 sm:py-2 rounded-xl border border-yellow-500/50 text-yellow-400 font-bold shadow-lg flex flex-col items-center">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase">第几关</span>
                    <span className="text-lg sm:text-2xl">{level}</span>
                </div>
             </div>
            <HealthBar current={opponent.hp} max={opponent.maxHp} isPlayer={false} label="机器人" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center relative z-10 p-2 sm:p-4 w-full max-w-4xl mx-auto overflow-hidden">
        {combo > 1 && (
            <div className="absolute top-2 sm:top-auto sm:left-4 sm:top-1/3 z-20 animate-bounce">
                <div className="text-2xl sm:text-5xl font-black italic text-yellow-400 drop-shadow-lg transform sm:-rotate-12">
                    {combo} <span className="text-lg sm:text-2xl not-italic text-white">连击!</span>
                </div>
            </div>
        )}

        {renderFloatingEffects()}

        {gameState === GameState.LEVEL_TRANSITION && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center animate-pop">
                    <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-4xl sm:text-5xl font-black text-white">胜利!</h2>
                    <p className="text-green-400 text-lg font-bold">生命值 +3</p>
                </div>
            </div>
        )}

        <div className="w-full max-w-lg mb-2 sm:mb-4 bg-slate-800/80 px-4 py-2 sm:px-6 sm:py-3 rounded-xl border border-slate-600 text-center shadow-lg shrink-0">
            <p className="text-white font-medium text-sm sm:text-lg italic line-clamp-2">
                {commentary || "..."}
            </p>
        </div>

        <div className="flex items-end justify-between w-full px-2 sm:px-12 mb-4 sm:mb-8 h-32 sm:h-56 shrink-0 relative">
            <Boxer 
                isPlayer={true} 
                isHit={player.isHit} 
                isAttacking={player.isAttacking} 
                currentHp={player.hp}
                maxHp={player.maxHp}
            />
            <div className="self-center flex flex-col items-center opacity-30">
                <Swords className="text-slate-600 w-6 h-6 sm:w-12 sm:h-12" />
                <span className="font-black text-lg sm:text-2xl text-slate-700 italic">VS</span>
            </div>
            <Boxer 
                isPlayer={false} 
                isHit={opponent.isHit} 
                isAttacking={opponent.isAttacking} 
                currentHp={opponent.hp}
                maxHp={opponent.maxHp}
            />
        </div>

        <div className="w-full max-w-2xl px-2 shrink-0">
            {(currentProblem && gameState === GameState.PLAYING) ? (
                 <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl border-t-4 border-blue-500 relative">
                    {feedbackMessage && (
                        <div className={`absolute -top-12 sm:-top-16 left-0 right-0 text-center font-black text-2xl sm:text-4xl animate-bounce ${feedbackMessage.includes('暴击') ? 'text-yellow-400' : 'text-green-400'}`}>
                            {feedbackMessage}
                        </div>
                    )}
                    <div className="text-center mb-4 sm:mb-6">
                        <div className="text-4xl sm:text-6xl font-black text-white font-mono tracking-wider">
                            {currentProblem.question}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {currentProblem.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={isProcessing}
                                className="py-3 sm:py-4 rounded-xl text-2xl sm:text-4xl font-bold font-mono shadow-md transition-all bg-gradient-to-b from-blue-500 to-blue-600 text-white active:scale-95 border-b-4 border-blue-800 disabled:opacity-50"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                 </div>
            ) : (
                <div className="h-40 sm:h-48 flex items-center justify-center text-white text-lg animate-pulse">
                    正在准备...
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
