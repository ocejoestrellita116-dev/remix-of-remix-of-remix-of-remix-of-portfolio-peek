import { useEffect, useState, useRef } from 'react';
import { useExperience } from './ExperienceProvider';
import { DOSSIER_PHASE_CONTENT } from '../dossier-hero/dossier-hero.content';

type EnterState = 'loading' | 'ready' | 'entering' | 'dismissed';

interface Props {
  loadProgress: number;
  loaded: boolean;
}

const BAIL_OUT_MS = 5000;

export function EnterScreen({ loadProgress, loaded }: Props) {
  const { reducedMotion, setEntered } = useExperience();
  const [state, setState] = useState<EnterState>('loading');
  const enterTimeout = useRef<ReturnType<typeof setTimeout>>();

  const content = DOSSIER_PHASE_CONTENT.closed;

  useEffect(() => {
    const bail = setTimeout(() => {
      setState((s) => (s === 'loading' ? 'ready' : s));
    }, BAIL_OUT_MS);
    return () => clearTimeout(bail);
  }, []);

  useEffect(() => {
    if (loaded && state === 'loading') {
      setState('ready');
    }
  }, [loaded, state]);

  useEffect(() => {
    if (reducedMotion && state === 'ready') {
      handleEnter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, state]);

  function handleEnter() {
    if (state !== 'ready') return;
    setState('entering');

    const duration = reducedMotion ? 200 : 900;
    enterTimeout.current = setTimeout(() => {
      setEntered(true);
      setState('dismissed');
    }, duration);
  }

  useEffect(() => {
    return () => {
      if (enterTimeout.current) clearTimeout(enterTimeout.current);
    };
  }, []);

  if (state === 'dismissed') return null;

  const isEntering = state === 'entering';
  const isReady = state === 'ready';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{
        opacity: isEntering ? 0 : 1,
        transition: `opacity ${reducedMotion ? 200 : 500}ms cubic-bezier(.16,1,.3,1) ${isEntering ? 100 : 0}ms`,
      }}
    >
      <div
        className="w-16 h-16 rounded-full border border-dossier-gold/30 flex items-center justify-center mb-5"
        style={{
          opacity: isEntering ? 0 : 1,
          transform: isEntering ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <span className="font-serif text-3xl text-dossier-gold/80 select-none">G</span>
      </div>

      <h1
        className="text-4xl md:text-5xl font-serif text-foreground mb-2 leading-none tracking-display"
        style={{
          opacity: isEntering ? 0 : 1,
          transform: isEntering ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        {content.headline}
      </h1>

      <p
        className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-sans mb-8"
        style={{
          opacity: isEntering ? 0 : 1,
          transition: 'opacity 200ms ease 50ms',
        }}
      >
        {content.eyebrow}
      </p>

      <button
        onClick={handleEnter}
        disabled={!isReady}
        className="px-6 py-3 text-sm font-sans font-medium border border-foreground/20 rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors duration-material focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        style={{
          opacity: isReady ? 1 : isEntering ? 0 : 0,
          transform: isReady ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 300ms cubic-bezier(.16,1,.3,1), transform 300ms cubic-bezier(.16,1,.3,1), background-color 200ms ease, color 200ms ease',
        }}
      >
        Enter
      </button>

      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40"
        style={{
          opacity: state === 'loading' ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      >
        <div className="h-[2px] bg-border/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-dossier-gold rounded-full"
            style={{
              width: `${Math.round(loadProgress * 100)}%`,
              transition: 'width 150ms ease',
            }}
          />
        </div>
        <p className="mt-2 text-[10px] tracking-label uppercase text-dossier-whisper font-sans text-center">
          {Math.round(loadProgress * 100)}%
        </p>
      </div>
    </div>
  );
}
