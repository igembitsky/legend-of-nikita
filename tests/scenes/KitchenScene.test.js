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
