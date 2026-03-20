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
    this.speakerBg = null;
    this.bodyText = null;
    this.portrait = null;
    this.portraitFrame = null;
    this.advanceIndicator = null;
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

    // If currently typing, just complete the text — don't advance yet
    if (this.isTyping) {
      this._completeTyping();
      return;
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

    // Portrait mapping
    const portraitMap = {
      'Nikita': 'portrait-nikita', 'Igor': 'portrait-igor', 'Wife': 'portrait-sveta',
      'Sveta': 'portrait-sveta', 'Cat': 'cat', 'Sensei': 'portrait-nashebo',
      'Nashebo': 'portrait-nashebo', 'Customer': 'office-npc',
      'AI': 'office-robot', 'Terminal': 'office-robot', 'GreetBot': 'office-robot',
    };

    // Update portrait — always show one (fallback to Nikita for narrator lines)
    if (this.portrait) { this.portrait.destroy(); this.portrait = null; }
    const portraitKey = portraitMap[line.speaker] || 'portrait-nikita';
    if (this.scene.textures?.exists(portraitKey)) {
      this.portrait = this.scene.add.sprite(this._portraitX, this._portraitY, portraitKey)
        .setDisplaySize(80, 80)
        .setScrollFactor(0)
        .setDepth(1002);
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
    this.selectedChoiceIndex = 0;
    if (this.hasChoices()) {
      this._showChoices(line.choices);
    }
  }

  _createUI() {
    const cam = this.scene.cameras.main;
    const boxHeight = 130;
    const boxWidth = cam.width - 100;
    const boxX = cam.width / 2;
    const boxY = cam.height - boxHeight / 2 - 12;

    // Main dialogue box — Nine Slice if available, rectangle fallback
    if (this.scene.textures.exists('ui-dialogue-frame') && this.scene.add.nineslice) {
      this.bg = this.scene.add.nineslice(
        boxX, boxY,
        'ui-dialogue-frame',
        undefined, boxWidth, boxHeight,
        16, 16, 16, 16
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    } else {
      this.bg = this.scene.add.rectangle(
        boxX, boxY, boxWidth, boxHeight, 0x111133, 0.9
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    }

    // Speaker name tab (above the box, left side)
    const tabX = 120;
    const tabY = boxY - boxHeight / 2 - 6;
    if (this.scene.textures.exists('ui-speaker-tab') && this.scene.add.nineslice) {
      this.speakerBg = this.scene.add.nineslice(
        tabX, tabY, 'ui-speaker-tab',
        undefined, 160, 28, 10, 10, 8, 8
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    } else {
      this.speakerBg = this.scene.add.rectangle(
        tabX, tabY, 160, 28, 0x1a1a44, 0.9
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    }

    this.speakerText = this.scene.add.text(tabX, tabY, '', {
      fontSize: '14px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    // Portrait area (left side of dialogue box)
    const portraitX = 87;
    const portraitY = boxY;
    this._portraitX = portraitX;
    this._portraitY = portraitY;
    if (this.scene.textures.exists('ui-portrait-frame') && this.scene.add.nineslice) {
      this.portraitFrame = this.scene.add.nineslice(
        portraitX, portraitY, 'ui-portrait-frame',
        undefined, 96, 96, 6, 6, 6, 6
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    } else {
      this.portraitFrame = this.scene.add.rectangle(
        portraitX, portraitY, 96, 96, 0x0a0a20, 0.8
      ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    }
    this.portrait = null;

    // Body text (shifted right for portrait)
    const textX = 150;
    const textY = boxY - boxHeight / 2 + 24;
    this.bodyText = this.scene.add.text(textX, textY, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 8,
      wordWrap: { width: boxWidth - 190 },
    }).setScrollFactor(0).setDepth(1001);

    // Advance indicator — clearly shows how to continue
    this.advanceIndicator = this.scene.add.text(
      cam.width - 80, boxY + boxHeight / 2 - 20, 'ENTER ▼', {
        fontSize: '11px', color: '#ccaa44', fontFamily: 'monospace',
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    if (this.scene.tweens) {
      this.scene.tweens.add({
        targets: this.advanceIndicator,
        alpha: { from: 1, to: 0.3 },
        y: { from: boxY + boxHeight / 2 - 20, to: boxY + boxHeight / 2 - 16 },
        yoyo: true, repeat: -1, duration: 600,
      });
    }
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
    const startY = cam.height - 160 - 20 + 80;
    const startX = 150;

    choices.forEach((choice, i) => {
      const name = typeof choice === 'string' ? choice : choice.name;
      const isSelected = i === this.selectedChoiceIndex;

      // Choice background
      const bg = this.scene.add.rectangle(
        startX + 200, startY + i * 30, 420, 26,
        isSelected ? 0x1a1a55 : 0x0a0a20, isSelected ? 0.8 : 0.4
      ).setScrollFactor(0).setDepth(1001);

      // Gold border for selected
      if (isSelected) {
        const border = this.scene.add.rectangle(
          startX + 200, startY + i * 30, 424, 30, 0xccaa44, 0
        ).setStrokeStyle(1, 0xccaa44).setScrollFactor(0).setDepth(1001);
        this.choiceTexts.push(border);
      }

      const prefix = isSelected ? '▶ ' : '  ';
      const text = this.scene.add.text(startX, startY + i * 30, prefix + name, {
        fontSize: '14px',
        color: isSelected ? '#ffcc00' : '#8888aa',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002);

      this.choiceTexts.push(bg);
      this.choiceTexts.push(text);
    });
  }

  _clearChoices() {
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
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
    if (this.speakerBg) { this.speakerBg.destroy(); this.speakerBg = null; }
    if (this.bodyText) { this.bodyText.destroy(); this.bodyText = null; }
    if (this.portrait) { this.portrait.destroy(); this.portrait = null; }
    if (this.portraitFrame) { this.portraitFrame.destroy(); this.portraitFrame = null; }
    if (this.advanceIndicator) { this.advanceIndicator.destroy(); this.advanceIndicator = null; }
    this._clearChoices();
    if (this.typewriterTimer) { this.typewriterTimer.remove(); }
  }

  destroy() {
    this._hideUI();
  }
}
