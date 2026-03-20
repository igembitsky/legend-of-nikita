export class ProceduralAudio {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = scene.sound.context;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3;
    this.muted = false;
    this.currentMusic = null;
    this.musicInterval = null;
  }

  // === SFX Methods ===

  playFanfare() {
    // Zelda-style item get fanfare
    const now = this.audioContext.currentTime;
    this._playTone(523.25, now, 0.15, 'square');      // C5
    this._playTone(659.25, now + 0.15, 0.15, 'square'); // E5
    this._playTone(783.99, now + 0.3, 0.15, 'square');  // G5
    this._playTone(1046.5, now + 0.45, 0.4, 'square');  // C6
  }

  playBlip() {
    const now = this.audioContext.currentTime;
    this._playTone(800, now, 0.05, 'square', 0.1);
  }

  playCrash() {
    this._playNoise(0.3, 0.8);
  }

  playAlarm() {
    const now = this.audioContext.currentTime;
    for (let i = 0; i < 6; i++) {
      this._playTone(880, now + i * 0.2, 0.1, 'sawtooth', 0.3);
      this._playTone(440, now + i * 0.2 + 0.1, 0.1, 'sawtooth', 0.3);
    }
  }

  playMoney() {
    const now = this.audioContext.currentTime;
    this._playTone(1200, now, 0.05, 'square', 0.15);
    this._playTone(1600, now + 0.05, 0.08, 'square', 0.15);
  }

  playMeow() {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.linearRampToValueAtTime(500, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playFootstep() {
    this._playNoise(0.03, 0.08);
  }

  playDoorOpen() {
    const now = this.audioContext.currentTime;
    this._playTone(200, now, 0.1, 'triangle', 0.15);
    this._playTone(300, now + 0.1, 0.15, 'triangle', 0.15);
  }

  playConfirm() {
    const now = this.audioContext.currentTime;
    this._playTone(600, now, 0.08, 'square', 0.12);
    this._playTone(900, now + 0.08, 0.12, 'square', 0.12);
  }

  playFirework() {
    const now = this.audioContext.currentTime;
    this._playNoise(0.1, 0.15);
    this._playTone(Math.floor(Math.random() * 700) + 800, now + 0.05, 0.2, 'sine', 0.1);
  }

  playHit() {
    const now = this.audioContext.currentTime;
    this._playNoise(0.08, 0.3);
    this._playTone(150, now, 0.1, 'sawtooth', 0.2);
  }

  playCrawlHit() {
    // Dramatic orchestral hit — layered brass-like chord with long decay
    const now = this.audioContext.currentTime;
    const hitNotes = [
      { freq: 65.41, type: 'sawtooth', vol: 0.35 },   // C2 - deep bass
      { freq: 130.81, type: 'sawtooth', vol: 0.3 },    // C3 - low brass
      { freq: 196.00, type: 'square', vol: 0.2 },      // G3 - fifth
      { freq: 261.63, type: 'sawtooth', vol: 0.25 },   // C4 - mid brass
      { freq: 329.63, type: 'square', vol: 0.15 },     // E4 - major third
      { freq: 523.25, type: 'sawtooth', vol: 0.12 },   // C5 - high octave
    ];
    for (const note of hitNotes) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now);
      gain.gain.setValueAtTime(note.vol, now);
      gain.gain.setValueAtTime(note.vol, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.1);
    }
    // Add noise burst for attack transient
    this._playNoise(0.08, 0.4);
  }

  // === Music Methods ===
  // Simple looping note sequences using setInterval

  playMusic(trackName) {
    this.stopMusic();
    const tracks = {
      title: { notes: [262, 294, 330, 262, 0, 262, 294, 330, 262, 0, 330, 349, 392, 0, 330, 349, 392, 0], tempo: 300, wave: 'triangle', volume: 0.08 },
      crawl: { notes: [392, 440, 494, 523, 587, 659, 587, 523, 494, 440, 392, 0, 0, 0, 523, 587, 659, 698, 784, 698, 659, 587, 523, 0, 0, 0], tempo: 250, wave: 'sawtooth', volume: 0.06 },
      bedroom: { notes: [262, 0, 294, 0, 262, 0, 247, 0, 262, 0, 0, 0, 294, 0, 262, 0], tempo: 400, wave: 'sine', volume: 0.05 },
      kitchen: { notes: [523, 587, 659, 587, 523, 0, 494, 523, 587, 523, 494, 0, 440, 494, 523, 0], tempo: 200, wave: 'triangle', volume: 0.07 },
      driving: { notes: [330, 330, 392, 392, 440, 440, 392, 0, 330, 330, 392, 392, 494, 494, 440, 0], tempo: 150, wave: 'square', volume: 0.06 },
      dojo: { notes: [294, 330, 349, 294, 0, 349, 392, 440, 392, 349, 0, 294, 330, 349, 392, 0], tempo: 220, wave: 'sawtooth', volume: 0.06 },
      office: { notes: [165, 196, 220, 262, 0, 247, 220, 196, 165, 0, 196, 220, 262, 294, 0, 0], tempo: 180, wave: 'square', volume: 0.06 },
      home: { notes: [523, 0, 494, 0, 440, 0, 392, 0, 440, 0, 494, 0, 523, 0, 0, 0], tempo: 350, wave: 'sine', volume: 0.06 },
      birthday: { notes: [523, 523, 587, 523, 698, 659, 0, 523, 523, 587, 523, 784, 698, 0, 523, 523, 1047, 880, 698, 659, 587, 0, 932, 932, 880, 698, 784, 698, 0, 0], tempo: 180, wave: 'square', volume: 0.08 },
    };

    const track = tracks[trackName];
    if (!track || this.muted) return;

    let noteIndex = 0;
    this.currentMusic = trackName;
    this.musicInterval = setInterval(() => {
      if (this.muted) return;
      const freq = track.notes[noteIndex % track.notes.length];
      if (freq > 0) {
        this._playTone(freq, this.audioContext.currentTime, track.tempo / 1000 * 0.8, track.wave, track.volume);
      }
      noteIndex++;
    }, track.tempo);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusic = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.masterGain.gain.value = this.muted ? 0 : 0.3;
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  // === Internal Helpers ===

  _playTone(freq, startTime, duration, type = 'square', volume = 0.15) {
    if (this.muted) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  _playNoise(duration, volume = 0.2) {
    if (this.muted) return;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  destroy() {
    this.stopMusic();
  }
}
