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

    // Phase 1: Dramatic title reveal
    this.phase = 'title';
    this.crawlComplete = false;

    // "Episode 31" title — starts invisible, fades in with dramatic hit
    this.titleText = this.add.text(width / 2, height / 2 - 20, 'Episode 31', {
      fontSize: '48px',
      color: '#4eb8ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.subtitleText = this.add.text(width / 2, height / 2 + 30, 'A Day in the Life', {
      fontSize: '24px',
      color: '#4eb8ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Play dramatic hit and fade in title
    this.audio.playCrawlHit();

    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      delay: 600,
      duration: 800,
      ease: 'Power2',
    });

    // After 3s, fade out title and start crawl
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [this.titleText, this.subtitleText],
        alpha: 0,
        scale: 0.3,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          this._startCrawl();
        }
      });
    });

    // Skip
    this.input.keyboard.on('keydown-SPACE', () => this._endCrawl());
    this.input.keyboard.on('keydown-ENTER', () => this._endCrawl());
  }

  _startCrawl() {
    this.phase = 'crawl';
    this.audio.playMusic('crawl');

    const { width, height } = this.cameras.main;
    const crawlText = dialogueData.introCrawl.text;
    const lines = crawlText.split('\n');

    // Skip the first two lines (Episode 31 / A Day in the Life) — already shown as title
    const crawlLines = lines.slice(2);

    this.crawlLines = [];
    // Start well below viewport for the "receding into distance" feel
    const startY = height + 200;
    const lineHeight = 40;

    crawlLines.forEach((line, i) => {
      const text = this.add.text(width / 2, startY + i * lineHeight, line, {
        fontSize: '20px',
        color: '#ffcc00',
        fontFamily: 'monospace',
        fontStyle: 'normal',
      }).setOrigin(0.5).setAlpha(0);

      this.crawlLines.push(text);
    });

    this.crawlSpeed = 0.63; // ~10% slower than original 0.7
    this.lastLineIndex = crawlLines.length - 1;
  }

  update() {
    // Stars always drift
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.cameras.main.height) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.cameras.main.width);
      }
    }

    if (this.phase !== 'crawl' || this.crawlComplete) return;

    const height = this.cameras.main.height;

    // Scroll all lines up with Star Wars perspective
    for (const line of this.crawlLines) {
      line.y -= this.crawlSpeed;

      // Star Wars perspective: text is large at bottom, shrinks toward top vanishing point
      // Map y position to a 0-1 range (0 = top, 1 = bottom)
      const t = Phaser.Math.Clamp((line.y - 0) / height, 0, 1);
      // Stronger perspective: scale from 0.1 at top to 1.0 at bottom
      const scale = 0.1 + t * 0.9;
      line.setScale(scale);

      // Fade: invisible below viewport, fade in as it enters, fade out near top
      let alpha;
      if (line.y > height - 30) {
        // Fade in at bottom edge
        alpha = Math.max(0, (height - line.y + 30) / 60);
      } else if (line.y < 60) {
        // Fade out at top
        alpha = Math.max(0, line.y / 60);
      } else {
        alpha = 1;
      }
      line.setAlpha(alpha);
    }

    // Check if last line has scrolled past top
    const lastLine = this.crawlLines[this.lastLineIndex];
    if (lastLine && lastLine.y < -50) {
      this._endCrawl();
    }
  }

  _endCrawl() {
    if (this.crawlComplete) return;
    this.crawlComplete = true;
    this.audio.stopMusic();
    this.transition.fadeToScene('ControlsScene');
  }
}
