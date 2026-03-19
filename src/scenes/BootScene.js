import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Placeholder — asset loading will be added as assets are created
  }

  create() {
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading complete!',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);

    // Will transition to TitleScene once it exists
    this.time.delayedCall(500, () => {
      if (this.scene.manager.keys.TitleScene) {
        this.scene.start('TitleScene');
      }
    });
  }
}
