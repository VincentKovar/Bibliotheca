import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generators for Bibliotheca
 * Fully offline, zero 404s, sharp anisotropic filtering, SRGBColorSpace
 */

export function createWoodTexture(colorBase: string = '#854d0e', grainColor: string = '#713f12', dark: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorBase;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle wood rings and grain
  ctx.strokeStyle = grainColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = dark ? 0.35 : 0.22;

  for (let y = 0; y < 512; y += 4) {
    ctx.beginPath();
    let x = 0;
    ctx.moveTo(x, y);
    while (x < 512) {
      x += 20 + Math.random() * 30;
      const wave = Math.sin((x / 512) * Math.PI * 4 + (y / 50)) * 3;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // Wood knots
  for (let k = 0; k < 4; k++) {
    const kx = 80 + Math.random() * 350;
    const ky = 80 + Math.random() * 350;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 8 + Math.random() * 10, 16 + Math.random() * 20, Math.PI / 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createParquetFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#451a03'; // Deep aged oak
  ctx.fillRect(0, 0, 1024, 1024);

  const plankW = 128;
  const plankH = 32;

  // Herringbone / basketweave parquet pattern
  for (let x = 0; x < 1024; x += plankW) {
    for (let y = 0; y < 1024; y += plankH) {
      const isAlt = (Math.floor(x / plankW) + Math.floor(y / plankH)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#78350f' : '#92400e';
      ctx.fillRect(x + 2, y + 2, plankW - 4, plankH - 4);

      // Plank grain
      ctx.fillStyle = 'rgba(40, 15, 5, 0.25)';
      for (let g = 4; g < plankH - 4; g += 6) {
        ctx.fillRect(x + 4, y + g, plankW - 8, 1.5);
      }
    }
  }

  // Subtle varnish sheen borders
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += plankW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPersianRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Crimson red ground
  ctx.fillStyle = '#831843';
  ctx.fillRect(0, 0, 512, 768);

  // Outer border - navy & gold
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(16, 16, 480, 736);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(36, 36, 440, 696);

  // Inner field - deep burgundy
  ctx.fillStyle = '#881337';
  ctx.fillRect(52, 52, 408, 664);

  // Central ornate diamond medallion
  ctx.save();
  ctx.translate(256, 384);

  // Outer diamond
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(0, -180);
  ctx.lineTo(130, 0);
  ctx.lineTo(0, 180);
  ctx.lineTo(-130, 0);
  ctx.closePath();
  ctx.fill();

  // Inner navy star
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(0, -140);
  ctx.lineTo(100, 0);
  ctx.lineTo(0, 140);
  ctx.lineTo(-100, 0);
  ctx.closePath();
  ctx.fill();

  // Center blossom
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Fringes on top and bottom
  ctx.fillStyle = '#fef3c7';
  for (let i = 0; i < 512; i += 6) {
    ctx.fillRect(i, 0, 3, 14);
    ctx.fillRect(i, 754, 3, 14);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStoneHearthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#292524'; // Dark mortar
  ctx.fillRect(0, 0, 512, 512);

  const stoneCols = ['#57534e', '#44403c', '#78716c', '#52525b'];
  const brickH = 42;
  const brickW = 85;

  for (let row = 0; row < 12; row++) {
    const offsetX = (row % 2) * (brickW / 2);
    for (let col = -1; col < 8; col++) {
      const bx = col * brickW + offsetX;
      const by = row * brickH;
      ctx.fillStyle = stoneCols[(row * 3 + col + 10) % stoneCols.length];
      ctx.beginPath();
      ctx.roundRect(bx + 3, by + 3, brickW - 6, brickH - 6, 4);
      ctx.fill();

      // Stone texture stipples
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let s = 0; s < 10; s++) {
        ctx.fillRect(bx + 8 + Math.random() * (brickW - 16), by + 8 + Math.random() * (brickH - 16), 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStainedGlassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1b4b'; // Lead came frame
  ctx.fillRect(0, 0, 512, 512);

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  // Rose window radial segments
  const cx = 256;
  const cy = 256;
  const numPetals = 12;

  for (let i = 0; i < numPetals; i++) {
    const angle1 = (i / numPetals) * Math.PI * 2;
    const angle2 = ((i + 1) / numPetals) * Math.PI * 2;

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 220, angle1, angle2);
    ctx.closePath();
    ctx.fill();

    // Lead dividers
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  // Center golden medallion
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
