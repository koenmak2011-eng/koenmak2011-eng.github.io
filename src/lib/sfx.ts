// Web Audio API sound effects engine
const ctx = () => {
  if (!(window as any).__sfxCtx) {
    (window as any).__sfxCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__sfxCtx as AudioContext;
};

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const c = ctx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  source.connect(gain);
  gain.connect(c.destination);
  source.start();
}

export const SFX = {
  move: () => playTone(300, 0.08, "triangle", 0.12),
  capture: () => {
    playTone(200, 0.15, "sawtooth", 0.1);
    setTimeout(() => playTone(150, 0.1, "square", 0.08), 50);
  },
  check: () => {
    playTone(600, 0.12, "square", 0.12);
    setTimeout(() => playTone(800, 0.15, "square", 0.12), 100);
  },
  checkmate: () => {
    [0, 100, 200, 300, 400].forEach((d, i) =>
      setTimeout(() => playTone(400 + i * 100, 0.2, "sawtooth", 0.1), d)
    );
  },
  chaos: () => {
    playNoise(0.3, 0.15);
    setTimeout(() => playTone(100, 0.4, "sawtooth", 0.12), 100);
    setTimeout(() => playTone(80, 0.3, "square", 0.1), 250);
  },
  nuke: () => {
    playNoise(0.8, 0.2);
    [0, 150, 300].forEach(d => setTimeout(() => playTone(60 + Math.random() * 40, 0.5, "sawtooth", 0.15), d));
  },
  remark: () => playTone(500, 0.06, "sine", 0.06),
  select: () => playTone(400, 0.05, "triangle", 0.08),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.3, "sine", 0.12), i * 150)
    );
  },
  lose: () => {
    [400, 350, 300, 200].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.3, "sawtooth", 0.08), i * 200)
    );
  },
  crown: () => {
    playTone(800, 0.15, "sine", 0.1);
    setTimeout(() => playTone(1000, 0.2, "sine", 0.12), 120);
  },
  gambling: () => {
    [0, 80, 160].forEach(d => setTimeout(() => playTone(300 + Math.random() * 300, 0.08, "triangle", 0.1), d));
  },
  playerChaos: () => {
    playTone(700, 0.1, "square", 0.1);
    setTimeout(() => playTone(900, 0.15, "square", 0.12), 80);
    setTimeout(() => playNoise(0.15, 0.1), 150);
  },
};
