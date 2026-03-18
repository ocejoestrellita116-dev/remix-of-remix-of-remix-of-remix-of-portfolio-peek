

## Plan: Remove Sound System + Improve 3D Scene Quality

### 1. Remove all sound code

**Files to delete:**
- `src/hooks/use-sound.ts`
- `src/hooks/use-sound-engine.ts`

**Files to edit:**

| File | Change |
|------|--------|
| `ExperienceProvider.tsx` | Remove `useSoundEngine`, `SoundContext` imports and provider wrapper |
| `DossierHero.tsx` | Remove `useSound` import, `sound` variable, `sound.setAmbient()` call, phase-change sound effect |
| `EnterScreen.tsx` | Remove `useSound` import, `sound.init()` and `sound.play()` calls |
| `ThemeToggle.tsx` | Remove `useSound` import and `sound.play()` call |

**Asset to remove (optional):**
- `public/sounds/SND01_sine.zip`

**Dependency:** Remove `jszip` from `package.json` if no other file uses it.

---

### 2. Improve 3D scene visual quality

The screenshots show low-res textures and aliased edges. Changes:

**`HeroStageWebGL.tsx`:**
- Enable antialiasing: `antialias: true` (currently `false`)
- Increase DPR: `dpr={[1.5, 2]}` (currently `[1, 1.5]`)
- Increase shadow map size in config from `256` to `1024`
- Increase tone mapping exposure slightly: `1.6` (from `1.5`)

**`hero-scene.config.ts`:**
- `shadowMapSize: 1024` (was `256`)
- Increase ambient light to `0.65` (was `0.55`) for better fill
- Increase environment intensity to `0.6` (was `0.4`) for richer reflections

**`use-glb-loader.ts`:**
- Enhance material quality: increase `envMapIntensity` to `1.5`, reduce roughness more aggressively for smoother surfaces
- Enable anisotropic filtering on textures if available

