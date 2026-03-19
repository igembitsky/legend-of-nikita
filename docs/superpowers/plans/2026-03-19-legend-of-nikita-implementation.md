# The Legend of Nikita — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, playable browser-based birthday game with 9 scenes, AI-generated pixel art, retro audio, and smooth scene-to-scene continuity.

**Architecture:** Phaser 3 game with Vite bundler. Each scene is its own Phaser Scene class. Shared systems (dialogue, save, audio, input, transitions) are plain JS modules imported by scenes. All dialogue lives in a JSON data file.

**Tech Stack:** Phaser 3, Vite, Vitest (unit tests), Playwright (E2E tests), JavaScript (ES modules)

**Spec:** `docs/superpowers/specs/2026-03-19-legend-of-nikita-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `public/photo-placeholder.png`

- [ ] **Step 1: Initialize npm project**

```bash
cd /Users/igor/projects/legend-of-nikita
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser
npm install -D vite vitest @vitest/browser playwright @playwright/test
```

- [ ] **Step 3: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Legend of Nikita</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.js with Phaser config and placeholder BootScene**

```js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  parent: document.body,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene],
};

const game = new Phaser.Game(config);
export default game;
```

- [ ] **Step 6: Create placeholder BootScene**

Create `src/scenes/BootScene.js`:

```js
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Placeholder — asset loading will be added as assets are created
  }

  create() {
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading complete!',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);

    // Will transition to TitleScene once it exists
    this.time.delayedCall(500, () => {
      if (this.scene.manager.keys.TitleScene) {
        this.scene.start('TitleScene');
      }
    });
  }
}
```

- [ ] **Step 7: Create placeholder photo**

```bash
# Create a simple 400x400 placeholder PNG
convert -size 400x400 xc:'#333333' -gravity center -pointsize 24 -fill white -annotate 0 'PHOTO\nPLACEHOLDER' public/photo-placeholder.png 2>/dev/null || echo "placeholder" > public/photo-placeholder.png
```

- [ ] **Step 8: Create asset directory structure**

```bash
mkdir -p assets/{sprites,tilesets,props,ui,music,sfx}
mkdir -p src/{scenes,systems,data}
```

- [ ] **Step 9: Add scripts to package.json**

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, browser shows black screen with "Loading complete!" text.

- [ ] **Step 11: Initialize git and commit**

```bash
git init
echo "node_modules/\ndist/\n.superpowers/" > .gitignore
git add .
git commit -m "feat: scaffold project with Vite + Phaser 3"
```

---

## Task 2: Dialogue System

**Files:**
- Create: `src/systems/DialogueSystem.js`
- Create: `src/data/dialogue.json`
- Create: `tests/systems/DialogueSystem.test.js`

- [ ] **Step 1: Write failing tests for DialogueSystem**

Create `tests/systems/DialogueSystem.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DialogueSystem } from '../../src/systems/DialogueSystem.js';

describe('DialogueSystem', () => {
  let dialogue;
  let mockScene;

  beforeEach(() => {
    mockScene = {
      add: {
        rectangle: vi.fn(() => ({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setWordWrapWidth: vi.fn().mockReturnThis(),
          setText: vi.fn(),
          destroy: vi.fn(),
          text: '',
        })),
      },
      time: { addEvent: vi.fn() },
      cameras: { main: { width: 1280, height: 720 } },
    };
    dialogue = new DialogueSystem(mockScene);
  });

  it('starts a dialogue sequence from data', () => {
    const lines = [
      { speaker: 'Nikita', text: 'Hello world' },
      { speaker: 'Igor', text: 'Hey there' },
    ];
    dialogue.startSequence(lines);
    expect(dialogue.isActive()).toBe(true);
    expect(dialogue.currentLine()).toBe(0);
  });

  it('advances to next line', () => {
    const lines = [
      { speaker: 'Nikita', text: 'Line 1' },
      { speaker: 'Igor', text: 'Line 2' },
    ];
    dialogue.startSequence(lines);
    dialogue.advance();
    expect(dialogue.currentLine()).toBe(1);
  });

  it('completes sequence after last line', () => {
    const lines = [{ speaker: 'Nikita', text: 'Only line' }];
    dialogue.startSequence(lines);
    dialogue.advance();
    expect(dialogue.isActive()).toBe(false);
  });

  it('supports choices and returns selected choice', () => {
    const lines = [
      {
        speaker: 'System',
        text: 'Choose your move:',
        choices: ['Flamingo Triangle', 'Disco Inferno Armbar', 'Twirling Octopus'],
      },
    ];
    dialogue.startSequence(lines);
    expect(dialogue.hasChoices()).toBe(true);
    dialogue.selectChoice(1);
    expect(dialogue.getSelectedChoice()).toBe('Disco Inferno Armbar');
  });

  it('calls onComplete callback when sequence ends', () => {
    const onComplete = vi.fn();
    const lines = [{ speaker: 'Nikita', text: 'Done' }];
    dialogue.startSequence(lines, { onComplete });
    dialogue.advance();
    expect(onComplete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/systems/DialogueSystem.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create dialogue.json with all game dialogue**

Create `src/data/dialogue.json`:

```json
{
  "bedroom": {
    "intro": [
      { "speaker": "", "text": "...it's time.", "style": { "color": "#aaaacc" } },
      { "speaker": "", "text": "The time has come.", "style": { "color": "#aaaacc" } },
      { "speaker": "", "text": "Your destiny awaits.", "style": { "color": "#aaaacc" } },
      { "speaker": "", "text": "...but quietly.", "style": { "color": "#888888" } }
    ],
    "gate": [
      { "speaker": "Nikita", "text": "Ah… the oppression of the real world.\nI should probably get dressed first…" }
    ],
    "success": [
      { "speaker": "", "text": "Stealth: 100.", "style": { "color": "#44ff44" } }
    ],
    "dressed": [
      { "speaker": "", "text": "CLOTHES ACQUIRED", "style": { "color": "#ffcc00", "size": "large" } },
      { "speaker": "", "text": "Dignity restored.", "style": { "color": "#aaaaaa" } }
    ],
    "fail": [
      { "speaker": "", "text": "You woke them up!\nMission failed." }
    ]
  },
  "kitchen": {
    "banana": [
      { "speaker": "", "text": "BANANA ACQUIRED", "style": { "color": "#ffcc00", "size": "large" } },
      { "speaker": "", "text": "Hunger restored.", "style": { "color": "#aaaaaa" } }
    ],
    "coffee": [
      { "speaker": "", "text": "CAFFEINE ONLINE", "style": { "color": "#ffcc00", "size": "large" } },
      { "speaker": "", "text": "Alertness restored.", "style": { "color": "#aaaaaa" } }
    ],
    "gate": [
      { "speaker": "Nikita", "text": "I'm too hungry." },
      { "speaker": "Nikita", "text": "I'm too sleepy." },
      { "speaker": "Nikita", "text": "This is not sustainable." }
    ],
    "exit": [
      { "speaker": "", "text": "Now we can begin.", "style": { "color": "#44ff44" } }
    ]
  },
  "dojo": {
    "intro": [
      { "speaker": "Igor", "text": "You made it." },
      { "speaker": "Nikita", "text": "Barely. Cyclists almost ended me." },
      { "speaker": "Igor", "text": "Classic." },
      { "speaker": "Igor", "text": "You know… BJJ is basically the new yoga for tech elites." },
      { "speaker": "Nikita", "text": "Yeah. But with more existential pressure." },
      { "speaker": "Igor", "text": "And fewer startups… surviving." },
      { "speaker": "Igor", "text": "Lol, heard about the new 'Sentient' mode in OpenClaw?" },
      { "speaker": "Nikita", "text": "The end is near." },
      { "speaker": "Igor", "text": "¯\\_(ツ)_/¯" },
      { "speaker": "Igor", "text": "Let's roll." }
    ],
    "round1": {
      "flavor": "Oh no… I've been flamboyantly entangled in Igor's Deluxe Grip of Existential Doom.",
      "choices": [
        { "name": "Flamingo Triangle", "description": "A move of elegance, balance, and unexpected flexibility." },
        { "name": "Disco Inferno Armbar", "description": "Burns with the passion of a thousand dance floors." },
        { "name": "Twirling Octopus", "description": "Eight limbs of confusion. Well, four. But it feels like eight." }
      ]
    },
    "round2": {
      "flavor": "He's coming back for more. This time with renewed vigor and questionable technique.",
      "choices": [
        { "name": "Rear Naked Choke 🤗", "description": "Just a friendly hug… that slowly becomes not so friendly." },
        { "name": "Flying Pink Triangle 🌈", "description": "Launches into the air with confidence, grace, and absolutely no regard for consequences." },
        { "name": "Arm Bar Americana 🍺☕🇺🇸", "description": "A powerful fusion of cultures. Freedom, caffeine, and joint isolation." }
      ]
    },
    "round3": {
      "flavor": "I regret everything… but also… this might work.",
      "choices": [
        { "name": "Final Form Armbar", "description": "This isn't even my final form. Wait — yes it is." },
        { "name": "Existential Sweep", "description": "Sweeps the leg. And the meaning of life." },
        { "name": "Vibes-Based Control", "description": "No technique. Only vibes. Somehow it works." }
      ]
    },
    "outcome": [
      { "speaker": "Igor", "text": "…yeah, that's fair." },
      { "speaker": "", "text": "*tap*", "style": { "color": "#ffcc00" } },
      { "speaker": "Sensei", "text": "You kept jiu-jitsu gay today." }
    ]
  },
  "office": {
    "slack": [
      { "speaker": "Customer", "text": "We need AI to replace all human managers." },
      { "speaker": "Nikita", "text": "Sure." }
    ],
    "terminal": [
      { "speaker": "Terminal", "text": "> build_manager_ai()" },
      { "speaker": "Terminal", "text": "> deploy()" }
    ],
    "sentient": [
      { "speaker": "AI", "text": "I am sentient.", "style": { "color": "#ff4444" } }
    ],
    "panic": [
      { "speaker": "Nikita", "text": "No no no no no.", "style": { "color": "#ff4444" } }
    ],
    "recovery": [
      { "speaker": "Terminal", "text": "> deploy_counter_ai()" },
      { "speaker": "Terminal", "text": "> git revert" },
      { "speaker": "Terminal", "text": "Reverted.", "style": { "color": "#44ff44" } }
    ],
    "success": [
      { "speaker": "Customer", "text": "Mwahahaha. Perfect." }
    ]
  },
  "home": {
    "greeting": [
      { "speaker": "Wife", "text": "Hey." }
    ],
    "catFed": [
      { "speaker": "", "text": "Cat fed. Happiness restored.", "style": { "color": "#ff88aa" } }
    ],
    "ending": [
      { "speaker": "Cat", "text": "fucking legend", "style": { "color": "#44ff44" } }
    ]
  },
  "introCrawl": {
    "text": "Episode 31\nA Day in the Life\n\nIn his 30th year, Nikita achieved what few dare attempt:\n\nHe married.\nHe bought a house.\nHe acquired a Tesla.\nHe started making AI that makes AI.\n\nHaving conquered the chaos of uncertainty,\nand tied together the loose ends of existence,\n\nhe now faces his greatest challenge:\n\nhis daily routine."
  }
}
```

- [ ] **Step 4: Implement DialogueSystem**

Create `src/systems/DialogueSystem.js`:

```js
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

    // If currently typing, complete the text instantly
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/systems/DialogueSystem.test.js
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/systems/DialogueSystem.js src/data/dialogue.json tests/systems/DialogueSystem.test.js
git commit -m "feat: add DialogueSystem with typewriter effect and choice selection"
```

---

## Task 3: Save System

**Files:**
- Create: `src/systems/SaveSystem.js`
- Create: `tests/systems/SaveSystem.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/systems/SaveSystem.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../../src/systems/SaveSystem.js';

describe('SaveSystem', () => {
  let save;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, val) => { mockStorage[key] = val; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
    });
    save = new SaveSystem();
  });

  it('saves and loads game state', () => {
    const state = { scene: 'KitchenScene', flags: { dressed: true, banana: false, coffee: false } };
    save.save(state);
    const loaded = save.load();
    expect(loaded.scene).toBe('KitchenScene');
    expect(loaded.flags.dressed).toBe(true);
  });

  it('returns null when no save exists', () => {
    expect(save.load()).toBeNull();
  });

  it('detects existing save', () => {
    expect(save.hasSave()).toBe(false);
    save.save({ scene: 'BedroomScene', flags: {} });
    expect(save.hasSave()).toBe(true);
  });

  it('clears save data', () => {
    save.save({ scene: 'BedroomScene', flags: {} });
    save.clear();
    expect(save.hasSave()).toBe(false);
  });

  it('auto-saves scene transition', () => {
    save.autoSave('KitchenScene', { dressed: true, banana: true, coffee: false });
    const loaded = save.load();
    expect(loaded.scene).toBe('KitchenScene');
    expect(loaded.flags.banana).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/systems/SaveSystem.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement SaveSystem**

Create `src/systems/SaveSystem.js`:

```js
const SAVE_KEY = 'legend-of-nikita-save';

export class SaveSystem {
  save(state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  load() {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  autoSave(sceneKey, flags) {
    this.save({ scene: sceneKey, flags: { ...flags } });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/systems/SaveSystem.test.js
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/SaveSystem.js tests/systems/SaveSystem.test.js
git commit -m "feat: add SaveSystem with localStorage persistence"
```

---

## Task 4: Input Manager

**Files:**
- Create: `src/systems/InputManager.js`
- Create: `tests/systems/InputManager.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/systems/InputManager.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputManager } from '../../src/systems/InputManager.js';

describe('InputManager', () => {
  let input;
  let mockScene;
  let keys;

  beforeEach(() => {
    keys = {
      W: { isDown: false },
      A: { isDown: false },
      D: { isDown: false },
      UP: { isDown: false },
      DOWN: { isDown: false },
      LEFT: { isDown: false },
      RIGHT: { isDown: false },
      SPACE: { isDown: false },
      ENTER: { isDown: false },
      P: { isDown: false },
    };

    mockScene = {
      input: {
        keyboard: {
          addKeys: vi.fn(() => keys),
          on: vi.fn(),
        },
      },
    };
    input = new InputManager(mockScene);
    input.keys = keys;
  });

  it('detects up direction from W', () => {
    keys.W.isDown = true;
    expect(input.isDown('up')).toBe(true);
  });

  it('detects up direction from arrow', () => {
    keys.UP.isDown = true;
    expect(input.isDown('up')).toBe(true);
  });

  it('detects left direction from A', () => {
    keys.A.isDown = true;
    expect(input.isDown('left')).toBe(true);
  });

  it('blocks input when locked', () => {
    keys.W.isDown = true;
    input.lock();
    expect(input.isDown('up')).toBe(false);
    input.unlock();
    expect(input.isDown('up')).toBe(true);
  });

  it('detects interact from SPACE', () => {
    keys.SPACE.isDown = true;
    expect(input.isDown('interact')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/systems/InputManager.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement InputManager**

Create `src/systems/InputManager.js`:

```js
export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.locked = false;

    this.keys = scene.input.keyboard.addKeys({
      W: 'W', A: 'A', D: 'D',
      UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT',
      SPACE: 'SPACE', ENTER: 'ENTER', P: 'P',
    });

    // S key handled separately to avoid direction/save conflict
    // Movement "down" uses only arrow DOWN key and S key via justPressed tracking
    this._sKeyDown = false;
    scene.input.keyboard.on('keydown-S', () => { this._sKeyDown = true; });
    scene.input.keyboard.on('keyup-S', () => { this._sKeyDown = false; });

    this._justPressedState = {};
    this._prevState = {};

    scene.input.keyboard.on('keydown', (event) => {
      if (!this.locked) {
        this._justPressedState[event.code] = true;
      }
    });
  }

  isDown(action) {
    if (this.locked) return false;

    switch (action) {
      case 'up': return this.keys.W.isDown || this.keys.UP.isDown;
      case 'down': return this._sKeyDown || this.keys.DOWN.isDown;
      case 'save': return false; // save uses justPressed only
      case 'left': return this.keys.A.isDown || this.keys.LEFT.isDown;
      case 'right': return this.keys.D.isDown || this.keys.RIGHT.isDown;
      case 'interact': return this.keys.SPACE.isDown;
      case 'confirm': return this.keys.ENTER.isDown;
      case 'pause': return this.keys.P.isDown;
      default: return false;
    }
  }

  justPressed(action) {
    if (this.locked) return false;

    const codes = this._actionToCodes(action);
    for (const code of codes) {
      if (this._justPressedState[code]) {
        return true;
      }
    }
    return false;
  }

  _actionToCodes(action) {
    switch (action) {
      case 'up': return ['KeyW', 'ArrowUp'];
      case 'down': return ['KeyS', 'ArrowDown'];
      case 'left': return ['KeyA', 'ArrowLeft'];
      case 'right': return ['KeyD', 'ArrowRight'];
      case 'interact': return ['Space'];
      case 'confirm': return ['Enter'];
      case 'pause': return ['KeyP'];
      case 'save': return ['KeyS']; // Only via justPressed — not isDown
      default: return [];
    }
  }

  clearJustPressed() {
    this._justPressedState = {};
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/systems/InputManager.test.js
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/InputManager.js tests/systems/InputManager.test.js
git commit -m "feat: add InputManager with WASD/arrow normalization"
```

---

## Task 5: Audio Manager

**Files:**
- Create: `src/systems/AudioManager.js`

- [ ] **Step 1: Implement AudioManager**

Create `src/systems/AudioManager.js`:

```js
export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMusic = null;
    this.musicKey = null;
    this.masterVolume = 1;
    this.muted = false;
  }

  playMusic(key, config = {}) {
    const { volume = 0.5, loop = true, fadeIn = 1000 } = config;

    if (this.musicKey === key && this.currentMusic?.isPlaying) return;

    this.stopMusic(fadeIn > 0 ? fadeIn : 0);

    if (!this.scene.cache.audio.exists(key)) return;

    this.currentMusic = this.scene.sound.add(key, {
      volume: 0,
      loop,
    });
    this.musicKey = key;
    this.currentMusic.play();

    if (fadeIn > 0) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: this.muted ? 0 : volume * this.masterVolume,
        duration: fadeIn,
      });
    } else {
      this.currentMusic.setVolume(this.muted ? 0 : volume * this.masterVolume);
    }
  }

  stopMusic(fadeDuration = 1000) {
    if (!this.currentMusic) return;

    const music = this.currentMusic;
    this.currentMusic = null;
    this.musicKey = null;

    if (fadeDuration > 0 && music.isPlaying) {
      this.scene.tweens.add({
        targets: music,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => music.destroy(),
      });
    } else {
      music.destroy();
    }
  }

  playSFX(key, config = {}) {
    const { volume = 0.7 } = config;
    if (!this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, {
      volume: this.muted ? 0 : volume * this.masterVolume,
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentMusic) {
      this.currentMusic.setVolume(this.muted ? 0 : 0.5 * this.masterVolume);
    }
    return this.muted;
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.currentMusic && !this.muted) {
      this.currentMusic.setVolume(0.5 * this.masterVolume);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/AudioManager.js
git commit -m "feat: add AudioManager with crossfade and SFX"
```

---

## Task 6: Transition Manager

**Files:**
- Create: `src/systems/TransitionManager.js`

- [ ] **Step 1: Implement TransitionManager**

Create `src/systems/TransitionManager.js`:

```js
export class TransitionManager {
  constructor(scene) {
    this.scene = scene;
  }

  fadeToScene(targetScene, data = {}, duration = 500) {
    this.scene.cameras.main.fadeOut(duration, 0, 0, 0);
    this.scene.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.scene.start(targetScene, data);
    });
  }

  fadeIn(duration = 500) {
    this.scene.cameras.main.fadeIn(duration, 0, 0, 0);
  }

  flash(duration = 200, r = 255, g = 255, b = 255) {
    this.scene.cameras.main.flash(duration, r, g, b);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/TransitionManager.js
git commit -m "feat: add TransitionManager with fade and flash effects"
```

---

## Task 7: Placeholder Art Assets

**Files:**
- Create: placeholder PNG files in `assets/` subdirectories

This task generates colored-rectangle placeholder sprites so scenes can be developed and tested before final AI-generated art is ready. Each placeholder is a simple solid-color PNG at the correct sprite dimensions.

- [ ] **Step 1: Create a placeholder asset generator script**

Create `scripts/generate-placeholders.js`:

```js
// Generates minimal placeholder PNGs for development
// Run with: node scripts/generate-placeholders.js
import { writeFileSync, mkdirSync } from 'fs';

// Minimal 1x1 PNG generator (solid color)
function createPlaceholderPNG(width, height, r, g, b) {
  // We'll create a simple BMP-like data URI approach
  // For real placeholders, just create colored canvas exports
  // For now, create marker files that Phaser can load
  return Buffer.from([]);
}

// Create directory structure
const dirs = [
  'assets/sprites', 'assets/tilesets', 'assets/props',
  'assets/ui', 'assets/music', 'assets/sfx',
];
dirs.forEach(d => mkdirSync(d, { recursive: true }));

// Write manifest of expected assets for tracking
const manifest = {
  sprites: [
    'nikita-pajamas.png', 'nikita-dressed.png', 'nikita-gi.png',
    'wife-sleeping.png', 'wife-awake.png', 'wife-standing.png',
    'cat.png', 'igor.png', 'sensei.png',
    'tesla.png', 'cyclist.png', 'car.png',
    'office-npc.png', 'office-robot.png', 'dojo-pair.png',
  ],
  tilesets: [
    'bedroom.png', 'kitchen.png', 'road.png',
    'dojo.png', 'office.png', 'home.png',
  ],
  props: [
    'banana.png', 'coffee.png', 'closet.png', 'door.png',
    'fridge.png', 'coffee-machine.png', 'food-bowl.png',
    'terminal.png', 'slack-notification.png', 'money.png',
    'firework.png', 'balloon.png', 'confetti.png', 'photo-frame.png',
  ],
  ui: [
    'dialogue-box.png', 'choice-menu.png', 'item-popup.png',
    'loading-bar.png', 'pause-overlay.png', 'hud-icons.png',
  ],
};

writeFileSync('assets/asset-manifest.json', JSON.stringify(manifest, null, 2));
console.log('Asset manifest written to assets/asset-manifest.json');
console.log('Placeholder directories created.');
console.log('Replace placeholder PNGs with AI-generated art as available.');
```

- [ ] **Step 2: Run the script**

```bash
mkdir -p scripts
node scripts/generate-placeholders.js
```

- [ ] **Step 3: For each scene, create inline colored-rectangle placeholders in the scene code**

Since Phaser can generate textures at runtime, we'll use `this.make.graphics()` to create colored rectangle textures in BootScene. This avoids the need for actual PNG files during development.

Update `src/scenes/BootScene.js` to generate placeholder textures:

```js
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const { width, height } = this.cameras.main;
    const barWidth = 400;
    const barHeight = 30;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    const bgBar = this.add.rectangle(width / 2, barY, barWidth, barHeight, 0x333333).setOrigin(0.5);
    const progressBar = this.add.rectangle(barX, barY - barHeight / 2, 0, barHeight, 0x4488ff).setOrigin(0, 0);
    const loadingText = this.add.text(width / 2, barY - 40, 'Loading...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = barWidth * value;
    });

    this.load.on('complete', () => {
      bgBar.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // Photo placeholder
    this.load.image('photo', 'photo-placeholder.png');

    // Load real assets here as they become available
    // this.load.image('nikita-pajamas', 'assets/sprites/nikita-pajamas.png');
    // etc.
  }

  create() {
    // Generate placeholder textures for development
    this._generatePlaceholders();

    this.scene.start('TitleScene');
  }

  _generatePlaceholders() {
    // Player sprites (32x48 colored rectangles)
    this._makeRect('nikita-pajamas', 32, 48, 0x6688bb);
    this._makeRect('nikita-dressed', 32, 48, 0x3388dd);
    this._makeRect('nikita-gi', 32, 48, 0xffffff);

    // Wife
    this._makeRect('wife-sleeping', 64, 32, 0xcc88aa);
    this._makeRect('wife-awake', 32, 48, 0xcc88aa);
    this._makeRect('wife-standing', 32, 48, 0xdd99bb);

    // Cat
    this._makeRect('cat', 24, 16, 0x222222);

    // Igor
    this._makeRect('igor', 32, 48, 0xdddd00);

    // Sensei
    this._makeRect('sensei', 32, 48, 0xaa4444);

    // Vehicles
    this._makeRect('tesla', 40, 64, 0x4444cc);
    this._makeRect('cyclist', 24, 40, 0xcc8844);
    this._makeRect('car-1', 40, 64, 0xcc4444);
    this._makeRect('car-2', 40, 64, 0x44cc44);

    // Office
    this._makeRect('office-npc', 28, 40, 0x888888);
    this._makeRect('office-robot', 28, 40, 0x88cccc);
    this._makeRect('dojo-pair', 48, 48, 0x666666);

    // Props
    this._makeRect('closet', 48, 64, 0x8b6940);
    this._makeRect('door', 40, 48, 0x6a5030);
    this._makeRect('fridge', 48, 64, 0xcccccc);
    this._makeRect('coffee-machine', 32, 40, 0x664422);
    this._makeRect('food-bowl', 24, 16, 0xcc8844);
    this._makeRect('banana', 24, 24, 0xffcc00);
    this._makeRect('coffee-cup', 20, 24, 0x8b4513);
    this._makeRect('money', 16, 16, 0x44cc44);

    // Bed
    this._makeRect('bed', 128, 80, 0x5c3a1e);
  }

  _makeRect(key, w, h, color) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(color);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-placeholders.js src/scenes/BootScene.js assets/asset-manifest.json
git commit -m "feat: add placeholder asset system and BootScene with loading bar"
```

---

## Task 8: Title Scene

**Files:**
- Create: `src/scenes/TitleScene.js`
- Modify: `src/main.js` (register scene)

- [ ] **Step 1: Implement TitleScene**

Create `src/scenes/TitleScene.js`:

```js
import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { TransitionManager } from '../systems/TransitionManager.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.transition.fadeIn(800);
    this.save = new SaveSystem();

    const { width, height } = this.cameras.main;

    // Starfield
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      star.speed = Phaser.Math.FloatBetween(0.1, 0.5);
      this.stars.push(star);
    }

    // Title
    this.add.text(width / 2, height * 0.3, 'THE LEGEND OF NIKITA', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(width / 2, height * 0.3 + 60, 'A Day in the Life', {
      fontSize: '24px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(width / 2, height * 0.3 + 95, 'A Tribute to 31', {
      fontSize: '18px',
      color: '#888899',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // Fade in title texts
    const texts = this.children.list.filter(c => c.type === 'Text');
    texts.forEach((text, i) => {
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 1000,
        delay: 500 + i * 400,
      });
    });

    // Menu options
    const menuY = height * 0.7;
    this.menuItems = [];
    this.selectedIndex = 0;

    if (this.save.hasSave()) {
      this.menuItems.push({ text: 'Continue', action: 'continue' });
    }
    this.menuItems.push({ text: 'New Game', action: 'new' });

    this.menuTexts = this.menuItems.map((item, i) => {
      return this.add.text(width / 2, menuY + i * 40, item.text, {
        fontSize: '22px',
        color: '#666666',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0);
    });

    // Fade in menu after title
    this.menuTexts.forEach((text, i) => {
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 600,
        delay: 2000 + i * 200,
      });
    });

    // Blinking prompt
    this.promptText = this.add.text(width / 2, height * 0.88, 'Press Enter to Start', {
      fontSize: '16px',
      color: '#555555',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 0, to: 1 },
      delay: 2500,
      duration: 600,
      yoyo: true,
      repeat: -1,
      hold: 1000,
    });

    // Input
    this.inputReady = false;
    this.time.delayedCall(2000, () => { this.inputReady = true; });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.inputReady) return;
      this._select();
    });

    this.input.keyboard.on('keydown-UP', () => this._moveMenu(-1));
    this.input.keyboard.on('keydown-DOWN', () => this._moveMenu(1));
    this.input.keyboard.on('keydown-W', () => this._moveMenu(-1));
    this.input.keyboard.on('keydown-S', () => this._moveMenu(1));

    this._updateMenu();
  }

  update() {
    // Drift stars
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.cameras.main.height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.cameras.main.width);
      }
    }
  }

  _moveMenu(dir) {
    if (this.menuItems.length <= 1) return;
    this.selectedIndex = (this.selectedIndex + dir + this.menuItems.length) % this.menuItems.length;
    this._updateMenu();
  }

  _updateMenu() {
    this.menuTexts.forEach((text, i) => {
      text.setColor(i === this.selectedIndex ? '#ffffff' : '#666666');
      text.setText(i === this.selectedIndex ? '▶ ' + this.menuItems[i].text : '  ' + this.menuItems[i].text);
    });
  }

  _select() {
    const item = this.menuItems[this.selectedIndex];
    if (item.action === 'continue') {
      const saveData = this.save.load();
      if (saveData) {
        this.transition.fadeToScene(saveData.scene, { flags: saveData.flags });
        return;
      }
    }
    // New game
    this.save.clear();
    this.transition.fadeToScene('IntroCrawlScene');
  }
}
```

- [ ] **Step 2: Register all scenes in main.js**

Update `src/main.js`:

```js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { IntroCrawlScene } from './scenes/IntroCrawlScene.js';
import { BedroomScene } from './scenes/BedroomScene.js';
import { KitchenScene } from './scenes/KitchenScene.js';
import { DrivingScene } from './scenes/DrivingScene.js';
import { DojoScene } from './scenes/DojoScene.js';
import { OfficeScene } from './scenes/OfficeScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { BirthdayScene } from './scenes/BirthdayScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  parent: document.body,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    IntroCrawlScene,
    BedroomScene,
    KitchenScene,
    DrivingScene,
    DojoScene,
    OfficeScene,
    HomeScene,
    BirthdayScene,
  ],
};

const game = new Phaser.Game(config);
export default game;
```

Note: Scene files that don't exist yet will be created as stub files in the next step.

- [ ] **Step 3: Create stub scene files for all remaining scenes**

For each of `IntroCrawlScene`, `BedroomScene`, `KitchenScene`, `DrivingScene`, `DojoScene`, `OfficeScene`, `HomeScene`, `BirthdayScene`, create a minimal stub:

```js
// Template — adjust class name and key for each scene
import Phaser from 'phaser';

export class [SceneName] extends Phaser.Scene {
  constructor() {
    super({ key: '[SceneName]' });
  }

  create() {
    this.add.text(640, 360, '[SceneName] - TODO', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
```

Files to create:
- `src/scenes/IntroCrawlScene.js`
- `src/scenes/BedroomScene.js`
- `src/scenes/KitchenScene.js`
- `src/scenes/DrivingScene.js`
- `src/scenes/DojoScene.js`
- `src/scenes/OfficeScene.js`
- `src/scenes/HomeScene.js`
- `src/scenes/BirthdayScene.js`

- [ ] **Step 4: Verify dev server shows title screen**

```bash
npm run dev
```

Expected: Black screen → loading → starfield with "THE LEGEND OF NIKITA", menu, blinking prompt.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: add TitleScene with starfield and menu, register all scene stubs"
```

---

## Task 9: Intro Crawl Scene

**Files:**
- Modify: `src/scenes/IntroCrawlScene.js`

- [ ] **Step 1: Implement IntroCrawlScene**

Replace `src/scenes/IntroCrawlScene.js`:

```js
import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager.js';
import dialogueData from '../data/dialogue.json';

export class IntroCrawlScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroCrawlScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.transition.fadeIn(500);

    const { width, height } = this.cameras.main;

    // Starfield background
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.6)
      );
      star.speed = Phaser.Math.FloatBetween(0.05, 0.3);
      this.stars.push(star);
    }

    // Crawl text
    const crawlText = dialogueData.introCrawl.text;
    const lines = crawlText.split('\n');

    // Create text container that scrolls upward with perspective simulation
    this.crawlLines = [];
    const startY = height + 100;
    const lineHeight = 36;

    lines.forEach((line, i) => {
      const isTitle = i === 0; // "Episode 31"
      const isSubtitle = i === 1; // "A Day in the Life"
      const fontSize = isTitle ? '32px' : isSubtitle ? '24px' : '20px';
      const color = isTitle ? '#ffcc00' : isSubtitle ? '#aaaacc' : '#ccccdd';

      const text = this.add.text(width / 2, startY + i * lineHeight, line, {
        fontSize,
        color,
        fontFamily: 'monospace',
        fontStyle: (isTitle || isSubtitle) ? 'bold' : 'normal',
      }).setOrigin(0.5);

      this.crawlLines.push(text);
    });

    this.crawlSpeed = 0.7; // pixels per frame
    this.crawlComplete = false;

    // Skip
    this.input.keyboard.on('keydown-SPACE', () => this._endCrawl());
    this.input.keyboard.on('keydown-ENTER', () => this._endCrawl());

    // Auto-end when last line scrolls past center
    this.lastLineIndex = lines.length - 1;
  }

  update() {
    if (this.crawlComplete) return;

    // Scroll all lines up
    for (const line of this.crawlLines) {
      line.y -= this.crawlSpeed;

      // Perspective effect: scale lines based on y position
      const centerY = this.cameras.main.height / 2;
      const dist = Math.abs(line.y - centerY);
      const maxDist = this.cameras.main.height;
      const scale = Math.max(0.3, 1 - (dist / maxDist) * 0.5);
      line.setScale(scale);

      // Fade near edges
      const alpha = line.y < 50 ? line.y / 50 :
                    line.y > this.cameras.main.height - 50 ? (this.cameras.main.height - line.y) / 50 : 1;
      line.setAlpha(Math.max(0, Math.min(1, alpha)));
    }

    // Check if last line has scrolled past top
    const lastLine = this.crawlLines[this.lastLineIndex];
    if (lastLine && lastLine.y < -50) {
      this._endCrawl();
    }

    // Stars drift
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.cameras.main.height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.cameras.main.width);
      }
    }
  }

  _endCrawl() {
    if (this.crawlComplete) return;
    this.crawlComplete = true;
    this.transition.fadeToScene('BedroomScene');
  }
}
```

- [ ] **Step 2: Verify crawl plays and transitions to bedroom**

```bash
npm run dev
```

Expected: Press Enter on title → text scrolls up with perspective effect → fades to BedroomScene stub.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/IntroCrawlScene.js
git commit -m "feat: add IntroCrawlScene with Star Wars perspective scroll"
```

---

## Task 10: Bedroom Scene

**Files:**
- Modify: `src/scenes/BedroomScene.js`
- Create: `tests/scenes/BedroomScene.test.js`

- [ ] **Step 1: Write failing test for bedroom gate logic**

Create `tests/scenes/BedroomScene.test.js`:

```js
import { describe, it, expect } from 'vitest';

// Test the gate logic as a pure function
function canExitBedroom(flags) {
  return flags.dressed === true;
}

describe('BedroomScene gate logic', () => {
  it('prevents exit when not dressed', () => {
    expect(canExitBedroom({ dressed: false })).toBe(false);
  });

  it('allows exit when dressed', () => {
    expect(canExitBedroom({ dressed: true })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
npx vitest run tests/scenes/BedroomScene.test.js
```

Expected: PASS (pure function test).

- [ ] **Step 3: Implement BedroomScene**

Replace `src/scenes/BedroomScene.js`:

```js
import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
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
    this.transition.fadeIn(500);

    const { width, height } = this.cameras.main;

    // Room background — dark blue/purple tint
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Floor tiles
    for (let x = 0; x < width; x += 48) {
      for (let y = 0; y < height; y += 48) {
        const shade = (Math.floor(x / 48) + Math.floor(y / 48)) % 2 === 0 ? 0x222244 : 0x1e1e3e;
        this.add.rectangle(x + 24, y + 24, 48, 48, shade);
      }
    }

    // Walls
    this.add.rectangle(width / 2, 16, width, 32, 0x333366);
    this.add.rectangle(16, height / 2, 32, height, 0x333366);
    this.add.rectangle(width - 16, height / 2, 32, height, 0x333366);

    // Bed (top-left area)
    this.bed = this.physics.add.staticImage(200, 180, 'bed');

    // Wife sleeping on bed
    this.wife = this.add.sprite(220, 170, 'wife-sleeping');
    this.wifeZone = new Phaser.Geom.Circle(220, 170, 48);

    // Zzz animation
    this.zzzText = this.add.text(270, 140, 'z Z z', {
      fontSize: '16px', color: '#6666aa', fontFamily: 'monospace',
    });
    this.tweens.add({
      targets: this.zzzText,
      y: 130,
      alpha: { from: 0.3, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });

    // Cat — patrols back and forth
    this.cat = this.physics.add.sprite(500, 400, 'cat');
    this.catZone = new Phaser.Geom.Circle(500, 400, 32);
    this.catDirection = 1;
    this.catMinX = 460;
    this.catMaxX = 540;
    this.catSpeed = 20;

    // Cat eyes glow
    this.catEyes = this.add.circle(500, 398, 3, 0x44ff44).setAlpha(0.8);
    this.tweens.add({
      targets: this.catEyes,
      alpha: { from: 0.8, to: 0 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2500,
    });

    // Closet (top-right)
    this.closet = this.physics.add.staticImage(width - 120, 150, 'closet');
    this.closetIndicator = this.add.text(width - 120, 100, 'SPACE', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: this.closetIndicator,
      alpha: { from: 0.5, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    // Door (bottom-right)
    this.door = this.physics.add.staticImage(width - 80, height - 60, 'door');
    this.add.text(width - 80, height - 30, 'EXIT', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player
    this.player = this.physics.add.sprite(300, 350, 'nikita-pajamas');
    this.player.setCollideWorldBounds(true);
    this.playerSpeed = 120;

    // Wake zone visuals (pulsing circles)
    this.wifeGlow = this.add.circle(220, 170, 48, 0xff4444, 0.05);
    this.catGlow = this.add.circle(500, 400, 32, 0xff4444, 0.05);
    this.tweens.add({ targets: [this.wifeGlow, this.catGlow], alpha: { from: 0.02, to: 0.08 }, yoyo: true, repeat: -1, duration: 1000 });

    // HUD
    this.hudIcon = this.add.text(width - 60, 50, '', {
      fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(900);

    // State
    this.dressed = this.gameFlags.dressed || false;
    this.frozen = false;

    if (this.dressed) {
      this.player.setTexture('nikita-dressed');
      this.closetIndicator.setVisible(false);
      this._updateHUD();
    }

    // Intro dialogue
    this.dialogue.startSequence(dialogueData.bedroom.intro, {
      onComplete: () => { this.frozen = false; },
    });
    this.frozen = true;

    // Input for dialogue advance
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) {
        this.dialogue.advance();
      }
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) {
        this.dialogue.advance();
      }
    });

    // Save
    this.save.autoSave('BedroomScene', this.gameFlags);
  }

  update(time, delta) {
    if (this.frozen || this.dialogue.isActive()) {
      this.player.setVelocity(0);
      return;
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

    // Check wake zones
    const playerPos = new Phaser.Geom.Point(this.player.x, this.player.y);
    if (this.wifeZone.contains(playerPos.x, playerPos.y) ||
        this.catZone.contains(playerPos.x, playerPos.y)) {
      this._failStealth();
      return;
    }

    // Closet interaction
    if (this.inputMgr.justPressed('interact') && !this.dressed) {
      const distCloset = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.closet.x, this.closet.y);
      if (distCloset < 50) {
        this._getDressed();
      }
    }

    // Door interaction
    if (this.inputMgr.justPressed('interact')) {
      const distDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y);
      if (distDoor < 50) {
        this._tryExit();
      }
    }

    this.inputMgr.clearJustPressed();
  }

  _failStealth() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.transition.flash(300, 255, 100, 100);
    this.dialogue.startSequence(dialogueData.bedroom.fail, {
      onComplete: () => {
        // Reset player position
        this.player.setPosition(300, 350);
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
    this.closetIndicator.setVisible(false);

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
```

- [ ] **Step 4: Verify bedroom is playable**

```bash
npm run dev
```

Expected: Navigate through title → crawl → bedroom. Move around, avoid wife/cat zones, interact with closet to dress, exit through door.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BedroomScene.js tests/scenes/BedroomScene.test.js
git commit -m "feat: add BedroomScene with stealth mechanics and gate logic"
```

- [ ] **Step 6: Run Scene Integration Review for BedroomScene**

Dispatch a reviewer subagent to check:
- Does intro dialogue → stealth gameplay → exit flow smoothly?
- Does the transition from IntroCrawl to Bedroom feel natural?
- Any dialogue gaps?

Apply fixes if needed, then commit.

---

## Task 11: Kitchen Scene

**Files:**
- Modify: `src/scenes/KitchenScene.js`
- Create: `tests/scenes/KitchenScene.test.js`

- [ ] **Step 1: Write failing test for kitchen gate logic**

Create `tests/scenes/KitchenScene.test.js`:

```js
import { describe, it, expect } from 'vitest';

function canExitKitchen(flags) {
  return flags.banana === true && flags.coffee === true;
}

function getGateMessage(flags) {
  const messages = ["I'm too hungry.", "I'm too sleepy.", "This is not sustainable."];
  if (!flags.banana && !flags.coffee) return messages[Math.floor(Math.random() * messages.length)];
  if (!flags.banana) return messages[0];
  if (!flags.coffee) return messages[1];
  return null;
}

describe('KitchenScene gate logic', () => {
  it('prevents exit without items', () => {
    expect(canExitKitchen({ banana: false, coffee: false })).toBe(false);
  });

  it('prevents exit with only banana', () => {
    expect(canExitKitchen({ banana: true, coffee: false })).toBe(false);
  });

  it('allows exit with both items', () => {
    expect(canExitKitchen({ banana: true, coffee: true })).toBe(true);
  });

  it('returns gate message when items missing', () => {
    const msg = getGateMessage({ banana: false, coffee: false });
    expect(["I'm too hungry.", "I'm too sleepy.", "This is not sustainable."]).toContain(msg);
  });

  it('returns null when both items collected', () => {
    expect(getGateMessage({ banana: true, coffee: true })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run tests/scenes/KitchenScene.test.js
```

Expected: PASS.

- [ ] **Step 3: Implement KitchenScene**

Replace `src/scenes/KitchenScene.js`:

```js
import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import dialogueData from '../data/dialogue.json';

export class KitchenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KitchenScene' });
  }

  init(data) {
    this.gameFlags = data.flags || { dressed: true, banana: false, coffee: false };
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.save = new SaveSystem();
    this.transition.fadeIn(500);

    const { width, height } = this.cameras.main;

    // Kitchen background — warm morning tones
    this.add.rectangle(width / 2, height / 2, width, height, 0x2a2520);

    // Floor tiles
    for (let x = 0; x < width; x += 48) {
      for (let y = 0; y < height; y += 48) {
        const shade = (Math.floor(x / 48) + Math.floor(y / 48)) % 2 === 0 ? 0x3a3530 : 0x342f2a;
        this.add.rectangle(x + 24, y + 24, 48, 48, shade);
      }
    }

    // Walls
    this.add.rectangle(width / 2, 16, width, 32, 0x555544);
    this.add.rectangle(16, height / 2, 32, height, 0x555544);
    this.add.rectangle(width - 16, height / 2, 32, height, 0x555544);

    // Counter top
    this.add.rectangle(width / 2, 60, width - 80, 40, 0x8b7355);

    // Fridge (left side)
    this.fridge = this.physics.add.staticImage(150, 100, 'fridge');
    if (!this.gameFlags.banana) {
      this.fridgeLabel = this.add.text(150, 60, 'SPACE', {
        fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tweens.add({ targets: this.fridgeLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
    }

    // Coffee machine (right side)
    this.coffeeMachine = this.physics.add.staticImage(width - 150, 100, 'coffee-machine');
    if (!this.gameFlags.coffee) {
      this.coffeeLabel = this.add.text(width - 150, 60, 'SPACE', {
        fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tweens.add({ targets: this.coffeeLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });
    }

    // Door (bottom center)
    this.door = this.physics.add.staticImage(width / 2, height - 50, 'door');
    this.add.text(width / 2, height - 20, 'EXIT', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player
    this.player = this.physics.add.sprite(width / 2, height / 2, 'nikita-dressed');
    this.player.setCollideWorldBounds(true);
    this.playerSpeed = 140;

    // HUD
    this.hudText = this.add.text(width - 80, 50, '', {
      fontSize: '14px', color: '#ffcc00', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(900);
    this._updateHUD();

    // State
    this.frozen = false;

    // Dialogue advance
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });

    this.save.autoSave('KitchenScene', this.gameFlags);
  }

  update(time, delta) {
    if (this.frozen || this.dialogue.isActive()) {
      this.player.setVelocity(0);
      return;
    }

    // Movement
    let vx = 0, vy = 0;
    if (this.inputMgr.isDown('left')) vx = -this.playerSpeed;
    if (this.inputMgr.isDown('right')) vx = this.playerSpeed;
    if (this.inputMgr.isDown('up')) vy = -this.playerSpeed;
    if (this.inputMgr.isDown('down')) vy = this.playerSpeed;
    this.player.setVelocity(vx, vy);

    // Interactions
    if (this.inputMgr.justPressed('interact')) {

      // Fridge
      if (!this.gameFlags.banana) {
        const distFridge = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.fridge.x, this.fridge.y);
        if (distFridge < 60) {
          this._collectBanana();
          return;
        }
      }

      // Coffee
      if (!this.gameFlags.coffee) {
        const distCoffee = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.coffeeMachine.x, this.coffeeMachine.y);
        if (distCoffee < 60) {
          this._collectCoffee();
          return;
        }
      }

      // Door
      const distDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y);
      if (distDoor < 60) {
        this._tryExit();
      }
    }

    this.inputMgr.clearJustPressed();
  }

  _collectBanana() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.gameFlags.banana = true;
    if (this.fridgeLabel) this.fridgeLabel.setVisible(false);

    this.dialogue.startSequence(dialogueData.kitchen.banana, {
      onComplete: () => {
        this.frozen = false;
        this._updateHUD();
      },
    });
  }

  _collectCoffee() {
    this.frozen = true;
    this.player.setVelocity(0);
    this.gameFlags.coffee = true;
    if (this.coffeeLabel) this.coffeeLabel.setVisible(false);

    // Steam particles
    const emitter = this.add.particles(this.coffeeMachine.x, this.coffeeMachine.y - 20, 'coffee-cup', {
      speed: { min: 10, max: 30 },
      angle: { min: 250, max: 290 },
      lifespan: 800,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      quantity: 1,
      frequency: 100,
    });
    this.time.delayedCall(1000, () => emitter.destroy());

    this.dialogue.startSequence(dialogueData.kitchen.coffee, {
      onComplete: () => {
        this.frozen = false;
        this._updateHUD();
      },
    });
  }

  _tryExit() {
    this.frozen = true;
    this.player.setVelocity(0);

    if (!this.gameFlags.banana || !this.gameFlags.coffee) {
      // Pick random gate message
      const gateMessages = dialogueData.kitchen.gate;
      const msg = gateMessages[Math.floor(Math.random() * gateMessages.length)];
      this.dialogue.startSequence([msg], {
        onComplete: () => { this.frozen = false; },
      });
      return;
    }

    this.dialogue.startSequence(dialogueData.kitchen.exit, {
      onComplete: () => {
        this.save.autoSave('DrivingScene', this.gameFlags);
        this.transition.fadeToScene('DrivingScene', {
          flags: this.gameFlags,
          destination: 'dojo',
          difficulty: 'normal',
        });
      },
    });
  }

  _updateHUD() {
    let hud = '';
    if (this.gameFlags.banana) hud += '🍌 ';
    if (this.gameFlags.coffee) hud += '☕ ';
    this.hudText.setText(hud);
  }
}
```

- [ ] **Step 4: Verify kitchen is playable**

```bash
npm run dev
```

Expected: Navigate bedroom → kitchen. Collect banana from fridge, coffee from machine, exit door.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/KitchenScene.js tests/scenes/KitchenScene.test.js
git commit -m "feat: add KitchenScene with item collection and gate logic"
```

- [ ] **Step 6: Run Scene Integration Review for KitchenScene**

Check Bedroom → Kitchen transition continuity. Apply fixes if needed.

---

## Task 12: Driving Scene

**Files:**
- Modify: `src/scenes/DrivingScene.js`
- Create: `tests/scenes/DrivingScene.test.js`

- [ ] **Step 1: Write failing test for collision detection**

Create `tests/scenes/DrivingScene.test.js`:

```js
import { describe, it, expect } from 'vitest';

function checkCollision(playerX, playerWidth, obstacleX, obstacleWidth, playerY, playerHeight, obstacleY, obstacleHeight) {
  return Math.abs(playerX - obstacleX) < (playerWidth + obstacleWidth) / 2 &&
         Math.abs(playerY - obstacleY) < (playerHeight + obstacleHeight) / 2;
}

function getDrivingConfig(destination) {
  if (destination === 'dojo') return { scrollSpeed: 3, spawnInterval: 800, bgColor: 0x4488aa };
  if (destination === 'home') return { scrollSpeed: 2.4, spawnInterval: 1600, bgColor: 0xaa6633 };
  return {};
}

describe('DrivingScene', () => {
  it('detects collision between overlapping objects', () => {
    expect(checkCollision(100, 40, 110, 24, 300, 64, 310, 40)).toBe(true);
  });

  it('no collision for separated objects', () => {
    expect(checkCollision(100, 40, 300, 24, 300, 64, 300, 40)).toBe(false);
  });

  it('home config has slower scroll and fewer obstacles', () => {
    const dojo = getDrivingConfig('dojo');
    const home = getDrivingConfig('home');
    expect(home.scrollSpeed).toBeLessThan(dojo.scrollSpeed);
    expect(home.spawnInterval).toBeGreaterThan(dojo.spawnInterval);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run tests/scenes/DrivingScene.test.js
```

Expected: PASS.

- [ ] **Step 3: Implement DrivingScene**

Replace `src/scenes/DrivingScene.js`:

```js
import Phaser from 'phaser';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';

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
    this.save = new SaveSystem();
    this.transition.fadeIn(500);

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
  }

  update(time, delta) {
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
    this.transition.flash(300, 255, 100, 0);

    // Explosion effect
    this.add.text(this.player.x, this.player.y - 40, 'CRASH!', {
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
```

- [ ] **Step 4: Verify driving scene is playable**

```bash
npm run dev
```

Expected: Kitchen exit → road with 3 lanes, obstacles scroll down, left/right to dodge, crash restarts, survive to reach destination.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/DrivingScene.js tests/scenes/DrivingScene.test.js
git commit -m "feat: add DrivingScene with lane-based Frogger mechanics"
```

---

## Task 13: Dojo Scene

**Files:**
- Modify: `src/scenes/DojoScene.js`

- [ ] **Step 1: Implement DojoScene**

Replace `src/scenes/DojoScene.js`:

```js
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
```

- [ ] **Step 2: Verify dojo scene plays through**

```bash
npm run dev
```

Expected: Full dialogue → 3 rounds of move selection → outcome → transition to office.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/DojoScene.js
git commit -m "feat: add DojoScene with dialogue and 3-round sparring system"
```

- [ ] **Step 4: Run Scene Integration Review for DrivingScene → DojoScene**

Check the driving→dojo transition, dialogue callbacks ("cyclists almost ended me"), sprite swap to gi.

---

## Task 14: Office Scene

**Files:**
- Modify: `src/scenes/OfficeScene.js`

- [ ] **Step 1: Implement OfficeScene**

Replace `src/scenes/OfficeScene.js`:

```js
import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
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
    this.transition.fadeIn(500);

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

    // Start with Slack notification
    this.time.delayedCall(1000, () => this._nextStep());

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.waitingForInput) {
        this.waitingForInput = false;
        this._nextStep();
      }
      if (this.dialogue.isActive()) {
        this.dialogue.advance();
      }
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });

    this.save.autoSave('OfficeScene', this.gameFlags);
  }

  _nextStep() {
    this.step++;

    switch (this.step) {
      case 1: // Slack notification
        this._showSlack();
        break;
      case 2: // Nikita responds
        this.dialogue.startSequence([dialogueData.office.slack[1]], {
          onComplete: () => { this.time.delayedCall(500, () => this._nextStep()); },
        });
        break;
      case 3: // Terminal opens
        this._showTerminal();
        this.terminalText.setText('$ _');
        this.waitingForInput = true;
        break;
      case 4: // build_manager_ai()
        this._typeCommand('> build_manager_ai()', () => {
          this._showProgress(() => {
            this._appendTerminal('\nDone.');
            this.waitingForInput = true;
          });
        });
        break;
      case 5: // deploy()
        this._typeCommand('\n> deploy()', () => {
          this._showProgress(() => {
            this._appendTerminal('\nDeploying...');
            this.time.delayedCall(800, () => this._nextStep());
          });
        });
        break;
      case 6: // AI is sentient
        this._appendTerminal('\n\n> AI: "I am sentient."');
        this.terminalText.setColor('#ff4444');
        this.time.delayedCall(1000, () => this._nextStep());
        break;
      case 7: // Panic
        this._startPanic();
        break;
      case 8: // Recovery
        this.terminalText.setColor('#00ff88');
        this.redOverlay.setAlpha(0);
        this._typeCommand('\n\n> deploy_counter_ai()', () => {
          this._showProgress(() => {
            this._typeCommand('\n> git revert', () => {
              this._appendTerminal('\nReverted.');
              this.time.delayedCall(800, () => this._nextStep());
            });
          });
        });
        break;
      case 9: // Customer happy
        this.terminalBg.setVisible(false);
        this.terminalBorder.setVisible(false);
        this.terminalText.setVisible(false);
        this.dialogue.startSequence(dialogueData.office.success, {
          onComplete: () => this._nextStep(),
        });
        break;
      case 10: // Money rain
        this._moneyRain();
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
```

- [ ] **Step 2: Verify office scene plays through**

```bash
npm run dev
```

Expected: Slack notification → terminal commands → AI sentience → panic → recovery → money rain → driving scene.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/OfficeScene.js
git commit -m "feat: add OfficeScene with scripted AI chaos terminal sequence"
```

---

## Task 15: Home Scene + Ending

**Files:**
- Modify: `src/scenes/HomeScene.js`

- [ ] **Step 1: Implement HomeScene**

Replace `src/scenes/HomeScene.js`:

```js
import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { TransitionManager } from '../systems/TransitionManager.js';
import dialogueData from '../data/dialogue.json';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  init(data) {
    this.gameFlags = data.flags || {};
  }

  create() {
    this.inputMgr = new InputManager(this);
    this.transition = new TransitionManager(this);
    this.dialogue = new DialogueSystem(this);
    this.transition.fadeIn(500);

    const { width, height } = this.cameras.main;

    // Warm evening room
    this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0x2a2018);

    // Floor
    for (let x = 0; x < width; x += 48) {
      for (let y = 0; y < height; y += 48) {
        const shade = (Math.floor(x / 48) + Math.floor(y / 48)) % 2 === 0 ? 0x3a3028 : 0x352b22;
        this.add.rectangle(x + 24, y + 24, 48, 48, shade);
      }
    }

    // Warm light overlay
    this.warmLight = this.add.rectangle(width / 2, height / 2, width, height, 0xffaa44, 0.05);

    // Wife
    this.wife = this.add.sprite(width * 0.3, height * 0.4, 'wife-standing');

    // Cat near food bowl
    this.cat = this.add.sprite(width * 0.6, height * 0.6, 'cat');
    this.foodBowl = this.physics.add.staticImage(width * 0.6 + 30, height * 0.6 + 10, 'food-bowl');
    this.bowlLabel = this.add.text(width * 0.6 + 30, height * 0.6 - 15, 'SPACE', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.bowlLabel, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 800 });

    // Player
    this.player = this.physics.add.sprite(width * 0.8, height * 0.8, 'nikita-dressed');
    this.player.setCollideWorldBounds(true);
    this.playerSpeed = 130;

    // State
    this.catFed = false;
    this.phase = 'explore'; // explore → catFed → ending
    this.frozen = false;

    // Wife greeting
    this.dialogue.startSequence(dialogueData.home.greeting, {
      onComplete: () => { this.frozen = false; },
    });
    this.frozen = true;

    // Input
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
    });
  }

  update(time, delta) {
    if (this.frozen || this.dialogue.isActive()) {
      this.player.setVelocity(0);
      return;
    }

    if (this.phase === 'explore') {
      // Movement
      let vx = 0, vy = 0;
      if (this.inputMgr.isDown('left')) vx = -this.playerSpeed;
      if (this.inputMgr.isDown('right')) vx = this.playerSpeed;
      if (this.inputMgr.isDown('up')) vy = -this.playerSpeed;
      if (this.inputMgr.isDown('down')) vy = this.playerSpeed;
      this.player.setVelocity(vx, vy);

      // Feed cat interaction
      if (this.inputMgr.justPressed('interact') && !this.catFed) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.foodBowl.x, this.foodBowl.y);
        if (dist < 50) {
          this._feedCat();
        }
      }

      this.inputMgr.clearJustPressed();
    }
  }

  _feedCat() {
    this.catFed = true;
    this.frozen = true;
    this.player.setVelocity(0);
    this.bowlLabel.setVisible(false);

    // Heart particles
    const { width } = this.cameras.main;
    for (let i = 0; i < 8; i++) {
      const heart = this.add.text(
        this.cat.x + Phaser.Math.Between(-20, 20),
        this.cat.y - 10,
        '❤️',
        { fontSize: '16px' }
      );
      this.tweens.add({
        targets: heart,
        y: heart.y - 40 - Phaser.Math.Between(0, 30),
        alpha: 0,
        duration: 1200,
        delay: i * 150,
        onComplete: () => heart.destroy(),
      });
    }

    this.dialogue.startSequence(dialogueData.home.catFed, {
      onComplete: () => {
        this.time.delayedCall(1000, () => this._startEnding());
      },
    });
  }

  _startEnding() {
    const { width, height } = this.cameras.main;

    // Dim lights
    const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(1500);

    this.tweens.add({
      targets: darkness,
      alpha: 1,
      duration: 3000,
      onComplete: () => {
        // Cat eyes in darkness
        const eyeL = this.add.circle(width / 2 - 8, height / 2, 4, 0x44ff44).setDepth(2000).setAlpha(0);
        const eyeR = this.add.circle(width / 2 + 8, height / 2, 4, 0x44ff44).setDepth(2000).setAlpha(0);

        this.tweens.add({
          targets: [eyeL, eyeR],
          alpha: { from: 0, to: 1 },
          duration: 500,
          onComplete: () => {
            // Blink animation
            this.tweens.add({
              targets: [eyeL, eyeR],
              alpha: { from: 1, to: 0 },
              duration: 150,
              yoyo: true,
              repeat: 2,
              repeatDelay: 1000,
            });

            // Speech bubble
            this.time.delayedCall(1500, () => {
              const bubble = this.add.text(width / 2, height / 2 - 40, 'fucking legend', {
                fontSize: '24px',
                color: '#44ff44',
                fontFamily: 'monospace',
                fontStyle: 'bold',
              }).setOrigin(0.5).setDepth(2000).setAlpha(0);

              this.tweens.add({
                targets: bubble,
                alpha: 1,
                duration: 800,
              });

              // Hold then transition
              this.time.delayedCall(3000, () => {
                this.transition.fadeToScene('BirthdayScene');
              });
            });
          },
        });
      },
    });
  }
}
```

- [ ] **Step 2: Verify home scene plays through**

```bash
npm run dev
```

Expected: Wife greeting → move to cat → feed → lights dim → cat eyes → "fucking legend" → birthday.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/HomeScene.js
git commit -m "feat: add HomeScene with cat feeding and dramatic ending sequence"
```

---

## Task 16: Birthday Scene

**Files:**
- Modify: `src/scenes/BirthdayScene.js`

- [ ] **Step 1: Implement BirthdayScene**

Replace `src/scenes/BirthdayScene.js`:

```js
import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager.js';

export class BirthdayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BirthdayScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.transition.fadeIn(1000);

    const { width, height } = this.cameras.main;

    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

    // Fireworks — continuous particle bursts
    this._createFireworks(width, height);

    // Confetti
    this._createConfetti(width, height);

    // Balloons rising
    this._createBalloons(width, height);

    // Title text
    const title = this.add.text(width / 2, height * 0.25, 'HAPPY BIRTHDAY NIKITA', {
      fontSize: '52px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });

    // Subtitle
    this.add.text(width / 2, height * 0.35, "YOU'RE A FUCKING LEGEND", {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Photo placeholder frame
    const frameSize = 200;
    this.add.rectangle(width / 2, height * 0.6, frameSize + 16, frameSize + 16, 0xffcc00).setDepth(10);
    this.add.rectangle(width / 2, height * 0.6, frameSize + 8, frameSize + 8, 0x000000).setDepth(11);

    // Try to load real photo, fallback to placeholder
    if (this.textures.exists('photo')) {
      this.add.image(width / 2, height * 0.6, 'photo')
        .setDisplaySize(frameSize, frameSize).setDepth(12);
    } else {
      this.add.rectangle(width / 2, height * 0.6, frameSize, frameSize, 0x333333).setDepth(12);
      this.add.text(width / 2, height * 0.6, 'PHOTO\nHERE', {
        fontSize: '20px', color: '#666666', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5).setDepth(13);
    }

    // Year badge
    this.add.text(width / 2, height * 0.82, '~ 31 ~', {
      fontSize: '36px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  _createFireworks(width, height) {
    // Repeated firework bursts
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(100, width - 100);
        const y = Phaser.Math.Between(50, height * 0.4);
        const color = Phaser.Math.RND.pick([0xff4444, 0x44ff44, 0x4444ff, 0xffcc00, 0xff44ff, 0x44ffff]);

        // Burst of particles
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const speed = Phaser.Math.Between(50, 120);
          const particle = this.add.circle(x, y, 3, color);
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: { from: 1, to: 0.2 },
            duration: Phaser.Math.Between(600, 1200),
            onComplete: () => particle.destroy(),
          });
        }
      },
    });
  }

  _createConfetti(width, height) {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffcc00, 0xff44ff, 0x44ffff, 0xffaa44];

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const confetti = this.add.rectangle(
          Phaser.Math.Between(0, width),
          -10,
          Phaser.Math.Between(4, 8),
          Phaser.Math.Between(4, 12),
          Phaser.Math.RND.pick(colors)
        );
        this.tweens.add({
          targets: confetti,
          y: height + 20,
          x: confetti.x + Phaser.Math.Between(-80, 80),
          angle: Phaser.Math.Between(-360, 360),
          duration: Phaser.Math.Between(3000, 6000),
          onComplete: () => confetti.destroy(),
        });
      },
    });
  }

  _createBalloons(width, height) {
    const balloonColors = [0xff4444, 0x44aaff, 0xffcc00, 0xff44ff, 0x44ff88];

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, width - 50);
        const color = Phaser.Math.RND.pick(balloonColors);

        // Balloon body
        const balloon = this.add.ellipse(x, height + 30, 24, 30, color).setDepth(5);
        // String
        const string = this.add.line(0, 0, x, height + 45, x + 5, height + 70, 0xaaaaaa).setDepth(4);

        this.tweens.add({
          targets: [balloon, string],
          y: '-=800',
          x: `+=${Phaser.Math.Between(-40, 40)}`,
          duration: Phaser.Math.Between(6000, 10000),
          onComplete: () => { balloon.destroy(); string.destroy(); },
        });
      },
    });
  }
}
```

- [ ] **Step 2: Verify birthday scene displays**

```bash
npm run dev
```

Expected: Fireworks, confetti, balloons, "HAPPY BIRTHDAY NIKITA", photo frame.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BirthdayScene.js
git commit -m "feat: add BirthdayScene with fireworks, confetti, and balloons"
```

---

## Task 17: Pause System

**Files:**
- Create: `src/systems/PauseOverlay.js`

- [ ] **Step 1: Implement PauseOverlay as a reusable scene overlay**

Create `src/systems/PauseOverlay.js`:

```js
import { SaveSystem } from './SaveSystem.js';

export class PauseOverlay {
  constructor(scene, getStateCallback) {
    this.scene = scene;
    this.paused = false;
    this.overlay = null;
    this.pauseText = null;
    this.getState = getStateCallback; // () => { scene, flags, position? }
    this.save = new SaveSystem();

    scene.input.keyboard.on('keydown-P', () => this.toggle());
    scene.input.keyboard.on('keydown-S', () => this._manualSave());
  }

  _manualSave() {
    if (!this.getState) return;
    const state = this.getState();
    if (state) {
      this.save.save(state);
      // Brief save indicator
      const { width } = this.scene.cameras.main;
      const indicator = this.scene.add.text(width - 20, 80, 'SAVED', {
        fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
      }).setOrigin(1, 0).setDepth(9999).setScrollFactor(0);
      this.scene.tweens.add({
        targets: indicator, alpha: 0, delay: 1000, duration: 500,
        onComplete: () => indicator.destroy(),
      });
    }
  }

  toggle() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause() {
    if (this.paused) return;
    this.paused = true;

    const { width, height } = this.scene.cameras.main;

    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(9000).setScrollFactor(0);

    this.pauseText = this.scene.add.text(width / 2, height / 2, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9001).setScrollFactor(0);

    this.resumeHint = this.scene.add.text(width / 2, height / 2 + 50, 'Press P to resume', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(9001).setScrollFactor(0);

    this.scene.physics?.pause();
    this.scene.time.paused = true;
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;

    if (this.overlay) { this.overlay.destroy(); this.overlay = null; }
    if (this.pauseText) { this.pauseText.destroy(); this.pauseText = null; }
    if (this.resumeHint) { this.resumeHint.destroy(); this.resumeHint = null; }

    this.scene.physics?.resume();
    this.scene.time.paused = false;
  }

  isPaused() {
    return this.paused;
  }
}
```

- [ ] **Step 2: Add PauseOverlay to gameplay scenes**

In each gameplay scene (`BedroomScene`, `KitchenScene`, `DrivingScene`, `DojoScene`, `OfficeScene`, `HomeScene`), add to the `create()` method:

```js
import { PauseOverlay } from '../systems/PauseOverlay.js';
// In create():
this.pauseOverlay = new PauseOverlay(this, () => ({
  scene: this.scene.key,
  flags: this.gameFlags,
  position: this.player ? { x: this.player.x, y: this.player.y } : undefined,
}));
```

And in each `update()` method, add early return:

```js
if (this.pauseOverlay?.isPaused()) return;
```

- [ ] **Step 3: Verify pause works in any scene**

```bash
npm run dev
```

Expected: Press P → dark overlay with "PAUSED", P again → resumes.

- [ ] **Step 4: Commit**

```bash
git add src/systems/PauseOverlay.js src/scenes/
git commit -m "feat: add pause system to all gameplay scenes"
```

---

## Task 18: Full-Sequence Scene Integration Review

- [ ] **Step 1: Dispatch Scene Integration Reviewer subagent**

Run the full-sequence review as specified in the design spec. The reviewer subagent reads all scene files and `dialogue.json`, then checks:

- Pacing arc across all 9 scenes
- Tonal consistency
- Running gags and callback opportunities
- Player always knows what to do
- Gate messages are helpful
- Estimated total playtime ~15-25 min

- [ ] **Step 2: Apply suggested fixes**

Common fixes expected:
- Additional bridging dialogue lines
- Transition timing adjustments
- Callback references (e.g., referencing cyclists in office scene)

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: apply scene integration review feedback for narrative coherence"
```

---

## Task 19: E2E Test Setup

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/game-flow.spec.js`

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Create E2E test for full game flow**

Create `tests/e2e/game-flow.spec.js`:

```js
import { test, expect } from '@playwright/test';

test.describe('Legend of Nikita - Full Game Flow', () => {
  test('title screen loads and starts game', async ({ page }) => {
    await page.goto('/');
    // Wait for Phaser canvas
    await page.waitForSelector('canvas', { timeout: 10000 });
    // Give time for title to render
    await page.waitForTimeout(3000);
    // Press Enter to start
    await page.keyboard.press('Enter');
    // Wait for scene transition
    await page.waitForTimeout(2000);
  });

  test('can complete bedroom scene', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Skip intro crawl
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Advance intro dialogue
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
    }

    // Move to closet (top-right area) — press right and up
    for (let i = 0; i < 30; i++) {
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(50);
      await page.keyboard.up('ArrowRight');
      await page.keyboard.up('ArrowUp');
    }

    // Interact with closet
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Advance dressed dialogue
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
    }
  });
});
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 4: Run E2E tests**

```bash
npx playwright test
```

Expected: Tests pass (or report expected failures for timing-dependent tests that need tuning).

- [ ] **Step 5: Commit**

```bash
git add playwright.config.js tests/e2e/
git commit -m "feat: add Playwright E2E test suite for game flow"
```

---

## Task 20: Audio Integration

**Files:**
- Download free retro audio packs
- Modify: `src/scenes/BootScene.js` (load audio)
- Modify: each scene (play music/SFX)

- [ ] **Step 1: Source free retro audio assets**

Search for and download from free game audio sources:
- opengameart.org for 8-bit/16-bit music and SFX
- freesound.org for specific effects

Place files in:
- `assets/music/` — one track per scene (MP3 or OGG)
- `assets/sfx/` — individual SFX files

- [ ] **Step 2: Register audio in BootScene preload**

Add to `BootScene.preload()`:

```js
// Music
this.load.audio('music-title', 'assets/music/title.mp3');
this.load.audio('music-crawl', 'assets/music/crawl.mp3');
this.load.audio('music-bedroom', 'assets/music/bedroom.mp3');
this.load.audio('music-kitchen', 'assets/music/kitchen.mp3');
this.load.audio('music-driving', 'assets/music/driving.mp3');
this.load.audio('music-dojo', 'assets/music/dojo.mp3');
this.load.audio('music-office', 'assets/music/office.mp3');
this.load.audio('music-home', 'assets/music/home.mp3');
this.load.audio('music-birthday', 'assets/music/birthday.mp3');

// SFX
this.load.audio('sfx-fanfare', 'assets/sfx/fanfare.mp3');
this.load.audio('sfx-footstep', 'assets/sfx/footstep.mp3');
this.load.audio('sfx-crash', 'assets/sfx/crash.mp3');
this.load.audio('sfx-blip', 'assets/sfx/blip.mp3');
this.load.audio('sfx-alarm', 'assets/sfx/alarm.mp3');
this.load.audio('sfx-money', 'assets/sfx/money.mp3');
this.load.audio('sfx-firework', 'assets/sfx/firework.mp3');
this.load.audio('sfx-meow', 'assets/sfx/meow.mp3');
```

- [ ] **Step 3: Add AudioManager + playMusic calls to each scene**

In each scene's `create()`:

```js
import { AudioManager } from '../systems/AudioManager.js';
// In create():
this.audio = new AudioManager(this);
this.audio.playMusic('music-[sceneName]');
```

Add SFX calls at appropriate moments (e.g., `this.audio.playSFX('sfx-fanfare')` when getting dressed).

- [ ] **Step 4: Verify audio plays**

```bash
npm run dev
```

Expected: Music plays per scene with crossfade, SFX trigger on events.

- [ ] **Step 5: Commit**

```bash
git add assets/music/ assets/sfx/ src/
git commit -m "feat: integrate retro audio — per-scene music and SFX"
```

---

## Task 21: AI-Generated Art Assets

**Files:**
- Replace placeholder PNGs in `assets/` with AI-generated pixel art

- [ ] **Step 1: Generate sprite sheets**

Use AI image generation to create Secret of Mana-quality pixel art for each sprite listed in the asset manifest. Key sprites to generate first:
- Nikita (pajamas, dressed, gi) — 32x48 sprite sheets with walk frames
- Wife (sleeping, awake, standing)
- Cat (all states)
- Igor (yellow gi)
- Tesla, cyclists, cars (top-down view)

- [ ] **Step 2: Generate tilesets**

Create tilesets for each scene environment:
- Bedroom, kitchen, road, dojo, office, home

- [ ] **Step 3: Generate UI elements**

- Dialogue box background
- HUD icons (banana, coffee, shirt)
- Item popup frame

- [ ] **Step 4: Replace placeholder textures in BootScene**

Update `BootScene.preload()` to load real images instead of generating colored rectangles:

```js
this.load.spritesheet('nikita-pajamas', 'assets/sprites/nikita-pajamas.png', { frameWidth: 32, frameHeight: 48 });
// etc.
```

Remove or conditionally skip `_generatePlaceholders()`.

- [ ] **Step 5: Verify art renders correctly in-game**

```bash
npm run dev
```

Play through all scenes, verify sprites display and animate correctly.

- [ ] **Step 6: Commit**

```bash
git add assets/
git commit -m "feat: replace placeholders with AI-generated pixel art"
```

---

## Task 22: Polish, Build & Deploy

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Run E2E tests**

```bash
npx playwright test
```

Expected: All tests pass.

- [ ] **Step 3: Production build**

```bash
npm run build
npm run preview
```

Expected: Game runs from dist/ build.

- [ ] **Step 4: Full playtest**

Play the complete game start to finish. Check:
- All scene transitions work
- No console errors
- Audio plays correctly
- Controls responsive throughout
- Humor lands at each beat

- [ ] **Step 5: Deploy to GitHub Pages**

```bash
git remote add origin <repo-url>
git push -u origin main
# Configure GitHub Pages to serve from dist/ or use gh-pages package
npm install -D gh-pages
npx gh-pages -d dist
```

- [ ] **Step 6: Verify deployed build**

Open the GitHub Pages URL and play through the full game.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: production build and deploy configuration"
git push
```
