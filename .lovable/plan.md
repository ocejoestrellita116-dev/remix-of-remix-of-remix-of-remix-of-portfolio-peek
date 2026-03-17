

# Soft Shadows + Remaining Frontend Optimizations

## 1. Add `softShadows()` from drei

Call `softShadows()` once at module level in `HeroStageWebGL.tsx` to patch Three.js shadow shaders with PCF soft sampling. This hides the staircase artifacts from the 512px shadow map with minimal GPU cost.

```ts
import { softShadows } from '@react-three/drei';
softShadows({ size: 10, focus: 0.5, samples: 6 });
```

Place this at module scope (outside any component), before the `SceneContent` function.

**Files:** `HeroStageWebGL.tsx` — add import + one-line call.

## 2. Phase 3 Applicability

**Step 7 (Bundle/Loading):** Already implemented in prior phases — code splitting, lazy imports, resource hints, render-blocking font fix, tree shaking via Vite, manual chunks.

**Step 8 (CDN/Edge):** Not actionable here — CDN config, HTTP/2/3, Brotli, and geographic distribution are deployment infrastructure concerns outside the codebase. Lovable's preview hosting handles this automatically.

**Step 9 (Mobile/PWA):** The app already has touch detection (`isTouch` disabling pointer parallax), capped DPR, and `reducedMotion` support. A service worker or PWA manifest could be added but is not a performance bottleneck for a portfolio site. No long lists exist that need virtual scrolling.

**Net result:** Only the soft shadows change is needed from this phase. The rest is either done or not applicable.

