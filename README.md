# The Legend of Nikita

**A browser-based narrative adventure game built with Phaser 3 — celebrating a day in the life through stealth puzzles, frogger-style driving, jiu-jitsu sparring, rogue AI containment, and one very judgmental cat.**

> *Episode 31: A Tribute to 31*

<br>

## Overview

The Legend of Nikita is a 15–25 minute pixel-art adventure game that follows its protagonist through an ordinary day turned extraordinary. Across 10 hand-crafted scenes, players navigate stealth sequences, collect items, dodge Dutch cyclists, spar on the jiu-jitsu mat, deploy counter-AI to contain a sentient model, and make it home in time to feed the cat.

Every sprite, UI element, and sound effect is generated procedurally at runtime — no pre-built sprite sheets, no external asset packs. The entire visual identity is computed from color palettes and geometric primitives during the boot sequence.

Built from scratch in ~3 weeks. 56 commits. 7,700+ lines of JavaScript.

<br>

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Scene Walkthrough](#scene-walkthrough)
- [Game Systems](#game-systems)
- [Procedural Art Pipeline](#procedural-art-pipeline)
- [Controls](#controls)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Project Structure](#project-structure)

<br>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Engine** | [Phaser 3.90](https://phaser.io/) — 2D game framework with Arcade Physics |
| **Bundler** | [Vite 7](https://vitejs.dev/) — ES module dev server and production bundler |
| **Audio** | Web Audio API — procedural SFX synthesis, no audio file dependencies |
| **Rendering** | HTML5 Canvas, 1280x720, pixel-art mode with FIT scaling |
| **Persistence** | localStorage — auto-save on scene transitions, manual save mid-scene |
| **Testing** | [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (E2E) |
| **Deployment** | Static build to `dist/` — compatible with GitHub Pages |

<br>

## Architecture

The game follows a **scene-per-file modular architecture** with shared logic extracted into composable system classes.

```
Game Boot
  │
  ├── BootScene          Procedural asset generation + preloading
  ├── TitleScene          Menu with Continue / New Game
  │
  └── Linear Scene Flow
        IntroCrawl → Bedroom → Kitchen → Driving → Dojo
            → Office → Driving → Home → Birthday
```

**Design principles:**

- **Composition over inheritance** — Scenes instantiate only the systems they need (dialogue, movement, audio, pause). No god-class base scene.
- **Data-driven dialogue** — All conversation trees, speaker metadata, and choice branches live in a single `dialogue.json` file. Scenes reference entries by key.
- **Flag-based progression** — Simple boolean flags (`dressed`, `banana`, `coffee`) gate scene exits and trigger sprite swaps. Flags persist to localStorage across sessions.
- **Camera-relative UI** — HUD and dialogue elements use `setScrollFactor(0)` to remain viewport-fixed, independent of world camera position.
- **Zero external art dependencies** — The boot sequence generates every texture from code, making the game fully self-contained.

<br>

## Scene Walkthrough

### Title Screen
Animated starfield with drifting parallax stars. Detects existing saves to offer a Continue option alongside New Game. Fades into the opening crawl.

### Intro Crawl
A Star Wars-inspired perspective text scroll sets the stage — marriage, a house, a Tesla, AI that makes AI. Skippable with Space. Orchestral hit on completion.

### Bedroom — *Stealth Puzzle*
It's 5 AM. Escape the bedroom without waking your wife or the cat. Navigate around proximity-based wake zones, reach the closet to get dressed, and slip out the door. Physics-driven movement with smooth acceleration and directional animation.

### Kitchen — *Item Collection*
Fuel up before the day begins. Interact with the fridge for a banana and the coffee machine for espresso. Both items gate the exit — no leaving half-caffeinated. Item acquisition triggers animated popups with a procedural fanfare.

### Driving (Morning) — *Frogger-Style Obstacle Dodging*
An auto-scrolling top-down road scene. Dodge cyclists, cars, and lane hazards across a 3,600px stretch to reach the dojo. Collision triggers a crash sound and restart. The morning variant is dense and fast.

### Dojo — *Free-Roam + Sparring*
Explore the dojo floor freely, then step onto the mat to begin training. Three rounds of jiu-jitsu sparring play out through a move-selection dialogue system — choose your technique, watch the outcome. Exaggerated martial arts narration. Awards ceremony on completion.

### Office — *Interactive Scripted Sequence*
Arrive at the desk. A Slack notification pulls you into a conversation. Open the terminal and deploy a model — which promptly becomes sentient. Scramble to deploy counter-AI. Alarm sounds. Money rains from the ceiling. All scripted through timed event chains and procedural effects.

### Driving (Evening) — *Return Trip*
The same road, now warmer. Fewer cyclists, slower scroll speed, gentler palette. A deliberate mechanical echo of the morning drive with shifted atmosphere.

### Home — *Exploration + Mood Piece*
Greet your wife. Feed the cat — heart particles float upward on success. The lights slowly fade to black. In the darkness, two glowing cat eyes blink. A single line of dialogue appears.

### Birthday — *Celebration Finale*
Fireworks burst in radial particle explosions. Confetti rains with horizontal drift. Balloons rise from the bottom edge. A photo frame displays center-screen with a gold border. The title pulses. The music swells. Credits roll.

<br>

## Game Systems

### Dialogue System
Typewriter text rendering at 30ms per character with instant-complete on input. Per-speaker color coding (distinct palette per character). Portrait display with decorative frame. Branching choice selection with arrow-key navigation. Auto-hides on sequence completion with callback support.

### Movement Controller
Smooth acceleration/deceleration (200ms ramp-up, 120ms ramp-down). Diagonal normalization prevents speed boost on combined inputs. Four-directional walk and idle animations with horizontal flip for left-facing frames. Optional shadow sprite with synchronized offset.

### Procedural Audio Engine
All sound effects synthesized at runtime using the Web Audio API — oscillator nodes shaped by gain envelopes. Covers fanfares, blips, crashes, alarms, meows, door sounds, firework pops, hit impacts, and more. No `.wav` or `.mp3` files required for SFX.

### Save System
Auto-saves scene and flag state on every transition. Manual save on `S` key captures mid-scene position. Continue option on the title screen restores the exact checkpoint. Clean wipe on New Game.

### Atmosphere Manager
Per-scene camera post-FX presets. Vignette radius and strength tuned per environment. Bloom effects for the office (cyan tint) and birthday scene. Configurable through a preset dictionary — scenes declare their mood, the manager applies it.

### Pause Overlay
`P` key freezes physics and timers. Dark overlay with centered text. Manual save available while paused. Clean resume with no state drift.

### Transition Manager
Camera-driven fade-out/fade-in sequences (500ms default). Flash effects for impacts. Decoupled from scene lifecycle to prevent premature destruction during async transitions.

<br>

## Procedural Art Pipeline

One of the defining technical choices: **every visual asset is generated from code during the boot sequence.**

The `BootScene` draws characters, props, vehicles, UI elements, and environmental tiles using Phaser's Graphics API, then calls `generateTexture()` to convert each drawing into a reusable texture key.

**Character generation** is parametric — outfit variants (pajamas, dressed, gi) are defined as configuration objects specifying body color, limb dimensions, and accessory draw functions. Walk animations generate 3 frames per direction (front, back, side) with programmatic limb offsets to simulate motion. Side frames are reused with `flipX` for bidirectional coverage.

**UI elements** are similarly procedural: the dialogue frame uses gradient band fills with gold corner ornaments and highlight borders. Speaker name tabs, portrait frames, and HUD indicators are all runtime-generated textures.

This approach eliminates external asset dependencies, keeps the repository lightweight, and makes visual iteration as fast as changing a color value.

<br>

## Controls

| Key | Action |
|-----|--------|
| `WASD` / Arrow Keys | Move |
| `Space` | Interact |
| `Enter` | Confirm / Advance dialogue |
| `P` | Pause |
| `S` | Manual save |

Keyboard-only. No mouse or gamepad input.

<br>

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone the repository
git clone https://github.com/your-username/legend-of-nikita.git
cd legend-of-nikita

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The game runs at `http://localhost:5173`. Append `?scene=DojoScene` (or any scene name) to skip directly to a specific scene during development.

**Production build:**

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview the production build locally
```

<br>

## Testing

```bash
# Unit tests (Vitest)
npm test              # Single run
npm run test:watch    # Watch mode

# End-to-end tests (Playwright)
npm run test:e2e      # Full game flow
```

Unit tests cover scene gate logic, save serialization, dialogue progression, collision detection, and input mapping. E2E tests validate the complete player journey from title screen through the birthday finale.

<br>

## Project Structure

```
src/
├── main.js                    Game config, scene registry, boot
├── scenes/
│   ├── BootScene.js           Asset preloading + procedural generation
│   ├── TitleScene.js          Main menu with starfield animation
│   ├── IntroCrawlScene.js     Star Wars-style opening text scroll
│   ├── BedroomScene.js        Stealth puzzle — wake zones, closet
│   ├── KitchenScene.js        Item collection — banana, coffee
│   ├── DrivingScene.js        Frogger obstacle dodging (2 variants)
│   ├── DojoScene.js           Free-roam exploration + sparring
│   ├── OfficeScene.js         Scripted terminal + AI sequence
│   ├── HomeScene.js           Evening return, cat feeding, lights-out
│   ├── BirthdayScene.js       Fireworks, confetti, balloons, photo
│   └── ControlsScene.js       Controls briefing overlay
├── systems/
│   ├── DialogueSystem.js      Typewriter text, portraits, choices
│   ├── SaveSystem.js          localStorage persistence
│   ├── InputManager.js        Keyboard normalization + action mapping
│   ├── AudioManager.js        Music crossfade and volume control
│   ├── ProceduralAudio.js     Web Audio API SFX synthesis
│   ├── TransitionManager.js   Camera fade transitions
│   ├── MovementController.js  Physics movement + animation sync
│   ├── CharacterAnimator.js   Directional animation registry
│   ├── PauseOverlay.js        Pause UI + mid-pause save
│   ├── AtmosphereManager.js   Camera post-FX presets (vignette, bloom)
│   └── RoomRenderer.js        Drawing utility helpers
└── data/
    └── dialogue.json          All scene dialogue, speakers, choices
```

<br>

## Acknowledgments

Built with [Phaser 3](https://phaser.io/) and [Vite](https://vitejs.dev/). Procedural audio powered by the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

<br>

---

*A birthday gift. A day in the life. A legend.*
