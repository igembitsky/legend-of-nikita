import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const { width, height } = this.cameras.main;
    const barWidth = 400;
    const barHeight = 30;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    const bgBar = this.add.rectangle(width / 2, barY, barWidth, barHeight, 0x333333).setOrigin(0.5);
    const progressBar = this.add.rectangle(barX, barY - barHeight / 2, 0, barHeight, 0x4488ff).setOrigin(0, 0);
    const loadingText = this.add.text(width / 2, barY - 40, 'Loading...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = barWidth * value;
    });

    this.load.on('complete', () => {
      bgBar.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // Photo placeholder
    this.load.image('photo', 'photo-placeholder.png');

    // Load real assets here as they become available
    // this.load.image('nikita-pajamas', 'assets/sprites/nikita-pajamas.png');
    // etc.
  }

  create() {
    // Generate placeholder textures for development
    this._generatePlaceholders();

    this.scene.start('TitleScene');
  }

  _generatePlaceholders() {
    // Player sprites (32x48 colored rectangles)
    this._makeRect('nikita-pajamas', 32, 48, 0x6688bb);
    this._makeRect('nikita-dressed', 32, 48, 0x3388dd);
    this._makeRect('nikita-gi', 32, 48, 0xffffff);

    // Wife
    this._makeRect('wife-sleeping', 64, 32, 0xcc88aa);
    this._makeRect('wife-awake', 32, 48, 0xcc88aa);
    this._makeRect('wife-standing', 32, 48, 0xdd99bb);

    // Cat
    this._makeRect('cat', 24, 16, 0x222222);

    // Igor
    this._makeRect('igor', 32, 48, 0xdddd00);

    // Sensei
    this._makeRect('sensei', 32, 48, 0xaa4444);

    // Vehicles
    this._makeRect('tesla', 40, 64, 0x4444cc);
    this._makeRect('cyclist', 24, 40, 0xcc8844);
    this._makeRect('car-1', 40, 64, 0xcc4444);
    this._makeRect('car-2', 40, 64, 0x44cc44);

    // Office
    this._makeRect('office-npc', 28, 40, 0x888888);
    this._makeRect('office-robot', 28, 40, 0x88cccc);
    this._makeRect('dojo-pair', 48, 48, 0x666666);

    // Props
    this._makeRect('closet', 48, 64, 0x8b6940);
    this._makeRect('door', 40, 48, 0x6a5030);
    this._makeRect('fridge', 48, 64, 0xcccccc);
    this._makeRect('coffee-machine', 32, 40, 0x664422);
    this._makeRect('food-bowl', 24, 16, 0xcc8844);
    this._makeRect('banana', 24, 24, 0xffcc00);
    this._makeRect('coffee-cup', 20, 24, 0x8b4513);
    this._makeRect('money', 16, 16, 0x44cc44);

    // Bed
    this._makeRect('bed', 128, 80, 0x5c3a1e);
  }

  _makeRect(key, w, h, color) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(color);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
