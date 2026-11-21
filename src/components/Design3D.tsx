"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { deflux } from "./deflux";
import { mv1200s } from "./mv1200s";
import { carrier, copperRing, magazine, vacuumPlate } from "./xmModels";

type T = Dict["design"];
type Three = typeof import("three");
type Builder = (THREE: Three) => import("three").Group | import("three").BufferGeometry;

/** Order matches `design.items` in the dictionary. */
const builders: Builder[] = [deflux, carrier, vacuumPlate, copperRing, magazine, mv1200s];

export default function Design3D({ t }: { t: T }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [wire, setWire] = useState(false);
  const [ready, setReady] = useState(false);
  const api = useRef<{ show: (i: number) => void; wire: (on: boolean) => void } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    // load three only when the viewer comes near the screen
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (disposed) return;

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.domElement.setAttribute("aria-hidden", "true");
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(2.6, 1.8, 3.4);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.autoRotate = !reduce;
        controls.autoRotateSpeed = 1.2;

        // shared look for plain geometry (e.g. the Deflux plate)
        const metal = new THREE.MeshStandardMaterial({ color: 0xbfc5cb, metalness: 0.9, roughness: 0.3 });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.5 });
        const key = new THREE.DirectionalLight(0xffe2c4, 1.1);
        key.position.set(3, 4, 2);
        scene.add(key, new THREE.AmbientLight(0x404650, 0.6));

        let current: import("three").Group | null = null;
        let wireOn = false;
        let styledMats: { wireframe?: boolean }[] = [];

        const disposeObj = (o: import("three").Object3D) => {
          o.traverse((c) => (c as unknown as { geometry?: { dispose(): void } }).geometry?.dispose());
          for (const m of (o.userData.materials ?? []) as { map?: { dispose(): void } | null; dispose(): void }[]) {
            m.map?.dispose();
            m.dispose();
          }
        };

        const show = (i: number) => {
          if (current) {
            scene.remove(current);
            disposeObj(current);
          }
          const built = builders[i](THREE);
          const styled = built instanceof THREE.Group && built.userData.styled;
          const inner = new THREE.Group();
          styledMats = [];
          if (styled) {
            inner.add(built);
            styledMats = built.userData.materials;
            inner.userData.materials = built.userData.materials;
          } else {
            const meshes: import("three").Mesh[] = [];
            if (built instanceof THREE.Group) built.children.forEach((c) => meshes.push(c as import("three").Mesh));
            else meshes.push(new THREE.Mesh(built));
            for (const m of meshes) {
              m.material = metal;
              inner.add(m);
              inner.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), edgeMat));
            }
          }
          const box = new THREE.Box3().setFromObject(inner);
          const size = box.getSize(new THREE.Vector3()).length();
          inner.position.sub(box.getCenter(new THREE.Vector3()));
          const group = new THREE.Group();
          group.add(inner);
          group.scale.setScalar(2.6 / size);
          const rot = (styled && built.userData.rotation) || [-0.35, 0.4, 0];
          group.rotation.set(rot[0], rot[1], rot[2]);
          group.userData.materials = inner.userData.materials;
          scene.add(group);
          current = group;
          metal.wireframe = wireOn;
          styledMats.forEach((m) => "wireframe" in m && (m.wireframe = wireOn));
        };

        const setWireOn = (on: boolean) => {
          wireOn = on;
          metal.wireframe = on;
          styledMats.forEach((m) => "wireframe" in m && (m.wireframe = on));
          edgeMat.opacity = on ? 0.15 : 0.5;
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

        let raf = 0, visible = true;
        const loop = () => {
          controls.update();
          renderer.render(scene, camera);
          raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
        };
        const vis = new IntersectionObserver(([en]) => {
          visible = en.isIntersecting;
          if (visible && !raf) raf = requestAnimationFrame(loop);
        });
        vis.observe(el);
        const onVis = () => !document.hidden && visible && !raf && (raf = requestAnimationFrame(loop));
        document.addEventListener("visibilitychange", onVis);

        api.current = {
          show: (i) => {
            show(i);
            if (!raf) raf = requestAnimationFrame(loop);
          },
          wire: setWireOn,
        };
        show(0);
        raf = requestAnimationFrame(loop);
        setReady(true);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          vis.disconnect();
          document.removeEventListener("visibilitychange", onVis);
          if (current) disposeObj(current);
          metal.dispose();
          edgeMat.dispose();
          pmrem.dispose();
          controls.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      },
      { rootMargin: "300px" },
    );
    io.observe(el);

    return () => {
      disposed = true;
      io.disconnect();
      cleanup();
      api.current = null;
    };
  }, []);

  useEffect(() => api.current?.show(active), [active]);
  useEffect(() => api.current?.wire(wire), [wire]);

  const item = t.items[active];

  return (
    <div className="d3">
      <div className="d3-tabs" role="tablist" aria-label={t.label}>
        {t.items.map((p, i) => (
          <button
            key={p.name}
            type="button"
            role="tab"
            id={`d3-tab-${i}`}
            aria-selected={i === active}
            aria-controls="d3-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const n = (active + (e.key === "ArrowRight" ? 1 : -1) + t.items.length) % t.items.length;
              setActive(n);
              document.getElementById(`d3-tab-${n}`)?.focus();
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="d3-stage" id="d3-panel" role="tabpanel" aria-labelledby={`d3-tab-${active}`}>
        <div className="d3-viewer" ref={host}>
          {!ready && <p className="d3-loading">{t.loading}</p>}
          <span className="d3-badge">{t.badges[item.badge]}</span>
          <span className="d3-hint" aria-hidden="true">
            {t.drag}
          </span>
        </div>
        <div className="d3-info">
          <h3>{item.name}</h3>
          <p>{item.desc}</p>
          {item.photo && (
            <a className="d3-photo" href={item.photo} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.photo} alt={`${t.photoLabel}: ${item.name}`} loading="lazy" decoding="async" />
              <span>{t.photoLabel}</span>
            </a>
          )}
          <dl>
            {item.specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="d3-actions">
            <button type="button" className="btn btn-ghost" aria-pressed={wire} onClick={() => setWire((w) => !w)}>
              {wire ? t.solid : t.wire}
            </button>
            <a className="btn btn-primary" href="#rfq">
              {t.cta}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
