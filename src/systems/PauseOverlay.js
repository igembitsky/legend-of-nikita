import { SaveSystem } from './SaveSystem.js';

export class PauseOverlay {
  constructor(scene, getStateCallback) {
    this.scene = scene;
    this.paused = false;
    this.overlay = null;
    this.pauseText = null;
    this.resumeHint = null;
    this.getState = getStateCallback; // () => { scene, flags, position? }
    this.save = new SaveSystem();

    scene.input.keyboard.on('keydown-P', () => this.toggle());
    scene.input.keyboard.on('keydown-S', () => this._manualSave());
  }

  _manualSave() {
    if (!this.getState) return;
    const state = this.getState();
    if (state) {
      this.save.save(state);
      // Brief save indicator
      const { width } = this.scene.cameras.main;
      const indicator = this.scene.add.text(width - 20, 80, 'SAVED', {
        fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
      }).setOrigin(1, 0).setDepth(9999).setScrollFactor(0);
      this.scene.tweens.add({
        targets: indicator, alpha: 0, delay: 1000, duration: 500,
        onComplete: () => indicator.destroy(),
      });
    }
  }

  toggle() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause() {
    if (this.paused) return;
    this.paused = true;

    const { width, height } = this.scene.cameras.main;

    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(9000).setScrollFactor(0);

    this.pauseText = this.scene.add.text(width / 2, height / 2, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9001).setScrollFactor(0);

    this.resumeHint = this.scene.add.text(width / 2, height / 2 + 50, 'Press P to resume', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(9001).setScrollFactor(0);

    this.scene.physics?.pause();
    this.scene.time.paused = true;
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;

    if (this.overlay) { this.overlay.destroy(); this.overlay = null; }
    if (this.pauseText) { this.pauseText.destroy(); this.pauseText = null; }
    if (this.resumeHint) { this.resumeHint.destroy(); this.resumeHint = null; }

    this.scene.physics?.resume();
    this.scene.time.paused = false;
  }

  isPaused() {
    return this.paused;
  }
}
