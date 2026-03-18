import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Wakes the demand frameloop on scroll and pointer-move so the
 * canvas re-renders immediately when the user interacts.
 */
export function useInvalidateOnInteraction() {
  const { invalidate } = useThree();

  useEffect(() => {
    const onScroll = () => invalidate();
    let ptrRaf = 0;
    const onPointerMove = () => {
      if (!ptrRaf) {
        ptrRaf = requestAnimationFrame(() => {
          invalidate();
          ptrRaf = 0;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(ptrRaf);
    };
  }, [invalidate]);

  return invalidate;
}
