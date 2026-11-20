// Mô hình 3D minh họa máy cắt dây EDM MV1200S.
// Đơn vị dựng hình: mm, quy đổi sang mét khi đưa vào scene.
// Trục: x = rộng (2.760), z = dài (2.025), y = cao (2.015). Gốc tọa độ ở tâm sàn.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const MM = 0.001;
const SIZE = { W: 2760, L: 2025, H: 2015 };
const X0 = -SIZE.W / 2, X1 = SIZE.W / 2;
const Z0 = -SIZE.L / 2, Z1 = SIZE.L / 2;

function makeMaterials() {
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...extra });
  return {
    paint: std(0xdfe2df),
    paintShade: std(0xc9cdca),
    dark: std(0x3a4247, { roughness: 0.7 }),
    steel: std(0x9aa3a8, { roughness: 0.35, metalness: 0.6 }),
    brass: std(0xb98a33, { roughness: 0.4, metalness: 0.7 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xbcd3dc, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.35, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: 0x5f8fa3, transparent: true, opacity: 0.35, depthWrite: false }),
    screen: std(0x1b2a33, { emissive: 0x2d6f8f, emissiveIntensity: 0.35, roughness: 0.3 }),
    red: std(0xc8402f, { emissive: 0x5a120a }),
    amber: std(0xe0a526, { emissive: 0x4a3200 }),
    green: std(0x3f9a4f, { emissive: 0x0f3315 }),
  };
}

const edgeMat = new THREE.LineBasicMaterial({ color: 0x2a3135, transparent: true, opacity: 0.35 });

// Hộp xác định bằng khoảng [min, max] theo từng trục (mm)
function block(group, mat, [x0, x1], [y0, y1], [z0, z1], { edges = true, shadow = true } = {}) {
  const geo = new THREE.BoxGeometry((x1 - x0) * MM, (y1 - y0) * MM, (z1 - z0) * MM);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(((x0 + x1) / 2) * MM, ((y0 + y1) / 2) * MM, ((z0 + z1) / 2) * MM);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
  group.add(mesh);
  return mesh;
}

// Trụ đứng (trục y) hoặc nằm (trục x)
function cylinder(group, mat, { r, len, at: [x, y, z], axis = 'y' }) {
  const geo = new THREE.CylinderGeometry(r * MM, r * MM, len * MM, 32);
  const mesh = new THREE.Mesh(geo, mat);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x * MM, y * MM, z * MM);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function buildMV1200S() {
  const m = makeMaterials();
  const g = new THREE.Group();

  // Thân máy (bệ) và chân đế
  block(g, m.dark, [-1080, 580], [0, 80], [-680, 630], { edges: false });
  block(g, m.paint, [-1100, 600], [80, 850], [-700, 650]);
  block(g, m.paintShade, [-1060, 560], [700, 760], [650, 652], { edges: false }); // gờ trang trí mặt trước

  // Bể gia công: vách sau, hai vách bên, cửa kính phía trước
  block(g, m.paint, [-1000, 500], [850, 1300], [-460, -430]);
  block(g, m.paint, [-1000, -970], [850, 1300], [-430, 680]);
  block(g, m.paint, [470, 500], [850, 1300], [-430, 680]);
  block(g, m.glass, [-970, 470], [880, 1290], [680, 700], { shadow: false });
  block(g, m.paint, [-1000, 500], [850, 880], [680, 720]); // khung dưới cửa
  block(g, m.paint, [-1000, 500], [1290, 1310], [680, 720]); // khung trên cửa
  block(g, m.steel, [-500, 0], [1150, 1180], [720, 750]); // tay nắm cửa

  // Bàn máy, phôi, mặt nước điện môi
  block(g, m.steel, [-800, 300], [850, 1000], [-300, 470]);
  block(g, m.dark, [-360, -40], [1000, 1080], [60, 300]);
  block(g, m.water, [-970, 470], [850, 1180], [-430, 680], { edges: false, shadow: false });

  // Cột máy phía sau
  block(g, m.paint, [-550, 150], [850, 1850], [Z0, -460]);
  block(g, m.dark, [-230, -170], [900, 1800], [-462, -458], { edges: false }); // rãnh dẫn hướng trục Z
  block(g, m.paintShade, [-550, 150], [1850, 1920], [Z0, -600]); // nắp đỉnh cột

  // Tay trên, đầu trục Z và vòi phun trên
  block(g, m.paint, [-380, -20], [1500, 1680], [-460, 200]);
  block(g, m.dark, [-340, -60], [1320, 1720], [60, 300]);
  cylinder(g, m.steel, { r: 32, len: 60, at: [-200, 1290, 180] });

  // Tay dưới và vòi phun dưới
  block(g, m.steel, [-260, -140], [1000, 1060], [-460, 200]);
  cylinder(g, m.steel, { r: 32, len: 40, at: [-200, 1080, 180] });

  // Dây cắt bằng đồng thau giữa hai vòi phun
  cylinder(g, m.brass, { r: 3, len: 160, at: [-200, 1180, 180] });

  // Cuộn dây cấp bên hông cột và thùng thu dây thải
  cylinder(g, m.brass, { r: 140, len: 110, at: [215, 1640, -820], axis: 'x' });
  cylinder(g, m.dark, { r: 40, len: 130, at: [215, 1640, -820], axis: 'x' });
  block(g, m.dark, [250, 560], [0, 520], [Z0, -720]);

  // Đèn báo trạng thái trên đỉnh cột (điểm cao nhất của máy)
  cylinder(g, m.dark, { r: 18, len: 15, at: [80, 1927.5, -720] });
  cylinder(g, m.green, { r: 34, len: 28, at: [80, 1949, -720] });
  cylinder(g, m.amber, { r: 34, len: 28, at: [80, 1977, -720] });
  cylinder(g, m.red, { r: 34, len: 28, at: [80, 2001, -720] });
  block(g, m.dark, [46, 114], [2015 - 1, 2015], [-754, -686], { edges: false, shadow: false });

  // Bộ lọc và bể dung dịch điện môi bên trái
  block(g, m.paint, [X0, -1130], [0, 1150], [Z0, 400]);
  block(g, m.dark, [X0 + 10, -1140], [1150, 1170], [Z0 + 10, 390], { edges: false });
  cylinder(g, m.paintShade, { r: 80, len: 300, at: [-1255, 1320, -650] });
  cylinder(g, m.paintShade, { r: 80, len: 300, at: [-1255, 1320, -350] });
  block(g, m.dark, [-1130, -1100], [600, 680], [-300, -200], { edges: false }); // ống nối vào bệ

  // Tủ điều khiển CNC bên phải
  block(g, m.paint, [1000, X1], [0, 1000], [500, Z1]);
  block(g, m.dark, [1020, 1360], [1000, 1040], [700, Z1 - 10]); // bàn phím
  block(g, m.dark, [1020, 1360], [1040, 1520], [600, 690]); // khung màn hình
  block(g, m.screen, [1050, 1330], [1080, 1480], [690, 694], { edges: false });
  block(g, m.dark, [600, 1000], [600, 680], [520, 600], { edges: false }); // máng cáp nối vào thân máy

  return g;
}

// Đường ghi kích thước kiểu bản vẽ kỹ thuật, kèm nhãn số
function dimensionLine(from, to, tickDir, text) {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xb98a33 });
  const a = new THREE.Vector3(...from).multiplyScalar(MM);
  const b = new THREE.Vector3(...to).multiplyScalar(MM);
  const t = new THREE.Vector3(...tickDir).multiplyScalar(60 * MM);
  const pts = [a, b, a.clone().sub(t), a.clone().add(t), b.clone().sub(t), b.clone().add(t)];
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat));
  const el = document.createElement('span');
  el.className = 'dim-label';
  el.textContent = text;
  const label = new CSS2DObject(el);
  label.position.copy(a.clone().lerp(b, 0.5));
  group.add(label);
  return group;
}

function buildDimensions() {
  const g = new THREE.Group();
  const off = 180; // khoảng cách đường kích thước so với mép máy
  g.add(dimensionLine([X0, 0, Z1 + off], [X1, 0, Z1 + off], [0, 0, 1], '2.760 mm'));
  g.add(dimensionLine([X1 + off, 0, Z0], [X1 + off, 0, Z1], [1, 0, 0], '2.025 mm'));
  g.add(dimensionLine([X1 + off, 0, Z0], [X1 + off, SIZE.H, Z0], [1, 0, 0], '2.015 mm'));
  return g;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function initViewer(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const labels = new CSS2DRenderer();
  labels.domElement.style.position = 'absolute';
  labels.domElement.style.inset = '0';
  labels.domElement.style.pointerEvents = 'none';

  stage.querySelector('.viewer__fallback')?.remove();
  stage.append(renderer.domElement, labels.domElement);

  const scene = new THREE.Scene();
  const applyTheme = () => {
    scene.background = new THREE.Color(cssVar('--stage') || '#e2e5e3');
  };
  applyTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); render(); });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9296, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(3, 5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(8, 16, 0x8a9296, 0x8a9296);
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  scene.add(grid);

  const machine = buildMV1200S();
  scene.add(machine);
  const dims = buildDimensions();
  scene.add(dims);

  // Kiểm tra kích thước bao của mô hình khớp số liệu lắp đặt
  const size = new THREE.Box3().setFromObject(machine).getSize(new THREE.Vector3()).divideScalar(MM);
  stage.dataset.bbox = `${Math.round(size.z)}x${Math.round(size.x)}x${Math.round(size.y)}`;

  const camera = new THREE.PerspectiveCamera(35, 4 / 3, 0.05, 50);
  const home = { pos: new THREE.Vector3(3.1, 2.25, 3.8), target: new THREE.Vector3(0, 0.9, 0) };
  camera.position.copy(home.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(home.target);
  controls.enableDamping = true;
  controls.minDistance = 1.5;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();

  function resize() {
    const { clientWidth: w, clientHeight: h } = stage;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    renderer.render(scene, camera);
    labels.render(scene, camera);
  }

  // Chỉ vẽ lại khi có thao tác, không chạy vòng lặp liên tục
  let raf = 0;
  function tick() {
    raf = 0;
    if (controls.update()) schedule();
    render();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  controls.addEventListener('change', schedule);

  new ResizeObserver(resize).observe(stage);
  resize();

  const figure = stage.closest('.viewer');
  figure.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    camera.position.copy(home.pos);
    controls.target.copy(home.target);
    controls.update();
    render();
  });
  const dimsBtn = figure.querySelector('[data-action="dims"]');
  dimsBtn?.addEventListener('click', () => {
    dims.visible = !dims.visible;
    dimsBtn.setAttribute('aria-pressed', String(dims.visible));
    labels.domElement.style.display = dims.visible ? '' : 'none';
    render();
  });
}

const models = { mv1200s: initViewer };
document.querySelectorAll('[data-model]').forEach((stage) => {
  try {
    models[stage.dataset.model]?.(stage);
  } catch (err) {
    console.error(err);
    const msg = stage.querySelector('.viewer__fallback') || stage.appendChild(document.createElement('p'));
    msg.className = 'viewer__fallback';
    msg.textContent = 'Trình duyệt không hiển thị được mô hình 3D.';
  }
});
