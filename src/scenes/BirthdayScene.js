import Phaser from 'phaser';

export class BirthdayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BirthdayScene' });
  }

  create() {
    this.add.text(640, 360, 'BirthdayScene - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
