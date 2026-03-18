

## Visual Quality Upgrade: Anisotropic Filtering + Multisampling

Two targeted changes based on your feedback.

### 1. Anisotropic Filtering — `use-glb-loader.ts`

Inside the existing mesh traversal (lines 48-58), after the `stdMat` enhancement block, add a loop over all texture map channels (`map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `emissiveMap`) with null-checks. For each texture found:
- `texture.anisotropy = 16` (hardcoded max — safe on all modern GPUs, avoids needing `gl` reference)
- `texture.minFilter = THREE.LinearMipmapLinearFilter`
- `texture.magFilter = THREE.LinearFilter`
- `texture.needsUpdate = true`

This fixes texture blur/shimmer at oblique angles with zero CPU cost.

### 2. Multisampling First, SMAA Later — `HeroStageWebGL.tsx`

Per your advice: try `multisampling={4}` alone first, skip SMAA to save 0.3ms.

- Line 378: Change `multisampling={0}` to `multisampling={4}`
- No SMAA import needed yet
- Canvas `antialias: true` stays as fallback for non-EffectComposer paths

### 3. Code Comments

Add a `BLENDER_FIX_CHECKLIST` comment block in `use-glb-loader.ts` documenting:
- Bevel shader bake (radius 0.002-0.005) for soft edges via normal maps
- AO bake into texture channel
- Draco: position quantization >= 14 bits, or consider Meshoptimizer (`EXT_meshopt_compression`) for cleaner geometry
- UV padding: 4-8px between islands

### Files
| File | Change |
|------|--------|
| `src/components/dossier-hero/use-glb-loader.ts` | Add anisotropic filtering + texture filter config on all mesh textures |
| `src/components/dossier-hero/HeroStageWebGL.tsx` | `multisampling={0}` → `multisampling={4}` |

