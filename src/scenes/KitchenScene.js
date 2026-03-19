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

export class KitchenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KitchenScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: true, banana: false, coffee: false };
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'kitchen');
    this.audio.playMusic('kitchen');

    const { width, height } = this.cameras.main;

    // Ceramic tile floor (warm morning kitchen)
    RoomRenderer.drawTileFloor(this, width, height, {
      tileSize: 48, color1: 0xd0c8b0, color2: 0xc4bca8,
      groutColor: 0xa09880, groutWidth: 2,
    });

    // Walls (lighter warm tones)
    RoomRenderer.drawWalls(this, width, height, {
      wallColor: 0x443830, patternColor: 0x554840,
      baseboardColor: 0x5a4830, wallThickness: 48,
      sides: { top: true, left: true, right: true },
    });

    // Window above counter area
    RoomRenderer.drawWindow(this, width / 2, 30, 80, 50, {
      glassColor: 0x88aacc, lightColor: 0xffdd88,
      lightRadius: 120, lightAlpha: 0.06, curtainColor: 0xccbb88,
    });

    // Counter top (enhanced with wood grain)
    const cg = this.add.graphics().setDepth(10);
    cg.fillStyle(0x8b7355);
    cg.fillRect(48, 48, width - 96, 44);
    cg.fillStyle(0x7a6245, 0.5);
    cg.fillRect(48, 52, width - 96, 1);
    cg.fillRect(48, 58, width - 96, 1);
    cg.fillRect(48, 68, width - 96, 1);

    // Fridge (left side)
    this.fridge = this.physics.add.staticImage(150, 100, 'fridge');
    this.fridge.setDepth(10);
    RoomRenderer.drawShadow(this, 150, 122, 44, 12);
    if (!this.gameFlags.banana) {
      this.fridgeLabel = this.add.text(150, 60, 'SPACE', {
        fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tweens.add({ targets: this.fridgeLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
    }

    // Coffee machine (right side)
    this.coffeeMachine = this.physics.add.staticImage(width - 150, 100, 'coffee-machine');
    this.coffeeMachine.setDepth(10);
    RoomRenderer.drawShadow(this, width - 150, 122, 44, 12);
    if (!this.gameFlags.coffee) {
      this.coffeeLabel = this.add.text(width - 150, 60, 'SPACE', {
        fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tweens.add({ targets: this.coffeeLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
    }

    // Door (bottom center)
    this.door = this.physics.add.staticImage(width / 2, height - 50, 'door');
    this.door.setDepth(10);
    this.add.text(width / 2, height - 20, 'EXIT', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player
    this.player = this.physics.add.sprite(width / 2, height / 2, 'nikita-dressed');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(50);
    this.playerSpeed = 160;

    // Shadow under player
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 22, 24, 8, 0x000000, 0.2).setDepth(1);

    // HUD
    this.hudText = this.add.text(width - 80, 50, '', {
      fontSize: '14px', color: '#ffcc00', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(900);
    this._updateHUD();

    // State
    this.frozen = false;

    // Dialogue advance
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });

    this.save.autoSave('KitchenScene', this.gameFlags);

    if (dialogueData.kitchen.intro) {
      this.dialogue.startSequence(dialogueData.kitchen.intro, {
        onComplete: () => { this.frozen = false; },
      });
      this.frozen = true;
    }

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

    // Movement
    let vx = 0, vy = 0;
    if (this.inputMgr.isDown('left')) vx = -this.playerSpeed;
    if (this.inputMgr.isDown('right')) vx = this.playerSpeed;
    if (this.inputMgr.isDown('up')) vy = -this.playerSpeed;
    if (this.inputMgr.isDown('down')) vy = this.playerSpeed;
    this.player.setVelocity(vx, vy);

    // Interactions
    if (this.inputMgr.justPressed('interact')) {

      // Fridge
      if (!this.gameFlags.banana) {
        const distFridge = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.fridge.x, this.fridge.y);
        if (distFridge < 60) {
          this._collectBanana();
          return;
        }
      }

      // Coffee
      if (!this.gameFlags.coffee) {
        const distCoffee = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.coffeeMachine.x, this.coffeeMachine.y);
        if (distCoffee < 60) {
          this._collectCoffee();
          return;
        }
      }

      // Door
      const distDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y);
      if (distDoor < 60) {
        this._tryExit();
      }
    }

    this.inputMgr.clearJustPressed();
  }

  _collectBanana() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.gameFlags.banana = true;
    if (this.fridgeLabel) this.fridgeLabel.setVisible(false);
    this.audio.playFanfare();

    this.dialogue.startSequence(dialogueData.kitchen.banana, {
      onComplete: () => {
        this.frozen = false;
        this._updateHUD();
      },
    });
  }

  _collectCoffee() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.gameFlags.coffee = true;
    if (this.coffeeLabel) this.coffeeLabel.setVisible(false);
    this.audio.playFanfare();

    // Steam particles
    const emitter = this.add.particles(this.coffeeMachine.x, this.coffeeMachine.y - 20, 'coffee-cup', {
      speed: { min: 10, max: 30 },
      angle: { min: 250, max: 290 },
      lifespan: 800,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      quantity: 1,
      frequency: 100,
    });
    this.time.delayedCall(1000, () => emitter.destroy());

    this.dialogue.startSequence(dialogueData.kitchen.coffee, {
      onComplete: () => {
        this.frozen = false;
        this._updateHUD();
      },
    });
  }

  _tryExit() {
    this.frozen = true;
    this.player.setVelocity(0);

    if (!this.gameFlags.banana || !this.gameFlags.coffee) {
      let msg;
      if (this.gameFlags.banana && !this.gameFlags.coffee) {
        msg = { speaker: "Nikita", text: "I'm too sleepy." };
      } else if (!this.gameFlags.banana && this.gameFlags.coffee) {
        msg = { speaker: "Nikita", text: "I'm too hungry." };
      } else {
        const gateMessages = dialogueData.kitchen.gate;
        msg = gateMessages[Math.floor(Math.random() * gateMessages.length)];
      }
      this.dialogue.startSequence([msg], {
        onComplete: () => { this.frozen = false; },
      });
      return;
    }

    this.dialogue.startSequence(dialogueData.kitchen.exit, {
      onComplete: () => {
        this.save.autoSave('DrivingScene', this.gameFlags);
        this.transition.fadeToScene('DrivingScene', {
          flags: this.gameFlags,
          destination: 'dojo',
          difficulty: 'normal',
        });
      },
    });
  }

  _updateHUD() {
    let hud = '';
    if (this.gameFlags.banana) hud += '🍌 ';
    if (this.gameFlags.coffee) hud += '☕ ';
    this.hudText.setText(hud);
  }
}
