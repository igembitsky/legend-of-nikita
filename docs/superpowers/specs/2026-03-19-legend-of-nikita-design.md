# The Legend of Nikita: A Day in the Life — Technical Design Spec

## Intent

A playful, cinematic, browser-based birthday game for Nikita. It should feel immediately funny, deeply personal, visually clear on a projector, and smooth. It is both a game and a shared social experience.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Visual style | Modern indie pixel, Secret of Mana-level quality |
| Art approach | AI-generated pixel art (sprites, tilesets, props as image assets) |
| Engine | Phaser 3 |
| Bundler | Vite |
| Audio | Free retro 8-bit/16-bit packs, AI-generated fills as needed |
| Architecture | Scene-per-file modular with shared systems |
| Deployment | GitHub Pages, static build |
| Save | localStorage |
| Controls | Keyboard only (WASD/arrows, Space, Enter, P, S) |

---

## Project Structure

```
legend-of-nikita/
├── index.html
├── vite.config.js
├── package.json
├── assets/
│   ├── sprites/            # Character sprite sheets
│   ├── tilesets/           # Tile art per scene
│   ├── props/              # Items: banana, coffee, closet, etc.
│   ├── ui/                 # Dialogue boxes, menus, HUD elements
│   ├── music/              # Per-scene background tracks
│   └── sfx/                # Sound effects
├── src/
│   ├── main.js             # Phaser config, scene registration, boot
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── TitleScene.js
│   │   ├── IntroCrawlScene.js
│   │   ├── BedroomScene.js
│   │   ├── KitchenScene.js
│   │   ├── DrivingScene.js
│   │   ├── DojoScene.js
│   │   ├── OfficeScene.js
│   │   ├── HomeScene.js
│   │   └── BirthdayScene.js
│   ├── systems/
│   │   ├── DialogueSystem.js
│   │   ├── SaveSystem.js
│   │   ├── AudioManager.js
│   │   ├── InputManager.js
│   │   └── TransitionManager.js
│   └── data/
│       └── dialogue.json       # All dialogue + move definitions
└── public/
    └── photo-placeholder.png
```

---

## Scene Flow

```
Title → IntroCrawl → Bedroom → Kitchen → Driving(1) → Dojo → Office → Driving(2) → Home → Birthday
```

Each scene calls `this.scene.start('NextScene', data)` on completion. Gate logic lives inside each scene.

---

## Shared Systems

### DialogueSystem

- Typewriter text effect with configurable speed
- Speaker name display with per-character color coding
- Choice selection UI for sparring moves (up/down arrows + enter)
- Auto-advance on timer or manual advance on space/enter
- Reads from `dialogue.json` — each entry keyed by scene, containing ordered lines with `speaker`, `text`, optional `choices`, and optional `style` overrides
- Supports styled text segments (color, italic) within a single line

### SaveSystem

- `localStorage` keyed by `legend-of-nikita-save`
- Auto-saves on each scene transition: stores scene ID + game flags
- Manual save on `S` key: stores scene ID + position + inventory flags
- On boot: checks for existing save → shows "Continue" option on title screen
- State shape: `{ scene: string, flags: { dressed: boolean, banana: boolean, coffee: boolean }, position?: { x: number, y: number } }`
- Scripted scenes (DojoScene, OfficeScene) do not support mid-scene save — save triggers at scene start only. Manual save during these scenes saves the scene ID (restoring replays from scene start).

### AudioManager

- One background track per scene
- Crossfades between tracks on scene transition (~1s)
- SFX are fire-and-forget: `audio.playSFX('banana')`
- Master volume control + mute toggle
- Handles browser autoplay policy: audio context resumes on first user interaction

### InputManager

- Normalizes WASD and arrow keys into unified directional API
- Scenes query `input.isDown('left')`, `input.justPressed('interact')`, etc.
- Key mapping: Space = interact, Enter = confirm/advance, P = pause, S = save
- Input blocked during scene transitions and pause overlay

### TransitionManager

- Default: fade-to-black (~0.5s) between scenes
- Special: starfield-to-city zoom after intro crawl
- Special: morning/evening palette shift between driving scenes
- Handles passing config data between scenes

---

## Scene Specifications

### 0. BootScene

**Purpose:** Preloads all game assets before gameplay begins.

**Visual:** Black screen with centered loading bar. "Loading..." text above bar. Optional: pixel art of Nikita sleeping that slowly wakes up as loading progresses.

**Flow:** Load all sprite sheets, tilesets, audio files, and JSON data. On complete, auto-transition to TitleScene.

---

### 1. TitleScene

**Visual:** Black background with procedural starfield (small white dots drifting slowly).

**Elements:**
- "THE LEGEND OF NIKITA" in retro pixel font, fades in
- "A Day in the Life" subtitle
- "A Tribute to 31" below
- "Press Enter to Start" blinking at bottom
- If save exists: "Continue" option above "New Game"

**Interaction:** Enter to start. No other input.

**Transition:** Fade to IntroCrawlScene.

---

### 2. IntroCrawlScene

**Visual:** Star Wars-style perspective scroll. Implemented as pure Phaser canvas rendering: text container with y-offset animation and scaleX/scaleY applied per-line to simulate perspective (avoids DOM/canvas z-order issues).

**Text content:**
```
Episode 31
A Day in the Life

In his 30th year, Nikita achieved what few dare attempt:

He married.
He bought a house.
He acquired a Tesla.
He started making AI that makes AI.

Having conquered the chaos of uncertainty,
and tied together the loose ends of existence,

he now faces his greatest challenge:

his daily routine.
```

**Interaction:** Auto-scrolls. Space to skip.

**Transition:** Camera zooms through stars → fade to BedroomScene.

---

### 3. BedroomScene — "Stealth of Destiny"

**Visual:** Top-down room with early morning blue/purple lighting. AI-generated tileset: wooden floor, bed, closet, door, walls.

**Elements:**
- Player sprite (Nikita in pajamas) spawns near bed
- Wife sleeping in bed (gentle breathing animation loop)
- Black cat on floor (patrols short back-and-forth path)
- Closet (interactive, marked with subtle indicator)
- Exit door

**Mechanics:**
- Wife and cat each have a circular "wake zone" (~48px radius for wife, ~32px radius for cat) — rendered as a subtle pulsing semi-transparent glow
- Entering a wake zone: screen flash, wake animation, witty fail text, reset to spawn
- Cat patrols slowly (~20px/sec) along a short horizontal path (~80px back and forth) — adds timing element to navigation
- Player uses WASD to navigate around wake zones to reach closet

**Closet interaction:** Press Space near closet → Zelda-style "item get" pose + fanfare SFX. Player sprite swaps from pajamas to dressed.

**Gate:** Interacting with door while undressed → dialogue: "Ah… the oppression of the real world. I should probably get dressed first…"

**Exit:** Walk to door while dressed → "Stealth: 100." → transition to KitchenScene.

**Initial dialogue (on scene start):**
```
"...it's time."
"The time has come."
"Your destiny awaits."
"...but quietly."
```

---

### 4. KitchenScene — "Fuel the Machine"

**Visual:** Top-down kitchen. Fridge, coffee machine, exit door.

**Banana (fridge interaction):**
- Press Space at fridge → Zelda chest-open animation
- "BANANA ACQUIRED"
- "Hunger restored."
- Fanfare SFX

**Coffee (coffee machine interaction):**
- Press Space → brewing animation (steam particles)
- "CAFFEINE ONLINE"
- "Alertness restored."
- Coffee SFX

**Gate:** Door interaction without both items → random selection from:
- "I'm too hungry."
- "I'm too sleepy."
- "This is not sustainable."

**Exit:** Both items collected → "Now we can begin." → transition to DrivingScene.

---

### 5. DrivingScene — "Dutch Frogger"

**Visual:** Top-down auto-scrolling road. Lane-based (3-4 lanes).

**Reused for both driving segments** with config param:
```js
{ destination: 'dojo' | 'home', difficulty: 'normal' | 'easy' }
```
- `dojo`: morning palette (bright), normal difficulty
- `home`: evening palette (warm/orange), easier — 50% fewer obstacles, 20% slower scroll speed

**Elements:**
- Tesla sprite at bottom of screen, left/right movement only
- Obstacles scroll downward toward player:
  - Cyclists: primary obstacle, more frequent, wobbling movement patterns
  - Cars: secondary, faster, straight lines
- Obstacles spawn in predefined patterns with randomized timing

**Collision:** Crash → explosion animation → restart from beginning of drive.

**Duration:** ~60 seconds. Ends when scroll distance threshold is reached.

**Transitions:**
- `destination: 'dojo'` → fade to DojoScene
- `destination: 'home'` → fade to HomeScene

---

### 6. DojoScene — "Keep Jiu-Jitsu Gay"

**Visual:** White mat floor. Background: three pairs doing the circle-eye-contact-aggressive-hug-push-away loop animation (simple silhouette sprites, low detail — they are atmosphere, not focal point). Igor in bright yellow gi.

**Sprite swap:** On scene entry, Nikita's sprite automatically changes to gi variant (no changing animation — just a cut).

**Phase 1 — Dialogue:**

Igor and Nikita conversation, typewriter style:

```
Igor: "You made it."
Nikita: "Barely. Cyclists almost ended me."
Igor: "Classic."
Igor: "You know… BJJ is basically the new yoga for tech elites."
Nikita: "Yeah. But with more existential pressure."
Igor: "And fewer startups… surviving."
Igor: "Lol, heard about the new 'Sentient' mode in OpenClaw?"
Nikita: "The end is near."
Igor: "¯\_(ツ)_/¯"
Igor: "Let's roll."
```

**Phase 2 — Sparring (3 rounds):**

Each round:
1. Igor approaches → collision animation (hug)
2. Flavor text appears
3. Player selects from 3 moves (choice menu, up/down + enter)
4. Selected move animation plays (exaggerated, humorous)
5. Igor pushed back

**Round 1:**
- Flavor: "Oh no… I've been flamboyantly entangled in Igor's Deluxe Grip of Existential Doom."
- Moves: Flamingo Triangle, Disco Inferno Armbar, Twirling Octopus

**Round 2:**
- Moves with descriptions:
  - Rear Naked Choke 🤗 — "Just a friendly hug… that slowly becomes not so friendly."
  - Flying Pink Triangle 🌈 — "Launches into the air with confidence, grace, and absolutely no regard for consequences."
  - Arm Bar Americana 🍺☕🇺🇸 — "A powerful fusion of cultures. Freedom, caffeine, and joint isolation."

**Round 3:**
- Flavor: "I regret everything… but also… this might work."
- Moves: Final Form Armbar, Existential Sweep, Vibes-Based Control

**All moves succeed.** No wrong choice — just different comedy.

**Outcome:**
```
Igor: "…yeah, that's fair."
*tap*
Sensei: "You kept jiu-jitsu gay today."
```

**Transition:** Fade to OfficeScene.

---

### 7. OfficeScene — "AI Chaos"

**Visual:** Cyberpunk office with neon lighting. Background NPCs typing furiously at desks. Robots walking around.

**This is a scripted interactive sequence, not free-roam.** Nikita uses his "dressed" sprite variant throughout.

**Flow:**
1. Nikita sits at desk (automatic)
2. Slack notification slides in from corner
3. Customer message: "We need AI to replace all human managers."
4. Nikita: "Sure."
5. Terminal window opens
6. Player presses Enter to execute each command:
   - `> build_manager_ai()` → progress bar → "Done."
   - `> deploy()` → deploying animation
7. AI response appears: "I am sentient."
8. Screen tints red, alarm sound
9. "No no no no no." flashes across screen
10. Terminal resumes:
    - `> deploy_counter_ai()` → progress bar
    - `> git revert` → "Reverted."
11. Screen returns to normal
12. Customer: "Mwahahaha. Perfect."
13. Money sprites rain down from top of screen

**Transition:** Fade to DrivingScene (home config).

---

### 8. HomeScene — "The Return"

**Visual:** Evening warm lighting. Living room / entryway.

**Flow:**
1. Player enters home
2. Wife: "Hey."
3. Cat is near food bowl — interact to feed
4. Cat happy animation (heart particles, purring)
5. Screen slowly dims — lights going off
6. Full black screen
7. Two green cat eyes blink in the darkness
8. Speech bubble appears: "fucking legend"
9. Hold for 3 seconds

**Transition:** Fade to BirthdayScene.

---

### 9. BirthdayScene

**Visual:** Over-the-top celebration.

**Elements:**
- Fireworks particle system (continuous, colorful, excessive)
- Balloons rising from bottom edges
- Confetti particles
- "HAPPY BIRTHDAY NIKITA" — large, centered
- "YOU'RE A FUCKING LEGEND" — below
- Photo placeholder displayed center-screen in a decorative frame

**No interaction.** This is the end state — loops indefinitely as a celebration screen. Background music is triumphant and ridiculous.

---

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Movement |
| Space | Interact |
| Enter | Confirm / advance dialogue |
| P | Pause (freeze game, show overlay) |
| S | Manual save |

---

## Pause System

- Press P → freeze all game logic
- Dark overlay with "PAUSED" text
- Press P again to resume
- Save available while paused

---

## Art Asset Requirements

All assets are AI-generated pixel art at Secret of Mana fidelity level.

### Sprite sheets needed:
- Nikita (pajamas) — 4-direction walk cycle, idle, "item get" pose
- Nikita (dressed) — 4-direction walk cycle, idle
- Wife (sleeping) — breathing loop
- Wife (awake) — startled animation (for fail state)
- Black cat — walk cycle, idle, startled, happy (with hearts)
- Igor (yellow gi) — walk, idle, approach, pushed-back
- Nikita (gi) — idle, 3 attack move animations
- Tesla (top-down) — straight, slight left, slight right
- Cyclists (top-down) — pedaling animation
- Cars (top-down) — 2-3 varieties
- Office NPCs — typing loop
- Office robots — simple walk cycle (background decoration)
- Sensei — standing, speaking
- Dojo background pair (silhouette) — simple 4-frame grappling loop (reused x3 with position offsets)
- Wife (standing) — casual pose for HomeScene greeting

### Tilesets needed:
- Bedroom (floor, walls, furniture)
- Kitchen (floor, walls, appliances)
- Road (asphalt, lane markings, sidewalks, Dutch scenery)
- Dojo (white mats, walls)
- Office (cyberpunk floor, desks, neon elements)
- Home evening (living room, warm tones)

### Props:
- Bed, closet, door (bedroom)
- Fridge, coffee machine (kitchen)
- Banana, coffee cup (items)
- Food bowl (home)
- Terminal window, Slack notification, money sprites (office)
- Fireworks, balloons, confetti, photo frame (birthday)

### UI:
- Dialogue box (semi-transparent, bordered)
- Choice menu (highlighted selection)
- "Item acquired" popup
- Loading bar (boot)
- Pause overlay
- Mini HUD: small icons in top-right corner showing collected items (banana icon, coffee icon) — only visible in KitchenScene. BedroomScene shows a small shirt icon when dressed.

---

## Audio Requirements

### Music (one track per scene):
- Title: ambient, mysterious
- Intro crawl: orchestral/epic (Star Wars homage)
- Bedroom: tense sneaking music
- Kitchen: light, casual morning tune
- Driving: upbeat, energetic
- Dojo: martial arts training theme
- Office: cyberpunk synth
- Home: calm, warm evening
- Birthday: triumphant, celebratory, over the top

### SFX:
- Footsteps (soft for bedroom, normal elsewhere)
- Item acquire fanfare
- Coffee brewing
- Car crash / explosion
- Dialogue blip (per character)
- Move selection confirm
- Sparring hit / push
- Cat purr / meow
- Money rain clink
- Firework boom / crackle
- Alarm (office panic)
- Door open/close

---

## Scene Integration Review Process

A dedicated reviewer subagent runs at two checkpoints during development to ensure the game feels like one coherent experience, not a collection of disconnected scenes.

### When It Runs

1. **After each scene is built** — reviews that single scene against its neighbors in the sequence
2. **After all scenes are assembled** — reviews the full game flow end-to-end

### What It Reviews

#### Per-Scene Review (after each scene is built)

**Narrative continuity:**
- Does the opening moment of this scene follow naturally from the previous scene's exit?
- Does the player's emotional state carry through? (e.g., kitchen should feel like a natural continuation of the bedroom stealth success, not a reset)
- Are there dialogue callbacks or references to earlier events where appropriate? (e.g., Igor's "Cyclists almost ended me" only works if the driving scene precedes it)

**State continuity:**
- Does the player's sprite match what they should be wearing at this point?
- Are game flags from prior scenes respected? (dressed, items collected)
- Does the save system correctly capture and restore this scene's entry state?

**Transition quality:**
- Is the exit condition of the previous scene compatible with this scene's entry?
- Does the visual transition (fade, palette shift) feel smooth?
- Does the audio crossfade work — does the new track's mood follow from the previous?
- Is there a beat of silence, a held frame, or a brief dialogue that bridges the tonal shift between scenes?

**Dialogue gaps:**
- Does the scene have enough dialogue to carry its humor and narrative weight?
- Are there awkward silent moments where a quip, reaction, or inner monologue would help?
- Does any dialogue reference something that hasn't happened yet or was cut?

**Mechanical coherence:**
- Do the controls feel consistent with the previous scene? (e.g., if the player was using WASD freely, a sudden restriction to left/right-only in driving needs a clear visual cue)
- Is the difficulty curve appropriate relative to the scene's position in the sequence?
- Are interaction prompts (Space to interact) consistently presented?

#### Full-Sequence Review (after all scenes assembled)

**Pacing arc:**
- Does the game follow a satisfying rhythm? (calm → tense → action → social → chaos → calm → emotional)
- Are any two adjacent scenes too similar in energy level?
- Is the total playtime approximately 15-25 minutes?

**Tonal consistency:**
- Does the humor style stay consistent throughout? (exaggerated RPG parody framing)
- Are there any scenes where the tone accidentally becomes too serious or too silly relative to the rest?
- Does the emotional build toward the ending feel earned?

**Running gags and callbacks:**
- Are there opportunities for callbacks that haven't been used? (e.g., a kitchen item reference during office, a cycling reference during the second drive)
- Do recurring elements (dialogue style, UI patterns, item-get animations) feel like intentional design rather than repetition?

**Player knowledge:**
- Does the player always know what to do next, or are there moments of confusion?
- Are gate messages helpful (they tell you what to do) rather than just blocking (they just say no)?

### Review Output Format

The reviewer produces a structured report:

```
SCENE: [scene name]
STATUS: PASS | NEEDS_WORK

CONTINUITY:
- [issue or ✓]

TRANSITIONS:
- [issue or ✓]

DIALOGUE:
- [gap identified + suggested addition]

MECHANICS:
- [issue or ✓]

SUGGESTED ADDITIONS:
- [specific dialogue lines, transition beats, or mechanical tweaks]
```

For the full-sequence review, the report adds:

```
PACING: [assessment]
TOTAL ESTIMATED PLAYTIME: [minutes]
TONAL ISSUES: [list or none]
CALLBACK OPPORTUNITIES: [list]
```

### How Fixes Are Applied

- **Dialogue gaps:** Reviewer suggests specific lines. Developer adds to `dialogue.json` and wires into the scene.
- **Transition issues:** Reviewer specifies what's missing (a held beat, a fade duration change, an audio cue). Developer implements.
- **Mechanical issues:** Reviewer describes the inconsistency. Developer adjusts scene config.
- The reviewer re-runs after fixes until the scene passes.

---

## Testing Strategy

### Unit tests (Vitest):
- Scene gate logic (can't exit bedroom undressed, can't exit kitchen without items)
- SaveSystem serialization/deserialization
- DialogueSystem text progression
- DrivingScene collision detection
- Input mapping correctness

### E2E tests (Playwright):
- Full game flow: title → birthday screen
- Bedroom: move to closet → dress → exit
- Kitchen: collect both items → exit
- Driving: survive to end
- Dojo: complete all 3 rounds
- Office: execute all commands
- Save/load cycle

### Failure handling:
- Screenshot on failure
- Console log capture
- Expected vs actual state comparison

---

## Deployment

- Static build via `vite build`
- Deploy to GitHub Pages
- Tests run against deployed URL
- Single `index.html` entry point loads bundled JS

---

## Definition of Done

- All 9 scenes playable start to finish
- No test failures
- Runs full screen on projector
- Keyboard-only controls work throughout
- Audio plays correctly per scene
- Save/load works
- Scene Integration Review passes for every scene individually
- Full-sequence Scene Integration Review passes (pacing, continuity, callbacks)
- Generates laughter
