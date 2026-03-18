import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { CAMERA_CURVE_POINTS, LOOKAT_CURVE_POINTS, POINTER_RANGES } from './hero-scene.config';

/* Pre-allocated vectors — reused every frame */
const _camPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();
const _smoothCamPos = new THREE.Vector3(0, 3, 8);
const _smoothLookAt = new THREE.Vector3(0, 1, 0);

/**
 * Camera spline + pointer offset + smooth inertia.
 * Returns an `updateCamera` function to call inside useFrame.
 */
export function useSceneCamera() {
  const { cameraCurve, lookAtCurve } = useMemo(() => {
    const camPts = CAMERA_CURVE_POINTS.map(p => new THREE.Vector3(...p));
    const lookPts = LOOKAT_CURVE_POINTS.map(p => new THREE.Vector3(...p));
    return {
      cameraCurve: new THREE.CatmullRomCurve3(camPts, false, 'centripetal', 0.5),
      lookAtCurve: new THREE.CatmullRomCurve3(lookPts, false, 'centripetal', 0.5),
    };
  }, []);

  const updateCamera = useCallback(
    (camera: THREE.Camera, progress: number, ptrX: number, ptrY: number, delta: number) => {
      const raw = THREE.MathUtils.clamp(progress, 0, 1);
      const t = raw < 0.5
        ? 4 * raw * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 3) / 2;

      cameraCurve.getPointAt(t, _camPos);
      lookAtCurve.getPointAt(t, _lookAtPos);

      const px = (ptrX - 0.5) * POINTER_RANGES.cameraPointerX;
      const py = (ptrY - 0.5) * -POINTER_RANGES.cameraPointerY;

      const camLerp = 1 - Math.pow(1 - 0.12, delta * 60);
      _smoothCamPos.lerp(_camPos, camLerp);
      _smoothLookAt.lerp(_lookAtPos, camLerp);

      (camera as THREE.PerspectiveCamera).position.set(
        _smoothCamPos.x + px,
        _smoothCamPos.y + py,
        _smoothCamPos.z,
      );
      camera.lookAt(_smoothLookAt.x, _smoothLookAt.y, _smoothLookAt.z);
    },
    [cameraCurve, lookAtCurve],
  );

  /** Check if camera is still coasting toward its target */
  const isCameraCoasting = useCallback(() => {
    const camDist = _smoothCamPos.distanceToSquared(_camPos);
    const lookDist = _smoothLookAt.distanceToSquared(_lookAtPos);
    return camDist > 0.00001 || lookDist > 0.00001;
  }, []);

  return { updateCamera, isCameraCoasting };
}
