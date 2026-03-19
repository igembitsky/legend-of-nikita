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

    // === ROOM DIMENSIONS — cozy, centered, not full screen ===
    const roomW = 520;
    const roomH = 380;
    const roomX = (width - roomW) / 2;
    const roomY = 30; // Leave space below for dialogue

    // Dark surround (the void outside the room)
    this.add.rectangle(width / 2, height / 2, width, height, 0x050508).setDepth(-1);

    // === ROOM FLOOR ===
    const floorG = this.add.graphics().setDepth(0);
    // Wood planks
    for (let py = roomY; py < roomY + roomH; py += 32) {
      const shade = Math.floor(Math.random() * 12) - 6;
      const r = 0x4a + shade, g = 0x30 + shade, b = 0x20 + shade;
      const color = (r << 16) | (g << 8) | b;
      floorG.fillStyle(color);
      floorG.fillRect(roomX, py, roomW, 31);
      floorG.fillStyle(0x2a1a08);
      floorG.fillRect(roomX, py + 31, roomW, 1);
      // Stagger joints
      const offset = (Math.floor((py - roomY) / 32) % 2) * 100;
      floorG.fillStyle(0x2a1a08, 0.4);
      for (let jx = roomX + offset + 120; jx < roomX + roomW; jx += 200) {
        floorG.fillRect(jx, py, 1, 31);
      }
    }

    // === WALLS ===
    const wallT = 36; // wall thickness
    const wallG = this.add.graphics().setDepth(200);

    // Top wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX, roomY, roomW, wallT);
    // Wallpaper subtle pattern
    wallG.fillStyle(0x332255, 0.3);
    for (let wx = roomX; wx < roomX + roomW; wx += 18) {
      for (let wy = roomY + 4; wy < roomY + wallT - 4; wy += 12) {
        wallG.fillRect(wx + 7, wy, 3, 3);
      }
    }
    // Baseboard
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX, roomY + wallT - 8, roomW, 8);
    wallG.fillStyle(0x5a4a38, 0.5);
    wallG.fillRect(roomX, roomY + wallT - 8, roomW, 2);

    // Left wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX, roomY, wallT, roomH);
    wallG.fillStyle(0x332255, 0.3);
    for (let wy = roomY; wy < roomY + roomH; wy += 18) {
      wallG.fillRect(roomX + 8, wy + 7, 3, 3);
    }
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX + wallT - 8, roomY, 8, roomH);

    // Right wall
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX + roomW - wallT, roomY, wallT, roomH);
    wallG.fillStyle(0x332255, 0.3);
    for (let wy = roomY; wy < roomY + roomH; wy += 18) {
      wallG.fillRect(roomX + roomW - wallT + 8, wy + 7, 3, 3);
    }
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX + roomW - wallT, roomY, 8, roomH);

    // Bottom wall (with door opening)
    wallG.fillStyle(0x2a2244);
    wallG.fillRect(roomX, roomY + roomH - wallT, roomW, wallT);
    wallG.fillStyle(0x3a2a18);
    wallG.fillRect(roomX, roomY + roomH - wallT, roomW, 2);

    // === WINDOW on top wall ===
    const winX = roomX + roomW / 2;
    const winY = roomY + 4;
    const winW = 56;
    const winH = 28;
    const winG = this.add.graphics().setDepth(201);
    // Frame
    winG.fillStyle(0x4a3828);
    winG.fillRect(winX - winW / 2 - 3, winY - 2, winW + 6, winH + 4);
    // Glass
    winG.fillStyle(0x1a2a4a);
    winG.fillRect(winX - winW / 2, winY, winW / 2 - 1, winH);
    winG.fillRect(winX + 1, winY, winW / 2 - 1, winH);
    // Cross
    winG.fillStyle(0x4a3828);
    winG.fillRect(winX - 1, winY, 2, winH);
    // Moonlight glow on floor
    this.add.circle(winX, roomY + wallT + 60, 80, 0x4466aa, 0.05).setDepth(1);
    // Curtains
    winG.fillStyle(0x2a3366, 0.7);
    winG.fillRect(winX - winW / 2 - 6, winY - 2, 8, winH + 12);
    winG.fillRect(winX + winW / 2 - 2, winY - 2, 8, winH + 12);

    // === RUG ===
    const rugX = roomX + roomW / 2;
    const rugY = roomY + roomH / 2 + 30;
    const rugG = this.add.graphics().setDepth(2);
    rugG.fillStyle(0x3a2244);
    rugG.fillRoundedRect(rugX - 80, rugY - 40, 160, 80, 6);
    rugG.lineStyle(2, 0x2a1a33);
    rugG.strokeRoundedRect(rugX - 74, rugY - 34, 148, 68, 4);
    rugG.fillStyle(0x4a3355, 0.3);
    for (let px = rugX - 70; px < rugX + 70; px += 14) {
      for (let py2 = rugY - 30; py2 < rugY + 30; py2 += 14) {
        rugG.fillRect(px, py2, 2, 2);
      }
    }

    // === FURNITURE ===

    // Bed — large, top-left area of room, wife clearly sleeping
    const bedX = roomX + wallT + 80;
    const bedY = roomY + wallT + 50;
    this.bed = this.add.rectangle(bedX, bedY, 140, 80, 0x5c3a1e).setDepth(10);
    // Bed frame detail
    const bedG = this.add.graphics().setDepth(10);
    // Headboard (against top wall)
    bedG.fillStyle(0x4a2a12);
    bedG.fillRect(bedX - 72, bedY - 42, 144, 10);
    // Mattress
    bedG.fillStyle(0xe8e0d0);
    bedG.fillRect(bedX - 68, bedY - 30, 136, 56);
    // Pillow left (wife)
    bedG.fillStyle(0xf0e8d8);
    bedG.fillRect(bedX - 60, bedY - 26, 36, 20);
    bedG.lineStyle(1, 0xd0c8b8);
    bedG.strokeRect(bedX - 60, bedY - 26, 36, 20);
    // Pillow right (Nikita's side)
    bedG.fillStyle(0xf0e8d8);
    bedG.fillRect(bedX + 20, bedY - 26, 36, 20);
    bedG.lineStyle(1, 0xd0c8b8);
    bedG.strokeRect(bedX + 20, bedY - 26, 36, 20);
    // Blanket covering both
    bedG.fillStyle(0x6a8abf);
    bedG.fillRect(bedX - 64, bedY - 4, 128, 28);
    bedG.fillStyle(0x5a7aaf, 0.5);
    bedG.fillRect(bedX - 64, bedY + 4, 128, 1);
    bedG.fillRect(bedX - 64, bedY + 12, 128, 1);
    // Bed shadow
    this.add.ellipse(bedX, bedY + 44, 144, 16, 0x000000, 0.15).setDepth(1);

    // Wife sleeping — visibly ON the bed (left side)
    this.wife = this.add.sprite(bedX - 30, bedY - 12, 'wife-sleeping').setDepth(11);
    this.wifeZone = new Phaser.Geom.Circle(bedX - 30, bedY - 12, 44);

    // Zzz clearly above wife
    this.zzzText = this.add.text(bedX - 5, bedY - 40, 'z Z z', {
      fontSize: '14px', color: '#8888cc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(12);
    this.tweens.add({
      targets: this.zzzText,
      y: bedY - 50,
      alpha: { from: 0.3, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });

    // Wife wake zone glow (subtle)
    this.wifeGlow = this.add.circle(bedX - 30, bedY - 12, 44, 0xff4444, 0.04).setDepth(3);

    // === NIKITA STARTS IN BED ===
    // Player starts on right side of bed (his pillow), will step out
    this.player = this.physics.add.sprite(bedX + 38, bedY - 8, 'nikita-pajamas').setDepth(50);
    this.player.setCollideWorldBounds(true);
    // Constrain player to room bounds
    this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
      roomX + wallT + 16, roomY + wallT + 8,
      roomW - wallT * 2 - 32, roomH - wallT * 2 - 16
    ));
    this.playerSpeed = 100; // Slightly slower — room is small
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 20, 20, 6, 0x000000, 0.2).setDepth(1);
    this.inBed = true; // Player hasn't stepped out yet

    // Show nikita as "lying" — flatten him while in bed
    this.player.setScale(1, 0.5).setAlpha(0.7);

    // Cat — patrols between bed and closet
    const catY = roomY + roomH / 2 + 20;
    this.cat = this.physics.add.sprite(roomX + roomW / 2, catY, 'cat').setDepth(50);
    this.catZone = new Phaser.Geom.Circle(this.cat.x, catY, 30);
    this.catDirection = 1;
    this.catMinX = roomX + wallT + 40;
    this.catMaxX = roomX + roomW - wallT - 40;
    this.catSpeed = 18;
    this.catGlow = this.add.circle(this.cat.x, catY, 30, 0xff4444, 0.04).setDepth(3);

    // Cat eyes
    this.catEyes = this.add.circle(this.cat.x, catY - 2, 2, 0x44ff44).setAlpha(0.8).setDepth(51);
    this.tweens.add({
      targets: this.catEyes,
      alpha: { from: 0.8, to: 0 },
      duration: 150,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2500,
    });

    // === CLOSET — right side, very visible ===
    const closetX = roomX + roomW - wallT - 40;
    const closetY = roomY + wallT + 50;
    this.closet = this.add.rectangle(closetX, closetY, 44, 60, 0x6a4a30).setDepth(10);
    // Closet detail
    const closetG = this.add.graphics().setDepth(10);
    closetG.fillStyle(0x5a3a20);
    closetG.fillRect(closetX - 22, closetY - 30, 44, 60);
    // Door line
    closetG.fillStyle(0x4a2a15);
    closetG.fillRect(closetX - 1, closetY - 28, 2, 56);
    // Handles
    closetG.fillStyle(0xccaa44);
    closetG.fillRect(closetX - 6, closetY, 3, 6);
    closetG.fillRect(closetX + 3, closetY, 3, 6);
    // Top molding
    closetG.fillStyle(0x7a5a40);
    closetG.fillRect(closetX - 24, closetY - 32, 48, 4);
    this.add.ellipse(closetX, closetY + 32, 44, 10, 0x000000, 0.12).setDepth(1);

    // Closet SPACE indicator — animated, prominent
    this.closetIndicator = this._createSpaceIndicator(closetX, closetY - 42);

    // === DOOR (stairs down) — bottom wall, clearly marked ===
    const doorX = roomX + roomW - wallT - 60;
    const doorY = roomY + roomH - wallT;
    // Door opening in bottom wall
    const doorG = this.add.graphics().setDepth(199);
    // Clear a gap in the bottom wall for the door
    doorG.fillStyle(0x1a1a2e); // Dark opening
    doorG.fillRect(doorX - 24, doorY - 2, 48, wallT + 4);
    // Door frame
    doorG.fillStyle(0x5a4030);
    doorG.fillRect(doorX - 26, doorY - 4, 4, wallT + 8);
    doorG.fillRect(doorX + 22, doorY - 4, 4, wallT + 8);
    doorG.fillRect(doorX - 26, doorY - 4, 52, 4);
    // Stair hint (lines going down into darkness)
    doorG.fillStyle(0x333333);
    doorG.fillRect(doorX - 20, doorY + 8, 40, 2);
    doorG.fillStyle(0x2a2a2a);
    doorG.fillRect(doorX - 18, doorY + 16, 36, 2);
    doorG.fillStyle(0x222222);
    doorG.fillRect(doorX - 16, doorY + 24, 32, 2);

    // "STAIRS" label
    this.add.text(doorX, doorY + wallT + 8, '▼ stairs', {
      fontSize: '10px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(300);

    this.doorX = doorX;
    this.doorY = doorY;

    // Door SPACE indicator (hidden until dressed)
    this.doorIndicator = this._createSpaceIndicator(doorX, doorY - 16);
    this.doorIndicator.group.setVisible(false);

    // === NIGHTSTAND ===
    const nsX = bedX + 84;
    const nsY = bedY - 10;
    this.add.sprite(nsX, nsY, 'nightstand').setDepth(10);
    this.add.ellipse(nsX, nsY + 18, 30, 8, 0x000000, 0.12).setDepth(1);

    // === PLANT in corner ===
    const plantX = roomX + wallT + 16;
    const plantY = roomY + roomH - wallT - 24;
    this.add.sprite(plantX, plantY, 'plant').setDepth(10);
    this.add.ellipse(plantX, plantY + 18, 22, 6, 0x000000, 0.1).setDepth(1);

    // === HUD (top right, outside room) ===
    this.hudIcon = this.add.text(width - 40, 8, '', {
      fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(900);

    // === STATE ===
    this.dressed = this.gameFlags.dressed || false;
    this.frozen = true; // Start frozen for intro
    this.roomBounds = { x: roomX, y: roomY, w: roomW, h: roomH, wallT };

    if (this.dressed) {
      this.player.setTexture('nikita-dressed');
      this.player.setScale(1, 1).setAlpha(1);
      this.inBed = false;
      this.closetIndicator.group.setVisible(false);
      this.doorIndicator.group.setVisible(true);
      this._updateHUD();
    }

    // === INTRO SEQUENCE ===
    // Nikita wakes up — show dialogue, then he steps out of bed
    this.dialogue.startSequence(dialogueData.bedroom.intro, {
      onComplete: () => {
        if (this.inBed) {
          this._stepOutOfBed();
        } else {
          this.frozen = false;
        }
      },
    });

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

  /** Create a game-like SPACE indicator with icon and pulse */
  _createSpaceIndicator(x, y) {
    const bg = this.add.rectangle(x, y, 52, 18, 0x000000, 0.5)
      .setDepth(899);
    const border = this.add.rectangle(x, y, 52, 18)
      .setStrokeStyle(1, 0xccaa44, 0.6).setFillStyle(0, 0).setDepth(899);
    const text = this.add.text(x, y, '⬡ SPACE', {
      fontSize: '9px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(900);

    const group = this.add.container(0, 0, [bg, border, text]).setDepth(899);

    this.tweens.add({
      targets: group,
      alpha: { from: 0.5, to: 1 },
      y: { from: 0, to: -3 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut',
    });

    return { group, bg, border, text };
  }

  /** Nikita steps out of bed — a short animation */
  _stepOutOfBed() {
    // Restore normal appearance
    this.tweens.add({
      targets: this.player,
      scaleY: 1,
      scaleX: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Move to standing position beside bed
    const standX = this.roomBounds.x + this.roomBounds.wallT + 180;
    const standY = this.roomBounds.y + this.roomBounds.h / 2 + 10;

    this.tweens.add({
      targets: this.player,
      x: standX,
      y: standY,
      duration: 600,
      delay: 300,
      ease: 'Power2',
      onComplete: () => {
        this.inBed = false;
        this.frozen = false;
      },
    });
  }

  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;
    if (this.frozen || this.dialogue.isActive()) {
      this.player.setVelocity(0);
      // Still sync shadow
      if (this.playerShadow) {
        this.playerShadow.setPosition(this.player.x, this.player.y + 20);
      }
      return;
    }

    // Sync player shadow
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 20);
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

    // Show/hide SPACE indicators based on proximity
    const distCloset = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.closet.x, this.closet.y
    );
    if (!this.dressed) {
      this.closetIndicator.group.setVisible(distCloset < 60);
    }

    const distDoor = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.doorX, this.doorY
    );
    if (this.dressed) {
      this.doorIndicator.group.setVisible(distDoor < 60);
    }

    // Check wake zones
    const px = this.player.x, py = this.player.y;
    if (this.wifeZone.contains(px, py) || this.catZone.contains(px, py)) {
      this._failStealth();
      return;
    }

    // Closet interaction
    if (this.inputMgr.justPressed('interact') && !this.dressed && distCloset < 50) {
      this._getDressed();
    }

    // Door interaction
    if (this.inputMgr.justPressed('interact') && distDoor < 50) {
      this._tryExit();
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
        // Reset to standing position near bed
        const standX = this.roomBounds.x + this.roomBounds.wallT + 180;
        const standY = this.roomBounds.y + this.roomBounds.h / 2 + 10;
        this.player.setPosition(standX, standY);
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
    this.doorIndicator.group.setVisible(true);

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
