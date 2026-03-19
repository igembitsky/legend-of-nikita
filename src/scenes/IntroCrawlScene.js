import Phaser from 'phaser';

export class IntroCrawlScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroCrawlScene' });
  }

  create() {
    this.add.text(640, 360, 'IntroCrawlScene - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
