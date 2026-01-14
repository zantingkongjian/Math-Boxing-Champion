
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    // @ts-ignore - webkitAudioContext for older safari
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

export const initAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  // Pre-load voices
  if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
  }
};

export const stopTTS = () => {
  if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
  }
};

export const playTextToSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Stop previous speech
    stopTTS();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; 
    utterance.pitch = 1.0; 
    utterance.lang = 'zh-CN'; 
    
    // Improved Voice Selection Strategy
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: 
    // 1. "Google" Chinese (usually very natural)
    // 2. "Microsoft" Chinese
    // 3. Any Chinese
    let selectedVoice = voices.find(v => v.name.includes("Google") && (v.lang.includes("zh") || v.lang.includes("CN")));
    
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.name.includes("Microsoft") && (v.lang.includes("zh") || v.lang.includes("CN")));
    }
    
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.includes("zh") || v.lang.includes("CN"));
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
};

export const playPunchSound = (isCrit = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Thud
  osc.type = isCrit ? 'square' : 'triangle'; // Square wave for crit punch sounds "heavier"
  osc.frequency.setValueAtTime(isCrit ? 100 : 150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isCrit ? 0.3 : 0.15));

  gain.gain.setValueAtTime(isCrit ? 0.8 : 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isCrit ? 0.3 : 0.15));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + (isCrit ? 0.3 : 0.15));
};

export const playCorrectSound = (isCombo = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // High pitch ding
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isCombo ? 1000 : 800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(isCombo ? 1500 : 1200, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playWrongSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Low buzz
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playWinSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    stopTTS(); 

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Extended arpeggio
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = now + i * 0.1;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        osc.start(startTime);
        osc.stop(startTime + 0.4);
    });
};

export const playLoseSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    stopTTS();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 1.5);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
};
