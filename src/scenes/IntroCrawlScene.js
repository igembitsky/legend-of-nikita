import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager.js';
import { ProceduralAudio } from '../systems/ProceduralAudio.js';
import { AtmosphereManager } from '../systems/AtmosphereManager.js';
import dialogueData from '../data/dialogue.json';

export class IntroCrawlScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroCrawlScene' });
  }

  create() {
    this.transition = new TransitionManager(this);
    this.transition.fadeIn(500);
    AtmosphereManager.apply(this, 'crawl');
    this.audio = new ProceduralAudio(this);
    this.events.on('shutdown', () => { this.audio?.destroy(); });
    this.audio.playMusic('crawl');

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
    this.audio.stopMusic();
    this.transition.fadeToScene('BedroomScene');
  }
}
