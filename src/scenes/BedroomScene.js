import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
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

    // === ROOM DIMENSIONS ===
    const roomW = 520;
    const roomH = 380;
    const roomX = (width - roomW) / 2;
    const roomY = 30;

    // Dark surround
    this.add.rectangle(width / 2, height / 2, width, height, 0x050508).setDepth(-1);

    // === FLOOR (wood planks) ===
    const floorG = this.add.graphics().setDepth(0);
    for (let py = roomY; py < roomY + roomH; py += 32) {
      const shade = Math.floor(Math.random() * 12) - 6;
      const color = ((0x4a + shade) << 16) | ((0x30 + shade) << 8) | (0x20 + shade);
      floorG.fillStyle(color);
      floorG.fillRect(roomX, py, roomW, 31);
      floorG.fillStyle(0x2a1a08);
      floorG.fillRect(roomX, py + 31, roomW, 1);
      const offset = (Math.floor((py - roomY) / 32) % 2) * 100;
      floorG.fillStyle(0x2a1a08, 0.4);
      for (let jx = roomX + offset + 120; jx < roomX + roomW; jx += 200) {
        floorG.fillRect(jx, py, 1, 31);
      }
    }

    // === WALLS ===
    const wallT = 36;
    const wallG = this.add.graphics().setDepth(200);
    // Top wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX, roomY, roomW, wallT);
    wallG.fillStyle(0x332255, 0.3);
    for (let wx = roomX; wx < roomX + roomW; wx += 18) {
      for (let wy = roomY + 4; wy < roomY + wallT - 4; wy += 12) {
        wallG.fillRect(wx + 7, wy, 3, 3);
      }
    }
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX, roomY + wallT - 8, roomW, 8);
    // Left wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX, roomY, wallT, roomH);
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX + wallT - 8, roomY, 8, roomH);
    // Right wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX + roomW - wallT, roomY, wallT, roomH);
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX + roomW - wallT, roomY, 8, roomH);
    // Bottom wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX, roomY + roomH - wallT, roomW, wallT);

    // === WINDOW ===
    const winX = roomX + roomW / 2;
    const winG = this.add.graphics().setDepth(201);
    winG.fillStyle(0x4a3828);
    winG.fillRect(winX - 30, roomY + 3, 60, 30);
    winG.fillStyle(0x1a2a4a);
    winG.fillRect(winX - 27, roomY + 5, 24, 26);
    winG.fillRect(winX + 3, roomY + 5, 24, 26);
    winG.fillStyle(0x4a3828);
    winG.fillRect(winX - 1, roomY + 5, 2, 26);
    this.add.circle(winX, roomY + wallT + 50, 70, 0x4466aa, 0.04).setDepth(1);

    // === RUG ===
    const rugG = this.add.graphics().setDepth(2);
    const rugCX = roomX + roomW / 2;
    const rugCY = roomY + roomH / 2 + 30;
    rugG.fillStyle(0x3a2244);
    rugG.fillRoundedRect(rugCX - 70, rugCY - 35, 140, 70, 5);
    rugG.lineStyle(2, 0x2a1a33);
    rugG.strokeRoundedRect(rugCX - 64, rugCY - 29, 128, 58, 3);

    // =============================================
    // === FURNITURE & CHARACTERS ===
    // =============================================

    // --- BED (top-left, clearly shows wife sleeping) ---
    const bedX = roomX + wallT + 80;
    const bedY = roomY + wallT + 50;
    const bedG = this.add.graphics().setDepth(10);
    // Headboard
    bedG.fillStyle(0x4a2a12);
    bedG.fillRect(bedX - 72, bedY - 42, 144, 10);
    // Bed frame
    bedG.fillStyle(0x5c3a1e);
    bedG.fillRect(bedX - 72, bedY - 32, 144, 76);
    // Mattress
    bedG.fillStyle(0xe8e0d0);
    bedG.fillRect(bedX - 68, bedY - 28, 136, 56);
    // Pillows
    bedG.fillStyle(0xf0e8d8);
    bedG.fillRect(bedX - 60, bedY - 24, 34, 18);
    bedG.fillRect(bedX + 22, bedY - 24, 34, 18);
    bedG.lineStyle(1, 0xd0c8b8);
    bedG.strokeRect(bedX - 60, bedY - 24, 34, 18);
    bedG.strokeRect(bedX + 22, bedY - 24, 34, 18);
    // Blanket
    bedG.fillStyle(0x6a8abf);
    bedG.fillRect(bedX - 64, bedY - 2, 128, 26);
    bedG.fillStyle(0x5a7aaf, 0.4);
    bedG.fillRect(bedX - 64, bedY + 6, 128, 1);
    bedG.fillRect(bedX - 64, bedY + 14, 128, 1);
    this.add.ellipse(bedX, bedY + 48, 144, 14, 0x000000, 0.12).setDepth(1);

    // Wife (Sveta) sleeping — clearly visible on left pillow
    this.wife = this.add.sprite(bedX - 32, bedY - 10, 'wife-sleeping').setDepth(11);
    this.wifeZone = new Phaser.Geom.Circle(bedX - 32, bedY - 10, 44);
    // "Sveta" label above wife
    this.add.text(bedX - 50, bedY - 42, 'Sveta', {
      fontSize: '8px', color: '#6666aa', fontFamily: 'monospace', fontStyle: 'italic',
    }).setDepth(12).setAlpha(0.6);
    // Zzz
    this.zzzText = this.add.text(bedX + 2, bedY - 38, 'z Z z', {
      fontSize: '13px', color: '#8888cc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(12);
    this.tweens.add({
      targets: this.zzzText, y: bedY - 48,
      alpha: { from: 0.3, to: 1 }, yoyo: true, repeat: -1, duration: 1500,
    });
    // Wife wake zone glow
    this.wifeGlow = this.add.circle(bedX - 32, bedY - 10, 44, 0xff4444, 0.03).setDepth(3);

    // --- CLOSET (right side, prominent) ---
    const closetX = roomX + roomW - wallT - 38;
    const closetY = roomY + wallT + 55;
    const closetG = this.add.graphics().setDepth(10);
    // Main body
    closetG.fillStyle(0x5a3a20);
    closetG.fillRect(closetX - 24, closetY - 32, 48, 64);
    // Top molding
    closetG.fillStyle(0x7a5a40);
    closetG.fillRect(closetX - 26, closetY - 34, 52, 4);
    // Door split
    closetG.fillStyle(0x4a2a15);
    closetG.fillRect(closetX - 1, closetY - 30, 2, 58);
    // Handles (gold)
    closetG.fillStyle(0xccaa44);
    closetG.fillRect(closetX - 7, closetY, 4, 6);
    closetG.fillRect(closetX + 3, closetY, 4, 6);
    // "Closet" label
    this.add.text(closetX, closetY + 36, 'closet', {
      fontSize: '8px', color: '#887766', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11).setAlpha(0.7);
    this.add.ellipse(closetX, closetY + 34, 48, 10, 0x000000, 0.1).setDepth(1);
    this.closetX = closetX;
    this.closetY = closetY;

    // Closet SPACE indicator
    this.closetIndicator = this._createSpaceIndicator(closetX, closetY - 44);

    // --- DOOR / STAIRS (bottom wall, clearly marked) ---
    const doorX = roomX + roomW - wallT - 60;
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
    // Stair steps
    doorG.fillStyle(0x333344);
    doorG.fillRect(doorX - 18, doorY + 8, 36, 2);
    doorG.fillStyle(0x2a2a3a);
    doorG.fillRect(doorX - 16, doorY + 16, 32, 2);
    doorG.fillStyle(0x222233);
    doorG.fillRect(doorX - 14, doorY + 24, 28, 2);
    // "stairs" label
    this.add.text(doorX, doorY + wallT + 8, '▼ stairs', {
      fontSize: '9px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(300);
    this.doorX = doorX;
    this.doorY = doorY;

    // Door SPACE indicator — always visible so player knows it's interactive
    this.doorIndicator = this._createSpaceIndicator(doorX, doorY - 14);

    // --- NIGHTSTAND ---
    const nsX = bedX + 88;
    const nsY = bedY - 8;
    this.add.sprite(nsX, nsY, 'nightstand').setDepth(10);
    this.add.ellipse(nsX, nsY + 18, 30, 8, 0x000000, 0.1).setDepth(1);

    // --- PLANT ---
    const plantX = roomX + wallT + 14;
    const plantY = roomY + roomH - wallT - 20;
    this.add.sprite(plantX, plantY, 'plant').setDepth(10);

    // =============================================
    // === CAT (wider patrol, more movement) ===
    // =============================================
    const catStartX = roomX + roomW / 2;
    const catStartY = roomY + roomH / 2 + 30;
    this.cat = this.physics.add.sprite(catStartX, catStartY, 'cat').setDepth(50);
    this.catDirection = 1;
    this.catVertDir = 1;
    // Patrol the whole room center area
    this.catMinX = roomX + wallT + 30;
    this.catMaxX = roomX + roomW - wallT - 30;
    this.catMinY = roomY + wallT + 80;
    this.catMaxY = roomY + roomH - wallT - 30;
    this.catSpeed = 25;
    this.catVertSpeed = 12;
    this.catChangeTimer = 0;
    this.catChangeInterval = 2000; // Change vertical direction every 2s

    // Cat eyes
    this.catEyes = this.add.circle(catStartX, catStartY - 2, 2, 0x44ff44).setAlpha(0.8).setDepth(51);
    this.tweens.add({
      targets: this.catEyes,
      alpha: { from: 0.8, to: 0 },
      duration: 150, yoyo: true, repeat: -1, repeatDelay: 2500,
    });
    this.catShadow = this.add.ellipse(catStartX, catStartY + 8, 20, 6, 0x000000, 0.15).setDepth(1);

    // =============================================
    // === PLAYER (starts in bed, underwear) ===
    // =============================================
    this.player = this.physics.add.sprite(bedX + 36, bedY - 6, 'nikita-underwear').setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
      roomX + wallT + 14, roomY + wallT + 6,
      roomW - wallT * 2 - 28, roomH - wallT * 2 - 12
    ));
    this.playerSpeed = 100;
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 20, 20, 6, 0x000000, 0.2).setDepth(1);
    this.inBed = true;
    this.lastDir = 'down'; // Track facing direction

    // Show as lying in bed
    this.player.setScale(1, 0.5).setAlpha(0.6);

    // =============================================
    // === OBJECTIVE BANNER (top of screen) ===
    // =============================================
    this.objectiveBg = this.add.rectangle(width / 2, 10, 340, 22, 0x000000, 0.6)
      .setDepth(950);
    this.objectiveText = this.add.text(width / 2, 10, '🎯 Get dressed without waking Sveta', {
      fontSize: '11px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(951);

    // === HUD ===
    this.hudIcon = this.add.text(width - 40, 8, '', {
      fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(900);

    // === STATE ===
    this.dressed = this.gameFlags.dressed || false;
    this.frozen = true;
    this.roomBounds = { x: roomX, y: roomY, w: roomW, h: roomH, wallT };
    this.catMeowed = false;

    if (this.dressed) {
      this.player.setTexture('nikita-dressed').setScale(1, 1).setAlpha(1);
      this.inBed = false;
      this.closetIndicator.group.setVisible(false);
      this._updateObjective('Find the stairs and head down');
      this._updateHUD();
    }

    // === INTRO ===
    this.dialogue.startSequence(dialogueData.bedroom.intro, {
      onComplete: () => {
        if (this.inBed) {
          this._stepOutOfBed();
        } else {
          this.frozen = false;
        }
      },
    });

    // Input
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) { this.audio.playBlip(); this.dialogue.advance(); }
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) { this.audio.playBlip(); this.dialogue.advance(); }
    });

    this.save.autoSave('BedroomScene', this.gameFlags);
    this.pauseOverlay = new PauseOverlay(this, () => ({
      scene: this.scene.key, flags: this.gameFlags,
      position: this.player ? { x: this.player.x, y: this.player.y } : undefined,
    }));
  }

  _createSpaceIndicator(x, y) {
    const bg = this.add.rectangle(x, y, 56, 18, 0x000000, 0.5).setDepth(899);
    const border = this.add.rectangle(x, y, 56, 18)
      .setStrokeStyle(1, 0xccaa44, 0.6).setFillStyle(0, 0).setDepth(899);
    const text = this.add.text(x, y, '⌨ SPACE', {
      fontSize: '9px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(900);
    const group = this.add.container(0, 0, [bg, border, text]).setDepth(899);
    this.tweens.add({
      targets: group, alpha: { from: 0.5, to: 1 },
      y: { from: 0, to: -3 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut',
    });
    return { group };
  }

  _stepOutOfBed() {
    this.tweens.add({
      targets: this.player, scaleY: 1, scaleX: 1, alpha: 1,
      duration: 400, ease: 'Back.easeOut',
    });
    const standX = this.roomBounds.x + this.roomBounds.wallT + 180;
    const standY = this.roomBounds.y + this.roomBounds.h / 2;
    this.tweens.add({
      targets: this.player, x: standX, y: standY,
      duration: 600, delay: 300, ease: 'Power2',
      onComplete: () => {
        this.inBed = false;
        this.frozen = false;
      },
    });
  }

  _updateObjective(text) {
    this.objectiveText.setText('🎯 ' + text);
  }

  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;

    // Sync shadows always
    if (this.playerShadow) this.playerShadow.setPosition(this.player.x, this.player.y + 20);
    if (this.catShadow) this.catShadow.setPosition(this.cat.x, this.cat.y + 8);

    if (this.frozen || this.dialogue.isActive()) {
      this.player.setVelocity(0);
      return;
    }

    // === PLAYER MOVEMENT + FACING DIRECTION ===
    let vx = 0, vy = 0;
    if (this.inputMgr.isDown('left')) { vx = -this.playerSpeed; this.lastDir = 'left'; }
    if (this.inputMgr.isDown('right')) { vx = this.playerSpeed; this.lastDir = 'right'; }
    if (this.inputMgr.isDown('up')) { vy = -this.playerSpeed; this.lastDir = 'up'; }
    if (this.inputMgr.isDown('down')) { vy = this.playerSpeed; this.lastDir = 'down'; }
    this.player.setVelocity(vx, vy);

    // Flip sprite based on horizontal direction
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // === CAT PATROL (2D wander) ===
    this.cat.x += this.catDirection * this.catSpeed * (delta / 1000);
    this.cat.y += this.catVertDir * this.catVertSpeed * (delta / 1000);

    if (this.cat.x >= this.catMaxX) this.catDirection = -1;
    if (this.cat.x <= this.catMinX) this.catDirection = 1;
    if (this.cat.y >= this.catMaxY) this.catVertDir = -1;
    if (this.cat.y <= this.catMinY) this.catVertDir = 1;

    // Randomly change vertical direction
    this.catChangeTimer += delta;
    if (this.catChangeTimer > this.catChangeInterval) {
      this.catChangeTimer = 0;
      if (Math.random() < 0.4) this.catVertDir *= -1;
      if (Math.random() < 0.3) this.catDirection *= -1;
    }

    // Cat facing direction
    if (this.catDirection < 0) this.cat.setFlipX(true);
    else this.cat.setFlipX(false);

    this.catEyes.setPosition(this.cat.x, this.cat.y - 2);

    // === CAT COLLISION — meows and wakes wife ===
    const distCat = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.cat.x, this.cat.y);
    if (distCat < 24 && !this.catMeowed) {
      this._catMeow();
      return;
    }

    // === WIFE WAKE ZONE (proximity only, no cat involved) ===
    if (this.wifeZone.contains(this.player.x, this.player.y)) {
      this._failStealth();
      return;
    }

    // === PROXIMITY SPACE INDICATORS ===
    const distCloset = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.closetX, this.closetY
    );
    this.closetIndicator.group.setVisible(!this.dressed && distCloset < 55);

    const distDoor = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.doorX, this.doorY
    );
    this.doorIndicator.group.setVisible(distDoor < 55);

    // === INTERACTIONS ===
    if (this.inputMgr.justPressed('interact')) {
      if (!this.dressed && distCloset < 45) {
        this._getDressed();
      } else if (distDoor < 45) {
        this._tryExit();
      }
    }

    this.inputMgr.clearJustPressed();
  }

  _catMeow() {
    this.catMeowed = true;
    this.frozen = true;
    this.player.setVelocity(0);
    this.audio.playMeow();

    // Cat jumps away
    this.tweens.add({
      targets: this.cat, y: this.cat.y - 30, duration: 200, yoyo: true,
    });

    // Show meow text
    const meowText = this.add.text(this.cat.x, this.cat.y - 20, 'MEOW!', {
      fontSize: '16px', color: '#ff6666', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(500);

    this.tweens.add({
      targets: meowText, y: meowText.y - 20, alpha: 0, duration: 1000,
      onComplete: () => meowText.destroy(),
    });

    // Wife wakes up after meow
    this.time.delayedCall(800, () => {
      this._failStealth();
    });
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
        const standX = this.roomBounds.x + this.roomBounds.wallT + 180;
        const standY = this.roomBounds.y + this.roomBounds.h / 2;
        this.player.setPosition(standX, standY);
        this.catMeowed = false; // Reset cat meow state
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
    this.closetIndicator.group.setVisible(false);
    this._updateObjective('Head to the stairs');

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
    if (this.dressed) this.hudIcon.setText('👔');
  }
}
