import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
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
    this.audio.playMusic('driving');

    const { width, height } = this.cameras.main;

    // Config based on destination
    const isMorning = this.destination === 'dojo';
    this.scrollSpeed = isMorning ? 3 : 2.4; // 20% slower for home
    this.spawnInterval = isMorning ? 800 : 1600; // 50% fewer for home
    const bgColor = isMorning ? 0x2a4a3a : 0x3a2a1a;
    const roadColor = 0x444444;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, bgColor);

    // Road (3 lanes)
    this.laneWidth = 120;
    this.roadX = width / 2;
    this.roadWidth = this.laneWidth * 3;
    this.add.rectangle(this.roadX, height / 2, this.roadWidth, height, roadColor);

    // Lane positions
    this.lanes = [
      this.roadX - this.laneWidth,
      this.roadX,
      this.roadX + this.laneWidth,
    ];

    // Lane markings (dashed)
    this.laneMarkings = [];
    for (let i = 0; i < 2; i++) {
      const x = this.roadX + (i - 0.5) * this.laneWidth;
      for (let y = -50; y < height + 50; y += 60) {
        const mark = this.add.rectangle(x, y, 4, 30, 0xcccccc, 0.5);
        this.laneMarkings.push(mark);
      }
    }

    // Sidewalk scenery
    this.add.rectangle(this.roadX - this.roadWidth / 2 - 30, height / 2, 60, height, 0x666655);
    this.add.rectangle(this.roadX + this.roadWidth / 2 + 30, height / 2, 60, height, 0x666655);

    // Player tesla
    this.currentLane = 1; // Middle lane
    this.player = this.add.sprite(this.lanes[this.currentLane], height - 100, 'tesla');
    this.targetX = this.player.x;
    this.isMoving = false;

    // Obstacles
    this.obstacles = [];
    this.lastSpawn = 0;

    // Distance tracking
    this.distanceTraveled = 0;
    this.targetDistance = 3600; // ~60 seconds at speed 3

    // Distance display
    this.distText = this.add.text(width - 20, 20, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(900);

    this.crashed = false;
    this.completed = false;
    this.halfwayShown = false;

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

    // Lane markings scroll
    for (const mark of this.laneMarkings) {
      mark.y += this.scrollSpeed * (delta / 16);
      if (mark.y > this.cameras.main.height + 50) {
        mark.y -= this.cameras.main.height + 100;
      }
    }

    // Lane switching — justPressed prevents skipping lanes
    if (!this.isMoving) {
      if (this.inputMgr.justPressed('left') && this.currentLane > 0) {
        this.currentLane--;
        this._moveToLane();
      } else if (this.inputMgr.justPressed('right') && this.currentLane < 2) {
        this.currentLane++;
        this._moveToLane();
      }
    }

    // Smooth movement
    if (this.isMoving) {
      const dx = this.targetX - this.player.x;
      if (Math.abs(dx) < 2) {
        this.player.x = this.targetX;
        this.isMoving = false;
      } else {
        this.player.x += dx * 0.15;
      }
    }

    // Spawn obstacles
    this.lastSpawn += delta;
    if (this.lastSpawn >= this.spawnInterval) {
      this.lastSpawn = 0;
      this._spawnObstacle();
    }

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.sprite.y += obs.speed * (delta / 16);

      // Wobble for cyclists
      if (obs.type === 'cyclist') {
        obs.sprite.x += Math.sin(time * 0.005 + obs.wobbleOffset) * 0.5;
      }

      // Collision check
      if (this._checkCollision(obs)) {
        this._crash();
        return;
      }

      // Remove off-screen
      if (obs.sprite.y > this.cameras.main.height + 80) {
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

    if (this.distanceTraveled >= this.targetDistance) {
      this._complete();
    }

    this.inputMgr.clearJustPressed();
  }

  _moveToLane() {
    this.targetX = this.lanes[this.currentLane];
    this.isMoving = true;
  }

  _spawnObstacle() {
    const lane = Phaser.Math.Between(0, 2);
    const isCyclist = Math.random() < 0.65;
    const type = isCyclist ? 'cyclist' : 'car-1';
    const speed = isCyclist ? this.scrollSpeed * 0.8 : this.scrollSpeed * 1.4;

    const sprite = this.add.sprite(this.lanes[lane], -60, type);
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
    const pw = 30, ph = 50; // Player hitbox
    const ow = obs.type === 'cyclist' ? 18 : 30;
    const oh = obs.type === 'cyclist' ? 30 : 50;

    return Math.abs(px - ox) < (pw + ow) / 2 &&
           Math.abs(py - oy) < (ph + oh) / 2;
  }

  _crash() {
    this.crashed = true;
    this.audio.playCrash();
    this.transition.flash(300, 255, 100, 0);

    // Random crash message
    const msgs = dialogueData.driving?.crashMessages || [{ text: 'CRASH!' }];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    // Explosion effect
    this.add.text(this.player.x, this.player.y - 40, msg.text, {
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
}
