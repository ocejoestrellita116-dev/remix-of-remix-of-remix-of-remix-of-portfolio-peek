

## Dramatic Camera Orbit + Softer Fisheye

### Changes in `hero-scene.config.ts`

**1. More dramatic camera spline** — bring camera closer to objects, add height variation, tighter orbit:

```ts
CAMERA_CURVE_POINTS:
[0, 2.5, 6],      // front — closer start
[2.5, 1.8, 4],    // right-front — low swooping pass
[4, 2.2, 0.5],    // right side — tight to objects
[3, 3.8, -3],     // right-back — rise up dramatically
[0, 4.5, -4],     // back — high overview
[-3, 2, -1],      // left-back — dive down
[-3.5, 1.5, 2.5], // left side — closest pass
[0, 4, 9],        // pull back high (handoff)
```

Key differences: lower Y values (1.5–2.2) for close swoops, smaller Z/X distances to objects, more height contrast (1.5→4.5).

**2. Reduce Fisheye intensity** from 4 → 2.5:

```ts
FISHEYE_CONFIG = {
  startProgress: 0.84,
  maxIntensity: 2.5,  // was 4
};
```

### Files
| File | Change |
|------|--------|
| `hero-scene.config.ts` | Update `CAMERA_CURVE_POINTS` (8 points), set `maxIntensity: 2.5` |

