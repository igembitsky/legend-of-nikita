import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';

export class BirthdayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BirthdayScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(1000);
    AtmosphereManager.apply(this, 'birthday');
    this.audio.playMusic('birthday');

    const { width, height } = this.cameras.main;

    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

    // Fireworks — continuous particle bursts
    this._createFireworks(width, height);

    // Confetti
    this._createConfetti(width, height);

    // Balloons rising
    this._createBalloons(width, height);

    // Title text
    const title = this.add.text(width / 2, height * 0.25, 'HAPPY BIRTHDAY NIKITA', {
      fontSize: '52px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });

    // Subtitle
    this.add.text(width / 2, height * 0.35, "YOU'RE A FUCKING LEGEND", {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Photo placeholder frame — preserve aspect ratio
    const maxSize = 280;
    const photoY = height * 0.6;

    if (this.textures.exists('photo')) {
      const tex = this.textures.get('photo').getSourceImage();
      const scale = Math.min(maxSize / tex.width, maxSize / tex.height);
      const dispW = tex.width * scale;
      const dispH = tex.height * scale;

      this.add.rectangle(width / 2, photoY, dispW + 16, dispH + 16, 0xffcc00).setDepth(10);
      this.add.rectangle(width / 2, photoY, dispW + 8, dispH + 8, 0x000000).setDepth(11);
      this.add.image(width / 2, photoY, 'photo')
        .setDisplaySize(dispW, dispH).setDepth(12);
    } else {
      this.add.rectangle(width / 2, photoY, maxSize + 16, maxSize + 16, 0xffcc00).setDepth(10);
      this.add.rectangle(width / 2, photoY, maxSize + 8, maxSize + 8, 0x000000).setDepth(11);
      this.add.rectangle(width / 2, photoY, maxSize, maxSize, 0x333333).setDepth(12);
      this.add.text(width / 2, photoY, 'PHOTO\nHERE', {
        fontSize: '20px', color: '#666666', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5).setDepth(13);
    }

    // Year badge
    this.add.text(width / 2, height * 0.82, '~ 31 ~', {
      fontSize: '36px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  _createFireworks(width, height) {
    // Repeated firework bursts
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        this.audio.playFirework();
        const x = Phaser.Math.Between(100, width - 100);
        const y = Phaser.Math.Between(50, height * 0.4);
        const color = Phaser.Math.RND.pick([0xff4444, 0x44ff44, 0x4444ff, 0xffcc00, 0xff44ff, 0x44ffff]);

        // Burst of particles
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const speed = Phaser.Math.Between(50, 120);
          const particle = this.add.circle(x, y, 3, color);
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: { from: 1, to: 0.2 },
            duration: Phaser.Math.Between(600, 1200),
            onComplete: () => particle.destroy(),
          });
        }
      },
    });
  }

  _createConfetti(width, height) {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffcc00, 0xff44ff, 0x44ffff, 0xffaa44];

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const confetti = this.add.rectangle(
          Phaser.Math.Between(0, width),
          -10,
          Phaser.Math.Between(4, 8),
          Phaser.Math.Between(4, 12),
          Phaser.Math.RND.pick(colors)
        );
        this.tweens.add({
          targets: confetti,
          y: height + 20,
          x: confetti.x + Phaser.Math.Between(-80, 80),
          angle: Phaser.Math.Between(-360, 360),
          duration: Phaser.Math.Between(3000, 6000),
          onComplete: () => confetti.destroy(),
        });
      },
    });
  }

  _createBalloons(width, height) {
    const balloonColors = [0xff4444, 0x44aaff, 0xffcc00, 0xff44ff, 0x44ff88];

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, width - 50);
        const color = Phaser.Math.RND.pick(balloonColors);

        // Balloon body
        const balloon = this.add.ellipse(x, height + 30, 24, 30, color).setDepth(5);
        // String
        const string = this.add.line(0, 0, x, height + 45, x + 5, height + 70, 0xaaaaaa).setDepth(4);

        this.tweens.add({
          targets: [balloon, string],
          y: '-=800',
          x: `+=${Phaser.Math.Between(-40, 40)}`,
          duration: Phaser.Math.Between(6000, 10000),
          onComplete: () => { balloon.destroy(); string.destroy(); },
        });
      },
    });
  }
}
