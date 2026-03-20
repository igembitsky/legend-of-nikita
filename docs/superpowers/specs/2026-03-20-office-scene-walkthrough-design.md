# OfficeScene Walkthrough Redesign

## Context

The OfficeScene is currently a static, dialogue-only scene with no player movement. It needs to become a walkable scene where Nikita enters through a door on the right, walks left past rows of coding coworkers, gets greeted by a bot, and sits at his desk to begin the existing work sequence.

## Layout

**Option A: Top-down office rows** — horizontal walk from right to left past two rows of desks.

- Door on the right wall (decorative, no return)
- Greeting bot positioned near the door
- Two horizontal rows of desks with code monkeys (4 desks per row)
- Nikita's highlighted empty desk at the far left bottom
- Fluorescent ceiling lights and neon accents (kept from current scene)

## Scene Flow

### Phase 1: Entry

- Fade-in. Nikita spawns at right side near door.
- Player has full WASD/arrow movement control.
- Physics sprite with `setBoundsRectangle` for room boundaries.
- Uses `MovementController` + `CharacterAnimator` with `nikita-dressed` walk sheet.

### Phase 2: Greeting Bot (Auto Cutscene)

- Greeting bot is positioned ~80px left of the door.
- When Nikita walks within ~80px of the bot, movement locks automatically (`frozen = true`).
- Bot slides toward Nikita via tween.
- Welcome dialogue plays (e.g., "Welcome to Canary HQ! Your desk is right over there.").
- On dialogue complete, bot moves aside, movement unlocks.

### Phase 3: Walking Past Coders

- Player walks left freely past two rows of desks.
- Code monkeys at each desk: feverish typing animation (arm/body bobbing tween, ~300-400ms loop).
- Monkeys are visual dressing — no interaction required.

### Phase 4: Sit at Desk

- Nikita's desk at far left is highlighted (brighter color, different border).
- SPACE indicator appears when player is within ~55px.
- Pressing SPACE:
  1. Freezes movement
  2. Snaps Nikita to seated position at desk
  3. Starts existing scripted sequence (intro dialogue → Slack → terminal → AI sentient → panic → recovery → money rain → DrivingScene)

## Systems

| System | Usage |
|--------|-------|
| MovementController | Player movement with acceleration/deceleration |
| CharacterAnimator | Directional walk/idle animations |
| InputManager | WASD/arrows + SPACE/ENTER |
| DialogueSystem | Bot greeting + existing terminal sequence |
| TransitionManager | Fade in/out |
| AtmosphereManager | Office preset (no vignette, subtle bloom) |
| ProceduralAudio | Office music |
| RoomRenderer | Floor drawing |

## Files Modified

- `src/scenes/OfficeScene.js` — full rewrite of `create()` and `update()`, keep existing `_nextStep()` sequence
- `src/data/dialogue.json` — add `office.greeting` dialogue lines for the bot
- `src/systems/AtmosphereManager.js` — office preset (already updated, no vignette)

## Existing Code Reused

- `nikita-dressed` walk sheet sprites (generated in BootScene)
- `MovementController` (src/systems/MovementController.js) — same pattern as BedroomScene
- `CharacterAnimator` (src/systems/CharacterAnimator.js) — directional animation
- `InputManager` (src/systems/InputManager.js) — input handling
- `_createSpaceIndicator()` pattern from BedroomScene
- `RoomRenderer.drawWoodFloor()` for office carpet
- Existing `_nextStep()` / `_nextRecoveryStage()` / terminal / panic / money rain methods unchanged

## Verification

1. Open `http://localhost:5173/?scene=OfficeScene`
2. Nikita should spawn near right door
3. Walk left — bot auto-cutscene triggers near door
4. Continue walking left past coding desks
5. SPACE indicator appears near empty desk at far left
6. Press SPACE — Nikita sits, existing sequence begins
7. Full sequence plays through to DrivingScene transition
