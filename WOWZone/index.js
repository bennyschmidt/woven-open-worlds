import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { WORLD_CONFIG } from '..';
import WOWZoneChunk from '../WOWZoneChunk';
import WOWWater from '../WOWWater';
import Model from '../../../Components/Model';

const RENDER_DISTANCE = 512;
const RENDER_DISTANCE_SQ = RENDER_DISTANCE * RENDER_DISTANCE;
const SEA_LEVEL = -5;

/**
 * WOWZone
 * Represents one 533.33 yard tile.
 * Manages 16x16 WOWZoneChunks.
 */

export default function WOWZone ({ x, z, terrainData, textureData, positionRef, models = [], isEditor = false, fogType = 'Light' }) {
  const lastCheck = useRef(0);

  // Scene refs

  const chunkRefs = useRef([]);
  const modelRefs = useRef([]);
  const waterRefs = useRef([]);

  const zoneOffset = useMemo(() => {
    const centerX = (x - WORLD_CONFIG.GRID_SIZE / 2) * WORLD_CONFIG.ZONE_SIZE;
    const centerZ = (z - WORLD_CONFIG.GRID_SIZE / 2) * WORLD_CONFIG.ZONE_SIZE;

    return new THREE.Vector3(centerX, 0, centerZ);
  }, [x, z]);

  const chunkMetadata = useMemo(() => {
    const data = [];

    for (let row = 0; row < WORLD_CONFIG.CHUNKS_PER_ZONE; row++) {
      for (let col = 0; col < WORLD_CONFIG.CHUNKS_PER_ZONE; col++) {
        const id = `${row}-${col}`;
        const localX = (col - WORLD_CONFIG.CHUNKS_PER_ZONE / 2 + 0.5) * WORLD_CONFIG.CHUNK_SIZE;
        const localZ = (row - WORLD_CONFIG.CHUNKS_PER_ZONE / 2 + 0.5) * WORLD_CONFIG.CHUNK_SIZE;

        data.push({
          id,
          worldX: zoneOffset.x + localX,
          worldZ: zoneOffset.z + localZ,
          localPos: [localX, 0, localZ]
        });
      }
    }

    return data;
  }, [zoneOffset]);

  // Pre-calculate water rendering

  const waterMetadata = useMemo(() => {
    const coords = [];
    const step = WORLD_CONFIG.CHUNK_SIZE;

    for (let lx = -WORLD_CONFIG.ZONE_SIZE; lx <= WORLD_CONFIG.ZONE_SIZE; lx += step) {
      for (let lz = -WORLD_CONFIG.ZONE_SIZE; lz <= WORLD_CONFIG.ZONE_SIZE; lz += step) {
        coords.push({
          localPos: [lx + step / 2, SEA_LEVEL, lz + step / 2],
          worldX: zoneOffset.x + lx + step / 2,
          worldZ: zoneOffset.z + lz + step / 2
        });
      }
    }

    return coords;
  }, [zoneOffset]);

  useEffect(() => {
    lastCheck.current = 0;
  }, [models]);

  useFrame((state) => {
    const now = state.clock.elapsedTime;

    if (now - lastCheck.current < .2) return;

    lastCheck.current = now;

    let pX = 0, pZ = 0;

    if (positionRef?.current) {
      const target = positionRef.current.translation?.() || positionRef.current.position || positionRef.current.object?.position;

      pX = target.x;
      pZ = target.z;
    } else {
      pX = state.camera.position.x;
      pZ = state.camera.position.z;
    }

   // Visibility of chunks, water, and models
   // based on distance to the player

    for (let i = 0; i < chunkMetadata.length; i++) {
      const chunk = chunkMetadata[i];
      const group = chunkRefs.current[i];

      if (group) {
        const dx = pX - chunk.worldX;
        const dz = pZ - chunk.worldZ;

        group.visible = (dx * dx + dz * dz) < RENDER_DISTANCE_SQ;
      }
    }

    for (let i = 0; i < waterMetadata.length; i++) {
      const water = waterMetadata[i];
      const group = waterRefs.current[i];

      if (group) {
        const dx = pX - water.worldX;
        const dz = pZ - water.worldZ;

        group.visible = (dx * dx + dz * dz) < RENDER_DISTANCE_SQ;
      }
    }

    if (!isEditor) {
      for (let i = 0; i < models.length; i++) {
        const m = models[i];
        const group = modelRefs.current[i];

        if (group) {
          const dx = pX - m.position[0];
          const dz = pZ - m.position[2];

          group.visible = (dx * dx + dz * dz) < RENDER_DISTANCE_SQ;
        }
      }
    }
  });

  return (
    <group position={[zoneOffset.x, 0, zoneOffset.z]} name={`Zone_${x}_${z}`}>
      {chunkMetadata.map((chunk, i) => (
        <group key={chunk.id} ref={(el) => (chunkRefs.current[i] = el)}>
          <WOWZoneChunk
            position={chunk.localPos}
            gridData={terrainData?.[chunk.id] || new Float32Array(81).fill(0)}
            textureIndices={textureData?.[chunk.id] || new Uint8Array(81).fill(0)}
            isTrimesh={!isEditor}
            fogType={fogType}
          />
        </group>
      ))}

      {waterMetadata.map((water, i) => (
        <group key={`water-${i}`} ref={(el) => (waterRefs.current[i] = el)}>
          <WOWWater position={water.localPos} isAnimating={!isEditor} />
        </group>
      ))}

      {!isEditor && models.map((model, i) => (
        <group key={model.id} ref={(el) => (modelRefs.current[i] = el)}>
          <Model
            {...model}
            position={[
              model.position[0] - zoneOffset.x,
              model.position[1],
              model.position[2] - zoneOffset.z
            ]}
          />
        </group>
      ))}
    </group>
  );
}
