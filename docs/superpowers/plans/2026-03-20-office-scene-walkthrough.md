# OfficeScene Walkthrough Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the OfficeScene from a static dialogue scene into a walkable scene where Nikita enters from a door on the right, gets greeted by a bot, walks past rows of coding coworkers, and sits at his empty desk to begin the existing work sequence.

**Architecture:** Rewrite `create()` and `update()` to use MovementController + CharacterAnimator (same pattern as KitchenScene). Keep all existing `_nextStep()`, terminal, panic, and money rain methods unchanged. Add a greeting bot auto-cutscene triggered by proximity.

**Tech Stack:** Phaser 3, existing game systems (MovementController, CharacterAnimator, InputManager, DialogueSystem)

---

### Task 1: Add greeting dialogue to dialogue.json

**Files:**
- Modify: `src/data/dialogue.json:124-127` (office section)

- [ ] **Step 1: Add office.greeting lines**

In `src/data/dialogue.json`, add a `"greeting"` array inside the `"office"` object, right after the opening `"office": {` line (before `"intro"`):

```json
"greeting": [
  { "speaker": "GreetBot", "text": "Welcome to Canary HQ!", "style": { "color": "#00cc88" } },
  { "speaker": "GreetBot", "text": "Your desk is right over there. Have a productive day!", "style": { "color": "#00cc88" } }
],
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "require('./src/data/dialogue.json'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/data/dialogue.json
git commit -m "feat(office): add greeting bot dialogue"
```

---

### Task 2: Rewrite OfficeScene create() — room, door, desks, player

**Files:**
- Modify: `src/scenes/OfficeScene.js:1-141` (imports + create method)

This task replaces the entire `create()` method and imports. The existing private methods (`_nextStep`, `_nextRecoveryStage`, `_showSlack`, `_showTerminal`, `_typeCommand`, `_appendTerminal`, `_showProgress`, `_startPanic`, `_moneyRain`) stay **exactly as they are**.

- [ ] **Step 1: Update imports**

Replace lines 1-9 with:

```javascript
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
```

(Added: `InputManager`, `MovementController`, `CharacterAnimator`)

- [ ] **Step 2: Rewrite create() — systems init + room rendering**

Replace the entire `create()` method (lines 20-141) with the new implementation. The method is broken into logical sections below.

**Systems initialization** (same pattern as KitchenScene):

```javascript
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
```

**Room structure** — full-width office, no boxed room. Carpet floor + ceiling with fluorescent lights:

```javascript
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
```

- [ ] **Step 3: Add door on right wall**

```javascript
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
```

- [ ] **Step 4: Add two rows of desks with code monkeys**

```javascript
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
```

- [ ] **Step 5: Add Nikita's highlighted empty desk at far left**

```javascript
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
```

- [ ] **Step 6: Add greeting bot sprite**

```javascript
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
```

- [ ] **Step 7: Add player sprite with movement**

```javascript
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
```

- [ ] **Step 8: Add state, input handlers, save, pause**

```javascript
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
  this.terminalText = this.add.text(width / 2 - 270, height / 2 - 150, '', {
    fontSize: '16px', color: '#00ff88', fontFamily: 'monospace', lineSpacing: 8,
    wordWrap: { width: 540 },
  }).setDepth(501).setVisible(false);

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
```

- [ ] **Step 9: Verify scene loads**

Run dev server, open `http://localhost:5173/?scene=OfficeScene`.
Expected: Scene loads with carpet floor, ceiling lights, door on right, two rows of desks with bobbing NPCs, greeting bot hovering, player sprite near door, objective banner. No console errors.

- [ ] **Step 10: Commit**

```bash
git add src/scenes/OfficeScene.js
git commit -m "feat(office): rewrite create() with walkable room, desks, door, player"
```

---

### Task 3: Rewrite update() — movement, bot cutscene, desk interaction

**Files:**
- Modify: `src/scenes/OfficeScene.js` (update method + new private methods)

- [ ] **Step 1: Replace the update() method**

Replace the existing `update()` method (which only checked pause) with:

```javascript
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
```

- [ ] **Step 2: Add _triggerBotGreeting() method**

Add this method right before `_nextStep()`:

```javascript
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
```

- [ ] **Step 3: Add _sitAtDesk() method**

Add this method right after `_triggerBotGreeting()`:

```javascript
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
```

- [ ] **Step 4: Add _createSpaceIndicator() method**

Add this method (copied from KitchenScene pattern) if not already present:

```javascript
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
```

- [ ] **Step 5: Verify full flow**

Open `http://localhost:5173/?scene=OfficeScene`:
1. Nikita spawns near door on right — can move with WASD/arrows
2. Walk left — bot auto-cutscene triggers (~80px proximity), greeting dialogue plays
3. After dialogue, bot moves aside, objective updates to "Sit at your desk"
4. Continue walking left to highlighted desk
5. SPACE indicator appears near desk
6. Press SPACE — Nikita sits, existing sequence begins (intro → Slack → terminal → etc.)
7. Full sequence plays through money rain → DrivingScene transition

- [ ] **Step 6: Commit**

```bash
git add src/scenes/OfficeScene.js
git commit -m "feat(office): add movement, bot greeting cutscene, desk interaction"
```

---

### Task 4: Clean up worktree and merge

**Files:** None (git operations only)

- [ ] **Step 1: Merge worktree changes to master**

Per the parallel-scenes skill workflow:

```bash
cd /Users/igor/projects/fun/legend-of-nikita-office
git merge master --no-edit
git add -A && git commit -m "feat(office): walkthrough scene with entry, bot greeting, desk seating"
git checkout master && git merge scene/office --no-edit
```

- [ ] **Step 2: Clean up worktree**

```bash
git worktree remove ../legend-of-nikita-office
git branch -d scene/office
```

- [ ] **Step 3: Final verification on master**

Open `http://localhost:5173/?scene=OfficeScene` and run through the full flow one more time on master.
