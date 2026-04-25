import React from 'react';

/**
 * WovenOpenWorld
 * Defines the global 64x64 grid metadata.
 * Total World Size: 34,133.12 x 34,133.12 Yards
 */

export const WORLD_CONFIG = {
  GRID_SIZE: 64,
  ZONE_SIZE: 533.33,
  CHUNK_SIZE: 33.333,
  CHUNKS_PER_ZONE: 16,
  YARD_UNIT: 1
};

export default function WovenOpenWorld ({ children }) {
  return (
    <group name="WovenOpenWorld">
      {children}
    </group>
  );
}

/**
 * Generates procedural height data for a full 16x16 Zone.
 * Each chunk gets a Float32Array of 81 vertices (9x9).
 */

 export const loadZoneData = async (zoneName = 'gerizat') => {
   const gravity = 9.8;
   const heightMap = {};
   const textureMap = {}; // New state
   let models;

   try {
     const response = await fetch(`/wow/${zoneName.toLowerCase()}.json`);
     if (!response.ok) throw new Error("Export file not found.");

     const levelJson = await response.json();

     if (levelJson.environment?.heightMap) {
       Object.keys(levelJson.environment.heightMap).forEach(key => {
         heightMap[key] = new Float32Array(levelJson.environment.heightMap[key]);
       });
     }

     // Parse Texture Map
     if (levelJson.environment?.textureMap) {
       Object.keys(levelJson.environment.textureMap).forEach(key => {
         textureMap[key] = new Uint8Array(levelJson.environment.textureMap[key]);
       });
     }

     if (levelJson.models) models = levelJson.models;
   } catch (err) {
     console.warn(err.message);
   }

   return {
     heightMap,
     textureMap, // Return the map
     models,
     gravity: gravity * -10
   };
 };
