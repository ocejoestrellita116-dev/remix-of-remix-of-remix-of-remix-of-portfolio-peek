

## Problem

The camera lerp factor is `0.08` (line 263), which means the camera catches up to the scroll-driven target in ~2-3 frames. This makes it feel rigidly locked to the scroll wheel. Additionally, the `frameloop="demand"` mode only renders when `invalidate()` is called — so the camera lerp can't "coast" over multiple frames after the user stops scrolling.

## Solution: Add Camera Inertia

Two changes to `HeroStageWebGL.tsx`:

### 1. Reduce camera lerp factor for trailing inertia

Change the lerp from `0.08` to `0.035` — this makes the camera lag behind the scroll target by ~15-20 frames, creating a smooth "floating" sensation:

```ts
// Line 263: was 0.08
const camLerp = 1 - Math.pow(1 - 0.035, delta * 60);
```

### 2. Keep rendering while camera is still catching up

After the lerp, check if the camera hasn't yet reached the target. If so, keep calling `invalidate()` so the lerp can continue coasting even after the user stops scrolling:

```ts
// After line 272, add:
const camDist = _smoothCamPos.distanceToSquared(_camPos);
const lookDist = _smoothLookAt.distanceToSquared(_lookAtPos);
if (camDist > 0.00001 || lookDist > 0.00001) invalidate();
```

This ensures the render loop stays alive while the camera is still interpolating toward its target, then goes idle once it arrives.

### Files

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | Reduce camera lerp `0.08` → `0.035`, add convergence-based invalidation |

