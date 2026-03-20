export class CharacterAnimator {
  constructor(scene) {
    this.scene = scene;
    this._registered = new Set();
  }

  /**
   * Register walk/idle animations for a character sprite sheet.
   * @param {string} key - Character key (e.g. 'nikita-dressed')
   * @param {object} config
   * @param {number} config.frameRate - Walk cycle frame rate (default 8)
   * @param {object} config.walk - { down: [frames], up: [frames], left: [frames], right: [frames] }
   * @param {object} config.idle - { down: frame, up: frame, left: frame, right: frame }
   */
  registerCharacter(key, config) {
    if (this._registered.has(key)) return;
    this._registered.add(key);

    const frameRate = config.frameRate ?? 8;

    for (const dir of ['down', 'up', 'left', 'right']) {
      if (config.walk?.[dir]) {
        this.scene.anims.create({
          key: `${key}-walk-${dir}`,
          frames: config.walk[dir].map(f => ({ key, frame: f })),
          frameRate,
          repeat: -1,
        });
      }
      if (config.idle?.[dir] !== undefined) {
        this.scene.anims.create({
          key: `${key}-idle-${dir}`,
          frames: [{ key, frame: config.idle[dir] }],
          frameRate: 1,
          repeat: 0,
        });
      }
    }
  }

  /**
   * Play the correct directional animation on a sprite.
   * Falls back to static frame + flipX if animations aren't registered.
   */
  playDirectional(sprite, key, direction, isMoving) {
    const prefix = isMoving ? 'walk' : 'idle';
    const animKey = `${key}-${prefix}-${direction}`;

    // Handle flipX for left/right (they share front-facing frames)
    if (direction === 'left') sprite.setFlipX(true);
    else if (direction === 'right') sprite.setFlipX(false);
    else sprite.setFlipX(false);

    if (this.scene.anims.exists(animKey)) {
      if (sprite.anims.currentAnim?.key !== animKey) {
        sprite.anims.play(animKey);
      }
    } else {
      // Fallback: stop animation, keep static frame
      sprite.anims.stop();
    }
  }
}
