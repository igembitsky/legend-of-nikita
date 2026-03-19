import Phaser from 'phaser';

export class DojoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DojoScene' });
  }

  create() {
    this.add.text(640, 360, 'DojoScene - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
