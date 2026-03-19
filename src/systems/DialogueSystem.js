export class DialogueSystem {
  constructor(scene) {
    this.scene = scene;
    this.lines = [];
    this.lineIndex = -1;
    this.active = false;
    this.options = {};
    this.selectedChoiceIndex = 0;
    this.selectedChoiceValue = null;
    this.typewriterTimer = null;
    this.displayedText = '';
    this.isTyping = false;

    // Visual elements (created when sequence starts)
    this.bg = null;
    this.speakerText = null;
    this.bodyText = null;
    this.choiceTexts = [];
  }

  startSequence(lines, options = {}) {
    this.lines = lines;
    this.lineIndex = 0;
    this.active = true;
    this.options = options;
    this.selectedChoiceValue = null;
    this._showLine(0);
  }

  isActive() {
    return this.active;
  }

  currentLine() {
    return this.lineIndex;
  }

  hasChoices() {
    if (this.lineIndex < 0 || this.lineIndex >= this.lines.length) return false;
    const line = this.lines[this.lineIndex];
    return Array.isArray(line.choices) && line.choices.length > 0;
  }

  selectChoice(index) {
    const line = this.lines[this.lineIndex];
    if (!line.choices) return;
    this.selectedChoiceIndex = index;
    const choice = line.choices[index];
    this.selectedChoiceValue = typeof choice === 'string' ? choice : choice.name;
  }

  getSelectedChoice() {
    return this.selectedChoiceValue;
  }

  advance() {
    if (!this.active) return;

    // If currently typing, complete the text instantly then continue advancing
    if (this.isTyping) {
      this._completeTyping();
      // Fall through to advance to next line
    }

    this.lineIndex++;
    if (this.lineIndex >= this.lines.length) {
      this.active = false;
      this._hideUI();
      if (this.options.onComplete) {
        this.options.onComplete();
      }
      return;
    }

    this._showLine(this.lineIndex);
  }

  _showLine(index) {
    const line = this.lines[index];
    if (!line) return;

    // Create UI elements if they don't exist
    if (!this.bg) {
      this._createUI();
    }

    // Update speaker with per-character color
    if (this.speakerText) {
      this.speakerText.setText(line.speaker || '');
      const speakerColors = {
        'Nikita': '#88bbff', 'Igor': '#ffdd44', 'Wife': '#ff88aa',
        'Cat': '#44ff44', 'Sensei': '#ff8844', 'Customer': '#cc44cc',
        'AI': '#ff4444', 'Terminal': '#00ff88',
      };
      this.speakerText.setColor(speakerColors[line.speaker] || '#ffcc00');
    }

    // Apply line-level style overrides
    const textColor = line.style?.color || '#ffffff';
    if (this.bodyText) {
      this.bodyText.setColor(textColor);
    }

    // Start typewriter effect
    this._startTypewriter(line.text);

    // Show choices if present
    this._clearChoices();
    if (this.hasChoices()) {
      this._showChoices(line.choices);
    }
  }

  _createUI() {
    const cam = this.scene.cameras.main;
    const boxHeight = 140;
    const y = cam.height - boxHeight;

    this.bg = this.scene.add.rectangle(cam.width / 2, y + boxHeight / 2, cam.width - 40, boxHeight, 0x111133, 0.9)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.speakerText = this.scene.add.text(40, y + 12, '', {
      fontSize: '18px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(1001);

    this.bodyText = this.scene.add.text(40, y + 36, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 6,
      wordWrap: { width: cam.width - 80 },
    }).setScrollFactor(0).setDepth(1001);
  }

  _startTypewriter(fullText) {
    this.displayedText = '';
    this.isTyping = true;
    this._fullText = fullText;
    let charIndex = 0;

    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }

    this.typewriterTimer = this.scene.time.addEvent({
      delay: 30,
      repeat: fullText.length - 1,
      callback: () => {
        charIndex++;
        this.displayedText = fullText.substring(0, charIndex);
        if (this.bodyText) {
          this.bodyText.setText(this.displayedText);
        }
        if (charIndex >= fullText.length) {
          this.isTyping = false;
        }
      },
    });
  }

  _completeTyping() {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }
    this.displayedText = this._fullText;
    if (this.bodyText) {
      this.bodyText.setText(this.displayedText);
    }
    this.isTyping = false;
  }

  _showChoices(choices) {
    const cam = this.scene.cameras.main;
    const startY = cam.height - 140 + 70;

    choices.forEach((choice, i) => {
      const name = typeof choice === 'string' ? choice : choice.name;
      const prefix = i === this.selectedChoiceIndex ? '▶ ' : '  ';
      const text = this.scene.add.text(60, startY + i * 22, prefix + name, {
        fontSize: '14px',
        color: i === this.selectedChoiceIndex ? '#ffcc00' : '#aaaaaa',
        fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1001);
      this.choiceTexts.push(text);
    });
  }

  _clearChoices() {
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.selectedChoiceIndex = 0;
  }

  moveChoiceUp() {
    if (!this.hasChoices()) return;
    const choices = this.lines[this.lineIndex].choices;
    this.selectedChoiceIndex = (this.selectedChoiceIndex - 1 + choices.length) % choices.length;
    this._clearChoices();
    this._showChoices(choices);
  }

  moveChoiceDown() {
    if (!this.hasChoices()) return;
    const choices = this.lines[this.lineIndex].choices;
    this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % choices.length;
    this._clearChoices();
    this._showChoices(choices);
  }

  confirmChoice() {
    if (!this.hasChoices()) return;
    this.selectChoice(this.selectedChoiceIndex);
    this.advance();
  }

  _hideUI() {
    if (this.bg) { this.bg.destroy(); this.bg = null; }
    if (this.speakerText) { this.speakerText.destroy(); this.speakerText = null; }
    if (this.bodyText) { this.bodyText.destroy(); this.bodyText = null; }
    this._clearChoices();
    if (this.typewriterTimer) { this.typewriterTimer.remove(); }
  }

  destroy() {
    this._hideUI();
  }
}
