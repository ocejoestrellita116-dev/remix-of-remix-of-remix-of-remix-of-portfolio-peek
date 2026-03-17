

## Camera Fly-Through + Fisheye Effect

### Concept
Replace the current phase-based camera positioning with a **CatmullRomCurve3 spline** that the camera follows based on scroll progress (0→1). The original tutorial uses Theatre.js for keyframes, but that's a heavy dependency — we achieve the same effect with a hand-tuned spline curve. At the end of the scroll (handoff phase, ~85-100%), the **Fisheye** postprocessing effect fades in.

### Technical approach

#### 1. New config: camera spline points (`hero-scene.config.ts`)
Define 6-8 control points for `CatmullRomCurve3` that orbit around the room model, plus matching lookAt targets on a second curve:

```text
Camera path (top view):
    ·---·
   /     \
  ·   ☐   ·    ☐ = room center
   \     /
    ·---·
```

- Start: front view (z=8, y=3) — matches current `closed` state
- Middle: side orbit, closer zoom
- End: pull back high (z=9, y=4) — handoff

Remove `PhaseSceneState` camera fields (`cameraZ`, `cameraY`). Keep non-camera fields (heroArtifactY, supportSpread, etc.) for object animations.

#### 2. Rewrite camera logic in `HeroStageWebGL.tsx`
- Create the spline once with `useMemo`
- In `useFrame`, sample `curve.getPointAt(progress)` and `lookAtCurve.getPointAt(progress)` to set camera position/target
- Keep pointer parallax as small offset on top of the spline position
- Remove `applyPhaseMotion` camera logic, keep object animation parts

#### 3. Add Fisheye effect (end of scroll)
- Import `Fisheye` from `@react-three/drei` (available in v9)
- Add it to `EffectComposer` with intensity lerped from 0 to ~3-5 based on progress in the handoff phase (progress > 0.84)

#### 4. Files changed
| File | Change |
|------|--------|
| `hero-scene.config.ts` | Add `CAMERA_CURVE_POINTS`, `LOOKAT_CURVE_POINTS`, `FISHEYE_CONFIG`. Remove camera fields from `PhaseSceneState` |
| `HeroStageWebGL.tsx` | Replace camera logic with spline sampling. Add Fisheye to EffectComposer. Remove `applyPhaseMotion` camera parts |
| `hero-stage.config.ts` | Clean up (unused duplicate config) |
| Tests | Update to match new config shape |

#### 5. Spline control points (initial tuning)
```ts
// Camera position curve
[0, 3, 8],    // front (closed)
[3, 2.5, 6],  // right-front
[5, 3, 0],    // right side
[3, 3.5, -4], // right-back
[0, 4, -5],   // back
[-3, 3.5, -2],// left-back
[-4, 3, 3],   // left side
[0, 4, 9],    // pull back (handoff)

// LookAt target curve (mostly center, slight drift)
[0, 1, 0] throughout, with slight vertical variation
```

#### 6. Fisheye config
```ts
FISHEYE: {
  startProgress: 0.84,  // begins at handoff phase
  maxIntensity: 4,       // full fisheye strength
}
```

