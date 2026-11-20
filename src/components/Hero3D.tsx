"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";

type Three = typeof import("three");

/** Cavity / electrode profile: a connector-style pocket with two locating notches. */
function profile(THREE: Three, s = 1) {
  const w = 0.62 * s, h = 0.36 * s, n = 0.14 * s, r = 0.05 * s;
  const sh = new THREE.Shape();
  sh.moveTo(-w + r, -h);
  sh.lineTo(-n, -h);
  sh.lineTo(-n, -h + n * 0.9);
  sh.lineTo(n, -h + n * 0.9);
  sh.lineTo(n, -h);
  sh.lineTo(w - r, -h);
  sh.quadraticCurveTo(w, -h, w, -h + r);
  sh.lineTo(w, h - r);
  sh.quadraticCurveTo(w, h, w - r, h);
  sh.lineTo(-w + r, h);
  sh.quadraticCurveTo(-w, h, -w, h - r);
  sh.lineTo(-w, -h + r);
  sh.quadraticCurveTo(-w, -h, -w + r, -h);
  return sh;
}

export default function Hero3D({ t }: { t: Dict["hero"] }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [rotate, setRotate] = useState(true);
  const [wire, setWire] = useState(false);
  const [section, setSection] = useState(false);
  const api = useRef<{ rotate(on: boolean): void; wire(on: boolean): void; section(on: boolean): void } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.localClippingEnabled = true;
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(3.9, 2.9, 4.4);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.45, 0);
      controls.enableDamping = true;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = 1.45;
      controls.autoRotate = !reduce;
      controls.autoRotateSpeed = 0.9;

      const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
      const steel = new THREE.MeshStandardMaterial({ color: 0xaeb4ba, metalness: 0.92, roughness: 0.28 });
      const copper = new THREE.MeshStandardMaterial({ color: 0xc8743c, metalness: 1, roughness: 0.3 });
      const holder = new THREE.MeshStandardMaterial({ color: 0x5d646b, metalness: 0.85, roughness: 0.4 });
      const mats = [steel, copper, holder];
      const edge = new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.35 });

      const add = (g: import("three").BufferGeometry, m: import("three").Material, parent: import("three").Object3D) => {
        const mesh = new THREE.Mesh(g, m);
        parent.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edge));
        return mesh;
      };

      // mould insert: solid base + top plate with the cavity
      const insert = new THREE.Group();
      const base = new THREE.BoxGeometry(2.4, 0.5, 1.8);
      base.translate(0, 0.25, 0);
      add(base, steel, insert);
      const top = new THREE.Shape();
      top.moveTo(-1.2, -0.9); top.lineTo(1.2, -0.9); top.lineTo(1.2, 0.9); top.lineTo(-1.2, 0.9); top.closePath();
      const cav = profile(THREE);
      top.holes.push(new THREE.Path(cav.getPoints(8).reverse()));
      // ejector / guide holes
      for (const [x, z] of [[-0.95, -0.65], [0.95, -0.65], [-0.95, 0.65], [0.95, 0.65]]) {
        const h = new THREE.Path();
        h.absarc(x, z, 0.09, 0, Math.PI * 2, true);
        top.holes.push(h);
      }
      const plate = new THREE.ExtrudeGeometry(top, { depth: 0.32, bevelEnabled: false, curveSegments: 24 });
      // same rotation as the electrode so the cavity and the electrode profile line up
      plate.rotateX(-Math.PI / 2);
      plate.translate(0, 0.5, 0);
      add(plate, steel, insert);
      scene.add(insert);

      // copper electrode with holder
      const electrode = new THREE.Group();
      const tip = new THREE.ExtrudeGeometry(profile(THREE, 0.96), { depth: 0.55, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 });
      tip.rotateX(-Math.PI / 2);
      add(tip, copper, electrode);
      const shank = new THREE.BoxGeometry(1.0, 0.42, 0.62);
      shank.translate(0, 0.76, 0);
      add(shank, holder, electrode);
      scene.add(electrode);

      // floor: grid + 360° ring
      const grid = new THREE.GridHelper(6, 24, 0x3a3f45, 0x24282c);
      (grid.material as InstanceType<Three["Material"]>).transparent = true;
      (grid.material as InstanceType<Three["Material"]>).opacity = 0.55;
      scene.add(grid);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.75, 1.77, 96),
        new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      );
      ring.rotateX(-Math.PI / 2);
      ring.position.y = 0.002;
      scene.add(ring);

      // spark light + particles in the gap
      const sparkLight = new THREE.PointLight(0xff8a1f, 0, 3, 2);
      scene.add(sparkLight);
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(3, 5, 2);
      scene.add(key, new THREE.AmbientLight(0x404650, 0.5));

      const N = 220;
      const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const sparks = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: 0xffb35c, size: 0.035, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      scene.add(sparks);
      const cavityFloor = 0.5;
      const spawn = (i: number, gapY: number) => {
        pos[i * 3] = (Math.random() - 0.5) * 1.15;
        pos[i * 3 + 1] = gapY;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.65;
        const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.6;
        vel[i * 3] = Math.cos(a) * sp;
        vel[i * 3 + 1] = 0.8 + Math.random() * 1.8;
        vel[i * 3 + 2] = Math.sin(a) * sp;
        life[i] = 0.25 + Math.random() * 0.6;
      };
      for (let i = 0; i < N; i++) life[i] = Math.random() * 0.5;

      let wireOn = false;
      const setWire = (on: boolean) => {
        wireOn = on;
        mats.forEach((m) => (m.wireframe = on));
        edge.opacity = on ? 0.12 : 0.35;
      };
      const setSection = (on: boolean) => {
        mats.forEach((m) => {
          m.clippingPlanes = on ? [clip] : [];
          m.side = on ? THREE.DoubleSide : THREE.FrontSide;
          m.needsUpdate = true;
        });
        edge.clippingPlanes = on ? [clip] : [];
      };

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const clock = new THREE.Clock();
      let raf = 0, visible = true, t = 0;
      const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!reduce) t += dt;
        // servo motion: electrode feeds into the cavity and retracts to flush
        const feed = reduce ? 0.6 : 0.5 + 0.5 * Math.sin(t * 0.7);
        const tipY = cavityFloor + 0.02 + (1 - feed) * 0.75;
        electrode.position.y = tipY;
        const gap = tipY;
        const burning = feed > 0.55;
        sparkLight.position.set(0, gap + 0.05, 0);
        sparkLight.intensity = burning && !wireOn ? 1.6 + Math.random() * 1.6 : 0;
        for (let i = 0; i < N; i++) {
          life[i] -= dt;
          if (life[i] <= 0) {
            if (burning && !reduce) spawn(i, gap);
            else { pos[i * 3 + 1] = -10; continue; }
          }
          vel[i * 3 + 1] -= 6 * dt;
          pos[i * 3] += vel[i * 3] * dt;
          pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
          pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        }
        geo.attributes.position.needsUpdate = true;
        controls.update();
        renderer.render(scene, camera);
        raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
      };
      const play = () => {
        if (!raf && visible && !document.hidden) {
          clock.getDelta();
          raf = requestAnimationFrame(frame);
        }
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        play();
      });
      io.observe(el);
      const onVis = () => play();
      document.addEventListener("visibilitychange", onVis);
      controls.addEventListener("change", play);

      api.current = {
        rotate: (on) => ((controls.autoRotate = on && !reduce), play()),
        wire: (on) => (setWire(on), play()),
        section: (on) => (setSection(on), play()),
      };
      play();
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        scene.traverse((o) => {
          const m = o as unknown as { geometry?: { dispose(): void } };
          m.geometry?.dispose();
        });
        [...mats, edge].forEach((m) => m.dispose());
        pmrem.dispose();
        controls.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
      api.current = null;
    };
  }, []);

  useEffect(() => api.current?.rotate(rotate), [rotate]);
  useEffect(() => api.current?.wire(wire), [wire]);
  useEffect(() => api.current?.section(section), [section]);

  return (
    <figure className="viewer3d">
      <div className="viewer3d-stage" ref={host} role="img" aria-label={t.viewerLabel}>
        {!ready && <p className="viewer3d-loading">{t.loading}</p>}
        <span className="viewer3d-hint" aria-hidden="true">
          {t.dragHint} · 360°
        </span>
      </div>
      <figcaption>
        <span className="viewer3d-caption">{t.viewerLabel}</span>
        <span className="viewer3d-controls">
          <button type="button" aria-pressed={rotate} onClick={() => setRotate((v) => !v)}>
            {t.controls.rotate}
          </button>
          <button type="button" aria-pressed={wire} onClick={() => setWire((v) => !v)}>
            {t.controls.wireframe}
          </button>
          <button type="button" aria-pressed={section} onClick={() => setSection((v) => !v)}>
            {t.controls.section}
          </button>
        </span>
      </figcaption>
    </figure>
  );
}
