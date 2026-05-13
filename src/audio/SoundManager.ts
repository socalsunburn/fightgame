/**
 * Procedural 8-bit sound effects via Web Audio API.
 * AudioContext is created lazily on first use (satisfies browser autoplay policy).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(
  freq: number, endFreq: number,
  type: OscillatorType,
  duration: number,
  vol: number = 0.25,
): void {
  const c = getCtx();
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), c.currentTime + duration);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.01);
}

function noise(duration: number, vol: number = 0.2): void {
  const c      = getCtx();
  const frames = Math.ceil(c.sampleRate * duration);
  const buf    = c.createBuffer(1, frames, c.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src  = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buf;
  src.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.start(c.currentTime);
}

export const SoundManager = {
  hit(): void {
    tone(220, 80, 'square', 0.08, 0.28);
    noise(0.06, 0.12);
  },

  heavyHit(): void {
    tone(160, 40, 'square', 0.15, 0.35);
    noise(0.12, 0.20);
  },

  jump(): void {
    tone(220, 480, 'square', 0.12, 0.18);
  },

  doubleJump(): void {
    tone(320, 640, 'square', 0.10, 0.15);
  },

  land(): void {
    tone(120, 60, 'square', 0.07, 0.20);
    noise(0.05, 0.10);
  },

  shield(): void {
    tone(600, 400, 'triangle', 0.06, 0.22);
    noise(0.04, 0.08);
  },

  projectile(): void {
    tone(520, 180, 'sawtooth', 0.10, 0.18);
  },

  ko(): void {
    const c = getCtx();
    // Three-note descending crash
    [440, 330, 220].forEach((f, i) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = 'square';
      const t = c.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.2, t + 0.4);
      gain.gain.setValueAtTime(0.30, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    noise(0.15, 0.25);
  },
};
