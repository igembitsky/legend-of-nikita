import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.transition.fadeIn(800);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);

    // Resume AudioContext on first interaction (browser autoplay policy)
    this.input.keyboard.once('keydown', () => {
      if (this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
    });

    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.audio.playMusic('title');

    const { width, height } = this.cameras.main;

    // Starfield
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      star.speed = Phaser.Math.FloatBetween(0.1, 0.5);
      this.stars.push(star);
    }

    // Title
    this.add.text(width / 2, height * 0.3, 'THE LEGEND OF NIKITA', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(width / 2, height * 0.3 + 60, 'A Day in the Life', {
      fontSize: '24px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(width / 2, height * 0.3 + 95, 'A Tribute to 31', {
      fontSize: '18px',
      color: '#888899',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // Fade in title texts
    const texts = this.children.list.filter(c => c.type === 'Text');
    texts.forEach((text, i) => {
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 1000,
        delay: 500 + i * 400,
      });
    });

    // Menu options
    const menuY = height * 0.7;
    this.menuItems = [];
    this.selectedIndex = 0;

    if (this.save.hasSave()) {
      this.menuItems.push({ text: 'Continue', action: 'continue' });
    }
    this.menuItems.push({ text: 'New Game', action: 'new' });

    this.menuTexts = this.menuItems.map((item, i) => {
      return this.add.text(width / 2, menuY + i * 40, item.text, {
        fontSize: '22px',
        color: '#666666',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0);
    });

    // Fade in menu after title
    this.menuTexts.forEach((text, i) => {
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 600,
        delay: 2000 + i * 200,
      });
    });

    // Blinking prompt
    this.promptText = this.add.text(width / 2, height * 0.88, 'Press Enter to Start', {
      fontSize: '16px',
      color: '#555555',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 0, to: 1 },
      delay: 2500,
      duration: 600,
      yoyo: true,
      repeat: -1,
      hold: 1000,
    });

    // Input
    this.inputReady = false;
    this.time.delayedCall(2000, () => { this.inputReady = true; });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.inputReady) return;
      this._select();
    });

    this.input.keyboard.on('keydown-UP', () => this._moveMenu(-1));
    this.input.keyboard.on('keydown-DOWN', () => this._moveMenu(1));
    this.input.keyboard.on('keydown-W', () => this._moveMenu(-1));
    this.input.keyboard.on('keydown-S', () => this._moveMenu(1));

    this._updateMenu();
  }

  update() {
    // Drift stars
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.cameras.main.height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.cameras.main.width);
      }
    }
  }

  _moveMenu(dir) {
    if (this.menuItems.length <= 1) return;
    this.selectedIndex = (this.selectedIndex + dir + this.menuItems.length) % this.menuItems.length;
    this._updateMenu();
  }

  _updateMenu() {
    this.menuTexts.forEach((text, i) => {
      text.setColor(i === this.selectedIndex ? '#ffffff' : '#666666');
      text.setText(i === this.selectedIndex ? '▶ ' + this.menuItems[i].text : '  ' + this.menuItems[i].text);
    });
  }

  _select() {
    this.audio.playConfirm();
    const item = this.menuItems[this.selectedIndex];
    if (item.action === 'continue') {
      const saveData = this.save.load();
      if (saveData) {
        this.transition.fadeToScene(saveData.scene, { flags: saveData.flags });
        return;
      }
    }
    // New game
    this.save.clear();
    this.transition.fadeToScene('IntroCrawlScene');
  }
}
