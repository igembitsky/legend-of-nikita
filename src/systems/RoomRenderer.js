export class RoomRenderer {
  /**
   * Draw a wood plank floor across the full scene
   */
  static drawWoodFloor(scene, width, height, opts = {}) {
    const {
      baseColor = 0x5a3a20,
      variation = 16,
      plankHeight = 48,
      gapColor = 0x2a1a08,
    } = opts;

    const g = scene.add.graphics().setDepth(0);

    for (let y = 0; y < height; y += plankHeight) {
      // Each plank gets slight color variation
      const colorShift = Math.floor(Math.random() * variation) - variation / 2;
      const r = ((baseColor >> 16) & 0xff) + colorShift;
      const gv = ((baseColor >> 8) & 0xff) + colorShift;
      const b = (baseColor & 0xff) + colorShift;
      const plankColor = (Math.max(0, Math.min(255, r)) << 16) |
                         (Math.max(0, Math.min(255, gv)) << 8) |
                         Math.max(0, Math.min(255, b));

      // Plank body
      g.fillStyle(plankColor);
      g.fillRect(0, y, width, plankHeight - 1);

      // Gap line between planks
      g.fillStyle(gapColor);
      g.fillRect(0, y + plankHeight - 1, width, 1);

      // Subtle grain lines within plank
      const grainColor = (Math.max(0, r - 8) << 16) | (Math.max(0, gv - 6) << 8) | Math.max(0, b - 4);
      g.fillStyle(grainColor, 0.3);
      for (let gx = 0; gx < width; gx += Math.floor(Math.random() * 120) + 60) {
        g.fillRect(gx, y + 8, 1, plankHeight - 16);
      }

      // Vertical joint lines (staggered per row)
      const offset = (Math.floor(y / plankHeight) % 2) * 120;
      g.fillStyle(gapColor, 0.5);
      for (let jx = offset + 200; jx < width; jx += 240) {
        g.fillRect(jx, y, 1, plankHeight - 1);
      }
    }
  }

  /**
   * Draw a ceramic tile floor
   */
  static drawTileFloor(scene, width, height, opts = {}) {
    const {
      tileSize = 48,
      color1 = 0xd0c8b0,
      color2 = 0xc0b8a0,
      groutColor = 0xa09880,
      groutWidth = 2,
    } = opts;

    const g = scene.add.graphics().setDepth(0);

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isAlt = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        g.fillStyle(isAlt ? color1 : color2);
        g.fillRect(x + groutWidth / 2, y + groutWidth / 2, tileSize - groutWidth, tileSize - groutWidth);
      }
    }

    // Grout lines
    g.fillStyle(groutColor, 0.5);
    for (let x = 0; x < width; x += tileSize) {
      g.fillRect(x, 0, groutWidth, height);
    }
    for (let y = 0; y < height; y += tileSize) {
      g.fillRect(0, y, width, groutWidth);
    }
  }

  /**
   * Draw walls with wallpaper pattern and baseboard
   */
  static drawWalls(scene, width, height, opts = {}) {
    const {
      wallColor = 0x2a2244,
      patternColor = 0x332255,
      baseboardColor = 0x3a2a18,
      wallThickness = 48,
      baseboardHeight = 10,
      sides = { top: true, left: true, right: true },
    } = opts;

    const g = scene.add.graphics().setDepth(200);

    // Top wall
    if (sides.top) {
      g.fillStyle(wallColor);
      g.fillRect(0, 0, width, wallThickness);

      // Wallpaper pattern — subtle diamonds
      g.fillStyle(patternColor, 0.3);
      for (let x = 0; x < width; x += 24) {
        for (let y = 4; y < wallThickness - 4; y += 16) {
          g.fillRect(x + 10, y, 4, 4);
          g.fillRect(x + 22, y + 8, 4, 4);
        }
      }

      // Crown molding (thin highlight at bottom of wall)
      g.fillStyle(0x4a3a66, 0.8);
      g.fillRect(0, wallThickness - 3, width, 1);
      g.fillStyle(0x5a4a88, 0.5);
      g.fillRect(0, wallThickness - 2, width, 1);

      // Baseboard
      g.fillStyle(baseboardColor);
      g.fillRect(0, wallThickness - baseboardHeight, width, baseboardHeight);
      // Baseboard highlight
      g.fillStyle(0x5a4a38, 0.6);
      g.fillRect(0, wallThickness - baseboardHeight, width, 2);
    }

    // Left wall
    if (sides.left) {
      g.fillStyle(wallColor);
      g.fillRect(0, 0, wallThickness, height);
      g.fillStyle(patternColor, 0.3);
      for (let y = 0; y < height; y += 24) {
        for (let x = 4; x < wallThickness - 4; x += 16) {
          g.fillRect(x, y + 10, 4, 4);
        }
      }
      // Baseboard
      g.fillStyle(baseboardColor);
      g.fillRect(wallThickness - baseboardHeight, 0, baseboardHeight, height);
    }

    // Right wall
    if (sides.right) {
      g.fillStyle(wallColor);
      g.fillRect(width - wallThickness, 0, wallThickness, height);
      g.fillStyle(patternColor, 0.3);
      for (let y = 0; y < height; y += 24) {
        for (let x = width - wallThickness + 4; x < width - 4; x += 16) {
          g.fillRect(x, y + 10, 4, 4);
        }
      }
      // Baseboard
      g.fillStyle(baseboardColor);
      g.fillRect(width - wallThickness, 0, baseboardHeight, height);
    }
  }

  /**
   * Draw a window with light glow
   */
  static drawWindow(scene, x, y, w, h, opts = {}) {
    const {
      frameColor = 0x4a3828,
      glassColor = 0x2a3a5a,
      lightColor = 0x4466aa,
      lightRadius = 150,
      lightAlpha = 0.08,
      curtainColor = 0x334488,
    } = opts;

    const g = scene.add.graphics().setDepth(201);

    // Window frame
    g.fillStyle(frameColor);
    g.fillRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);

    // Glass panes (2x1 grid)
    const paneW = (w - 4) / 2;
    g.fillStyle(glassColor);
    g.fillRect(x - w / 2, y - h / 2, paneW, h);
    g.fillRect(x - w / 2 + paneW + 4, y - h / 2, paneW, h);

    // Cross divider
    g.fillStyle(frameColor);
    g.fillRect(x - 2, y - h / 2, 4, h);
    g.fillRect(x - w / 2, y - 2, w, 4);

    // Moonlight/sunlight glow on floor
    const glow = scene.add.circle(x, y + h + 80, lightRadius, lightColor, lightAlpha)
      .setDepth(1);

    // Curtains (simple draped rectangles)
    if (curtainColor) {
      g.fillStyle(curtainColor, 0.7);
      g.fillRect(x - w / 2 - 8, y - h / 2 - 4, 12, h + 20);
      g.fillRect(x + w / 2 - 4, y - h / 2 - 4, 12, h + 20);
    }

    // Window sill
    g.fillStyle(frameColor);
    g.fillRect(x - w / 2 - 8, y + h / 2 + 2, w + 16, 6);
  }

  /**
   * Draw a shadow ellipse under an object
   */
  static drawShadow(scene, x, y, w, h) {
    return scene.add.ellipse(x, y, w, h, 0x000000, 0.15).setDepth(1);
  }

  /**
   * Draw a decorative rug
   */
  static drawRug(scene, x, y, w, h, opts = {}) {
    const {
      color = 0x553344,
      borderColor = 0x442233,
      patternColor = 0x664455,
    } = opts;

    const g = scene.add.graphics().setDepth(2);

    // Rug body (rounded rectangle)
    g.fillStyle(color);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    // Border
    g.lineStyle(3, borderColor);
    g.strokeRoundedRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, 4);

    // Inner pattern (small diamonds)
    g.fillStyle(patternColor, 0.4);
    for (let px = x - w / 2 + 16; px < x + w / 2 - 16; px += 20) {
      for (let py = y - h / 2 + 16; py < y + h / 2 - 16; py += 20) {
        g.fillRect(px, py, 3, 3);
      }
    }

    // Fringe on short ends
    g.fillStyle(borderColor, 0.6);
    for (let fx = x - w / 2 + 4; fx < x + w / 2 - 4; fx += 6) {
      g.fillRect(fx, y - h / 2 - 4, 2, 6);
      g.fillRect(fx, y + h / 2 - 2, 2, 6);
    }
  }
}
