export class TransitionManager {
  constructor(scene) {
    this.scene = scene;
  }

  fadeToScene(targetScene, data = {}, duration = 500) {
    this.scene.cameras.main.fadeOut(duration, 0, 0, 0);
    this.scene.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.scene.start(targetScene, data);
    });
  }

  fadeIn(duration = 500) {
    this.scene.cameras.main.fadeIn(duration, 0, 0, 0);
  }

  flash(duration = 200, r = 255, g = 255, b = 255) {
    this.scene.cameras.main.flash(duration, r, g, b);
  }
}
