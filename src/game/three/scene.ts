import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LibrarianAvatar, WeatherType } from '../../types/game';
import { synthAudio } from '../../audio/synthAudio';
import {
  createBookshelf,
  createLibrarianDesk,
  createTBRTower,
  createTeaRoomNook,
  createFireplaceHearth,
  createRareVitrine,
  createCatPerch,
} from './models';
import { LibrarianCharacter } from './character';
import { createWoodTexture, createParquetFloorTexture, createPersianRugTexture, createStainedGlassTexture } from './textures';

export type CameraPreset = 'overview' | 'desk' | 'stacks' | 'tea_room' | 'vitrine' | 'avatar';

export interface StationHit {
  station: 'desk' | 'tbr' | 'tea' | 'vitrine' | 'avatar' | 'cat' | 'bookshelf';
  label: string;
}

export class Library3DScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Weather state & particles
  public currentWeather: WeatherType = 'clear';
  private rainLines!: THREE.LineSegments;
  private rainPositions!: Float32Array;
  private rainVelocities!: Float32Array;
  private leavesGroup!: THREE.Group;
  private leavesList: {
    mesh: THREE.Mesh;
    seed: number;
    speedY: number;
    swaySpeed: number;
    rotSpeed: THREE.Vector3;
  }[] = [];
  private snowParticles!: THREE.Points;
  private snowPositions!: Float32Array;

  // Actors & Props
  public librarian!: LibrarianCharacter;
  private bookshelves: THREE.Group[] = [];
  private desk!: THREE.Group;
  private tbrTower!: THREE.Group;
  private teaNook!: THREE.Group;
  private fireplace!: THREE.Group;
  private vitrine!: THREE.Group;
  private catPerch!: THREE.Group;
  private sleepingCatBody: THREE.Mesh | null = null;
  private fireplaceEmber: THREE.Mesh | null = null;
  private fireplaceLight: THREE.PointLight | null = null;
  private dustParticles!: THREE.Points;
  private skyBackdropMesh!: THREE.Mesh;

  // Lighting
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private interiorWarmLights: THREE.PointLight[] = [];

  // Camera targets & damping
  private currentCameraTarget = new THREE.Vector3(0, 1.5, 0);
  private desiredCameraTarget = new THREE.Vector3(0, 1.5, 0);
  private desiredCameraPos = new THREE.Vector3(16, 17, 16);

  // Day/Night time (0 to 24)
  private timeOfDayHour: number = 15.5;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private interactiveMeshes: { mesh: THREE.Object3D; hit: StationHit }[] = [];
  private onStationClicked?: (hit: StationHit) => void;

  constructor(container: HTMLElement, avatarConfig: LibrarianAvatar, onStationClicked?: (hit: StationHit) => void) {
    this.container = container;
    this.onStationClicked = onStationClicked;
    this.init(avatarConfig);
  }

  private init(avatarConfig: LibrarianAvatar) {
    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & PMREM RoomEnvironment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1c1917');
    this.scene.fog = new THREE.FogExp2('#1c1917', 0.018);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Isometric-styled low FOV Camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    this.camera.position.set(16, 17, 16);
    this.camera.lookAt(this.currentCameraTarget);

    // 5. Build Environment & Architecture
    this.buildArchitecture();

    // 6. Spawn Characters and Props
    this.librarian = new LibrarianCharacter(avatarConfig);
    this.librarian.group.position.set(0.5, 0, 0.5);
    this.scene.add(this.librarian.group);

    // Register interactive targets for clicking
    this.registerInteractiveTargets();

    // 7. Setup Dust Particles & Dynamic Weather
    this.setupDustParticles();
    this.setupWeatherSystems();

    // 8. Event listeners
    this.container.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('resize', this.onWindowResize);

    // 9. Start Game Loop
    this.tick();
  }

  private buildArchitecture() {
    const roomW = 18;
    const roomD = 18;
    const wallH = 7.5;

    // Floor (parquet)
    const parquetTex = createParquetFloorTexture();
    parquetTex.repeat.set(4, 4);
    const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
    const floorMat = new THREE.MeshStandardMaterial({
      map: parquetTex,
      roughness: 0.35,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Central Persian Rug
    const rugTex = createPersianRugTexture();
    const rugGeo = new THREE.PlaneGeometry(7.5, 9.5);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.85,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.015, 0.5);
    rug.receiveShadow = true;
    this.scene.add(rug);

    // Wainscoting & Plaster Walls (North Wall and West Wall)
    const woodTex = createWoodTexture('#451a03', '#270e02', true);
    woodTex.repeat.set(3, 1);

    const wainscotMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.35,
    });
    const plasterMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedc, // Warm cream antique library plaster
      roughness: 0.9,
    });

    // North Wall (Z = -roomD / 2)
    const northWallPlaster = new THREE.Mesh(new THREE.PlaneGeometry(roomW, wallH - 2.2), plasterMat);
    northWallPlaster.position.set(0, (wallH - 2.2) / 2 + 2.2, -roomD / 2);
    northWallPlaster.receiveShadow = true;
    this.scene.add(northWallPlaster);

    const northWainscot = new THREE.Mesh(new THREE.BoxGeometry(roomW, 2.2, 0.15), wainscotMat);
    northWainscot.position.set(0, 1.1, -roomD / 2 + 0.07);
    this.scene.add(northWainscot);

    // West Wall (X = -roomW / 2)
    const westWallPlaster = new THREE.Mesh(new THREE.PlaneGeometry(roomD, wallH - 2.2), plasterMat);
    westWallPlaster.rotation.y = Math.PI / 2;
    westWallPlaster.position.set(-roomW / 2, (wallH - 2.2) / 2 + 2.2, 0);
    westWallPlaster.receiveShadow = true;
    this.scene.add(westWallPlaster);

    const westWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, roomD), wainscotMat);
    westWainscot.position.set(-roomW / 2 + 0.07, 1.1, 0);
    this.scene.add(westWainscot);

    // Grand Arched Cathedral Windows on North Wall
    this.buildWindows(-roomD / 2 + 0.02);

    // Lighting setup
    this.hemiLight = new THREE.HemisphereLight(0xffedd5, 0x334155, 0.8);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    this.sunLight.position.set(14, 22, 10);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 45;
    this.sunLight.shadow.camera.left = -12;
    this.sunLight.shadow.camera.right = 12;
    this.sunLight.shadow.camera.top = 12;
    this.sunLight.shadow.camera.bottom = -12;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Bookshelves: 2 on the right wall (North wall, framing windows without blocking them),
    // and 2 on the fireplace wall (West wall, flanking the stone fireplace hearth on either side)
    const bookshelfConfigs = [
      // Right Wall (North Wall: Z = -roomD / 2 + 0.5) - outside the two cathedral windows (at x = -3.0 and x = 3.0)
      {
        genre: 'fiction',
        label: 'Fiction (800)',
        pos: new THREE.Vector3(-6.2, 0, -roomD / 2 + 0.5),
        rotY: 0,
      },
      {
        genre: 'astronomy',
        label: 'Astronomy & Stars (520)',
        pos: new THREE.Vector3(6.2, 0, -roomD / 2 + 0.5),
        rotY: 0,
      },
      // Fireplace Wall (West Wall: X = -roomW / 2 + 0.5) - flanking either side of the fireplace (at z = -0.8)
      {
        genre: 'philosophy',
        label: 'Philosophy (100)',
        pos: new THREE.Vector3(-roomW / 2 + 0.5, 0, -3.8),
        rotY: Math.PI / 2,
      },
      {
        genre: 'botany',
        label: 'Botany & Nature (580)',
        pos: new THREE.Vector3(-roomW / 2 + 0.5, 0, 2.2),
        rotY: Math.PI / 2,
      },
    ];

    bookshelfConfigs.forEach((item, idx) => {
      const shelf = createBookshelf(item.genre as any, item.label, idx, true);
      shelf.position.copy(item.pos);
      shelf.rotation.y = item.rotY;
      this.scene.add(shelf);
      this.bookshelves.push(shelf);
    });

    // Main Librarian Sorting Desk (center-left)
    this.desk = createLibrarianDesk();
    this.desk.position.set(-1.4, 0, 0.4);
    this.desk.rotation.y = Math.PI / 4;
    this.scene.add(this.desk);

    // TBR Cart & Tower (near desk)
    this.tbrTower = createTBRTower();
    this.tbrTower.position.set(-3.6, 0, 2.2);
    this.tbrTower.rotation.y = 0.3;
    this.scene.add(this.tbrTower);

    // Tea Room Nook (East wing)
    this.teaNook = createTeaRoomNook(true);
    this.teaNook.position.set(4.5, 0, 1.2);
    this.scene.add(this.teaNook);

    // Stone Fireplace Hearth (West wall center)
    this.fireplace = createFireplaceHearth();
    this.fireplace.rotation.y = Math.PI / 2;
    this.fireplace.position.set(-roomW / 2 + 0.5, 0, -0.8);
    this.scene.add(this.fireplace);

    this.fireplaceEmber = this.fireplace.getObjectByName('fireplace_ember_mesh') as THREE.Mesh;
    this.fireplaceLight = this.fireplace.getObjectByName('fireplace_point_light') as THREE.PointLight;
    if (this.fireplaceLight) this.interiorWarmLights.push(this.fireplaceLight);

    // Rare Book Glass Vitrine (front right)
    this.vitrine = createRareVitrine();
    this.vitrine.position.set(2.2, 0, 4.8);
    this.vitrine.rotation.y = -Math.PI / 6;
    this.scene.add(this.vitrine);

    // Sleeping Calico Cat Perch (near the fireplace)
    this.catPerch = createCatPerch();
    this.catPerch.position.set(-5.2, 0, 1.8);
    this.scene.add(this.catPerch);
    this.sleepingCatBody = this.catPerch.getObjectByName('sleeping_cat_body') as THREE.Mesh;

    // Apply initial time of day lighting
    this.applyDayNightLighting(this.timeOfDayHour);
  }

  private buildWindows(wallZ: number) {
    const glassTex = createStainedGlassTexture();
    const windowMat = new THREE.MeshStandardMaterial({
      map: glassTex,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.3,
    });

    const frameWoodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.4,
    });

    // Two grand arched windows
    [-3.0, 3.0].forEach((wx) => {
      const winGroup = new THREE.Group();
      winGroup.position.set(wx, 4.4, wallZ);

      // Glass arch
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4), windowMat);
      glass.position.z = 0.02;
      winGroup.add(glass);

      // Wooden Arch Frame
      const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 0.2), frameWoodMat);
      frameTop.position.y = 1.7;
      winGroup.add(frameTop);

      const frameSill = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.35), frameWoodMat);
      frameSill.position.y = -1.7;
      winGroup.add(frameSill);

      this.scene.add(winGroup);
    });

    // Outdoor Sky Backdrop Plane behind windows
    const skyGeo = new THREE.PlaneGeometry(26, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    this.skyBackdropMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyBackdropMesh.position.set(0, 6, wallZ - 1.5);
    this.scene.add(this.skyBackdropMesh);
  }

  private setupDustParticles() {
    const count = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 6 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  private setupWeatherSystems() {
    // 1. Soft Rain setup (LineSegments)
    const rainCount = 420;
    const rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(rainCount * 6); // 2 vertices (6 floats) per streak
    this.rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = Math.random() * 12 + 0.5;
      const z = (Math.random() - 0.5) * 18;
      const streakLen = 0.42;
      const slantX = 0.08;
      const slantZ = 0.04;

      const idx = i * 6;
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;

      this.rainPositions[idx + 3] = x - slantX;
      this.rainPositions[idx + 4] = y - streakLen;
      this.rainPositions[idx + 5] = z - slantZ;

      this.rainVelocities[i] = 14 + Math.random() * 4;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
    this.rainLines.visible = false;
    this.scene.add(this.rainLines);

    // 2. Falling Autumn Leaves setup
    this.leavesGroup = new THREE.Group();
    this.leavesGroup.name = 'weather_leaves_group';
    this.leavesGroup.visible = false;

    const leafCols = ['#dc2626', '#fbbf24', '#d97706', '#9a3412', '#b45309', '#f97316'];
    const leafGeo = new THREE.PlaneGeometry(0.18, 0.24, 1, 1);

    for (let i = 0; i < 140; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: leafCols[i % leafCols.length],
        side: THREE.DoubleSide,
        roughness: 0.75,
      });
      const leafMesh = new THREE.Mesh(leafGeo, mat);
      leafMesh.position.set(
        (Math.random() - 0.5) * 16,
        Math.random() * 10 + 0.2,
        (Math.random() - 0.5) * 16
      );
      leafMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      this.leavesGroup.add(leafMesh);

      this.leavesList.push({
        mesh: leafMesh,
        seed: i * 1.37,
        speedY: 0.8 + Math.random() * 0.7,
        swaySpeed: 1.4 + Math.random() * 1.5,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 3
        ),
      });
    }
    this.scene.add(this.leavesGroup);

    // 3. Gentle Snow setup (Points)
    const snowCount = 280;
    const snowGeo = new THREE.BufferGeometry();
    this.snowPositions = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 16;
      this.snowPositions[i * 3 + 1] = Math.random() * 11 + 0.2;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }

    snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.snowParticles = new THREE.Points(snowGeo, snowMat);
    this.snowParticles.visible = false;
    this.scene.add(this.snowParticles);
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;

    if (this.rainLines) this.rainLines.visible = weather === 'soft_rain';
    if (this.leavesGroup) this.leavesGroup.visible = weather === 'falling_leaves';
    if (this.snowParticles) this.snowParticles.visible = weather === 'gentle_snow';

    // Weather audio integration
    if (weather === 'soft_rain') {
      synthAudio.startRainAmbience();
    } else {
      synthAudio.stopRainAmbience();
    }

    // Subtly re-apply lighting mood
    this.applyDayNightLighting(this.timeOfDayHour);
  }

  private registerInteractiveTargets() {
    this.interactiveMeshes = [
      {
        mesh: this.desk,
        hit: { station: 'desk', label: 'Main Sorting Desk' },
      },
      {
        mesh: this.tbrTower,
        hit: { station: 'tbr', label: 'TBR Cart & Loan Ledger' },
      },
      {
        mesh: this.teaNook,
        hit: { station: 'tea', label: 'Tea Room & Visitors' },
      },
      {
        mesh: this.vitrine,
        hit: { station: 'vitrine', label: 'Rare Vintage Vitrine' },
      },
      {
        mesh: this.librarian.group,
        hit: { station: 'avatar', label: 'Librarian Elspeth' },
      },
      {
        mesh: this.catPerch,
        hit: { station: 'cat', label: 'Barnaby the Calico Cat' },
      },
    ];

    this.bookshelves.forEach((shelf) => {
      this.interactiveMeshes.push({
        mesh: shelf,
        hit: { station: 'bookshelf', label: 'Library Stacks' },
      });
    });
  }

  public setCameraPreset(preset: CameraPreset) {
    if (preset === 'overview') {
      this.desiredCameraPos.set(16, 17, 16);
      this.desiredCameraTarget.set(0, 1.5, 0);
    } else if (preset === 'desk') {
      this.desiredCameraPos.set(4, 5, 5);
      this.desiredCameraTarget.set(-1.4, 1.1, 0.4);
      this.librarian.setDestination(new THREE.Vector3(-0.6, 0, 0.8));
    } else if (preset === 'stacks') {
      this.desiredCameraPos.set(4.5, 7.5, 9);
      this.desiredCameraTarget.set(-1.0, 2.0, -5.5);
    } else if (preset === 'tea_room') {
      this.desiredCameraPos.set(8.5, 5.5, 6.5);
      this.desiredCameraTarget.set(4.5, 1.2, 1.2);
      this.librarian.setDestination(new THREE.Vector3(3.2, 0, 1.4));
    } else if (preset === 'vitrine') {
      this.desiredCameraPos.set(5.5, 4.2, 8.5);
      this.desiredCameraTarget.set(2.2, 1.1, 4.8);
      this.librarian.setDestination(new THREE.Vector3(1.4, 0, 4.2));
    } else if (preset === 'avatar') {
      this.desiredCameraPos.set(
        this.librarian.group.position.x + 2.8,
        2.5,
        this.librarian.group.position.z + 2.8
      );
      this.desiredCameraTarget.set(
        this.librarian.group.position.x,
        1.2,
        this.librarian.group.position.z
      );
    }
  }

  public setTimeOfDay(hour: number) {
    this.timeOfDayHour = (hour % 24 + 24) % 24;
    this.applyDayNightLighting(this.timeOfDayHour);
  }

  public getTimeOfDay(): number {
    return this.timeOfDayHour;
  }

  private applyDayNightLighting(hour: number) {
    // 0 = Midnight, 6 = Dawn, 12 = Noon, 18 = Sunset/Dusk, 21 = Night
    let sunIntensity = 0;
    let sunCol = new THREE.Color();
    let skyCol = new THREE.Color();
    let hemiSky = new THREE.Color();
    let hemiGround = new THREE.Color();
    let interiorWarmFactor = 0;

    if (hour >= 5 && hour < 8) {
      // Dawn (rosy pink and golden)
      const t = (hour - 5) / 3;
      sunCol.set('#fde047').lerp(new THREE.Color('#fff7ed'), t);
      skyCol.set('#f472b6').lerp(new THREE.Color('#93c5fd'), t);
      hemiSky.set('#fed7aa');
      hemiGround.set('#334155');
      sunIntensity = 0.5 + t * 0.9;
      interiorWarmFactor = 1.0 - t * 0.7;
    } else if (hour >= 8 && hour < 17) {
      // Crisp day
      sunCol.set('#fffbeb');
      skyCol.set('#38bdf8');
      hemiSky.set('#f1f5f9');
      hemiGround.set('#475569');
      sunIntensity = 1.6;
      interiorWarmFactor = 0.3;
    } else if (hour >= 17 && hour < 20) {
      // Golden hour to Amber Sunset
      const t = (hour - 17) / 3;
      sunCol.set('#fb923c').lerp(new THREE.Color('#e11d48'), t);
      skyCol.set('#f97316').lerp(new THREE.Color('#4338ca'), t);
      hemiSky.set('#fde68a');
      hemiGround.set('#1e1b4b');
      sunIntensity = 1.4 - t * 1.0;
      interiorWarmFactor = 0.4 + t * 0.8;
    } else {
      // Night / Midnight
      sunCol.set('#60a5fa'); // Cool moonlight
      skyCol.set('#090d16'); // Deep starry night
      hemiSky.set('#1e293b');
      hemiGround.set('#0f172a');
      sunIntensity = 0.25;
      interiorWarmFactor = 1.5;
    }

    // Modulate atmospheric lighting by active weather
    if (this.currentWeather === 'soft_rain') {
      skyCol.lerp(new THREE.Color('#334155'), 0.55); // Misty overcast slate
      sunIntensity *= 0.6; // Softer diffuse light
      interiorWarmFactor *= 1.35; // Lamps and hearth feel even warmer against the rainy gloom
    } else if (this.currentWeather === 'falling_leaves') {
      skyCol.lerp(new THREE.Color('#d97706'), 0.18); // Warm golden autumn haze
      sunCol.lerp(new THREE.Color('#f59e0b'), 0.2);
    } else if (this.currentWeather === 'gentle_snow') {
      skyCol.lerp(new THREE.Color('#1e293b'), 0.35); // Winter twilight
      sunCol.lerp(new THREE.Color('#e0f2fe'), 0.3);
      interiorWarmFactor *= 1.4; // Fireplace glow stands out against snow
    }

    this.sunLight.color.copy(sunCol);
    this.sunLight.intensity = sunIntensity;
    this.hemiLight.color.copy(hemiSky);
    this.hemiLight.groundColor.copy(hemiGround);

    if (this.skyBackdropMesh) {
      (this.skyBackdropMesh.material as THREE.MeshBasicMaterial).color.copy(skyCol);
    }

    if (this.scene.fog) {
      this.scene.fog.color.copy(skyCol).lerp(new THREE.Color('#1c1917'), 0.7);
    }

    // Boost interior hearth and desk light warmly at night
    if (this.fireplaceLight) {
      this.fireplaceLight.intensity = 1.2 * interiorWarmFactor;
    }
  }

  private onPointerDown = (event: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Collect all candidate child meshes
    const candidates: { child: THREE.Object3D; hit: StationHit }[] = [];
    this.interactiveMeshes.forEach((item) => {
      item.mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          candidates.push({ child, hit: item.hit });
        }
      });
    });

    const intersections = this.raycaster.intersectObjects(candidates.map((c) => c.child), false);
    if (intersections.length > 0) {
      const hitObj = intersections[0].object;
      const match = candidates.find((c) => c.child === hitObj);
      if (match && this.onStationClicked) {
        this.onStationClicked(match.hit);
      }
    }
  };

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    // Update character
    if (this.librarian) {
      this.librarian.update(dt);
    }

    // Smooth Camera Damping
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.desiredCameraPos.x, 4, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.desiredCameraPos.y, 4, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.desiredCameraPos.z, 4, dt);

    this.currentCameraTarget.x = THREE.MathUtils.damp(this.currentCameraTarget.x, this.desiredCameraTarget.x, 5, dt);
    this.currentCameraTarget.y = THREE.MathUtils.damp(this.currentCameraTarget.y, this.desiredCameraTarget.y, 5, dt);
    this.currentCameraTarget.z = THREE.MathUtils.damp(this.currentCameraTarget.z, this.desiredCameraTarget.z, 5, dt);

    this.camera.lookAt(this.currentCameraTarget);

    // Subtle animations: fireplace flame flicker & cat breathing
    const time = this.clock.getElapsedTime();
    if (this.fireplaceLight) {
      this.fireplaceLight.intensity += Math.sin(time * 12) * 0.04;
    }
    if (this.fireplaceEmber) {
      const flicker = 1.0 + Math.sin(time * 8) * 0.15;
      this.fireplaceEmber.scale.set(flicker, flicker, flicker);
    }
    if (this.sleepingCatBody) {
      const catBreath = 1.0 + Math.sin(time * 2.2) * 0.03;
      this.sleepingCatBody.scale.y = 0.7 * catBreath;
    }

    // Dust motes drifting gently in light rays
    if (this.dustParticles) {
      const posAttr = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) - dt * 0.15;
        if (y < 0.2) y = 6.0;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // 1. Soft Rain Animation
    if (this.currentWeather === 'soft_rain' && this.rainLines) {
      const posAttr = this.rainLines.geometry.attributes.position as THREE.BufferAttribute;
      const count = posAttr.count / 2;
      for (let i = 0; i < count; i++) {
        const idx = i * 6;
        let y = this.rainPositions[idx + 1] - this.rainVelocities[i] * dt;
        let x = this.rainPositions[idx] - 1.2 * dt;
        let z = this.rainPositions[idx + 2] - 0.7 * dt;

        if (y < 0.1) {
          y = 10.0 + Math.random() * 3.0;
          x = (Math.random() - 0.5) * 18;
          z = (Math.random() - 0.5) * 18;
        }

        const streakLen = 0.42;
        const slantX = 0.08;
        const slantZ = 0.04;

        this.rainPositions[idx] = x;
        this.rainPositions[idx + 1] = y;
        this.rainPositions[idx + 2] = z;

        this.rainPositions[idx + 3] = x - slantX;
        this.rainPositions[idx + 4] = y - streakLen;
        this.rainPositions[idx + 5] = z - slantZ;
      }
      posAttr.needsUpdate = true;
    }

    // 2. Falling Autumn Leaves Animation
    if (this.currentWeather === 'falling_leaves' && this.leavesGroup) {
      for (let i = 0; i < this.leavesList.length; i++) {
        const item = this.leavesList[i];
        item.mesh.position.y -= item.speedY * dt;
        item.mesh.position.x += Math.sin(time * item.swaySpeed + item.seed) * dt * 0.75;
        item.mesh.position.z += Math.cos(time * item.swaySpeed * 0.8 + item.seed) * dt * 0.5;

        item.mesh.rotation.x += item.rotSpeed.x * dt;
        item.mesh.rotation.y += item.rotSpeed.y * dt;
        item.mesh.rotation.z += item.rotSpeed.z * dt;

        if (item.mesh.position.y < 0.05) {
          item.mesh.position.y = 8.5 + Math.random() * 3.5;
          item.mesh.position.x = (Math.random() - 0.5) * 16;
          item.mesh.position.z = (Math.random() - 0.5) * 16;
        }
      }
    }

    // 3. Gentle Snow Animation
    if (this.currentWeather === 'gentle_snow' && this.snowParticles) {
      const posAttr = this.snowParticles.geometry.attributes.position as THREE.BufferAttribute;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let y = this.snowPositions[i * 3 + 1] - dt * 0.85;
        let x = this.snowPositions[i * 3] + Math.sin(time * 1.5 + i) * dt * 0.35;
        let z = this.snowPositions[i * 3 + 2] + Math.cos(time * 1.2 + i) * dt * 0.25;

        if (y < 0.1) {
          y = 9.5 + Math.random() * 2.5;
          x = (Math.random() - 0.5) * 16;
          z = (Math.random() - 0.5) * 16;
        }

        this.snowPositions[i * 3] = x;
        this.snowPositions[i * 3 + 1] = y;
        this.snowPositions[i * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }
}
