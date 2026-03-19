import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
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
    this.transition.fadeIn(500);

    const { width, height } = this.cameras.main;

    // White mat floor
    this.add.rectangle(width / 2, height / 2, width, height, 0xeeeeee);

    // Mat lines
    for (let x = 0; x < width; x += 80) {
      this.add.rectangle(x, height / 2, 2, height, 0xdddddd);
    }
    for (let y = 0; y < height; y += 80) {
      this.add.rectangle(width / 2, y, width, 2, 0xdddddd);
    }

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

    // Igor (yellow gi) — center right
    this.igor = this.add.sprite(width * 0.65, height * 0.55, 'igor');

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
        this.round++;
        if (this.round <= 3) {
          this.time.delayedCall(500, () => this._startRound());
        } else {
          this.time.delayedCall(500, () => this._showOutcome());
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
