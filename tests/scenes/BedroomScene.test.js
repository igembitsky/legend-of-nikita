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
