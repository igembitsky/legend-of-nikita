import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';

export class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ControlsScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'crawl');
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.dismissed = false;

    const { width, height } = this.cameras.main;

    // Starfield background
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.6)
      );
      star.speed = Phaser.Math.FloatBetween(0.05, 0.3);
      this.stars.push(star);
    }

    const centerX = width / 2;
    let delay = 300;

    // Igor portrait + name
    const portrait = this.add.image(centerX, height * 0.14, 'portrait-igor')
      .setOrigin(0.5)
      .setDisplaySize(56, 56)
      .setAlpha(0);
    this._fadeIn(portrait, delay);

    const speaker = this.add.text(centerX, height * 0.14 + 38, 'IGOR', {
      fontSize: '11px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);
    this._fadeIn(speaker, delay);

    // Intro text
    delay += 500;
    const intro = this.add.text(centerX, height * 0.26, '"Hey Nikita \u2014 I made this little game for you.\nHere\'s everything you need to know."', {
      fontSize: '13px',
      color: '#aaaacc',
      fontFamily: 'monospace',
      fontStyle: 'italic',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);
    this._fadeIn(intro, delay);

    // Controls
    const controls = [
      ['Arrow Keys', 'Move around the world'],
      ['SPACE', 'Interact with things nearby'],
      ['ENTER', 'Advance dialogue & confirm choices'],
      ['\u2191 \u2193', 'Steer when the road calls'],
      ['P', 'Pause & catch your breath'],
    ];

    const startY = height * 0.40;
    const lineHeight = 36;

    controls.forEach(([key, action], i) => {
      delay += 500;
      const y = startY + i * lineHeight;

      const keyText = this.add.text(centerX - 20, y, key, {
        fontSize: '14px',
        color: '#ccaa44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5).setAlpha(0);

      const dash = this.add.text(centerX, y, '\u2014', {
        fontSize: '14px',
        color: '#333333',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5).setAlpha(0);

      const actionText = this.add.text(centerX + 20, y, action, {
        fontSize: '13px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setAlpha(0);

      this._fadeIn(keyText, delay);
      this._fadeIn(dash, delay);
      this._fadeIn(actionText, delay);
    });

    // Outro text
    delay += 800;
    const outro = this.add.text(centerX, height * 0.72, '"Happy birthday. Now go live your day."', {
      fontSize: '12px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);
    this._fadeIn(outro, delay);

    // Pulsing prompt
    delay += 600;
    const prompt = this.add.text(centerX, height * 0.82, 'PRESS SPACE TO BEGIN', {
      fontSize: '11px',
      color: '#555555',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 0, to: 0.8 },
      delay,
      duration: 600,
    });

    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.4, to: 0.8 },
      delay: delay + 600,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Input — skip/continue at any time
    this.input.keyboard.on('keydown-SPACE', () => this._dismiss());
    this.input.keyboard.on('keydown-ENTER', () => this._dismiss());
  }

  _fadeIn(target, delay) {
    this.tweens.add({
      targets: target,
      alpha: 1,
      y: target.y,
      duration: 500,
      delay,
      ease: 'Power2',
      props: {
        alpha: { from: 0, to: 1 },
        y: { from: target.y + 6, to: target.y },
      },
    });
  }

  update() {
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.cameras.main.height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.cameras.main.width);
      }
    }
  }

  _dismiss() {
    if (this.dismissed) return;
    this.dismissed = true;
    this.audio.playConfirm();
    this.transition.fadeToScene('BedroomScene');
  }
}
