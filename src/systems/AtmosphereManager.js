export class AtmosphereManager {
  static apply(scene, preset) {
    const cam = scene.cameras.main;
    if (!cam.postFX) return; // Canvas renderer fallback

    const config = AtmosphereManager.PRESETS[preset];
    if (!config) return;

    if (config.vignette) {
      cam.postFX.addVignette(
        config.vignette.x || 0.5,
        config.vignette.y || 0.5,
        config.vignette.radius || 0.9,
        config.vignette.strength || 0.3
      );
    }

    if (config.bloom) {
      cam.postFX.addBloom(
        config.bloom.color || 0xffffff,
        config.bloom.offsetX || 1,
        config.bloom.offsetY || 1,
        config.bloom.blurStrength || 1,
        config.bloom.strength || 1
      );
    }
  }

  static PRESETS = {
    bedroom: {
      vignette: { radius: 0.85, strength: 0.4 },
    },
    kitchen: {
      vignette: { radius: 0.95, strength: 0.2 },
    },
    driving: {
      vignette: { radius: 0.9, strength: 0.25 },
    },
    dojo: {},
    office: {
      vignette: { radius: 0.95, strength: 0.15 },
      bloom: { color: 0x00ffcc, strength: 0.15, blurStrength: 0.4 },
    },
    home: {
      vignette: { radius: 0.85, strength: 0.35 },
    },
    birthday: {
      bloom: { strength: 1.2, blurStrength: 1.5 },
      vignette: { radius: 0.9, strength: 0.2 },
    },
    title: {
      vignette: { radius: 0.8, strength: 0.3 },
    },
    crawl: {
      vignette: { radius: 0.85, strength: 0.35 },
    },
  };
}
