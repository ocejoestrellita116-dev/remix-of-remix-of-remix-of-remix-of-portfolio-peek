

## Diagnosis: Why the Scene Looks Low-Quality Up Close

The screenshots show pixelated edges, blurry surfaces, and visible polygon facets. This is **not the model's fault** — it's a stylized low-poly scene by design. The problem is the **rendering settings** that were aggressively downgraded for performance:

| Setting | Current | Effect |
|---------|---------|--------|
| `dpr` | `[1, 1]` | Renders at 1x resolution even on Retina — everything looks blurry/pixelated |
| `antialias` | `false` | Hard jagged edges on all geometry |
| `shadowMapSize` | `256` | Blocky, low-res shadows |
| Camera spline | Gets as close as 1.5 units | Too close for this model's detail level |

The GLB model itself is intentionally stylized/low-poly. The quality issue is entirely from rendering at effectively half resolution with no edge smoothing.

## Plan: Restore Visual Quality (Balanced with Performance)

### File: `HeroStageWebGL.tsx`

1. **Raise DPR** from `[1, 1]` to `[1, 1.5]` — sharp on Retina without 2x GPU cost
2. **Enable antialias** — eliminates jagged polygon edges
3. **Increase shadow map** from `256` to `512` — cleaner shadows at minimal cost

### File: `hero-scene.config.ts`

4. **Pull back closest camera points** — adjust spline control points that bring the camera within ~1.5 units (lines 66, 70) to stay at ~2.5+ units, preventing extreme close-ups that expose low-poly geometry

### Files

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | `dpr=[1, 1.5]`, `antialias: true`, shadow map `512` |
| `hero-scene.config.ts` | Adjust 2 camera spline points to prevent extreme close-ups |

