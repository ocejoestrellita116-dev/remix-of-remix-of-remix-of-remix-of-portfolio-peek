

## Refactoring Plan: HeroStageWebGL.tsx

The primary target is `HeroStageWebGL.tsx` (414 lines). `SceneContent` is a monolith mixing camera logic, object animation, pointer motion, secondary motion, invalidation strategy, lighting, and scene graph rendering. The other files (`DossierHero.tsx`, `CursorLayer.tsx`, `use-experience-runtime.ts`, `use-pointer-parallax.ts`, `use-dossier-progress.ts`) are already well-modularized and need no changes.

### What moves where

#### 1. Extract `useSceneCamera` hook
**From**: `SceneContent` lines 190-287 (curve creation, camera spline sampling, pointer offset, smooth inertia)
**To**: `src/components/dossier-hero/use-scene-camera.ts`

Contains:
- `useMemo` for `cameraCurve` / `lookAtCurve` (CatmullRom creation)
- Pre-allocated vectors (`_camPos`, `_lookAtPos`, `_smoothCamPos`, `_smoothLookAt`)
- `updateCamera(camera, progress, ptrX, ptrY, delta)` function returned for use in `useFrame`

#### 2. Extract `useSceneAnimation` hook
**From**: `SceneContent` lines 59-176 + 289-305 (all the `apply*Motion` functions and the refs they operate on)
**To**: `src/components/dossier-hero/use-scene-animation.ts`

Contains:
- `lerpStateInPlace`, `applyObjectMotion`, `applyPointerMotion`, `applySecondaryMotion` — moved as module-private functions
- `orbLag` state, `_targetState`, `INITIAL_STATE`, node key cache
- Returns `{ updateAnimation(phase, localProgress, ptrX, ptrY, delta, elapsed, isTouch, reducedMotion) }` — a single function called from `useFrame`
- Takes `nodes`, `grouped` as params (from `useGLBScene`)

#### 3. Extract `useInvalidateOnInteraction` hook
**From**: `SceneContent` lines 232-251 (scroll + pointermove listeners that wake `frameloop="demand"`)
**To**: `src/components/dossier-hero/use-invalidate-on-interaction.ts`

Simple hook: takes `invalidate` from `useThree`, attaches scroll + throttled pointermove listeners.

#### 4. Extract `SceneLighting` sub-component
**From**: `SceneContent` JSX lines 326-358 (Environment + 3 directional lights + ambient)
**To**: `src/components/dossier-hero/SceneLighting.tsx`

Pure presentational component reading from `LIGHTING` and `ENVIRONMENT` config. No props needed.

#### 5. Extract `useThemeBackground` hook
**From**: `SceneContent` lines 199-209 (MutationObserver on `<html>` class for dark/light background)
**To**: `src/components/dossier-hero/use-theme-background.ts`

Takes `scene` from `useThree`, syncs `scene.background` to theme.

#### 6. Simplified `SceneContent` remains in `HeroStageWebGL.tsx`
After extractions, `SceneContent` becomes a ~60-line orchestrator:
- Calls `useGLBScene()`, `useSceneCamera()`, `useSceneAnimation(nodes)`, `useInvalidateOnInteraction()`, `useThemeBackground()`
- Single `useFrame` that calls `updateCamera(...)` and `updateAnimation(...)` + invalidation check
- JSX: `<SceneLighting />` + scene group with primitives + `<EffectComposer>`

### Files created (5 new)
| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `use-scene-camera.ts` | ~60 | Camera spline + pointer offset + inertia |
| `use-scene-animation.ts` | ~140 | All object/pointer/secondary motion |
| `use-invalidate-on-interaction.ts` | ~25 | Wake demand frameloop |
| `use-theme-background.ts` | ~20 | Dark/light scene.background sync |
| `SceneLighting.tsx` | ~40 | Environment + lights JSX |

### Files modified (1)
| File | Change |
|------|--------|
| `HeroStageWebGL.tsx` | Reduced from ~414 to ~90 lines; imports new hooks/components |

### Not touched
- `DossierHero.tsx` — already clean (119 lines, clear responsibilities)
- `CursorLayer.tsx` — already well-structured with on-demand rAF
- `use-experience-runtime.ts` — single-responsibility runtime hook
- `use-pointer-parallax.ts` — small, focused utility
- `use-dossier-progress.ts` — clean scroll-progress hook
- `hero-scene.config.ts` — config-only, no logic to extract

### Behavioral parity guarantee
No new features, no UI changes. All animation math, thresholds, easing curves, and config values remain identical. The `useFrame` call order stays the same (camera → objects → pointer → secondary → invalidation check).

