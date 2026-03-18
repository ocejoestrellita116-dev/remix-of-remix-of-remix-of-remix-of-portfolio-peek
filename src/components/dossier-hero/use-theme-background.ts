import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT } from './hero-scene.config';

/**
 * Syncs scene.background with the current light/dark theme
 * by observing the class attribute on <html>.
 */
export function useThemeBackground() {
  const { scene } = useThree();

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const isDark = root.classList.contains('dark');
      scene.background = new THREE.Color(isDark ? ENVIRONMENT.sceneBackgroundDark : ENVIRONMENT.sceneBackground);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [scene]);
}
