import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import { Upload, RotateCw, Loader2, AlertCircle, Info, X } from "lucide-react";

/* ---------------------------------------------------------------------
   Palette — pulled directly from the training notebook's shared palette
   (BASE_COLORS) so the demo visually matches the rest of the project.
--------------------------------------------------------------------- */
const PALETTE = {
  bg: "#160c10",
  bgPanel: "#1f1216",
  maroon: "#712033",
  rose: "#ca637a",
  roseLight: "#c87281",
  blush: "#f4b2ba",
  amber: "#e28e52",
  sand: "#f2c8a1",
  calm: "#7fb9a2", // used only for "no tumor" — deliberately outside the warm tumor palette
};

const CLASS_INFO = {
  glioma: {
    label: "Glioma",
    color: PALETTE.maroon,
    blurb: "Arises in glial (supportive) brain tissue.",
    // Illustrative marker position only — the model classifies type, not location.
    pos: new THREE.Vector3(0.55, 0.25, 0.35),
  },
  meningioma: {
    label: "Meningioma",
    color: PALETTE.rose,
    blurb: "Arises in the membranes surrounding the brain.",
    pos: new THREE.Vector3(-0.5, 0.1, 0.55),
  },
  pituitary: {
    label: "Pituitary",
    color: PALETTE.amber,
    blurb: "Arises in the pituitary gland at the brain's base.",
    pos: new THREE.Vector3(0.0, -0.75, 0.35),
  },
  notumor: {
    label: "No Tumor",
    color: PALETTE.calm,
    blurb: "No tumor pattern detected in the scan.",
    pos: new THREE.Vector3(0, 0.85, 0),
  },
};

const CLASS_ORDER = ["glioma", "meningioma", "notumor", "pituitary"];

/* ---------------------------------------------------------------------
   Tiny deterministic value-noise (no external noise lib available) —
   just enough to give the brain mesh organic, non-spherical bumps.
--------------------------------------------------------------------- */
function hashNoise(x, y, z) {
  const s =
    Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x, y, z, freq) {
  const fx = x * freq,
    fy = y * freq,
    fz = z * freq;
  const ix = Math.floor(fx),
    iy = Math.floor(fy),
    iz = Math.floor(fz);
  const fxr = fx - ix,
    fyr = fy - iy,
    fzr = fz - iz;
  const u = fxr * fxr * (3 - 2 * fxr);
  const v = fyr * fyr * (3 - 2 * fyr);
  const w = fzr * fzr * (3 - 2 * fzr);
  const c000 = hashNoise(ix, iy, iz);
  const c100 = hashNoise(ix + 1, iy, iz);
  const c010 = hashNoise(ix, iy + 1, iz);
  const c110 = hashNoise(ix + 1, iy + 1, iz);
  const c001 = hashNoise(ix, iy, iz + 1);
  const c101 = hashNoise(ix + 1, iy, iz + 1);
  const c011 = hashNoise(ix, iy + 1, iz + 1);
  const c111 = hashNoise(ix + 1, iy + 1, iz + 1);
  const x00 = c000 * (1 - u) + c100 * u;
  const x10 = c010 * (1 - u) + c110 * u;
  const x01 = c001 * (1 - u) + c101 * u;
  const x11 = c011 * (1 - u) + c111 * u;
  const y0 = x00 * (1 - v) + x10 * v;
  const y1 = x01 * (1 - v) + x11 * v;
  return y0 * (1 - w) + y1 * w;
}

function buildBrainGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();

    // Layered noise for gyri/sulci-like bumps
    let n =
      smoothNoise(dir.x, dir.y, dir.z, 2.2) * 0.6 +
      smoothNoise(dir.x, dir.y, dir.z, 4.5) * 0.3 +
      smoothNoise(dir.x, dir.y, dir.z, 9.0) * 0.15;
    n = n - 0.5;

    // Longitudinal fissure: groove along the x=0 plane splitting hemispheres
    const fissure = Math.exp(-Math.pow(dir.x * 5.2, 2)) * 0.16;

    // Flatten the underside slightly (brain stem / base area)
    const baseFlatten = dir.y < -0.3 ? (dir.y + 0.3) * 0.25 : 0;

    const radius = 1 + n * 0.09 - fissure + baseFlatten;
    v.copy(dir).multiplyScalar(radius);

    // Slight vertical elongation so it reads as brain-shaped, not a rock
    v.y *= 1.08;
    v.z *= 0.92;

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ---------------------------------------------------------------------
   Mock predictor — used until a real API URL is provided. Deterministic
   per-file so the same upload always gives the same demo result.
--------------------------------------------------------------------- */
function mockPredict(file) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let h = 0;
      const str = file.name + file.size;
      for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
      }
      const idx = h % CLASS_ORDER.length;
      const base = 0.55 + (h % 40) / 100; // 0.55–0.94
      const rest = 1 - base;
      const probs = {};
      CLASS_ORDER.forEach((c, i) => {
        probs[c] = i === idx ? base : 0;
      });
      let remaining = rest;
      CLASS_ORDER.forEach((c, i) => {
        if (i !== idx) {
          const share = remaining * (0.5 + ((h >> i) % 10) / 20);
          probs[c] = Math.min(share, remaining);
          remaining -= probs[c];
        }
      });
      probs[CLASS_ORDER[idx]] += remaining > 0 ? remaining : 0;
      resolve({
        predicted_class: CLASS_ORDER[idx],
        confidence: probs[CLASS_ORDER[idx]],
        probabilities: probs,
      });
    }, 900);
  });
}

async function realPredict(file, apiUrl) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(apiUrl.replace(/\/$/, "") + "/predict", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

/* ---------------------------------------------------------------------
   Main component
--------------------------------------------------------------------- */
export default function BrainTumorDemo() {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [apiUrl, setApiUrl] = useState("");
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);

  /* ---------- three.js setup ---------- */
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lighting — warm rim + cool fill, matching the palette
    const ambient = new THREE.AmbientLight(0x362028, 1.4);
    scene.add(ambient);

    const key = new THREE.PointLight(PALETTE.blush, 55, 20);
    key.position.set(3, 2, 3);
    scene.add(key);

    const rim = new THREE.PointLight(PALETTE.amber, 25, 20);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const fill = new THREE.PointLight(PALETTE.rose, 15, 20);
    fill.position.set(0, -2, 2);
    scene.add(fill);

    // Brain group
    const brainGroup = new THREE.Group();
    const geometry = buildBrainGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE.roseLight),
      roughness: 0.55,
      metalness: 0.05,
      flatShading: false,
    });
    const brainMesh = new THREE.Mesh(geometry, material);
    brainGroup.add(brainMesh);

    // Subtle inner glow shell
    const glowGeo = new THREE.IcosahedronGeometry(1.03, 3);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PALETTE.blush),
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    brainGroup.add(new THREE.Mesh(glowGeo, glowMat));

    scene.add(brainGroup);

    // Hotspot marker + particle system (hidden until a prediction lands)
    const markerGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.visible = false;
    brainGroup.add(marker);

    const PARTICLE_COUNT = 90;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(PARTICLE_COUNT * 3);
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.045,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    brainGroup.add(particles);

    // Drag-to-rotate (hand-rolled, no OrbitControls in this three version)
    let isDragging = false;
    let prevX = 0,
      prevY = 0;
    let velX = 0,
      velY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      setAutoRotate(false);
      prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      prevY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const dx = x - prevX;
      const dy = y - prevY;
      velX = dx * 0.005;
      velY = dy * 0.005;
      brainGroup.rotation.y += velX;
      brainGroup.rotation.x += velY;
      brainGroup.rotation.x = Math.max(
        -1.1,
        Math.min(1.1, brainGroup.rotation.x)
      );
      prevX = x;
      prevY = y;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // Animation loop
    let frameId;
    let t = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += dt;

      if (sceneRef.current.autoRotate && !isDragging) {
        brainGroup.rotation.y += dt * 0.18;
      }
      // inertial damping after drag release
      if (!isDragging) {
        velX *= 0.92;
        velY *= 0.92;
      }

      // Gentle idle bob
      brainGroup.position.y = Math.sin(t * 0.6) * 0.03;

      // Particle animation when active
      if (sceneRef.current.particlesActive) {
        const positions = particleGeo.attributes.position.array;
        const origin = sceneRef.current.hotspot || new THREE.Vector3();
        const seeds = sceneRef.current.particleSeeds;
        const life = (t - sceneRef.current.particleStart) % 1.6;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const seed = seeds[i];
          const progress = (life + seed.offset) % 1.6;
          const r = progress * 0.55;
          const px = origin.x + seed.dx * r;
          const py = origin.y + seed.dy * r + progress * 0.15;
          const pz = origin.z + seed.dz * r;
          positions[i * 3] = px;
          positions[i * 3 + 1] = py;
          positions[i * 3 + 2] = pz;
        }
        particleGeo.attributes.position.needsUpdate = true;
        particleMat.opacity = 0.85 * Math.max(0, 1 - life / 1.6) + 0.15;
        marker.scale.setScalar(1 + Math.sin(t * 4) * 0.15);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    sceneRef.current = {
      ...sceneRef.current,
      scene,
      brainGroup,
      brainMesh,
      marker,
      particles,
      particleGeo,
      particleMat,
      autoRotate: true,
      particlesActive: false,
    };

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("touchstart", onPointerDown);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      markerGeo.dispose();
      markerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  /* ---------- prediction trigger ---------- */
  const triggerVisualEffect = useCallback((predictedClass) => {
    const info = CLASS_INFO[predictedClass];
    const s = sceneRef.current;
    if (!s.marker || !info) return;

    s.marker.position.copy(info.pos);
    s.marker.material.color.set(info.color);
    s.marker.visible = true;

    s.particleMat.color.set(info.color);
    s.hotspot = info.pos.clone();
    s.particleStart = performance.now() / 1000;
    s.particlesActive = true;

    const seeds = [];
    for (let i = 0; i < 90; i++) {
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      seeds.push({
        dx: dir.x,
        dy: dir.y,
        dz: dir.z,
        offset: Math.random() * 1.6,
      });
    }
    s.particleSeeds = seeds;

    // Recolor the whole brain with a subtle tint toward the class color
    s.brainMesh.material.color.lerp(new THREE.Color(info.color), 0.18);
    s.brainMesh.material.color.lerp(new THREE.Color(PALETTE.roseLight), 0); // keep ref
  }, []);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setFileName(file.name);
      setStatus("loading");
      setErrorMsg("");
      setResult(null);
      sceneRef.current.particlesActive = false;
      if (sceneRef.current.marker) sceneRef.current.marker.visible = false;
      if (sceneRef.current.brainMesh) {
        sceneRef.current.brainMesh.material.color.set(PALETTE.roseLight);
      }

      try {
        const data = apiUrl
          ? await realPredict(file, apiUrl)
          : await mockPredict(file);
        setResult(data);
        setStatus("done");
        triggerVisualEffect(data.predicted_class);
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          apiUrl
            ? `Couldn't reach the API (${err.message}). Check the URL and that the Space is awake.`
            : `Something went wrong: ${err.message}`
        );
      }
    },
    [apiUrl, triggerVisualEffect]
  );

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const activeInfo = result ? CLASS_INFO[result.predicted_class] : null;

  return (
    <div
      className="w-full h-full min-h-[640px] flex flex-col md:flex-row"
      style={{ background: PALETTE.bg, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* LEFT: 3D canvas */}
      <div className="relative w-full md:w-[60%] h-[420px] md:h-auto">
        <div ref={mountRef} className="absolute inset-0" />

        {/* Idle hint */}
        <div
          className="absolute bottom-4 left-4 flex items-center gap-2 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.06)", color: PALETTE.sand }}
        >
          <RotateCw size={13} />
          Drag to rotate
        </div>

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: PALETTE.bgPanel, color: PALETTE.blush }}>
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Analyzing scan…</span>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <h1
            className="text-sm md:text-base font-semibold tracking-wide"
            style={{ color: PALETTE.blush }}
          >
            Brain Tumor MRI Classifier — 3D Demo
          </h1>
          <button
            onClick={() => setShowApiConfig((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-md border transition-colors"
            style={{
              borderColor: "rgba(244,178,186,0.3)",
              color: PALETTE.sand,
              background: apiUrl ? "rgba(127,185,162,0.12)" : "transparent",
            }}
          >
            {apiUrl ? "API connected" : "Demo mode"}
          </button>
        </div>

        {showApiConfig && (
          <div
            className="absolute top-14 right-4 w-72 p-3 rounded-lg border text-xs"
            style={{
              background: PALETTE.bgPanel,
              borderColor: "rgba(244,178,186,0.15)",
              color: PALETTE.sand,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium" style={{ color: PALETTE.blush }}>
                API endpoint
              </span>
              <button onClick={() => setShowApiConfig(false)}>
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value.trim())}
              placeholder="https://your-space.hf.space"
              className="w-full px-2 py-1.5 rounded outline-none text-xs"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: PALETTE.sand,
                border: "1px solid rgba(244,178,186,0.2)",
              }}
            />
            <p className="mt-2 leading-relaxed opacity-70">
              Leave blank to use realistic mocked predictions. Paste your
              deployed FastAPI URL (e.g. the Hugging Face Space root) to run
              real inference.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT: controls + results */}
      <div
        className="w-full md:w-[40%] p-5 md:p-6 flex flex-col gap-4 overflow-y-auto"
        style={{ background: PALETTE.bgPanel }}
      >
        <div>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors"
            style={{
              borderColor: "rgba(244,178,186,0.25)",
              color: PALETTE.sand,
            }}
          >
            <Upload size={22} style={{ color: PALETTE.rose }} />
            <span className="text-sm font-medium">
              Drop an MRI scan or click to upload
            </span>
            <span className="text-xs opacity-60">JPG or PNG</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {fileName && (
            <p className="text-xs mt-2 opacity-60" style={{ color: PALETTE.sand }}>
              {fileName}
            </p>
          )}
        </div>

        {status === "error" && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-xs"
            style={{ background: "rgba(113,32,51,0.25)", color: PALETTE.blush }}
          >
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && activeInfo && (
          <div className="flex flex-col gap-4">
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs uppercase tracking-wider opacity-60"
                  style={{ color: PALETTE.sand }}
                >
                  Predicted class
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: activeInfo.color,
                    color: "#160c10",
                  }}
                >
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <h2 className="text-xl font-semibold" style={{ color: activeInfo.color }}>
                {activeInfo.label}
              </h2>
              <p className="text-sm mt-1 opacity-70" style={{ color: PALETTE.sand }}>
                {activeInfo.blurb}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span
                className="text-xs uppercase tracking-wider opacity-60"
                style={{ color: PALETTE.sand }}
              >
                Class probabilities
              </span>
              {CLASS_ORDER.map((c) => {
                const p = result.probabilities?.[c] ?? 0;
                const info = CLASS_INFO[c];
                return (
                  <div key={c} className="flex items-center gap-2">
                    <span
                      className="text-xs w-20 flex-shrink-0"
                      style={{ color: PALETTE.sand }}
                    >
                      {info.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(p * 100).toFixed(1)}%`,
                          background: info.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs w-10 text-right flex-shrink-0 font-mono opacity-70"
                      style={{ color: PALETTE.sand }}
                    >
                      {(p * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="mt-auto flex items-start gap-2 p-3 rounded-lg text-xs leading-relaxed"
          style={{ background: "rgba(255,255,255,0.03)", color: PALETTE.sand }}
        >
          <Info size={14} className="mt-0.5 flex-shrink-0 opacity-70" />
          <span className="opacity-70">
            The model classifies tumor <em>type</em> from the scan; it does
            not localize the tumor's position. The highlighted region on the
            brain is a stylized, illustrative marker for the predicted class
            — not a real detected location. Educational demo only, not a
            diagnostic tool.
          </span>
        </div>
      </div>
    </div>
  );
}
