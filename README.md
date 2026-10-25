# FATAL FRONT

A mid-90s arcade hybrid you can play in the browser. You fight through **run-and-gun stages**, and each one ends in a **one-on-one duel**.

**Play:** https://golgothad.github.io/fatal-front/

- **4 fighters:** Raze, Brick, Nova and Kazan.
- **Stages:** 6 stages plus the final boss Iron Khan, played as an arcade ladder.
- **Run & gun:** 8-way aim, prone, drop-through platforms, grenades, set pieces (gunboat, tank, helicopter, armored train, lab breach, carrier deck gun), and weapon pods: **S** spread, **L** laser, **F** flame, **R** rapid.
- **Duels:** best-of-3 rounds with punches, kicks, uppercuts, blocks, two motion specials per fighter, and a **FATAL STRIKE** finisher (F F ↓ + Y at "END IT!").
- **Systems:** lives, continues, saved progress, stage select, optional 2-player co-op (second pad), and a blood toggle.
- **Display and audio:** 320×240 with integer scaling, a CRT option, an announcer, and volume sliders.
- **App:** installable PWA that works offline.

## Controls
| | Xbox pad | Keyboard |
|---|---|---|
| Move / aim | Left stick / D-pad | Arrows / WASD |
| Jump | A | Z / Space |
| Shoot / punch | X | X / J |
| Kick / aim lock | B | C / K |
| Special / grenade | Y | V / L |
| Swap gun / block | RB | Shift |
| Pause | Menu | Esc / Enter |

Touch: a stick on the left and labeled buttons on the right, with multi-touch and haptics. To customize them, go to OPTIONS → TOUCH CONTROLS (also in the pause menu). There you can drag or pinch any control, set size and opacity, pick a fixed or floating stick and set the dead zone. Layouts are saved separately for cover vs inner screen and portrait vs landscape, and you can reset to default. On touch, "easy specials" is on by default: hold a direction and tap Y.

## Ground emplacements
Everything on the ground that shoots can now be destroyed: sandbag bunkers with a gunner (the sandbags chip away), armored gun pods (shoot the red core while they're open; the shell soaks up most damage when closed), and mortar nests (watch for the red target marker). Explosive drums chain-explode and hurt nearby enemies. Supply crates and destroyed emplacements can drop weapons or ARMOR +1 (H).

## Tests
Tests use `node tests/boot.js`, `tests/play.js` and `tests/devices.js`, run headless in Chrome through puppeteer-core.

See CREDITS.md for music, SFX and voice licenses.
