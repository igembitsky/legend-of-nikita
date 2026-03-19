import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DialogueSystem } from '../../src/systems/DialogueSystem.js';

describe('DialogueSystem', () => {
  let dialogue;
  let mockScene;

  beforeEach(() => {
    mockScene = {
      add: {
        rectangle: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setWordWrapWidth: vi.fn().mockReturnThis(),
          setText: vi.fn(),
          setColor: vi.fn(),
          destroy: vi.fn(),
          text: '',
        })),
        sprite: vi.fn(() => ({
          setDisplaySize: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
        // nineslice intentionally undefined — forces fallback to rectangle
      },
      textures: { exists: vi.fn(() => false) },
      tweens: { add: vi.fn() },
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
    dialogue.advance(); // completes typing
    dialogue.advance(); // advances to next line
    expect(dialogue.currentLine()).toBe(1);
  });

  it('completes sequence after last line', () => {
    const lines = [{ speaker: 'Nikita', text: 'Only line' }];
    dialogue.startSequence(lines);
    dialogue.advance(); // completes typing
    dialogue.advance(); // advances past last line
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
    dialogue.advance(); // completes typing
    dialogue.advance(); // advances past last line → triggers onComplete
    expect(onComplete).toHaveBeenCalled();
  });
});
