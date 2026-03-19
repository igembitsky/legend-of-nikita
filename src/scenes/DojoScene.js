import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { PauseOverlay } from '../systems/PauseOverlay.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
import { RoomRenderer } from '../systems/RoomRenderer.js';
import dialogueData from '../data/dialogue.json';

export class DojoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DojoScene' });
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
    AtmosphereManager.apply(this, 'dojo');
    this.audio.playMusic('dojo');

    const { width, height } = this.cameras.main;

    // White mat floor with tatami-like texture
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0xeeeeee);
    floor.fillRect(0, 0, width, height);

    // Mat border (red stripe around edge)
    floor.lineStyle(4, 0xcc2222);
    floor.strokeRect(40, 40, width - 80, height - 80);

    // Grid lines (mat sections)
    floor.lineStyle(1, 0xdddddd);
    for (let x = 40; x < width - 40; x += 80) {
      floor.lineBetween(x, 40, x, height - 40);
    }
    for (let y = 40; y < height - 40; y += 80) {
      floor.lineBetween(40, y, width - 40, y);
    }

    // Subtle texture within each cell (fine horizontal lines)
    floor.lineStyle(1, 0xe8e8e8, 0.5);
    for (let y = 42; y < height - 42; y += 8) {
      floor.lineBetween(42, y, width - 42, y);
    }

    // Wall area (above mat)
    const wallG = this.add.graphics().setDepth(200);
    wallG.fillStyle(0xccccbb);
    wallG.fillRect(0, 0, width, 40);

    // Wall scrolls (decorative)
    wallG.fillStyle(0xeeeecc);
    wallG.fillRect(200, 5, 40, 30);
    wallG.fillRect(width - 240, 5, 40, 30);
    wallG.fillStyle(0x333333);
    wallG.fillRect(208, 10, 24, 4); // kanji-like marks
    wallG.fillRect(212, 16, 16, 2);
    wallG.fillRect(width - 232, 10, 24, 4);
    wallG.fillRect(width - 228, 16, 16, 2);

    // Background sparring pairs (3 pairs as silhouettes)
    for (let i = 0; i < 3; i++) {
      const px = 200 + i * 350;
      const py = 150;
      const pair = this.add.sprite(px, py, 'dojo-pair').setAlpha(0.3);
      this.tweens.add({
        targets: pair,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 0.95 },
        yoyo: true,
        repeat: -1,
        duration: 1500,
        delay: i * 400,
      });
    }

    // Nikita (gi) — center left
    this.nikita = this.add.sprite(width * 0.35, height * 0.55, 'nikita-gi');
    this.add.ellipse(width * 0.35, height * 0.55 + 22, 24, 8, 0x000000, 0.15).setDepth(1);
    this.tweens.add({
      targets: this.nikita,
      scaleY: { from: 1, to: 1.015 },
      scaleX: { from: 1, to: 0.99 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });

    // Igor (yellow gi) — center right
    this.igor = this.add.sprite(width * 0.65, height * 0.55, 'igor');
    this.add.ellipse(width * 0.65, height * 0.55 + 22, 24, 8, 0x000000, 0.15).setDepth(1);
    this.tweens.add({
      targets: this.igor,
      scaleY: { from: 1, to: 1.015 },
      scaleX: { from: 1, to: 0.99 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });

    // Phase tracking
    this.phase = 'dialogue'; // dialogue → sparring → outcome
    this.round = 0;

    // Start intro dialogue
    this.dialogue.startSequence(dialogueData.dojo.intro, {
      onComplete: () => this._startSparring(),
    });

    // Input
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive() && !this.dialogue.hasChoices()) {
        this.dialogue.advance();
      }
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) {
        if (this.dialogue.hasChoices()) {
          this.audio.playConfirm();
          this.dialogue.confirmChoice();
        } else {
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

    this.save.autoSave('DojoScene', this.gameFlags);

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

    // Igor approaches animation
    this.tweens.add({
      targets: this.igor,
      x: this.nikita.x + 60,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        // Show flavor text, then choices
        const flavorLine = { speaker: '', text: roundData.flavor, style: { color: '#666666' } };
        const choiceLine = {
          speaker: 'Choose your move:',
          text: '',
          choices: roundData.choices,
        };

        this.dialogue.startSequence([flavorLine, choiceLine], {
          onComplete: () => {
            // Move executed — push Igor back
            this._executeMove();
          },
        });
      },
    });
  }

  _executeMove() {
    const selectedMove = this.dialogue.getSelectedChoice();
    this.audio.playHit();

    // Show selected move name
    const moveText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.3,
      selectedMove || 'Mystery Move',
      { fontSize: '28px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold' }
    ).setOrigin(0.5).setAlpha(0);

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
      x: this.cameras.main.width * 0.65,
      duration: 400,
      ease: 'Back',
      delay: 1200,
      onComplete: () => {
        const postKey = `postRound${this.round}`;
        const postLines = dialogueData.dojo[postKey];
        if (postLines) {
          this.dialogue.startSequence(postLines, {
            onComplete: () => {
              this.round++;
              if (this.round <= 3) {
                this.time.delayedCall(500, () => this._startRound());
              } else {
                this.time.delayedCall(500, () => this._showOutcome());
              }
            },
          });
        } else {
          this.round++;
          if (this.round <= 3) {
            this.time.delayedCall(500, () => this._startRound());
          } else {
            this.time.delayedCall(500, () => this._showOutcome());
          }
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
