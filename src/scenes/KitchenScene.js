import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
import { RoomRenderer } from '../systems/RoomRenderer.js';
import { MovementController } from '../systems/MovementController.js';
import { CharacterAnimator } from '../systems/CharacterAnimator.js';
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

    // Room dimensions (match bedroom)
    const roomW = 520;
    const roomH = 380;
    const roomX = (width - roomW) / 2;
    const roomY = 30;
    const wallT = 36;

    // Dark surround
    this.add.rectangle(width / 2, height / 2, width, height, 0x050508).setDepth(-1);

    // Ceramic tile floor
    const floorG = this.add.graphics().setDepth(0);
    const tileSize = 36;
    for (let ty = roomY; ty < roomY + roomH; ty += tileSize) {
      for (let tx = roomX; tx < roomX + roomW; tx += tileSize) {
        const col = Math.floor((tx - roomX) / tileSize);
        const row = Math.floor((ty - roomY) / tileSize);
        const color = (col + row) % 2 === 0 ? 0xd0c8b0 : 0xc4bca8;
        floorG.fillStyle(color);
        floorG.fillRect(tx, ty, tileSize, tileSize);
        // Grout lines
        floorG.fillStyle(0xa09880);
        floorG.fillRect(tx, ty, tileSize, 2);
        floorG.fillRect(tx, ty, 2, tileSize);
      }
    }

    // Walls
    const wallG = this.add.graphics().setDepth(200);
    const wallColor = 0x443830;
    const patternColor = 0x554840;
    const baseboardColor = 0x5a4830;

    // Top wall
    wallG.fillStyle(wallColor);
    wallG.fillRect(roomX, roomY, roomW, wallT);
    // Wall pattern dots
    for (let px = roomX + 8; px < roomX + roomW; px += 16) {
      for (let py = roomY + 6; py < roomY + wallT - 4; py += 10) {
        wallG.fillStyle(patternColor);
        wallG.fillRect(px, py, 3, 3);
      }
    }
    // Top baseboard
    wallG.fillStyle(baseboardColor);
    wallG.fillRect(roomX, roomY + wallT - 8, roomW, 8);

    // Left wall
    wallG.fillStyle(wallColor);
    wallG.fillRect(roomX, roomY, wallT, roomH);
    wallG.fillStyle(baseboardColor);
    wallG.fillRect(roomX + wallT - 8, roomY, 8, roomH);

    // Right wall
    wallG.fillStyle(wallColor);
    wallG.fillRect(roomX + roomW - wallT, roomY, wallT, roomH);
    wallG.fillStyle(baseboardColor);
    wallG.fillRect(roomX + roomW - wallT, roomY, 8, roomH);

    // Bottom wall (with door gap)
    const doorGap = 48;
    const doorCenterX = roomX + roomW / 2;
    wallG.fillStyle(wallColor);
    wallG.fillRect(roomX, roomY + roomH - wallT, doorCenterX - doorGap / 2 - roomX, wallT);
    wallG.fillRect(doorCenterX + doorGap / 2, roomY + roomH - wallT, roomX + roomW - doorCenterX - doorGap / 2, wallT);

    // Window (top-center of room)
    const winX = roomX + roomW / 2;
    const winY = roomY + 5;
    const winW = 60;
    const winH = 26;
    const winG = this.add.graphics().setDepth(201);
    // Frame
    winG.fillStyle(0x5a4a38);
    winG.fillRect(winX - winW / 2 - 3, winY, winW + 6, winH + 4);
    // Glass panes
    winG.fillStyle(0x88aacc);
    winG.fillRect(winX - winW / 2, winY + 2, winW / 2 - 2, winH);
    winG.fillRect(winX + 2, winY + 2, winW / 2 - 2, winH);
    // Light glow
    this.add.circle(winX, winY + winH / 2, 70, 0xffdd88, 0.06).setDepth(201);

    // Counter top (along inside of top wall)
    const counterY = roomY + wallT;
    const counterW = roomW - wallT * 2;
    const cg = this.add.graphics().setDepth(10);
    cg.fillStyle(0x8b7355);
    cg.fillRect(roomX + wallT, counterY, counterW, 36);
    cg.fillStyle(0x7a6245, 0.5);
    cg.fillRect(roomX + wallT, counterY + 4, counterW, 1);
    cg.fillRect(roomX + wallT, counterY + 10, counterW, 1);
    cg.fillRect(roomX + wallT, counterY + 20, counterW, 1);

    // Fridge (left side of counter)
    const fridgeX = roomX + wallT + 40;
    const fridgeY = roomY + wallT + 30;
    this.fridge = this.physics.add.staticImage(fridgeX, fridgeY, 'fridge');
    this.fridge.setDepth(10);
    RoomRenderer.drawShadow(this, fridgeX, fridgeY + 22, 36, 10);
    if (!this.gameFlags.banana) {
      this.fridgeLabel = this.add.text(fridgeX, fridgeY - 30, 'SPACE', {
        fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tweens.add({ targets: this.fridgeLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
    }

    // Coffee machine (right side of counter)
    const coffeeX = roomX + roomW - wallT - 40;
    const coffeeY = roomY + wallT + 30;
    this.coffeeMachine = this.physics.add.staticImage(coffeeX, coffeeY, 'coffee-machine');
    this.coffeeMachine.setDepth(10);
    RoomRenderer.drawShadow(this, coffeeX, coffeeY + 22, 36, 10);
    if (!this.gameFlags.coffee) {
      this.coffeeLabel = this.add.text(coffeeX, coffeeY - 30, 'SPACE', {
        fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tweens.add({ targets: this.coffeeLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
    }

    // Door (bottom center)
    const doorX = roomX + roomW / 2;
    const doorY = roomY + roomH - wallT;
    this.door = this.physics.add.staticImage(doorX, doorY, 'door');
    this.door.setDepth(199);
    this.add.text(doorX, doorY + wallT + 8, 'EXIT', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(200);

    // Player
    const spawnX = roomX + roomW / 2;
    const spawnY = roomY + roomH / 2 + 20;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'nikita-dressed-d0');
    this.player.setDepth(50);
    this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
      roomX + wallT + 14, roomY + wallT + 6,
      roomW - wallT * 2 - 28, roomH - wallT * 2 - 12
    ));
    this.player.setCollideWorldBounds(true);

    // Shadow under player
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 22, 24, 8, 0x000000, 0.2).setDepth(1);
    this.animator = new CharacterAnimator(this);
    this.movement = new MovementController(this, this.player, {
      speed: 127,
      shadow: { sprite: this.playerShadow, offsetY: 22 },
      animator: this.animator,
      animKey: 'nikita-dressed',
    });

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
      this.movement.stop();
      return;
    }

    // === PLAYER MOVEMENT ===
    this.movement.update(this.inputMgr, delta);

    // Interactions
    if (this.inputMgr.justPressed('interact')) {

      // Fridge
      if (!this.gameFlags.banana) {
        const distFridge = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.fridge.x, this.fridge.y);
        if (distFridge < 45) {
          this._collectBanana();
          return;
        }
      }

      // Coffee
      if (!this.gameFlags.coffee) {
        const distCoffee = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.coffeeMachine.x, this.coffeeMachine.y);
        if (distCoffee < 45) {
          this._collectCoffee();
          return;
        }
      }

      // Door
      const distDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y);
      if (distDoor < 45) {
        this._tryExit();
      }
    }

    this.inputMgr.clearJustPressed();
  }

  _collectBanana() {
    this.frozen = true;
    this.movement.stop();
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
    this.movement.stop();
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
    this.movement.stop();

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
