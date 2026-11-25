// audio.js — every sound in The Gilded Skillet is synthesised with the
// WebAudio API: no audio files, nothing to load. A tiny kitchen band of
// oscillators and filtered noise: a knock for the knife, a hiss for the
// grill, a bell for the pass, a till chime when an order is served.

export class SoundKitchen {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Browsers only let audio start after a gesture; call this from the
  // first click or key press.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, gain = 0.05, freq = 6000, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(this.ctx.destination);
    src.start(t0);
  }

  pickup() { this.tone(520, 0.07, 'triangle', 0.1, 760); }
  place() { this.tone(300, 0.06, 'triangle', 0.1, 210); }
  chop() { this.noise(0.05, 0.16, 1800); this.tone(140, 0.05, 'square', 0.06, 90); }
  sizzle() { this.noise(0.35, 0.045, 7000); }
  cooked() { this.tone(880, 0.1, 'sine', 0.1); this.tone(1318, 0.14, 'sine', 0.1, null, 0.09); }
  burnt() { this.tone(160, 0.3, 'sawtooth', 0.08, 70); }
  plate() { this.tone(660, 0.06, 'triangle', 0.1); this.noise(0.04, 0.05, 3200); }
  bell() { this.tone(1568, 0.35, 'sine', 0.12); this.tone(2093, 0.3, 'sine', 0.05, null, 0.02); }
  till() {
    this.tone(1046, 0.09, 'square', 0.06);
    this.tone(1318, 0.09, 'square', 0.06, null, 0.08);
    this.tone(1568, 0.16, 'square', 0.06, null, 0.16);
  }
  groan() { this.tone(220, 0.25, 'sawtooth', 0.07, 130); }
  trash() { this.noise(0.12, 0.1, 500); this.tone(180, 0.12, 'triangle', 0.08, 90); }
  dayEnd() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.1, null, i * 0.11));
  }
}
