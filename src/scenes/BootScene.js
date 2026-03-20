import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const { width, height } = this.cameras.main;
    const barWidth = 400;
    const barHeight = 30;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    const bgBar = this.add.rectangle(width / 2, barY, barWidth, barHeight, 0x333333).setOrigin(0.5);
    const progressBar = this.add.rectangle(barX, barY - barHeight / 2, 0, barHeight, 0x4488ff).setOrigin(0, 0);
    const loadingText = this.add.text(width / 2, barY - 40, 'Loading...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = barWidth * value;
    });

    this.load.on('complete', () => {
      bgBar.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // Photo placeholder
    this.load.image('photo', 'photo-placeholder.png');

    // Load real assets here as they become available
    // this.load.image('nikita-pajamas', 'assets/sprites/nikita-pajamas.png');
    // etc.
  }

  create() {
    // Generate pixel art textures for development
    this._generateSprites();
    this._generateUITextures();

    this.scene.start('TitleScene');
  }

  _generateUITextures() {
    // 'ui-dialogue-frame' (48x48) — nine-slice source for dialogue box border
    if (!this.textures.exists('ui-dialogue-frame')) {
      const g = this.make.graphics({ add: false });
      // Interior dark navy gradient (4 horizontal bands)
      g.fillStyle(0x0c0c28); g.fillRect(4, 4, 40, 10);
      g.fillStyle(0x0f0f32); g.fillRect(4, 14, 40, 10);
      g.fillStyle(0x121240); g.fillRect(4, 24, 40, 10);
      g.fillStyle(0x161640); g.fillRect(4, 34, 40, 10);
      // 4px outer border (dark blue)
      g.fillStyle(0x1a1a55);
      g.fillRect(0, 0, 48, 4);   // top
      g.fillRect(0, 44, 48, 4);  // bottom
      g.fillRect(0, 0, 4, 48);   // left
      g.fillRect(44, 0, 4, 48);  // right
      // 2px inner highlight line (lighter blue)
      g.fillStyle(0x3355aa);
      g.fillRect(4, 4, 40, 2);   // top inner
      g.fillRect(4, 42, 40, 2);  // bottom inner
      g.fillRect(4, 4, 2, 40);   // left inner
      g.fillRect(42, 4, 2, 40);  // right inner
      // 6x6 gold corner ornaments
      g.fillStyle(0xccaa44);
      g.fillRect(0, 0, 6, 6);    // top-left
      g.fillRect(42, 0, 6, 6);   // top-right
      g.fillRect(0, 42, 6, 6);   // bottom-left
      g.fillRect(42, 42, 6, 6);  // bottom-right
      // 2px gold accent lines from corners (8px long)
      g.fillRect(6, 2, 8, 2);    // top-left horizontal
      g.fillRect(2, 6, 2, 8);    // top-left vertical
      g.fillRect(34, 2, 8, 2);   // top-right horizontal
      g.fillRect(44, 6, 2, 8);   // top-right vertical
      g.fillRect(6, 44, 8, 2);   // bottom-left horizontal
      g.fillRect(2, 34, 2, 8);   // bottom-left vertical
      g.fillRect(34, 44, 8, 2);  // bottom-right horizontal
      g.fillRect(44, 34, 2, 8);  // bottom-right vertical
      g.generateTexture('ui-dialogue-frame', 48, 48);
      g.destroy();
    }

    // 'ui-speaker-tab' (32x20)
    if (!this.textures.exists('ui-speaker-tab')) {
      const g = this.make.graphics({ add: false });
      // Dark fill
      g.fillStyle(0x0c0c28); g.fillRect(2, 2, 28, 16);
      // Blue border
      g.fillStyle(0x1a1a55);
      g.fillRect(0, 0, 32, 2);
      g.fillRect(0, 18, 32, 2);
      g.fillRect(0, 0, 2, 20);
      g.fillRect(30, 0, 2, 20);
      // Gold corner accents
      g.fillStyle(0xccaa44);
      g.fillRect(0, 0, 4, 4);
      g.fillRect(28, 0, 4, 4);
      g.fillRect(0, 16, 4, 4);
      g.fillRect(28, 16, 4, 4);
      g.generateTexture('ui-speaker-tab', 32, 20);
      g.destroy();
    }

    // 'ui-portrait-frame' (72x72)
    if (!this.textures.exists('ui-portrait-frame')) {
      const g = this.make.graphics({ add: false });
      // Dark interior fill
      g.fillStyle(0x0a0a20); g.fillRect(4, 4, 64, 64);
      // 4px outer border (blue)
      g.fillStyle(0x3355aa);
      g.fillRect(0, 0, 72, 4);
      g.fillRect(0, 68, 72, 4);
      g.fillRect(0, 0, 4, 72);
      g.fillRect(68, 0, 4, 72);
      // Gold inner highlight lines
      g.fillStyle(0xccaa44);
      g.fillRect(4, 4, 64, 2);
      g.fillRect(4, 66, 64, 2);
      g.fillRect(4, 4, 2, 64);
      g.fillRect(66, 4, 2, 64);
      g.generateTexture('ui-portrait-frame', 72, 72);
      g.destroy();
    }
  }

  _drawCharacter(key, drawFn, width, height) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ add: false });
    drawFn(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  _generateSprites() {
    // Characters — generate directional walk sheets for playable characters
    this._generateWalkSheet('nikita-underwear', this._nikitaOutfit('underwear'));
    this._generateWalkSheet('nikita-pajamas', this._nikitaOutfit('pajamas'));
    this._generateWalkSheet('nikita-dressed', this._nikitaOutfit('dressed'));
    this._generateWalkSheet('nikita-gi', this._nikitaOutfit('gi'));

    // Also keep original static textures for portraits/dialogue
    this._drawCharacter('nikita-underwear', (g) => this._drawNikitaUnderwear(g), 32, 48);
    this._drawCharacter('nikita-pajamas', (g) => this._drawNikitaPajamas(g), 32, 48);
    this._drawCharacter('nikita-dressed', (g) => this._drawNikitaDressed(g), 32, 48);
    this._drawCharacter('nikita-gi', (g) => this._drawNikitaGi(g), 32, 48);

    // Wife
    this._drawCharacter('wife-sleeping', (g) => this._drawWifeSleeping(g), 64, 32);
    this._drawCharacter('wife-awake', (g) => this._drawWifeAwake(g), 32, 48);
    this._drawCharacter('wife-standing', (g) => this._drawWifeStanding(g), 32, 48);

    // Cat
    this._drawCharacter('cat', (g) => this._drawCat(g), 24, 20);

    // Igor
    this._drawCharacter('igor', (g) => this._drawIgor(g), 32, 48);

    // Sensei
    this._drawCharacter('sensei', (g) => this._drawSensei(g), 32, 48);

    // Vehicles
    this._drawCharacter('tesla', (g) => this._drawTesla(g), 32, 56);
    this._drawCharacter('cyclist', (g) => this._drawCyclist(g), 20, 36);
    this._drawCharacter('car-1', (g) => this._drawCar1(g), 32, 56);
    this._drawCharacter('car-2', (g) => this._drawCar2(g), 32, 56);

    // Office
    this._drawCharacter('office-npc', (g) => this._drawOfficeNpc(g), 28, 40);
    this._drawCharacter('office-robot', (g) => this._drawOfficeRobot(g), 28, 40);
    this._drawCharacter('dojo-pair', (g) => this._drawDojoPair(g), 48, 48);

    // Props
    this._drawCharacter('closet', (g) => this._drawCloset(g), 48, 64);
    this._drawCharacter('door', (g) => this._drawDoor(g), 40, 48);
    this._drawCharacter('nightstand', (g) => this._drawNightstand(g), 32, 40);
    this._drawCharacter('plant', (g) => this._drawPlant(g), 24, 40);
    this._drawCharacter('fridge', (g) => this._drawFridge(g), 48, 64);
    this._drawCharacter('coffee-machine', (g) => this._drawCoffeeMachine(g), 32, 40);
    this._drawCharacter('food-bowl', (g) => this._drawFoodBowl(g), 24, 16);
    this._drawCharacter('banana', (g) => this._drawBanana(g), 24, 24);
    this._drawCharacter('coffee-cup', (g) => this._drawCoffeeCup(g), 20, 24);
    this._drawCharacter('money', (g) => this._drawMoney(g), 16, 16);
    this._drawCharacter('bed', (g) => this._drawBed(g), 128, 80);
  }

  // ─── DIRECTIONAL WALK SHEET SYSTEM ────────────────────────────────────────

  _nikitaOutfit(variant) {
    const base = {
      hair: 0x3a2010, skin: 0xf0c090, earSkin: 0xe0b080,
      eyeColor: 0x333355, mouthColor: 0xcc7755,
    };
    switch (variant) {
      case 'underwear': return {
        ...base, sleepyEyes: true, mouthW: 4, mouthH: 3,
        shirtColor: null, // bare chest
        sleeveColor: null,
        pantsColor: 0x333355, waistColor: 0x444466,
        legStartY: 37, legH: 8, seamColor: null,
        shoeColor: null, footSkin: true,
        drawFrontDetails: (g) => {
          // Chest shadow
          g.fillStyle(0xe0b080);
          g.fillRect(6, 30, 20, 2);
        },
      };
      case 'pajamas': return {
        ...base,
        shirtColor: 0x6688bb, sleeveColor: 0x6688bb,
        pantsColor: 0x4466aa, waistColor: 0x5577bb, seamColor: 0x3355aa,
        legStartY: 37, legH: 11,
        shoeColor: 0xeeeeff, shoeH: 2,
        drawFrontDetails: (g) => {
          // Button line
          g.fillStyle(0x8899cc);
          g.fillRect(15, 24, 2, 12);
          // Collar
          g.fillStyle(0x8899cc);
          g.fillRect(10, 23, 5, 3);
          g.fillRect(17, 23, 5, 3);
        },
        drawCuffs: (g) => {
          g.fillStyle(0xf0c090);
          g.fillRect(1, 33, 4, 4);
          g.fillRect(27, 33, 4, 4);
        },
      };
      case 'dressed': return {
        ...base,
        shirtColor: 0x2266cc, sleeveColor: 0x2266cc,
        pantsColor: 0x333344, waistColor: 0x222233, seamColor: 0x1a1a2a,
        legStartY: 37, legH: 11,
        shoeColor: 0x1a1a1a, shoeH: 4, shoeHighlight: 0x333333,
        drawFrontDetails: (g) => {
          // Button line + buttons
          g.fillStyle(0xffffff);
          g.fillRect(15, 24, 2, 12);
          g.fillStyle(0xdddddd);
          g.fillRect(15, 26, 2, 2);
          g.fillRect(15, 30, 2, 2);
          g.fillRect(15, 34, 2, 2);
          // Collar
          g.fillStyle(0x1a55bb);
          g.fillRect(10, 23, 5, 4);
          g.fillRect(17, 23, 5, 4);
        },
        drawCuffs: (g) => {
          g.fillStyle(0xffffff);
          g.fillRect(0, 33, 5, 2);
          g.fillRect(27, 33, 5, 2);
          // Hands
          g.fillStyle(0xf0c090);
          g.fillRect(1, 34, 4, 3);
          g.fillRect(27, 34, 4, 3);
        },
      };
      case 'gi': return {
        ...base,
        shirtColor: 0xeeeeee, sleeveColor: 0xeeeeee,
        pantsColor: 0xf0f0f0, waistColor: null, seamColor: 0xdddddd,
        legStartY: 39, legH: 9,
        shoeColor: null, footSkin: true,
        drawFrontDetails: (g) => {
          // Lapels
          g.fillStyle(0xdddddd);
          g.fillRect(10, 23, 5, 8);
          g.fillRect(17, 23, 5, 8);
          // Center overlap
          g.fillStyle(0xffffff);
          g.fillRect(14, 24, 4, 12);
          // Blue belt
          g.fillStyle(0x2244aa);
          g.fillRect(4, 35, 24, 4);
          g.fillStyle(0x1133aa);
          g.fillRect(13, 35, 6, 4);
          g.fillStyle(0x2244aa);
          g.fillRect(9, 37, 4, 2);
          g.fillRect(19, 37, 4, 2);
        },
        drawEyebrows: true,
      };
      default: return base;
    }
  }

  /**
   * Generate individual walk frame textures and register Phaser animations.
   * Creates: {key}-d0/d1/d2 (front), {key}-u0/u1/u2 (back), {key}-s0/s1/s2 (side)
   * Left uses side frames with flipX; right uses side frames without flip.
   */
  _generateWalkSheet(key, outfit) {
    const W = 32, H = 48;

    for (const facing of ['down', 'up', 'side']) {
      for (let frame = 0; frame < 3; frame++) {
        const texKey = `${key}-${facing[0]}${frame}`;
        if (this.textures.exists(texKey)) continue;

        const g = this.make.graphics({ add: false });
        this._drawDirectionalCharacter(g, outfit, facing, frame);
        g.generateTexture(texKey, W, H);
        g.destroy();
      }
    }

    // Register animations
    // Walk down (front): stand, left-step, stand, right-step
    this.anims.create({
      key: `${key}-walk-down`,
      frames: [
        { key: `${key}-d0` }, { key: `${key}-d1` },
        { key: `${key}-d0` }, { key: `${key}-d2` },
      ],
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: `${key}-idle-down`,
      frames: [{ key: `${key}-d0` }],
      frameRate: 1, repeat: 0,
    });

    // Walk up (back)
    this.anims.create({
      key: `${key}-walk-up`,
      frames: [
        { key: `${key}-u0` }, { key: `${key}-u1` },
        { key: `${key}-u0` }, { key: `${key}-u2` },
      ],
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: `${key}-idle-up`,
      frames: [{ key: `${key}-u0` }],
      frameRate: 1, repeat: 0,
    });

    // Left/right use side-facing frames (left = flipX, right = no flip)
    this.anims.create({
      key: `${key}-walk-left`,
      frames: [
        { key: `${key}-s0` }, { key: `${key}-s1` },
        { key: `${key}-s0` }, { key: `${key}-s2` },
      ],
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: `${key}-idle-left`,
      frames: [{ key: `${key}-s0` }],
      frameRate: 1, repeat: 0,
    });
    this.anims.create({
      key: `${key}-walk-right`,
      frames: [
        { key: `${key}-s0` }, { key: `${key}-s1` },
        { key: `${key}-s0` }, { key: `${key}-s2` },
      ],
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: `${key}-idle-right`,
      frames: [{ key: `${key}-s0` }],
      frameRate: 1, repeat: 0,
    });
  }

  _drawDirectionalCharacter(g, o, facing, walkFrame) {
    if (facing === 'side') {
      this._drawSideCharacter(g, o, walkFrame);
      return;
    }

    const isBack = facing === 'up';

    // === HAIR ===
    g.fillStyle(o.hair);
    if (isBack) {
      // Back of head — hair covers everything
      g.fillRect(6, 0, 20, 18);
      // Ears poke out
      g.fillStyle(o.earSkin || o.skin);
      g.fillRect(5, 10, 3, 5);
      g.fillRect(24, 10, 3, 5);
    } else {
      // Front-facing head
      g.fillRect(8, 0, 16, 8);
      g.fillRect(6, 4, 20, 6);
      // Face
      g.fillStyle(o.skin);
      g.fillRect(8, 8, 16, 12);
      // Ears
      if (o.earSkin) {
        g.fillStyle(o.earSkin);
        g.fillRect(6, 10, 3, 6);
        g.fillRect(23, 10, 3, 6);
      }
      // Eyes
      g.fillStyle(o.eyeColor);
      g.fillRect(11, 12, 3, 3);
      g.fillRect(18, 12, 3, 3);
      // Eye highlights
      g.fillStyle(0xffffff);
      g.fillRect(12, 12, 1, 1);
      g.fillRect(19, 12, 1, 1);
      // Sleepy eyes (half closed)
      if (o.sleepyEyes) {
        g.fillStyle(o.skin);
        g.fillRect(11, 12, 3, 1);
        g.fillRect(18, 12, 3, 1);
      }
      // Eyebrows
      if (o.drawEyebrows) {
        g.fillStyle(o.hair);
        g.fillRect(10, 10, 5, 2);
        g.fillRect(17, 10, 5, 2);
      }
      // Mouth
      g.fillStyle(o.mouthColor);
      g.fillRect(13, 17, o.mouthW || 6, o.mouthH || 2);
    }

    // === NECK ===
    g.fillStyle(o.skin);
    g.fillRect(13, 20, 6, 3);

    // === TORSO ===
    if (o.shirtColor) {
      g.fillStyle(o.shirtColor);
      g.fillRect(4, 23, 24, 14);
      if (!isBack && o.drawFrontDetails) o.drawFrontDetails(g);
    } else {
      // Bare torso
      g.fillStyle(o.skin);
      g.fillRect(6, 23, 20, 14);
      if (!isBack && o.drawFrontDetails) o.drawFrontDetails(g);
    }

    // === ARMS ===
    const armColor = o.sleeveColor || o.shirtColor || o.skin;
    g.fillStyle(armColor);
    g.fillRect(0, 24, 5, 10);
    g.fillRect(27, 24, 5, 10);
    // Arm swing for walk frames
    if (walkFrame === 1) {
      g.fillStyle(armColor);
      g.fillRect(0, 22, 5, 10);
      g.fillRect(27, 26, 5, 10);
    } else if (walkFrame === 2) {
      g.fillStyle(armColor);
      g.fillRect(0, 26, 5, 10);
      g.fillRect(27, 22, 5, 10);
    }
    if (o.drawCuffs && !isBack) o.drawCuffs(g);

    // === LEGS (offset by walk frame) ===
    const legY = o.legStartY || 37;
    const legH = o.legH || 11;
    const leftOff = walkFrame === 1 ? -2 : walkFrame === 2 ? 2 : 0;
    const rightOff = walkFrame === 1 ? 2 : walkFrame === 2 ? -2 : 0;

    if (o.waistColor) {
      g.fillStyle(o.waistColor);
      g.fillRect(6, legY, 20, 3);
    }

    g.fillStyle(o.pantsColor);
    g.fillRect(6, legY + leftOff, 8, legH);
    g.fillRect(18, legY + rightOff, 8, legH);

    if (o.seamColor) {
      g.fillStyle(o.seamColor);
      g.fillRect(14, legY + 3, 4, legH - 3);
    }

    // === FEET/SHOES ===
    const shoeY = legY + legH - 2;
    if (o.shoeColor) {
      const sh = o.shoeH || 4;
      g.fillStyle(o.shoeColor);
      g.fillRect(5, shoeY + leftOff, 10, sh);
      g.fillRect(17, shoeY + rightOff, 10, sh);
      if (o.shoeHighlight) {
        g.fillStyle(o.shoeHighlight);
        g.fillRect(5, shoeY + leftOff, 10, 1);
        g.fillRect(17, shoeY + rightOff, 10, 1);
      }
    } else if (o.footSkin) {
      g.fillStyle(o.skin);
      g.fillRect(6, shoeY + leftOff, 8, 2);
      g.fillRect(18, shoeY + rightOff, 8, 2);
    }
  }

  /**
   * Draw character from the side (facing right). FlipX gives left-facing.
   * Narrower body profile, one eye, hair swept to one side.
   */
  _drawSideCharacter(g, o, walkFrame) {
    // Side-facing character is drawn facing RIGHT.
    // Center the narrower body in the 32px width.
    const cx = 16; // center of 32px

    // === HAIR (side profile — swept back) ===
    g.fillStyle(o.hair);
    g.fillRect(cx - 7, 0, 14, 8);   // top of head
    g.fillRect(cx - 9, 3, 14, 7);   // hair mass (swept left/back)

    // === FACE (side profile) ===
    g.fillStyle(o.skin);
    g.fillRect(cx - 5, 7, 12, 13);  // face (shifted right = facing right)

    // Ear (back side, partially visible)
    g.fillStyle(o.earSkin || o.skin);
    g.fillRect(cx - 7, 10, 3, 5);

    // One eye (on the right side of face)
    g.fillStyle(o.eyeColor);
    g.fillRect(cx + 2, 12, 3, 3);
    g.fillStyle(0xffffff);
    g.fillRect(cx + 3, 12, 1, 1);

    if (o.sleepyEyes) {
      g.fillStyle(o.skin);
      g.fillRect(cx + 2, 12, 3, 1);
    }
    if (o.drawEyebrows) {
      g.fillStyle(o.hair);
      g.fillRect(cx + 1, 10, 5, 2);
    }

    // Nose (small bump on right edge)
    g.fillStyle(o.skin);
    g.fillRect(cx + 6, 13, 2, 3);

    // Mouth
    g.fillStyle(o.mouthColor);
    g.fillRect(cx + 2, 17, 3, 2);

    // === NECK ===
    g.fillStyle(o.skin);
    g.fillRect(cx - 2, 20, 6, 3);

    // === TORSO (narrower from side) ===
    const torsoColor = o.shirtColor || o.skin;
    g.fillStyle(torsoColor);
    g.fillRect(cx - 8, 23, 18, 14);

    // === ARM (one visible, in front/back depending on walk frame) ===
    const armColor = o.sleeveColor || o.shirtColor || o.skin;
    if (walkFrame === 0) {
      // Arm at side
      g.fillStyle(armColor);
      g.fillRect(cx + 8, 24, 5, 10);
      // Hand
      g.fillStyle(o.skin);
      g.fillRect(cx + 9, 33, 4, 3);
    } else if (walkFrame === 1) {
      // Arm swung forward
      g.fillStyle(armColor);
      g.fillRect(cx + 8, 22, 5, 10);
      g.fillStyle(o.skin);
      g.fillRect(cx + 9, 31, 4, 3);
    } else {
      // Arm swung back
      g.fillStyle(armColor);
      g.fillRect(cx + 8, 26, 5, 10);
      g.fillStyle(o.skin);
      g.fillRect(cx + 9, 35, 4, 3);
    }

    // === LEGS (from side — one in front, one behind) ===
    const legY = o.legStartY || 37;
    const legH = o.legH || 11;
    // From the side, legs overlap; walk frame shifts them forward/back
    const frontLegOff = walkFrame === 1 ? -3 : walkFrame === 2 ? 3 : 0;
    const backLegOff = walkFrame === 1 ? 3 : walkFrame === 2 ? -3 : 0;

    // Waistband
    if (o.waistColor) {
      g.fillStyle(o.waistColor);
      g.fillRect(cx - 8, legY, 18, 3);
    }

    // Back leg (darker shade)
    g.fillStyle(o.pantsColor);
    g.fillRect(cx - 5 + backLegOff, legY, 10, legH);
    // Front leg
    g.fillRect(cx - 3 + frontLegOff, legY, 10, legH);

    // === FEET/SHOES ===
    const shoeY = legY + legH - 2;
    if (o.shoeColor) {
      const sh = o.shoeH || 4;
      g.fillStyle(o.shoeColor);
      g.fillRect(cx - 5 + backLegOff, shoeY, 10, sh);
      g.fillRect(cx - 3 + frontLegOff, shoeY, 10, sh);
      if (o.shoeHighlight) {
        g.fillStyle(o.shoeHighlight);
        g.fillRect(cx - 5 + backLegOff, shoeY, 10, 1);
        g.fillRect(cx - 3 + frontLegOff, shoeY, 10, 1);
      }
    } else if (o.footSkin) {
      g.fillStyle(o.skin);
      g.fillRect(cx - 4 + backLegOff, shoeY, 8, 2);
      g.fillRect(cx - 2 + frontLegOff, shoeY, 8, 2);
    }
  }

  // ─── CHARACTERS (original static sprites for portraits) ──────────────────

  _drawNikitaUnderwear(g) {
    // Hair
    g.fillStyle(0x3a2010);
    g.fillRect(8, 0, 16, 8);
    g.fillRect(6, 4, 20, 6);
    // Face
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 16, 12);
    // Eyes
    g.fillStyle(0x333355);
    g.fillRect(11, 12, 3, 3);
    g.fillRect(18, 12, 3, 3);
    g.fillStyle(0xffffff);
    g.fillRect(12, 12, 1, 1);
    g.fillRect(19, 12, 1, 1);
    // Sleepy eyes (half closed)
    g.fillStyle(0xf0c090);
    g.fillRect(11, 12, 3, 1);
    g.fillRect(18, 12, 3, 1);
    // Mouth (yawn)
    g.fillStyle(0xcc7755);
    g.fillRect(14, 17, 4, 3);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(13, 20, 6, 3);
    // Bare chest/torso (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(6, 23, 20, 14);
    // Chest shadow
    g.fillStyle(0xe0b080, 0.4);
    g.fillRect(6, 30, 20, 2);
    // Arms (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(2, 24, 4, 10);
    g.fillRect(26, 24, 4, 10);
    // Underwear (boxer shorts - dark)
    g.fillStyle(0x333355);
    g.fillRect(6, 37, 20, 8);
    // Waistband
    g.fillStyle(0x444466);
    g.fillRect(6, 36, 20, 2);
    // Legs (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 45, 6, 3);
    g.fillRect(18, 45, 6, 3);
  }

  _drawNikitaPajamas(g) {
    // Hair (dark brown)
    g.fillStyle(0x3a2010);
    g.fillRect(8, 0, 16, 8);
    g.fillRect(6, 4, 20, 6);
    // Face (skin tone)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xe0b080);
    g.fillRect(6, 10, 3, 6);
    g.fillRect(23, 10, 3, 6);
    // Eyes
    g.fillStyle(0x333355);
    g.fillRect(11, 12, 3, 3);
    g.fillRect(18, 12, 3, 3);
    // Eye highlights
    g.fillStyle(0xffffff);
    g.fillRect(12, 12, 1, 1);
    g.fillRect(19, 12, 1, 1);
    // Mouth (small smile)
    g.fillStyle(0xcc7755);
    g.fillRect(13, 17, 6, 2);
    g.fillStyle(0x333333);
    g.fillRect(13, 18, 2, 1);
    g.fillRect(17, 18, 2, 1);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(13, 20, 6, 3);
    // Pajama top (light blue)
    g.fillStyle(0x6688bb);
    g.fillRect(4, 23, 24, 14);
    // Pajama top button line
    g.fillStyle(0x8899cc);
    g.fillRect(15, 24, 2, 12);
    // Collar
    g.fillStyle(0x8899cc);
    g.fillRect(10, 23, 5, 3);
    g.fillRect(17, 23, 5, 3);
    // Arms
    g.fillStyle(0x6688bb);
    g.fillRect(0, 24, 5, 11);
    g.fillRect(27, 24, 5, 11);
    // Hands (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(1, 33, 4, 4);
    g.fillRect(27, 33, 4, 4);
    // Pajama pants (darker blue)
    g.fillStyle(0x4466aa);
    g.fillRect(6, 37, 8, 11);
    g.fillRect(18, 37, 8, 11);
    // Crotch/waistband
    g.fillStyle(0x5577bb);
    g.fillRect(6, 37, 20, 3);
    // Pant seam
    g.fillStyle(0x3355aa);
    g.fillRect(14, 40, 4, 8);
    // Feet (socks, white)
    g.fillStyle(0xeeeeff);
    g.fillRect(5, 46, 10, 2);
    g.fillRect(17, 46, 10, 2);
  }

  _drawNikitaDressed(g) {
    // Hair (dark brown)
    g.fillStyle(0x3a2010);
    g.fillRect(8, 0, 16, 8);
    g.fillRect(6, 4, 20, 6);
    // Face (skin tone)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xe0b080);
    g.fillRect(6, 10, 3, 6);
    g.fillRect(23, 10, 3, 6);
    // Eyes
    g.fillStyle(0x333355);
    g.fillRect(11, 12, 3, 3);
    g.fillRect(18, 12, 3, 3);
    // Eye highlights
    g.fillStyle(0xffffff);
    g.fillRect(12, 12, 1, 1);
    g.fillRect(19, 12, 1, 1);
    // Mouth (neutral)
    g.fillStyle(0xcc7755);
    g.fillRect(13, 17, 6, 2);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(13, 20, 6, 3);
    // Blue button-up shirt
    g.fillStyle(0x2266cc);
    g.fillRect(4, 23, 24, 14);
    // Shirt button line
    g.fillStyle(0xffffff);
    g.fillRect(15, 24, 2, 12);
    // Shirt buttons
    g.fillStyle(0xdddddd);
    g.fillRect(15, 26, 2, 2);
    g.fillRect(15, 30, 2, 2);
    g.fillRect(15, 34, 2, 2);
    // Collar (shirt)
    g.fillStyle(0x1a55bb);
    g.fillRect(10, 23, 5, 4);
    g.fillRect(17, 23, 5, 4);
    // Arms (shirt sleeves)
    g.fillStyle(0x2266cc);
    g.fillRect(0, 24, 5, 11);
    g.fillRect(27, 24, 5, 11);
    // Cuffs
    g.fillStyle(0xffffff);
    g.fillRect(0, 33, 5, 2);
    g.fillRect(27, 33, 5, 2);
    // Hands (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(1, 34, 4, 3);
    g.fillRect(27, 34, 4, 3);
    // Darker pants (charcoal)
    g.fillStyle(0x333344);
    g.fillRect(6, 37, 8, 11);
    g.fillRect(18, 37, 8, 11);
    // Waistband
    g.fillStyle(0x222233);
    g.fillRect(6, 37, 20, 3);
    // Pant seam
    g.fillStyle(0x1a1a2a);
    g.fillRect(14, 40, 4, 8);
    // Shoes (dark)
    g.fillStyle(0x1a1a1a);
    g.fillRect(5, 44, 10, 4);
    g.fillRect(17, 44, 10, 4);
    // Shoe highlights
    g.fillStyle(0x333333);
    g.fillRect(5, 44, 10, 1);
    g.fillRect(17, 44, 10, 1);
  }

  _drawNikitaGi(g) {
    // Hair (dark brown)
    g.fillStyle(0x3a2010);
    g.fillRect(8, 0, 16, 8);
    g.fillRect(6, 4, 20, 6);
    // Face (skin tone)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xe0b080);
    g.fillRect(6, 10, 3, 6);
    g.fillRect(23, 10, 3, 6);
    // Eyes (focused)
    g.fillStyle(0x333355);
    g.fillRect(11, 12, 3, 3);
    g.fillRect(18, 12, 3, 3);
    // Eyebrows (determined)
    g.fillStyle(0x3a2010);
    g.fillRect(10, 10, 5, 2);
    g.fillRect(17, 10, 5, 2);
    // Mouth (set/serious)
    g.fillStyle(0xcc7755);
    g.fillRect(13, 17, 6, 2);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(13, 20, 6, 3);
    // White gi top
    g.fillStyle(0xeeeeee);
    g.fillRect(4, 23, 24, 14);
    // Gi lapels (V shape)
    g.fillStyle(0xdddddd);
    g.fillRect(10, 23, 5, 8);
    g.fillRect(17, 23, 5, 8);
    // Gi center overlap
    g.fillStyle(0xffffff);
    g.fillRect(14, 24, 4, 12);
    // Blue belt
    g.fillStyle(0x2244aa);
    g.fillRect(4, 35, 24, 4);
    // Belt knot
    g.fillStyle(0x1133aa);
    g.fillRect(13, 35, 6, 4);
    // Belt tails
    g.fillStyle(0x2244aa);
    g.fillRect(9, 37, 4, 2);
    g.fillRect(19, 37, 4, 2);
    // Arms (gi sleeves)
    g.fillStyle(0xeeeeee);
    g.fillRect(0, 24, 5, 10);
    g.fillRect(27, 24, 5, 10);
    // Gi pants (white)
    g.fillStyle(0xf0f0f0);
    g.fillRect(6, 39, 8, 9);
    g.fillRect(18, 39, 8, 9);
    // Pants crease
    g.fillStyle(0xdddddd);
    g.fillRect(14, 39, 4, 9);
    // Bare feet
    g.fillStyle(0xf0c090);
    g.fillRect(6, 46, 8, 2);
    g.fillRect(18, 46, 8, 2);
  }

  _drawWifeSleeping(g) {
    // Bed frame (brown)
    g.fillStyle(0x8b6940);
    g.fillRect(0, 0, 64, 32);
    // Mattress
    g.fillStyle(0xf5f0e8);
    g.fillRect(2, 2, 60, 28);
    // Pillow (white/cream)
    g.fillStyle(0xfffbf0);
    g.fillRect(4, 3, 18, 14);
    // Pillow shadow
    g.fillStyle(0xeee8d8);
    g.fillRect(4, 14, 18, 3);
    g.fillRect(18, 3, 4, 14);
    // Hair on pillow (auburn/red-brown)
    g.fillStyle(0x8b3a1a);
    g.fillRect(6, 4, 14, 6);
    g.fillRect(5, 6, 4, 8);
    // Face (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 10, 7);
    // Closed eyes (sleeping)
    g.fillStyle(0x8b6060);
    g.fillRect(9, 10, 3, 1);
    g.fillRect(14, 10, 3, 1);
    // Eyelashes
    g.fillStyle(0x553333);
    g.fillRect(9, 11, 3, 1);
    g.fillRect(14, 11, 3, 1);
    // Mouth (relaxed, slightly open)
    g.fillStyle(0xcc8877);
    g.fillRect(11, 13, 4, 1);
    // Blue blanket
    g.fillStyle(0x4477bb);
    g.fillRect(4, 16, 56, 14);
    // Blanket folds/highlights
    g.fillStyle(0x5588cc);
    g.fillRect(4, 17, 56, 2);
    g.fillRect(20, 16, 8, 14);
    g.fillRect(40, 16, 8, 14);
    // Blanket shadow at edge
    g.fillStyle(0x3366aa);
    g.fillRect(4, 28, 56, 2);
    // Body lump under blanket
    g.fillStyle(0x4477bb);
    g.fillRect(22, 16, 38, 13);
    // Shoulder/arm outline under blanket
    g.fillStyle(0x3a6aaa);
    g.fillRect(24, 17, 6, 4);
  }

  _drawWifeAwake(g) {
    // Hair (auburn)
    g.fillStyle(0x8b3a1a);
    g.fillRect(6, 0, 20, 10);
    g.fillRect(4, 4, 24, 8);
    // Hair sides (longer)
    g.fillStyle(0x7a2f15);
    g.fillRect(4, 10, 4, 12);
    g.fillRect(24, 10, 4, 12);
    // Face (skin)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xe0b080);
    g.fillRect(6, 11, 3, 5);
    g.fillRect(23, 11, 3, 5);
    // Wide open eyes (startled)
    g.fillStyle(0xffffff);
    g.fillRect(10, 11, 5, 5);
    g.fillRect(17, 11, 5, 5);
    // Pupils
    g.fillStyle(0x4a2010);
    g.fillRect(11, 12, 3, 3);
    g.fillRect(18, 12, 3, 3);
    // Eye outline
    g.fillStyle(0x333333);
    g.fillRect(10, 11, 5, 1);
    g.fillRect(10, 15, 5, 1);
    g.fillRect(17, 11, 5, 1);
    g.fillRect(17, 15, 5, 1);
    // Open mouth (surprised O)
    g.fillStyle(0x333333);
    g.fillRect(12, 17, 8, 4);
    g.fillStyle(0xcc6655);
    g.fillRect(13, 18, 6, 2);
    // Raised eyebrows
    g.fillStyle(0x7a2f15);
    g.fillRect(10, 9, 5, 2);
    g.fillRect(17, 9, 5, 2);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(13, 20, 6, 3);
    // Pink robe/nightgown
    g.fillStyle(0xdd88aa);
    g.fillRect(4, 23, 24, 16);
    // Robe neckline
    g.fillStyle(0xcc7799);
    g.fillRect(10, 23, 5, 5);
    g.fillRect(17, 23, 5, 5);
    // Raised arms (startled)
    g.fillStyle(0xdd88aa);
    g.fillRect(0, 18, 5, 12);
    g.fillRect(27, 18, 5, 12);
    // Hands up
    g.fillStyle(0xf0c090);
    g.fillRect(0, 16, 5, 4);
    g.fillRect(27, 16, 5, 4);
    // Lower gown
    g.fillStyle(0xcc7799);
    g.fillRect(8, 39, 7, 9);
    g.fillRect(17, 39, 7, 9);
    // Waist
    g.fillStyle(0xdd88aa);
    g.fillRect(8, 37, 16, 4);
    // Slippers
    g.fillStyle(0xff99bb);
    g.fillRect(7, 46, 8, 2);
    g.fillRect(17, 46, 8, 2);
  }

  _drawWifeStanding(g) {
    // Hair (auburn, longer/styled)
    g.fillStyle(0x8b3a1a);
    g.fillRect(6, 0, 20, 10);
    g.fillRect(4, 6, 24, 8);
    // Long hair sides
    g.fillStyle(0x7a2f15);
    g.fillRect(4, 10, 4, 18);
    g.fillRect(24, 10, 4, 18);
    // Face (skin, slightly different tone)
    g.fillStyle(0xf2c89a);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xe2b88a);
    g.fillRect(6, 11, 3, 5);
    g.fillRect(23, 11, 3, 5);
    // Eyes (calm, brown)
    g.fillStyle(0xffffff);
    g.fillRect(11, 12, 4, 3);
    g.fillRect(17, 12, 4, 3);
    g.fillStyle(0x6a3010);
    g.fillRect(12, 12, 2, 3);
    g.fillRect(18, 12, 2, 3);
    // Eyelashes
    g.fillStyle(0x553322);
    g.fillRect(11, 11, 4, 1);
    g.fillRect(17, 11, 4, 1);
    // Mouth (gentle smile)
    g.fillStyle(0xdd8866);
    g.fillRect(12, 17, 8, 2);
    g.fillStyle(0xcc6644);
    g.fillRect(14, 18, 4, 1);
    // Neck
    g.fillStyle(0xf2c89a);
    g.fillRect(13, 20, 6, 3);
    // Green casual top
    g.fillStyle(0x559944);
    g.fillRect(5, 23, 22, 14);
    // Top neckline
    g.fillStyle(0x448833);
    g.fillRect(11, 23, 10, 4);
    // Top detail
    g.fillStyle(0x66aa55);
    g.fillRect(5, 24, 22, 2);
    // Arms (casual)
    g.fillStyle(0x559944);
    g.fillRect(1, 24, 5, 11);
    g.fillRect(26, 24, 5, 11);
    // Hands
    g.fillStyle(0xf2c89a);
    g.fillRect(1, 34, 5, 3);
    g.fillRect(26, 34, 5, 3);
    // Jeans (blue)
    g.fillStyle(0x3355aa);
    g.fillRect(7, 37, 7, 11);
    g.fillRect(18, 37, 7, 11);
    // Waistband
    g.fillStyle(0x7a5a30);
    g.fillRect(7, 37, 18, 3);
    // Belt buckle
    g.fillStyle(0xccaa44);
    g.fillRect(14, 37, 4, 3);
    // Jeans seam
    g.fillStyle(0x2244aa);
    g.fillRect(14, 40, 4, 8);
    // Shoes (white sneakers)
    g.fillStyle(0xffffff);
    g.fillRect(6, 44, 10, 4);
    g.fillRect(17, 44, 10, 4);
    g.fillStyle(0xcccccc);
    g.fillRect(6, 46, 10, 2);
    g.fillRect(17, 46, 10, 2);
  }

  _drawCat(g) {
    // Body (black)
    g.fillStyle(0x111111);
    g.fillRect(4, 8, 14, 10);
    // Head
    g.fillRect(4, 2, 14, 8);
    // Pointed ears
    g.fillRect(4, 0, 4, 4);
    g.fillRect(14, 0, 4, 4);
    // Inner ear (pink)
    g.fillStyle(0xff9999);
    g.fillRect(5, 0, 2, 3);
    g.fillRect(15, 0, 2, 3);
    // Green eyes
    g.fillStyle(0x22cc44);
    g.fillRect(6, 4, 3, 3);
    g.fillRect(13, 4, 3, 3);
    // Slit pupils
    g.fillStyle(0x111111);
    g.fillRect(7, 4, 1, 3);
    g.fillRect(14, 4, 1, 3);
    // Eye highlights
    g.fillStyle(0xffffff);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(13, 4, 1, 1);
    // Nose (pink)
    g.fillStyle(0xff6688);
    g.fillRect(10, 6, 2, 2);
    // Whiskers (light gray)
    g.fillStyle(0x888888);
    g.fillRect(0, 7, 6, 1);
    g.fillRect(16, 7, 6, 1);
    g.fillRect(1, 9, 5, 1);
    g.fillRect(16, 9, 5, 1);
    // Tail (curving right)
    g.fillStyle(0x111111);
    g.fillRect(17, 10, 3, 6);
    g.fillRect(18, 8, 3, 4);
    g.fillRect(20, 6, 2, 4);
    // Legs/paws
    g.fillStyle(0x111111);
    g.fillRect(5, 16, 4, 4);
    g.fillRect(13, 16, 4, 4);
    // White chest spot
    g.fillStyle(0x444444);
    g.fillRect(7, 10, 8, 6);
  }

  _drawIgor(g) {
    // Hair (dark, buzz cut)
    g.fillStyle(0x221a0e);
    g.fillRect(8, 0, 16, 6);
    g.fillRect(6, 4, 20, 5);
    // Face (skin tone)
    g.fillStyle(0xf0c090);
    g.fillRect(8, 8, 16, 12);
    // Beard shadow
    g.fillStyle(0xe0a870);
    g.fillRect(8, 16, 16, 4);
    // Ears
    g.fillStyle(0xe0b080);
    g.fillRect(6, 10, 3, 6);
    g.fillRect(23, 10, 3, 6);
    // Eyes (narrower, intense)
    g.fillStyle(0x334466);
    g.fillRect(10, 12, 4, 3);
    g.fillRect(18, 12, 4, 3);
    // Eye highlights
    g.fillStyle(0xffffff);
    g.fillRect(10, 12, 1, 1);
    g.fillRect(18, 12, 1, 1);
    // Eyebrows
    g.fillStyle(0x221a0e);
    g.fillRect(10, 10, 4, 2);
    g.fillRect(18, 10, 4, 2);
    // Mouth (slight smirk)
    g.fillStyle(0xcc7755);
    g.fillRect(12, 17, 8, 2);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(13, 20, 6, 3);
    // Bright yellow gi top
    g.fillStyle(0xffdd00);
    g.fillRect(4, 23, 24, 14);
    // Gi lapels
    g.fillStyle(0xeecc00);
    g.fillRect(10, 23, 5, 8);
    g.fillRect(17, 23, 5, 8);
    // Center overlap
    g.fillStyle(0xffee22);
    g.fillRect(14, 24, 4, 12);
    // Black belt (advanced rank)
    g.fillStyle(0x111111);
    g.fillRect(4, 35, 24, 4);
    // Belt knot
    g.fillStyle(0x222222);
    g.fillRect(13, 35, 6, 4);
    // Belt tails
    g.fillStyle(0x111111);
    g.fillRect(9, 37, 4, 2);
    g.fillRect(19, 37, 4, 2);
    // Arms (gi sleeves)
    g.fillStyle(0xffdd00);
    g.fillRect(0, 24, 5, 10);
    g.fillRect(27, 24, 5, 10);
    // Larger build - slightly wider
    g.fillStyle(0xffdd00);
    g.fillRect(3, 30, 3, 5);
    g.fillRect(26, 30, 3, 5);
    // Gi pants (yellow)
    g.fillStyle(0xffee22);
    g.fillRect(6, 39, 8, 9);
    g.fillRect(18, 39, 8, 9);
    // Pants crease
    g.fillStyle(0xeecc00);
    g.fillRect(14, 39, 4, 9);
    // Bare feet
    g.fillStyle(0xf0c090);
    g.fillRect(6, 46, 8, 2);
    g.fillRect(18, 46, 8, 2);
  }

  _drawSensei(g) {
    // Gray hair (older character)
    g.fillStyle(0xaaaaaa);
    g.fillRect(7, 0, 18, 8);
    g.fillRect(5, 4, 22, 6);
    // Slight bald top highlight
    g.fillStyle(0xbbbbbb);
    g.fillRect(11, 1, 10, 4);
    // Face (skin, slightly weathered)
    g.fillStyle(0xe8b878);
    g.fillRect(8, 8, 16, 12);
    // Ears
    g.fillStyle(0xd8a868);
    g.fillRect(6, 10, 3, 6);
    g.fillRect(23, 10, 3, 6);
    // Eyes (wise, slightly squinting)
    g.fillStyle(0x444444);
    g.fillRect(10, 12, 4, 2);
    g.fillRect(18, 12, 4, 2);
    // Wrinkles around eyes
    g.fillStyle(0xd0a068);
    g.fillRect(9, 14, 2, 1);
    g.fillRect(21, 14, 2, 1);
    // Eyebrows (bushy, gray)
    g.fillStyle(0x999999);
    g.fillRect(9, 10, 6, 2);
    g.fillRect(17, 10, 6, 2);
    // Mustache
    g.fillStyle(0x999999);
    g.fillRect(11, 16, 10, 2);
    // Mouth (calm)
    g.fillStyle(0xbb7755);
    g.fillRect(13, 18, 6, 1);
    // Neck
    g.fillStyle(0xe8b878);
    g.fillRect(13, 20, 6, 3);
    // Dark gi (navy/charcoal)
    g.fillStyle(0x223344);
    g.fillRect(4, 23, 24, 14);
    // Gi lapels
    g.fillStyle(0x1a2a38);
    g.fillRect(10, 23, 5, 8);
    g.fillRect(17, 23, 5, 8);
    // Center
    g.fillStyle(0x2a3a48);
    g.fillRect(14, 24, 4, 12);
    // Red belt (sensei rank)
    g.fillStyle(0xcc2222);
    g.fillRect(4, 35, 24, 4);
    // Belt knot
    g.fillStyle(0xaa1111);
    g.fillRect(13, 35, 6, 4);
    // Belt tails
    g.fillStyle(0xcc2222);
    g.fillRect(9, 37, 4, 2);
    g.fillRect(19, 37, 4, 2);
    // Arms (gi)
    g.fillStyle(0x223344);
    g.fillRect(0, 24, 5, 10);
    g.fillRect(27, 24, 5, 10);
    // Hands
    g.fillStyle(0xe8b878);
    g.fillRect(1, 33, 4, 4);
    g.fillRect(27, 33, 4, 4);
    // Gi pants (dark)
    g.fillStyle(0x1a2a38);
    g.fillRect(6, 39, 8, 9);
    g.fillRect(18, 39, 8, 9);
    // Pants crease
    g.fillStyle(0x223344);
    g.fillRect(14, 39, 4, 9);
    // Bare feet
    g.fillStyle(0xe8b878);
    g.fillRect(6, 46, 8, 2);
    g.fillRect(18, 46, 8, 2);
  }

  // ─── VEHICLES (top-down view) ─────────────────────────────────────────────

  _drawTesla(g) {
    // Car body (dark blue/silver, sleek Tesla shape)
    g.fillStyle(0x334466);
    g.fillRect(2, 4, 28, 48);
    // Rounded front corners
    g.fillStyle(0x334466);
    g.fillRect(4, 2, 24, 4);
    g.fillRect(6, 0, 20, 4);
    // Rounded rear corners
    g.fillRect(4, 50, 24, 4);
    g.fillRect(6, 52, 20, 2);
    // Car roof/cabin (lighter)
    g.fillStyle(0x4455aa);
    g.fillRect(6, 14, 20, 24);
    // Windshield (front glass)
    g.fillStyle(0x99bbdd);
    g.fillRect(7, 10, 18, 8);
    // Windshield tint top
    g.fillStyle(0x6699bb);
    g.fillRect(7, 10, 18, 2);
    // Rear window
    g.fillStyle(0x99bbdd);
    g.fillRect(7, 38, 18, 6);
    // Headlights (LED white)
    g.fillStyle(0xeeeeff);
    g.fillRect(4, 4, 6, 4);
    g.fillRect(22, 4, 6, 4);
    // Headlight inner (blue tint)
    g.fillStyle(0xaabbff);
    g.fillRect(5, 5, 4, 2);
    g.fillRect(23, 5, 4, 2);
    // Tail lights (red)
    g.fillStyle(0xff2222);
    g.fillRect(4, 48, 6, 4);
    g.fillRect(22, 48, 6, 4);
    // Grille (front)
    g.fillStyle(0x222233);
    g.fillRect(10, 2, 12, 4);
    // Tesla T logo
    g.fillStyle(0xcc2222);
    g.fillRect(14, 3, 4, 1);
    g.fillRect(15, 3, 2, 3);
    // Wheels
    g.fillStyle(0x111111);
    g.fillRect(0, 8, 4, 10);
    g.fillRect(28, 8, 4, 10);
    g.fillRect(0, 38, 4, 10);
    g.fillRect(28, 38, 4, 10);
    // Wheel rims (silver)
    g.fillStyle(0xcccccc);
    g.fillRect(0, 10, 4, 6);
    g.fillRect(28, 10, 4, 6);
    g.fillRect(0, 40, 4, 6);
    g.fillRect(28, 40, 4, 6);
    // Door lines
    g.fillStyle(0x223355);
    g.fillRect(2, 22, 28, 1);
    g.fillRect(2, 36, 28, 1);
    // Side mirror
    g.fillStyle(0x334466);
    g.fillRect(0, 15, 2, 3);
    g.fillRect(30, 15, 2, 3);
  }

  _drawCyclist(g) {
    // Bike frame (gray metal)
    g.fillStyle(0x888899);
    g.fillRect(8, 14, 4, 16);
    // Top tube
    g.fillRect(8, 14, 8, 3);
    // Down tube
    g.fillRect(12, 14, 3, 12);
    // Chain stay
    g.fillRect(8, 26, 8, 3);
    // Wheels (black)
    g.fillStyle(0x222222);
    g.fillRect(4, 22, 8, 10);
    g.fillRect(10, 22, 8, 10);
    // Wheel spokes
    g.fillStyle(0x888888);
    g.fillRect(7, 24, 2, 6);
    g.fillRect(5, 26, 6, 2);
    g.fillRect(13, 24, 2, 6);
    g.fillRect(11, 26, 6, 2);
    // Handlebars
    g.fillStyle(0x555566);
    g.fillRect(12, 13, 6, 2);
    g.fillRect(17, 12, 2, 4);
    // Seat
    g.fillStyle(0x111111);
    g.fillRect(7, 13, 5, 2);
    // Rider body
    g.fillStyle(0xcc6622);
    g.fillRect(8, 6, 8, 10);
    // Rider head (helmet)
    g.fillStyle(0xff4400);
    g.fillRect(9, 2, 8, 6);
    // Helmet strap
    g.fillStyle(0xddaa00);
    g.fillRect(9, 7, 8, 1);
    // Rider face
    g.fillStyle(0xf0c090);
    g.fillRect(10, 3, 6, 4);
    // Visor
    g.fillStyle(0x333333);
    g.fillRect(10, 3, 6, 2);
    // Rider legs (pedaling)
    g.fillStyle(0x334488);
    g.fillRect(8, 16, 4, 6);
    g.fillRect(12, 20, 4, 6);
    // Pedals
    g.fillStyle(0x888888);
    g.fillRect(7, 21, 3, 2);
    g.fillRect(12, 25, 3, 2);
    // Backpack
    g.fillStyle(0x884422);
    g.fillRect(6, 7, 4, 8);
  }

  _drawCar1(g) {
    // Car body (red)
    g.fillStyle(0xcc2222);
    g.fillRect(2, 4, 28, 48);
    // Front
    g.fillRect(4, 2, 24, 4);
    g.fillRect(6, 0, 20, 4);
    // Rear
    g.fillRect(4, 50, 24, 4);
    g.fillRect(6, 52, 20, 2);
    // Cabin (darker red)
    g.fillStyle(0xaa1111);
    g.fillRect(6, 14, 20, 24);
    // Windshield
    g.fillStyle(0x88aacc);
    g.fillRect(7, 10, 18, 8);
    // Windshield tint
    g.fillStyle(0x5588aa);
    g.fillRect(7, 10, 18, 2);
    // Rear window
    g.fillStyle(0x88aacc);
    g.fillRect(7, 38, 18, 6);
    // Headlights
    g.fillStyle(0xffffcc);
    g.fillRect(4, 4, 6, 4);
    g.fillRect(22, 4, 6, 4);
    // Tail lights
    g.fillStyle(0xff4444);
    g.fillRect(4, 48, 6, 4);
    g.fillRect(22, 48, 6, 4);
    // Grille
    g.fillStyle(0x881111);
    g.fillRect(10, 2, 12, 3);
    // Wheels
    g.fillStyle(0x111111);
    g.fillRect(0, 8, 4, 10);
    g.fillRect(28, 8, 4, 10);
    g.fillRect(0, 38, 4, 10);
    g.fillRect(28, 38, 4, 10);
    // Wheel rims
    g.fillStyle(0x888888);
    g.fillRect(0, 10, 4, 6);
    g.fillRect(28, 10, 4, 6);
    g.fillRect(0, 40, 4, 6);
    g.fillRect(28, 40, 4, 6);
    // Door lines
    g.fillStyle(0xbb1111);
    g.fillRect(2, 22, 28, 1);
    g.fillRect(2, 36, 28, 1);
    // Side mirrors
    g.fillStyle(0xcc2222);
    g.fillRect(0, 15, 2, 3);
    g.fillRect(30, 15, 2, 3);
  }

  _drawCar2(g) {
    // Car body (green)
    g.fillStyle(0x228833);
    g.fillRect(2, 4, 28, 48);
    // Front
    g.fillRect(4, 2, 24, 4);
    g.fillRect(6, 0, 20, 4);
    // Rear
    g.fillRect(4, 50, 24, 4);
    g.fillRect(6, 52, 20, 2);
    // Cabin (darker green)
    g.fillStyle(0x116622);
    g.fillRect(6, 14, 20, 24);
    // Windshield
    g.fillStyle(0x88ccaa);
    g.fillRect(7, 10, 18, 8);
    // Windshield tint
    g.fillStyle(0x55aa88);
    g.fillRect(7, 10, 18, 2);
    // Rear window
    g.fillStyle(0x88ccaa);
    g.fillRect(7, 38, 18, 6);
    // Headlights
    g.fillStyle(0xffffcc);
    g.fillRect(4, 4, 6, 4);
    g.fillRect(22, 4, 6, 4);
    // Tail lights
    g.fillStyle(0xff4444);
    g.fillRect(4, 48, 6, 4);
    g.fillRect(22, 48, 6, 4);
    // Grille
    g.fillStyle(0x115522);
    g.fillRect(10, 2, 12, 3);
    // Wheels
    g.fillStyle(0x111111);
    g.fillRect(0, 8, 4, 10);
    g.fillRect(28, 8, 4, 10);
    g.fillRect(0, 38, 4, 10);
    g.fillRect(28, 38, 4, 10);
    // Wheel rims
    g.fillStyle(0x888888);
    g.fillRect(0, 10, 4, 6);
    g.fillRect(28, 10, 4, 6);
    g.fillRect(0, 40, 4, 6);
    g.fillRect(28, 40, 4, 6);
    // Door lines
    g.fillStyle(0x117722);
    g.fillRect(2, 22, 28, 1);
    g.fillRect(2, 36, 28, 1);
    // Side mirrors
    g.fillStyle(0x228833);
    g.fillRect(0, 15, 2, 3);
    g.fillRect(30, 15, 2, 3);
  }

  // ─── OFFICE CHARACTERS ───────────────────────────────────────────────────

  _drawOfficeNpc(g) {
    // Hair (brown)
    g.fillStyle(0x5a3820);
    g.fillRect(6, 0, 16, 6);
    g.fillRect(4, 4, 20, 5);
    // Face
    g.fillStyle(0xf0c090);
    g.fillRect(6, 6, 16, 10);
    // Ears
    g.fillStyle(0xe0b080);
    g.fillRect(4, 8, 3, 5);
    g.fillRect(21, 8, 3, 5);
    // Eyes (tired)
    g.fillStyle(0x445566);
    g.fillRect(9, 9, 3, 2);
    g.fillRect(16, 9, 3, 2);
    // Bags under eyes
    g.fillStyle(0xd8a878);
    g.fillRect(9, 11, 3, 1);
    g.fillRect(16, 11, 3, 1);
    // Mouth
    g.fillStyle(0xcc8866);
    g.fillRect(11, 13, 6, 1);
    // Neck
    g.fillStyle(0xf0c090);
    g.fillRect(12, 16, 4, 3);
    // White dress shirt
    g.fillStyle(0xffffff);
    g.fillRect(4, 19, 20, 12);
    // Shirt collar
    g.fillStyle(0xdddddd);
    g.fillRect(9, 19, 4, 4);
    g.fillRect(15, 19, 4, 4);
    // Tie (blue)
    g.fillStyle(0x336699);
    g.fillRect(13, 20, 2, 10);
    // Tie knot
    g.fillStyle(0x224488);
    g.fillRect(12, 20, 4, 3);
    // Suit jacket (gray)
    g.fillStyle(0x778899);
    g.fillRect(2, 19, 4, 12);
    g.fillRect(22, 19, 4, 12);
    g.fillRect(2, 19, 25, 4);
    // Jacket lapels
    g.fillStyle(0x667788);
    g.fillRect(4, 22, 4, 8);
    g.fillRect(20, 22, 4, 8);
    // Arms
    g.fillStyle(0x778899);
    g.fillRect(0, 20, 4, 10);
    g.fillRect(24, 20, 4, 10);
    // Hands
    g.fillStyle(0xf0c090);
    g.fillRect(0, 29, 4, 3);
    g.fillRect(24, 29, 4, 3);
    // Pants (dark gray)
    g.fillStyle(0x445566);
    g.fillRect(6, 31, 6, 9);
    g.fillRect(16, 31, 6, 9);
    // Shoes (black)
    g.fillStyle(0x222222);
    g.fillRect(5, 38, 8, 2);
    g.fillRect(15, 38, 8, 2);
  }

  _drawOfficeRobot(g) {
    // Antenna
    g.fillStyle(0x888899);
    g.fillRect(13, 0, 2, 5);
    // Antenna tip (red, glowing)
    g.fillStyle(0xff2222);
    g.fillRect(12, 0, 4, 3);
    // Head (boxy, metallic gray)
    g.fillStyle(0x778899);
    g.fillRect(5, 4, 18, 12);
    // Head highlight
    g.fillStyle(0x99aabb);
    g.fillRect(5, 4, 18, 3);
    // Head shadow
    g.fillStyle(0x667788);
    g.fillRect(5, 14, 18, 2);
    // Single glowing eye (center)
    g.fillStyle(0x00ffcc);
    g.fillRect(11, 7, 6, 5);
    // Eye glow inner
    g.fillStyle(0xaaffee);
    g.fillRect(12, 8, 4, 3);
    // Eye highlight
    g.fillStyle(0xffffff);
    g.fillRect(12, 8, 2, 1);
    // Speaker grille mouth
    g.fillStyle(0x556677);
    g.fillRect(7, 13, 14, 3);
    // Grille lines
    g.fillStyle(0x445566);
    g.fillRect(9, 13, 1, 3);
    g.fillRect(12, 13, 1, 3);
    g.fillRect(15, 13, 1, 3);
    // Body (blocky torso)
    g.fillStyle(0x667788);
    g.fillRect(4, 16, 20, 16);
    // Body highlight
    g.fillStyle(0x8899aa);
    g.fillRect(4, 16, 20, 3);
    // Chest panel
    g.fillStyle(0x445566);
    g.fillRect(8, 20, 12, 8);
    // Status lights on chest
    g.fillStyle(0x00ff44);
    g.fillRect(9, 22, 2, 2);
    g.fillStyle(0xffaa00);
    g.fillRect(13, 22, 2, 2);
    g.fillStyle(0xff2222);
    g.fillRect(17, 22, 2, 2);
    // Arms (blocky)
    g.fillStyle(0x778899);
    g.fillRect(0, 17, 5, 12);
    g.fillRect(23, 17, 5, 12);
    // Claw hands
    g.fillStyle(0x556677);
    g.fillRect(0, 28, 5, 4);
    g.fillRect(23, 28, 5, 4);
    // Claw fingers
    g.fillStyle(0x445566);
    g.fillRect(0, 31, 2, 3);
    g.fillRect(3, 31, 2, 3);
    g.fillRect(23, 31, 2, 3);
    g.fillRect(26, 31, 2, 3);
    // Lower body
    g.fillStyle(0x556677);
    g.fillRect(6, 32, 16, 8);
    // Legs (hydraulic)
    g.fillStyle(0x667788);
    g.fillRect(7, 38, 5, 2);
    g.fillRect(16, 38, 5, 2);
    // Feet (flat base)
    g.fillStyle(0x445566);
    g.fillRect(5, 38, 8, 2);
    g.fillRect(15, 38, 8, 2);
  }

  _drawDojoPair(g) {
    // Background hint (mat color)
    g.fillStyle(0x443322);
    g.fillRect(0, 0, 48, 48);
    // Figure 1 (attacker, dark silhouette, left)
    g.fillStyle(0x2a2a3a);
    // Head
    g.fillRect(6, 4, 12, 12);
    // Body
    g.fillRect(4, 16, 14, 14);
    // Extended arm (throwing)
    g.fillRect(14, 12, 16, 5);
    // Gi detail on figure 1
    g.fillStyle(0x3a3a4a);
    g.fillRect(6, 16, 10, 6);
    // Legs (wide stance)
    g.fillStyle(0x2a2a3a);
    g.fillRect(4, 30, 6, 14);
    g.fillRect(12, 32, 5, 12);
    // Figure 2 (being thrown, right, rotated)
    g.fillStyle(0x1a1a2a);
    // Head (tilted)
    g.fillRect(28, 8, 12, 11);
    // Body (horizontal, being thrown)
    g.fillRect(24, 16, 20, 10);
    // Arm grabbing
    g.fillRect(18, 20, 8, 4);
    // Legs (up in air)
    g.fillRect(36, 6, 5, 14);
    g.fillRect(40, 10, 5, 14);
    // Gi highlights on figure 2
    g.fillStyle(0x2a2a3a);
    g.fillRect(26, 17, 16, 4);
    // Belt colors (figure 1: black, figure 2: blue)
    g.fillStyle(0x111111);
    g.fillRect(4, 24, 14, 3);
    g.fillStyle(0x2244aa);
    g.fillRect(24, 22, 20, 3);
    // Shadow beneath
    g.fillStyle(0x332211);
    g.fillRect(8, 42, 32, 4);
    // Mat grid lines
    g.fillStyle(0x554433);
    g.fillRect(0, 48, 48, 1);
  }

  // ─── PROPS ───────────────────────────────────────────────────────────────

  _drawCloset(g) {
    // Wood frame (brown)
    g.fillStyle(0x8b6940);
    g.fillRect(0, 0, 48, 64);
    // Wood grain highlight
    g.fillStyle(0x9a7850);
    g.fillRect(2, 2, 44, 60);
    // Left door
    g.fillStyle(0xa08050);
    g.fillRect(2, 4, 20, 56);
    // Right door
    g.fillRect(26, 4, 20, 56);
    // Door panels (recessed look)
    g.fillStyle(0x8b6940);
    g.fillRect(4, 8, 16, 22);
    g.fillRect(4, 34, 16, 22);
    g.fillRect(28, 8, 16, 22);
    g.fillRect(28, 34, 16, 22);
    // Door panel inner highlight
    g.fillStyle(0xb09060);
    g.fillRect(5, 9, 14, 20);
    g.fillRect(5, 35, 14, 20);
    g.fillRect(29, 9, 14, 20);
    g.fillRect(29, 35, 14, 20);
    // Center divider
    g.fillStyle(0x7a5a30);
    g.fillRect(22, 0, 4, 64);
    // Top rail
    g.fillRect(0, 0, 48, 4);
    // Bottom rail
    g.fillRect(0, 60, 48, 4);
    // Left door knob
    g.fillStyle(0xccaa44);
    g.fillRect(20, 30, 3, 5);
    // Right door knob
    g.fillRect(25, 30, 3, 5);
    // Knob highlight
    g.fillStyle(0xeecc66);
    g.fillRect(20, 30, 2, 2);
    g.fillRect(25, 30, 2, 2);
    // Wood grain lines
    g.fillStyle(0x8b6940);
    g.fillRect(7, 9, 1, 18);
    g.fillRect(12, 9, 1, 18);
    g.fillRect(31, 9, 1, 18);
    g.fillRect(36, 9, 1, 18);
    g.fillRect(7, 35, 1, 18);
    g.fillRect(12, 35, 1, 18);
    g.fillRect(31, 35, 1, 18);
    g.fillRect(36, 35, 1, 18);
  }

  _drawDoor(g) {
    // Door frame (slightly darker)
    g.fillStyle(0x4a3520);
    g.fillRect(0, 0, 40, 48);
    // Door surface (wood brown)
    g.fillStyle(0x7a5a30);
    g.fillRect(2, 2, 36, 46);
    // Door panel top
    g.fillStyle(0x6a4a20);
    g.fillRect(5, 5, 30, 16);
    // Door panel bottom
    g.fillRect(5, 26, 30, 18);
    // Panel highlights
    g.fillStyle(0x9a7a50);
    g.fillRect(6, 6, 28, 14);
    g.fillRect(6, 27, 28, 16);
    // Wood grain lines
    g.fillStyle(0x6a4a20);
    g.fillRect(10, 6, 1, 12);
    g.fillRect(20, 6, 1, 12);
    g.fillRect(30, 6, 1, 12);
    g.fillRect(10, 27, 1, 14);
    g.fillRect(20, 27, 1, 14);
    g.fillRect(30, 27, 1, 14);
    // Door knob/handle (gold)
    g.fillStyle(0xccaa44);
    g.fillRect(28, 22, 6, 4);
    // Knob plate
    g.fillStyle(0xaa8833);
    g.fillRect(27, 21, 8, 6);
    // Knob highlight
    g.fillStyle(0xeecc66);
    g.fillRect(28, 22, 4, 2);
    // Door hinge top
    g.fillStyle(0x888888);
    g.fillRect(2, 6, 4, 6);
    // Door hinge bottom
    g.fillRect(2, 36, 4, 6);
    // Hinge screws
    g.fillStyle(0x666666);
    g.fillRect(3, 7, 2, 1);
    g.fillRect(3, 10, 2, 1);
    g.fillRect(3, 37, 2, 1);
    g.fillRect(3, 40, 2, 1);
    // Door bottom strip
    g.fillStyle(0x5a4020);
    g.fillRect(2, 44, 36, 4);
  }

  _drawFridge(g) {
    // Outer shell (white/light gray)
    g.fillStyle(0xdddddd);
    g.fillRect(0, 0, 48, 64);
    // Inner door surface
    g.fillStyle(0xeeeeee);
    g.fillRect(2, 2, 44, 60);
    // Freezer section (top, slightly different)
    g.fillStyle(0xe0e8f0);
    g.fillRect(2, 2, 44, 20);
    // Freezer divider line
    g.fillStyle(0xaaaaaa);
    g.fillRect(2, 22, 44, 2);
    // Main fridge section
    g.fillStyle(0xeeeeee);
    g.fillRect(2, 24, 44, 38);
    // Handle (silver)
    g.fillStyle(0x999999);
    g.fillRect(36, 10, 4, 12);
    // Handle highlight
    g.fillStyle(0xbbbbbb);
    g.fillRect(37, 11, 2, 10);
    // Handle bottom fridge section
    g.fillStyle(0x999999);
    g.fillRect(36, 30, 4, 22);
    g.fillStyle(0xbbbbbb);
    g.fillRect(37, 31, 2, 20);
    // Door seal lines (dark gray border)
    g.fillStyle(0xbbbbbb);
    g.fillRect(2, 2, 44, 1);
    g.fillRect(2, 61, 44, 1);
    g.fillRect(2, 2, 1, 62);
    g.fillRect(45, 2, 1, 62);
    // Freezer interior shelves
    g.fillStyle(0xccccdd);
    g.fillRect(4, 12, 38, 2);
    // Fridge shelves
    g.fillStyle(0xdddddd);
    g.fillRect(4, 36, 38, 2);
    g.fillRect(4, 48, 38, 2);
    // Small vent at bottom
    g.fillStyle(0xaaaaaa);
    g.fillRect(8, 60, 32, 2);
    // Vent lines
    g.fillStyle(0x999999);
    g.fillRect(12, 60, 1, 2);
    g.fillRect(16, 60, 1, 2);
    g.fillRect(20, 60, 1, 2);
    g.fillRect(24, 60, 1, 2);
    g.fillRect(28, 60, 1, 2);
    g.fillRect(32, 60, 1, 2);
  }

  _drawCoffeeMachine(g) {
    // Machine body (dark brown/black)
    g.fillStyle(0x221a12);
    g.fillRect(0, 4, 32, 36);
    // Body highlight (top)
    g.fillStyle(0x332820);
    g.fillRect(0, 4, 32, 4);
    // Body sides highlight
    g.fillStyle(0x2a2018);
    g.fillRect(0, 4, 3, 36);
    g.fillRect(29, 4, 3, 36);
    // Water reservoir (back, slightly lighter)
    g.fillStyle(0x3a2a20);
    g.fillRect(20, 0, 12, 24);
    // Reservoir water (blue)
    g.fillStyle(0x4466aa);
    g.fillRect(22, 2, 8, 16);
    // Reservoir cap
    g.fillStyle(0x2a1a10);
    g.fillRect(20, 0, 12, 3);
    // Control panel area
    g.fillStyle(0x1a1008);
    g.fillRect(2, 8, 18, 12);
    // Red power light
    g.fillStyle(0xff2222);
    g.fillRect(5, 11, 4, 4);
    // Power light glow
    g.fillStyle(0xff6666);
    g.fillRect(6, 12, 2, 2);
    // Button (gray)
    g.fillStyle(0x666666);
    g.fillRect(12, 10, 5, 5);
    // Button detail
    g.fillStyle(0x888888);
    g.fillRect(13, 11, 3, 3);
    // Brew head (where coffee comes out)
    g.fillStyle(0x444444);
    g.fillRect(8, 20, 8, 6);
    g.fillStyle(0x333333);
    g.fillRect(10, 23, 4, 8);
    // Coffee drip
    g.fillStyle(0x6a3a18);
    g.fillRect(11, 28, 2, 4);
    // Cup platform (stainless)
    g.fillStyle(0x888899);
    g.fillRect(2, 30, 20, 3);
    // Platform edge
    g.fillStyle(0x666677);
    g.fillRect(2, 32, 20, 1);
    // Small cup on platform
    g.fillStyle(0xffffff);
    g.fillRect(8, 25, 8, 6);
    g.fillStyle(0xf5e6c8);
    g.fillRect(9, 26, 6, 4);
    // Cup handle
    g.fillStyle(0xdddddd);
    g.fillRect(15, 27, 2, 3);
    // Bottom feet
    g.fillStyle(0x111111);
    g.fillRect(2, 38, 6, 2);
    g.fillRect(24, 38, 6, 2);
  }

  _drawFoodBowl(g) {
    // Bowl shadow
    g.fillStyle(0x8b6040);
    g.fillRect(2, 12, 20, 4);
    // Bowl outer (tan/terracotta)
    g.fillStyle(0xcc8844);
    g.fillRect(0, 6, 24, 10);
    // Bowl rim
    g.fillStyle(0xddaa66);
    g.fillRect(0, 6, 24, 3);
    // Bowl inner (darker)
    g.fillStyle(0xaa6622);
    g.fillRect(2, 8, 20, 7);
    // Food in bowl (kibble, orange-brown)
    g.fillStyle(0xcc6622);
    g.fillRect(4, 9, 4, 3);
    g.fillRect(10, 9, 4, 3);
    g.fillRect(16, 9, 3, 3);
    g.fillRect(6, 11, 4, 3);
    g.fillRect(13, 11, 4, 3);
    // Food highlight
    g.fillStyle(0xdd8833);
    g.fillRect(4, 9, 2, 1);
    g.fillRect(10, 9, 2, 1);
    g.fillRect(16, 9, 2, 1);
    // Bowl underside curve
    g.fillStyle(0xbb7733);
    g.fillRect(4, 14, 16, 2);
    g.fillRect(6, 15, 12, 1);
  }

  _drawBanana(g) {
    // Dark background
    g.fillStyle(0x1a1a1a);
    g.fillRect(0, 0, 24, 24);
    // Banana shape (yellow, curved)
    g.fillStyle(0xffdd00);
    g.fillRect(4, 18, 16, 4);
    g.fillRect(4, 14, 14, 6);
    g.fillRect(6, 10, 12, 6);
    g.fillRect(8, 7, 10, 5);
    g.fillRect(10, 4, 8, 5);
    g.fillRect(12, 2, 5, 4);
    // Banana highlight (lighter yellow)
    g.fillStyle(0xffee44);
    g.fillRect(5, 18, 10, 2);
    g.fillRect(7, 14, 8, 4);
    g.fillRect(9, 10, 6, 4);
    g.fillRect(11, 7, 5, 3);
    g.fillRect(13, 4, 3, 3);
    // Banana tip (brown)
    g.fillStyle(0x886622);
    g.fillRect(14, 1, 3, 3);
    // Banana stem
    g.fillStyle(0x664422);
    g.fillRect(15, 0, 2, 3);
    // Banana end
    g.fillStyle(0x886622);
    g.fillRect(18, 20, 3, 3);
    // Shadow
    g.fillStyle(0xcc9900);
    g.fillRect(6, 20, 12, 2);
  }

  _drawCoffeeCup(g) {
    // Cup body (brown ceramic)
    g.fillStyle(0x8b4513);
    g.fillRect(2, 8, 16, 14);
    // Cup top rim
    g.fillStyle(0xaa5522);
    g.fillRect(2, 8, 16, 2);
    // Cup body highlight
    g.fillStyle(0xa05020);
    g.fillRect(3, 10, 6, 10);
    // Coffee inside (dark brown)
    g.fillStyle(0x4a2208);
    g.fillRect(3, 9, 14, 5);
    // Coffee surface sheen
    g.fillStyle(0x6a3a18);
    g.fillRect(4, 9, 8, 2);
    // Cup handle
    g.fillStyle(0x8b4513);
    g.fillRect(17, 10, 3, 10);
    g.fillRect(17, 10, 2, 3);
    g.fillRect(17, 17, 2, 3);
    // Handle highlight
    g.fillStyle(0xaa6633);
    g.fillRect(17, 11, 2, 8);
    // Cup bottom
    g.fillStyle(0x7a3a0a);
    g.fillRect(3, 21, 14, 2);
    // Saucer
    g.fillStyle(0xaa6633);
    g.fillRect(0, 22, 20, 3);
    // Saucer rim
    g.fillStyle(0xcc8855);
    g.fillRect(0, 22, 20, 1);
    // Steam squiggles (white/light gray)
    g.fillStyle(0xdddddd);
    g.fillRect(5, 4, 2, 4);
    g.fillRect(6, 3, 2, 2);
    g.fillRect(10, 3, 2, 5);
    g.fillRect(9, 2, 2, 2);
    g.fillRect(14, 4, 2, 4);
    g.fillRect(15, 3, 2, 2);
    // Steam wisp tops
    g.fillStyle(0xeeeeee);
    g.fillRect(5, 2, 2, 2);
    g.fillRect(10, 1, 2, 2);
    g.fillRect(14, 2, 2, 2);
  }

  _drawMoney(g) {
    // Bill background (green)
    g.fillStyle(0x228833);
    g.fillRect(0, 0, 16, 16);
    // Bill highlight
    g.fillStyle(0x33aa44);
    g.fillRect(1, 1, 14, 6);
    // Bill border (darker green)
    g.fillStyle(0x116622);
    g.fillRect(0, 0, 16, 1);
    g.fillRect(0, 15, 16, 1);
    g.fillRect(0, 0, 1, 16);
    g.fillRect(15, 0, 1, 16);
    // Inner border
    g.fillStyle(0x1a7a2a);
    g.fillRect(2, 2, 12, 1);
    g.fillRect(2, 13, 12, 1);
    g.fillRect(2, 2, 1, 12);
    g.fillRect(13, 2, 1, 12);
    // $ symbol (white)
    g.fillStyle(0xeeffee);
    // Dollar vertical stroke
    g.fillRect(7, 3, 2, 10);
    // Top curve of S
    g.fillRect(5, 4, 5, 2);
    // Middle of S
    g.fillRect(5, 7, 5, 2);
    // Bottom curve of S
    g.fillRect(5, 10, 5, 2);
    // Corner decorations
    g.fillStyle(0x44cc55);
    g.fillRect(1, 1, 2, 2);
    g.fillRect(13, 1, 2, 2);
    g.fillRect(1, 13, 2, 2);
    g.fillRect(13, 13, 2, 2);
  }

  _drawNightstand(g) {
    // Table legs
    g.fillStyle(0x5a3a20);
    g.fillRect(2, 28, 4, 12);
    g.fillRect(26, 28, 4, 12);
    // Table body
    g.fillStyle(0x6a4a30);
    g.fillRect(0, 10, 32, 20);
    // Drawer
    g.fillStyle(0x5a3a20);
    g.fillRect(4, 15, 24, 10);
    // Drawer handle
    g.fillStyle(0xccaa44);
    g.fillRect(14, 19, 4, 2);
    // Table top
    g.fillStyle(0x7a5a40);
    g.fillRect(0, 8, 32, 4);
    // Lamp base
    g.fillStyle(0x888888);
    g.fillRect(12, 2, 8, 6);
    // Lamp shade
    g.fillStyle(0xffdd88);
    g.fillRect(8, 0, 16, 4);
    // Lamp glow
    g.fillStyle(0xffeeaa, 0.3);
    g.fillRect(4, 0, 24, 8);
  }

  _drawPlant(g) {
    // Pot
    g.fillStyle(0x8b5a3a);
    g.fillRect(6, 24, 12, 16);
    g.fillRect(4, 24, 16, 4);
    // Pot rim
    g.fillStyle(0x9b6a4a);
    g.fillRect(3, 22, 18, 4);
    // Soil
    g.fillStyle(0x3a2a1a);
    g.fillRect(6, 22, 12, 4);
    // Leaves
    g.fillStyle(0x2a6a2a);
    g.fillRect(8, 10, 8, 12);
    g.fillRect(4, 14, 6, 8);
    g.fillRect(14, 12, 6, 8);
    g.fillStyle(0x3a8a3a);
    g.fillRect(10, 6, 4, 8);
    g.fillRect(6, 8, 4, 6);
    g.fillRect(14, 10, 4, 6);
    // Stem
    g.fillStyle(0x2a5a2a);
    g.fillRect(11, 14, 2, 10);
  }

  _drawBed(g) {
    // Bed frame (dark wood)
    g.fillStyle(0x5c3a1e);
    g.fillRect(0, 0, 128, 80);
    // Headboard (taller, at top)
    g.fillStyle(0x7a4a28);
    g.fillRect(2, 0, 124, 16);
    // Headboard detail panels
    g.fillStyle(0x6a3a18);
    g.fillRect(6, 2, 54, 12);
    g.fillRect(68, 2, 54, 12);
    // Headboard panel highlights
    g.fillStyle(0x8a5a38);
    g.fillRect(7, 3, 52, 10);
    g.fillRect(69, 3, 52, 10);
    // Footboard (at bottom)
    g.fillStyle(0x7a4a28);
    g.fillRect(2, 68, 124, 12);
    // Footboard highlight
    g.fillStyle(0x8a5a38);
    g.fillRect(4, 70, 120, 8);
    // Side rails
    g.fillStyle(0x6a3a18);
    g.fillRect(0, 14, 8, 54);
    g.fillRect(120, 14, 8, 54);
    // Mattress (white/cream)
    g.fillStyle(0xf0ece0);
    g.fillRect(8, 14, 112, 54);
    // Mattress edge/piping
    g.fillStyle(0xe0d8c0);
    g.fillRect(8, 14, 112, 3);
    g.fillRect(8, 65, 112, 3);
    g.fillRect(8, 14, 3, 54);
    g.fillRect(117, 14, 3, 54);
    // Pillow (left)
    g.fillStyle(0xfffbf0);
    g.fillRect(12, 17, 40, 20);
    // Pillow stuffing detail
    g.fillStyle(0xf0e8d0);
    g.fillRect(14, 19, 36, 16);
    // Pillow shadow
    g.fillStyle(0xe8dcc0);
    g.fillRect(12, 34, 40, 3);
    g.fillRect(48, 17, 4, 20);
    // Pillow (right)
    g.fillStyle(0xfffbf0);
    g.fillRect(76, 17, 40, 20);
    g.fillStyle(0xf0e8d0);
    g.fillRect(78, 19, 36, 16);
    g.fillStyle(0xe8dcc0);
    g.fillRect(76, 34, 40, 3);
    g.fillRect(112, 17, 4, 20);
    // Blanket/duvet (blue)
    g.fillStyle(0x4477bb);
    g.fillRect(10, 38, 108, 28);
    // Blanket folds/texture
    g.fillStyle(0x5588cc);
    g.fillRect(10, 40, 108, 4);
    g.fillRect(10, 50, 108, 4);
    g.fillRect(10, 60, 108, 4);
    // Blanket highlights (lighter stripes)
    g.fillStyle(0x6699dd);
    g.fillRect(30, 38, 16, 28);
    g.fillRect(70, 38, 16, 28);
    g.fillRect(100, 38, 14, 28);
    // Blanket shadow at bottom
    g.fillStyle(0x3366aa);
    g.fillRect(10, 62, 108, 4);
    // Blanket top fold (turned down)
    g.fillStyle(0xeeeeff);
    g.fillRect(10, 38, 108, 4);
    // Decorative blanket trim
    g.fillStyle(0x336699);
    g.fillRect(10, 65, 108, 2);
    // Bed post corners (top)
    g.fillStyle(0x8a5a38);
    g.fillRect(0, 0, 8, 8);
    g.fillRect(120, 0, 8, 8);
    // Bed post corners (bottom)
    g.fillRect(0, 72, 8, 8);
    g.fillRect(120, 72, 8, 8);
    // Post knobs
    g.fillStyle(0xaa7a50);
    g.fillRect(1, 1, 6, 6);
    g.fillRect(121, 1, 6, 6);
    g.fillRect(1, 73, 6, 6);
    g.fillRect(121, 73, 6, 6);
  }
}
