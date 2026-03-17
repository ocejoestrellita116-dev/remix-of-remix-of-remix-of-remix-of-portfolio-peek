

## Combined Plan: Spline Easing + Remove Fisheye

### 1. Add cubic ease-in-out to camera spline progress (`HeroStageWebGL.tsx`)

In `useFrame` (~line 255), replace linear `t` with eased value for cinematic pacing:

```ts
const raw = THREE.MathUtils.clamp(progress, 0, 1);
const t = raw < 0.5
  ? 4 * raw * raw * raw
  : 1 - Math.pow(-2 * raw + 2, 3) / 2;
```

### 2. Remove Fisheye effect entirely (`HeroStageWebGL.tsx`)

- Remove `Fisheye` import from `@react-three/drei` (line 3)
- Remove `FISHEYE_CONFIG` from config import (line 16)
- Remove `fisheyeIntensity` ref (line 225)
- Remove fisheye intensity calculation in `useFrame` (lines 275-279)
- Replace the conditional Fisheye/non-Fisheye scene rendering (lines 344-389) with just the plain scene group (no branching)

### 3. Remove Fisheye config from `hero-scene.config.ts`

Delete the `FISHEYE_CONFIG` export (lines 83-86).

### Files

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | Add spline easing, remove all Fisheye code and conditional rendering |
| `hero-scene.config.ts` | Remove `FISHEYE_CONFIG` |

