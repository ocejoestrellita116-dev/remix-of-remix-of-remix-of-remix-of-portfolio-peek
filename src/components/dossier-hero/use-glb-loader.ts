import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Object3D } from 'three';
import { GLB_URL, NODE_MAP, NODE_BEHAVIOUR, GROUP_ASSIGNMENT, type SemanticNodeKey, type SceneGroupId } from './hero-scene.config';

export type SemanticNodes = Partial<Record<SemanticNodeKey, Object3D>>;
export type GroupedNodes = Record<SceneGroupId, Object3D[]>;

const CRITICAL_NODES: SemanticNodeKey[] = ['levelBase', 'sudo'];

interface GLBLoaderResult {
  nodes: SemanticNodes;
  grouped: GroupedNodes;
  loaded: boolean;
  criticalMissing: boolean;
}

const EMPTY_GROUPED: GroupedNodes = { heroArtifact: [], support: [], atmosphere: [] };

/**
 * Loads the hero GLB, extracts named nodes, detaches them from the GLB
 * scene graph (baking world transforms), and groups them by scene group.
 */
export function useGLBScene(): GLBLoaderResult {
  const { scene } = useGLTF(GLB_URL);
  const [result, setResult] = useState<GLBLoaderResult>({ nodes: {}, grouped: EMPTY_GROUPED, loaded: false, criticalMissing: false });

  useEffect(() => {
    if (!scene) return;

    const nodes: SemanticNodes = {};
    const grouped: GroupedNodes = { heroArtifact: [], support: [], atmosphere: [] };

    // Walk scene graph and map Blender names → semantic keys
    scene.traverse((child) => {
      const semantic = (NODE_MAP as Record<string, SemanticNodeKey>)[child.name];
      if (semantic) {
        nodes[semantic] = child;

        // Apply shadow flags from config
        const behaviour = NODE_BEHAVIOUR[semantic];
        if (behaviour) {
          if (behaviour.castShadow && 'castShadow' in child) child.castShadow = true;
          if (behaviour.receiveShadow && 'receiveShadow' in child) child.receiveShadow = true;
        }

        // Material enhancement: ensure PBR materials respond to environment
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.frustumCulled = true;
          const mat = mesh.material;
          if (mat && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const stdMat = mat as THREE.MeshStandardMaterial;

            // Keep GLB-authored values, only clamp extreme specular response
            if (stdMat.roughness < 0.08) stdMat.roughness = 0.08;
            if (stdMat.metalness > 0.75) stdMat.metalness = 0.75;

            // Render front faces only to avoid bright back-face edge artifacts
            stdMat.side = THREE.FrontSide;

            // Per-node polygon offset (small values only, disabled for base mesh)
            const nodeBehaviour = NODE_BEHAVIOUR[semantic];
            const offsetFactor = nodeBehaviour?.polygonOffsetFactor ?? 0;
            if (offsetFactor !== 0) {
              stdMat.polygonOffset = true;
              stdMat.polygonOffsetFactor = offsetFactor;
              stdMat.polygonOffsetUnits = 0.5;
            } else {
              stdMat.polygonOffset = false;
            }

            // Preserve GLTF texture filtering to avoid UV seam bleeding in mip levels
            const TEX_KEYS: (keyof THREE.MeshStandardMaterial)[] = [
              'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap',
            ];
            for (const key of TEX_KEYS) {
              const tex = stdMat[key] as THREE.Texture | null;
              if (tex) tex.needsUpdate = true;
            }

            stdMat.needsUpdate = true;
          }
        }
      }
    });

    // Detach nodes from GLB parent, bake world transforms
    Object.entries(nodes).forEach(([key, node]) => {
      if (!node) return;

      // Bake world transform before detaching
      node.updateWorldMatrix(true, false);
      const worldMatrix = new THREE.Matrix4();
      worldMatrix.copy(node.matrixWorld);
      node.removeFromParent();
      // Apply baked world transform as local
      node.matrix.copy(worldMatrix);
      node.matrix.decompose(node.position, node.quaternion, node.scale);

      const semanticKey = key as SemanticNodeKey;
      const behaviour = NODE_BEHAVIOUR[semanticKey];
      if (behaviour?.positionOffset) {
        node.position.x += behaviour.positionOffset.x ?? 0;
        node.position.y += behaviour.positionOffset.y ?? 0;
        node.position.z += behaviour.positionOffset.z ?? 0;
      }

      // Assign to group and stabilize draw order by depth layer
      const groupId = GROUP_ASSIGNMENT[semanticKey];
      if (groupId) {
        node.renderOrder = groupId === 'heroArtifact' ? 1 : groupId === 'support' ? 2 : 3;
        grouped[groupId].push(node);
      }
    });

    const missing = CRITICAL_NODES.filter(k => !nodes[k]);
    if (missing.length > 0) {
      console.warn(`[GLB] Critical nodes missing: ${missing.join(', ')}. Falling back to 2D sequence.`);
    }
    setResult({ nodes, grouped, loaded: Object.keys(nodes).length > 0, criticalMissing: missing.length > 0 });
  }, [scene]);

  return result;
}

// Deferred preload — schedule after initial paint to avoid blocking FCP
if (typeof window !== 'undefined') {
  const schedulePreload = () => useGLTF.preload(GLB_URL);
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(schedulePreload);
  } else {
    setTimeout(schedulePreload, 100);
  }
}
