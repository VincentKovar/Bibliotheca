import * as THREE from 'three';
import { BookGenre } from '../../types/game';
import { GENRE_COLORS } from '../bookGenerator';
import { createWoodTexture, createStoneHearthTexture, createPersianRugTexture, createParquetFloorTexture } from './textures';

// Cached textures
let oakTexture: THREE.CanvasTexture | null = null;
let darkMahoganyTexture: THREE.CanvasTexture | null = null;
let parquetFloorTexture: THREE.CanvasTexture | null = null;
let persianRugTexture: THREE.CanvasTexture | null = null;
let stoneTexture: THREE.CanvasTexture | null = null;

function getTextures() {
  if (!oakTexture) oakTexture = createWoodTexture('#92400e', '#78350f');
  if (!darkMahoganyTexture) darkMahoganyTexture = createWoodTexture('#451a03', '#270e02', true);
  if (!parquetFloorTexture) parquetFloorTexture = createParquetFloorTexture();
  if (!persianRugTexture) persianRugTexture = createPersianRugTexture();
  if (!stoneTexture) stoneTexture = createStoneHearthTexture();

  return {
    oak: oakTexture,
    mahogany: darkMahoganyTexture,
    parquet: parquetFloorTexture,
    rug: persianRugTexture,
    stone: stoneTexture,
  };
}

export function createBookshelf(
  genre: BookGenre,
  genreLabel: string,
  shelfIndex: number,
  isAntiqueOak: boolean = false
): THREE.Group {
  const tex = getTextures();
  const group = new THREE.Group();
  group.name = `bookshelf_${genre}_${shelfIndex}`;

  const woodMat = new THREE.MeshStandardMaterial({
    map: isAntiqueOak ? tex.oak : tex.mahogany,
    roughness: 0.35,
    metalness: 0.1,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.2,
  });

  const width = 2.4;
  const height = 3.6;
  const depth = 0.65;

  // 1. Base plinth
  const plinthGeo = new THREE.BoxGeometry(width + 0.15, 0.22, depth + 0.1);
  const plinth = new THREE.Mesh(plinthGeo, woodMat);
  plinth.position.y = 0.11;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 2. Side vertical pilasters / uprights
  const sideGeo = new THREE.BoxGeometry(0.12, height, depth);
  const leftSide = new THREE.Mesh(sideGeo, woodMat);
  leftSide.position.set(-width / 2, height / 2 + 0.1, 0);
  leftSide.castShadow = true;
  group.add(leftSide);

  const rightSide = new THREE.Mesh(sideGeo, woodMat);
  rightSide.position.set(width / 2, height / 2 + 0.1, 0);
  rightSide.castShadow = true;
  group.add(rightSide);

  // 3. Back panel
  const backGeo = new THREE.BoxGeometry(width, height - 0.2, 0.05);
  const backPanel = new THREE.Mesh(backGeo, woodMat);
  backPanel.position.set(0, height / 2 + 0.1, -depth / 2 + 0.03);
  backPanel.receiveShadow = true;
  group.add(backPanel);

  // 4. Crown molding / pediment
  const crownGeo = new THREE.BoxGeometry(width + 0.25, 0.28, depth + 0.15);
  const crown = new THREE.Mesh(crownGeo, woodMat);
  crown.position.set(0, height + 0.15, 0);
  crown.castShadow = true;
  group.add(crown);

  // Brass finial on top center
  const finialGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.2, 8);
  const finial = new THREE.Mesh(finialGeo, brassMat);
  finial.position.set(0, height + 0.35, 0);
  group.add(finial);

  // 5. Four shelves with books
  const numShelves = 4;
  const shelfSpacing = (height - 0.5) / numShelves;
  const genreConf = GENRE_COLORS[genre];

  for (let s = 0; s < numShelves; s++) {
    const sy = 0.3 + s * shelfSpacing;

    // Shelf board
    const shelfGeo = new THREE.BoxGeometry(width - 0.02, 0.08, depth - 0.06);
    const shelfMesh = new THREE.Mesh(shelfGeo, woodMat);
    shelfMesh.position.set(0, sy, 0);
    shelfMesh.receiveShadow = true;
    group.add(shelfMesh);

    // Books on this shelf
    const shelfBookCount = 14 + (s % 3) * 2;
    let curX = -width / 2 + 0.18;

    for (let b = 0; b < shelfBookCount; b++) {
      const bookW = 0.06 + (Math.sin(b * 3.7 + s) * 0.5 + 0.5) * 0.04;
      const bookH = 0.42 + (Math.cos(b * 2.3 + s) * 0.5 + 0.5) * 0.2;
      const bookD = depth * 0.65;

      if (curX + bookW > width / 2 - 0.18) break;

      const bookGeo = new THREE.BoxGeometry(bookW, bookH, bookD);
      // Mix of genre theme color and warm leather shades
      const colorChoices = [
        new THREE.Color(genreConf.spine),
        new THREE.Color(genreConf.spine).offsetHSL(0.05, -0.1, -0.05),
        new THREE.Color('#451a03'),
        new THREE.Color('#78350f'),
        new THREE.Color('#1e293b'),
        new THREE.Color('#831843'),
      ];
      const bookCol = colorChoices[b % colorChoices.length];

      const bookMat = new THREE.MeshStandardMaterial({
        color: bookCol,
        roughness: 0.65,
        metalness: 0.05,
      });

      const bookMesh = new THREE.Mesh(bookGeo, bookMat);
      // Small random tilt or lean for cozy realism
      const lean = b === 5 || b === 11 ? (b === 5 ? 0.08 : -0.09) : 0;
      bookMesh.position.set(curX + bookW / 2, sy + bookH / 2 + 0.04, 0.02);
      bookMesh.rotation.z = lean;
      bookMesh.castShadow = true;
      group.add(bookMesh);

      // Gold spine stripe on some books
      if (b % 3 === 0) {
        const stripeGeo = new THREE.BoxGeometry(bookW * 0.9, 0.03, bookD + 0.005);
        const stripe = new THREE.Mesh(stripeGeo, brassMat);
        stripe.position.set(curX + bookW / 2, sy + bookH * 0.75, 0.02);
        group.add(stripe);
      }

      curX += bookW + 0.015;
    }
  }

  // Brass genre plaque
  const plaqueGeo = new THREE.BoxGeometry(0.7, 0.16, 0.04);
  const plaque = new THREE.Mesh(plaqueGeo, brassMat);
  plaque.position.set(0, height + 0.15, depth / 2 + 0.08);
  group.add(plaque);

  return group;
}

export function createLibrarianDesk(): THREE.Group {
  const tex = getTextures();
  const group = new THREE.Group();
  group.name = 'librarian_desk';

  const woodMat = new THREE.MeshStandardMaterial({
    map: tex.mahogany,
    roughness: 0.3,
    metalness: 0.1,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Emerald banker's glass
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  // 1. Tabletop
  const topGeo = new THREE.BoxGeometry(2.4, 0.12, 1.4);
  const top = new THREE.Mesh(topGeo, woodMat);
  top.position.y = 1.05;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // 2. Four turned legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 1.0, 10);
  const legPositions = [
    [-1.05, 0.5, -0.55],
    [1.05, 0.5, -0.55],
    [-1.05, 0.5, 0.55],
    [1.05, 0.5, 0.55],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  // 3. Desk drawers / modesty panel
  const panelGeo = new THREE.BoxGeometry(2.2, 0.5, 0.06);
  const panel = new THREE.Mesh(panelGeo, woodMat);
  panel.position.set(0, 0.75, -0.55);
  group.add(panel);

  // 4. Banker's Lamp
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-0.75, 1.11, -0.3);

  const baseGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.04, 16);
  const lampBase = new THREE.Mesh(baseGeo, brassMat);
  lampGroup.add(lampBase);

  const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
  const stem = new THREE.Mesh(stemGeo, brassMat);
  stem.position.set(0, 0.2, 0);
  lampGroup.add(stem);

  // Emerald shade
  const shadeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.26, 12, 1, false, 0, Math.PI);
  const shade = new THREE.Mesh(shadeGeo, glassMat);
  shade.rotation.x = Math.PI / 2;
  shade.rotation.z = Math.PI / 2;
  shade.position.set(0, 0.38, 0);
  lampGroup.add(shade);

  // Warm glowing lamp point light
  const deskLight = new THREE.PointLight(0xffedd5, 1.4, 3.5, 1.8);
  deskLight.position.set(0, 0.34, 0.05);
  deskLight.castShadow = false;
  lampGroup.add(deskLight);

  group.add(lampGroup);

  // 5. Open Antique Ledger / Register
  const ledgerGroup = new THREE.Group();
  ledgerGroup.position.set(0.1, 1.14, 0.1);
  ledgerGroup.rotation.y = -0.15;

  const pageMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });

  const leftPageGeo = new THREE.BoxGeometry(0.32, 0.04, 0.44);
  const leftPage = new THREE.Mesh(leftPageGeo, pageMat);
  leftPage.position.set(-0.16, 0.02, 0);
  ledgerGroup.add(leftPage);

  const rightPage = new THREE.Mesh(leftPageGeo, pageMat);
  rightPage.position.set(0.16, 0.02, 0);
  ledgerGroup.add(rightPage);

  const bookSpine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.46), coverMat);
  ledgerGroup.add(bookSpine);

  // Red ribbon bookmark
  const ribbonGeo = new THREE.BoxGeometry(0.03, 0.005, 0.3);
  const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.set(0.05, 0.045, 0.15);
  ribbon.rotation.y = 0.2;
  ledgerGroup.add(ribbon);

  group.add(ledgerGroup);

  // 6. Inkwell and Quill
  const inkwellGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8);
  const inkwellMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
  const inkwell = new THREE.Mesh(inkwellGeo, inkwellMat);
  inkwell.position.set(0.55, 1.15, -0.3);
  group.add(inkwell);

  const quillGeo = new THREE.ConeGeometry(0.015, 0.35, 6);
  const quillMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const quill = new THREE.Mesh(quillGeo, quillMat);
  quill.position.set(0.56, 1.25, -0.28);
  quill.rotation.z = -0.4;
  quill.rotation.x = 0.3;
  group.add(quill);

  // 7. Wooden Sorting Stamp
  const stampGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.1, 10);
  const stamp = new THREE.Mesh(stampGeo, woodMat);
  stamp.position.set(0.72, 1.16, -0.1);
  group.add(stamp);

  return group;
}

export function createTBRTower(): THREE.Group {
  const tex = getTextures();
  const group = new THREE.Group();
  group.name = 'tbr_cart_tower';

  const woodMat = new THREE.MeshStandardMaterial({
    map: tex.oak,
    roughness: 0.4,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.8,
    roughness: 0.3,
  });

  // 1. Two-tier mobile book trolley / cart
  const cartW = 1.3;
  const cartD = 0.8;
  const bottomShelf = new THREE.Mesh(new THREE.BoxGeometry(cartW, 0.08, cartD), woodMat);
  bottomShelf.position.y = 0.35;
  group.add(bottomShelf);

  const topShelf = new THREE.Mesh(new THREE.BoxGeometry(cartW, 0.08, cartD), woodMat);
  topShelf.position.y = 0.95;
  topShelf.castShadow = true;
  group.add(topShelf);

  // Cart legs & handle
  const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8);
  const posts = [
    [-cartW / 2 + 0.06, 0.6, -cartD / 2 + 0.06],
    [cartW / 2 - 0.06, 0.6, -cartD / 2 + 0.06],
    [-cartW / 2 + 0.06, 0.6, cartD / 2 - 0.06],
    [cartW / 2 - 0.06, 0.6, cartD / 2 - 0.06],
  ];
  posts.forEach(([x, y, z]) => {
    const post = new THREE.Mesh(postGeo, brassMat);
    post.position.set(x, y, z);
    group.add(post);
  });

  // Brass wheels
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
  const wheels = [
    [-cartW / 2 + 0.06, 0.08, -cartD / 2 + 0.06],
    [cartW / 2 - 0.06, 0.08, -cartD / 2 + 0.06],
    [-cartW / 2 + 0.06, 0.08, cartD / 2 - 0.06],
    [cartW / 2 - 0.06, 0.08, cartD / 2 - 0.06],
  ];
  wheels.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, brassMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  // 2. High TBR Book Piles stacked on top shelf
  const bookColors = ['#9a3412', '#166534', '#1e40af', '#701a75', '#854d0e', '#365314', '#b45309'];
  const pileOffsets = [
    { x: -0.32, z: 0, count: 6 },
    { x: 0.28, z: -0.05, count: 7 },
  ];

  pileOffsets.forEach((pile) => {
    let curY = 1.0;
    for (let i = 0; i < pile.count; i++) {
      const bh = 0.07 + Math.random() * 0.03;
      const bw = 0.38 + Math.random() * 0.06;
      const bd = 0.52 + Math.random() * 0.06;

      const bookGeo = new THREE.BoxGeometry(bw, bh, bd);
      const bookMat = new THREE.MeshStandardMaterial({
        color: bookColors[(i * 3 + pile.count) % bookColors.length],
        roughness: 0.6,
      });

      const book = new THREE.Mesh(bookGeo, bookMat);
      // Staggered rotation for authentic cozy pile
      const yaw = (Math.sin(i * 1.7) * 0.12);
      book.position.set(pile.x + Math.sin(i) * 0.02, curY + bh / 2, pile.z + Math.cos(i) * 0.02);
      book.rotation.y = yaw;
      book.castShadow = true;
      group.add(book);

      curY += bh + 0.005;
    }
  });

  // 3. Mini chalkboard sign "TBR"
  const signGeo = new THREE.BoxGeometry(0.45, 0.28, 0.03);
  const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const sign = new THREE.Mesh(signGeo, signBoardMat);
  sign.position.set(0, 1.45, cartD / 2 + 0.02);
  group.add(sign);

  return group;
}

export function createTeaRoomNook(isSamovarUnlocked: boolean): THREE.Group {
  const tex = getTextures();
  const group = new THREE.Group();
  group.name = 'tea_room_nook';

  const woodMat = new THREE.MeshStandardMaterial({
    map: tex.mahogany,
    roughness: 0.35,
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x9f1239, // Deep burgundy velvet upholstery
    roughness: 0.7,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25,
  });

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.15,
  });

  // 1. Round pedestal tea table
  const tableTopGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24);
  const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
  tableTop.position.y = 0.95;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  const pedestalGeo = new THREE.CylinderGeometry(0.1, 0.16, 0.9, 12);
  const pedestal = new THREE.Mesh(pedestalGeo, woodMat);
  pedestal.position.y = 0.45;
  group.add(pedestal);

  const baseFeetGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.06, 12);
  const baseFeet = new THREE.Mesh(baseFeetGeo, woodMat);
  baseFeet.position.y = 0.03;
  group.add(baseFeet);

  // 2. Brass Samovar / Kettle
  const kettleGroup = new THREE.Group();
  kettleGroup.position.set(0, 0.99, 0);

  if (isSamovarUnlocked) {
    // Grand Samovar
    const samovarBodyGeo = new THREE.CylinderGeometry(0.2, 0.16, 0.42, 16);
    const samovarBody = new THREE.Mesh(samovarBodyGeo, brassMat);
    samovarBody.position.y = 0.24;
    kettleGroup.add(samovarBody);

    const lidGeo = new THREE.ConeGeometry(0.18, 0.12, 16);
    const lid = new THREE.Mesh(lidGeo, brassMat);
    lid.position.y = 0.5;
    kettleGroup.add(lid);

    const spoutGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.15, 8);
    const spout = new THREE.Mesh(spoutGeo, brassMat);
    spout.rotation.z = Math.PI / 4;
    spout.position.set(0.18, 0.15, 0);
    kettleGroup.add(spout);
  } else {
    // Classic teapot
    const potGeo = new THREE.SphereGeometry(0.16, 16, 12);
    const teapot = new THREE.Mesh(potGeo, ceramicMat);
    teapot.position.y = 0.16;
    kettleGroup.add(teapot);
  }
  group.add(kettleGroup);

  // 3. Two teacups & saucers
  const cupGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.07, 12);
  const saucerGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.02, 12);

  [-0.35, 0.35].forEach((x, i) => {
    const saucer = new THREE.Mesh(saucerGeo, ceramicMat);
    saucer.position.set(x, 0.99, 0.25 * (i === 0 ? 1 : -1));
    group.add(saucer);

    const cup = new THREE.Mesh(cupGeo, ceramicMat);
    cup.position.set(x, 1.03, 0.25 * (i === 0 ? 1 : -1));
    group.add(cup);
  });

  // 4. Two cozy wingback armchairs
  const chairPositions = [
    { x: -1.3, z: 0, rotY: Math.PI / 2 },
    { x: 1.3, z: 0, rotY: -Math.PI / 2 },
  ];

  chairPositions.forEach(({ x, z, rotY }) => {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;

    // Seat cushion
    const seatGeo = new THREE.BoxGeometry(0.7, 0.2, 0.7);
    const seat = new THREE.Mesh(seatGeo, velvetMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.7, 0.8, 0.18);
    const back = new THREE.Mesh(backGeo, velvetMat);
    back.position.set(0, 0.9, -0.32);
    back.castShadow = true;
    chair.add(back);

    // Armrests
    const armGeo = new THREE.BoxGeometry(0.14, 0.35, 0.65);
    const leftArm = new THREE.Mesh(armGeo, velvetMat);
    leftArm.position.set(-0.35, 0.68, 0);
    chair.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, velvetMat);
    rightArm.position.set(0.35, 0.68, 0);
    chair.add(rightArm);

    // Wooden legs
    const clGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.42, 8);
    [
      [-0.28, 0.21, -0.28],
      [0.28, 0.21, -0.28],
      [-0.28, 0.21, 0.28],
      [0.28, 0.21, 0.28],
    ].forEach(([cx, cy, cz]) => {
      const leg = new THREE.Mesh(clGeo, woodMat);
      leg.position.set(cx, cy, cz);
      chair.add(leg);
    });

    group.add(chair);
  });

  return group;
}

export function createFireplaceHearth(): THREE.Group {
  const tex = getTextures();
  const group = new THREE.Group();
  group.name = 'fireplace_hearth';

  const stoneMat = new THREE.MeshStandardMaterial({
    map: tex.stone,
    roughness: 0.8,
  });

  const mantleWoodMat = new THREE.MeshStandardMaterial({
    map: tex.mahogany,
    roughness: 0.4,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.7,
    metalness: 0.6,
  });

  // 1. Stone surround structure
  const surroundW = 2.4;
  const surroundH = 2.6;
  const depth = 0.8;

  // Hearth floor slab
  const slabGeo = new THREE.BoxGeometry(surroundW + 0.4, 0.12, depth + 0.4);
  const slab = new THREE.Mesh(slabGeo, stoneMat);
  slab.position.y = 0.06;
  group.add(slab);

  // Left & right stone pillars
  const pillarGeo = new THREE.BoxGeometry(0.5, surroundH - 0.4, depth);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-surroundW / 2 + 0.25, (surroundH - 0.4) / 2 + 0.12, 0);
  leftPillar.castShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(surroundW / 2 - 0.25, (surroundH - 0.4) / 2 + 0.12, 0);
  rightPillar.castShadow = true;
  group.add(rightPillar);

  // Arch lintel above firebox
  const lintelGeo = new THREE.BoxGeometry(surroundW, 0.5, depth);
  const lintel = new THREE.Mesh(lintelGeo, stoneMat);
  lintel.position.set(0, surroundH - 0.25, 0);
  group.add(lintel);

  // Back wall inside firebox (soot-stained black)
  const backBoxGeo = new THREE.BoxGeometry(surroundW - 0.9, surroundH - 0.8, 0.1);
  const sootMat = new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.95 });
  const backBox = new THREE.Mesh(backBoxGeo, sootMat);
  backBox.position.set(0, (surroundH - 0.8) / 2 + 0.12, -depth / 2 + 0.1);
  group.add(backBox);

  // 2. Heavy Carved Wood Mantle Shelf
  const mantleGeo = new THREE.BoxGeometry(surroundW + 0.5, 0.2, depth + 0.25);
  const mantle = new THREE.Mesh(mantleGeo, mantleWoodMat);
  mantle.position.set(0, surroundH + 0.1, 0.05);
  mantle.castShadow = true;
  group.add(mantle);

  // Brass candlesticks on mantle
  const candleGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.28, 8);
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
  [-0.8, 0.8].forEach((cx) => {
    const c = new THREE.Mesh(candleGeo, brassMat);
    c.position.set(cx, surroundH + 0.34, 0.05);
    group.add(c);
  });

  // 3. Iron andirons & birch logs
  const grate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), ironMat);
  grate.position.set(0, 0.17, 0);
  group.add(grate);

  const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 8);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
  const log1 = new THREE.Mesh(logGeo, logMat);
  log1.rotation.z = Math.PI / 2;
  log1.position.set(0, 0.28, -0.05);
  group.add(log1);

  const log2 = new THREE.Mesh(logGeo, logMat);
  log2.rotation.z = Math.PI / 2.2;
  log2.position.set(0, 0.38, 0.05);
  group.add(log2);

  // 4. Warm Fireplace Light & Ember Glow
  const fireLight = new THREE.PointLight(0xf97316, 2.0, 6.0, 1.8);
  fireLight.name = 'fireplace_point_light';
  fireLight.position.set(0, 0.45, 0.2);
  group.add(fireLight);

  // Glowing ember core mesh
  const emberGeo = new THREE.DodecahedronGeometry(0.18);
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const ember = new THREE.Mesh(emberGeo, emberMat);
  ember.name = 'fireplace_ember_mesh';
  ember.position.set(0, 0.28, 0);
  group.add(ember);

  return group;
}

export function createRareVitrine(): THREE.Group {
  const tex = getTextures();
  const group = new THREE.Group();
  group.name = 'rare_vitrine';

  const woodMat = new THREE.MeshStandardMaterial({
    map: tex.mahogany,
    roughness: 0.25,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.2,
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b, // Deep indigo royal velvet
    roughness: 0.8,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.5,
  });

  // Base cabinet
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), woodMat);
  base.position.y = 0.4;
  base.castShadow = true;
  group.add(base);

  // Velvet pillow
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.65), velvetMat);
  pillow.position.y = 0.84;
  group.add(pillow);

  // Glass display case
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.75), glassMat);
  glass.position.y = 1.18;
  group.add(glass);

  // Brass corner edges
  const edgeGeo = new THREE.BoxGeometry(0.04, 0.66, 0.04);
  [
    [-0.5, 1.18, -0.37],
    [0.5, 1.18, -0.37],
    [-0.5, 1.18, 0.37],
    [0.5, 1.18, 0.37],
  ].forEach(([x, y, z]) => {
    const edge = new THREE.Mesh(edgeGeo, brassMat);
    edge.position.set(x, y, z);
    group.add(edge);
  });

  // Rare illuminated book showcased inside
  const tome = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3, metalness: 0.1 })
  );
  tome.position.set(0, 0.92, 0);
  tome.rotation.y = 0.2;
  group.add(tome);

  // Spot light highlighting the showcase
  const spot = new THREE.PointLight(0xfef08a, 1.2, 2.5);
  spot.position.set(0, 1.45, 0);
  group.add(spot);

  return group;
}

export function createCatPerch(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cat_perch';

  // Plump circular velvet cushion
  const cushionGeo = new THREE.CylinderGeometry(0.45, 0.48, 0.18, 20);
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Emerald green cushion
    roughness: 0.75,
  });
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.y = 0.09;
  cushion.castShadow = true;
  group.add(cushion);

  // Gold tassels
  const tasselMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const tassel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), tasselMat);
    tassel.position.set(Math.cos(angle) * 0.48, 0.05, Math.sin(angle) * 0.48);
    group.add(tassel);
  }

  // Calico Sleeping Cat (curled up)
  const catMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.85 }); // Warm cream
  const patchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 }); // Ginger patch

  // Cat body
  const bodyGeo = new THREE.SphereGeometry(0.18, 14, 12);
  const catBody = new THREE.Mesh(bodyGeo, catMat);
  catBody.scale.set(1.2, 0.7, 1.0);
  catBody.position.set(0, 0.24, 0);
  catBody.name = 'sleeping_cat_body';
  group.add(catBody);

  // Ginger spot on back
  const patchGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const patch = new THREE.Mesh(patchGeo, patchMat);
  patch.position.set(0.04, 0.29, 0.02);
  group.add(patch);

  // Cat head
  const headGeo = new THREE.SphereGeometry(0.11, 12, 10);
  const catHead = new THREE.Mesh(headGeo, catMat);
  catHead.position.set(0.16, 0.25, 0.08);
  group.add(catHead);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.04, 0.07, 4);
  const leftEar = new THREE.Mesh(earGeo, patchMat);
  leftEar.position.set(0.2, 0.33, 0.12);
  leftEar.rotation.z = -0.3;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, catMat);
  rightEar.position.set(0.14, 0.33, 0.16);
  rightEar.rotation.x = 0.3;
  group.add(rightEar);

  // Curled tail
  const tailGeo = new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI);
  const tail = new THREE.Mesh(tailGeo, patchMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(-0.06, 0.2, 0);
  group.add(tail);

  return group;
}
