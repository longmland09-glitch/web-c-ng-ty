/**
 * Deflux base plate HF-S0-00603-17078 (rev T10), SUS430, 340 × 270 × 3 mm.
 * Geometry ported from the reconstruction of the customer drawing
 * (units mm, origin at the window centre). Returns two stacked layers:
 * the bottom 1.5 mm with the wider pocket, the top 1.5 mm with the through window.
 */
type Three = typeof import("three");
type P = [number, number][];

const W = 340, H = 270, T = 3, PD = 1.5;

function rrect(cx: number, cy: number, w: number, h: number, r: number, n = 6): P {
  const p: P = [], x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const c: [number, number, number][] = [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180], [x1 - r, y0 + r, 270]];
  c.forEach(([x, y, a]) => {
    for (let i = 0; i <= n; i++) {
      const t = ((a + (90 * i) / n) * Math.PI) / 180;
      p.push([x + r * Math.cos(t), y + r * Math.sin(t)]);
    }
  });
  return p;
}

function circle(cx: number, cy: number, r: number, n = 32): P {
  const p: P = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return p;
}

function outline(): P {
  // left corners R5, right corners C8
  const x0 = -W / 2, x1 = W / 2, y0 = -H / 2, y1 = H / 2, p: P = [];
  p.push([x1 - 8, y0], [x1, y0 + 8], [x1, y1 - 8], [x1 - 8, y1]);
  for (let i = 0; i <= 6; i++) {
    const t = ((90 + (90 * i) / 6) * Math.PI) / 180;
    p.push([x0 + 5 + 5 * Math.cos(t), y1 - 5 + 5 * Math.sin(t)]);
  }
  for (let i = 0; i <= 6; i++) {
    const t = ((180 + (90 * i) / 6) * Math.PI) / 180;
    p.push([x0 + 5 + 5 * Math.cos(t), y0 + 5 + 5 * Math.sin(t)]);
  }
  return p;
}

const detD = (): P => [[-14.5, 0], [14.5, 0], [14.5, 6.5], [11.5, 6.5], [11.5, 11], [-11.5, 11], [-11.5, 6.5], [-14.5, 6.5]];

function place(poly: P, cx: number, cy: number, rot: number): P {
  const c = Math.cos(rot), s = Math.sin(rot);
  return poly.map(([u, v]) => [cx + u * c - v * s, cy + u * s + v * c]);
}

function dHole(side: 1 | -1): P {
  const p: P = [], xf = side * 137, xa = side * 147;
  p.push([xf, -15]);
  for (let i = 0; i <= 16; i++) {
    const t = -Math.PI / 2 + (Math.PI * i) / 16;
    p.push([xa + side * 15 * Math.cos(t), 15 * Math.sin(t)]);
  }
  p.push([xf, 15]);
  return side < 0 ? p.reverse() : p;
}

function features() {
  const through: P[] = [];
  [-111.8, 111.8].forEach((x) => [-128.4, 128.4].forEach((y) => through.push(rrect(x, y, 20, 9.25, 0.5, 3))));
  [-30, 30].forEach((x) => [-128.4, 128.4].forEach((y) => through.push(rrect(x, y, 41, 9.25, 0.5, 3))));
  [-131.55, 131.55].forEach((x) => [-44, 44].forEach((y) => through.push(rrect(x, y, 5, 41, 0.5, 3))));
  [-80, 80].forEach((x) => {
    through.push(place(detD(), x, 122.9, 0));
    through.push(place(detD(), x, -122.9, Math.PI));
  });
  [-82.1, 82.1].forEach((y) => {
    through.push(place(detD(), 129.3, y, -Math.PI / 2));
    through.push(place(detD(), -129.3, y, Math.PI / 2));
  });
  through.push(dHole(-1), dHole(1));
  const holesA: [number, number][] = [[-159, 124], [-137, 124], [159, 124], [137, -124], [159, -124]];
  const round = [...holesA.map(([x, y]) => circle(x, y, 3)), circle(137, 118, 2)];
  return [...through, ...round];
}

export function deflux(THREE: Three) {
  const toV = (p: P) => p.map(([x, y]) => new THREE.Vector2(x, y));
  const isCW = (p: P) => {
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[i], r = p[(i + 1) % p.length];
      a += q[0] * r[1] - r[0] * q[1];
    }
    return a < 0;
  };
  const ccw = (p: P) => (isCW(p) ? p.slice().reverse() : p);
  const cw = (p: P) => (isCW(p) ? p : p.slice().reverse());

  const outer = outline();
  const holes = features();
  const layer = (inner: P, z0: number, z1: number) => {
    const s = new THREE.Shape(toV(ccw(outer)));
    [inner, ...holes].forEach((h) => s.holes.push(new THREE.Path(toV(cw(h)))));
    const g = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, z0 - T / 2);
    g.rotateX(-0.55); // tilt back so the face reads at the default camera angle
    return g;
  };

  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(layer(rrect(0, 0, 251.6, 243.48, 3), PD, T)), // top: through window
    new THREE.Mesh(layer(rrect(0, 0, 257.6, 243.48, 1), 0, PD)), // bottom: 1.5 mm pocket
  );
  return group;
}
