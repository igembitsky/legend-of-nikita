import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import dialogueData from '../data/dialogue.json';

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: true, banana: true, coffee: true };
  }

  create() {
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.transition.fadeIn(500);
    this.audio.playMusic('office');

    const { width, height } = this.cameras.main;

    // Cyberpunk office background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

    // Neon accents
    this.add.rectangle(width / 2, 5, width, 10, 0x00ffcc, 0.3);
    this.add.rectangle(width / 2, height - 5, width, 10, 0xff00cc, 0.3);

    // Desks with NPCs
    for (let i = 0; i < 4; i++) {
      const dx = 150 + i * 280;
      const dy = 200;
      this.add.rectangle(dx, dy, 80, 50, 0x333355);
      const npc = this.add.sprite(dx, dy - 30, 'office-npc').setAlpha(0.6);
      this.tweens.add({
        targets: npc,
        y: dy - 32,
        yoyo: true,
        repeat: -1,
        duration: 300 + i * 100,
      });
    }

    // Robots in background
    for (let i = 0; i < 2; i++) {
      const robot = this.add.sprite(100 + i * 900, 350, 'office-robot').setAlpha(0.4);
      this.tweens.add({
        targets: robot,
        x: robot.x + 200,
        yoyo: true,
        repeat: -1,
        duration: 4000 + i * 1000,
      });
    }

    // Nikita at desk (center)
    this.nikita = this.add.sprite(width / 2, 420, 'nikita-dressed');
    this.add.rectangle(width / 2, 450, 100, 60, 0x333355);

    // Terminal overlay (hidden initially)
    this.terminalBg = this.add.rectangle(width / 2, height / 2, 600, 350, 0x0a0a0a, 0.95)
      .setDepth(500).setVisible(false);
    this.terminalBorder = this.add.rectangle(width / 2, height / 2, 604, 354, 0x00ff88, 0.3)
      .setDepth(499).setVisible(false);
    this.terminalText = this.add.text(width / 2 - 270, height / 2 - 150, '', {
      fontSize: '16px', color: '#00ff88', fontFamily: 'monospace', lineSpacing: 8,
      wordWrap: { width: 540 },
    }).setDepth(501).setVisible(false);

    // Red overlay for panic (hidden initially)
    this.redOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0)
      .setDepth(400);

    // Scripted sequence
    this.step = 0;
    this.waitingForInput = false;
    this.recoveryStage = 0;

    // Start with intro dialogue
    this.time.delayedCall(1000, () => this._nextStep());

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.waitingForInput) {
        this.waitingForInput = false;
        // If we're in recovery (step 9), advance recovery stages instead of nextStep
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
      position: undefined,
    }));
  }

  update(time, delta) {
    if (this.pauseOverlay?.isPaused()) return;
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
    const { width } = this.cameras.main;
    const slackBg = this.add.rectangle(width - 10, 10, 300, 60, 0x4a154b, 0.95)
      .setOrigin(1, 0).setDepth(600);
    const slackText = this.add.text(width - 160, 25, dialogueData.office.slack[0].text, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
      wordWrap: { width: 270 },
    }).setOrigin(0.5, 0).setDepth(601);

    // Slide in
    slackBg.x = width + 310;
    slackText.x = width + 150;
    this.tweens.add({ targets: [slackBg], x: width - 10, duration: 400, ease: 'Back' });
    this.tweens.add({
      targets: [slackText], x: width - 160, duration: 400, ease: 'Back',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          slackBg.destroy();
          slackText.destroy();
          this._nextStep();
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
        if (i >= cmd.length && onDone) {
          this.time.delayedCall(300, onDone);
        }
      },
    });
  }

  _appendTerminal(text) {
    this.terminalText.setText(this.terminalText.text + text);
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
}
