"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";

/**
 * Hero scene: CNC milling of a mould insert. A spindle with an end mill follows
 * a zig-zag 3D-surface toolpath across the cavity; the cut path is traced in
 * orange behind the tool and chips fly off at the tip.
 * Auto-rotate / wireframe / section-view toggles. Static under reduced motion.
 */

// mould surface height (world units) at x, z: a pocket with a raised core and a side rib
function surface(x: number, z: number) {
  const pocket = Math.max(0, 1 - (x / 0.82) ** 2 - (z / 0.46) ** 2);
  const core = Math.exp(-((x - 0.18) ** 2 / 0.05 + (z + 0.02) ** 2 / 0.02));
  const rib = Math.exp(-((x + 0.45) ** 2 / 0.008)) * (Math.abs(z) < 0.3 ? 1 : 0);
  const ripple = 0.006 * Math.sin(x * 18) * Math.cos(z * 14);
  return -0.2 * Math.sqrt(pocket) + 0.11 * core + 0.05 * rib * pocket + ripple;
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

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
      camera.position.set(3.4, 2.7, 3.9);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.55, 0);
      controls.enableDamping = true;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = 1.45;
      controls.autoRotate = !reduce;
      controls.autoRotateSpeed = 0.7;

      const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
      const mat = (color: number, metalness: number, roughness: number) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
      const steel = mat(0xb4bac0, 0.95, 0.26); // workpiece
      const tableMat = mat(0x3c4147, 0.7, 0.5);
      const holder = mat(0xd4d8dc, 1, 0.18); // polished tool holder
      const body = mat(0x6a7178, 0.8, 0.4); // spindle housing
      const carbide = mat(0x4a4f55, 0.9, 0.3); // end mill
      const mats = [steel, tableMat, holder, body, carbide];
      const edge = new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.28 });
      const workMats = [steel]; // section view cuts the workpiece only

      const add = (g: import("three").BufferGeometry, m: import("three").Material, parent: import("three").Object3D, edges = true) => {
        const mesh = new THREE.Mesh(g, m);
        parent.add(mesh);
        if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edge));
        return mesh;
      };

      // ── machine table with T-slots ──
      const table = new THREE.Group();
      const top = new THREE.BoxGeometry(3.4, 0.16, 2.2);
      top.translate(0, 0.08, 0);
      add(top, tableMat, table);
      for (const z of [-0.7, 0, 0.7]) {
        const slot = new THREE.BoxGeometry(3.42, 0.04, 0.12);
        slot.translate(0, 0.161, z);
        add(slot, mat(0x1d2024, 0.5, 0.6), table, false);
      }
      scene.add(table);

      // ── mould insert: block + sculpted top surface ──
      const SX = 2.0, SZ = 1.3, baseH = 0.5, y0 = 0.16; // block size and table height
      const work = new THREE.Group();
      const block = new THREE.BoxGeometry(SX, baseH, SZ);
      block.translate(0, y0 + baseH / 2, 0);
      add(block, steel, work);
      const N = 120;
      const surf = new THREE.PlaneGeometry(SX, SZ, N, Math.round((N * SZ) / SX));
      surf.rotateX(-Math.PI / 2);
      const pos = surf.attributes.position as import("three").BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, y0 + baseH + surface(x, z));
      }
      surf.computeVertexNormals();
      add(surf, steel, work, false);
      // side skirts so the sculpted top meets the block walls
      const skirt = (len: number, along: "x" | "z", side: number) => {
        const n = 80, verts: number[] = [], idx: number[] = [];
        for (let i = 0; i <= n; i++) {
          const u = -len / 2 + (len * i) / n;
          const x = along === "x" ? u : side * (SX / 2);
          const z = along === "x" ? side * (SZ / 2) : u;
          verts.push(x, y0 + baseH, z, x, y0 + baseH + surface(x, z), z);
          if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, steel);
        work.add(m);
      };
      skirt(SX, "x", 1); skirt(SX, "x", -1); skirt(SZ, "z", 1); skirt(SZ, "z", -1);
      steel.side = THREE.DoubleSide;
      // clamps
      for (const s of [-1, 1]) {
        const c = new THREE.BoxGeometry(0.5, 0.12, 0.22);
        c.translate(s * (SX / 2 + 0.05), y0 + baseH - 0.02, s * 0.35);
        add(c, tableMat, work);
      }
      scene.add(work);

      // ── zig-zag surface toolpath ──
      const path: number[] = [];
      const passes = 15, xs = 0.8, zs = 0.48;
      for (let p = 0; p < passes; p++) {
        const z = -zs + (2 * zs * p) / (passes - 1);
        for (let i = 0; i <= 60; i++) {
          const u = i / 60, x = p % 2 ? xs - 2 * xs * u : -xs + 2 * xs * u;
          path.push(x, y0 + baseH + surface(x, z) + 0.004, z);
        }
      }
      const pathPts = path.length / 3;
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.Float32BufferAttribute(path, 3));
      trailGeo.setDrawRange(0, 0);
      const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9 }));
      scene.add(trail);

      // ── spindle with end mill (origin = tool tip) ──
      const spindle = new THREE.Group();
      const tool = new THREE.Group();
      spindle.add(tool);
      const cyl = (r1: number, r2: number, h: number, y: number, m: import("three").Material, seg = 40, parent: import("three").Object3D = spindle) => {
        const g = new THREE.CylinderGeometry(r1, r2, h, seg);
        g.translate(0, y + h / 2, 0);
        return add(g, m, parent);
      };
      const mill = new THREE.CylinderGeometry(0.035, 0.035, 0.42, 20);
      mill.translate(0, 0.21, 0);
      tool.add(new THREE.Mesh(mill, carbide));
      // helical flutes
      const flutePts: import("three").Vector3[] = [];
      for (let i = 0; i <= 60; i++) flutePts.push(new THREE.Vector3(Math.cos(i * 0.42) * 0.037, (i / 60) * 0.3, Math.sin(i * 0.42) * 0.037));
      tool.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(flutePts), new THREE.LineBasicMaterial({ color: 0xd8dde2 })));
      cyl(0.06, 0.06, 0.06, 0.42, holder, 40, tool); // collet
      cyl(0.1, 0.07, 0.12, 0.48, holder, 8, tool); // collet nut (faceted, so the spin shows)
      cyl(0.13, 0.1, 0.22, 0.6, holder, 40, tool); // holder body
      cyl(0.22, 0.13, 0.16, 0.82, holder, 12, tool); // taper flange
      const flange = cyl(0.24, 0.24, 0.05, 0.98, body);
      flange.userData.keep = true;
      cyl(0.36, 0.36, 1.4, 1.03, body, 48); // spindle housing
      // coolant nozzles
      for (const a of [0.6, 2.5]) {
        const n = new THREE.CylinderGeometry(0.018, 0.022, 0.45, 10);
        n.translate(0, -0.22, 0);
        const m = new THREE.Mesh(n, holder);
        m.position.set(Math.cos(a) * 0.3, 1.05, Math.sin(a) * 0.3);
        m.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
        spindle.add(m);
      }
      scene.add(spindle);

      // ── lights ──
      const key = new THREE.DirectionalLight(0xcfe3ff, 1.0);
      key.position.set(3, 5, 2);
      const warm = new THREE.PointLight(0xff8a1f, 0, 1.5, 2);
      scene.add(key, warm, new THREE.AmbientLight(0x3a4250, 0.5));

      // ── chips at the cutting point ──
      const CN = 320;
      const cpos = new Float32Array(CN * 3), cvel = new Float32Array(CN * 3), clife = new Float32Array(CN);
      const chipGeo = new THREE.BufferGeometry();
      chipGeo.setAttribute("position", new THREE.BufferAttribute(cpos, 3));
      const chips = new THREE.Points(
        chipGeo,
        new THREE.PointsMaterial({ color: 0xffb35c, size: 0.04, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      scene.add(chips);
      for (let i = 0; i < CN; i++) cpos[i * 3 + 1] = -10;
      // streaks: a short line from each spark back along its velocity
      const spos = new Float32Array(CN * 6);
      const streakGeo = new THREE.BufferGeometry();
      streakGeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
      const streaks = new THREE.LineSegments(
        streakGeo,
        new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      scene.add(streaks);
      // glow sprite at the cutting point
      const glowTex = (() => {
        const c = document.createElement("canvas");
        c.width = c.height = 64;
        const g = c.getContext("2d")!;
        const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0, "rgba(255,240,200,1)");
        r.addColorStop(0.25, "rgba(255,160,60,0.8)");
        r.addColorStop(1, "rgba(255,120,20,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      })();
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      glow.scale.setScalar(0.3);
      scene.add(glow);

      // ── toggles ──
      const setWire = (on: boolean) => {
        mats.forEach((m) => (m.wireframe = on));
        edge.opacity = on ? 0.1 : 0.28;
      };
      const setSection = (on: boolean) => {
        workMats.forEach((m) => {
          m.clippingPlanes = on ? [clip] : [];
          m.needsUpdate = true;
        });
        edge.clippingPlanes = on ? [clip] : [];
        trail.material.clippingPlanes = on ? [clip] : [];
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
      let raf = 0, visible = true, cutting = true, progress = reduce ? pathPts * 0.55 : 0;
      const tip = new THREE.Vector3();
      const place = (f: number) => {
        const i = Math.min(Math.floor(f), pathPts - 2), u = f - i;
        tip.set(
          path[i * 3] + (path[i * 3 + 3] - path[i * 3]) * u,
          path[i * 3 + 1] + (path[i * 3 + 4] - path[i * 3 + 1]) * u,
          path[i * 3 + 2] + (path[i * 3 + 5] - path[i * 3 + 2]) * u,
        );
        // lift between passes: retract near the end of a pass, plunge at the start of the next
        const k = (f % 61) / 61;
        const lift = k < 0.06 ? (0.06 - k) / 0.06 : k > 0.94 ? (k - 0.94) / 0.06 : 0;
        spindle.position.copy(tip);
        spindle.position.y += 0.28 * lift * lift;
        cutting = lift < 0.05;
        trailGeo.setDrawRange(0, i + 1);
      };
      place(progress);

      const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!reduce) {
          progress += dt * 34;
          if (progress >= pathPts - 1) progress = 0;
          place(progress);
          tool.rotation.y += dt * 40;
          const flick = cutting ? 0.7 + Math.random() * 0.6 : 0;
          warm.position.copy(tip).add(new THREE.Vector3(0, 0.06, 0));
          warm.intensity = 2.2 * flick;
          glow.position.copy(tip).add(new THREE.Vector3(0, 0.03, 0));
          glow.scale.setScalar(0.18 + 0.22 * flick);
          glow.material.opacity = flick;
          for (let i = 0; i < CN; i++) {
            clife[i] -= dt;
            if (clife[i] <= 0) {
              if (cutting && Math.random() < 0.6) {
                const a = Math.random() * Math.PI * 2, sp = 0.8 + Math.random() * 2.2;
                cpos.set([tip.x, tip.y + 0.02, tip.z], i * 3);
                cvel.set([Math.cos(a) * sp, 0.8 + Math.random() * 2, Math.sin(a) * sp], i * 3);
                clife[i] = 0.25 + Math.random() * 0.55;
              } else {
                cpos[i * 3 + 1] = -10;
                spos.fill(-10, i * 6, i * 6 + 6);
              }
              continue;
            }
            cvel[i * 3 + 1] -= 5 * dt;
            cpos[i * 3] += cvel[i * 3] * dt;
            cpos[i * 3 + 1] += cvel[i * 3 + 1] * dt;
            cpos[i * 3 + 2] += cvel[i * 3 + 2] * dt;
            // bounce off the workpiece top
            if (cpos[i * 3 + 1] < y0 + baseH - 0.15 && Math.abs(cpos[i * 3]) < SX / 2 && Math.abs(cpos[i * 3 + 2]) < SZ / 2) {
              cpos[i * 3 + 1] = y0 + baseH - 0.15;
              cvel[i * 3 + 1] *= -0.3;
            }
            const L = 0.035;
            spos.set([cpos[i * 3], cpos[i * 3 + 1], cpos[i * 3 + 2], cpos[i * 3] - cvel[i * 3] * L, cpos[i * 3 + 1] - cvel[i * 3 + 1] * L, cpos[i * 3 + 2] - cvel[i * 3 + 2] * L], i * 6);
          }
          chipGeo.attributes.position.needsUpdate = true;
          streakGeo.attributes.position.needsUpdate = true;
        }
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
        scene.traverse((o) => (o as unknown as { geometry?: { dispose(): void } }).geometry?.dispose());
        [...mats, edge].forEach((m) => m.dispose());
        glowTex.dispose();
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
