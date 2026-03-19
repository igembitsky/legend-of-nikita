import Phaser from 'phaser';

export class DrivingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DrivingScene' });
  }

  create() {
    this.add.text(640, 360, 'DrivingScene - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
