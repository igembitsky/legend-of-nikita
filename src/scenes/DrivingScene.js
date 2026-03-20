import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
import dialogueData from '../data/dialogue.json';

export class DrivingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DrivingScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: true, banana: true, coffee: true };
    this.destination = data.destination || 'dojo';
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'driving');
    this.audio.playMusic('driving');

    const { width, height } = this.cameras.main;

    // Reserve bottom 142px for dialogue — gameplay lives above
    this.gameAreaBottom = height - 142;

    // Generate scene-specific sprites
    this._generateSprites();

    // Config based on destination
    const isMorning = this.destination === 'dojo';
    this.scrollSpeed = isMorning ? 4 : 3.2;
    this.spawnInterval = isMorning ? 800 : 1600;
    const bgColor = isMorning ? 0x87ceeb : 0x3a2a1a; // sky blue morning / warm evening
    const roadColor = 0x444444;

    // Sky background
    this.add.rectangle(width / 2, this.gameAreaBottom / 2, width, this.gameAreaBottom, bgColor);

    // Grass strips above and below road
    const grassColor = isMorning ? 0x4a8c3f : 0x3a6a2f;
    this.add.rectangle(width / 2, this.gameAreaBottom * 0.18, width, this.gameAreaBottom * 0.36, grassColor);
    this.add.rectangle(width / 2, this.gameAreaBottom * 0.82, width, this.gameAreaBottom * 0.36, grassColor);

    // --- Horizontal road ---
    this.laneHeight = 52;
    const roadHeight = this.laneHeight * 3;
    this.roadCenterY = this.gameAreaBottom / 2;
    const roadTop = this.roadCenterY - roadHeight / 2;

    // Road surface
    this.add.rectangle(width / 2, this.roadCenterY, width, roadHeight, roadColor);

    // Road edge lines (solid white)
    this.add.rectangle(width / 2, roadTop, width, 3, 0xffffff, 0.6);
    this.add.rectangle(width / 2, roadTop + roadHeight, width, 3, 0xffffff, 0.6);

    // Lane Y positions (top, middle, bottom)
    this.lanes = [
      this.roadCenterY - this.laneHeight,
      this.roadCenterY,
      this.roadCenterY + this.laneHeight,
    ];

    // Lane markings (dashed, horizontal)
    this.laneMarkings = [];
    for (let i = 0; i < 2; i++) {
      const y = this.roadCenterY + (i - 0.5) * this.laneHeight;
      for (let x = -30; x < width + 30; x += 80) {
        const mark = this.add.rectangle(x, y, 40, 3, 0xcccccc, 0.4);
        this.laneMarkings.push(mark);
      }
    }

    // --- House at start (top-left, we drive away from it) ---
    this.house = this.add.sprite(80, roadTop - 60, 'driving-house');
    this.house.setDepth(50);

    // --- Dutch scenery ---
    this._createDutchScenery(width, roadTop, roadHeight, isMorning);

    // Player car — left side
    this.currentLane = 1;
    this.playerX = 140;
    this.player = this.add.sprite(this.playerX, this.lanes[this.currentLane], 'driving-tesla');
    this.player.setAngle(-90); // Face right (horizontal driving)
    this.player.setDepth(100);
    this.targetY = this.player.y;
    this.isMoving = false;

    // Obstacles
    this.obstacles = [];
    this.lastSpawn = 0;

    // Distance tracking
    this.distanceTraveled = 0;
    this.targetDistance = 3600;

    // Distance / progress display (top-right, well above dialogue)
    this.distText = this.add.text(width - 20, 20, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(900);

    this.crashed = false;
    this.completed = false;
    this.halfwayShown = false;

    // Dojo destination (hidden, appears at end — off screen right)
    this.dojo = this.add.sprite(width + 100, roadTop - 60, 'driving-dojo');
    this.dojo.setDepth(50);
    this.dojo.setVisible(false);

    // Pause overlay
    this.pauseOverlay = new PauseOverlay(this, () => ({
      scene: this.scene.key,
      flags: this.gameFlags,
      position: this.player ? { x: this.player.x, y: this.player.y } : undefined,
    }));

    // Intro dialogue
    const introKey = this.destination === 'dojo' ? 'morningIntro' : 'eveningIntro';
    if (dialogueData.driving?.[introKey]) {
      this.dialogue.startSequence(dialogueData.driving[introKey]);
    }

    // Input for dialogue advance
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
  }

  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;
    if (this.crashed || this.completed) return;

    // Lane markings scroll left
    for (const mark of this.laneMarkings) {
      mark.x -= this.scrollSpeed * (delta / 16);
      if (mark.x < -30) {
        mark.x += this.cameras.main.width + 60;
      }
    }

    // Scroll scenery
    this._updateDutchScenery(delta);

    // Scroll house off screen at start
    if (this.house && this.house.x > -120) {
      this.house.x -= this.scrollSpeed * 0.6 * (delta / 16);
    }

    // Lane switching — up/down
    if (!this.isMoving) {
      if (this.inputMgr.justPressed('up') && this.currentLane > 0) {
        this.currentLane--;
        this._moveToLane();
      } else if (this.inputMgr.justPressed('down') && this.currentLane < 2) {
        this.currentLane++;
        this._moveToLane();
      }
    }

    // Smooth vertical movement
    if (this.isMoving) {
      const dy = this.targetY - this.player.y;
      if (Math.abs(dy) < 2) {
        this.player.y = this.targetY;
        this.isMoving = false;
      } else {
        this.player.y += dy * 0.15;
      }
    }

    // Spawn obstacles
    this.lastSpawn += delta;
    if (this.lastSpawn >= this.spawnInterval) {
      this.lastSpawn = 0;
      this._spawnObstacle();
    }

    // Move obstacles (right to left)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.sprite.x -= obs.speed * (delta / 16);

      // Wobble for cyclists (vertical wobble)
      if (obs.type === 'cyclist') {
        obs.sprite.y += Math.sin(time * 0.005 + obs.wobbleOffset) * 0.5;
      }

      // Collision check
      if (this._checkCollision(obs)) {
        this._crash();
        return;
      }

      // Remove off-screen (left edge)
      if (obs.sprite.x < -80) {
        obs.sprite.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Distance
    this.distanceTraveled += this.scrollSpeed * (delta / 16);
    const pct = Math.min(100, Math.round((this.distanceTraveled / this.targetDistance) * 100));
    this.distText.setText(pct + '%');

    // Halfway milestone
    if (!this.halfwayShown && this.distanceTraveled >= this.targetDistance * 0.5) {
      this.halfwayShown = true;
      if (dialogueData.driving?.halfway) {
        this.dialogue.startSequence(dialogueData.driving.halfway);
      }
    }

    // Show dojo approaching near the end (last 15%)
    if (this.distanceTraveled >= this.targetDistance * 0.85) {
      this.dojo.setVisible(true);
      const approach = (this.distanceTraveled - this.targetDistance * 0.85) / (this.targetDistance * 0.15);
      const targetX = this.cameras.main.width - 100;
      this.dojo.x = this.cameras.main.width + 100 - approach * 200;
      if (this.dojo.x < targetX) this.dojo.x = targetX;
    }

    if (this.distanceTraveled >= this.targetDistance) {
      this._complete();
    }

    this.inputMgr.clearJustPressed();
  }

  _moveToLane() {
    this.targetY = this.lanes[this.currentLane];
    this.isMoving = true;
  }

  _spawnObstacle() {
    const lane = Phaser.Math.Between(0, 2);
    const isCyclist = Math.random() < 0.65;
    const type = isCyclist ? 'driving-cyclist' : 'car-1';
    const speed = isCyclist ? this.scrollSpeed * 0.8 : this.scrollSpeed * 1.4;
    const { width } = this.cameras.main;

    const sprite = this.add.sprite(width + 60, this.lanes[lane], type);
    sprite.setAngle(-90);
    sprite.setDepth(90);
    this.obstacles.push({
      sprite,
      type: isCyclist ? 'cyclist' : 'car',
      speed,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  _checkCollision(obs) {
    const px = this.player.x, py = this.player.y;
    const ox = obs.sprite.x, oy = obs.sprite.y;
    const pw = 50, ph = 30;
    const ow = obs.type === 'cyclist' ? 30 : 50;
    const oh = obs.type === 'cyclist' ? 18 : 30;

    return Math.abs(px - ox) < (pw + ow) / 2 &&
           Math.abs(py - oy) < (ph + oh) / 2;
  }

  _createDutchScenery(width, roadTop, roadHeight, isMorning) {
    this.sceneryItems = [];
    const topY = roadTop - 30;
    const bottomY = roadTop + roadHeight + 30;

    for (let x = 0; x < width + 300; x += Phaser.Math.Between(160, 280)) {
      const itemType = Math.random();

      if (itemType < 0.3) {
        // Windmill (above road)
        const wm = this.add.sprite(x, topY - 30, 'driving-windmill').setDepth(30);
        this.sceneryItems.push(wm);
      } else if (itemType < 0.6) {
        // Tulip cluster (below road)
        const tulips = this.add.sprite(x, bottomY + 15, 'driving-tulips').setDepth(30);
        this.sceneryItems.push(tulips);
        // Sometimes also above
        if (Math.random() < 0.4) {
          const tulips2 = this.add.sprite(x + 40, topY + 5, 'driving-tulips').setDepth(30);
          this.sceneryItems.push(tulips2);
        }
      } else {
        // Trees (both sides)
        const treeColor = isMorning ? 0x3a8a4a : 0x5a4a3a;
        const trunkColor = isMorning ? 0x6a4a2a : 0x4a3a2a;
        const trunk = this.add.rectangle(x, topY - 8, 6, 20, trunkColor).setDepth(25);
        const canopy = this.add.circle(x, topY - 22, Phaser.Math.Between(10, 16), treeColor, 0.8).setDepth(26);
        this.sceneryItems.push(trunk, canopy);

        const trunk2 = this.add.rectangle(x + 50, bottomY + 12, 6, 20, trunkColor).setDepth(25);
        const canopy2 = this.add.circle(x + 50, bottomY + 26, Phaser.Math.Between(10, 16), treeColor, 0.8).setDepth(26);
        this.sceneryItems.push(trunk2, canopy2);
      }

      // Tulip patches along the road shoulders
      if (Math.random() < 0.5) {
        const tulipSmall = this.add.sprite(x + 80, bottomY + 10, 'driving-tulips').setDepth(30).setScale(0.6);
        this.sceneryItems.push(tulipSmall);
      }
    }

    // A couple of windmills on the bottom side too
    for (let x = 200; x < width; x += Phaser.Math.Between(400, 600)) {
      const wm = this.add.sprite(x, bottomY + 35, 'driving-windmill').setDepth(30);
      this.sceneryItems.push(wm);
    }
  }

  _updateDutchScenery(delta) {
    const speed = this.scrollSpeed * 0.6; // Parallax: slower than road
    for (const item of this.sceneryItems) {
      item.x -= speed * (delta / 16);
      if (item.x < -60) {
        item.x += this.cameras.main.width + 320;
      }
    }
  }

  _crash() {
    this.crashed = true;
    this.audio.playCrash();
    this.transition.flash(300, 255, 100, 0);

    const msgs = dialogueData.driving?.crashMessages || [{ text: 'CRASH!' }];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    this.add.text(this.player.x + 40, this.player.y - 30, msg.text, {
      fontSize: '28px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.time.delayedCall(1500, () => {
      this.scene.restart({
        flags: this.gameFlags,
        destination: this.destination,
        difficulty: this.difficulty,
      });
    });
  }

  _complete() {
    this.completed = true;
    const nextScene = this.destination === 'dojo' ? 'DojoScene' : 'HomeScene';
    this.save.autoSave(nextScene, this.gameFlags);
    this.transition.fadeToScene(nextScene, { flags: this.gameFlags });
  }

  _generateSprites() {
    // White Tesla
    if (!this.textures.exists('driving-tesla')) {
      const g = this.make.graphics({ add: false });
      // Body (white)
      g.fillStyle(0xeeeeee);
      g.fillRect(2, 4, 28, 48);
      // Front rounded
      g.fillRect(4, 2, 24, 4);
      g.fillRect(6, 0, 20, 4);
      // Rear rounded
      g.fillRect(4, 50, 24, 4);
      g.fillRect(6, 52, 20, 2);
      // Roof/cabin (slightly off-white)
      g.fillStyle(0xddddee);
      g.fillRect(6, 14, 20, 24);
      // Windshield (front glass, dark tint)
      g.fillStyle(0x445566);
      g.fillRect(7, 10, 18, 8);
      // Windshield gradient top
      g.fillStyle(0x334455);
      g.fillRect(7, 10, 18, 2);
      // Rear window
      g.fillStyle(0x445566);
      g.fillRect(7, 38, 18, 6);
      // Headlights (LED bright white-blue)
      g.fillStyle(0xddeeFF);
      g.fillRect(4, 4, 6, 4);
      g.fillRect(22, 4, 6, 4);
      // DRL inner (blue accent)
      g.fillStyle(0x88aaff);
      g.fillRect(5, 5, 4, 2);
      g.fillRect(23, 5, 4, 2);
      // Tail lights (red)
      g.fillStyle(0xff2222);
      g.fillRect(4, 48, 6, 4);
      g.fillRect(22, 48, 6, 4);
      // Tail light inner
      g.fillStyle(0xff6644);
      g.fillRect(5, 49, 4, 2);
      g.fillRect(23, 49, 4, 2);
      // Grille (minimal, Tesla style)
      g.fillStyle(0xcccccc);
      g.fillRect(10, 2, 12, 3);
      // Tesla T logo (red on white)
      g.fillStyle(0xcc2222);
      g.fillRect(14, 3, 4, 1);
      g.fillRect(15, 3, 2, 3);
      // Wheels
      g.fillStyle(0x222222);
      g.fillRect(0, 8, 4, 10);
      g.fillRect(28, 8, 4, 10);
      g.fillRect(0, 38, 4, 10);
      g.fillRect(28, 38, 4, 10);
      // Wheel rims (silver aero)
      g.fillStyle(0xaaaaaa);
      g.fillRect(0, 10, 4, 6);
      g.fillRect(28, 10, 4, 6);
      g.fillRect(0, 40, 4, 6);
      g.fillRect(28, 40, 4, 6);
      // Door lines
      g.fillStyle(0xcccccc);
      g.fillRect(2, 22, 28, 1);
      g.fillRect(2, 36, 28, 1);
      // Side mirrors
      g.fillStyle(0xeeeeee);
      g.fillRect(0, 15, 2, 3);
      g.fillRect(30, 15, 2, 3);
      g.generateTexture('driving-tesla', 32, 56);
      g.destroy();
    }

    // Cyclist — more obviously a person on a bike
    if (!this.textures.exists('driving-cyclist')) {
      const g = this.make.graphics({ add: false });
      // Back wheel
      g.fillStyle(0x222222);
      g.fillRect(2, 26, 10, 10);
      g.fillStyle(0x444444);
      g.fillRect(4, 28, 6, 6); // hub
      // Front wheel
      g.fillStyle(0x222222);
      g.fillRect(16, 26, 10, 10);
      g.fillStyle(0x444444);
      g.fillRect(18, 28, 6, 6);
      // Wheel spokes
      g.fillStyle(0x888888);
      g.fillRect(6, 29, 2, 4);
      g.fillRect(4, 30, 6, 2);
      g.fillRect(20, 29, 2, 4);
      g.fillRect(18, 30, 6, 2);
      // Frame (triangle)
      g.fillStyle(0x777788);
      g.fillRect(7, 24, 14, 2); // top tube
      g.fillRect(7, 24, 3, 10); // seat tube
      g.fillRect(18, 24, 3, 10); // head tube
      g.fillRect(7, 32, 14, 2); // down tube
      // Handlebars
      g.fillStyle(0x555566);
      g.fillRect(19, 20, 2, 6);
      g.fillRect(19, 20, 6, 2);
      // Seat
      g.fillStyle(0x333333);
      g.fillRect(5, 22, 6, 2);
      // Rider torso (bright orange Dutch cycling jacket)
      g.fillStyle(0xff6600);
      g.fillRect(7, 10, 10, 14);
      // Rider arms (reaching to handlebars)
      g.fillStyle(0xff6600);
      g.fillRect(15, 14, 6, 3);
      // Rider head
      g.fillStyle(0xf0c090);
      g.fillRect(9, 4, 8, 7);
      // Helmet (bright orange/yellow — Dutch style!)
      g.fillStyle(0xffaa00);
      g.fillRect(8, 2, 10, 5);
      // Helmet visor
      g.fillStyle(0x333333);
      g.fillRect(16, 4, 3, 3);
      // Hair peeking out
      g.fillStyle(0x664422);
      g.fillRect(8, 6, 2, 2);
      // Legs (blue jeans, pedaling pose)
      g.fillStyle(0x335588);
      g.fillRect(7, 24, 5, 8);
      g.fillRect(12, 28, 5, 6);
      // Shoes
      g.fillStyle(0x222222);
      g.fillRect(6, 31, 4, 3);
      g.fillRect(14, 33, 4, 3);
      // Panniers / saddlebag (Dutch!)
      g.fillStyle(0x886633);
      g.fillRect(2, 22, 5, 6);
      g.generateTexture('driving-cyclist', 28, 38);
      g.destroy();
    }

    // Windmill
    if (!this.textures.exists('driving-windmill')) {
      const g = this.make.graphics({ add: false });
      const cx = 24, cy = 24;
      // Tower (tapered brick)
      g.fillStyle(0x8B4513);
      g.fillRect(20, 24, 8, 28);
      g.fillStyle(0x7a3b10);
      g.fillRect(21, 24, 6, 28);
      // Tower taper
      g.fillRect(22, 50, 4, 4);
      // Cap (dome)
      g.fillStyle(0x555555);
      g.fillRect(18, 20, 12, 6);
      g.fillRect(20, 18, 8, 4);
      // Blades (X pattern)
      g.fillStyle(0xccccbb);
      g.fillRect(cx - 1, cy - 22, 2, 20); // top blade
      g.fillRect(cx - 1, cy + 2, 2, 20);  // bottom blade
      g.fillRect(cx - 20, cy - 1, 20, 2); // left blade
      g.fillRect(cx + 2, cy - 1, 20, 2);  // right blade
      // Blade detail (lattice)
      g.fillStyle(0xbbbb99);
      g.fillRect(cx - 3, cy - 18, 6, 1);
      g.fillRect(cx - 3, cy - 12, 6, 1);
      g.fillRect(cx - 3, cy + 12, 6, 1);
      g.fillRect(cx - 3, cy + 18, 6, 1);
      g.fillRect(cx - 18, cy - 3, 1, 6);
      g.fillRect(cx - 12, cy - 3, 1, 6);
      g.fillRect(cx + 12, cy - 3, 1, 6);
      g.fillRect(cx + 18, cy - 3, 1, 6);
      // Hub
      g.fillStyle(0x444444);
      g.fillRect(cx - 2, cy - 2, 4, 4);
      // Door
      g.fillStyle(0x553311);
      g.fillRect(22, 44, 4, 8);
      g.generateTexture('driving-windmill', 48, 54);
      g.destroy();
    }

    // Tulip cluster
    if (!this.textures.exists('driving-tulips')) {
      const g = this.make.graphics({ add: false });
      const colors = [0xff2255, 0xff8800, 0xffee00, 0xff44aa, 0xcc22ff];
      for (let i = 0; i < 5; i++) {
        const tx = 4 + i * 6;
        // Stem
        g.fillStyle(0x228833);
        g.fillRect(tx + 1, 8, 2, 12);
        // Leaf
        if (i % 2 === 0) {
          g.fillStyle(0x33aa44);
          g.fillRect(tx - 1, 12, 3, 2);
        }
        // Tulip head (cup shape)
        g.fillStyle(colors[i]);
        g.fillRect(tx - 1, 4, 6, 5);
        g.fillRect(tx, 2, 4, 3);
        // Petal highlight
        g.fillStyle(0xffffff);
        g.fillRect(tx + 1, 3, 2, 1);
      }
      g.generateTexture('driving-tulips', 34, 22);
      g.destroy();
    }

    // House
    if (!this.textures.exists('driving-house')) {
      const g = this.make.graphics({ add: false });
      // Main building (Dutch row house style — tall, narrow, brick)
      g.fillStyle(0xaa5533);
      g.fillRect(8, 20, 44, 40);
      // Brick detail
      g.fillStyle(0x994422);
      for (let row = 0; row < 8; row++) {
        const offset = row % 2 === 0 ? 0 : 5;
        for (let col = 0; col < 4; col++) {
          g.fillRect(10 + offset + col * 11, 22 + row * 5, 9, 3);
        }
      }
      // Roof (typical Dutch gable — stepped)
      g.fillStyle(0x333333);
      g.fillRect(6, 16, 48, 6);
      g.fillRect(12, 12, 36, 6);
      g.fillRect(18, 8, 24, 6);
      g.fillRect(24, 4, 12, 6);
      // Chimney
      g.fillStyle(0x664422);
      g.fillRect(38, 0, 6, 10);
      // Door
      g.fillStyle(0x442211);
      g.fillRect(24, 42, 12, 18);
      // Door handle
      g.fillStyle(0xccaa44);
      g.fillRect(33, 50, 2, 2);
      // Windows (white frames)
      g.fillStyle(0x88bbdd);
      g.fillRect(12, 26, 10, 10);
      g.fillRect(38, 26, 10, 10);
      g.fillRect(12, 42, 10, 10);
      g.fillRect(38, 42, 10, 10);
      // Window frames
      g.fillStyle(0xeeeeee);
      g.fillRect(16, 26, 2, 10);
      g.fillRect(12, 30, 10, 2);
      g.fillRect(42, 26, 2, 10);
      g.fillRect(38, 30, 10, 2);
      g.fillRect(16, 42, 2, 10);
      g.fillRect(12, 46, 10, 2);
      g.fillRect(42, 42, 2, 10);
      g.fillRect(38, 46, 10, 2);
      g.generateTexture('driving-house', 60, 60);
      g.destroy();
    }

    // Dojo
    if (!this.textures.exists('driving-dojo')) {
      const g = this.make.graphics({ add: false });
      // Main building
      g.fillStyle(0xddccaa);
      g.fillRect(8, 24, 48, 36);
      // Roof (Japanese style — curved edges)
      g.fillStyle(0x333344);
      g.fillRect(2, 16, 60, 10);
      g.fillRect(6, 14, 52, 4);
      g.fillRect(10, 12, 44, 4);
      // Roof curve tips
      g.fillRect(0, 18, 6, 4);
      g.fillRect(58, 18, 6, 4);
      // Door (sliding)
      g.fillStyle(0x886644);
      g.fillRect(22, 38, 20, 22);
      // Door frame
      g.fillStyle(0x664422);
      g.fillRect(22, 38, 20, 2);
      g.fillRect(22, 38, 2, 22);
      g.fillRect(40, 38, 2, 22);
      g.fillRect(31, 38, 2, 22);
      // Windows (shoji screen style)
      g.fillStyle(0xeeddcc);
      g.fillRect(10, 28, 10, 8);
      g.fillRect(44, 28, 10, 8);
      // Window grid
      g.fillStyle(0x886644);
      g.fillRect(14, 28, 2, 8);
      g.fillRect(10, 31, 10, 2);
      g.fillRect(48, 28, 2, 8);
      g.fillRect(44, 31, 10, 2);
      // Sign
      g.fillStyle(0xcc2222);
      g.fillRect(26, 26, 12, 8);
      g.fillStyle(0xffffff);
      g.fillRect(28, 28, 2, 4);
      g.fillRect(30, 28, 2, 4);
      g.fillRect(34, 28, 2, 4);
      g.generateTexture('driving-dojo', 64, 60);
      g.destroy();
    }
  }
}
