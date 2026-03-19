const SAVE_KEY = 'legend-of-nikita-save';

export class SaveSystem {
  save(state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  load() {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  autoSave(sceneKey, flags) {
    this.save({ scene: sceneKey, flags: { ...flags } });
  }
}
