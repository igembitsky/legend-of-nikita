---
name: parallel-scenes
description: Use when working on a Legend of Nikita scene in isolation — creates a git worktree so multiple tabs can work on different scenes without clobbering each other
---

# Parallel Scene Development

Work on a scene in an isolated git worktree. Run this in each Claude Code tab to work on multiple scenes side-by-side.

## Invocation

`/parallel-scenes <SceneName>` — e.g., `/parallel-scenes KitchenScene`

## Setup

1. Create a worktree branch and switch to it:
   ```bash
   git worktree add ../legend-of-nikita-<sceneKey> -b scene/<sceneKey>
   ```
2. Set your working directory to the new worktree.
3. Install deps and start the dev server in the background: `cd ../legend-of-nikita-<sceneKey> && npm install && npx vite`
4. Check the dev server output to find the actual port (Vite auto-increments if 5173 is taken).
5. Open the scene directly in the browser: `open "http://localhost:<port>/?scene=<SceneName>"`
6. Tell the user: "Working in isolated worktree at `../legend-of-nikita-<sceneKey>` on branch `scene/<sceneKey>`. Dev server: http://localhost:<port>/?scene=<SceneName> (opened in browser) — Ready for your task."

## File Rules

**May edit:**
- `src/scenes/<SceneName>.js` — your scene
- `src/data/dialogue.json` — ONLY the `"<sceneKey>"` top-level key
- `src/systems/AtmosphereManager.js` — ONLY preset keyed `"<sceneKey>"`
- `src/systems/ProceduralAudio.js` — ONLY track/sfx keyed `"<sceneKey>"`

**Must NOT edit:**
- `src/main.js`
- Other scene files
- Core systems (DialogueSystem, InputManager, TransitionManager, SaveSystem, PauseOverlay)

This keeps merges clean when other tabs work on other scenes.

## Before Each Commit

Sync with master to incorporate other tabs' merged work:
```bash
git merge master --no-edit
```
If conflicts arise, resolve them before committing your changes.

## When Done

1. Sync and commit:
   ```bash
   git merge master --no-edit
   git add -A && git commit -m "feat(<sceneKey>): <what you did>"
   ```
2. Merge back:
   ```bash
   git checkout master && git merge scene/<sceneKey> --no-edit
   ```
3. Clean up:
   ```bash
   git worktree remove ../legend-of-nikita-<sceneKey>
   git branch -d scene/<sceneKey>
   ```
4. If merge conflicts: abort (`git merge --abort`), report which files conflicted, leave branch intact for manual resolution.

## Scene Key Map

| Class | Key |
|-------|-----|
| BedroomScene | bedroom |
| KitchenScene | kitchen |
| DrivingScene | driving |
| DojoScene | dojo |
| OfficeScene | office |
| HomeScene | home |
| BirthdayScene | birthday |
| TitleScene | title |
| IntroCrawlScene | introCrawl |
| BootScene | boot |
