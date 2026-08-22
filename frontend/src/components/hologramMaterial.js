import * as THREE from "three";

/* =====================================================================
   Holographic brain material.

   Fully emissive: it ignores scene lights and fakes its own directional
   term, so the gyri still read as form rather than a flat glowing blob.
   Three things sell the projection:

     1. A fresnel edge that blows out toward coral at grazing angles, so
        the silhouette glows and the middle stays see-through.
     2. Fine horizontal interference bands, fixed in *object* space so
        they sit on the brain and rotate with it rather than sliding
        across the screen like a post effect.
     3. One brighter sweep travelling up the model on a slow loop.

   Additive blending with depthWrite off means back faces show through
   the front, which is what makes it read as volume rather than a shell.
   ===================================================================== */

const vertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vObjPos;

  void main() {
    vObjPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    // Uniform scale only, so the model matrix is safe for normals.
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTint;
  uniform vec3 uCore;
  uniform vec3 uEdge;
  uniform vec3 uScan;
  uniform float uOpacity;
  uniform float uBandScale;

  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vObjPos;

  void main() {
    vec3 n = normalize(vNormalW);
    float facing = abs(dot(n, normalize(vViewDir)));
    float fres = pow(1.0 - facing, 2.3);

    // Faked key light, keeps the folds legible without any real lights.
    float diff = max(dot(n, normalize(vec3(0.45, 0.7, 0.85))), 0.0);

    // Interference bands, in object space so they ride the geometry.
    float bands = sin(vObjPos.y * uBandScale - uTime * 2.0);
    bands = smoothstep(0.55, 1.0, bands);

    // A single brighter line sweeping bottom to top.
    float sweepAt = fract(uTime * 0.16);
    float here = fract((vObjPos.y + 1.3) / 2.6);
    float sweep = smoothstep(0.045, 0.0, abs(here - sweepAt));

    vec3 col = mix(uCore, uEdge, fres);
    col += uScan * bands * 0.6;
    col += uEdge * sweep * 0.85;
    // Kept deliberately shallow: additive blending stacks front and back
    // faces, so a strong diffuse term blows the crown out to white.
    col *= (0.55 + diff * 0.5);
    col *= uTint;

    float alpha = uOpacity * (0.18 + fres * 0.8 + bands * 0.2 + sweep * 0.45);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/**
 * `material.color` is aliased onto the tint uniform, so the existing
 * class-tinting code (`color.copy(base).lerp(classColour)`) drives the
 * shader without knowing it is a shader.
 */
export function createHologramMaterial({ bandScale = 46, opacity = 0.9 } = {}) {
  const tint = new THREE.Color(0xffffff);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: tint },
      uCore: { value: new THREE.Color("#7d2d5c") },
      uEdge: { value: new THREE.Color("#ff7a54") },
      uScan: { value: new THREE.Color("#57cbb6") },
      uOpacity: { value: opacity },
      uBandScale: { value: bandScale },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  material.color = tint;
  return material;
}
