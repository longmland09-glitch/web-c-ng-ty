/**
 * Mitsubishi MV1200S wire EDM machine, modelled from a product photo and
 * scaled to the stated footprint 2,025 (W) × 2,760 (D) × 2,015 (H) mm.
 * Ported from the user's standalone 3D page. Returns a Group with its own
 * materials (userData.styled = true) so the viewer keeps its colours.
 */
type Three = typeof import("three");
type T = typeof import("three");
type Obj = import("three").Object3D;
type Mat = import("three").Material;
type Ctx = CanvasRenderingContext2D;

export function mv1200s(THREE: T) {
  const DIM = { x: 2025, y: 2015, z: 2760 };
  const machine = new THREE.Group();
  const materials: Mat[] = [];

  const canvasTex = (cw: number, ch: number, draw: (c: Ctx, w: number, h: number) => void, rep?: [number, number]) => {
    const c = document.createElement("canvas");
    c.width = cw * 2;
    c.height = ch * 2;
    const x = c.getContext("2d")!;
    x.scale(2, 2);
    draw(x, cw, ch);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (rep) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rep[0], rep[1]);
    }
    return t;
  };
  const rrect = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  const mat = (color: number, o: Record<string, unknown> = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...o });
    materials.push(m);
    return m;
  };
  const M = {
    body: mat(0xe9e9e7, { roughness: 0.42 }),
    head: mat(0xdcdddf, { roughness: 0.45 }),
    light: mat(0xc4c7cb, { roughness: 0.5 }),
    grey: mat(0x8e949b),
    mid: mat(0x5f656c),
    dark: mat(0x3a3e44, { roughness: 0.6 }),
    black: mat(0x141618, { roughness: 0.35 }),
    steel: mat(0xc3c8ce, { metalness: 0.7, roughness: 0.28 }),
    red: mat(0xd7262f, { roughness: 0.4 }),
    orange: mat(0xd2481e, { roughness: 0.5 }),
    yellow: mat(0xf0c21c),
    green: mat(0x2fb35a),
    white: mat(0xf7f7f6, { roughness: 0.35 }),
    hose: mat(0x8fd3e8, { transparent: true, opacity: 0.8, roughness: 0.2 }),
    slat: (() => {
      const m = new THREE.MeshStandardMaterial({
        map: canvasTex(32, 32, (c, w, h) => {
          c.fillStyle = "#121315";
          c.fillRect(0, 0, w, h);
          c.fillStyle = "#3c3f44";
          c.fillRect(0, 4, w, 7);
          c.fillStyle = "#24262a";
          c.fillRect(0, 11, w, 3);
        }, [1, 40]),
        roughness: 0.6,
      });
      materials.push(m);
      return m;
    })(),
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x1a1d21, transparent: true, opacity: 0.45 });
  materials.push(edgeMat);

  const finish = (me: import("three").Mesh, parent?: Obj, noEdge?: boolean) => {
    if (!noEdge) me.add(new THREE.LineSegments(new THREE.EdgesGeometry(me.geometry, 25), edgeMat));
    (parent || machine).add(me);
    return me;
  };
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: Mat, parent?: Obj) => {
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
    me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return finish(me, parent);
  };
  const cyl = (r: number, len: number, axis: "x" | "y" | "z", x: number, y: number, z: number, m: Mat, parent?: Obj | null, seg = 32) => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);
    if (axis === "x") me.rotation.z = Math.PI / 2;
    if (axis === "z") me.rotation.x = Math.PI / 2;
    me.position.set(x, y, z);
    return finish(me, parent ?? undefined);
  };
  // side profile (points as [z, y]) extruded across X from x0 to x1
  const profile = (pts: [number, number][], x0: number, x1: number, m: Mat) => {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach((p) => s.lineTo(p[0], p[1]));
    s.closePath();
    const me = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false }), m);
    me.rotation.y = -Math.PI / 2;
    me.position.x = x1;
    return finish(me);
  };
  // flat printed decal (logo, badge, screen) facing +Z unless rotated
  const decal = (w: number, h: number, cw: number, ch: number, draw: (c: Ctx, w: number, h: number) => void, lit: boolean, parent?: Obj) => {
    const t = canvasTex(cw, ch, draw);
    const m = lit
      ? new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 })
      : new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
    materials.push(m);
    const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    (parent || machine).add(me);
    return me;
  };

  /* ---------- machine (mm, +Z = front, +X = right) ---------- */
  ([[-950, -650], [-950, 1320], [600, -650], [600, 1320]] as const).forEach((p) => cyl(38, 40, "y", p[0], 20, p[1], M.grey));
  box(-985, 635, 25, 45, -690, 1360, M.dark);

  box(-1000, 650, 40, 520, -700, 1190, M.body);
  profile([[1180, 40], [1290, 40], [1380, 170], [1380, 750], [1310, 900], [1180, 900]], -1000, 650, M.body);
  box(-1000, -720, 520, 900, -700, 1190, M.body);
  box(560, 650, 520, 900, -700, 1190, M.body);
  box(-720, 560, 520, 900, -700, -420, M.body);
  box(-720, 560, 515, 525, -420, 1180, M.black);
  const slope = (xa: number, ya: number, xb: number, yb: number, z0: number, z1: number) => {
    const dx = xb - xa, dy = yb - ya, L = Math.hypot(dx, dy);
    const me = new THREE.Mesh(new THREE.BoxGeometry(L, 14, z1 - z0), M.slat);
    me.rotation.z = Math.atan2(dy, dx);
    me.position.set((xa + xb) / 2, (ya + yb) / 2, (z0 + z1) / 2);
    finish(me, undefined, true);
  };
  slope(-720, 895, -385, 560, -420, 1180);
  slope(420, 560, 560, 895, -420, 1180);
  box(-1000, 650, 575, 590, 1380, 1383, M.red);
  box(650, 653, 575, 590, -700, 1380, M.red);

  // work tank with raised front door
  box(-380, 420, 525, 1200, -380, 1150, M.body);
  box(-382, -350, 560, 1200, 1135, 1158, M.black);
  box(390, 422, 560, 1200, 1135, 1158, M.black);
  box(-382, 422, 1188, 1202, -380, 1158, M.light);
  box(-350, 390, 1196, 1206, -340, 1110, M.black);
  cyl(12, 700, "x", 20, 1065, 1185, M.steel);
  box(-360, -330, 1055, 1075, 1150, 1185, M.steel);
  box(370, 400, 1055, 1075, 1150, 1185, M.steel);
  for (let i = 0; i < 6; i++) {
    cyl(5, 4, "z", -366, 620 + i * 100, 1160, M.steel, null, 10);
    cyl(5, 4, "z", 406, 620 + i * 100, 1160, M.steel, null, 10);
  }

  // left tall cabinet with side window
  box(-1000, -720, 900, 1520, -700, 260, M.body);
  box(-1000, -720, 1515, 1530, -700, 260, M.light);
  {
    const w = decal(820, 420, 300, 160, (c, w, h) => {
      rrect(c, 6, 6, w - 12, h - 12, 22);
      c.fillStyle = "#d4d5d6";
      c.fill();
      rrect(c, 18, 18, w - 36, h - 36, 16);
      c.fillStyle = "#2b3036";
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.08)";
      c.fillRect(40, 24, 40, h - 48);
    }, true);
    w.rotation.y = -Math.PI / 2;
    w.position.set(-1002, 1200, -220);
  }
  cyl(36, 30, "y", -860, 1531, -200, M.dark);
  cyl(42, 20, "z", -860, 1050, 270, M.white);
  cyl(46, 8, "z", -860, 1050, 262, M.steel);
  box(-890, -830, 940, 975, 260, 285, M.yellow);
  {
    const curve = new THREE.CatmullRomCurve3(
      ([[-880, 1000, 290], [-930, 900, 700], [-985, 700, 1200], [-990, 520, 1395], [-990, 120, 1395]] as const).map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    );
    finish(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 16, 10), M.hose), undefined, true);
    cyl(22, 60, "y", -990, 960, 290, M.steel);
  }

  // column and upper arm behind the tank
  box(-380, 380, 900, 1520, -700, -150, M.dark);
  box(-80, 80, 1200, 1520, -150, -60, M.orange);
  box(-200, 200, 1450, 1560, -500, 400, M.mid);
  cyl(10, 700, "y", -300, 1550, -200, M.black, null, 8);
  cyl(10, 700, "y", 260, 1550, -180, M.black, null, 8);
  box(-560, 300, 1520, 1990, -700, -300, M.light);
  box(-560, 300, 1980, 1995, -700, -300, M.head);

  // head housing with wire-path window
  profile([[-300, 1500], [700, 1500], [770, 1590], [770, 1880], [680, 2015], [-300, 2015]], -600, 450, M.head);
  {
    const win = decal(860, 300, 430, 150, (c, w, h) => {
      c.fillStyle = "#16181b";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#e6e6e4";
      c.fillRect(6, 6, 62, h - 12);
      c.fillStyle = "#bfc1c3";
      c.fillRect(12, 14, 50, 36);
      c.fillStyle = "#1d1f22";
      c.beginPath();
      c.arc(37, 112, 24, 0, 7);
      c.fill();
      c.fillStyle = "#4d86b8";
      c.beginPath();
      c.arc(37, 112, 16, 0, 7);
      c.fill();
      c.fillStyle = "#202327";
      c.fillRect(80, 8, 240, h - 16);
      [[160, 62, 24], [222, 52, 18], [224, 92, 16], [268, 104, 12], [136, 104, 9]].forEach((p) => {
        c.fillStyle = "#f2f2f0";
        c.beginPath();
        c.arc(p[0], p[1], p[2], 0, 7);
        c.fill();
        c.fillStyle = "#55595e";
        c.beginPath();
        c.arc(p[0], p[1], p[2] * 0.35, 0, 7);
        c.fill();
      });
      c.strokeStyle = "#c9a227";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(136, 104);
      c.lineTo(160, 62);
      c.lineTo(222, 52);
      c.lineTo(224, 92);
      c.lineTo(268, 104);
      c.lineTo(268, h);
      c.stroke();
      c.fillStyle = "#f0c21c";
      c.fillRect(92, 108, 46, 10);
      c.fillStyle = "#2a2d31";
      c.fillRect(130, 116, 120, 26);
      c.font = "italic 700 20px Arial, sans-serif";
      c.textBaseline = "middle";
      c.lineWidth = 3;
      c.strokeStyle = "#0c0d0e";
      c.strokeText("MV1200S", 140, 130);
      c.fillStyle = "#e8e8e6";
      c.fillText("MV1200S", 140, 130);
      c.fillStyle = "#d8d8d6";
      c.fillRect(330, 10, 14, 108);
      c.fillStyle = "#777";
      for (let i = 0; i < 10; i++) c.fillRect(330, 14 + i * 10, 7, 1);
      c.fillStyle = "#d9d1a8";
      c.fillRect(372, 40, 18, 46);
      c.fillRect(398, 40, 14, 46);
      c.fillStyle = "#f2f2f0";
      c.beginPath();
      c.arc(392, 122, 13, 0, 7);
      c.fill();
      c.strokeStyle = "#333";
      c.lineWidth = 1.5;
      c.stroke();
    }, true);
    win.position.set(-75, 1735, 771);
  }
  ([[-185, 1761, 48], [-61, 1781, 36], [-57, 1701, 32]] as const).forEach((p) => {
    cyl(p[2], 26, "z", p[0], p[1], 784, M.white, null, 36);
    cyl(p[2] * 0.35, 30, "z", p[0], p[1], 786, M.mid, null, 20);
  });
  box(-505, 355, 1580, 1595, 770, 790, M.light);
  box(-505, 355, 1885, 1900, 760, 785, M.light);

  // side arm with operator console
  box(450, 720, 1380, 1470, 150, 520, M.head);
  box(470, 700, 1395, 1455, 520, 526, M.light);
  for (let i = 0; i < 3; i++) cyl(9, 12, "z", 520 + i * 40, 1425, 532, M.steel, null, 12);
  box(640, 700, 1080, 1380, 380, 470, M.mid);

  const con = new THREE.Group();
  con.position.set(760, 1540, 620);
  con.rotation.y = -0.28;
  machine.add(con);
  box(-250, 250, -250, 250, -40, 30, M.black, con);
  box(-240, 240, -240, 240, -60, -40, M.dark, con);
  {
    const scr = decal(400, 350, 400, 350, (c, w, h) => {
      c.fillStyle = "#0e1013";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#2bb24c";
      c.fillRect(8, 8, w - 16, 8);
      c.fillStyle = "#1a1d22";
      c.fillRect(8, 20, w - 16, h - 56);
      c.strokeStyle = "#3aa6ff";
      c.lineWidth = 5;
      c.beginPath();
      c.arc(60, 80, 30, -1.6, 3.6);
      c.stroke();
      c.fillStyle = "#d8dde3";
      c.font = "600 14px Arial";
      c.fillText("01:02", 42, 85);
      c.fillStyle = "#9aa4b0";
      c.font = "11px Arial";
      ["Machining", "Condition E4", "Feed 2.10", "Wire 0.20"].forEach((tx, i) => c.fillText(tx, 110, 46 + i * 18));
      c.fillStyle = "#8a63c9";
      c.beginPath();
      c.moveTo(250, 90);
      c.lineTo(310, 60);
      c.lineTo(370, 85);
      c.lineTo(345, 125);
      c.lineTo(275, 125);
      c.closePath();
      c.fill();
      c.fillStyle = "#b493e8";
      c.beginPath();
      c.moveTo(250, 90);
      c.lineTo(310, 60);
      c.lineTo(370, 85);
      c.lineTo(310, 100);
      c.closePath();
      c.fill();
      for (let r = 0; r < 2; r++)
        for (let i = 0; i < 5; i++) {
          c.fillStyle = "#2a2f36";
          c.fillRect(14 + i * 76, 150 + r * 76, 68, 66);
          c.strokeStyle = "#5c6672";
          c.lineWidth = 3;
          c.beginPath();
          c.arc(48 + i * 76, 178 + r * 76, 15, -2.5, 1);
          c.stroke();
          c.fillStyle = r === 1 && i === 1 ? "#f08a24" : "#596270";
          c.fillRect(22 + i * 76, 200 + r * 76, 52, 8);
        }
      c.fillStyle = "#22262c";
      c.fillRect(8, h - 34, w - 16, 26);
      c.fillStyle = "#aab3bd";
      c.font = "10px Arial";
      ["INITIAL SETTINGS", "OPERATION", "PROGRAMMING"].forEach((tx, i) => c.fillText(tx, 30 + i * 125, h - 17));
    }, false, con);
    scr.position.set(10, -15, 31);
  }
  cyl(20, 22, "z", -215, 215, 40, M.red, con);
  cyl(28, 8, "z", -215, 215, 32, M.yellow, con);
  box(-238, -200, 90, 128, 30, 36, M.light, con);
  box(-238, -200, 30, 68, 30, 36, M.green, con);
  box(-260, 260, -300, -262, -80, 140, M.dark, con);
  {
    const kb = decal(500, 200, 250, 100, (c, w, h) => {
      c.fillStyle = "#24272b";
      c.fillRect(0, 0, w, h);
      for (let r = 0; r < 6; r++)
        for (let i = 0; i < 22; i++) {
          c.fillStyle = "#454a50";
          c.fillRect(4 + i * 11.2, 4 + r * 16, 9, 13);
        }
    }, false, con);
    kb.rotation.x = -Math.PI / 2;
    kb.position.set(0, -261, 30);
  }
  box(-110, 110, -420, -300, -70, 90, M.dark, con);
  box(285, 375, -150, 170, -30, 15, M.dark, con);
  cyl(18, 16, "z", 330, 135, 22, M.red, con);
  {
    const hp = decal(80, 200, 80, 200, (c, w, h) => {
      c.fillStyle = "#4b5057";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#d7dde2";
      c.fillRect(10, 30, 60, 44);
      c.fillStyle = "#222";
      c.font = "bold 13px Arial";
      c.fillText("W00", 20, 60);
      for (let r = 0; r < 5; r++)
        for (let i = 0; i < 3; i++) {
          c.fillStyle = r === 2 && i === 1 ? "#3d7fd0" : "#cfd3d7";
          c.beginPath();
          c.arc(18 + i * 22, 94 + r * 20, 7, 0, 7);
          c.fill();
        }
    }, false, con);
    hp.position.set(330, 0, 16);
  }

  // maker logo and ADVANCE badge on the base front
  {
    const logo = decal(420, 140, 420, 140, (c) => {
      const cx = 62, cy = 82, L = 58, S = L / Math.sqrt(3);
      c.fillStyle = "#e60012";
      [90, 210, 330].forEach((a) => {
        const r = (a * Math.PI) / 180, dx = Math.cos(r), dy = -Math.sin(r), px = -dy, py = dx;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + (dx * L) / 2 + (px * S) / 2, cy + (dy * L) / 2 + (py * S) / 2);
        c.lineTo(cx + dx * L, cy + dy * L);
        c.lineTo(cx + (dx * L) / 2 - (px * S) / 2, cy + (dy * L) / 2 - (py * S) / 2);
        c.closePath();
        c.fill();
      });
      c.fillStyle = "#1a1a1a";
      c.font = "600 40px Arial, Helvetica, sans-serif";
      c.textBaseline = "alphabetic";
      c.fillText("MITSUBISHI", 138, 72);
      c.fillText("ELECTRIC", 138, 118);
    }, true);
    logo.position.set(-740, 680, 1381);
  }
  {
    const b = decal(330, 64, 330, 64, (c, w, h) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "#111";
      c.lineWidth = 3;
      c.strokeRect(2, 2, w - 4, h - 4);
      c.fillStyle = "#111";
      c.font = "italic 800 30px Arial, sans-serif";
      c.textBaseline = "middle";
      c.fillText("ADVANCE", 16, h / 2 + 1);
      c.fillRect(196, 8, 3, h - 16);
      c.font = "italic 600 13px Arial";
      c.fillText("TYPE", 208, h / 2 + 6);
      c.font = "italic 800 34px Arial";
      c.fillText("2", 250, h / 2 + 2);
    }, true);
    b.position.set(420, 680, 1381);
  }

  // rear dielectric / power unit
  box(-900, 500, 40, 1500, -1380, -700, M.body);
  for (let i = 0; i < 6; i++) box(-820 + i * 130, -740 + i * 130, 1100, 1420, -1386, -1380, M.dark);
  box(150, 460, 280, 1000, -1385, -1380, M.light);

  // fit the bounding box to the stated machine dimensions (in metres)
  machine.updateMatrixWorld(true);
  const sz = new THREE.Box3().setFromObject(machine).getSize(new THREE.Vector3());
  machine.scale.set((DIM.x / sz.x) * 0.001, (DIM.y / sz.y) * 0.001, (DIM.z / sz.z) * 0.001);

  machine.userData.styled = true;
  machine.userData.materials = materials;
  machine.userData.rotation = [0.06, 0.12, 0];
  return machine;
}

export type { Three };
