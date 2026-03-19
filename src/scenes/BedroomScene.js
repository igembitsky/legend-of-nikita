import Phaser from 'phaser';

export class BedroomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BedroomScene' });
  }

  create() {
    this.add.text(640, 360, 'BedroomScene - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
