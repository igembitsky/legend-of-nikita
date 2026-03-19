import Phaser from 'phaser';

export class KitchenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KitchenScene' });
  }

  create() {
    this.add.text(640, 360, 'KitchenScene - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
