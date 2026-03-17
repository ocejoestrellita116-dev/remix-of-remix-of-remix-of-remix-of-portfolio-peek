

## Problem

The 3D scene is not rendering because `NODE_MAP` in `hero-scene.config.ts` uses incorrect Blender node names. The GLB file contains these nodes (from the network response JSON):

```text
GLB actual names        Config expects
─────────────────       ──────────────
Level                   Level_1, Level_2
Sudo                    Sudo ✓
SudoHead                SudoHead ✓
Cactus                  Cactus ✓
Camera.001              Camera
Pyramid                 (not mapped)
React                   (not mapped)
```

`Level_1` and `Level_2` don't exist — there's only `Level`. `Camera` is actually `Camera.001`. `Pyramid` and `React` (sphere) are new nodes not mapped at all. Since `levelBase` is a critical node and never found, the loader sets `criticalMissing: true` and likely falls back to the 2D sequence.

## Plan

### 1. Fix `NODE_MAP` in `hero-scene.config.ts`

Update the Blender-name-to-semantic-key mapping to match actual GLB node names:

```
Level       → 'levelBase'
Sudo        → 'sudo'
SudoHead    → 'sudoHead'
Cactus      → 'cactus'
Camera.001  → 'cameraProp'
Pyramid     → 'pyramid'       (new)
React       → 'reactLogo'     (new)
```

Remove `Level_2` and `Camera_Lens` entries (they don't exist in this GLB).

### 2. Update `SemanticNodeKey` type and `GROUP_ASSIGNMENT`

- Remove `levelDetail` and `cameraLens` from group assignments
- Add `pyramid` → `'support'` and `reactLogo` → `'atmosphere'`

### 3. Update `NODE_BEHAVIOUR`

- Remove `levelDetail` and `cameraLens` behaviour entries
- Add `pyramid` (float animation) and `reactLogo` (float + spin)

### 4. Update `CRITICAL_NODES` in `use-glb-loader.ts`

Keep `['levelBase', 'sudo']` — these now map correctly.

### 5. Update tests

Align test expectations with the new node names.

