

## Phase 1: WebGL Performance Optimizations for 120 FPS

Three targeted changes across 2 files.

### 1.1 Adaptive Post-Processing (`HeroStageWebGL.tsx`)

Detect performance tier via `navigator.hardwareConcurrency` and conditionally reduce effects:
- **High-perf** (≥8 cores): full pipeline (Vignette + BrightnessContrast + HueSaturation + Grain)
- **Low-perf** (<8 cores): skip Vignette and Grain, keep only BrightnessContrast + HueSaturation

Add a `useMemo` for `isHighPerf` check. Conditionally render effects inside `EffectComposer`. Also conditionally create the `GrainEffect` only when needed.

### 1.2 Shadow Quality Reduction (`hero-scene.config.ts`)

- `shadowMapSize`: 512 → 256
- `SoftShadows samples`: 6 → 4

### 1.3 Mesh Optimization (`use-glb-loader.ts`)

Inside the existing `scene.traverse` block, after material enhancement, add:
- `mesh.frustumCulled = true` (explicit)
- `mesh.matrixAutoUpdate = false` (manual updates only — already handled by baked transforms)

### Files changed

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | Performance tier detection; conditional Vignette/Grain rendering; SoftShadows samples 6→4 |
| `hero-scene.config.ts` | `shadowMapSize` 512→256 |
| `use-glb-loader.ts` | Add `frustumCulled = true`, `matrixAutoUpdate = false` on meshes |

