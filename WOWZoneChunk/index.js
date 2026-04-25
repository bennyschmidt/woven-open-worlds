import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { RigidBody, MeshCollider } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_CONFIG } from '..';
import { FogType } from '../../../Components/Fog';

const TEXTURES = {
  BASE: '/images/snow.jpg',
  ALPHA_A: '/images/rock-black.jpg',
  ALPHA_B: '/images/ice.jpg',
  ALPHA_C: '/images/cobblestone.jpg'
};

export default function WOWZoneChunk({ position, gridData, textureIndices, isTrimesh, fogType }) {
  const baseTexture = useTexture(TEXTURES.BASE);
  const alphaATexture = useTexture(TEXTURES.ALPHA_A);
  const alphaBTexture = useTexture(TEXTURES.ALPHA_B);
  const alphaCTexture = useTexture(TEXTURES.ALPHA_C);

  useMemo(() => {
    [baseTexture, alphaATexture, alphaBTexture, alphaCTexture].forEach(t => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 16;
      }
    });
  }, [baseTexture, alphaATexture, alphaBTexture, alphaCTexture]);

  const meshRef = useRef();

  const finalGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_CONFIG.CHUNK_SIZE, WORLD_CONFIG.CHUNK_SIZE, 8, 8);
    geo.rotateX(-Math.PI / 2);

    // Use 4 components (RGBA) to store 4 texture weights
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(81 * 4), 4));
    return geo;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const geo = meshRef.current.geometry;
    const positions = geo.attributes.position.array;
    const colors = geo.attributes.color.array;

    for (let i = 0; i < 81; i++) {
      // 1. Set height
      positions[i * 3 + 1] = gridData[i] || 0;

      // 2. Set texture weights based on ID
      const id = textureIndices ? textureIndices[i] : 0;

      // Reset all 4 weights (R, G, B, A)
      colors[i * 4 + 0] = 0;
      colors[i * 4 + 1] = 0;
      colors[i * 4 + 2] = 0;
      colors[i * 4 + 3] = 0;

      if (id === 0) colors[i * 4 + 0] = 1;      // BASE
      else if (id === 1) colors[i * 4 + 1] = 1; // ALPHA_A
      else if (id === 2) colors[i * 4 + 2] = 1; // ALPHA_B
      else if (id === 3) colors[i * 4 + 3] = 1; // ALPHA_C
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.computeVertexNormals();
  }, [gridData, textureIndices]);

  const shaderArgs = useMemo(() => {
    const fog = FogType[fogType] || FogType['Light'];
    const fogMultiply = fogType === 'AquaCave' ? '0.275' : '0.0';

    return {
      uniforms: {
        uBase: { value: baseTexture },
        uAlphaA: { value: alphaATexture },
        uAlphaB: { value: alphaBTexture },
        uAlphaC: { value: alphaCTexture },
        uTiling: { value: 1.0 },
        uSunDir: { value: new THREE.Vector3(0.4, 1.0, 0.3).normalize() },
        uAmbient: { value: 0.4 },
        uFogColor: { value: new THREE.Color(fog.color) },
        uFogDensity: { value: 0.004 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec4 vWeights;
        varying vec3 vNormal;
        varying float vDist;

        void main() {
          vUv = uv;
          vWeights = color; // RGBA color attribute
          vNormal = normalMatrix * normal;

          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec4 mvPosition = viewMatrix * worldPosition;
          vDist = length(mvPosition.xyz);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uBase;
        uniform sampler2D uAlphaA;
        uniform sampler2D uAlphaB;
        uniform sampler2D uAlphaC;
        uniform float uTiling;
        uniform vec3 uSunDir;
        uniform float uAmbient;
        uniform vec3 uFogColor;
        uniform float uFogDensity;

        varying vec2 vUv;
        varying vec4 vWeights;
        varying vec3 vNormal;
        varying float vDist;

        void main() {
          vec2 uv = vUv * uTiling;

          vec3 texBase = texture2D(uBase, uv).rgb;
          vec3 texA = texture2D(uAlphaA, uv).rgb;
          vec3 texB = texture2D(uAlphaB, uv).rgb;
          vec3 texC = texture2D(uAlphaC, uv).rgb;

          // Blend using R, G, B, and A channels
          vec3 terrainColor = (texBase * vWeights.r) +
                              (texA * vWeights.g) +
                              (texB * vWeights.b) +
                              (texC * vWeights.a);

          vec3 norm = normalize(vNormal);
          float lightScale = max(dot(norm, uSunDir), 0.0);
          vec3 litColor = terrainColor * (uAmbient + lightScale);

          float fogFactor = clamp(1.0 - exp( -uFogDensity * uFogDensity * vDist * vDist ), ${fogMultiply}, 1.0);
          gl_FragColor = vec4(mix(litColor, uFogColor, fogFactor), 1.0);
        }
      `
    };
  }, [baseTexture, alphaATexture, alphaBTexture, alphaCTexture, fogType]);

  return (
    <RigidBody type="fixed" position={position}>
      <MeshCollider type={isTrimesh ? 'trimesh' : 'hull'}>
        <mesh ref={meshRef} geometry={finalGeometry} receiveShadow>
          <shaderMaterial
            fragmentShader={shaderArgs.fragmentShader}
            vertexShader={shaderArgs.vertexShader}
            uniforms={shaderArgs.uniforms}
            vertexColors={true}
            transparent={false}
          />
        </mesh>
      </MeshCollider>
    </RigidBody>
  );
}
