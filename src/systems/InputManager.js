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
