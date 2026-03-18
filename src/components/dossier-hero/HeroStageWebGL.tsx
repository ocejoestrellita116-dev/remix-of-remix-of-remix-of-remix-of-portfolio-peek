import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { DossierPhaseId, DossierProgressState } from './dossier-hero.types';
import { CAMERA_DEFAULTS } from './hero-scene.config';
import { useGLBScene } from './use-glb-loader';
import { useExperience } from '../experience/ExperienceProvider';
import { useSceneCamera } from './use-scene-camera';
import { useSceneAnimation } from './use-scene-animation';
import { useInvalidateOnInteraction } from './use-invalidate-on-interaction';
import { useThemeBackground } from './use-theme-background';
import { SceneLighting } from './SceneLighting';

/* ─── Props ─── */

interface StageProps {
  progressRef: React.RefObject<DossierProgressState>;
  phase: DossierPhaseId;
  onCriticalMissing?: () => void;
}

/* ─── Scene content (orchestrator) ─── */

function SceneContent({ progressRef, phase, onCriticalMissing }: StageProps) {
  const { pointerRef, isTouch, reducedMotion } = useExperience();
  const { camera } = useThree();
  const { nodes, grouped, loaded, criticalMissing } = useGLBScene();

  // Hooks
  const { updateCamera, isCameraCoasting } = useSceneCamera();
  const { sceneRef, heroArtifactRef, supportRef, updateAnimation } = useSceneAnimation({ nodes, loaded });
  const invalidate = useInvalidateOnInteraction();
  useThemeBackground();

  useEffect(() => {
    if (criticalMissing && onCriticalMissing) onCriticalMissing();
  }, [criticalMissing, onCriticalMissing]);

  const prevPtr = useRef({ x: 0.5, y: 0.5 });
  const prevProgress = useRef(0);

  useFrame((state, delta) => {
    if (!loaded) return;

    const prog = progressRef.current;
    const progress = prog.progress;
    const p = pointerRef.current;
    const ptrX = isTouch ? 0.5 : p.lerpX;
    const ptrY = isTouch ? 0.5 : p.lerpY;

    // 1. Camera
    updateCamera(camera, progress, ptrX, ptrY, delta);

    // 2. Object + pointer + secondary animation
    const isFullFrame = updateAnimation(
      prog.phase, prog.localProgress, ptrX, ptrY, delta,
      state.clock.elapsedTime, isTouch, reducedMotion,
    );

    // 3. Invalidation check
    const pointerMoved = Math.abs(ptrX - prevPtr.current.x) > 0.0008 || Math.abs(ptrY - prevPtr.current.y) > 0.0008;
    const progressChanged = Math.abs(progress - prevProgress.current) > 0.0005;
    const hasFloatingNodes = !reducedMotion && isFullFrame;

    if (pointerMoved || isCameraCoasting() || progressChanged || hasFloatingNodes) {
      invalidate();
    }

    prevPtr.current.x = ptrX;
    prevPtr.current.y = ptrY;
    prevProgress.current = progress;
  });

  return (
    <>
      <SceneLighting />

      <group ref={sceneRef}>
        <group ref={heroArtifactRef}>
          {loaded && grouped.heroArtifact.map((node, i) => (
            <primitive key={`hero-${i}`} object={node} />
          ))}
        </group>
        <group ref={supportRef}>
          {loaded && grouped.support.map((node, i) => (
            <primitive key={`support-${i}`} object={node} />
          ))}
        </group>
        <group>
          {loaded && grouped.atmosphere.map((node, i) => (
            <primitive key={`atmo-${i}`} object={node} />
          ))}
        </group>
      </group>

      <EffectComposer multisampling={4}>
        <BrightnessContrast brightness={-0.03} contrast={0.08} />
        <HueSaturation hue={0} saturation={0.03} />
      </EffectComposer>
    </>
  );
}

/* ─── Exported Canvas wrapper ─── */

export const HeroStageWebGL = React.memo(function HeroStageWebGL(props: StageProps) {
  return (
    <div className="absolute inset-0" style={{ willChange: 'transform', contain: 'strict' }}>
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        camera={{
          fov: CAMERA_DEFAULTS.fov,
          near: CAMERA_DEFAULTS.near,
          far: CAMERA_DEFAULTS.far,
          position: CAMERA_DEFAULTS.position,
        }}
        shadows
        style={{ position: 'absolute', inset: 0 }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
});
