import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { DossierPhaseId } from './dossier-hero.types';
import {
  PHASE_SCENE,
  SCENE_LERP,
  POINTER_RANGES,
  NODE_BEHAVIOUR,
  type PhaseSceneState,
  type SemanticNodeKey,
} from './hero-scene.config';
import type { SemanticNodes, GroupedNodes } from './use-glb-loader';

/* ─── Phase keys (stable order) ─── */
const PHASE_KEYS = Object.keys(PHASE_SCENE) as DossierPhaseId[];

/* ─── Pre-allocated target state ─── */
const _targetState: PhaseSceneState = { ...PHASE_SCENE.closed };
const INITIAL_STATE: PhaseSceneState = { ...PHASE_SCENE.closed };

/* ─── Node key cache ─── */
let _cachedNodeKeys: string[] | null = null;
function getNodeKeys(nodes: SemanticNodes): string[] {
  if (!_cachedNodeKeys) _cachedNodeKeys = Object.keys(nodes);
  return _cachedNodeKeys;
}

/* ─── Pure math helpers ─── */

function lerpStateInPlace(out: PhaseSceneState, a: PhaseSceneState, b: PhaseSceneState, t: number): void {
  const l = THREE.MathUtils.lerp;
  out.sceneTiltMultiplier = l(a.sceneTiltMultiplier, b.sceneTiltMultiplier, t);
  out.heroArtifactY = l(a.heroArtifactY, b.heroArtifactY, t);
  out.heroArtifactScale = l(a.heroArtifactScale, b.heroArtifactScale, t);
  out.supportY = l(a.supportY, b.supportY, t);
  out.supportSpread = l(a.supportSpread, b.supportSpread, t);
  out.atmosphereOpacity = l(a.atmosphereOpacity, b.atmosphereOpacity, t);
  out.orbGlow = l(a.orbGlow, b.orbGlow, t);
}

function applyObjectMotion(
  current: PhaseSceneState,
  target: PhaseSceneState,
  delta: number,
  heroArtifactRef: React.RefObject<THREE.Group | null>,
  supportRef: React.RefObject<THREE.Group | null>,
  ptrX: number,
  ptrY: number,
) {
  const lerpAmt = 1 - Math.pow(1 - SCENE_LERP, delta * 60);
  const l = THREE.MathUtils.lerp;
  const s = current;

  s.sceneTiltMultiplier = l(s.sceneTiltMultiplier, target.sceneTiltMultiplier, lerpAmt);
  s.heroArtifactY = l(s.heroArtifactY, target.heroArtifactY, lerpAmt);
  s.heroArtifactScale = l(s.heroArtifactScale, target.heroArtifactScale, lerpAmt);
  s.supportY = l(s.supportY, target.supportY, lerpAmt);
  s.supportSpread = l(s.supportSpread, target.supportSpread, lerpAmt);
  s.atmosphereOpacity = l(s.atmosphereOpacity, target.atmosphereOpacity, lerpAmt);
  s.orbGlow = l(s.orbGlow, target.orbGlow, lerpAmt);

  if (heroArtifactRef.current) {
    heroArtifactRef.current.position.y = s.heroArtifactY;
    const sc = s.heroArtifactScale;
    heroArtifactRef.current.scale.set(sc, sc, sc);
    heroArtifactRef.current.rotation.y = (ptrX - 0.5) * POINTER_RANGES.artifactTiltY;
    heroArtifactRef.current.rotation.x = (ptrY - 0.5) * -POINTER_RANGES.artifactTiltX;
  }

  if (supportRef.current) {
    supportRef.current.position.y = s.supportY;
    const sp = 1 + s.supportSpread;
    supportRef.current.scale.set(sp, 1, sp);
  }
}

function applyPointerMotion(
  sceneRef: React.RefObject<THREE.Group | null>,
  nodes: SemanticNodes,
  ptrX: number,
  ptrY: number,
  tiltMul: number,
  originals: Map<string, THREE.Vector3>,
) {
  if (sceneRef.current) {
    sceneRef.current.rotation.y = (ptrX - 0.5) * POINTER_RANGES.sceneTiltY * tiltMul;
    sceneRef.current.rotation.x = (ptrY - 0.5) * -POINTER_RANGES.sceneTiltX * tiltMul;
  }

  const keys = getNodeKeys(nodes);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    const node = nodes[key as SemanticNodeKey];
    if (!node) continue;
    const behaviour = NODE_BEHAVIOUR[key as SemanticNodeKey];
    if (!behaviour) continue;
    const orig = originals.get(key);
    if (!orig) continue;

    let xShift = 0;
    let zShift = 0;

    if (behaviour.pointerShift) {
      xShift = (ptrX - 0.5) * behaviour.pointerShift.x;
      zShift = (ptrY - 0.5) * behaviour.pointerShift.y;
    }

    if (behaviour.pointerTilt) {
      node.rotation.y = (ptrX - 0.5) * POINTER_RANGES.artifactTiltY;
      node.rotation.x = (ptrY - 0.5) * -POINTER_RANGES.artifactTiltX;
    }

    node.position.x = orig.x + xShift;
    node.position.z = orig.z + zShift;
  }
}

const orbLag = { x: 0.5, y: 0.5 };
const ORB_LAG_FACTOR = 0.03;
const ORB_LAG_RANGE = 0.12;

function applySecondaryMotion(
  nodes: SemanticNodes,
  elapsed: number,
  originals: Map<string, THREE.Vector3>,
  ptrX: number,
  ptrY: number,
) {
  orbLag.x += (ptrX - orbLag.x) * ORB_LAG_FACTOR;
  orbLag.y += (ptrY - orbLag.y) * ORB_LAG_FACTOR;

  const keys = getNodeKeys(nodes);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    const node = nodes[key as SemanticNodeKey];
    if (!node) continue;
    const behaviour = NODE_BEHAVIOUR[key as SemanticNodeKey];
    if (!behaviour) continue;
    const orig = originals.get(key);
    if (!orig) continue;

    let yOffset = 0;
    if (behaviour.float) {
      yOffset = Math.sin(elapsed * behaviour.float.speed * Math.PI * 2) * behaviour.float.amp;
    }


    if (yOffset !== 0) {
      node.position.y = orig.y + yOffset;
    }
  }
}

/* ─── Hook ─── */

interface UseSceneAnimationParams {
  nodes: SemanticNodes;
  loaded: boolean;
}

export function useSceneAnimation({ nodes, loaded }: UseSceneAnimationParams) {
  const sceneRef = useRef<THREE.Group>(null);
  const heroArtifactRef = useRef<THREE.Group>(null);
  const supportRef = useRef<THREE.Group>(null);
  const currentState = useRef<PhaseSceneState>({ ...INITIAL_STATE });
  const originalPositions = useRef<Map<string, THREE.Vector3>>(new Map());
  const frameCount = useRef(0);

  useEffect(() => {
    if (!loaded) return;
    _cachedNodeKeys = null;
    Object.entries(nodes).forEach(([key, node]) => {
      if (node) originalPositions.current.set(key, node.position.clone());
    });
  }, [loaded, nodes]);

  const updateAnimation = useCallback(
    (
      phase: DossierPhaseId,
      localProgress: number,
      ptrX: number,
      ptrY: number,
      delta: number,
      elapsed: number,
      isTouch: boolean,
      reducedMotion: boolean,
    ) => {
      // 1. Object animations
      const phaseIdx = PHASE_KEYS.indexOf(phase);
      const nextIdx = Math.min(phaseIdx + 1, PHASE_KEYS.length - 1);
      lerpStateInPlace(_targetState, PHASE_SCENE[phase], PHASE_SCENE[PHASE_KEYS[nextIdx]], localProgress);
      applyObjectMotion(currentState.current, _targetState, delta, heroArtifactRef, supportRef, ptrX, ptrY);

      // 2. Pointer motion
      if (!isTouch) {
        applyPointerMotion(sceneRef, nodes, ptrX, ptrY, currentState.current.sceneTiltMultiplier, originalPositions.current);
      }

      // 3. Secondary motion (skip odd frames for budget)
      frameCount.current++;
      const isFullFrame = frameCount.current % 2 === 0;
      if (!reducedMotion && isFullFrame) {
        applySecondaryMotion(nodes, elapsed, originalPositions.current, ptrX, ptrY);
      }

      return isFullFrame;
    },
    [nodes],
  );

  return { sceneRef, heroArtifactRef, supportRef, updateAnimation };
}
