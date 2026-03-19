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

export class BedroomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BedroomScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: false, banana: false, coffee: false };
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'bedroom');
    this.audio.playMusic('bedroom');

    const { width, height } = this.cameras.main;

    // Rich wood floor
    RoomRenderer.drawWoodFloor(this, width, height, {
      baseColor: 0x4a3020, variation: 12, plankHeight: 44, gapColor: 0x2a1a08,
    });

    // Textured walls with wallpaper
    RoomRenderer.drawWalls(this, width, height, {
      wallColor: 0x2a2244, patternColor: 0x332255,
      baseboardColor: 0x3a2a18, wallThickness: 48,
    });

    // Window on right wall with moonlight
    RoomRenderer.drawWindow(this, width - 48, 200, 70, 90, {
      glassColor: 0x1a2a4a, lightColor: 0x4466aa,
      lightRadius: 160, lightAlpha: 0.06, curtainColor: 0x2a3366,
    });

    // Rug between bed and door area
    RoomRenderer.drawRug(this, width / 2, height / 2 + 60, 220, 140, {
      color: 0x3a2244, borderColor: 0x2a1a33, patternColor: 0x4a3355,
    });

    // Bed (top-left area)
    this.bed = this.physics.add.staticImage(200, 180, 'bed');

    // Wife sleeping on bed
    this.wife = this.add.sprite(220, 170, 'wife-sleeping');
    this.wifeZone = new Phaser.Geom.Circle(220, 170, 48);

    // Zzz animation
    this.zzzText = this.add.text(270, 140, 'z Z z', {
      fontSize: '16px', color: '#6666aa', fontFamily: 'monospace',
    });
    this.tweens.add({
      targets: this.zzzText,
      y: 130,
      alpha: { from: 0.3, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });

    // Cat — patrols back and forth
    this.cat = this.physics.add.sprite(450, 400, 'cat');
    this.catZone = new Phaser.Geom.Circle(450, 400, 32);
    this.catDirection = 1;
    this.catMinX = 350;
    this.catMaxX = 550;
    this.catSpeed = 20;

    // Cat eyes glow
    this.catEyes = this.add.circle(450, 398, 3, 0x44ff44).setAlpha(0.8);
    this.tweens.add({
      targets: this.catEyes,
      alpha: { from: 0.8, to: 0 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2500,
    });

    // Closet (top-right)
    this.closet = this.physics.add.staticImage(width - 120, 150, 'closet');
    this.closetIndicator = this.add.text(width - 120, 100, 'SPACE', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: this.closetIndicator,
      alpha: { from: 0.5, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    // Door (bottom-right)
    this.door = this.physics.add.staticImage(width - 80, height - 60, 'door');
    this.add.text(width - 80, height - 30, 'EXIT', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player
    this.player = this.physics.add.sprite(300, 350, 'nikita-pajamas');
    this.player.setCollideWorldBounds(true);
    this.playerSpeed = 120;

    // Depth sorting for furniture and player
    this.bed.setDepth(10);
    this.closet.setDepth(10);
    this.door.setDepth(10);
    this.player.setDepth(50);

    // Shadows under furniture
    RoomRenderer.drawShadow(this, 200, 220, 130, 25);  // under bed
    RoomRenderer.drawShadow(this, this.closet.x, this.closet.y + 30, 50, 15);  // under closet

    // Nightstand with lamp (next to bed)
    this.add.sprite(310, 170, 'nightstand').setDepth(10);
    RoomRenderer.drawShadow(this, 310, 195, 34, 10);

    // Plant in corner
    this.add.sprite(80, height - 80, 'plant').setDepth(10);
    RoomRenderer.drawShadow(this, 80, height - 58, 26, 8);

    // Wake zone visuals (pulsing circles)
    this.wifeGlow = this.add.circle(220, 170, 48, 0xff4444, 0.05);
    this.catGlow = this.add.circle(450, 400, 32, 0xff4444, 0.05);
    this.tweens.add({ targets: [this.wifeGlow, this.catGlow], alpha: { from: 0.02, to: 0.08 }, yoyo: true, repeat: -1, duration: 1000 });

    // HUD
    this.hudIcon = this.add.text(width - 60, 50, '', {
      fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(900);

    // State
    this.dressed = this.gameFlags.dressed || false;
    this.frozen = false;

    if (this.dressed) {
      this.player.setTexture('nikita-dressed');
      this.closetIndicator.setVisible(false);
      this._updateHUD();
    }

    // Intro dialogue
    this.dialogue.startSequence(dialogueData.bedroom.intro, {
      onComplete: () => { this.frozen = false; },
    });
    this.frozen = true;

    // Input for dialogue advance
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) {
        this.audio.playBlip();
        this.dialogue.advance();
      }
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) {
        this.audio.playBlip();
        this.dialogue.advance();
      }
    });

    // Save
    this.save.autoSave('BedroomScene', this.gameFlags);

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

    // Player movement
    let vx = 0, vy = 0;
    if (this.inputMgr.isDown('left')) vx = -this.playerSpeed;
    if (this.inputMgr.isDown('right')) vx = this.playerSpeed;
    if (this.inputMgr.isDown('up')) vy = -this.playerSpeed;
    if (this.inputMgr.isDown('down')) vy = this.playerSpeed;
    this.player.setVelocity(vx, vy);

    // Cat patrol
    this.cat.x += this.catDirection * this.catSpeed * (delta / 1000);
    if (this.cat.x >= this.catMaxX) this.catDirection = -1;
    if (this.cat.x <= this.catMinX) this.catDirection = 1;
    this.catZone.setPosition(this.cat.x, this.cat.y);
    this.catGlow.setPosition(this.cat.x, this.cat.y);
    this.catEyes.setPosition(this.cat.x, this.cat.y - 2);

    // Check wake zones
    const playerPos = new Phaser.Geom.Point(this.player.x, this.player.y);
    if (this.wifeZone.contains(playerPos.x, playerPos.y) ||
        this.catZone.contains(playerPos.x, playerPos.y)) {
      this._failStealth();
      return;
    }

    // Closet interaction
    if (this.inputMgr.justPressed('interact') && !this.dressed) {
      const distCloset = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.closet.x, this.closet.y);
      if (distCloset < 50) {
        this._getDressed();
      }
    }

    // Door interaction
    if (this.inputMgr.justPressed('interact')) {
      const distDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y);
      if (distDoor < 50) {
        this._tryExit();
      }
    }

    this.inputMgr.clearJustPressed();
  }

  _failStealth() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.audio.playAlarm();
    this.transition.flash(300, 255, 100, 100);
    const msgs = dialogueData.bedroom.failMessages || dialogueData.bedroom.fail;
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    this.dialogue.startSequence([msg], {
      onComplete: () => {
        // Reset player position
        this.player.setPosition(300, 350);
        this.frozen = false;
      },
    });
  }

  _getDressed() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.dressed = true;
    this.gameFlags.dressed = true;
    this.player.setTexture('nikita-dressed');
    this.audio.playFanfare();
    this.closetIndicator.setVisible(false);

    this.dialogue.startSequence(dialogueData.bedroom.dressed, {
      onComplete: () => {
        this.frozen = false;
        this._updateHUD();
      },
    });
  }

  _tryExit() {
    this.frozen = true;
    this.player.setVelocity(0);

    if (!this.dressed) {
      this.dialogue.startSequence(dialogueData.bedroom.gate, {
        onComplete: () => { this.frozen = false; },
      });
      return;
    }

    this.dialogue.startSequence(dialogueData.bedroom.success, {
      onComplete: () => {
        this.save.autoSave('KitchenScene', this.gameFlags);
        this.transition.fadeToScene('KitchenScene', { flags: this.gameFlags });
      },
    });
  }

  _updateHUD() {
    if (this.dressed) {
      this.hudIcon.setText('👔');
    }
  }
}
