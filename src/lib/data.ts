/**
 * Company data taken from xinmiao.com.tw (read 2026-11-20).
 * Images are loaded from the company's own website. To host them here instead,
 * download each file into /public/images and change `IMG` to "/images".
 */
export const IMG = "https://xinmiao.com.tw";

export const company = {
  nameZh: "芯淼國際股份有限公司",
  nameEn: "Xinmiao International Co., Ltd.",
  short: "XINMIAO",
  founded: 2020,
  phone: "+886-7-781-5377",
  phoneLocal: "07-7815377",
  fax: "+886-7-781-8071",
  email: "xm@xmit.com.tw",
  addressZh: "831 高雄市大寮區江山路95之6號",
  addressEn: "No. 95-6, Jiangshan Rd., Daliao Dist., Kaohsiung City 831, Taiwan",
  mapQuery: "高雄市大寮區江山路95之6號",
  logo: `${IMG}/mainPic/1760442915234.png`,
  /**
   * ISO and other certificates. The current website publishes none, so this
   * list is empty and the certificate block is hidden. Add entries such as
   * { name: "ISO 9001:2015", issuer: "SGS", id: "TW23/00000" } when available.
   */
  certifications: [] as { name: string; issuer: string; id?: string }[],
};

export const banners = {
  home: `${IMG}/mainPic/1764050290breathing_soft_glow_v4%20%281500x560%29%20%281%29.gif`,
  about: `${IMG}/mainPic/1762250166e-18001.png`,
  products: `${IMG}/mainPic/176405151511161.jpg`,
  equipment: `${IMG}/mainPic/17620703611759767323123%20%281%29.jpg`,
  news: `${IMG}/mainPic/1764052537ChatGPT%20Image%202025%E5%B9%B411%E6%9C%8825%E6%97%A5%20%E4%B8%8B%E5%8D%8802_34_05.jpg`,
  contact: `${IMG}/mainPic/176405143811162.jpg`,
};

export type Industry = "semi" | "mould" | "auto";
/** caption keys refer to dictionary `captions` */
/** position: CSS object-position used when the photo is cropped on a card (default centre). */
export type Photo = { src: string; caption?: string; position?: string };

export type ProductData = {
  id: string;
  industry: Industry;
  photos: Photo[];
  /** Achieved tolerance / surface finish, shown only when filled in. */
  tolerance?: string;
  finish?: string;
};

const p = (path: string, caption?: string): Photo => ({ src: `${IMG}${path}`, caption });

export const products: ProductData[] = [
  {
    id: "carriers",
    industry: "semi",
    photos: [
      // own photo, hosted in /public; the card crops to the product shot above the banner strip
      { src: "/images/ic-smt-carrier.webp", caption: "producedCarrier", position: "center 30%" },
      p("/submainPic/17617242687%E8%93%8B%E6%9D%BF.jpg", "coverPlate"),
      p("/ckimg/ck1762173787.png"),
      p("/submainPic/17617401558%E6%9C%AA%E5%91%BD%E5%90%8D.png"),
      p("/submainPic/17617226939S__126459921.jpg"),
      p("/submainPic/176172420310S__126238726.jpg"),
    ],
  },
  {
    id: "vacuum",
    industry: "semi",
    // own photos, hosted in /public
    photos: [
      { src: "/images/vacuum-plate-12.webp", caption: "vacuumPlate12", position: "center 30%" },
      { src: "/images/vacuum-plate-2.webp", caption: "vacuumPlate2", position: "center 40%" },
      { src: "/images/vacuum-base.webp", caption: "vacuumBase", position: "center 40%" },
      { src: "/images/vacuum-base-real.webp", caption: "vacuumBaseReal" },
      { src: "/images/vacuum-nozzle.webp", caption: "vacuumNozzle", position: "center 40%" },
    ],
  },
  {
    id: "magazine",
    industry: "semi",
    photos: [{ src: "/images/magazine.webp", caption: "producedMagazine", position: "center 35%" }, p("/ckimg/ck1762250710.jpg")],
  },
  {
    id: "wirecut",
    industry: "mould",
    photos: [
      { src: "/images/wirecut-copper-ring.webp", caption: "copperRing", position: "center 45%" },
      p("/ckimg/ck1762084530.jpeg", "copperElectrode"),
      p("/ckimg/ck1762403162.jpg", "fineRib"),
      p("/ckimg/ck1762084756.jpeg", "precisionMould"),
      p("/ckimg/ck1762084868.jpeg", "largeMould"),
      p("/ckimg/ck1762403474.jpg"),
    ],
  },
  { id: "stamping", industry: "mould", photos: [] },
  {
    id: "equipment",
    industry: "auto",
    photos: [
      p("/submainPic/176302186761762830969727.jpg"),
      p("/ckimg/ck1763023844.jpg"),
      p("/ckimg/ck1763022035.jpg"),
      p("/ckimg/ck1763022921.jpg"),
      p("/ckimg/ck1763022978.jpg"),
    ],
  },
  {
    id: "robot",
    industry: "auto",
    photos: [
      p("/ckimg/ck1763255235.jpg"),
      p("/submainPic/1763079903%E6%B8%85%E6%B4%97%E5%B7%A5%E4%BB%B6%E5%A4%96%E8%A7%80%E5%8F%83%E8%80%83.jpg", "afterCleaning"),
      p("/ckimg/ck1763080104.jpg"),
      p("/ckimg/ck1763080163.jpg"),
    ],
  },
  {
    id: "trolley",
    industry: "auto",
    photos: [
      p("/submainPic/17630214456PPC.jpg"),
      p("/ckimg/ck1763021668.jpg", "allPP"),
      p("/ckimg/ck1763021745.jpg", "metalFrame"),
      p("/ckimg/ck1763023196.jpg"),
    ],
  },
];

export type MachineModel = { brand: string; model: string; travel?: string; note?: string; sheet?: string };
export type MachineData = {
  id: string;
  units?: number;
  models: MachineModel[];
  photos: Photo[];
  /**
   * Optional background-removed PNG of the machine (e.g. "/machines/wire.png" in /public).
   * When set, the machinery card shows it floating on the black stage instead of the faded photo.
   */
  cutout?: string;
};

export const machines: MachineData[] = [
  {
    id: "wire",
    units: 34,
    models: [
      { brand: "Mitsubishi", model: "MV1200S", travel: "400 × 300 × 220", sheet: `${IMG}/ckimg/ck1762074836.jpeg` },
      { brand: "Mitsubishi", model: "MV2400S", travel: "600 × 400 × 310", sheet: `${IMG}/ckimg/ck1762074857.jpeg` },
    ],
    photos: [
      { src: "/images/mv1200s-shop.webp", caption: "mv1200s" },
      { src: "/images/mv2400s-shop.webp", caption: "mv2400s" },
      p("/submainPic/17620727038%E6%A9%9F%E9%A0%AD.jpg", "wireHead"),
      p("/submainPic/17620726529%E7%B7%9A%E5%88%87%E5%89%B2%E6%B0%B4%E4%B8%AD1.jpg", "submerged"),
    ],
  },
  {
    id: "milling",
    units: 27,
    models: [
      { brand: "—", model: "e-750A", note: "vmc" },
      { brand: "—", model: "4-axis", travel: "1800 × 800 × 700" },
    ],
    photos: [
      { src: "/images/e-750a.webp", caption: "e750a" },
      p("/submainPic/17617317756e-1800.png"),
      p("/submainPic/17617882687260743.jpg"),
      p("/submainPic/17617882688260756.jpg"),
      p("/submainPic/17617882689260757.jpg"),
      p("/submainPic/176178826810260760.jpg"),
    ],
  },
  {
    id: "drill",
    units: 7,
    models: [
      { brand: "晏陽", model: "SY-CNC4050T", travel: "500 × 400 × 350", note: "atc10", sheet: `${IMG}/ckimg/ck1762074402.jpg` },
      { brand: "歐群", model: "River 350", travel: "350 × 250 × 330", note: "atc12", sheet: `${IMG}/ckimg/ck1762074601.jpg` },
    ],
    photos: [p("/submainPic/17620734186p-190115-07964.jpg"), p("/submainPic/17620734187River-350.jpg", "river350")],
  },
  {
    id: "sinker",
    models: [{ brand: "Mitsubishi", model: "SV8P", travel: "300 × 250 × 250", note: "thread", sheet: `${IMG}/ckimg/ck1762075233.jpeg` }],
    photos: [p("/submainPic/17620749456%E6%94%BE%E9%9B%BB.jpeg")],
  },
  {
    id: "grinding",
    units: 5,
    models: [
      { brand: "—", model: "NSG-618TS" },
      { brand: "—", model: "4080NC" },
    ],
    photos: [
      { src: "/images/grinder-nsg-618ts.webp", caption: "nsg618ts" },
      { src: "/images/grinder-4080nc.webp", caption: "g4080nc" },
    ],
  },
  {
    id: "press",
    models: [{ brand: "—", model: "110 t" }],
    photos: [p("/submainPic/17617894556%E6%B2%96%E5%BA%8A.jpg"), p("/submainPic/17617894557%E6%B2%96%E5%BA%8A2.jpg")],
  },
  {
    id: "inspection",
    models: [{ brand: "Keyence", model: "VR-6000", note: "profilometer" }],
    photos: [p("/submainPic/17617321896%E5%9F%BA%E6%81%A9%E6%96%AF.jpg", "keyence")],
  },
];

/** Sum of the unit counts the company publishes (press, sinker EDM and inspection are not stated). */
export const statedUnits = machines.reduce((n, m) => n + (m.units ?? 0), 0);

export const history = [2020, 2021, 2022, 2024, 2025, 2026] as const;

export const materials = ["SKD11", "SKD61", "S136", "NAK80", "SUS304", "SUS430", "Al 6061", "C1100", "Graphite", "Carbide"] as const;

export const acceptedExt = [".step", ".stp", ".iges", ".igs", ".dxf", ".dwg", ".pdf", ".x_t", ".zip"];
/** Vercel serverless functions accept request bodies up to 4.5 MB. */
export const maxUploadBytes = 4 * 1024 * 1024;
