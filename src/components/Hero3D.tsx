"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";

/**
 * Hero scene: inside the company's e-750A vertical machining centre.
 * The head moves in Z only; the table carries the part in X/Y, as on the real
 * machine. The part is the company's vacuum base (two-tier plate, notched boss,
 * front recess, X suction groove): a facing pass, then the X groove and centre hole.
 * Sparks, glow, cut trail. Auto-rotate / wireframe / section toggles.
 */

type Pt = { x: number; y: number; z: number; cut: boolean };

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
      type O3 = import("three").Object3D;
      type Mt = import("three").Material;
      type G = import("three").BufferGeometry;

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
      scene.environmentIntensity = 0.75;

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      camera.position.set(3.6, 3.0, 4.3);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.95, 0);
      controls.enableDamping = true;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = 0.4;
      controls.maxPolarAngle = 1.4;
      controls.autoRotate = !reduce;
      controls.autoRotateSpeed = 0.6;

      const textures: import("three").Texture[] = [];
      const mat = (color: number, metalness: number, roughness: number) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
      const part = mat(0x5d6268, 0.85, 0.35); // dark ground steel, like the photo
      const groove = mat(0x26292d, 0.6, 0.6);
      const tableMat = mat(0x4a4f55, 0.75, 0.45);
      const slotMat = mat(0x1d2024, 0.5, 0.6);
      const white = mat(0xe8e9e8, 0.1, 0.45); // machine covers (head)
      const greyCov = mat(0xb9bcbf, 0.2, 0.5);
      const wall = mat(0x2a2d31, 0.3, 0.7); // dim cabin walls so the cut is the focus
      const wallSide = mat(0x34383c, 0.3, 0.7);
      const dark = mat(0x2e3236, 0.4, 0.55);
      const holder = mat(0xd4d8dc, 1, 0.18);
      const carbide = mat(0x4a4f55, 0.9, 0.3);
      const mats = [part, groove, tableMat, slotMat, white, greyCov, wall, wallSide, dark, holder, carbide];
      const edge = new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.25 });

      const add = (g: G, m: Mt, parent: O3, edges = true) => {
        const mesh = new THREE.Mesh(g, m);
        parent.add(mesh);
        if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edge));
        return mesh;
      };
      const boxAt = (w: number, h: number, d: number, x: number, y: number, z: number, m: Mt, parent: O3, edges = true) => {
        const g = new THREE.BoxGeometry(w, h, d);
        g.translate(x, y, z);
        return add(g, m, parent, edges);
      };
      const label = (text: string, w: number, h: number, color: string, font: string) => {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = Math.round((512 * h) / w);
        const g = c.getContext("2d")!;
        g.fillStyle = color;
        g.font = font;
        g.textBaseline = "middle";
        g.fillText(text, 16, c.height / 2);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        textures.push(tex);
        const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
        mats.push(m as unknown as import("three").MeshStandardMaterial);
        return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      };

      // ── machine enclosure (fixed): back wall with window, side walls, floor tray ──
      const cabin = new THREE.Group();
      boxAt(4.2, 3.2, 0.06, 0, 1.4, -1.55, wall, cabin, false);
      boxAt(0.06, 3.2, 3.2, -2.1, 1.4, 0.05, wallSide, cabin, false);
      boxAt(4.2, 0.12, 3.2, 0, -0.24, 0.05, dark, cabin);
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x1a2a38, metalness: 0.3, roughness: 0.1, transparent: true, opacity: 0.85 }),
      );
      win.rotation.y = Math.PI / 2;
      win.position.set(-2.06, 1.55, 0.2);
      cabin.add(win);
      boxAt(0.04, 1.1, 1.3, -2.07, 1.55, 0.2, dark, cabin, false);
      // telescopic way covers under the table
      for (let i = 0; i < 5; i++) boxAt(3.6 - i * 0.12, 0.05, 0.42, 0, -0.14 + i * 0.012, -1.0 + i * 0.03, dark, cabin, false);
      scene.add(cabin);

      // ── moving table (X/Y) with T-slots, carrying the part ──
      const carriage = new THREE.Group();
      boxAt(3.0, 0.2, 1.9, 0, 0.0, 0, tableMat, carriage);
      for (const z of [-0.6, 0, 0.6]) boxAt(3.02, 0.04, 0.12, 0, 0.081, z, slotMat, carriage, false);
      scene.add(carriage);

      // part: the vacuum base from the product photo (units ≈ 0.01 m)
      const work = new THREE.Group();
      carriage.add(work);
      const BY = 0.1; // table top
      const baseW = 1.7, baseH = 0.2, bossW = 1.36, bossH = 0.26, notch = 0.2, recessW = 0.86, recessD = 0.12;
      const TOP = BY + baseH + bossH;
      // base plate with two half-round notches on the front edge
      {
        const s = new THREE.Shape();
        s.moveTo(-baseW / 2, -baseW / 2);
        s.lineTo(-0.28, -baseW / 2);
        s.absarc(-0.18, -baseW / 2, 0.1, Math.PI, 0, true);
        s.lineTo(0.08, -baseW / 2);
        s.absarc(0.18, -baseW / 2, 0.1, Math.PI, 0, true);
        s.lineTo(baseW / 2, -baseW / 2);
        s.lineTo(baseW / 2, baseW / 2);
        s.lineTo(-baseW / 2, baseW / 2);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: baseH, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 16 });
        // rotateX(-90°): shape y → −z (front faces the camera), extrusion → +y
        g.rotateX(-Math.PI / 2);
        g.translate(0, BY, 0);
        add(g, part, work);
        // counterbored holes on the front face
        for (const x of [-0.18, 0.18]) {
          const h = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20);
          h.rotateX(Math.PI / 2);
          h.translate(x, BY + baseH * 0.55, baseW / 2 + 0.002);
          add(h, groove, work, false);
        }
      }
      // boss: square with notched corners and a recess in the front face
      {
        const a = bossW / 2, n = notch, r = recessW / 2;
        const pts: [number, number][] = [
          [-a + n, -a], [-r, -a], [-r, -a + recessD], [r, -a + recessD], [r, -a], [a - n, -a], [a - n, -a + n * 0.55], [a, -a + n * 0.55],
          [a, a - n * 0.55], [a - n, a - n * 0.55], [a - n, a], [-a + n, a], [-a + n, a - n * 0.55], [-a, a - n * 0.55],
          [-a, -a + n * 0.55], [-a + n, -a + n * 0.55],
        ];
        // shape is drawn in XY with y = -z so the recess faces the camera (+Z)
        const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
        const g = new THREE.ExtrudeGeometry(s, { depth: bossH, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 });
        g.rotateX(-Math.PI / 2);
        g.translate(0, BY + baseH, 0);
        add(g, part, work);
        // side hole in the recess
        const h = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24);
        h.rotateX(Math.PI / 2);
        h.translate(0, BY + baseH + bossH * 0.5, a - recessD + 0.002);
        add(h, groove, work, false);
      }
      scene.add(carriage);

      // X groove + centre hole: revealed as the tool cuts them
      const grooveArms: import("three").Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const ang = Math.PI / 4 + (i * Math.PI) / 2;
        const g = new THREE.BoxGeometry(0.5, 0.008, 0.065);
        g.translate(0.25, 0, 0);
        const m = new THREE.Mesh(g, groove);
        m.position.set(0, TOP + 0.004, 0);
        m.rotation.y = -ang;
        m.scale.x = 0.0001;
        work.add(m);
        grooveArms.push(m);
      }
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 6), groove);
      hole.position.set(0, TOP + 0.005, 0);
      hole.scale.setScalar(0.0001);
      work.add(hole);

      // ── toolpath (part coordinates): facing raster, then the X groove ──
      const path: Pt[] = [];
      const up = 0.3;
      const go = (x: number, z: number, cut: boolean, y = TOP) => path.push({ x, y: cut ? y : y + up, z, cut });
      const lim = 0.56;
      for (let p = 0; p < 7; p++) {
        const z = -lim + (2 * lim * p) / 6, xa = p % 2 ? lim : -lim, xb = -xa;
        go(xa, z, false);
        go(xa, z, true);
        go(xb, z, true);
        go(xb, z, false);
      }
      for (let i = 0; i < 4; i++) {
        const ang = Math.PI / 4 + (i * Math.PI) / 2, ex = Math.cos(ang) * 0.5, ez = Math.sin(ang) * 0.5;
        go(0, 0, false);
        go(0, 0, true, TOP - 0.01);
        go(ex, ez, true, TOP - 0.01);
        go(ex, ez, false);
      }
      go(0, 0, false);
      const segLen: number[] = [];
      let total = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        const l = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        segLen.push(l);
        total += l;
      }
      // cut trail (orange), in part coordinates so it rides on the table
      const trailPos = new Float32Array((path.length - 1) * 6);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setDrawRange(0, 0);
      const trailMat = new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9 });
      const trail = new THREE.LineSegments(trailGeo, trailMat);
      work.add(trail);

      // ── head (Z only): e-750A head casing, spindle nose, holder, end mill ──
      const head = new THREE.Group();
      const tool = new THREE.Group();
      head.add(tool);
      const cyl = (r1: number, r2: number, h: number, y: number, m: Mt, seg: number, parent: O3) => {
        const g = new THREE.CylinderGeometry(r1, r2, h, seg);
        g.translate(0, y + h / 2, 0);
        return add(g, m, parent);
      };
      const mill = new THREE.CylinderGeometry(0.03, 0.03, 0.36, 20);
      mill.translate(0, 0.18, 0);
      tool.add(new THREE.Mesh(mill, carbide));
      const flutePts: import("three").Vector3[] = [];
      for (let i = 0; i <= 60; i++) flutePts.push(new THREE.Vector3(Math.cos(i * 0.42) * 0.032, (i / 60) * 0.26, Math.sin(i * 0.42) * 0.032));
      tool.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(flutePts), new THREE.LineBasicMaterial({ color: 0xd8dde2 })));
      cyl(0.055, 0.055, 0.05, 0.36, holder, 40, tool);
      cyl(0.09, 0.065, 0.11, 0.41, holder, 8, tool);
      cyl(0.12, 0.09, 0.2, 0.52, holder, 40, tool);
      cyl(0.2, 0.12, 0.14, 0.72, holder, 12, tool);
      cyl(0.26, 0.26, 0.2, 0.86, dark, 40, head); // spindle nose
      // head casing: light grey with white cover, like the e-750A
      boxAt(1.0, 1.3, 1.0, 0, 1.06 + 0.65, -0.1, greyCov, head);
      boxAt(1.04, 0.5, 1.04, 0, 1.06 + 1.3 + 0.25, -0.1, white, head);
      boxAt(0.12, 1.8, 0.6, 0.56, 1.06 + 0.9, -0.3, dark, head, false); // Z-axis way cover
      const plate = label("e-750A", 0.5, 0.12, "#3a3f45", "italic 700 66px Arial, sans-serif");
      plate.position.set(-0.12, 1.06 + 0.2, 0.402);
      head.add(plate);
      const stripe = label("", 1.0, 0.02, "#ff8a1f", "10px Arial");
      (stripe.material as import("three").MeshBasicMaterial).map = null;
      (stripe.material as import("three").MeshBasicMaterial).color.set(0xff8a1f);
      (stripe.material as import("three").MeshBasicMaterial).transparent = false;
      stripe.position.set(0, 1.06 + 0.36, 0.402);
      head.add(stripe);
      // coolant nozzles
      for (const a of [0.7, 2.4]) {
        const n = new THREE.CylinderGeometry(0.016, 0.02, 0.42, 10);
        n.translate(0, -0.21, 0);
        const m = new THREE.Mesh(n, holder);
        m.position.set(Math.cos(a) * 0.24, 0.92, Math.sin(a) * 0.24);
        m.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
        head.add(m);
      }
      scene.add(head);

      // ── lights, glow, sparks ──
      const key = new THREE.DirectionalLight(0xdfeaff, 1.0);
      key.position.set(3, 5, 3);
      const warm = new THREE.PointLight(0xff8a1f, 0, 1.4, 2);
      scene.add(key, warm, new THREE.AmbientLight(0x3a4250, 0.55));
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
        const tex = new THREE.CanvasTexture(c);
        textures.push(tex);
        return tex;
      })();
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      scene.add(glow);

      const CN = 320;
      const cpos = new Float32Array(CN * 3), cvel = new Float32Array(CN * 3), clife = new Float32Array(CN), spos = new Float32Array(CN * 6);
      for (let i = 0; i < CN; i++) cpos[i * 3 + 1] = -10;
      spos.fill(-10);
      const chipGeo = new THREE.BufferGeometry();
      chipGeo.setAttribute("position", new THREE.BufferAttribute(cpos, 3));
      scene.add(new THREE.Points(chipGeo, new THREE.PointsMaterial({ color: 0xffb35c, size: 0.04, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
      const streakGeo = new THREE.BufferGeometry();
      streakGeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
      scene.add(
        new THREE.LineSegments(
          streakGeo,
          new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }),
        ),
      );

      // ── toggles ──
      const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
      const setWire = (on: boolean) => {
        mats.forEach((m) => "wireframe" in m && (m.wireframe = on));
        edge.opacity = on ? 0.1 : 0.25;
      };
      const setSection = (on: boolean) => {
        [part, groove].forEach((m) => {
          m.clippingPlanes = on ? [clip] : [];
          m.side = on ? THREE.DoubleSide : THREE.FrontSide;
          m.needsUpdate = true;
        });
        edge.clippingPlanes = on ? [clip] : [];
        trailMat.clippingPlanes = on ? [clip] : [];
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

      // ── motion ──
      let dist = reduce ? total * 0.985 : 0, cutting = false;
      const tip = new THREE.Vector3();
      const place = (d: number) => {
        let i = 0, acc = 0;
        while (i < segLen.length - 1 && acc + segLen[i] < d) acc += segLen[i++];
        const u = segLen[i] ? Math.min(1, (d - acc) / segLen[i]) : 0;
        const a = path[i], b = path[i + 1];
        const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, z = a.z + (b.z - a.z) * u;
        cutting = a.cut && b.cut;
        // table moves the part under the fixed spindle axis; the head moves only in Z (here: y)
        carriage.position.set(-x, 0, -z);
        head.position.y = y;
        tip.set(0, y, 0);
        // trail up to the current point, cut segments only
        let n = 0;
        for (let k = 0; k <= i; k++) {
          const p = path[k], q = k === i ? { x, y, z, cut: cutting } : path[k + 1];
          if (!(p.cut && q.cut)) continue;
          trailPos.set([p.x, p.y + 0.004, p.z, q.x, q.y + 0.004, q.z], n * 6);
          n++;
        }
        trailGeo.setDrawRange(0, n * 2);
        trailGeo.attributes.position.needsUpdate = true;
        // reveal the X groove and centre hole as they are cut
        const grooveStart = 7 * 4;
        grooveArms.forEach((arm, k) => {
          const s = grooveStart + k * 4 + 1;
          const f = i > s + 1 ? 1 : i === s + 1 ? u : 0;
          arm.scale.x = Math.max(0.0001, f);
        });
        hole.scale.setScalar(i >= grooveStart + 1 ? 1 : 0.0001);
      };
      place(dist);

      const clock = new THREE.Clock();
      let raf = 0, visible = true;
      const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!reduce) {
          dist += dt * 0.9;
          if (dist >= total) dist = 0;
          place(dist);
          tool.rotation.y += dt * 40;
          const flick = cutting ? 0.7 + Math.random() * 0.6 : 0;
          warm.position.copy(tip).add(new THREE.Vector3(0, 0.06, 0));
          warm.intensity = 2.2 * flick;
          glow.position.copy(tip).add(new THREE.Vector3(0, 0.03, 0));
          glow.scale.setScalar(0.16 + 0.2 * flick);
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
            // bounce on the part top or the table
            const px = cpos[i * 3] - carriage.position.x, pz = cpos[i * 3 + 2] - carriage.position.z;
            const floor = Math.abs(px) < bossW / 2 && Math.abs(pz) < bossW / 2 ? TOP : Math.abs(px) < 1.5 && Math.abs(pz) < 0.95 ? BY : -0.2;
            if (cpos[i * 3 + 1] < floor) {
              cpos[i * 3 + 1] = floor;
              cvel[i * 3 + 1] *= -0.3;
            }
            const L = 0.035;
            spos.set([cpos[i * 3], cpos[i * 3 + 1], cpos[i * 3 + 2], cpos[i * 3] - cvel[i * 3] * L, cpos[i * 3 + 1] - cvel[i * 3 + 1] * L, cpos[i * 3 + 2] - cvel[i * 3 + 2] * L], i * 6);
          }
          chipGeo.attributes.position.needsUpdate = true;
          streakGeo.attributes.position.needsUpdate = true;
        } else {
          glow.material.opacity = 0;
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
        [...mats, edge, trailMat].forEach((m) => m.dispose());
        textures.forEach((x) => x.dispose());
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
