

## Polishing: Apply Practical Improvements

After reviewing the current code, most suggestions are already handled correctly. Two items need changes:

### Already correct (no changes needed)
- **Centripetal curve**: Line 199 already uses `'centripetal'`
- **Vector3 caching**: `_camPos`, `_lookAtPos`, `_smoothCamPos`, `_smoothLookAt` are pre-allocated at module level; curves are in `useMemo`
- **Parallax as offset**: Applied after spline sampling (lines 257-269)

### Changes needed

#### 1. Skip Fisheye when intensity is 0 (`HeroStageWebGL.tsx`)
Currently `<Fisheye zoom={0}>` still renders a full-screen pass doing nothing. Wrap the Fisheye in a conditional so the scene group renders directly when intensity is near zero — saves a render pass for ~84% of the scroll.

#### 2. Add X/Z drift to lookAt curve (`hero-scene.config.ts`)
Current `LOOKAT_CURVE_POINTS` only vary Y (0.8–1.2), making the camera feel mechanical. Add subtle X drift (±0.15) and Z drift (±0.1) to make the gaze feel organic as the camera orbits.

```
[0,   1.0,  0   ]  →  [0,    1.0,  0   ]
[0,   0.9,  0   ]  →  [0.1,  0.9,  0.05]
[0,   0.8,  0   ]  →  [0.15, 0.8, -0.1 ]
[0,   1.0,  0   ]  →  [0.05, 1.0, -0.05]
[0,   1.2,  0   ]  →  [-0.1, 1.2,  0.1 ]
[0,   1.1,  0   ]  →  [-0.15,1.1,  0.05]
[0,   0.9,  0   ]  →  [-0.05,0.9,  0   ]
[0,   1.0,  0   ]  →  [0,    1.0,  0   ]
```

### Files changed
| File | Change |
|------|--------|
| `HeroStageWebGL.tsx` | Conditional Fisheye render (skip when intensity < 0.01) |
| `hero-scene.config.ts` | Update `LOOKAT_CURVE_POINTS` with X/Z drift |

