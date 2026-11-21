/**
 * 3D models of Xinmiao products, built from the product photos.
 * Proportions follow the photos; sizes are illustrative (units ≈ mm).
 * Each builder returns a Group with its own materials (userData.styled).
 */
type T = typeof import("three");
type Mat = import("three").Material;
type P = [number, number][];

function kit(THREE: T) {
  const materials: Mat[] = [];
  const mat = (color: number, metalness: number, roughness: number) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    materials.push(m);
    return m;
  };
  const edge = new THREE.LineBasicMaterial({ color: 0x15181b, transparent: true, opacity: 0.35 });
  materials.push(edge);
  const group = new THREE.Group();
  const add = (g: import("three").BufferGeometry, m: Mat, parent: import("three").Object3D = group, edges = true) => {
    const mesh = new THREE.Mesh(g, m);
    parent.add(mesh);
    if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 28), edge));
    return mesh;
  };
  const done = (rotation: [number, number, number]) => {
    group.userData.styled = true;
    group.userData.materials = materials;
    group.userData.rotation = rotation;
    return group;
  };
  const rect = (cx: number, cy: number, w: number, h: number, r = 0): P => {
    if (!r) return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    const p: P = [], c: [number, number, number][] = [[cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180], [cx + w / 2 - r, cy - h / 2 + r, 270]];
    c.forEach(([x, y, a]) => {
      for (let i = 0; i <= 4; i++) {
        const t = ((a + 22.5 * i) * Math.PI) / 180;
        p.push([x + r * Math.cos(t), y + r * Math.sin(t)]);
      }
    });
    return p;
  };
  const circle = (cx: number, cy: number, r: number, n = 28): P =>
    Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)] as [number, number]);
  const isCW = (p: P) => p.reduce((a, q, i) => a + q[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * q[1], 0) < 0;
  const v2 = (p: P) => p.map(([x, y]) => new THREE.Vector2(x, y));
  /** flat plate in XY with holes, extruded by depth along +Z, then laid flat (Z → Y up) */
  const slab = (outer: P, holes: P[], z0: number, depth: number) => {
    const s = new THREE.Shape(v2(isCW(outer) ? outer.slice().reverse() : outer));
    holes.forEach((h) => s.holes.push(new THREE.Path(v2(isCW(h) ? h : h.slice().reverse()))));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, z0);
    g.rotateX(-Math.PI / 2);
    return g;
  };
  return { materials, mat, add, done, rect, circle, slab, group };
}

/** IC/SMT carrier: 13 × 6 round windows, each in a square pocket, ribbed long edges. */
export function carrier(THREE: T) {
  const k = kit(THREE);
  const alu = k.mat(0xc9ced3, 0.85, 0.32);
  const W = 320, H = 120, cols = 13, rows = 6, pitch = 22;
  const holes: P[] = [], pockets: P[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = (i - (cols - 1) / 2) * pitch, y = (j - (rows - 1) / 2) * pitch;
      holes.push(k.circle(x, y, 7.2));
      pockets.push(k.rect(x, y, 17.5, 17.5, 1.2));
    }
  const mounts = [[-150, 52], [150, 52], [-150, -52], [150, -52]].map(([x, y]) => k.circle(x, y, 2.2, 16));
  const outline = k.rect(0, 0, W, H, 2);
  k.add(k.slab(outline, [...holes, ...mounts], 0, 3), alu);
  k.add(k.slab(outline, [...pockets, ...mounts, ...[-1, 1].map((s) => k.rect(0, s * 54, W - 30, 3))], 3, 1.2), alu);
  // longitudinal ribs along both long edges
  for (const s of [-1, 1])
    for (let r = 0; r < 4; r++) {
      const g = new THREE.BoxGeometry(W - 6, 0.5, 1.1);
      g.translate(0, 4.45, s * (H / 2 - 2.2 - r * 2.4));
      k.add(g, alu, k.group, false);
    }
  return k.done([0.85, -0.25, 0]);
}

/** 12-position vacuum plate: notched pads with X suction grooves and a centre port. */
export function vacuumPlate(THREE: T) {
  const k = kit(THREE);
  const steel = k.mat(0x8d9399, 0.75, 0.42);
  const W = 240, H = 150, cols = 4, rows = 3, px = 58, py = 46;
  const pad = (cx: number, cy: number): P => {
    const w = 25, h = 19, n = 3;
    return [[cx - w, cy - h], [cx - 8, cy - h], [cx - 8, cy - h + n], [cx + 8, cy - h + n], [cx + 8, cy - h], [cx + w, cy - h],
      [cx + w, cy - 6], [cx + w - n, cy - 6], [cx + w - n, cy + 6], [cx + w, cy + 6], [cx + w, cy + h], [cx + 8, cy + h],
      [cx + 8, cy + h - n], [cx - 8, cy + h - n], [cx - 8, cy + h], [cx - w, cy + h], [cx - w, cy + 6], [cx - w + n, cy + 6],
      [cx - w + n, cy - 6], [cx - w, cy - 6]];
  };
  const cross = (cx: number, cy: number): P => {
    // X made of two crossed slots, as one polygon
    const L = 15, w = 1.4, pts: P = [];
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c;
      pts.push([cx + nx * w + c * w * 1.4, cy + ny * w + s * w * 1.4]);
      pts.push([cx + nx * w + c * L, cy + ny * w + s * L]);
      pts.push([cx - nx * w + c * L, cy - ny * w + s * L]);
    }
    return pts;
  };
  const centres: [number, number][] = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) centres.push([(i - 1.5) * px, (j - 1) * py]);
  const mounts = [[-112, 68], [112, 68], [-112, -68], [112, -68], [0, 68], [0, -68]].map(([x, y]) => k.circle(x, y, 3.5, 18));
  const outline = k.rect(0, 0, W, H, 4);
  k.add(k.slab(outline, [...mounts, ...centres.map(([x, y]) => k.circle(x, y, 2.4, 16))], 0, 6), steel);
  centres.forEach(([x, y]) => k.add(k.slab(pad(x, y), [cross(x, y)], 6, 1.6), steel));
  return k.done([0.85, -0.25, 0]);
}

/** Slotted copper ring: thin inner wall with radial fins (wire-EDM slots between them). */
export function copperRing(THREE: T) {
  const k = kit(THREE);
  const copper = k.mat(0xc8743c, 1, 0.3);
  const Ri = 30, Rw = 33, Ro = 46, Hh = 18, fins = 60;
  const wall = new THREE.LatheGeometry([[Ri, 0], [Rw, 0], [Rw, Hh], [Ri, Hh]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
  k.add(wall, copper, k.group, false);
  const base = new THREE.LatheGeometry([[Rw - 0.1, 0], [Ro, 0], [Ro, 2.5], [Rw - 0.1, 2.5]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
  k.add(base, copper, k.group, false);
  for (let i = 0; i < fins; i++) {
    const a = (i / fins) * Math.PI * 2;
    const g = new THREE.BoxGeometry(Ro - Rw, Hh, 2.6);
    g.translate((Rw + Ro) / 2, Hh / 2, 0);
    g.rotateY(a);
    k.add(g, copper, k.group, false);
  }
  return k.done([0.75, 0, 0]);
}

/** Magazine: rectangular tube with a top cover carrying a direction arrow and label recess. */
export function magazine(THREE: T) {
  const k = kit(THREE);
  const brown = k.mat(0x6a4038, 0.8, 0.38);
  const L = 160, W = 70, H = 80, t = 2.5;
  // tube: rectangle with a rectangular hole, extruded along the length (X)
  const ring = new THREE.Shape(
    [[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]].map(([x, y]) => new THREE.Vector2(x, y)),
  );
  ring.holes.push(new THREE.Path([[-W / 2 + t, t], [-W / 2 + t, H - t], [W / 2 - t, H - t], [W / 2 - t, t]].map(([x, y]) => new THREE.Vector2(x, y))));
  const tube = new THREE.ExtrudeGeometry(ring, { depth: L, bevelEnabled: false });
  tube.translate(0, 0, -L / 2);
  tube.rotateY(Math.PI / 2);
  k.add(tube, brown);
  // cover plate with recessed arrow and label window
  const arrow: [number, number][] = [[-50, -6], [-14, -6], [-14, -12], [2, 0], [-14, 12], [-14, 6], [-50, 6]];
  const cover = k.slab(k.rect(0, 0, L - 16, W - 6, 3), [], 0, 1.5);
  cover.translate(0, H, 0);
  k.add(cover, brown);
  const face = k.slab(k.rect(0, 0, L - 20, W - 10, 2), [arrow.map(([x, y]) => [x, y] as [number, number]), k.rect(38, 0, 48, 34, 4)], 1.5, 0.8);
  face.translate(0, H, 0);
  k.add(face, brown);
  return k.done([0.45, -0.55, 0]);
}
