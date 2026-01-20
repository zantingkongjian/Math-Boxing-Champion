
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
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 
    utterance.lang = 'zh-CN'; 
    
    // Improved Voice Selection Strategy for Mandarin Only
    const voices = window.speechSynthesis.getVoices();
    
    // Filter out Cantonese (HK) and Taiwan voices
    const isMandarin = (v: SpeechSynthesisVoice) => {
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();
        // Check for zh-CN specifically, avoid HK and TW
        const isZh = lang.includes("zh");
        const isNotCantonese = !lang.includes("hk") && !name.includes("cantonese") && !name.includes("hong kong");
        const isNotTaiwan = !lang.includes("tw") && !name.includes("taiwan");
        return isZh && isNotCantonese && isNotTaiwan;
    };

    const mandarinVoices = voices.filter(isMandarin);
    
    // Priority:
    // 1. Google Mandarin (zh-CN)
    // 2. Microsoft Xiaoxiao/Yunxi (Commonly used Mandarin)
    // 3. Any remaining zh-CN voice
    let selectedVoice = mandarinVoices.find(v => v.name.includes("Google") && v.lang.includes("CN"));
    
    if (!selectedVoice) {
        selectedVoice = mandarinVoices.find(v => v.name.includes("Microsoft") || v.name.includes("Xiaoxiao") || v.name.includes("Yunxi"));
    }
    
    if (!selectedVoice) {
        selectedVoice = mandarinVoices.find(v => v.lang.includes("CN") || v.lang === "zh-CN");
    }
    
    if (!selectedVoice && mandarinVoices.length > 0) {
        selectedVoice = mandarinVoices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang; // Use the specific sub-lang if found
    }

    window.speechSynthesis.speak(utterance);
};

export const playPunchSound = (isCrit = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Thud
  osc.type = isCrit ? 'square' : 'triangle'; 
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
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; 
    
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
