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
