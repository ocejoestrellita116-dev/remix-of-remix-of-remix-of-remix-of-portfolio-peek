import React from 'react';
import { Environment } from '@react-three/drei';
import { LIGHTING, ENVIRONMENT } from './hero-scene.config';

/**
 * Environment map + three-point lighting setup.
 * Pure presentational — reads entirely from hero-scene.config.
 */
export const SceneLighting = React.memo(function SceneLighting() {
  return (
    <>
      <Environment
        preset={ENVIRONMENT.preset}
        environmentIntensity={ENVIRONMENT.intensity}
        backgroundBlurriness={ENVIRONMENT.backgroundBlurriness}
        background={ENVIRONMENT.background}
      />

      <ambientLight intensity={LIGHTING.ambient.intensity} />

      <directionalLight
        position={LIGHTING.key.position}
        intensity={LIGHTING.key.intensity}
        color={LIGHTING.key.color}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={LIGHTING.key.shadowBias}
      />

      <directionalLight
        position={LIGHTING.fill.position}
        intensity={LIGHTING.fill.intensity}
        color={LIGHTING.fill.color}
      />

      <directionalLight
        position={LIGHTING.rim.position}
        intensity={LIGHTING.rim.intensity}
        color={LIGHTING.rim.color}
      />
    </>
  );
});
