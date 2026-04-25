> [!WARNING]  
> Woven Open Worlds and the Worg editor will be released in October 2026! This repo is parked for the complete framework and tooling. Feel free to have look at the prototype code for now, if you're interested in building with WOW! Stay tuned. 😎 

# Woven Open Worlds

## Protocol

The WOW Protocol is a standard for defining massive, persistent 3D environments through a hierarchical grid system. At the highest level, it maintains a global 64x64 grid, representing a total world scale of 34,000 square yards.

## Data Architecture

By partitioning the world into Zones (533.33 yards each) and further into Chunks (33.33 yards each), the protocol ensures that environment data — including high-precision Float32 vertex height maps, Uint8 texture splat maps, and static model placement — remains portable and easily consumable by both game engines and level editors. This structured approach allows for efficient serialization into JSON, enabling seamless cross-platform world-state synchronization.

## Framework

The framework is a high-performance react-three-fiber implementation designed to render and manage environments following the protocol.

WOW features an automated LOD (Level of Detail) and Culling system that dynamically toggles visibility for Chunks, Water, and Models based on player proximity to optimize GPU overhead. The framework includes a custom Splat-Map Shader for terrain blending as well as integrated Rapier physics for real-time collision detection.

## Engines & Games

By decoupling world data from rendering logic, the framework allows developers to focus on gameplay while the system handles the heavy lifting of procedural terrain generation and environment streaming.

-----

<img width="1468" height="853" alt="worg" src="https://github.com/user-attachments/assets/c1a0b527-e8e3-4a70-b686-22921a7791c9" />

## Worg

[Worg](https://www.paganartifact.com/worg) is level building software that implements the [Woven Open Worlds](https://www.paganartifact.com/woven-open-worlds) protocol for sculpting, painting, and eventing vast, extensible, portable virtual worlds.
