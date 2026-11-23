# 3D Worlds, Portals, WebGL/WebGPU Shaders & Visual Effect Libraries

Production architectures and copy-paste recipes for Three.js, React Three Fiber, WebGPU, GLSL shaders, holographic CSS, and Python/web visual embedding.

---

## 1. Procedural 30-Bone `SkinnedMesh` 3D Book Slider (React Three Fiber)

Reference implementation from [`pakagronglb/animated-book-slider-threejs`](https://github.com/pakagronglb/animated-book-slider-threejs) (full source preserved in [`blueprints/animated-book-slider-Book.jsx`](../../blueprints/animated-book-slider-Book.jsx)).

Instead of rotating a flat rigid plane, each page is a `BoxGeometry` subdivided into `30` horizontal segments bound to a chain of `31` `THREE.Bone` nodes. In `useFrame`, `maath.easing.dampAngle` bends the bone chain using sine/cosine curves for the inside spine arch, the outer resting page curl, and the mid-turn folding wave:

```jsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import {
  Bone,
  BoxGeometry,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// 1. Build shared page geometry shifted so x=0 sits at the book spine
const pageGeometry = new BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2);
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const pos = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < pos.count; i++) {
  vertex.fromBufferAttribute(pos, i);
  const x = vertex.x;
  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute("skinIndex", new Uint16BufferAttribute(skinIndexes, 4));
pageGeometry.setAttribute("skinWeight", new Float32BufferAttribute(skinWeights, 4));

// 2. Per-frame bone curl solver
export function updatePageBones({ bones, opened, number, page, totalPages, turnedAt, delta }) {
  let turningTime = Math.min(400, performance.now() - turnedAt) / 400;
  turningTime = Math.sin(turningTime * Math.PI);

  let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
  targetRotation += degToRad(number * 0.8);

  for (let i = 0; i < bones.length; i++) {
    const target = i === 0 ? bones[0] : bones[i];
    const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
    const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
    const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

    let rotationAngle =
      0.18 * insideCurveIntensity * targetRotation -
      0.05 * outsideCurveIntensity * targetRotation +
      0.09 * turningIntensity * targetRotation;

    let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
    if (i > 8) {
      foldRotationAngle *=0.9 * turningIntensity;
    } else {
      foldRotationAngle = 0;
    }

    easing.dampAngle(target.rotation, "y", i === 0 ? targetRotation : rotationAngle, 0.5, delta);
    easing.dampAngle(target.rotation, "x", foldRotationAngle, 0.3, delta);
  }
}
```

---

## 2. 3D Portal Cards (`@react-three/drei` `<MeshPortalMaterial>`)

Reference pattern from [Drei `MeshPortalMaterial`](https://drei.docs.pmnd.rs/portals/mesh-portal-material).

`<MeshPortalMaterial>` renders an isolated child 3D scene into a portal buffer mapped onto the parent mesh. Animating `blend` from `0` to `1` seamlessly transitions the camera from viewing a 3D window card in the gallery to stepping *inside* that world full-screen:

```tsx
import { useRef, useState } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { MeshPortalMaterial, Environment, Gltf, CameraControls, Text } from "@react-three/drei";
import { easing, geometry } from "maath";
import * as THREE from "three";

extend(geometry);

export function PortalCard({
  id,
  title,
  bg,
  modelUrl,
  activeId,
  setActiveId,
}: {
  id: string;
  title: string;
  bg: string;
  modelUrl: string;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  const portalRef = useRef<any>(null);
  const isOpen = activeId === id;

  useFrame((_, delta) => {
    // Smoothly blend between card window (0) and full-screen portal world (1)
    easing.damp(portalRef.current, "blend", isOpen ? 1 : 0, 0.25, delta);
  });

  return (
    <group>
      <Text fontSize={0.18} position={[0, 0.72, 0.051]} anchorY="top">
        {title}
      </Text>
      <mesh
        name={id}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setActiveId(isOpen ? null : id);
        }}
      >
        {/* maath SDF rounded plane geometry */}
        {/* @ts-expect-error extended maath geometry */}
        <roundedPlaneGeometry args={[1.2, 1.6, 0.12]} />
        <MeshPortalMaterial ref={portalRef} events={isOpen} side={THREE.DoubleSide}>
          <color attach="background" args={[bg]} />
          <ambientLight intensity={0.6} />
          <Environment preset="city" />
          <Gltf src={modelUrl} position={[0, -0.7, 0]} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
}
```

---

## 3. Shared-Element Route Transitions on a Live WebGL `<Canvas>`

Reference implementation from [`nijotz/three.js-page-transition`](https://github.com/nijotz/three.js-page-transition).

Normally, moving a Three.js `<Canvas>` between a grid card route (`/`) and a detail route (`/cubes/[id]`) either destroys and recreates the WebGL context (causing a black flash) or stretches the framebuffer aspect ratio during Framer Motion's `layoutId` animation.

**The solution combines two mechanisms:**
1. **`react-reverse-portal`** (`createHtmlPortalNode`, `InPortal`, `OutPortal`) keeps the live `<Canvas>` mounted in a single persistent DOM node while teleporting it between the Gallery card and the Detail view.
2. **A frame-synced `<Resizer>` inside `<Canvas>`** runs a `requestAnimationFrame` loop while `transition === true` (triggered by `onLayoutAnimationStart` and stopped on `onLayoutAnimationComplete`), continuously syncing `camera.aspect = width / height` and `camera.updateProjectionMatrix()` to the morphing `motion.div` bounding box:

```tsx
"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Canvas as R3FCanvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { motion } from "framer-motion";
import { OutPortal, HtmlPortalNode } from "react-reverse-portal";

export function FrameSyncedResizer({
  canvasRef,
  isTransitioning,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isTransitioning: boolean;
}) {
  const { gl, camera } = useThree();
  const frameRef = useRef<number | null>(null);

  const resize = useCallback(() => {
    const parent = canvasRef.current?.parentElement;
    if (!canvasRef.current || !parent) return;

    const { width, height } = parent.getBoundingClientRect();
    if (height > 0) {
      (camera as PerspectiveCamera).aspect = width / height;
      camera.updateProjectionMatrix();
    }
    canvasRef.current.style.width = "100%";
    canvasRef.current.style.height = "100%";
    frameRef.current = requestAnimationFrame(resize);
  }, [camera, canvasRef]);

  useEffect(() => {
    if (isTransitioning) {
      frameRef.current = requestAnimationFrame(resize);
    } else if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      gl.setSize(width, height);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [isTransitioning, resize, canvasRef, gl]);

  return null;
}

export function SharedWebGLRouteContainer({
  id,
  portalNode,
  setTransition,
}: {
  id: number;
  portalNode: HtmlPortalNode;
  setTransition: (active: boolean) => void;
}) {
  return (
    <motion.div
      className="flex-grow"
      layoutId={`webgl-canvas-${id}`}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onLayoutAnimationStart={() => setTransition(true)}
      onLayoutAnimationComplete={() => setTransition(false)}
    >
      <OutPortal node={portalNode} />
    </motion.div>
  );
}
```

---

## 4. Single-File Zero-Build Interactive 3D World (`Inside the Microchip` Architecture)

Reference implementation from [`AhmadSaeed4345/inside-the-microchip`](https://github.com/AhmadSaeed4345/inside-the-microchip) (complete 170 KB single-file production build included in [`blueprints/inside-the-microchip-3d.html`](../../blueprints/inside-the-microchip-3d.html)).

Key architectural patterns to borrow for educational, hardware, or spatial storytelling sites:
- **Zero-build portability:** One self-contained `index.html` importing Three.js from CDN, with all GLSL shaders, district camera waypoints, and HUD panels inline.
- **Scale-dive cinematic intro:** Smooth camera interpolation shrinking the viewer from macro object scale (a desktop computer) down through the package into micro-districts (transistors, ALU, clock, registers).
- **Three-tier progressive disclosure:** Every 3D district inspector offers `Basic`, `Intermediate`, and `Advanced` tabs plus an interactive mini-simulation (e.g., live logic-gate truth tables).
- **"Follow a Signal" camera mode:** Locks the camera along a spline path riding a live data, control, or clock pulse shader across the 3D floorplan.
- **Adaptive performance & theme modes:** Instant toggle between nocturnal silicon mode (`data-theme="dark"`), blueprint day mode (`data-theme="day"`), and low-power device mode (`body.perf`).

---

## 5. Curated Shader, 3D & Visual Effect Ecosystem

### 1. Paper Shaders & Liquid Chrome Logo (`@paper-design/shaders-react`)
Zero-dependency WebGL shaders created by the Paper team. Includes `LiquidLogo` (turns any SVG mark into animated liquid chrome), `MeshGradient`, `Dithering`, `DotOrbit`, and `FlutedGlass`:

```tsx
import { LiquidMetal, MeshGradient } from "@paper-design/shaders-react";

export function LiquidChromeMark() {
  return (
    <LiquidMetal
      style={{ width: 320, height: 320 }}
      colorBack="#090a0f"
      colorTint="#e8eef8"
      repetition={4}
      softness={0.35}
      shiftRed={0.2}
      shiftBlue={0.25}
      distortion={0.4}
      speed={0.8}
    />
  );
}
```

### 2. Glisse — Apple Liquid Glass for the Web (`0kzh/glisse`)
Real optical refraction and chromatic dispersion for floating web toolbars, pills, and cards using dynamic SVG displacement lenses paired with `backdrop-filter`:

```html
<!-- SVG Optical Refraction Filter for Liquid Glass -->
<svg width="0" height="0" style="position:absolute">
  <filter id="liquid-glass-refract" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>

<style>
.glisse-pill {
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05));
  backdrop-filter: url(#liquid-glass-refract) blur(18px) saturate(190%);
  -webkit-backdrop-filter: blur(18px) saturate(190%);
  border-radius: 9999px;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.55),
    inset 0 -1px 2px rgba(255, 255, 255, 0.15),
    0 12px 32px -8px rgba(0, 0, 0, 0.35);
}
</style>
```

### 3. Three-Geospatial Volumetric Clouds (`@takram/three-geospatial`)
Renders live physically based volumetric clouds and aerial perspective in the browser over 3D geospatial tiles (Mount Fuji, Tokyo, London):
- Packages: `@takram/three-atmosphere`, `@takram/three-clouds`, `@takram/three-geospatial-effects`.
- Combine `<Atmosphere>` + `<Clouds qualityPreset="high" coverage={0.45}>` inside `@react-three/postprocessing` `<EffectComposer>` for real-time crepuscular rays and cloud shadows.

### 4. WebGPU Fullscreen Quad Shader (Brandon Jones Pattern)
Minimal, zero-vertex-buffer WebGPU pipeline that connects any procedural WGSL fragment shader (interactive fluid cursor, raymarched SDF, thermal field) to a fullscreen triangle/quad:

```wgsl
struct Uniforms {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4f {
  // Fullscreen triangle covering [-1, 1] clip space without vertex buffers
  let pos = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(pos[idx], 0.0, 1.0);
}

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / u.resolution;
  let d = distance(uv, u.pointer);
  let glow = exp(-d * 14.0);
  let base = vec3f(0.05, 0.06, 0.09);
  let accent = vec3f(0.12, 0.88, 0.65);
  return vec4f(mix(base, accent, glow), 1.0);
}
```

### 5. WebGL Cursor Fluid Simulation (`PavelDoGreat/WebGL-Fluid-Simulation`)
Interactive Navier-Stokes velocity, vorticity confinement, pressure Poisson solver, and dye splatting that follows pointer velocity across the hero canvas. Keep `DENSITY_DISSIPATION: 0.97`, `VELOCITY_DISSIPATION: 0.98`, `CURL: 22`, and `SPLAT_RADIUS: 0.2` for a subtle atmospheric trail rather than an overwhelming rainbow explosion.

### 6. ThreeUI — Continuous Scroll-Spline 3D Landing Pages
For cinematic 3D sites (e.g., an endless scroll through a Kyoto temple or industrial facility), drive the camera position along a `THREE.CatmullRomCurve3` using damped normalized scroll progress (`t = scrollY / maxScroll`):

```js
const cameraSpline = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 2.2, 18),
  new THREE.Vector3(-3.5, 1.8, 9),
  new THREE.Vector3(1.2, 2.6, 0),
  new THREE.Vector3(0, 1.5, -12),
]);

let currentT = 0;
function animateScrollCamera(targetT, camera) {
  currentT += (targetT - currentT) * 0.08; // smooth lerp
  cameraSpline.getPointAt(currentT, camera.position);
  const lookAhead = cameraSpline.getPointAt(Math.min(1, currentT + 0.04));
  camera.lookAt(lookAhead);
}
```

### 7. Shader Lab — Stackable Halftone Dither + CRT Post-Processing Fragment Shader
Combine ordered halftone dithering, scanlines, and subtle chromatic aberration on any image or `<video>` texture:

```glsl
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;

void main() {
  // 1. Subtle radial chromatic dispersion
  vec2 dir = vUv - 0.5;
  float r = texture2D(uTexture, vUv + dir * 0.004).r;
  float g = texture2D(uTexture, vUv).g;
  float b = texture2D(uTexture, vUv - dir * 0.004).b;
  vec3 col = vec3(r, g, b);

  // 2. Screen-space halftone dot matrix
  vec2 cell = fract(gl_FragCoord.xy / 5.0) - 0.5;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float dotMask = smoothstep(luma * 0.65, luma * 0.65 - 0.1, length(cell));

  // 3. Subtle CRT scanline modulation
  float scanline = 0.94 + 0.06 * sin(gl_FragCoord.y * 3.14159);
  gl_FragColor = vec4(mix(col * 0.18, col, dotMask) * scanline, 1.0);
}
```

### 8. GLTransitions (100+ Shader Slideshow & View Transitions)
Bind any transition from [`gl-transitions`](https://gl-transitions.com/) (e.g., `directionalwipe`, `CrossZoom`, `WaterDrop`, `Swirl`, `morph`) between `from` and `to` textures driven by `uniform float progress` (`0.0 → 1.0`).

### 9. React Bits (`DavidHDev/react-bits`)
63+ copy-paste animated backgrounds (`Aurora`, `Beams`, `Dither`, `GridMotion`, `Iridescence`, `LiquidChrome`, `MetaBalls`, `Noise`, `Particles`, `PixelTrail`, `Ribbons`, `Silk`, `Squares`, `Waves`) and text/cursor micro-components. Use at most **one** background effect per viewport and keep foreground typography clean.

### 10. Pokemon Card CSS — Pure CSS Holographic Foil & 3D Tilt (`simeydotme/pokemon-cards-css`)
Achieves realistic collectible foil diffraction in pure CSS by mapping pointer coordinates (`--mx`, `--my`, `--rx`, `--ry`) to stacked `conic-gradient` / `repeating-linear-gradient` foil layers with `mix-blend-mode: color-dodge` and `overlay`:

```css
.holo-card {
  --mx: 50%;
  --my: 50%;
  --rx: 0deg;
  --ry: 0deg;
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform 120ms ease-out;
  will-change: transform;
}

/* Holographic rainbow diffraction layer */
.holo-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      115deg,
      oklch(0.75 0.22 20) 0%,
      oklch(0.85 0.20 95) 14%,
      oklch(0.80 0.22 160) 28%,
      oklch(0.78 0.20 230) 42%,
      oklch(0.72 0.24 310) 56%,
      oklch(0.75 0.22 20) 70%
    ),
    radial-gradient(
      farthest-corner circle at var(--mx) var(--my),
      rgba(255, 255, 255, 0.85) 10%,
      rgba(255, 255, 255, 0.15) 45%,
      rgba(0, 0, 0, 0.7) 90%
    );
  background-blend-mode: overlay;
  background-size: 260% 260%, 100% 100%;
  background-position: var(--mx) var(--my), center;
  mix-blend-mode: color-dodge;
  filter: brightness(0.78) contrast(1.45) saturate(1.2);
  opacity: 0.75;
  pointer-events: none;
}

/* Specular glare spotlight */
.holo-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    farthest-corner circle at var(--mx) var(--my),
    rgba(255, 255, 255, 0.65) 0%,
    rgba(255, 255, 255, 0.12) 30%,
    transparent 70%
  );
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

### 11. Vanta.js, Canvas UI, Preact 3KB Widgets & ShaderGradient (React & Python Web Apps)
When building interactive dashboards or AI web apps in **Python** (Reflex, NiceGUI, Gradio, Streamlit, FastHTML) or lightweight web stacks:
- **Vanta.js (`tengbao/vanta`):** Renders 3D WebGL skies (`VANTA.CLOUDS`, `VANTA.FOG`, `VANTA.WAVES`, `VANTA.CELLS`) directly onto any DOM selector via Three.js.
- **Canvas UI:** Synchronizes DOM bounding boxes (`getBoundingClientRect()`) with a single full-viewport WebGL `<canvas>` so HTML cards and headings receive real-time shader distortion, refraction, and dust dissolution while remaining accessible DOM text.
- **Preact (Jason Miller's 3 KB reactive runtime):** Wrap complex shader controls, spring micro-widgets, or holographic cards in a standalone 3 KB Preact bundle (`htm/preact`) that mounts seamlessly inside server-rendered HTML or Python web frameworks without a heavy bundler.
- **ShaderGradient (`ruucm/shadergradient`):** Design grainy moving 3D mesh gradients visually, copy the URL string, and embed directly in React (`<ShaderGradient urlString="..." />`) or inside Python apps (`NiceGUI` `ui.html` / `Streamlit` `st.components.v1.html` / `Reflex` `rx.el.iframe`).
