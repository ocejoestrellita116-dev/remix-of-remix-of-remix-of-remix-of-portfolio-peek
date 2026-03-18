

## Performance Audit: Path to 120 FPS

### Root Causes Found

**1. Render loop never goes idle (CRITICAL)**
Line 299 in `HeroStageWebGL.tsx`: `if (pointerMoved || !reducedMotion) invalidate()` — since `reducedMotion` is `false` for most users, **every frame unconditionally triggers the next frame**. The `frameloop="demand"` optimization is completely defeated. The canvas renders at max refresh rate even when nothing changes.

**2. React re-renders on every scroll tick**
`useDossierProgress` calls `setState` on every scroll event (threshold 0.001). Each setState re-renders `DossierHero` → passes new props to `HeroStageWebGL` → the `useEffect` on line 241 calls `invalidate()` again. This creates a React render + WebGL render double-cost per scroll.

**3. Post-processing overhead (4 shader passes)**
`EffectComposer` runs Vignette + BrightnessContrast + HueSaturation + Grain = 4 full-screen shader passes every frame. At high DPR this is significant GPU time.

**4. `matrixAutoUpdate = false` without manual updates**
GLB loader sets `mesh.matrixAutoUpdate = false` (line 52) but the animation functions mutate `position`/`rotation` without calling `updateMatrix()`. Three.js silently skips these transforms, causing invisible objects or stale matrices. The GPU still processes draw calls for invisible geometry.

**5. SoftShadows with per-frame overhead**
`SoftShadows` with 4 samples adds shadow-map processing overhead each frame.

---

### Plan

#### Fix 1: Smart invalidation (biggest win)
**File: `HeroStageWebGL.tsx`** — Replace the unconditional `invalidate()` with conditional logic:
- Only invalidate if: pointer moved, camera hasn't converged, OR float animations are active
- Add an `isIdle` check: when no scroll, no pointer movement, and camera has converged → stop rendering entirely
- Remove the `!reducedMotion` always-true invalidation

#### Fix 2: Throttle React re-renders from scroll
**File: `use-dossier-progress.ts`** — Use a ref-based approach:
- Store progress/phase/localProgress in a `useRef` instead of `useState`
- Only `setState` when `phase` changes (discrete event, ~5 times total)
- Expose a `progressRef` that the WebGL scene reads directly in `useFrame`, bypassing React entirely

**File: `HeroStageWebGL.tsx`** — Read progress from ref instead of props where possible

#### Fix 3: Reduce post-processing to 1 pass
**File: `HeroStageWebGL.tsx`**:
- Remove `Vignette` and `GrainEffect` entirely (subtle effects, high cost)
- Keep only `BrightnessContrast` + `HueSaturation` (these can be combined into a single pass by the EffectComposer)
- On non-high-perf devices, skip `EffectComposer` entirely

#### Fix 4: Fix matrixAutoUpdate
**File: `use-glb-loader.ts`** — Remove `mesh.matrixAutoUpdate = false` since we're animating positions every frame. Alternatively, keep it and add `node.updateMatrix()` calls in the animation functions, but that adds complexity for marginal gain.

#### Fix 5: Disable SoftShadows, use basic shadows
**File: `HeroStageWebGL.tsx`** — Remove `<SoftShadows>` component. The shadow map at 256px with basic PCF is sufficient and saves a significant per-frame cost.

#### Fix 6: Lower DPR ceiling
**File: `HeroStageWebGL.tsx`** — Change `dpr={[1, 1.5]}` to `dpr={[1, 1]}` for consistent performance. At 120 FPS the pixel throughput doubles; lowering resolution compensates.

---

### Expected Impact

| Fix | FPS Gain | Effort |
|-----|----------|--------|
| Smart invalidation | +30-50% (stops wasted frames) | Medium |
| Throttle React re-renders | +10-15% (fewer reconciliations) | Medium |
| Reduce post-processing | +15-20% (fewer GPU passes) | Small |
| Fix matrixAutoUpdate | +5% (correct rendering) | Small |
| Remove SoftShadows | +5-10% | Trivial |
| Lower DPR | +10-20% | Trivial |

### Files

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | Smart invalidation, remove SoftShadows/Vignette/Grain, lower DPR |
| `use-dossier-progress.ts` | Ref-based progress, setState only on phase change |
| `use-glb-loader.ts` | Remove `matrixAutoUpdate = false` |

