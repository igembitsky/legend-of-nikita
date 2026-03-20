import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
import { MovementController } from '../systems/MovementController.js';
import { CharacterAnimator } from '../systems/CharacterAnimator.js';
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

    // === ROOM DIMENSIONS (bigger than bedroom) ===
    const roomW = 620;
    const roomH = 460;
    const roomX = (width - roomW) / 2;
    const roomY = 20;
    const wallT = 40;

    // Dark surround
    this.add.rectangle(width / 2, height / 2, width, height, 0x050508).setDepth(-1);

    // === FLOOR (warm wood planks) ===
    const floorX = roomX + wallT;
    const floorY = roomY + wallT;
    const floorW = roomW - wallT * 2;
    const floorH = roomH - wallT * 2;
    const floorG = this.add.graphics().setDepth(0);
    for (let py = floorY; py < floorY + floorH; py += 48) {
      const shade = Math.floor(Math.random() * 10) - 5;
      const color = ((0x6a + shade) << 16) | ((0x4a + shade) << 8) | (0x30 + shade);
      floorG.fillStyle(color);
      const plankH = Math.min(47, floorY + floorH - py - 1);
      floorG.fillRect(floorX, py, floorW, plankH);
      floorG.fillStyle(0x3a2a18);
      floorG.fillRect(floorX, py + plankH, floorW, 1);
      const offset = (Math.floor((py - floorY) / 48) % 2) * 120;
      floorG.fillStyle(0x3a2a18, 0.4);
      for (let jx = floorX + offset + 140; jx < floorX + floorW; jx += 240) {
        floorG.fillRect(jx, py, 1, plankH);
      }
    }

    // === WALLS ===
    const wallG = this.add.graphics().setDepth(200);
    // Top wall
    wallG.fillStyle(0x443830);
    wallG.fillRect(roomX, roomY, roomW, wallT);
    wallG.fillStyle(0x4a3e35, 0.3);
    for (let wx = roomX; wx < roomX + roomW; wx += 20) {
      for (let wy = roomY + 4; wy < roomY + wallT - 4; wy += 14) {
        wallG.fillRect(wx + 8, wy, 3, 3);
      }
    }
    wallG.fillStyle(0x5a4830);
    wallG.fillRect(roomX, roomY + wallT - 8, roomW, 8);
    // Left wall
    wallG.fillStyle(0x443830);
    wallG.fillRect(roomX, roomY, wallT, roomH);
    wallG.fillStyle(0x5a4830);
    wallG.fillRect(roomX + wallT - 8, roomY, 8, roomH);
    // Right wall
    wallG.fillStyle(0x443830);
    wallG.fillRect(roomX + roomW - wallT, roomY, wallT, roomH);
    wallG.fillStyle(0x5a4830);
    wallG.fillRect(roomX + roomW - wallT, roomY, 8, roomH);
    // Bottom wall
    wallG.fillStyle(0x443830);
    wallG.fillRect(roomX, roomY + roomH - wallT, roomW, wallT);

    // === WINDOW (top wall, right side) ===
    const winX = roomX + roomW - 140;
    const winG = this.add.graphics().setDepth(201);
    winG.fillStyle(0x5a4830);
    winG.fillRect(winX - 30, roomY + 3, 60, 34);
    winG.fillStyle(0x664422);
    winG.fillRect(winX - 27, roomY + 5, 24, 30);
    winG.fillRect(winX + 3, roomY + 5, 24, 30);
    winG.fillStyle(0x5a4830);
    winG.fillRect(winX - 1, roomY + 5, 2, 30);
    // Warm evening light glow
    this.add.circle(winX, roomY + wallT + 50, 100, 0xffaa44, 0.06).setDepth(1);

    // Warm ambient overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0xffaa44, 0.04).setDepth(3);

    // === DOOR / ENTRANCE (bottom wall, center) ===
    const doorX = roomX + roomW / 2;
    const doorY = roomY + roomH - wallT;
    const doorG = this.add.graphics().setDepth(199);
    // Opening in wall
    doorG.fillStyle(0x0e0e1a);
    doorG.fillRect(doorX - 24, doorY - 2, 48, wallT + 4);
    // Frame
    doorG.fillStyle(0x5a4030);
    doorG.fillRect(doorX - 26, doorY - 4, 4, wallT + 8);
    doorG.fillRect(doorX + 22, doorY - 4, 4, wallT + 8);
    doorG.fillRect(doorX - 26, doorY - 4, 52, 4);

    // === COUCH (left side of room) ===
    const couchX = roomX + wallT + 30;
    const couchY = roomY + roomH / 2 - 20;
    const couch = this.add.graphics().setDepth(10);
    couch.fillStyle(0x554433);
    couch.fillRoundedRect(couchX, couchY, 160, 60, 8);
    couch.fillStyle(0x665544);
    couch.fillRoundedRect(couchX, couchY - 5, 160, 20, 6); // back cushion
    this.add.ellipse(couchX + 80, couchY + 65, 160, 20, 0x000000, 0.1).setDepth(1);

    // === WIFE (near couch, standing) ===
    const wifeX = roomX + wallT + 110;
    const wifeY = roomY + wallT + 80;
    this.wifeX = wifeX;
    this.wifeY = wifeY;
    this.wife = this.add.sprite(wifeX, wifeY, 'wife-standing');
    this.add.ellipse(wifeX, wifeY + 22, 24, 8, 0x000000, 0.15).setDepth(1);
    this.tweens.add({
      targets: this.wife,
      scaleY: { from: 1, to: 1.015 },
      scaleX: { from: 1, to: 0.99 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });

    // === CAT + FOOD BOWL (right side of room) ===
    const catX = roomX + roomW - wallT - 100;
    const catY = roomY + roomH / 2 + 20;
    this.cat = this.add.sprite(catX, catY, 'cat');
    this.foodBowl = this.physics.add.staticImage(catX + 30, catY + 10, 'food-bowl');
    this.bowlLabel = this.add.text(catX + 30, catY - 15, 'SPACE', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.bowlLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });

    // === PLAYER (enters from bottom door) ===
    this.player = this.physics.add.sprite(doorX, doorY - 20, 'nikita-dressed-d0');
    this.player.setCollideWorldBounds(true);
    this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
      roomX + wallT + 14, roomY + wallT + 6,
      roomW - wallT * 2 - 28, roomH - wallT * 2 - 12
    ));
    this.player.setDepth(50);

    // Shadow under player
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 22, 24, 8, 0x000000, 0.2).setDepth(1);
    this.animator = new CharacterAnimator(this);
    this.movement = new MovementController(this, this.player, {
      speed: 165,
      shadow: { sprite: this.playerShadow, offsetY: 22 },
      animator: this.animator,
      animKey: 'nikita-dressed',
    });

    // State
    this.catFed = false;
    this.phase = 'explore'; // explore → goKiss → ending
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
      this.movement.stop();
      return;
    }

    if (this.phase === 'explore') {
      this.movement.update(this.inputMgr, delta);

      // Feed cat interaction
      if (this.inputMgr.justPressed('interact') && !this.catFed) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.foodBowl.x, this.foodBowl.y);
        if (dist < 50) {
          this._feedCat();
        }
      }

      this.inputMgr.clearJustPressed();
    } else if (this.phase === 'goKiss') {
      this.movement.update(this.inputMgr, delta);

      // Kiss wife interaction
      if (this.inputMgr.justPressed('interact')) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.wifeX, this.wifeY);
        if (dist < 45) {
          this._kissWife();
        }
      }

      this.inputMgr.clearJustPressed();
    }
  }

  _feedCat() {
    this.catFed = true;
    this.frozen = true;
    this.movement.stop();
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
        if (dialogueData.home.kissHint) {
          this.dialogue.startSequence(dialogueData.home.kissHint, {
            onComplete: () => this._enterKissPhase(),
          });
        } else {
          this._enterKissPhase();
        }
      },
    });
  }

  _enterKissPhase() {
    this.phase = 'goKiss';
    this.frozen = false;
    // Show SPACE hint near wife
    this.kissLabel = this.add.text(this.wifeX, this.wifeY - 30, 'SPACE', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: this.kissLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
  }

  _kissWife() {
    this.phase = 'ending';
    this.frozen = true;
    this.movement.stop();
    if (this.kissLabel) this.kissLabel.setVisible(false);

    // Walk Nikita to Sveta
    this.tweens.add({
      targets: this.player,
      x: this.wifeX,
      y: this.wifeY + 4,
      duration: 800,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.playerShadow.setPosition(this.player.x, this.player.y + 22);
      },
      onComplete: () => {
        // Merge sprites — slight scale bump
        this.tweens.add({
          targets: [this.player, this.wife],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 300,
          ease: 'Back.easeOut',
        });

        // Gentle sway together
        this.tweens.add({
          targets: [this.player, this.wife],
          x: { from: this.wifeX - 3, to: this.wifeX + 3 },
          yoyo: true,
          repeat: -1,
          duration: 1500,
          ease: 'Sine.easeInOut',
        });

        // Warm glow around couple
        const glow = this.add.circle(this.wifeX, this.wifeY, 60, 0xffaa44, 0)
          .setDepth(49);
        this.tweens.add({
          targets: glow,
          alpha: 0.15,
          duration: 800,
          ease: 'Sine.easeIn',
        });

        // Massive heart storm — waves of hearts over 5 seconds
        const spawnHeart = (delay) => {
          this.time.delayedCall(delay, () => {
            const size = Phaser.Math.Between(14, 22);
            const heart = this.add.text(
              this.wifeX + Phaser.Math.Between(-30, 30),
              this.wifeY - 5,
              '❤️',
              { fontSize: `${size}px` }
            ).setDepth(200);
            this.tweens.add({
              targets: heart,
              y: heart.y - 50 - Phaser.Math.Between(0, 40),
              x: heart.x + Phaser.Math.Between(-25, 25),
              alpha: 0,
              duration: 1200 + Phaser.Math.Between(0, 600),
              onComplete: () => heart.destroy(),
            });
          });
        };
        for (let i = 0; i < 30; i++) {
          spawnHeart(i * 170);
        }

        // After ~5s of kissing, start lights out
        this.time.delayedCall(5200, () => this._startEnding());
      },
    });
  }

  _startEnding() {
    const { width, height } = this.cameras.main;

    // Stop music as lights dim
    this.audio.stopMusic();

    // Clear camera post-FX (vignette) so darkness is truly black
    this.cameras.main.postFX?.clear();

    // Slow darkness — 4 seconds for drama
    const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(1500);

    this.tweens.add({
      targets: darkness,
      alpha: 1,
      duration: 4000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Hold in total darkness for a beat
        this.time.delayedCall(1000, () => {
          // Cat eyes fade in
          const eyeL = this.add.circle(this.cat.x - 8, this.cat.y - 2, 5, 0x44ff44)
            .setDepth(2000).setAlpha(0);
          const eyeR = this.add.circle(this.cat.x + 8, this.cat.y - 2, 5, 0x44ff44)
            .setDepth(2000).setAlpha(0);

          this.tweens.add({
            targets: [eyeL, eyeR],
            alpha: 1,
            duration: 600,
            onComplete: () => {
              // Subtle glow pulse
              this.tweens.add({
                targets: [eyeL, eyeR],
                alpha: { from: 0.7, to: 1 },
                yoyo: true,
                repeat: -1,
                duration: 800,
                ease: 'Sine.easeInOut',
              });

              // 3 slow deliberate blinks
              const doBlink = (delay) => {
                this.time.delayedCall(delay, () => {
                  this.tweens.add({
                    targets: [eyeL, eyeR],
                    alpha: 0,
                    duration: 100,
                    onComplete: () => {
                      this.time.delayedCall(100, () => {
                        this.tweens.add({
                          targets: [eyeL, eyeR],
                          alpha: 1,
                          duration: 100,
                        });
                      });
                    },
                  });
                });
              };
              doBlink(1500);
              doBlink(3000);
              doBlink(4500);

              // "fucking legend" fades in after blinks
              this.time.delayedCall(5500, () => {
                const bubble = this.add.text(this.cat.x, this.cat.y - 30, 'fucking legend', {
                  fontSize: '28px',
                  color: '#44ff44',
                  fontFamily: 'monospace',
                  fontStyle: 'bold',
                }).setOrigin(0.5).setDepth(2000).setAlpha(0);

                this.tweens.add({
                  targets: bubble,
                  alpha: 1,
                  duration: 1000,
                });

                // Hold then transition to BirthdayScene
                this.time.delayedCall(3500, () => {
                  this.transition.fadeToScene('BirthdayScene', {
                    flags: this.gameFlags,
                  });
                });
              });
            },
          });
        });
      },
    });
  }
}
