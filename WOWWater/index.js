import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { WORLD_CONFIG } from '..';
import WaterShaderMaterial from '../../../Materials/Shaders/Water';

const CHUNK_WATER_GEO = new THREE.PlaneGeometry(
  WORLD_CONFIG.CHUNK_SIZE,
  WORLD_CONFIG.CHUNK_SIZE,
  32, 32
);

export default function WOWWater ({ position, isAnimating = true }) {
  const meshRef = useRef();
  const waterTex = useTexture('/images/water.png');

  const material = useMemo(() => {
    const mat = WaterShaderMaterial.clone();

    mat.uniforms = THREE.UniformsUtils.clone(WaterShaderMaterial.uniforms);

    return mat;
  }, []);

  useFrame((state) => {
    if (!isAnimating || !meshRef.current) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    if (waterTex && !material.uniforms.uTexture.value) {
      waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
      material.uniforms.uTexture.value = waterTex;
    }
  });

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={position}
      ref={meshRef}
    >
      <primitive object={CHUNK_WATER_GEO} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
