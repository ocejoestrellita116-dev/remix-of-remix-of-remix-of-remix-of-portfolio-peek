

## Phase 2 & 3: Render Loop + Canvas Optimizations

### 2.1 Frame Budget — Skip expensive ops on alternate frames (`HeroStageWebGL.tsx`)

Add `frameCount` ref. Run `applySecondaryMotion` only every 2nd frame (camera + object motion still runs every frame for smoothness):

```ts
const frameCount = useRef(0);
// inside useFrame:
frameCount.current++;
const isFullFrame = frameCount.current % 2 === 0;
// wrap secondary motion:
if (!reducedMotion && isFullFrame) { applySecondaryMotion(...); }
```

### 2.2 Invalidation Threshold (`HeroStageWebGL.tsx`)

Line 297 — increase pointer movement threshold from `0.0005` to `0.002` to reduce unnecessary invalidations at 120 Hz:

```ts
const pointerMoved = Math.abs(ptrX - prevPtr.current.x) > 0.002 || 
                     Math.abs(ptrY - prevPtr.current.y) > 0.002;
```

### 3.1 BookSequenceCanvas — Cache context + disable alpha (`BookSequenceCanvas.tsx`)

Cache the 2D context in a ref instead of calling `getContext('2d')` every draw. Pass `{ alpha: false }` to skip compositing overhead:

```ts
const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
// in draw():
if (!ctxRef.current) {
  ctxRef.current = canvas.getContext('2d', { alpha: false });
}
const ctx = ctxRef.current;
```

### Files

| File | Changes |
|------|---------|
| `HeroStageWebGL.tsx` | Add frameCount ref, skip secondary motion on odd frames, widen invalidation threshold |
| `BookSequenceCanvas.tsx` | Cache 2D context in ref, pass `{ alpha: false }` |

