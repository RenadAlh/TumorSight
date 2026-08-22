import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PALETTE, CLASS_INFO } from "../theme.js";
import { buildBrain } from "./brainGeometry.js";
import { createHologramMaterial } from "./hologramMaterial.js";
import brainModelUrl from "./brain.glb";

/**
 * Rotatable 3D brain. Purely presentational, knows nothing about file
 * uploads or API calls. `activeClass` (one of the CLASS_INFO keys, or
 * null) drives the color tint + particle pulse; parent components own
 * the actual prediction logic.
 */
export default function BrainScene({
  activeClass = null,
  scanning = false,
  interactive = true,
  className = "",
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    // Fall back to 1x1 rather than 0; the real size arrives via the
    // ResizeObserver below, which also covers the first layout pass.
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // No lights: the brain is a hologram (its own emissive shader) and the
    // instrument chrome is all MeshBasicMaterial, so nothing in this scene
    // responds to a light source.

    const brainGroup = new THREE.Group();
    const holoMaterial = createHologramMaterial();
    const { group: proceduralBrain, material: placeholderMaterial } = buildBrain();
    // The procedural anatomy stands in until the GLB arrives; it has to
    // wear the same projection, or the swap would be a visible restyle.
    proceduralBrain.traverse((child) => {
      if (child.isMesh) child.material = holoMaterial;
    });
    placeholderMaterial.dispose();
    brainGroup.add(proceduralBrain);
    scene.add(brainGroup);

    /* --- Instrument shell -------------------------------------------
       Everything below is chrome, not anatomy: a faint wireframe cage,
       two crosshair rings echoing the logo, and a sweep ring that only
       runs while a scan is being analyzed. They live outside brainGroup
       so dragging the brain doesn't drag the instrument with it.
    ----------------------------------------------------------------- */
    const instrument = new THREE.Group();
    scene.add(instrument);

    const cageGeo = new THREE.IcosahedronGeometry(1.42, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PALETTE.coralLight),
      wireframe: true,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    instrument.add(cage);

    const ringGeo = new THREE.TorusGeometry(1.62, 0.004, 8, 160);
    const ringMats = [];
    [
      { color: PALETTE.coral, rot: [Math.PI / 2.35, 0, 0], opacity: 0.5 },
      { color: PALETTE.rose, rot: [Math.PI / 2, Math.PI / 3.1, 0], opacity: 0.3 },
    ].forEach(({ color, rot, opacity }) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, mat);
      ring.rotation.set(...rot);
      instrument.add(ring);
      ringMats.push(mat);
    });

    const sweepGeo = new THREE.TorusGeometry(1.3, 0.012, 8, 120);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PALETTE.coralLight),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sweep = new THREE.Mesh(sweepGeo, sweepMat);
    sweep.rotation.x = Math.PI / 2;
    instrument.add(sweep);

    let tintableMaterials = [
      { material: holoMaterial, baseColor: holoMaterial.color.clone() },
    ];

    /* --- Sculpted model ---------------------------------------------
       brain.glb is a textured 258k-vertex mesh, so it arrives well after
       first paint. The procedural anatomy above stands in until it does,
       and stays put permanently if the fetch fails.
    ----------------------------------------------------------------- */
    let loadedModel = null;
    let cancelled = false;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      brainModelUrl,
      (gltf) => {
        if (cancelled) return;
        const model = gltf.scene;

        // The export faces -X with the hemispheres split along Z; this
        // scene's convention is anterior = +Z, so yaw it a quarter turn.
        model.rotation.y = Math.PI / 2;

        // Fit inside a holder so centring and scaling don't fight the yaw.
        const holder = new THREE.Group();
        holder.add(model);
        holder.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        // Match the procedural brain's span so the rings and the class
        // markers keep framing it the same way.
        holder.scale.setScalar(2.15 / (Math.max(size.x, size.y, size.z) || 1));

        // The hologram replaces the model's PBR material outright, so the
        // three 4K maps that shipped with it are dead weight on the GPU,
        // so drop them as soon as the mesh is wearing the projection instead.
        model.traverse((child) => {
          if (!child.isMesh) return;
          const original = child.material;
          child.material = holoMaterial;
          const mats = Array.isArray(original) ? original : [original];
          mats.forEach((m) => {
            for (const key of Object.keys(m)) {
              const value = m[key];
              if (value && value.isTexture) value.dispose();
            }
            m.dispose();
          });
        });

        proceduralBrain.visible = false;
        brainGroup.add(holder);
        loadedModel = holder;
      },
      undefined,
      () => {
        // Missing/invalid model: the procedural anatomy stays visible.
      }
    );

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

    let isDragging = false;
    let prevX = 0, prevY = 0;

    const onPointerDown = (e) => {
      if (!interactive) return;
      isDragging = true;
      sceneRef.current.autoRotate = false;
      prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      prevY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      brainGroup.rotation.y += (x - prevX) * 0.005;
      brainGroup.rotation.x = Math.max(
        -1.1,
        Math.min(1.1, brainGroup.rotation.x + (y - prevY) * 0.005)
      );
      prevX = x;
      prevY = y;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    if (interactive) {
      dom.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      dom.addEventListener("touchstart", onPointerDown, { passive: true });
      window.addEventListener("touchmove", onPointerMove, { passive: true });
      window.addEventListener("touchend", onPointerUp);
    }

    let frameId;
    let t = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += dt;

      const isScanning = sceneRef.current.scanning;

      holoMaterial.uniforms.uTime.value = t;
      // The projection tightens and brightens while a scan is running.
      const targetOpacity = isScanning ? 1.3 : 0.9;
      holoMaterial.uniforms.uOpacity.value +=
        (targetOpacity - holoMaterial.uniforms.uOpacity.value) * Math.min(1, dt * 4);

      if (sceneRef.current.autoRotate !== false && !isDragging) {
        brainGroup.rotation.y += dt * (isScanning ? 0.55 : 0.18);
      }
      brainGroup.position.y = Math.sin(t * 0.6) * 0.03;

      instrument.rotation.y += dt * 0.07;
      cage.rotation.y -= dt * 0.05;
      cage.rotation.x = Math.sin(t * 0.25) * 0.12;

      if (isScanning) {
        const s = (t * 0.72) % 1;
        sweep.position.y = -1.15 + s * 2.3;
        const waist = Math.sin(s * Math.PI);
        sweep.scale.setScalar(0.3 + waist * 0.8);
        sweepMat.opacity = 0.12 + waist * 0.8;
        ringMats.forEach((m, i) => {
          m.opacity = (i ? 0.3 : 0.5) + Math.sin(t * 5 + i) * 0.2;
        });
        cageMat.opacity = 0.12 + Math.sin(t * 4) * 0.06;
      } else {
        if (sweepMat.opacity > 0) sweepMat.opacity = Math.max(0, sweepMat.opacity - dt * 2.2);
        ringMats.forEach((m, i) => (m.opacity = i ? 0.3 : 0.5));
        cageMat.opacity = 0.09;
      }

      if (sceneRef.current.particlesActive) {
        const positions = particleGeo.attributes.position.array;
        const origin = sceneRef.current.hotspot || new THREE.Vector3();
        const seeds = sceneRef.current.particleSeeds || [];
        const life = (t - sceneRef.current.particleStart) % 1.6;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const seed = seeds[i];
          if (!seed) continue;
          const progress = (life + seed.offset) % 1.6;
          const r = progress * 0.55;
          positions[i * 3] = origin.x + seed.dx * r;
          positions[i * 3 + 1] = origin.y + seed.dy * r + progress * 0.15;
          positions[i * 3 + 2] = origin.z + seed.dz * r;
        }
        particleGeo.attributes.position.needsUpdate = true;
        particleMat.opacity = 0.85 * Math.max(0, 1 - life / 1.6) + 0.15;
        marker.scale.setScalar(1 + Math.sin(t * 4) * 0.15);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Observe the mount itself, not the window: the panel is fluid, and on
    // first paint its size isn't known yet when the effect runs.
    const handleResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    sceneRef.current = {
      ...sceneRef.current,
      brainGroup,
      marker,
      particleGeo,
      particleMat,
      autoRotate: true,
      particlesActive: false,
      scanning: false,
      tintableMaterials,
    };

    return () => {
      cancelAnimationFrame(frameId);
      cancelled = true;
      ro.disconnect();
      if (interactive) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("touchend", onPointerUp);
        dom.removeEventListener("pointerdown", onPointerDown);
        dom.removeEventListener("touchstart", onPointerDown);
      }
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      // Brain geometry is a shared module-level cache, so only the material
      // belongs to this scene. The GLB's own materials and textures were
      // already released at load time, so only its buffers are left.
      holoMaterial.dispose();
      if (loadedModel) {
        loadedModel.traverse((child) => {
          if (child.isMesh) child.geometry.dispose();
        });
      }
      cageGeo.dispose();
      cageMat.dispose();
      ringGeo.dispose();
      ringMats.forEach((m) => m.dispose());
      sweepGeo.dispose();
      sweepMat.dispose();
      markerGeo.dispose();
      markerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // Scanning is a render-loop flag rather than React state; the loop
  // reads it every frame, so it never needs to trigger a re-render.
  useEffect(() => {
    sceneRef.current.scanning = scanning;
  }, [scanning]);

  // Triggers or clears the pulse effect when activeClass changes.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s.marker) return;
    s.activeClass = activeClass;

    // Tinting lives on the ref so the GLTF loader can re-run it: the model
    // may finish downloading long after a prediction has already landed,
    // and its materials would otherwise never pick up the class colour.
    s.applyTint = () => {
      const cur = sceneRef.current;
      const mats = cur.tintableMaterials || [];
      const info = cur.activeClass && CLASS_INFO[cur.activeClass];
      if (!info) {
        mats.forEach(({ material, baseColor }) => material.color.copy(baseColor));
        return;
      }
      // Reset to base before tinting; lerping from the *current* colour
      // compounds when several scans run back to back.
      const tint = new THREE.Color(info.color);
      mats.forEach(({ material, baseColor }) => {
        material.color.copy(baseColor).lerp(tint, 0.3);
      });
    };

    if (!activeClass || !CLASS_INFO[activeClass]) {
      s.particlesActive = false;
      s.marker.visible = false;
      s.applyTint();
      return;
    }

    const info = CLASS_INFO[activeClass];
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
      seeds.push({ dx: dir.x, dy: dir.y, dz: dir.z, offset: Math.random() * 1.6 });
    }
    s.particleSeeds = seeds;

    s.applyTint();
  }, [activeClass]);

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
}
