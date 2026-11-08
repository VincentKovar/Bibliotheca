/**
 * Pure Web Audio API Procedural Synthesizer for Bibliotheca
 * Zero external audio files or network dependencies.
 */

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.35;
  private rainVolume: number = 0.25;
  private ambientTimer: number | null = null;
  private isMusicPlaying: boolean = false;
  private isRainPlaying: boolean = false;

  private init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.connect(this.masterGain);
  }

  public ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  // Pentatonic scale frequencies in Hz
  // C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
  private pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

  public playBookShelved(combo: number) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const baseIdx = Math.min(combo % 6, this.pentatonicNotes.length - 3);
    const notesToPlay = [
      this.pentatonicNotes[baseIdx],
      this.pentatonicNotes[baseIdx + 1],
      this.pentatonicNotes[baseIdx + 2],
    ];

    if (combo >= 4) {
      notesToPlay.push(this.pentatonicNotes[baseIdx + 3] || 880);
    }

    const startTime = this.ctx.currentTime;
    notesToPlay.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Warm analog synth tone: triangle mixed with gentle square harmonics
      osc.type = i === notesToPlay.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400 + combo * 200, startTime + i * 0.07);

      const noteTime = startTime + i * 0.07;
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.3, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  public playBookPickup() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playComboBreak() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playVintageRestoration() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const now = this.ctx.currentTime;

    arpeggio.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.25, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  public playTeaBrewing() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Kettle gentle whistle
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(880, now);
    whistle.frequency.exponentialRampToValueAtTime(1174, now + 0.35);

    whistleGain.gain.setValueAtTime(0.001, now);
    whistleGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    whistle.connect(whistleGain);
    whistleGain.connect(this.sfxGain);
    whistle.start(now);
    whistle.stop(now + 0.5);

    // Warm ceramic cup clink
    const clink = this.ctx.createOscillator();
    const clinkGain = this.ctx.createGain();
    clink.type = 'triangle';
    clink.frequency.setValueAtTime(1760, now + 0.3);

    clinkGain.gain.setValueAtTime(0.2, now + 0.3);
    clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    clink.connect(clinkGain);
    clinkGain.connect(this.sfxGain);
    clink.start(now + 0.3);
    clink.stop(now + 0.75);
  }

  public playUpgradeUnlock() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const chords = [
      [392.00, 493.88, 587.33], // G Major
      [440.00, 554.37, 659.25], // A Major
      [523.25, 659.25, 783.99, 1046.50] // C Major with high C
    ];

    const now = this.ctx.currentTime;
    chords.forEach((chord, step) => {
      const stepTime = now + step * 0.18;
      chord.forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, stepTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, stepTime);

        gain.gain.setValueAtTime(0.001, stepTime);
        gain.gain.linearRampToValueAtTime(0.15, stepTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(stepTime);
        osc.stop(stepTime + 0.5);
      });
    });
  }

  public playClockChime(isNight: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freq = isNight ? 220 : 330;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  public playButtonClick() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Cozy Lo-Fi ambient music synthesis
  public startAmbientMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.scheduleNextAmbientChord();
  }

  public stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.ambientTimer !== null) {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  private chordProgressions = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
    [110.00, 146.83, 174.61, 220.00], // Am7
    [146.83, 174.61, 220.00, 261.63], // Dm7
    [98.00, 130.81, 164.81, 196.00],  // G7sus
    [123.47, 155.56, 185.00, 233.08], // Bm7b5
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
  ];

  private chordIndex = 0;

  private scheduleNextAmbientChord() {
    if (!this.isMusicPlaying) return;

    this.playAmbientChord(this.chordProgressions[this.chordIndex]);
    this.chordIndex = (this.chordIndex + 1) % this.chordProgressions.length;

    // Schedule next chord in 4.5 to 6.5 seconds
    const interval = 4800 + Math.random() * 1200;
    this.ambientTimer = window.setTimeout(() => {
      this.scheduleNextAmbientChord();
    }, interval);
  }

  private playAmbientChord(frequencies: number[]) {
    this.ensureContext();
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const duration = 4.2;

    frequencies.forEach((freq, i) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft warm sine/triangle blend
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      // Low pass to remove harsh edges, simulating tape warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + Math.random() * 150, now);

      const noteTime = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.06, noteTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.1);
    });
  }

  // Procedural Cozy Rain ambience (soft pink noise filtered to simulate raindrops against window glass)
  public startRainAmbience() {
    this.ensureContext();
    if (!this.ctx || !this.rainGain || this.isRainPlaying) return;
    this.isRainPlaying = true;

    // Create 3 seconds of pink noise buffer to loop seamlessly
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;

    // Dual filtering for warm patter sound through leaded glass
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(850, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.rainSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.rainGain);

    this.rainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.rainGain.gain.linearRampToValueAtTime(this.rainVolume, this.ctx.currentTime + 1.5);

    this.rainSource.start();
  }

  public stopRainAmbience() {
    if (!this.isRainPlaying || !this.rainGain || !this.ctx) return;
    this.isRainPlaying = false;
    this.rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);

    setTimeout(() => {
      if (this.rainSource && !this.isRainPlaying) {
        try {
          this.rainSource.stop();
          this.rainSource.disconnect();
        } catch {
          // ignore
        }
        this.rainSource = null;
      }
    }, 600);
  }
}

export const synthAudio = new SynthAudioEngine();
