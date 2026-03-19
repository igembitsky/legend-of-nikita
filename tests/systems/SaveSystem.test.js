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
