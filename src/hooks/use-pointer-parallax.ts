import { useRef, useEffect, useCallback } from 'react';
import type { PointerRef } from '@/components/experience/experience.types';

const SETTLE_THRESHOLD = 0.05; // px

/**
 * Drives a CSS `transform: translate(Xpx, Ypx)` on a container ref
 * from the mutable pointerRef, entirely via rAF — zero React re-renders.
 * On-demand: auto-starts on pointermove, auto-stops when settled.
 */
export function usePointerParallax(
  pointerRef: React.RefObject<PointerRef>,
  maxPx: number,
  disabled: boolean,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const running = useRef(false);
  const prevTx = useRef(0);
  const prevTy = useRef(0);

  const tick = useCallback(() => {
    if (elRef.current && !disabled) {
      const p = pointerRef.current;
      const tx = (p.lerpX - 0.5) * 2 * maxPx;
      const ty = (p.lerpY - 0.5) * 2 * maxPx;
      elRef.current.style.transform = `translate(${tx}px, ${ty}px)`;

      const dx = Math.abs(tx - prevTx.current);
      const dy = Math.abs(ty - prevTy.current);
      prevTx.current = tx;
      prevTy.current = ty;

      if (dx < SETTLE_THRESHOLD && dy < SETTLE_THRESHOLD) {
        running.current = false;
        return;
      }
    }
    rafId.current = requestAnimationFrame(tick);
  }, [pointerRef, maxPx, disabled]);

  useEffect(() => {
    if (disabled) return;
    const wake = () => {
      if (!running.current) {
        running.current = true;
        rafId.current = requestAnimationFrame(tick);
      }
    };
    window.addEventListener('pointermove', wake, { passive: true });
    return () => {
      window.removeEventListener('pointermove', wake);
      cancelAnimationFrame(rafId.current);
      running.current = false;
    };
  }, [disabled, tick]);

  return elRef;
}
