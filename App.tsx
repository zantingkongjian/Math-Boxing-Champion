
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Problem, Difficulty, BoxerState, FloatingEffect } from './types';
import { generateProblem } from './services/mathService';
import { getFightCommentary } from './services/geminiService';
import { initAudio, playCorrectSound, playWrongSound, playPunchSound, playWinSound, playLoseSound, playTextToSpeech, stopTTS } from './services/soundService';
import HealthBar from './components/HealthBar';
import Boxer from './components/Boxer';
import RingBackground from './components/RingBackground';
import { Trophy, XCircle, Play, RefreshCw, Flame, Swords, Zap, CheckCircle2, Star, Target, ShieldCheck } from 'lucide-react';

const INITIAL_PLAYER_HP = 20;

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [shakeScreen, setShakeScreen] = useState(false);

  const [player, setPlayer] = useState<BoxerState>({ hp: INITIAL_PLAYER_HP, maxHp: INITIAL_PLAYER_HP, isHit: false, isAttacking: false });
  const [opponent, setOpponent] = useState<BoxerState>({ hp: 5, maxHp: 5, isHit: false, isAttacking: false });
  
  const [commentary, setCommentary] = useState<string>("准备好开始战斗了吗？");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [effects, setEffects] = useState<FloatingEffect[]>([]);
  const [showAnswer, setShowAnswer] = useState<number | null>(null);

  useEffect(() => {
    const storedScore = localStorage.getItem('mathBoxingHighScore');
    if (storedScore) setHighScore(parseInt(storedScore, 10));
  }, []);

  const triggerVibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const addEffect = (text: string, x: number, y: number, type: 'damage' | 'heal' | 'crit') => {
    const newEffect: FloatingEffect = { id: Date.now() + Math.random(), text, x, y, type };
    setEffects(prev => [...prev, newEffect]);
    setTimeout(() => setEffects(prev => prev.filter(e => e.id !== newEffect.id)), 800);
  };

  const triggerCommentary = async (pHp: number, oHp: number, action: 'correct' | 'wrong' | 'start' | 'win' | 'lose') => {
    const text = await getFightCommentary(pHp, oHp, action);
    if (text) {
      setCommentary(text);
      playTextToSpeech(text);
    }
  };

  const handleAnswer = async (selectedOption: number) => {
    if (isProcessing || !currentProblem) return;
    setIsProcessing(true);

    const isCorrect = selectedOption === currentProblem.answer;
    if (isCorrect) {
      setTotalCorrect(prev => prev + 1);
      handleCorrectAnswer();
    } else {
      setShowAnswer(currentProblem.answer);
      handleWrongAnswer();
    }
  };

  const startGame = async (diff: Difficulty) => {
    setDifficulty(diff);
    initAudio();
    stopTTS();
    setGameState(GameState.PLAYING);
    setLevel(1);
    setCombo(0);
    setMaxCombo(0);
    setTotalCorrect(0);
    setPlayer({ hp: INITIAL_PLAYER_HP, maxHp: INITIAL_PLAYER_HP, isHit: false, isAttacking: false });
    startLevel(1);
  };

  const startLevel = (lvl: number) => {
    const newMaxHp = Math.min(60, 5 + (lvl - 1) * 4);
    setOpponent({ hp: newMaxHp, maxHp: newMaxHp, isHit: false, isAttacking: false });
    setIsProcessing(false);
    triggerCommentary(player.hp, newMaxHp, 'start');
    nextProblem(difficulty, true);
  };

  const nextProblem = (diff: Difficulty, isFirst = false) => {
    setTimeout(() => {
        setCurrentProblem(generateProblem(diff));
        setFeedbackMessage(null);
        setShowAnswer(null);
        setIsProcessing(false);
    }, isFirst ? 0 : 800);
  };

  const handleCorrectAnswer = useCallback(async () => {
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    const isCrit = newCombo % 3 === 0;
    const damage = isCrit ? 3 : 1;

    setFeedbackMessage(isCrit ? "暴击！！" : "真棒！");
    triggerVibrate(isCrit ? [40, 20, 40] : 30);
    playCorrectSound(isCrit);
    setPlayer(p => ({ ...p, isAttacking: true }));
    
    setTimeout(() => {
       playPunchSound(isCrit);
       setPlayer(p => ({ ...p, isAttacking: false }));
       setOpponent(o => ({ ...o, isHit: true, hp: Math.max(0, o.hp - damage) }));
       addEffect(`-${damage}`, 70, 30, isCrit ? 'crit' : 'damage');

       setTimeout(() => {
          setOpponent(o => {
            if (o.hp <= 0) {
               handleLevelComplete();
               return o;
            }
            triggerCommentary(player.hp, o.hp, 'correct');
            nextProblem(difficulty);
            return { ...o, isHit: false };
          });
       }, 500);
    }, 200);
  }, [player.hp, opponent.hp, difficulty, combo, maxCombo]);

  const handleLevelComplete = () => {
      setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 5) }));
      addEffect(`+5`, 30, 30, 'heal');
      playWinSound();
      setGameState(GameState.LEVEL_TRANSITION);
      setCommentary(`第 ${level} 关完胜！`);
      setTimeout(() => {
          const nextLvl = level + 1;
          setLevel(nextLvl);
          setGameState(GameState.PLAYING);
          startLevel(nextLvl);
      }, 2000);
  };

  const handleWrongAnswer = useCallback(async () => {
    setCombo(0); 
    setFeedbackMessage("当心！");
    setShakeScreen(true);
    triggerVibrate([80, 50, 80]);
    playWrongSound();
    setOpponent(o => ({ ...o, isAttacking: true }));

    setTimeout(() => setShakeScreen(false), 300);

    setTimeout(() => {
        playPunchSound();
        setOpponent(o => ({ ...o, isAttacking: false }));
        const newHp = Math.max(0, player.hp - 2);
        setPlayer(p => ({ ...p, isHit: true, hp: newHp }));
        addEffect("-2", 30, 30, 'damage');
        
        setTimeout(() => {
            if (newHp === 0) {
                endGame();
            } else {
                setPlayer(p => ({ ...p, isHit: false }));
                triggerCommentary(newHp, opponent.hp, 'wrong');
                nextProblem(difficulty);
            }
        }, 500);
    }, 200);
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

  const renderMenu = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-[#070b14] overflow-hidden">
      {/* 增强动态背景 */}
      <RingBackground />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_60%)] pointer-events-none animate-pulse"></div>

      <div className="z-10 relative flex flex-col items-center max-w-sm sm:max-w-lg w-full animate-pop-in">
        {/* 顶部动态徽章 */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full animate-ping"></div>
          <div className="relative p-4 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 shadow-[0_10px_20px_rgba(234,179,8,0.5)] border-2 border-white/20">
            <Trophy className="text-white w-10 h-10 drop-shadow-md" />
          </div>
        </div>

        {/* 核心标题：分层 + 倾斜 + 阴影 */}
        <div className="text-center mb-10 relative">
          <h1 className="flex flex-col items-center select-none">
            <span className="text-6xl sm:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] leading-none">
              数学
            </span>
            <span className="text-7xl sm:text-[9rem] font-black text-blue-500 italic tracking-tighter leading-none -mt-3 transform -skew-x-12 drop-shadow-[0_15px_30px_rgba(59,130,246,0.6)]">
              拳击
            </span>
          </h1>
          <div className="mt-4 px-6 py-2 bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 rounded-full inline-flex items-center gap-2">
            <Zap size={16} className="text-yellow-400 fill-yellow-400" />
            <p className="text-blue-200 text-xs sm:text-lg font-black tracking-[0.2em] italic uppercase">冠军锦标赛</p>
            <Zap size={16} className="text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        
        {/* 内容交互区：高保真玻璃卡片 */}
        <div className="premium-glass p-8 sm:p-12 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] w-full text-center border-t border-white/20 relative group overflow-hidden">
          {/* 内部装饰光 */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>
          
          {highScore > 0 && (
              <div className="mb-10 flex flex-col items-center">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">最高连胜纪录</div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full"></div>
                    <div className="relative flex items-center gap-3 px-8 py-3 bg-slate-900/90 rounded-2xl border border-yellow-500/40 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
                        <Star size={20} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-2xl font-black italic">第 {highScore} 关</span>
                    </div>
                  </div>
              </div>
          )}
          
          <div className="space-y-6">
              {/* 3D 深度按钮：简单模式 */}
              <button 
                onClick={() => startGame(Difficulty.EASY)} 
                className="group relative w-full perspective-1000"
              >
                <div className="relative bg-blue-700 rounded-2xl transition-all duration-100 group-hover:bg-blue-600 group-active:translate-y-2">
                  <div className="absolute inset-0 bg-blue-900 translate-y-2 rounded-2xl -z-10"></div>
                  <div className="flex items-center justify-center gap-4 py-5 px-6 border-t border-white/20 rounded-2xl shadow-xl">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <ShieldCheck className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-white text-xl sm:text-2xl font-black">简单模式</div>
                      <div className="text-blue-200 text-[10px] font-bold opacity-60">新手上路 (1-5)</div>
                    </div>
                    <Play size={20} className="ml-auto text-white opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>

              {/* 3D 深度按钮：挑战模式 */}
              <button 
                onClick={() => startGame(Difficulty.HARD)} 
                className="group relative w-full perspective-1000"
              >
                <div className="relative bg-slate-700 rounded-2xl transition-all duration-100 group-hover:bg-slate-600 group-active:translate-y-2">
                  <div className="absolute inset-0 bg-slate-900 translate-y-2 rounded-2xl -z-10"></div>
                  <div className="flex items-center justify-center gap-4 py-5 px-6 border-t border-white/10 rounded-2xl shadow-xl">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                      <Flame className="text-red-400" size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-white text-xl sm:text-2xl font-black">挑战模式</div>
                      <div className="text-slate-300 text-[10px] font-bold opacity-60">巅峰对决 (1-9)</div>
                    </div>
                    <Zap size={20} className="ml-auto text-white opacity-40 group-hover:text-yellow-400 transition-all" />
                  </div>
                </div>
              </button>
          </div>
          
          {/* 版权装饰 */}
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-3 opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">ARCADE CLASSIC</p>
            <div className="flex gap-4">
               <div className="w-1 h-1 bg-white rounded-full"></div>
               <div className="w-1 h-1 bg-white rounded-full"></div>
               <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* 底部点缀：竞技氛围 */}
        <div className="mt-12 flex justify-between w-full px-4 opacity-10">
          <Swords size={40} className="transform rotate-12" />
          <Target size={40} className="transform -rotate-12 animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`h-full w-full flex flex-col items-center justify-center bg-slate-900 ${shakeScreen ? 'shake-anim' : ''} no-bounce`}
    >
      {gameState === GameState.MENU ? renderMenu() : (
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative bg-[#0f172a] shadow-2xl overflow-hidden">
          <RingBackground />
          
          <header className="game-header relative z-20 p-3 sm:p-6 pb-1 shrink-0 pt-[env(safe-area-inset-top,0.75rem)]">
            <div className="flex justify-between items-center gap-2 sm:gap-12">
                <HealthBar current={player.hp} max={player.maxHp} isPlayer={true} label="我方" />
                <div className="flex flex-col items-center shrink-0">
                    <div className="bg-slate-950/80 px-2 py-1 sm:px-4 sm:py-2 rounded-xl border border-blue-500/30 text-white font-black shadow-2xl">
                        <span className="text-[7px] sm:text-[10px] text-blue-500 block text-center uppercase tracking-widest leading-none mb-0.5">第</span>
                        <span className="text-base sm:text-2xl block leading-none">{level} <span className="text-[10px] sm:text-xs font-normal">关</span></span>
                    </div>
                </div>
                <HealthBar current={opponent.hp} max={opponent.maxHp} isPlayer={false} label="对手" />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center relative z-10 px-2 sm:px-6 w-full min-h-0 overflow-hidden">
            <div className="w-full flex justify-between items-center mt-1 z-20 shrink-0">
              <div className={`transition-all duration-500 ${combo > 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  <div className="text-2xl sm:text-5xl font-black italic text-yellow-400 drop-shadow-[0_4px_10px_rgba(234,179,8,0.5)] transform -rotate-12 flex items-baseline gap-1">
                      {combo}<span className="text-xs sm:text-xl text-white not-italic font-bold tracking-tighter">连击!</span>
                  </div>
              </div>
              <div className="flex-1 max-w-[60%] premium-glass px-2 py-1 rounded-lg text-center shadow-lg relative overflow-hidden mx-auto">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <p className="text-white font-bold text-[10px] sm:text-sm italic truncate">{commentary}</p>
              </div>
              <div className="w-10 sm:w-20"></div>
            </div>

            <div className="flex-[1.5] min-h-[120px] sm:min-h-[200px] w-full flex items-end justify-between px-2 sm:px-24 relative mb-2 mt-2 overflow-visible">
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                    {effects.map(e => (
                        <div key={e.id} className="absolute animate-float-up" style={{ left: `${e.x}%`, top: `${e.y}%` }}>
                             <span className={`text-4xl sm:text-6xl font-black ${e.type==='heal'?'text-green-400':e.type==='crit'?'text-yellow-400 scale-125':'text-red-500'}`} style={{ textShadow: '2px 2px 0px #000' }}>{e.text}</span>
                        </div>
                    ))}
                </div>
                
                <Boxer isPlayer={true} isHit={player.isHit} isAttacking={player.isAttacking} currentHp={player.hp} maxHp={player.maxHp} />
                <div className="self-center opacity-5 flex flex-col items-center">
                    <Swords className="w-8 h-8 sm:w-16 text-slate-400" />
                </div>
                <Boxer isPlayer={false} isHit={opponent.isHit} isAttacking={opponent.isAttacking} currentHp={opponent.hp} maxHp={opponent.maxHp} />
            </div>

            <div className="flex-1 w-full max-w-2xl px-1 sm:px-4 pb-4 sm:pb-8 shrink-0 mb-[env(safe-area-inset-bottom,0.5rem)] flex flex-col justify-end">
                {currentProblem && (
                     <div className="math-card premium-glass rounded-[1.25rem] sm:rounded-[2rem] p-3 sm:p-6 shadow-2xl ring-1 ring-white/10 relative">
                        {feedbackMessage && (
                          <div className={`absolute -top-6 left-0 right-0 text-center font-black text-xs sm:text-2xl animate-bounce ${feedbackMessage.includes('暴击')?'text-yellow-400':'text-green-400'}`}>
                            {feedbackMessage}
                          </div>
                        )}
                        <div className="text-center mb-2 sm:mb-6">
                            <div className="math-question text-3xl sm:text-6xl font-black text-white font-mono tracking-tighter py-1 sm:py-4 rounded-xl inline-block px-4 sm:px-10">
                                {currentProblem.question}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            {currentProblem.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    disabled={isProcessing}
                                    className={`relative py-3 sm:py-6 rounded-lg sm:rounded-xl text-xl sm:text-4xl font-black font-mono transition-all 
                                        ${showAnswer === option ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] scale-105 z-10' : 
                                          isProcessing && showAnswer !== null ? 'bg-slate-800 opacity-40' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_4px_0_rgb(30,58,138)]'} 
                                        text-white active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed`}
                                >
                                    {option}
                                    <span className="absolute top-1 left-2 text-[7px] sm:text-[10px] text-white/30 font-sans italic">{idx + 1}</span>
                                </button>
                            ))}
                        </div>
                     </div>
                )}
            </div>

            {gameState === GameState.LEVEL_TRANSITION && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                    <div className="text-center animate-pop">
                        <CheckCircle2 className="w-20 h-20 sm:w-32 text-green-400 mx-auto mb-4" />
                        <h2 className="text-6xl sm:text-8xl font-black text-white italic tracking-tighter">KO!</h2>
                    </div>
                </div>
            )}
          </main>
          
          {gameState === GameState.GAME_OVER && (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900/95 z-50 fixed inset-0 p-4 backdrop-blur-xl">
                <div className="premium-glass p-6 sm:p-10 rounded-[2rem] text-center max-w-xs sm:max-w-md w-full animate-pop my-auto border-red-500/20">
                    <XCircle className="w-12 h-12 sm:w-20 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl sm:text-4xl font-black mb-6 text-white italic tracking-tighter">挑战失败</h2>
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg">
                            <span className="text-slate-400 font-bold uppercase text-[9px] sm:text-xs">最高关卡</span>
                            <span className="text-white text-lg sm:text-xl font-black">{level}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg">
                            <span className="text-slate-400 font-bold uppercase text-[9px] sm:text-xs">最佳连击</span>
                            <span className="text-orange-500 text-lg sm:text-xl font-black flex items-center gap-2">
                                <Zap size={16} /> {maxCombo}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => { stopTTS(); setGameState(GameState.MENU); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 sm:py-4 rounded-lg transition-all flex items-center justify-center gap-2 text-base sm:text-lg shadow-[0_5px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none">
                        <RefreshCw size={18} /> 重新开始
                    </button>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
