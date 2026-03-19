import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
import { RoomRenderer } from '../systems/RoomRenderer.js';
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
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'home');
    this.audio.playMusic('home');

    const { width, height } = this.cameras.main;

    // Warm wood floor
    RoomRenderer.drawWoodFloor(this, width, height, {
      baseColor: 0x6a4a30, variation: 10, plankHeight: 48, gapColor: 0x3a2a18,
    });

    // Walls (warm cream tones)
    RoomRenderer.drawWalls(this, width, height, {
      wallColor: 0x443830, patternColor: 0x4a3e35,
      baseboardColor: 0x5a4830, wallThickness: 48,
    });

    // Window with warm evening light
    RoomRenderer.drawWindow(this, width - 48, 200, 80, 100, {
      glassColor: 0x664422, lightColor: 0xffaa44,
      lightRadius: 180, lightAlpha: 0.08, curtainColor: 0x886644,
    });

    // Warm ambient overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0xffaa44, 0.04).setDepth(3);

    // Couch
    const couch = this.add.graphics().setDepth(10);
    couch.fillStyle(0x554433);
    couch.fillRoundedRect(100, 300, 160, 60, 8);
    couch.fillStyle(0x665544);
    couch.fillRoundedRect(100, 295, 160, 20, 6); // back cushion
    RoomRenderer.drawShadow(this, 180, 365, 160, 20);

    // Wife
    this.wife = this.add.sprite(width * 0.3, height * 0.4, 'wife-standing');
    this.add.ellipse(width * 0.3, height * 0.4 + 22, 24, 8, 0x000000, 0.15).setDepth(1);
    this.tweens.add({
      targets: this.wife,
      scaleY: { from: 1, to: 1.015 },
      scaleX: { from: 1, to: 0.99 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });

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
    this.player.setDepth(50);
    this.playerSpeed = 130;

    // Shadow under player
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 22, 24, 8, 0x000000, 0.2).setDepth(1);

    // State
    this.catFed = false;
    this.phase = 'explore'; // explore → catFed → ending
    this.frozen = false;

    // Auto-save at scene start
    this.save.autoSave('HomeScene', this.gameFlags);

    // Wife greeting — after greeting completes, show hint
    this.dialogue.startSequence(dialogueData.home.greeting, {
      onComplete: () => {
        if (dialogueData.home.hint) {
          this.dialogue.startSequence(dialogueData.home.hint, {
            onComplete: () => { this.frozen = false; },
          });
        } else {
          this.frozen = false;
        }
      },
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

    // Sync player shadow
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 22);
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
    this.audio.playMeow();

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

    // Stop music as lights dim
    this.audio.stopMusic();

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
