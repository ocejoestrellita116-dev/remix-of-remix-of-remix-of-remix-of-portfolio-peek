

## Phase 4 & 5: Bundle/Loading + React Performance

### 4.1 Vite Build Config (`vite.config.ts`)

Add `target: 'esnext'` for modern output and `experimentalMinChunkSize` to reduce tiny chunks. Note: `terser` requires installing `terser` as a dependency and slows builds — we'll use esbuild (Vite default) with `drop: ['console']` instead, which is faster and achieves the same result.

```ts
build: {
  target: 'esnext',
  rollupOptions: {
    output: {
      experimentalMinChunkSize: 10_000,
      manualChunks(id) { /* existing */ },
    },
  },
  // ...existing cssCodeSplit, chunkSizeWarningLimit
}
```

For console stripping in production (without terser):
```ts
esbuild: {
  drop: mode === 'production' ? ['console'] : [],
},
```

### 5.1 Wrap `HeroStageWebGL` in `React.memo` (`HeroStageWebGL.tsx`)

The exported component receives `progress`, `phase`, `localProgress` as props that change frequently — but `React.memo` still helps avoid re-renders when parent re-renders without prop changes (e.g. `DossierHero` state changes like `glbReady`, `sceneVisible`).

```ts
export const HeroStageWebGL = React.memo(function HeroStageWebGL(props: StageProps) {
  return <div className="absolute inset-0"><Canvas ...><SceneContent {...props} /></Canvas></div>;
});
```

### 5.2 Verify `use-experience-runtime.ts` — no changes needed

Already uses refs for pointer tracking and `useCallback` for all actions. No unnecessary re-renders detected.

### Files

| File | Changes |
|------|--------|
| `vite.config.ts` | Add `target: 'esnext'`, `esbuild.drop` for console removal, `experimentalMinChunkSize: 10_000` |
| `HeroStageWebGL.tsx` | Wrap export in `React.memo` |

