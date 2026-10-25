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

Touch: a floating stick on the left and buttons on the right. On touch, "easy specials" is on by default: hold a direction and tap Y.

## Tests
Tests use `node tests/boot.js`, `tests/play.js` and `tests/devices.js`, run headless in Chrome through puppeteer-core.

See CREDITS.md for music, SFX and voice licenses.
