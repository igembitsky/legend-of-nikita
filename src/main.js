import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { IntroCrawlScene } from './scenes/IntroCrawlScene.js';
import { BedroomScene } from './scenes/BedroomScene.js';
import { KitchenScene } from './scenes/KitchenScene.js';
import { DrivingScene } from './scenes/DrivingScene.js';
import { DojoScene } from './scenes/DojoScene.js';
import { OfficeScene } from './scenes/OfficeScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { BirthdayScene } from './scenes/BirthdayScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  parent: document.body,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    IntroCrawlScene,
    BedroomScene,
    KitchenScene,
    DrivingScene,
    DojoScene,
    OfficeScene,
    HomeScene,
    BirthdayScene,
  ],
};

const game = new Phaser.Game(config);
export default game;
