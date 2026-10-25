# FATAL FRONT — design

An original mid-90s arcade hybrid: **run-and-gun stages** (jungle-war shooter energy) that end in **one-on-one digitized-style duels** (versus-fighter energy). No names, characters or assets from any existing franchise.

## Core loop
1. Pick a fighter (arcade ladder screen shows the 6 stages + final).
2. **Run & gun** a side-scrolling stage (~2–3 min): run, jump, drop through platforms, 8-way aim, prone, weapon pods, enemy waves, turrets, a mid-stage set piece.
3. At the stage end the camera locks, the boss steps out: **"HERE COMES A CHALLENGER"** → arena duel, best of 3 rounds, **"ROUND ONE… FIGHT!"**
4. Win → **"END IT!"** — enter the finisher input within 4 s for a **FATAL STRIKE** (stylized flash, silhouette, pixel-blood burst if enabled). Then the next stage.
5. Lose a duel round set → lose a life, retry the duel. Out of lives → CONTINUE? 10…0 (3 credits per run). Progress (furthest stage per fighter, best score, wins) is saved.

## Roster (playable)
| Fighter | Look | Gun (stage) | Specials (duel; F = toward) |
|---|---|---|---|
| RAZE | blond headband commando | Rifle, fast single shots | **Frag Toss** ↓F+Y · **Rising Talon** F↓F+Y (rocket uppercut) |
| BRICK | bald heavy | Scattergun, short wide shells | **Bull Rush** B F+Y (shoulder charge) · **Quake Slam** ↓↓+Y |
| NOVA | purple-ponytail operative | Twin SMGs, very fast fire | **Arc Knife** ↓F+Y (thrown energy blade) · **Ghost Step** ↓B+Y (teleport behind) |
| KAZAN | bearded fire-fist brawler | Ember cannon, slow fireballs | **Dragon Fist** ↓F+Y (fireball) · **Inferno Kick** F↓F+Y (flaming flying kick) |
Finisher for everyone: **F F ↓ + Y** at "END IT!" (close range not required).
Specials are also mapped on the touch SPECIAL button with direction (hold F/↓ while tapping) so they work on phones.

## Stages & bosses
1. **Burning Jungle** — palm groves, tower snipers, gun-boat turret set piece → **MAJOR HASK** (machete commando; Machete Rush, Smoke Dash)
2. **Black River Dam** — catwalks, spillway, searchlight-tank set piece → **LOCKJAW** (chain brute; Chain Lash, Hook Pull)
3. **Neon Slums** — rain, rooftops, attack helicopter set piece → **SILK** (blade dancer; Fan Blades, Air Dive)
4. **Frostline Fortress** — snow, bunkers, ice cannons, armored train set piece → **VARGA** (cryo trooper; Frost Shot that freezes, Ice Slide)
5. **Hive Lab** — specimen tanks, acid, crawling mutants, breached-tank set piece → **SPECIMEN 9** (mutant; Acid Spit, Leap Crash)
6. **Sky Carrier** — deck guns, jets strafing, deck-cannon set piece → **COLONEL DREAD** (cyborg officer; Rocket Arm, Shock Grab)
7. **Throne of Iron** (duel only, final) → **IRON KHAN** (armored warlord; all-time teleport, Fire Wave, Shoulder Cannon, two-phase)

## Run & gun rules
- 320×240 internal resolution, integer-scaled. 3 hits? No: **one hit = one life** (genre-true) but each life starts with 2 s invulnerability; 3 lives, 3 continues. Easy mode option: 3-hit health bar.
- Weapon pods (flying capsules, shoot to drop): **S** spread (5-way), **L** laser (piercing beam), **F** flame (arcing fireballs), **R** rapid (fire-rate boost). Lose the pickup on death. RB swaps between your fighter's base gun and the carried pickup.
- Enemies: runners, riflemen (aimed shots), snipers on towers, grenadiers, wall turrets (rotate & fire), mortar bunkers, jet/heli/tank set pieces with weak points.
- 2-player local co-op (2 gamepads, or pad + keyboard): both on screen in stages; in duels P1 fights, P2 tags in on round 2 (each player owns a duel round).

## Duel rules (versus fighter)
- Big chunky sprites (~96 px), health bars with damage-trail, round timer 60, round wins shown as skulls.
- X punch (tap = jab, ↓X = low, F+X heavy, ↓+X near = **uppercut** that launches), B kick (↓B sweep, F+B roundhouse), RB block (chip damage on specials), A jump, air attacks, throws (F+X when touching).
- Combo counter, hit-stop, screen shake, juggle on launch, pixel blood on hits (toggle).
- AI per boss: aggression, block %, special frequency, anti-air habit; ramps with ladder.

## Look
- Procedural "digitized" fighters: skeletal poses rendered with gradient-shaded limbs, then alpha-thresholded and palette-quantized for that scanned-actor look; 1-px dark outline. Animations: idle, walk, run, jump, crouch, shoot (8 dirs), punch, kick, uppercut, sweep, block, hit, knockdown, special, victory, finisher.
- Backgrounds: generated paintings pixelated to 240 px tall, 48-color palettes, ordered dither; layered parallax (far painting, mid procedural props, near ground tiles).
- CRT option: scanlines + slight vignette and bloom (off/soft/strong).

## Audio
- Music: Kevin MacLeod (CC BY 4.0), one track per stage + title + duel + final, mastered to −16 LUFS, peaks ≤ −3 dBTP, seamless loops.
- SFX: Kenney CC0 sources layered with original synthesized gun bodies; levelled −19…−27 LUFS; per-sound rate limits so auto-fire never machine-guns the mix.
- Announcer: Piper TTS → pitched down, cabinet drive, 10-bit grit, slapback + hall.
- Web Audio: music bus + SFX bus + voice bus → compressor → limiter (−3 dB ceiling). Suspends on hidden/blur.

## Platforms & controls
- Xbox pad: stick/D-pad move & aim, A jump, X shoot/punch, B kick (stage: hold to lock aim), Y special/grenade, RB swap weapon/block, LB lock-aim, Start pause. Menus fully pad-driven incl. sliders.
- Touch: floating big thumbstick (left), A/X/B/Y + RB buttons (right); layout adapts to Fold 7 cover (portrait: screen top, controls below), inner (near-square: screen top-centered, controls below/at sides) and landscape (controls overlay at sides). Live re-layout on fold/unfold/rotate.
- Keyboard: arrows/WASD, Z jump, X shoot/punch, C kick, V special, Shift block/swap, Enter pause.
- PWA: manifest, maskable icons, versioned SW cache.
