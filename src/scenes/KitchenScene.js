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

    // Ceramic tile floor (inside walls only)
    const floorG = this.add.graphics().setDepth(0);
    const tileSize = 36;
    const floorX = roomX + wallT;
    const floorY = roomY + wallT;
    const floorW = roomW - wallT * 2;
    const floorH = roomH - wallT * 2;
    for (let ty = floorY; ty < floorY + floorH; ty += tileSize) {
      for (let tx = floorX; tx < floorX + floorW; tx += tileSize) {
        const col = Math.floor((tx - floorX) / tileSize);
        const row = Math.floor((ty - floorY) / tileSize);
        const tw = Math.min(tileSize, floorX + floorW - tx);
        const th = Math.min(tileSize, floorY + floorH - ty);
        const color = (col + row) % 2 === 0 ? 0xd0c8b0 : 0xc4bca8;
        floorG.fillStyle(color);
        floorG.fillRect(tx, ty, tw, th);
        // Grout lines
        floorG.fillStyle(0xa09880);
        floorG.fillRect(tx, ty, tw, 2);
        floorG.fillRect(tx, ty, 2, th);
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
    this.fridgeX = fridgeX;
    this.fridgeY = fridgeY;
    this.fridge = this.physics.add.staticImage(fridgeX, fridgeY, 'fridge');
    this.fridge.setDepth(10);
    RoomRenderer.drawShadow(this, fridgeX, fridgeY + 22, 36, 10);
    // "fridge" label
    this.add.text(fridgeX, fridgeY + 26, 'fridge', {
      fontSize: '9px', color: '#887766', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);
    // SPACE indicator
    this.fridgeIndicator = this._createSpaceIndicator(fridgeX, fridgeY - 30);

    // Coffee machine (right side of counter)
    const coffeeX = roomX + roomW - wallT - 40;
    const coffeeY = roomY + wallT + 30;
    this.coffeeX = coffeeX;
    this.coffeeY = coffeeY;
    this.coffeeMachine = this.physics.add.staticImage(coffeeX, coffeeY, 'coffee-machine');
    this.coffeeMachine.setDepth(10);
    RoomRenderer.drawShadow(this, coffeeX, coffeeY + 22, 36, 10);
    // "coffee" label
    this.add.text(coffeeX, coffeeY + 26, 'coffee', {
      fontSize: '9px', color: '#887766', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);
    // SPACE indicator
    this.coffeeIndicator = this._createSpaceIndicator(coffeeX, coffeeY - 30);

    // Door (bottom center)
    const doorX = roomX + roomW / 2;
    const doorY = roomY + roomH - wallT;
    this.doorX = doorX;
    this.doorY = doorY;
    this.door = this.physics.add.staticImage(doorX, doorY, 'door');
    this.door.setDepth(199);
    // "exit" label
    this.add.text(doorX, doorY + wallT + 8, '▼ exit', {
      fontSize: '9px', color: '#887766', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(200);
    // SPACE indicator
    this.doorIndicator = this._createSpaceIndicator(doorX, doorY - 14);

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

    // Objective banner (top of screen)
    this.objectiveBg = this.add.rectangle(width / 2, 10, 340, 22, 0x000000, 0.6)
      .setDepth(950);
    this.objectiveText = this.add.text(width / 2, 10, '', {
      fontSize: '11px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(951);
    this._updateObjective();

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

    // === PROXIMITY SPACE INDICATORS ===
    const distFridge = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.fridgeX, this.fridgeY
    );
    this.fridgeIndicator.group.setVisible(!this.gameFlags.banana && distFridge < 55);

    const distCoffee = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.coffeeX, this.coffeeY
    );
    this.coffeeIndicator.group.setVisible(!this.gameFlags.coffee && distCoffee < 55);

    const distDoor = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.doorX, this.doorY
    );
    this.doorIndicator.group.setVisible(distDoor < 55);

    // === INTERACTIONS ===
    if (this.inputMgr.justPressed('interact')) {
      if (!this.gameFlags.banana && distFridge < 45) {
        this._collectBanana();
        return;
      }
      if (!this.gameFlags.coffee && distCoffee < 45) {
        this._collectCoffee();
        return;
      }
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
    this.fridgeIndicator.group.setVisible(false);
    this.audio.playFanfare();

    this.dialogue.startSequence(dialogueData.kitchen.banana, {
      onComplete: () => {
        this.frozen = false;
        this._updateHUD();
        this._updateObjective();
      },
    });
  }

  _collectCoffee() {
    this.frozen = true;
    this.movement.stop();
    this.gameFlags.coffee = true;
    this.coffeeIndicator.group.setVisible(false);
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
        this._updateObjective();
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

  _updateObjective() {
    const need = [];
    if (!this.gameFlags.banana) need.push('banana');
    if (!this.gameFlags.coffee) need.push('coffee');
    if (need.length === 0) {
      this.objectiveText.setText('🎯 Head to the exit');
    } else {
      this.objectiveText.setText('🎯 Grab ' + need.join(' and '));
    }
  }

  _createSpaceIndicator(x, y) {
    const bg = this.add.rectangle(x, y, 56, 18, 0x000000, 0.5).setDepth(899);
    const border = this.add.rectangle(x, y, 56, 18)
      .setStrokeStyle(1, 0xccaa44, 0.6).setFillStyle(0, 0).setDepth(899);
    const text = this.add.text(x, y, '⌨ SPACE', {
      fontSize: '9px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(900);
    const group = this.add.container(0, 0, [bg, border, text]).setDepth(899);
    group.setVisible(false);
    this.tweens.add({
      targets: group, alpha: { from: 0.5, to: 1 },
      y: { from: 0, to: -3 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut',
    });
    return { group };
  }
}
