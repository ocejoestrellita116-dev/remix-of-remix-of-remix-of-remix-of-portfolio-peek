import { createContext, useContext, type ReactNode } from 'react';
import type { ExperienceContextValue } from './experience.types';
import { useExperienceRuntime } from './use-experience-runtime';

export const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const runtime = useExperienceRuntime();

  return (
    <ExperienceContext.Provider value={runtime}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used within <ExperienceProvider>');
  return ctx;
}
