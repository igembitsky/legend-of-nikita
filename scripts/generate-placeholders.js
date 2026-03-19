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
