import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import dialogueData from '../data/dialogue.json';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  init(data) {
    this.gameFlags = data.flags || {};
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.transition.fadeIn(500);

    const { width, height } = this.cameras.main;

    // Warm evening room
    this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0x2a2018);

    // Floor
    for (let x = 0; x < width; x += 48) {
      for (let y = 0; y < height; y += 48) {
        const shade = (Math.floor(x / 48) + Math.floor(y / 48)) % 2 === 0 ? 0x3a3028 : 0x352b22;
        this.add.rectangle(x + 24, y + 24, 48, 48, shade);
      }
    }

    // Warm light overlay
    this.warmLight = this.add.rectangle(width / 2, height / 2, width, height, 0xffaa44, 0.05);

    // Wife
    this.wife = this.add.sprite(width * 0.3, height * 0.4, 'wife-standing');

    // Cat near food bowl
    this.cat = this.add.sprite(width * 0.6, height * 0.6, 'cat');
    this.foodBowl = this.physics.add.staticImage(width * 0.6 + 30, height * 0.6 + 10, 'food-bowl');
    this.bowlLabel = this.add.text(width * 0.6 + 30, height * 0.6 - 15, 'SPACE', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.bowlLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });

    // Player
    this.player = this.physics.add.sprite(width * 0.8, height * 0.8, 'nikita-dressed');
    this.player.setCollideWorldBounds(true);
    this.playerSpeed = 130;

    // State
    this.catFed = false;
    this.phase = 'explore'; // explore → catFed → ending
    this.frozen = false;

    // Wife greeting
    this.dialogue.startSequence(dialogueData.home.greeting, {
      onComplete: () => { this.frozen = false; },
    });
    this.frozen = true;

    // Input
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });

    // Pause overlay
    this.pauseOverlay = new PauseOverlay(this, () => ({
      scene: this.scene.key,
      flags: this.gameFlags,
      position: this.player ? { x: this.player.x, y: this.player.y } : undefined,
    }));
  }

  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;
    if (this.frozen || this.dialogue.isActive()) {
      this.player.setVelocity(0);
      return;
    }

    if (this.phase === 'explore') {
      // Movement
      let vx = 0, vy = 0;
      if (this.inputMgr.isDown('left')) vx = -this.playerSpeed;
      if (this.inputMgr.isDown('right')) vx = this.playerSpeed;
      if (this.inputMgr.isDown('up')) vy = -this.playerSpeed;
      if (this.inputMgr.isDown('down')) vy = this.playerSpeed;
      this.player.setVelocity(vx, vy);

      // Feed cat interaction
      if (this.inputMgr.justPressed('interact') && !this.catFed) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.foodBowl.x, this.foodBowl.y);
        if (dist < 50) {
          this._feedCat();
        }
      }

      this.inputMgr.clearJustPressed();
    }
  }

  _feedCat() {
    this.catFed = true;
    this.frozen = true;
    this.player.setVelocity(0);
    this.bowlLabel.setVisible(false);

    // Heart particles
    for (let i = 0; i < 8; i++) {
      const heart = this.add.text(
        this.cat.x + Phaser.Math.Between(-20, 20),
        this.cat.y - 10,
        '❤️',
        { fontSize: '16px' }
      );
      this.tweens.add({
        targets: heart,
        y: heart.y - 40 - Phaser.Math.Between(0, 30),
        alpha: 0,
        duration: 1200,
        delay: i * 150,
        onComplete: () => heart.destroy(),
      });
    }

    this.dialogue.startSequence(dialogueData.home.catFed, {
      onComplete: () => {
        this.time.delayedCall(1000, () => this._startEnding());
      },
    });
  }

  _startEnding() {
    const { width, height } = this.cameras.main;

    // Dim lights
    const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(1500);

    this.tweens.add({
      targets: darkness,
      alpha: 1,
      duration: 3000,
      onComplete: () => {
        // Cat eyes in darkness
        const eyeL = this.add.circle(width / 2 - 8, height / 2, 4, 0x44ff44).setDepth(2000).setAlpha(0);
        const eyeR = this.add.circle(width / 2 + 8, height / 2, 4, 0x44ff44).setDepth(2000).setAlpha(0);

        this.tweens.add({
          targets: [eyeL, eyeR],
          alpha: { from: 0, to: 1 },
          duration: 500,
          onComplete: () => {
            // Blink animation
            this.tweens.add({
              targets: [eyeL, eyeR],
              alpha: { from: 1, to: 0 },
              duration: 150,
              yoyo: true,
              repeat: 2,
              repeatDelay: 1000,
            });

            // Speech bubble
            this.time.delayedCall(1500, () => {
              const bubble = this.add.text(width / 2, height / 2 - 40, 'fucking legend', {
                fontSize: '24px',
                color: '#44ff44',
                fontFamily: 'monospace',
                fontStyle: 'bold',
              }).setOrigin(0.5).setDepth(2000).setAlpha(0);

              this.tweens.add({
                targets: bubble,
                alpha: 1,
                duration: 800,
              });

              // Hold then transition
              this.time.delayedCall(3000, () => {
                this.transition.fadeToScene('BirthdayScene');
              });
            });
          },
        });
      },
    });
  }
}
