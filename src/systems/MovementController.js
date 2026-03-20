import Phaser from 'phaser';

export class MovementController {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Physics.Arcade.Sprite} sprite
   * @param {object} opts
   * @param {number} opts.speed - Max movement speed in px/s
   * @param {number} [opts.accelTime=200] - Time to reach full speed (ms)
   * @param {number} [opts.decelTime=120] - Time to stop from full speed (ms)
   * @param {object} [opts.shadow] - Shadow config { sprite, offsetY }
   * @param {object} [opts.animator] - CharacterAnimator instance
   * @param {string} [opts.animKey] - Animation key for CharacterAnimator
   */
  constructor(scene, sprite, opts) {
    this.scene = scene;
    this.sprite = sprite;
    this.maxSpeed = opts.speed;
    this.accelTime = opts.accelTime ?? 200;
    this.decelTime = opts.decelTime ?? 120;
    this.shadow = opts.shadow ?? null;
    this.animator = opts.animator ?? null;
    this.animKey = opts.animKey ?? null;

    this.direction = 'down';
    this.currentSpeed = 0;
    this._inputX = 0;
    this._inputY = 0;
  }

  update(inputMgr, delta) {
    // Read raw input
    this._inputX = 0;
    this._inputY = 0;
    if (inputMgr.isDown('left')) this._inputX = -1;
    if (inputMgr.isDown('right')) this._inputX = 1;
    if (inputMgr.isDown('up')) this._inputY = -1;
    if (inputMgr.isDown('down')) this._inputY = 1;

    const hasInput = this._inputX !== 0 || this._inputY !== 0;

    // Update facing direction
    if (hasInput) {
      // Prioritize the most recent axis; horizontal takes precedence when both pressed
      if (this._inputX < 0) this.direction = 'left';
      else if (this._inputX > 0) this.direction = 'right';
      else if (this._inputY < 0) this.direction = 'up';
      else if (this._inputY > 0) this.direction = 'down';
    }

    // Acceleration / deceleration
    const dt = delta / 1000;
    if (hasInput) {
      const accelRate = this.accelTime > 0 ? this.maxSpeed / (this.accelTime / 1000) : Infinity;
      this.currentSpeed = Math.min(this.currentSpeed + accelRate * dt, this.maxSpeed);
    } else {
      const decelRate = this.decelTime > 0 ? this.maxSpeed / (this.decelTime / 1000) : Infinity;
      this.currentSpeed = Math.max(this.currentSpeed - decelRate * dt, 0);
    }

    // Calculate velocity with diagonal normalization
    let vx = 0, vy = 0;
    if (this.currentSpeed > 0) {
      if (hasInput) {
        // Normalize diagonal so it doesn't go 41% faster
        const len = Math.sqrt(this._inputX * this._inputX + this._inputY * this._inputY);
        vx = (this._inputX / len) * this.currentSpeed;
        vy = (this._inputY / len) * this.currentSpeed;
      } else {
        // Decelerating — continue in last direction
        switch (this.direction) {
          case 'left': vx = -this.currentSpeed; break;
          case 'right': vx = this.currentSpeed; break;
          case 'up': vy = -this.currentSpeed; break;
          case 'down': vy = this.currentSpeed; break;
        }
      }
    }

    this.sprite.setVelocity(vx, vy);

    // Sprite facing (fallback when no animator)
    if (!this.animator) {
      if (vx < 0) this.sprite.setFlipX(true);
      else if (vx > 0) this.sprite.setFlipX(false);
    }

    // Animation
    if (this.animator && this.animKey) {
      this.animator.playDirectional(this.sprite, this.animKey, this.direction, this.isMoving());
    }

    // Shadow sync
    if (this.shadow) {
      this.shadow.sprite.setPosition(this.sprite.x, this.sprite.y + this.shadow.offsetY);
    }
  }

  stop() {
    this.currentSpeed = 0;
    this.sprite.setVelocity(0, 0);
  }

  isMoving() {
    return this.currentSpeed > 0;
  }

  getDirection() {
    return this.direction;
  }
}
