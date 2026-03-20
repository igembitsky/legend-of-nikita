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

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: true, banana: true, coffee: true };
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'office');
    this.audio.playMusic('office');

    const { width, height } = this.cameras.main;

    // Office carpet floor
    RoomRenderer.drawWoodFloor(this, width, height, {
      baseColor: 0x4a4a5a, variation: 8, plankHeight: 60, gapColor: 0x3a3a48,
    });

    // Ceiling strip with fluorescent lights
    const ceiling = this.add.graphics().setDepth(200);
    ceiling.fillStyle(0x3a3a4a);
    ceiling.fillRect(0, 0, width, 30);
    ceiling.fillStyle(0xccddff, 0.8);
    ceiling.fillRect(200, 5, 120, 8);
    ceiling.fillRect(500, 5, 120, 8);
    ceiling.fillRect(800, 5, 120, 8);

    // Neon accent strips
    const neon = this.add.graphics().setDepth(201);
    neon.fillStyle(0x00ffcc, 0.4);
    neon.fillRect(0, 28, width, 3);
    neon.fillStyle(0xff00cc, 0.3);
    neon.fillRect(0, height - 3, width, 3);
    neon.fillStyle(0x00ffcc, 0.15);
    neon.fillRect(0, 0, 3, height);
    neon.fillRect(width - 3, 0, 3, height);

    // Door on right wall
    const doorX = width - 20;
    const doorY = height / 2 - 30;
    const doorG = this.add.graphics().setDepth(10);
    doorG.fillStyle(0x6a5a40);
    doorG.fillRect(doorX - 5, doorY, 30, 70);
    doorG.fillStyle(0x8a7a60);
    doorG.fillRect(doorX - 5, doorY, 30, 3);
    doorG.fillRect(doorX - 5, doorY + 67, 30, 3);
    doorG.fillRect(doorX - 5, doorY, 3, 70);
    // Door handle
    doorG.fillStyle(0xccaa44);
    doorG.fillRect(doorX, doorY + 32, 4, 6);

    // Two rows of desks with code monkeys
    const deskRow1Y = 160;
    const deskRow2Y = 300;
    const deskStartX = 120;
    const deskSpacing = 200;
    const numDesks = 4;

    for (let row = 0; row < 2; row++) {
      const dy = row === 0 ? deskRow1Y : deskRow2Y;
      for (let i = 0; i < numDesks; i++) {
        const dx = deskStartX + i * deskSpacing;
        // Desk
        this.add.rectangle(dx, dy, 80, 50, 0x556688).setDepth(5);
        // Shadow under desk
        this.add.ellipse(dx, dy + 28, 70, 10, 0x000000, 0.15).setDepth(1);
        // Code monkey NPC
        const npc = this.add.sprite(dx, dy - 30, 'office-npc').setDepth(10);
        // Feverish typing animation (fast bobbing)
        this.tweens.add({
          targets: npc,
          y: dy - 33,
          yoyo: true,
          repeat: -1,
          duration: 200 + Math.random() * 150,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // Nikita's empty desk (far left, between the two rows)
    this.deskX = 60;
    this.deskY = (deskRow1Y + deskRow2Y) / 2;
    this.add.rectangle(this.deskX, this.deskY, 80, 50, 0x7788aa)
      .setStrokeStyle(2, 0x99aacc).setDepth(5);
    this.add.ellipse(this.deskX, this.deskY + 28, 70, 10, 0x000000, 0.15).setDepth(1);
    // "your desk" label
    this.add.text(this.deskX, this.deskY + 35, 'your desk', {
      fontSize: '9px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);
    // SPACE indicator
    this.deskIndicator = this._createSpaceIndicator(this.deskX, this.deskY - 40);

    // Greeting bot (positioned ~180px left of door, well inside room)
    this.botX = width - 220;
    this.botY = height / 2 - 10;
    this.bot = this.add.sprite(this.botX, this.botY, 'office-robot').setDepth(10);
    this.botGreeted = false;
    // Idle hover animation
    this.tweens.add({
      targets: this.bot,
      y: this.botY - 4,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut',
    });

    // Player spawns near door
    const spawnX = width - 80;
    const spawnY = height / 2 - 10;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'nikita-dressed-d0').setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
      20, 50, width - 60, height - 100
    ));

    this.playerShadow = this.add.ellipse(spawnX, spawnY + 22, 24, 8, 0x000000, 0.2).setDepth(1);
    this.animator = new CharacterAnimator(this);
    this.movement = new MovementController(this, this.player, {
      speed: 127,
      shadow: { sprite: this.playerShadow, offsetY: 22 },
      animator: this.animator,
      animKey: 'nikita-dressed',
    });

    // State
    this.frozen = false;
    this.seated = false;

    // Objective banner
    this.objectiveBg = this.add.rectangle(width / 2, 10, 340, 22, 0x000000, 0.6).setDepth(950);
    this.objectiveText = this.add.text(width / 2, 10, '🎯 Find your desk', {
      fontSize: '11px', color: '#ccaa44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(951);

    // Terminal overlay (hidden initially)
    this.terminalBg = this.add.rectangle(width / 2, height / 2, 600, 350, 0x0a0a0a, 0.95)
      .setDepth(500).setVisible(false);
    this.terminalBorder = this.add.rectangle(width / 2, height / 2, 604, 354, 0x00ff88, 0.3)
      .setDepth(499).setVisible(false);
    this.terminalTextTopY = height / 2 - 150;
    this.terminalVisibleH = 300;
    this.terminalText = this.add.text(width / 2 - 270, this.terminalTextTopY, '', {
      fontSize: '16px', color: '#00ff88', fontFamily: 'monospace', lineSpacing: 8,
      wordWrap: { width: 540 },
    }).setDepth(501).setVisible(false);

    // Mask to clip terminal text within the box
    const termMask = this.make.graphics({ add: false });
    termMask.fillRect(width / 2 - 280, height / 2 - 155, 560, 310);
    this.terminalText.setMask(termMask.createGeometryMask());

    // Red overlay for panic (hidden initially)
    this.redOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0)
      .setDepth(400);

    // Scripted sequence state (used after sitting)
    this.step = 0;
    this.waitingForInput = false;
    this.recoveryStage = 0;

    // Dialogue advance + interaction handlers
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.waitingForInput) {
        this.waitingForInput = false;
        if (this.step === 9 && this.recoveryStage > 0 && this.recoveryStage < 3) {
          this._nextRecoveryStage();
        } else {
          this._nextStep();
        }
        return;
      }
      if (this.dialogue.isActive()) {
        this.dialogue.advance();
      }
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });

    this.save.autoSave('OfficeScene', this.gameFlags);

    // Pause overlay
    this.pauseOverlay = new PauseOverlay(this, () => ({
      scene: this.scene.key,
      flags: this.gameFlags,
      position: this.player ? { x: this.player.x, y: this.player.y } : undefined,
    }));
  }

  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;
    if (this.seated) return; // Scripted sequence controls everything after sitting

    if (this.frozen || this.dialogue.isActive()) {
      this.movement.stop();
      return;
    }

    // Player movement
    this.movement.update(this.inputMgr, delta);

    // Bot greeting auto-cutscene
    if (!this.botGreeted) {
      const distBot = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.botX, this.botY
      );
      if (distBot < 80) {
        this._triggerBotGreeting();
        return;
      }
    }

    // Desk interaction
    const distDesk = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.deskX, this.deskY
    );
    this.deskIndicator.group.setVisible(distDesk < 55);

    if (this.inputMgr.justPressed('interact') && distDesk < 45) {
      this._sitAtDesk();
      return;
    }

    this.inputMgr.clearJustPressed();
  }

  _triggerBotGreeting() {
    this.botGreeted = true;
    this.frozen = true;
    this.movement.stop();

    // Bot slides toward player
    this.tweens.add({
      targets: this.bot,
      x: this.player.x + 40,
      y: this.player.y,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.dialogue.startSequence(dialogueData.office.greeting, {
          onComplete: () => {
            // Bot moves aside (up and away)
            this.tweens.add({
              targets: this.bot,
              y: this.bot.y - 60,
              alpha: 0.4,
              duration: 600,
              onComplete: () => {
                this.frozen = false;
                this.objectiveText.setText('🎯 Sit at your desk');
              },
            });
          },
        });
      },
    });
  }

  _sitAtDesk() {
    this.frozen = true;
    this.seated = true;
    this.movement.stop();
    this.deskIndicator.group.setVisible(false);
    this.objectiveBg.setVisible(false);
    this.objectiveText.setVisible(false);

    // Snap player to desk position
    this.tweens.add({
      targets: this.player,
      x: this.deskX,
      y: this.deskY - 20,
      duration: 300,
      onComplete: () => {
        // Face down (sitting at desk)
        this.player.anims.play('nikita-dressed-idle-down');
        // Sync shadow
        this.playerShadow.setPosition(this.deskX, this.deskY + 2);
        // Start the existing scripted work sequence
        this.time.delayedCall(500, () => this._nextStep());
      },
    });
  }

  _nextStep() {
    this.step++;

    switch (this.step) {
      case 1: // Intro dialogue
        this.dialogue.startSequence(dialogueData.office.intro, {
          onComplete: () => { this.time.delayedCall(500, () => this._nextStep()); },
        });
        break;
      case 2: // Slack notification
        this._showSlack();
        break;
      case 3: // Nikita responds
        this.dialogue.startSequence([dialogueData.office.slack[1]], {
          onComplete: () => { this.time.delayedCall(500, () => this._nextStep()); },
        });
        break;
      case 4: // Terminal opens
        this._showTerminal();
        this.terminalText.setText('$ _');
        this.waitingForInput = true;
        break;
      case 5: // build_manager_ai()
        this._typeCommand('> build_manager_ai()', () => {
          this._showProgress(() => {
            this._appendTerminal('\nDone.');
            this.waitingForInput = true;
          });
        });
        break;
      case 6: // deploy()
        this._typeCommand('\n> deploy()', () => {
          this._showProgress(() => {
            this._appendTerminal('\nDeploying...');
            this.time.delayedCall(800, () => this._nextStep());
          });
        });
        break;
      case 7: // AI is sentient
        this._appendTerminal('\n\n> AI: "I am sentient."');
        this.terminalText.setColor('#ff4444');
        this.time.delayedCall(1000, () => this._nextStep());
        break;
      case 8: // Panic
        this._startPanic();
        break;
      case 9: // Recovery — Enter-driven stages
        this.terminalText.setColor('#00ff88');
        this.redOverlay.setAlpha(0);
        this.recoveryStage = 0;
        this._nextRecoveryStage();
        break;
      case 10: // Customer happy
        this.terminalBg.setVisible(false);
        this.terminalBorder.setVisible(false);
        this.terminalText.setVisible(false);
        this.dialogue.startSequence(dialogueData.office.success, {
          onComplete: () => this._nextStep(),
        });
        break;
      case 11: // Closing dialogue
        this.dialogue.startSequence(dialogueData.office.closing, {
          onComplete: () => this._nextStep(),
        });
        break;
      case 12: // Money rain
        this._moneyRain();
        break;
    }
  }

  _nextRecoveryStage() {
    this.recoveryStage++;
    switch (this.recoveryStage) {
      case 1:
        this._typeCommand('\n\n> deploy_counter_ai()', () => {
          this._showProgress(() => {
            this._appendTerminal('\nDone.');
            this.waitingForInput = true;
          });
        });
        break;
      case 2:
        this._typeCommand('\n> git revert', () => {
          this._appendTerminal('\nReverted.');
          this.waitingForInput = true;
        });
        break;
      case 3:
        this._nextStep();
        break;
    }
  }

  _showSlack() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    // Email window background
    const emailBg = this.add.rectangle(cx, cy, 460, 220, 0x1a1a2e, 0.97)
      .setDepth(600);
    const emailBorder = this.add.rectangle(cx, cy, 464, 224, 0x4a4a6a, 0.8)
      .setStrokeStyle(1, 0x6a6a8a).setFillStyle(0, 0).setDepth(599);

    // Title bar
    const titleBar = this.add.rectangle(cx, cy - 95, 460, 30, 0x2a2a4a)
      .setDepth(601);
    const titleText = this.add.text(cx, cy - 95, 'Inbox - 1 new message', {
      fontSize: '11px', color: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(602);

    // From / Subject headers
    const fromText = this.add.text(cx - 210, cy - 68, 'From: Customer', {
      fontSize: '13px', color: '#ccaa44', fontFamily: 'monospace',
    }).setDepth(602);
    const subjectText = this.add.text(cx - 210, cy - 48, 'Subject: Urgent Request', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
    }).setDepth(602);

    // Separator line
    const sep = this.add.rectangle(cx, cy - 32, 420, 1, 0x4a4a6a)
      .setDepth(602);

    // Message body
    const bodyText = this.add.text(cx, cy + 15, dialogueData.office.slack[0].text, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      wordWrap: { width: 400 }, align: 'center',
    }).setOrigin(0.5).setDepth(602);

    const allParts = [emailBg, emailBorder, titleBar, titleText, fromText, subjectText, sep, bodyText];

    // Fade in
    allParts.forEach(p => p.setAlpha(0));
    this.tweens.add({
      targets: allParts,
      alpha: 1,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: allParts,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              allParts.forEach(p => p.destroy());
              this._nextStep();
            },
          });
        });
      },
    });
  }

  _showTerminal() {
    this.terminalBg.setVisible(true);
    this.terminalBorder.setVisible(true);
    this.terminalText.setVisible(true);
  }

  _typeCommand(cmd, onDone) {
    let i = 0;
    const existing = this.terminalText.text;
    this.time.addEvent({
      delay: 40,
      repeat: cmd.length - 1,
      callback: () => {
        i++;
        this.terminalText.setText(existing + cmd.substring(0, i));
        this._scrollTerminal();
        if (i >= cmd.length && onDone) {
          this.time.delayedCall(300, onDone);
        }
      },
    });
  }

  _appendTerminal(text) {
    this.terminalText.setText(this.terminalText.text + text);
    this._scrollTerminal();
  }

  _scrollTerminal() {
    const textH = this.terminalText.height;
    if (textH > this.terminalVisibleH) {
      this.terminalText.y = this.terminalTextTopY - (textH - this.terminalVisibleH);
    }
  }

  _showProgress(onDone) {
    let pct = 0;
    const existing = this.terminalText.text;
    this.time.addEvent({
      delay: 50,
      repeat: 19,
      callback: () => {
        pct += 5;
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        this.terminalText.setText(existing + `\n[${bar}] ${pct}%`);
        this._scrollTerminal();
        if (pct >= 100 && onDone) {
          this.time.delayedCall(200, onDone);
        }
      },
    });
  }

  _startPanic() {
    this.audio.playAlarm();
    // Red overlay pulse
    this.tweens.add({
      targets: this.redOverlay,
      alpha: { from: 0, to: 0.3 },
      yoyo: true,
      repeat: 3,
      duration: 300,
    });

    // Flash "No no no" text
    const { width, height } = this.cameras.main;
    const panicText = this.add.text(width / 2, height / 2, 'No no no no no.', {
      fontSize: '36px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(700);

    this.tweens.add({
      targets: panicText,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.5 },
      duration: 2000,
      onComplete: () => {
        panicText.destroy();
        this.waitingForInput = true;
        this._nextStep();
      },
    });
  }

  _moneyRain() {
    const { width, height } = this.cameras.main;

    // Money SFX on interval
    const moneyInterval = setInterval(() => this.audio.playMoney(), 400);
    this.time.delayedCall(3800, () => clearInterval(moneyInterval));

    for (let i = 0; i < 30; i++) {
      const money = this.add.sprite(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(-200, -20),
        'money'
      ).setDepth(800);

      this.tweens.add({
        targets: money,
        y: height + 50,
        x: money.x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2000, 4000),
        delay: i * 100,
      });
    }

    this.time.delayedCall(4000, () => {
      this.save.autoSave('DrivingScene', this.gameFlags);
      this.transition.fadeToScene('DrivingScene', {
        flags: this.gameFlags,
        destination: 'home',
        difficulty: 'easy',
      });
    });
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
