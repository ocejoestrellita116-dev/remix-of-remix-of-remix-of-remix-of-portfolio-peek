

## Phase 6 & 7: CSS/Paint + Configuration Tuning

### 6.1 GPU-Accelerated Layer (`HeroStageWebGL.tsx`)

Add `will-change: transform` and `contain: strict` to the Canvas wrapper div to promote it to its own compositing layer and prevent layout recalculations from affecting the rest of the page:

```tsx
<div className="absolute inset-0" style={{ willChange: 'transform', contain: 'strict' }}>
```

### 7.1 Increase SCENE_LERP (`hero-scene.config.ts`)

Change from `0.06` to `0.08` — faster convergence means the lerp settles sooner, reducing the number of frames where values are still transitioning:

```ts
export const SCENE_LERP = 0.08;
```

### 7.2 Reduce Pointer Parallax Ranges (`hero-scene.config.ts`)

Smaller tilt values = fewer pixels moved per frame = less GPU work for transform recalculation:

```ts
export const POINTER_RANGES = {
  sceneTiltY: 0.06,       // was 0.096
  sceneTiltX: 0.03,       // was 0.042
  artifactTiltY: 0.035,   // was 0.05
  artifactTiltX: 0.02,    // was 0.028
  cameraPointerX: 0.1,    // was 0.15
  cameraPointerY: 0.07,   // was 0.1
};
```

### Files

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | Add `willChange` + `contain` to canvas wrapper div |
| `hero-scene.config.ts` | `SCENE_LERP` 0.06→0.08, reduce all `POINTER_RANGES` values |

