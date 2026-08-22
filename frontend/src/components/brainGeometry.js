import * as THREE from "three";

/* =====================================================================
   Procedural human brain.

   Stands in for brain.glb while it downloads (or if it fails to load),
   so the scene needs anatomy it can generate instantly. A noise-displaced
   sphere gets you a peach; a brain needs the landmarks that actually make
   one readable:

     - an ellipsoid that is longest front-to-back, not spherical
     - the interhemispheric fissure splitting the two hemispheres
     - the Sylvian fissure, running low at the front and rising at the back
     - a temporal lobe bulging below it
     - tapered frontal and occipital poles, a flattened inferior surface
     - an occipital notch the cerebellum tucks into
     - gyri as *ridged* domain-warped noise, so the folds meander in worms
       rather than dimpling like a golf ball

   Plus two separate bodies: a cerebellum with fine parallel folia and a
   lathed brain stem. Sulci are darkened in the vertex colours, which is
   what sells the depth more than the displacement itself does.

   Convention: +y up, +z toward the viewer (anterior), +x to the right.
   ===================================================================== */

/* ---------- deterministic value noise (no dependency) ----------------
   Integer hash rather than the usual sin-fract trick: this runs ~5.7M
   times per build, and Math.sin made that a ~450ms hitch on first paint.
   Inputs are always lattice integers, so bitwise mixing is safe here. */
function hashNoise(x, y, z) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smoothNoise(x, y, z, freq) {
  const fx = x * freq, fy = y * freq, fz = z * freq;
  const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
  const fxr = fx - ix, fyr = fy - iy, fzr = fz - iz;
  const u = fxr * fxr * (3 - 2 * fxr);
  const v = fyr * fyr * (3 - 2 * fyr);
  const w = fzr * fzr * (3 - 2 * fzr);
  const c000 = hashNoise(ix, iy, iz), c100 = hashNoise(ix + 1, iy, iz);
  const c010 = hashNoise(ix, iy + 1, iz), c110 = hashNoise(ix + 1, iy + 1, iz);
  const c001 = hashNoise(ix, iy, iz + 1), c101 = hashNoise(ix + 1, iy, iz + 1);
  const c011 = hashNoise(ix, iy + 1, iz + 1), c111 = hashNoise(ix + 1, iy + 1, iz + 1);
  const x00 = c000 * (1 - u) + c100 * u, x10 = c010 * (1 - u) + c110 * u;
  const x01 = c001 * (1 - u) + c101 * u, x11 = c011 * (1 - u) + c111 * u;
  const y0 = x00 * (1 - v) + x10 * v, y1 = x01 * (1 - v) + x11 * v;
  return y0 * (1 - w) + y1 * w;
}

/** Ridged noise, the inverted-absolute trick that turns blobs into creases. */
function ridge(x, y, z, freq) {
  return 1 - Math.abs(smoothNoise(x, y, z, freq) * 2 - 1);
}

/** Works with e0 > e1 too, which several of the anatomy ramps rely on. */
function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const sq = (n) => n * n;

/**
 * Convolution field, 0..1. Domain-warped so folds wander instead of
 * tiling; three octaves so crowns carry finer creases of their own.
 */
function gyriField(x, y, z) {
  const wx = x + (smoothNoise(x, y, z, 2.1) - 0.5) * 0.62;
  const wy = y + (smoothNoise(x + 4.7, y + 2.3, z + 8.1, 2.1) - 0.5) * 0.62;
  const wz = z + (smoothNoise(x + 9.2, y + 6.4, z + 1.7, 2.1) - 0.5) * 0.62;
  return (
    ridge(wx, wy, wz, 5.4) * 0.58 +
    ridge(wx, wy, wz, 10.9) * 0.28 +
    ridge(wx, wy, wz, 21.7) * 0.14
  );
}

/* ---------- palette for the tissue ----------------------------------- */
const SULCUS = new THREE.Color("#4a1c38"); // deepest crease
const MID = new THREE.Color("#a83f68");    // gyral flank
const CROWN = new THREE.Color("#ef8a86");  // lit gyral crown

/**
 * SphereGeometry duplicates its UV seam column and fans W+1 coincident
 * vertices at each pole, so computeVertexNormals leaves a shading crease
 * down the seam and a star at the poles. Averaging the normals of the
 * coincident vertices removes both.
 */
function weldSphereNormals(geo, W, H) {
  const n = geo.attributes.normal;
  const at = (iy, ix) => iy * (W + 1) + ix;

  for (let iy = 0; iy <= H; iy++) {
    const a = at(iy, 0);
    const b = at(iy, W);
    const x = (n.getX(a) + n.getX(b)) / 2;
    const y = (n.getY(a) + n.getY(b)) / 2;
    const z = (n.getZ(a) + n.getZ(b)) / 2;
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }

  for (const iy of [0, H]) {
    let x = 0, y = 0, z = 0;
    for (let ix = 0; ix <= W; ix++) {
      const i = at(iy, ix);
      x += n.getX(i); y += n.getY(i); z += n.getZ(i);
    }
    const l = Math.hypot(x, y, z) || 1;
    for (let ix = 0; ix <= W; ix++) n.setXYZ(at(iy, ix), x / l, y / l, z / l);
  }
  n.needsUpdate = true;
}

/**
 * Cerebrum. Returns an indexed BufferGeometry carrying vertex colours,
 * fitted roughly inside a unit radius.
 *
 * Built on a sphere rather than a subdivided icosahedron: the sphere is
 * indexed out of the box, and welding an icosphere cost ~225ms of
 * mergeVertices on every cold start. The sphere is rotated so its poles
 * land on the frontal and occipital poles, where the anatomy already
 * tapers and the extra vertex density is harmless.
 */
export function buildCerebrum(widthSeg = 264, heightSeg = 168) {
  const geo = new THREE.SphereGeometry(1, widthSeg, heightSeg);
  geo.rotateX(Math.PI / 2); // +y pole -> +z (anterior)
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const { x, y, z } = v;

    // Base ellipsoid: longest anterior-posterior, slightly flattened.
    let r = 1 / Math.hypot(x / 0.80, y / 0.79, z / 1.0);

    // --- interhemispheric fissure: deep at the vertex, gone at the base
    const superior = smoothstep(-0.3, 0.4, y);
    const fissure = Math.exp(-sq(x * 7.5)) * superior * 0.155;
    r -= fissure;

    // --- Sylvian fissure: low anteriorly, rising posteriorly
    const lateral = smoothstep(0.32, 0.9, Math.abs(x));
    const sylvianY = -0.06 - z * 0.24;
    const sylvian = Math.exp(-sq((y - sylvianY) * 4.4)) * lateral * 0.085;
    r -= sylvian;

    // --- central sulcus: the oblique groove over the convexity
    const central =
      Math.exp(-sq((z * 0.92 + y * 0.3 - 0.12) * 5.6)) * smoothstep(0.0, 0.5, y) * 0.045;
    r -= central;

    // --- temporal lobe: fills out below the Sylvian fissure
    r += smoothstep(0.3, 0.88, Math.abs(x)) *
         smoothstep(0.05, -0.55, y) *
         smoothstep(-0.75, 0.35, z) * 0.055;

    // --- poles taper
    r *= 1 - smoothstep(0.5, 1.0, z) * 0.07;   // frontal
    r *= 1 - smoothstep(0.45, 1.0, -z) * 0.06; // occipital

    // --- occipital notch the cerebellum sits under
    const notch = smoothstep(0.2, 0.8, -z) * smoothstep(-0.05, -0.7, y);
    r -= notch * 0.17;

    // --- convolutions
    const g = gyriField(x, y, z);
    r += (g - 0.5) * 0.088;

    v.multiplyScalar(r);

    // The inferior surface rests on the skull base rather than rounding off.
    if (v.y < -0.44) v.y = -0.44 + (v.y + 0.44) * 0.48;

    pos.setXYZ(i, v.x, v.y, v.z);

    // --- vertex colour: crowns light, sulci dark, fissures darker still.
    const t = smoothstep(0.26, 0.82, g);
    if (t < 0.5) c.copy(SULCUS).lerp(MID, t * 2);
    else c.copy(MID).lerp(CROWN, (t - 0.5) * 2);
    // Fake occlusion inside the deep clefts: this is what reads as depth.
    const occl = 1 - Math.min(0.72, (fissure / 0.155) * 0.6 + (sylvian / 0.085) * 0.4 + notch * 0.35);
    c.multiplyScalar(0.55 + 0.45 * occl);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  weldSphereNormals(geo, widthSeg, heightSeg);
  return geo;
}

/**
 * Cerebellum, squat, wide, and striped with fine parallel folia, with a
 * raised vermis down the midline.
 */
export function buildCerebellum(widthSeg = 112, heightSeg = 72) {
  const geo = new THREE.SphereGeometry(1, widthSeg, heightSeg);
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const { x, y } = v;

    let r = 1;
    r += Math.exp(-sq(x * 5.5)) * 0.06;                  // vermis ridge
    // Folia are fine and near-horizontal, but perfectly regular stripes read
    // as a machined part, so the noise term bends them.
    const folia = Math.sin(y * 32 + x * 3.0 + smoothNoise(v.x, v.y, v.z, 3.5) * 2.4);
    r += folia * 0.017;
    r += (smoothNoise(v.x, v.y, v.z, 7) - 0.5) * 0.035;

    v.multiplyScalar(r);
    v.x *= 0.88;
    v.y *= 0.5;
    v.z *= 0.68;
    pos.setXYZ(i, v.x, v.y, v.z);

    // Folia troughs darken, same logic as the cerebral sulci.
    c.copy(MID).lerp(SULCUS, 0.34 + folia * -0.22);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  weldSphereNormals(geo, widthSeg, heightSeg);
  return geo;
}

/** Brain stem: midbrain, a pons bulge, then the medulla tapering away. */
export function buildBrainStem() {
  const profile = [
    new THREE.Vector2(0.002, 0.34),
    new THREE.Vector2(0.115, 0.26),
    new THREE.Vector2(0.150, 0.12),
    new THREE.Vector2(0.175, -0.02), // pons
    new THREE.Vector2(0.150, -0.16),
    new THREE.Vector2(0.105, -0.34),
    new THREE.Vector2(0.080, -0.52),
  ];
  const geo = new THREE.LatheGeometry(profile, 48);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color().copy(MID).lerp(SULCUS, 0.25);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/* The three bodies cost a few hundred milliseconds of noise evaluation to
   generate, and every BrainScene wants the identical mesh, so they are
   built once and shared for the lifetime of the app. Consequence: callers
   must NOT dispose these geometries, only the material they were handed. */
let cached = null;

export function getBrainGeometries() {
  if (!cached) {
    cached = {
      cerebrum: buildCerebrum(),
      cerebellum: buildCerebellum(),
      stem: buildBrainStem(),
    };
  }
  return cached;
}

/**
 * Assembles the three bodies into one group, normalised so the whole
 * brain spans `span` on its longest axis and is centred on the origin,
 * so the camera framing does not depend on the proportions above.
 * Geometry is shared; the material is fresh per call so each scene can
 * tint independently.
 */
export function buildBrain({ span = 2.15 } = {}) {
  const geometries = getBrainGeometries();

  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    color: 0xffffff, // multiplies the vertex colours; class tinting rides here
    roughness: 0.62,
    metalness: 0.0,
    clearcoat: 0.45, // the faint wet sheen of fresh tissue
    clearcoatRoughness: 0.55,
    sheen: 0.35,
    sheenColor: new THREE.Color("#ff9d7a"),
  });

  const group = new THREE.Group();

  const cerebrum = new THREE.Mesh(geometries.cerebrum, material);
  group.add(cerebrum);

  const cerebellum = new THREE.Mesh(geometries.cerebellum, material);
  cerebellum.scale.setScalar(0.45);
  cerebellum.position.set(0, -0.46, -0.5); // tucked under the occipital lobe
  group.add(cerebellum);

  const stem = new THREE.Mesh(geometries.stem, material);
  stem.scale.setScalar(0.95);
  stem.position.set(0, -0.52, -0.2);
  stem.rotation.x = -0.32; // angles down and back, out from under the pons
  group.add(stem);

  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const fit = span / Math.max(size.x, size.y, size.z);
  group.children.forEach((child) => child.position.sub(center));
  group.scale.setScalar(fit);

  return { group, material, geometries };
}
