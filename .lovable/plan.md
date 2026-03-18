

## Baseline Report & Environment Audit

### 10.1.1 — Runtime Baseline

#### Hero Flow (current architecture)

```text
┌─────────────────────────────────────────────────────┐
│ EnterScreen (loading gate)                          │
│   └─ waits for GLB or frame-sequence ZIP            │
├─────────────────────────────────────────────────────┤
│ DossierHero (500vh scroll runway)                   │
│   ├─ WebGL path: HeroStageWebGL (R3F Canvas)        │
│   │   ├─ GLB: /hero/level-react-draco.glb           │
│   │   ├─ Camera: CatmullRom spline, 8 control pts   │
│   │   ├─ Post-processing: BrightnessContrast + Hue  │
│   │   ├─ Shadows: directional, 512px map            │
│   │   └─ frameloop="demand" + invalidate on scroll  │
│   │                                                  │
│   └─ 2D fallback: BookSequenceCanvas                 │
│       └─ ZIP: /frames/dossier-sequence.zip (WebP)    │
│                                                      │
│   Overlays: HeroOverlay, SpatialLayer, ProofStrip,   │
│             FlagshipTeaser, ScrollProgressBar         │
│                                                      │
│   5 phases: closed→open→flight→close→handoff         │
│   Progress: ref-based (setState only on phase change)│
├─────────────────────────────────────────────────────┤
│ CursorLayer (on-demand rAF, settles when idle)       │
│ SoundEngine (ZIP-loaded, WebAudio API)               │
│ Lenis smooth scroll                                  │
└─────────────────────────────────────────────────────┘
```

#### Asset Inventory

| Asset | Path | Purpose | Status |
|-------|------|---------|--------|
| `level-react-draco.glb` | `/hero/` | Primary hero 3D model (low-poly stylized room) | **Active** — loaded via `useGLTF` |
| `support-hero.glb` | `/hero/` | **Unknown / orphaned** — preloaded in `index.html` but **never imported in any source file** | **Dead weight** — only `<link rel="preload">` in HTML |
| `dossier-sequence.zip` | `/frames/` | WebP frame sequence for 2D fallback path | Active (fallback only) |
| `SND01_sine.zip` | `/sounds/` | Sound effects (ambient loop + one-shots) | Active |
| `placeholder.svg` | `/public/` | Generic placeholder | Likely unused |
| `favicon.ico` | `/public/` | Favicon | Active |

**Key finding**: `support-hero.glb` is preloaded in `index.html` (line 29) but **zero source files reference it**. It's downloaded on every page load for nothing. The actual model used is `level-react-draco.glb`.

**No 2D image assets exist** in the project — confirmed. No `.png`, `.jpg`, `.svg` imports in source (only `placeholder.svg` in public, unused). All visual content comes from GLB model or frame-sequence ZIP.

#### Dependency Weight Map

| Dependency | Used By | Actually Used? |
|------------|---------|----------------|
| `three` + `@react-three/fiber` + `@react-three/drei` | HeroStageWebGL | Yes — core hero |
| `@react-three/postprocessing` + `postprocessing` | HeroStageWebGL (2 effects) | Yes |
| `jszip` | Frame loader + Sound engine | Yes (2 consumers) |
| `lenis` | Smooth scroll | Yes |
| `gsap` | **Zero imports in src/** | **Dead dependency** |
| `@react-spring/three` | **Zero imports in src/** | **Dead dependency** |
| `recharts` | Only in `chart.tsx` (shadcn component, never imported by pages) | **Dead dependency** |
| `react-day-picker` + `date-fns` | Only in `calendar.tsx` (shadcn, never imported) | **Dead dependency** |
| `embla-carousel-react` | Only in `carousel.tsx` (shadcn, never imported) | Dead |
| `react-resizable-panels` | Only in `resizable.tsx` (shadcn, never imported) | Dead |
| `input-otp` | Only in `input-otp.tsx` (shadcn, never imported) | Dead |
| `vaul` | Only in `drawer.tsx` (shadcn, never imported) | Dead |
| `cmdk` | Only in `command.tsx` (shadcn, never imported) | Dead |
| `react-hook-form` + `@hookform/resolvers` + `zod` | Only in `form.tsx` (shadcn, never imported) | Dead |
| `next-themes` | Only in `sonner.tsx` | Technically used but minimal |

### 10.1.2 — Environment Cleanliness

#### Issues Blocking New Hero

1. **`support-hero.glb` ghost preload** — `index.html` preloads a GLB that no code uses. Wastes bandwidth, confuses asset strategy.

2. **6+ dead npm dependencies** — `gsap`, `@react-spring/three`, `recharts`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `react-resizable-panels`, `input-otp`, `vaul`, `cmdk`, `react-hook-form`, `@hookform/resolvers`, `zod` are installed but unused in actual page code. They bloat `node_modules` and may bleed into chunks.

3. **~20 unused shadcn/ui components** — `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `command.tsx`, `drawer.tsx`, `form.tsx`, `input-otp.tsx`, `resizable.tsx`, etc. These don't affect bundle (tree-shaken) but add codebase noise.

4. **`GrainEffect.ts` is orphaned** — was removed from `HeroStageWebGL.tsx` in earlier perf pass but the file still exists.

5. **`Preloader.tsx` is orphaned** — `EnterScreen.tsx` replaced it; `Preloader` is not imported anywhere.

6. **`hero-stage.config.ts` has stale config** — contains `PhaseSceneState` for the old 2D path (cameraZ, bookScale, bookY). The actual WebGL path uses `hero-scene.config.ts`. Two configs for the same concept.

7. **Vite `manualChunks` references `gsap`** — chunk splitting config in `vite.config.ts` has a dedicated `vendor-gsap` chunk for a dependency that's never imported.

8. **Build is stable** — no TypeScript errors blocking compilation (confirmed by prior runs).

### Plan: Cleanup Actions

| # | Action | File(s) |
|---|--------|---------|
| 1 | Remove `support-hero.glb` preload from HTML | `index.html` |
| 2 | Remove dead dependencies from `package.json` | `package.json` |
| 3 | Delete orphaned files: `GrainEffect.ts`, `Preloader.tsx`, `hero-stage.config.ts` | 3 files |
| 4 | Remove unused `vendor-gsap` chunk config | `vite.config.ts` |
| 5 | Optionally delete the `support-hero.glb` file itself (or keep as donor asset reference) | `public/hero/` |

These are safe, non-breaking changes that reduce confusion before architectural work begins.

