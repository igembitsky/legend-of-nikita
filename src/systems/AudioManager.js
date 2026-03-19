export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMusic = null;
    this.musicKey = null;
    this.masterVolume = 1;
    this.muted = false;
  }

  playMusic(key, config = {}) {
    const { volume = 0.5, loop = true, fadeIn = 1000 } = config;

    if (this.musicKey === key && this.currentMusic?.isPlaying) return;

    this.stopMusic(fadeIn > 0 ? fadeIn : 0);

    if (!this.scene.cache.audio.exists(key)) return;

    this.currentMusic = this.scene.sound.add(key, {
      volume: 0,
      loop,
    });
    this.musicKey = key;
    this.currentMusic.play();

    if (fadeIn > 0) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: this.muted ? 0 : volume * this.masterVolume,
        duration: fadeIn,
      });
    } else {
      this.currentMusic.setVolume(this.muted ? 0 : volume * this.masterVolume);
    }
  }

  stopMusic(fadeDuration = 1000) {
    if (!this.currentMusic) return;

    const music = this.currentMusic;
    this.currentMusic = null;
    this.musicKey = null;

    if (fadeDuration > 0 && music.isPlaying) {
      this.scene.tweens.add({
        targets: music,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => music.destroy(),
      });
    } else {
      music.destroy();
    }
  }

  playSFX(key, config = {}) {
    const { volume = 0.7 } = config;
    if (!this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, {
      volume: this.muted ? 0 : volume * this.masterVolume,
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentMusic) {
      this.currentMusic.setVolume(this.muted ? 0 : 0.5 * this.masterVolume);
    }
    return this.muted;
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.currentMusic && !this.muted) {
      this.currentMusic.setVolume(0.5 * this.masterVolume);
    }
  }
}
