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

export class DojoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DojoScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: true, banana: true, coffee: true };
  }

  create() {
    // === SYSTEMS ===
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'dojo');
    this.audio.playMusic('dojo');

    // === WORLD DIMENSIONS ===
    const worldW = 1280;
    const worldH = 1800;
    const wallT = 48;

    // Physics world bounds
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Camera bounds (viewport is 1280x720, world is 1280x1800)
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    // === STATE ===
    this.phase = 'explore'; // explore -> dialogue -> sparring -> outcome
    this.changedToGi = false;
    this.senseiGreeted = false;
    this.matGateShown = false;
    this.round = 0;
    this.frozen = true;

    // === DRAW WORLD ===
    this._drawWorld(worldW, worldH, wallT);

    // === NPCS ===
    this._placeNPCs();

    // === PLAYER ===
    const spawnX = 640;
    const spawnY = 1720;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'nikita-dressed-d0').setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 12);
    this.player.body.setOffset(6, 36);
    this.playerShadow = this.add.ellipse(spawnX, spawnY + 20, 20, 6, 0x000000, 0.2).setDepth(1);
    this.animator = new CharacterAnimator(this);
    this.movement = new MovementController(this, this.player, {
      speed: 152,
      shadow: { sprite: this.playerShadow, offsetY: 20 },
      animator: this.animator,
      animKey: 'nikita-dressed',
    });

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // === WALL COLLIDERS ===
    this._buildWalls(worldW, worldH, wallT);

    // === SPACE INDICATORS ===
    this.lockerIndicator = this._createSpaceIndicator(this.lockerX, this.lockerY - 36);
    this.igorIndicator = this._createSpaceIndicator(this.igorX, this.igorY - 36);
    this.igorIndicator.group.setVisible(false);

    // === OBJECTIVE BANNER (fixed to camera) ===
    const camW = this.cameras.main.width;
    this.objectiveBg = this.add.rectangle(camW / 2, 10, 400, 22, 0x000000, 0.6)
      .setDepth(950).setScrollFactor(0);
    this.objectiveText = this.add.text(camW / 2, 10, '', {
      fontSize: '11px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(951).setScrollFactor(0);
    this._updateObjective('Find the locker room (right path)');

    // === INPUT (dialogue/sparring) ===
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive() && !this.dialogue.hasChoices()) {
        this.audio.playBlip();
        this.dialogue.advance();
      }
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) {
        if (this.dialogue.hasChoices()) {
          this.audio.playConfirm();
          this.dialogue.confirmChoice();
        } else {
          this.audio.playBlip();
          this.dialogue.advance();
        }
      }
    });
    this.input.keyboard.on('keydown-UP', () => {
      if (this.dialogue.hasChoices()) this.dialogue.moveChoiceUp();
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.dialogue.hasChoices()) this.dialogue.moveChoiceDown();
    });
    this.input.keyboard.on('keydown-W', () => {
      if (this.dialogue.hasChoices()) this.dialogue.moveChoiceUp();
    });
    this.input.keyboard.on('keydown-S', () => {
      if (this.dialogue.hasChoices()) this.dialogue.moveChoiceDown();
    });

    // === SAVE & PAUSE ===
    this.save.autoSave('DojoScene', this.gameFlags);
    this.pauseOverlay = new PauseOverlay(this, () => ({
      scene: this.scene.key,
      flags: this.gameFlags,
      position: this.player ? { x: this.player.x, y: this.player.y } : undefined,
    }));

    // === ENTRY ANIMATION ===
    this.tweens.add({
      targets: this.player,
      y: 1620,
      duration: 800,
      ease: 'Power2',
      onComplete: () => { this.frozen = false; },
    });
  }

  // =============================================
  // DRAW WORLD
  // =============================================
  _drawWorld(worldW, worldH, wallT) {
    // Dark background fill
    this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH, 0x1a1a22).setDepth(-1);

    const g = this.add.graphics().setDepth(0);

    // --- ENTRANCE CORRIDOR (y:1500-1800, x:440-840) ---
    for (let y = 1500; y < 1800; y += 32) {
      const shade = Math.floor(Math.random() * 8) - 4;
      g.fillStyle(((0x3a + shade) << 16) | ((0x2a + shade) << 8) | (0x1a + shade));
      g.fillRect(440, y, 400, 31);
      g.fillStyle(0x2a1a08, 0.4);
      g.fillRect(440, y + 31, 400, 1);
    }

    // --- FORK AREA (y:1200-1500, x:100-1180) ---
    for (let y = 1200; y < 1500; y += 32) {
      const shade = Math.floor(Math.random() * 8) - 4;
      g.fillStyle(((0x3a + shade) << 16) | ((0x2a + shade) << 8) | (0x1a + shade));
      g.fillRect(100, y, 1080, 31);
      g.fillStyle(0x2a1a08, 0.4);
      g.fillRect(100, y + 31, 1080, 1);
    }

    // --- LEFT CORRIDOR (y:720-1200, x:100-540) ---
    for (let y = 720; y < 1200; y += 32) {
      const shade = Math.floor(Math.random() * 8) - 4;
      g.fillStyle(((0x3a + shade) << 16) | ((0x2a + shade) << 8) | (0x1a + shade));
      g.fillRect(100, y, 440, 31);
    }

    // --- RIGHT CORRIDOR + LOCKER ROOM (y:720-1200, x:740-1180) ---
    for (let ty = 720; ty < 1200; ty += 40) {
      for (let tx = 740; tx < 1180; tx += 40) {
        g.fillStyle(((ty + tx) % 80 === 0) ? 0x5a6e6e : 0x4e6060);
        g.fillRect(tx, ty, 39, 39);
      }
    }

    // Locker room benches
    const benchG = this.add.graphics().setDepth(10);
    benchG.fillStyle(0x5a3a20);
    benchG.fillRect(780, 900, 120, 20);
    benchG.fillRect(780, 1050, 120, 20);
    benchG.fillStyle(0x4a2a15);
    benchG.fillRect(785, 920, 8, 10);
    benchG.fillRect(887, 920, 8, 10);
    benchG.fillRect(785, 1070, 8, 10);
    benchG.fillRect(887, 1070, 8, 10);

    // Lockers (right wall of locker room)
    const lockerG = this.add.graphics().setDepth(10);
    for (let i = 0; i < 4; i++) {
      const lx = 1100;
      const ly = 780 + i * 80;
      lockerG.fillStyle(0x667788);
      lockerG.fillRect(lx, ly, 50, 70);
      lockerG.fillStyle(0x556677);
      lockerG.fillRect(lx + 24, ly, 2, 70);
      lockerG.fillStyle(0xccaa44);
      lockerG.fillRect(lx + 10, ly + 32, 4, 6);
      lockerG.fillRect(lx + 32, ly + 32, 4, 6);
    }

    // Gi locker (special, highlighted)
    this.lockerX = 960;
    this.lockerY = 1080;
    lockerG.fillStyle(0x7788aa);
    lockerG.fillRect(this.lockerX - 25, this.lockerY - 35, 50, 70);
    lockerG.fillStyle(0x6677aa);
    lockerG.fillRect(this.lockerX - 1, this.lockerY - 35, 2, 70);
    lockerG.fillStyle(0xccaa44);
    lockerG.fillRect(this.lockerX - 11, this.lockerY - 3, 4, 6);
    lockerG.fillRect(this.lockerX + 7, this.lockerY - 3, 4, 6);
    this.add.text(this.lockerX, this.lockerY + 42, 'your gi', {
      fontSize: '8px', color: '#aabbcc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);
    this.add.ellipse(this.lockerX, this.lockerY + 38, 50, 10, 0x000000, 0.1).setDepth(1);

    // --- MAT AREA (y:100-660, x:140-1140) ---
    const matG = this.add.graphics().setDepth(0);
    matG.fillStyle(0xeeeeee);
    matG.fillRect(140, 100, 1000, 560);
    matG.lineStyle(4, 0xcc2222);
    matG.strokeRect(140, 100, 1000, 560);
    matG.lineStyle(1, 0xdddddd);
    for (let x = 140; x <= 1140; x += 80) {
      matG.lineBetween(x, 100, x, 660);
    }
    for (let y = 100; y <= 660; y += 80) {
      matG.lineBetween(140, y, 1140, y);
    }
    matG.lineStyle(1, 0xe8e8e8, 0.5);
    for (let y = 102; y < 658; y += 8) {
      matG.lineBetween(142, y, 1138, y);
    }

    // --- WALLS (drawn on top, Zelda-style with texture + baseboard) ---
    const wallG = this.add.graphics().setDepth(200);
    const wallColor = 0x2a2244;
    const dotColor = 0x332255;
    const baseboardColor = 0x3a2a18;
    const bb = 8; // baseboard thickness

    // Helper: fill wall rect + dot texture
    const drawWallRect = (x, y, w, h) => {
      wallG.fillStyle(wallColor);
      wallG.fillRect(x, y, w, h);
      wallG.fillStyle(dotColor, 0.3);
      for (let wx = x; wx < x + w; wx += 18) {
        for (let wy = y + 4; wy < y + h - 4; wy += 12) {
          wallG.fillRect(wx + 7, wy, 3, 3);
        }
      }
    };

    // Helper: baseboard on inner edge of wall
    const drawBaseboard = (x, y, w, h) => {
      wallG.fillStyle(baseboardColor);
      wallG.fillRect(x, y, w, h);
    };

    // === TOP WALL (full width, above mat area) ===
    drawWallRect(0, 0, worldW, wallT);
    drawBaseboard(0, wallT - bb, worldW, bb); // baseboard along bottom edge

    // Wall scrolls (decorative, on top wall)
    wallG.fillStyle(0xeeeecc);
    wallG.fillRect(300, 5, 40, 36);
    wallG.fillRect(940, 5, 40, 36);
    wallG.fillStyle(0x333333);
    wallG.fillRect(308, 10, 24, 4);
    wallG.fillRect(312, 18, 16, 2);
    wallG.fillRect(948, 10, 24, 4);
    wallG.fillRect(952, 18, 16, 2);

    // === LEFT OUTER WALL ===
    drawWallRect(0, 0, 100, worldH);
    drawBaseboard(100 - bb, 0, bb, worldH); // baseboard on right (inner) edge

    // === RIGHT OUTER WALL ===
    drawWallRect(1180, 0, 100, worldH);
    drawBaseboard(1180, 0, bb, worldH); // baseboard on left (inner) edge

    // === BOTTOM WALL ===
    drawWallRect(0, 1750, worldW, 50);
    drawBaseboard(0, 1750, worldW, bb); // baseboard along top edge

    // === ENTRANCE CORRIDOR WALLS (horizontal segments narrowing passage) ===
    drawWallRect(100, 1500, 340, wallT);
    drawBaseboard(100, 1500 + wallT - bb, 340, bb); // bottom baseboard
    drawWallRect(840, 1500, 340, wallT);
    drawBaseboard(840, 1500 + wallT - bb, 340, bb);

    // Entrance corridor side walls (vertical, left+right of narrow passage)
    // These are already covered by left/right outer walls extending down,
    // but we add inner-face baseboards where the corridor meets the fork
    drawBaseboard(440 - bb, 1500 + wallT, bb, 250); // left corridor edge
    drawBaseboard(840, 1500 + wallT, bb, 250);       // right corridor edge

    // === CENTER DIVIDER WALL (y:720-1200) ===
    drawWallRect(540, 720, 200, 480);
    drawBaseboard(540, 720, bb, 480);           // left face
    drawBaseboard(540 + 200 - bb, 720, bb, 480); // right face
    drawBaseboard(540, 720, 200, bb);            // top face
    drawBaseboard(540, 720 + 480 - bb, 200, bb); // bottom face

    // === UPPER WALL (mat area to corridors boundary, right portion) ===
    drawWallRect(540, 660, 640, 60);
    drawBaseboard(540, 660, 640, bb);           // top face
    drawBaseboard(540, 660 + 60 - bb, 640, bb); // bottom face

    // Signs
    this.add.text(860, 730, 'LOCKER ROOM', {
      fontSize: '10px', color: '#99aabb', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(201);
    this.add.text(320, 680, 'MAT', {
      fontSize: '10px', color: '#cc6644', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(201);

    // Entrance gate graphic
    const gateG = this.add.graphics().setDepth(199);
    gateG.fillStyle(0x0e0e1a);
    gateG.fillRect(540, 1500, 200, wallT);
    gateG.fillStyle(0x5a4030);
    gateG.fillRect(538, 1498, 4, wallT + 4);
    gateG.fillRect(738, 1498, 4, wallT + 4);
    this.add.text(640, 1760, 'ENTRANCE', {
      fontSize: '9px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(201);
  }

  // =============================================
  // GENERATE NINJA TEXTURES
  // =============================================
  _generateNinjaTexture(key, giColor, beltColor) {
    const g = this.add.graphics();
    // Hair
    g.fillStyle(0x1a1a2a);
    g.fillRect(8, 0, 16, 8);
    g.fillRect(6, 4, 20, 6);
    // Face (skin)
    g.fillStyle(0xd4a574);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xc49464);
    g.fillRect(6, 10, 3, 6);
    g.fillRect(23, 10, 3, 6);
    // Eyes
    g.fillStyle(0x222233);
    g.fillRect(11, 12, 3, 3);
    g.fillRect(18, 12, 3, 3);
    // Eyebrows
    g.fillStyle(0x1a1a2a);
    g.fillRect(10, 10, 5, 2);
    g.fillRect(17, 10, 5, 2);
    // Mouth
    g.fillStyle(0xcc7755);
    g.fillRect(13, 17, 6, 2);
    // Neck
    g.fillStyle(0xd4a574);
    g.fillRect(13, 20, 6, 3);
    // Gi top
    g.fillStyle(giColor);
    g.fillRect(4, 23, 24, 14);
    // Gi lapels (slightly darker)
    const r = (giColor >> 16) & 0xff;
    const gv = (giColor >> 8) & 0xff;
    const b = giColor & 0xff;
    const darkerGi = ((Math.max(0, r - 30)) << 16) | ((Math.max(0, gv - 30)) << 8) | Math.max(0, b - 30);
    g.fillStyle(darkerGi);
    g.fillRect(10, 23, 5, 8);
    g.fillRect(17, 23, 5, 8);
    // Belt
    g.fillStyle(beltColor);
    g.fillRect(4, 35, 24, 4);
    g.fillStyle(beltColor);
    g.fillRect(13, 35, 6, 4);
    // Arms (gi sleeves)
    g.fillStyle(giColor);
    g.fillRect(0, 24, 5, 10);
    g.fillRect(27, 24, 5, 10);
    // Gi pants
    const lighterGi = ((Math.min(255, r + 15)) << 16) | ((Math.min(255, gv + 15)) << 8) | Math.min(255, b + 15);
    g.fillStyle(lighterGi);
    g.fillRect(6, 39, 8, 9);
    g.fillRect(18, 39, 8, 9);
    // Bare feet
    g.fillStyle(0xd4a574);
    g.fillRect(6, 46, 8, 2);
    g.fillRect(18, 46, 8, 2);
    g.generateTexture(key, 32, 48);
    g.destroy();
  }

  // =============================================
  // PLACE NPCS
  // =============================================
  _placeNPCs() {
    // Generate 6 ninja textures (3 pairs with distinct gi colors)
    const ninjaColors = [
      { key: 'ninja-red',    gi: 0xcc3333, belt: 0x111111 },
      { key: 'ninja-blue',   gi: 0x3344aa, belt: 0x884400 },
      { key: 'ninja-green',  gi: 0x338833, belt: 0x111111 },
      { key: 'ninja-orange', gi: 0xcc7722, belt: 0x222266 },
      { key: 'ninja-purple', gi: 0x7733aa, belt: 0x884400 },
      { key: 'ninja-yellow', gi: 0xccbb33, belt: 0x111111 },
    ];
    ninjaColors.forEach(c => this._generateNinjaTexture(c.key, c.gi, c.belt));

    // 3 sparring pairs on mat
    const pairs = [
      { x: 300, y: 300, left: 'ninja-red', right: 'ninja-blue' },
      { x: 640, y: 430, left: 'ninja-green', right: 'ninja-orange' },
      { x: 980, y: 300, left: 'ninja-purple', right: 'ninja-yellow' },
    ];
    pairs.forEach((pair, i) => {
      const spacing = 30;
      // Left ninja (faces right)
      const left = this.add.sprite(pair.x - spacing, pair.y, pair.left).setDepth(10);
      this.add.ellipse(pair.x - spacing, pair.y + 22, 20, 6, 0x000000, 0.12).setDepth(1);
      // Right ninja (faces left, flipped)
      const right = this.add.sprite(pair.x + spacing, pair.y, pair.right).setDepth(10).setFlipX(true);
      this.add.ellipse(pair.x + spacing, pair.y + 22, 20, 6, 0x000000, 0.12).setDepth(1);

      // Breathing tweens
      [left, right].forEach(ninja => {
        this.tweens.add({
          targets: ninja,
          scaleY: { from: 1, to: 1.02 }, scaleX: { from: 1, to: 0.98 },
          yoyo: true, repeat: -1, duration: 2000 + i * 200, ease: 'Sine.easeInOut',
        });
      });

      // Sparring approach/retreat animation (staggered per pair)
      this.tweens.add({
        targets: left, x: pair.x - spacing + 12,
        yoyo: true, repeat: -1, duration: 1200, delay: i * 500,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: right, x: pair.x + spacing - 12,
        yoyo: true, repeat: -1, duration: 1200, delay: i * 500,
        ease: 'Sine.easeInOut',
      });
    });

    // Sensei (Nashebo) at mat entrance
    this.senseiX = 380;
    this.senseiY = 620;
    this.sensei = this.add.sprite(this.senseiX, this.senseiY, 'sensei').setDepth(50);
    this.add.ellipse(this.senseiX, this.senseiY + 22, 24, 8, 0x000000, 0.15).setDepth(1);
    this.tweens.add({
      targets: this.sensei,
      scaleY: { from: 1, to: 1.01 }, scaleX: { from: 1, to: 0.995 },
      yoyo: true, repeat: -1, duration: 2500, ease: 'Sine.easeInOut',
    });

    // Igor at far end of mat
    this.igorX = 640;
    this.igorY = 180;
    this.igor = this.add.sprite(this.igorX, this.igorY, 'igor').setDepth(50);
    this.add.ellipse(this.igorX, this.igorY + 22, 24, 8, 0x000000, 0.15).setDepth(1);
    this.tweens.add({
      targets: this.igor,
      scaleY: { from: 1, to: 1.015 }, scaleX: { from: 1, to: 0.99 },
      yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut',
    });
  }

  // =============================================
  // WALL COLLIDERS
  // =============================================
  _buildWalls(worldW, worldH, wallT) {
    this.walls = this.physics.add.staticGroup();

    const addWall = (x, y, w, h) => {
      const wall = this.add.rectangle(x, y, w, h, 0xff0000, 0);
      this.physics.add.existing(wall, true);
      this.walls.add(wall);
    };

    // Top wall
    addWall(worldW / 2, wallT / 2, worldW, wallT);
    // Left outer wall
    addWall(50, worldH / 2, 100, worldH);
    // Right outer wall
    addWall(worldW - 50, worldH / 2, 100, worldH);
    // Bottom wall
    addWall(worldW / 2, 1775, worldW, 50);

    // Entrance corridor horizontal walls
    addWall(270, 1524, 340, wallT);
    addWall(1010, 1524, 340, wallT);

    // Entrance corridor side walls
    addWall(440, 1625, wallT, 250);
    addWall(840, 1625, wallT, 250);

    // Center divider
    addWall(640, 960, 200, 480);

    // Upper wall right portion (mat area to corridors boundary)
    addWall(860, 690, 640, 60);

    // Mat area left boundary
    addWall(120, 380, 40, 560);
    // Mat area right boundary
    addWall(1160, 380, 40, 560);

    this.physics.add.collider(this.player, this.walls);
  }

  // =============================================
  // SPACE INDICATOR
  // =============================================
  _createSpaceIndicator(x, y) {
    const bg = this.add.rectangle(x, y, 56, 18, 0x000000, 0.5).setDepth(899);
    const border = this.add.rectangle(x, y, 56, 18)
      .setStrokeStyle(1, 0xccaa44, 0.6).setFillStyle(0, 0).setDepth(899);
    const text = this.add.text(x, y, 'SPACE', {
      fontSize: '9px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(900);
    const group = this.add.container(0, 0, [bg, border, text]).setDepth(899);
    this.tweens.add({
      targets: group, alpha: { from: 0.5, to: 1 },
      y: { from: 0, to: -3 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut',
    });
    return { group };
  }

  // =============================================
  // UPDATE LOOP
  // =============================================
  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;

    if (this.frozen || this.dialogue.isActive()) {
      this.movement.stop();
      return;
    }

    this.movement.update(this.inputMgr, delta);

    // === LOCKER INTERACTION ===
    if (!this.changedToGi) {
      const distLocker = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.lockerX, this.lockerY
      );
      this.lockerIndicator.group.setVisible(distLocker < 55);
    }

    // === MAT GATE (can't enter mat without gi) ===
    if (!this.changedToGi && this.player.y < 700 && this.player.x < 540) {
      if (!this.matGateShown) {
        this._matGateBlock();
        return;
      }
    } else {
      this.matGateShown = false;
    }

    // === SENSEI GREETING (auto-trigger) ===
    if (this.changedToGi && !this.senseiGreeted) {
      const distSensei = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.senseiX, this.senseiY
      );
      if (distSensei < 80) {
        this._senseiGreeting();
        return;
      }
    }

    // === IGOR INDICATOR ===
    if (this.senseiGreeted && this.phase === 'explore') {
      const distIgor = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.igorX, this.igorY
      );
      this.igorIndicator.group.setVisible(distIgor < 70);
    }

    // === INTERACTIONS (SPACE) ===
    if (this.inputMgr.justPressed('interact')) {
      if (!this.changedToGi) {
        const distLocker = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, this.lockerX, this.lockerY
        );
        if (distLocker < 45) {
          this._changeToGi();
        }
      }
      if (this.senseiGreeted && this.phase === 'explore') {
        const distIgor = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, this.igorX, this.igorY
        );
        if (distIgor < 60) {
          this._startIntroDialogue();
        }
      }
    }

    this.inputMgr.clearJustPressed();
  }

  // =============================================
  // INTERACTIONS
  // =============================================
  _updateObjective(text) {
    this.objectiveText.setText('🎯 ' + text);
  }

  _changeToGi() {
    this.frozen = true;
    this.movement.stop();
    this.changedToGi = true;
    this.player.setTexture('nikita-gi-d0');
    this.movement.animKey = 'nikita-gi';
    this.audio.playFanfare();
    this.lockerIndicator.group.setVisible(false);
    this._updateObjective('Head to the mat area (left path)');
    this.dialogue.startSequence(dialogueData.dojo.lockerChange, {
      onComplete: () => { this.frozen = false; },
    });
  }

  _matGateBlock() {
    this.matGateShown = true;
    this.frozen = true;
    this.movement.stop();
    this.player.y = 720;
    this.dialogue.startSequence(dialogueData.dojo.matGate, {
      onComplete: () => { this.frozen = false; },
    });
  }

  _senseiGreeting() {
    this.senseiGreeted = true;
    this.frozen = true;
    this.movement.stop();
    this._updateObjective('Meet Igor at the end of the mat');
    this.dialogue.startSequence(dialogueData.dojo.senseiGreet, {
      onComplete: () => { this.frozen = false; },
    });
  }

  _startIntroDialogue() {
    this.frozen = true;
    this.movement.stop();
    this.phase = 'dialogue';
    this.igorIndicator.group.setVisible(false);
    this._updateObjective('');
    this.objectiveBg.setVisible(false);
    this.objectiveText.setVisible(false);
    this.dialogue.startSequence(dialogueData.dojo.intro, {
      onComplete: () => this._startSparring(),
    });
  }

  // =============================================
  // SPARRING SYSTEM
  // =============================================
  _startSparring() {
    this.phase = 'sparring';
    this.round = 1;
    this._startRound();
  }

  _startRound() {
    const roundKey = `round${this.round}`;
    const roundData = dialogueData.dojo[roundKey];
    if (!roundData) {
      this._showOutcome();
      return;
    }

    // Igor approaches
    this.tweens.add({
      targets: this.igor,
      x: this.player.x + 60,
      y: this.player.y,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        const flavorLine = { speaker: '', text: roundData.flavor, style: { color: '#666666' } };
        const choiceLine = {
          speaker: 'Choose your move:',
          text: '',
          choices: roundData.choices,
        };
        this.dialogue.startSequence([flavorLine, choiceLine], {
          onComplete: () => this._executeMove(),
        });
      },
    });
  }

  _executeMove() {
    const selectedMove = this.dialogue.getSelectedChoice();
    this.audio.playHit();

    // Show selected move name (fixed to camera)
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const moveText = this.add.text(camW / 2, camH * 0.3, selectedMove || 'Mystery Move', {
      fontSize: '28px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(950);

    this.tweens.add({
      targets: moveText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.2 },
      duration: 500,
      yoyo: true,
      hold: 800,
      onComplete: () => moveText.destroy(),
    });

    // Push Igor back
    this.tweens.add({
      targets: this.igor,
      x: this.igorX,
      y: this.igorY,
      duration: 400,
      ease: 'Back',
      delay: 1200,
      onComplete: () => {
        const postKey = `postRound${this.round}`;
        const postLines = dialogueData.dojo[postKey];
        const advance = () => {
          this.round++;
          if (this.round <= 3) {
            this.time.delayedCall(500, () => this._startRound());
          } else {
            this.time.delayedCall(500, () => this._showOutcome());
          }
        };
        if (postLines) {
          this.dialogue.startSequence(postLines, { onComplete: advance });
        } else {
          advance();
        }
      },
    });
  }

  _showOutcome() {
    this.phase = 'outcome';
    this.dialogue.startSequence(dialogueData.dojo.outcome, {
      onComplete: () => {
        this.save.autoSave('OfficeScene', this.gameFlags);
        this.transition.fadeToScene('OfficeScene', { flags: this.gameFlags });
      },
    });
  }
}
