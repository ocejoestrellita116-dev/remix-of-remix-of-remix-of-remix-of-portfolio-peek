

# 120 FPS Optimization — Stage 2

## Analysis of Current Scene

The scene has **12 unique nodes** (dossier, cover, orb, 3 pedestals, 3 tickets, portal, 2 rails) — each is a distinct mesh from the GLB. There are no duplicated/instanced objects, so **InstancedMesh is not applicable** here. The scene is small enough that draw calls are not the bottleneck.

The real optimization targets are:

---

## Plan

### 1. Merge post-processing into a single custom Effect
Currently 3 separate full-screen passes (Vignette, BrightnessContrast, HueSaturation). The `postprocessing` library actually merges these automatically via EffectComposer when they're all `Effect` subclasses — but we can make this explicit and add the grain overlay into the same pass, eliminating the separate grain mesh + its own draw call.

**Changes in `HeroStageWebGL.tsx`:**
- Remove the grain `<mesh>` with custom ShaderMaterial
- Create a single custom `Effect` class that combines grain + vignette + brightness/contrast + hue/saturation into one fragment shader
- Or simpler: just remove the grain mesh and add grain as a custom Effect inside the existing EffectComposer (one extra effect in the merged pass costs almost nothing vs. a separate draw call)

### 2. Eliminate object allocations in useFrame
The `lerpState` function on line 32 creates a **new object every frame**. With `frameloop="demand"` this fires on every invalidation.

**Changes:**
- Pre-allocate a reusable `PhaseSceneState` object outside the frame loop
- Mutate it in-place instead of returning a new object from `lerpState`
- The `Object.keys(PHASE_SCENE)` call on line 258 also allocates a new array every frame — cache it as a module-level constant

### 3. Replace `Object.entries().forEach()` with direct iteration
Lines 127, 166 in the motion functions create intermediate arrays every frame. Replace with `for...in` or cache the entries once.

### 4. Reduce shadow map cost
Shadow map is 1024×1024 — acceptable, but for 120 FPS we can:
- Reduce to 512×512 (the scene is small, quality difference is minimal)
- Consider replacing real-time shadows with `ContactShadows` from drei (lighter, looks good for a portfolio piece)

### 5. Cap DPR and disable antialias
- `dpr={[1, 1.5]}` is already capped — good
- `antialias: true` in the GL config forces MSAA at the WebGL level on top of the post-processing pipeline. Since EffectComposer renders to an offscreen FBO, WebGL-level MSAA is wasted. Set `antialias: false`.

### 6. Delta-independent animation
The `useFrame` already receives `delta` and uses it for lerp via `1 - Math.pow(1 - SCENE_LERP, delta * 60)` — this is correct and frame-rate independent. No changes needed here.

---

## Summary of File Changes

**`HeroStageWebGL.tsx`:**
- Set `antialias: false` in Canvas GL config
- Cache `Object.keys(PHASE_SCENE)` as module constant
- Make `lerpState` mutate a pre-allocated target object instead of creating new one
- Move grain from separate mesh into a custom postprocessing Effect inside EffectComposer
- Remove grain mesh, grainMat, grainRef
- Reduce shadow map from 1024 to 512

**`hero-scene.config.ts`:**
- Update `shadowMapSize` from 1024 to 512

**Motion functions (same file):**
- Replace `Object.entries(nodes).forEach(...)` with cached iteration to avoid per-frame allocations

