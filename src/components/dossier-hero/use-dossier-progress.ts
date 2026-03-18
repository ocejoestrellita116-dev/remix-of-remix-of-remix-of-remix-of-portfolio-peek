import { useEffect, useRef, useState, useCallback } from 'react';
import { PHASES } from './dossier-hero.config';
import type { DossierProgressState, DossierPhaseId } from './dossier-hero.types';

function getPhase(progress: number): { phase: DossierPhaseId; localProgress: number } {
  for (const p of PHASES) {
    if (progress >= p.range[0] && progress < p.range[1]) {
      const local = (progress - p.range[0]) / (p.range[1] - p.range[0]);
      return { phase: p.id, localProgress: Math.min(Math.max(local, 0), 1) };
    }
  }
  return { phase: 'handoff', localProgress: 1 };
}

/**
 * Scroll-driven progress for the dossier hero.
 *
 * Performance: progress/localProgress live in a ref to avoid React re-renders
 * on every scroll tick. Only discrete phase changes trigger a setState.
 * The WebGL scene reads `progressRef` directly inside useFrame.
 */
export function useDossierProgress(containerRef: React.RefObject<HTMLElement | null>) {
  const [phaseState, setPhaseState] = useState<DossierProgressState>({
    progress: 0,
    phase: 'closed',
    localProgress: 0,
  });

  /** Mutable ref updated every scroll tick — read this in useFrame for 0-cost access */
  const progressRef = useRef<DossierProgressState>({
    progress: 0,
    phase: 'closed',
    localProgress: 0,
  });

  const prev = useRef(-1);
  const prevPhase = useRef<DossierPhaseId>('closed');

  const calculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;
    const raw = Math.min(Math.max(-rect.top / scrollable, 0), 1);

    if (Math.abs(raw - prev.current) > 0.001) {
      prev.current = raw;
      const { phase, localProgress } = getPhase(raw);

      // Always update ref (zero-cost, no React render)
      progressRef.current.progress = raw;
      progressRef.current.phase = phase;
      progressRef.current.localProgress = localProgress;

      // Only setState when phase changes (discrete, ~5 times total)
      if (phase !== prevPhase.current) {
        prevPhase.current = phase;
        setPhaseState({ progress: raw, phase, localProgress });
      }
    }
  }, [containerRef]);

  useEffect(() => {
    window.addEventListener('scroll', calculate, { passive: true });
    calculate();
    return () => window.removeEventListener('scroll', calculate);
  }, [calculate]);

  return { ...phaseState, progressRef };
}
