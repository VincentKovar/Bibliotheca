import * as THREE from 'three';
import { LibrarianAvatar } from '../../types/game';

export class LibrarianCharacter {
  public group: THREE.Group;
  private avatarConfig: LibrarianAvatar;

  // Animation nodes
  private bodyMesh!: THREE.Mesh;
  private headGroup!: THREE.Group;
  private hairGroup!: THREE.Group;
  private eyewearGroup!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private accessoryGroup!: THREE.Group;

  // Walk state
  private isWalking: boolean = false;
  private walkTime: number = 0;
  private breathTime: number = 0;
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(config: LibrarianAvatar) {
    this.avatarConfig = config;
    this.group = new THREE.Group();
    this.group.name = 'librarian_avatar_character';
    this.buildModel();
  }

  public updateConfig(newConfig: LibrarianAvatar) {
    this.avatarConfig = newConfig;
    // Clear and rebuild
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.buildModel();
  }

  private buildModel() {
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.avatarConfig.skinTone),
      roughness: 0.6,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.avatarConfig.hairColor),
      roughness: 0.7,
    });

    const outfitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.avatarConfig.outfitColor),
      roughness: 0.65,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.avatarConfig.outfitTrimColor),
      roughness: 0.5,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
    });

    // 1. Torso / Upper Body (Pivot around hips)
    const torsoH = 0.55;
    const torsoW = 0.42;
    const torsoD = 0.28;
    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    this.bodyMesh = new THREE.Mesh(torsoGeo, outfitMat);
    this.bodyMesh.position.y = 0.85;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Collar / Cardigan Trim Lapels
    const lapelGeo = new THREE.BoxGeometry(0.12, 0.45, 0.04);
    const leftLapel = new THREE.Mesh(lapelGeo, trimMat);
    leftLapel.position.set(-0.1, 0, 0.13);
    this.bodyMesh.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, trimMat);
    rightLapel.position.set(0.1, 0, 0.13);
    this.bodyMesh.add(rightLapel);

    // 2. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.42, 0);

    const headGeo = new THREE.SphereGeometry(0.2, 16, 14);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.scale.set(1.0, 1.1, 1.0);
    head.castShadow = true;
    this.headGroup.add(head);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.07, 0.02, 0.18);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.07, 0.02, 0.18);
    this.headGroup.add(rightEye);

    // Eyewear
    this.eyewearGroup = new THREE.Group();
    this.headGroup.add(this.eyewearGroup);
    this.buildEyewear(brassMat);

    // Hairstyle
    this.hairGroup = new THREE.Group();
    this.headGroup.add(this.hairGroup);
    this.buildHair(hairMat, outfitMat);

    this.bodyMesh.add(this.headGroup);

    // 3. Arms
    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.46, 10);

    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.26, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, outfitMat);
    leftArmMesh.position.y = -0.22;
    this.leftArmGroup.add(leftArmMesh);
    // Left hand
    const handGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.45;
    this.leftArmGroup.add(leftHand);
    this.bodyMesh.add(this.leftArmGroup);

    // Right Arm (Holds accessory)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.26, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, outfitMat);
    rightArmMesh.position.y = -0.22;
    this.rightArmGroup.add(rightArmMesh);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.45;
    this.rightArmGroup.add(rightHand);

    // Accessory in hand
    this.accessoryGroup = new THREE.Group();
    this.accessoryGroup.position.set(0, -0.48, 0.1);
    this.rightArmGroup.add(this.accessoryGroup);
    this.buildAccessory(brassMat);

    // Elbow tilt forward for natural pose
    this.rightArmGroup.rotation.x = -Math.PI / 6;

    this.bodyMesh.add(this.rightArmGroup);

    // 4. Legs
    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.58, 10);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 }); // Trousers
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 }); // Oxford shoes

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.12, 0.58, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, legMat);
    leftLegMesh.position.y = -0.26;
    this.leftLegGroup.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), shoeMat);
    leftShoe.position.set(0, -0.54, 0.03);
    this.leftLegGroup.add(leftShoe);
    this.group.add(this.leftLegGroup);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.12, 0.58, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, legMat);
    rightLegMesh.position.y = -0.26;
    this.rightLegGroup.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), shoeMat);
    rightShoe.position.set(0, -0.54, 0.03);
    this.rightLegGroup.add(rightShoe);
    this.group.add(this.rightLegGroup);

    // Cast contact shadow plane under feet
    const shadowGeo = new THREE.CircleGeometry(0.35, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1c1917,
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.group.add(shadow);
  }

  private buildHair(hairMat: THREE.Material, hatMat: THREE.Material) {
    const style = this.avatarConfig.hairstyle;

    // Base scalp cover
    const capGeo = new THREE.SphereGeometry(0.21, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const cap = new THREE.Mesh(capGeo, hairMat);
    this.hairGroup.add(cap);

    if (style === 'classic_bun') {
      // Top librarian bun
      const bunGeo = new THREE.SphereGeometry(0.12, 12, 10);
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(0, 0.22, -0.1);
      this.hairGroup.add(bun);

      // Wooden hair pin / chopstick
      const pinGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.32, 6);
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.rotation.z = Math.PI / 3;
      pin.position.set(0, 0.24, -0.1);
      this.hairGroup.add(pin);
    } else if (style === 'scholar_beret') {
      // French scholar beret
      const beretGeo = new THREE.CylinderGeometry(0.28, 0.16, 0.1, 16);
      const beret = new THREE.Mesh(beretGeo, hatMat);
      beret.position.set(0.04, 0.22, 0.02);
      beret.rotation.z = -0.2;
      this.hairGroup.add(beret);
    } else if (style === 'messy_curls') {
      // Multiple curl clumps
      for (let i = 0; i < 7; i++) {
        const curlGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const curl = new THREE.Mesh(curlGeo, hairMat);
        const a = (i / 7) * Math.PI * 2;
        curl.position.set(Math.cos(a) * 0.16, 0.15 + (i % 2) * 0.05, Math.sin(a) * 0.16);
        this.hairGroup.add(curl);
      }
    } else if (style === 'wizard_hat') {
      // Whimsical pointed hat
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 16), hatMat);
      brim.position.set(0, 0.18, 0);
      this.hairGroup.add(brim);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16), hatMat);
      cone.position.set(0, 0.42, 0);
      cone.rotation.z = -0.15;
      this.hairGroup.add(cone);
    } else if (style === 'headphones') {
      // Modern cozy reader headphones
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 16, Math.PI), hatMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.08, 0);
      this.hairGroup.add(band);

      [-0.22, 0.22].forEach((x) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), hatMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(x, 0.05, 0);
        this.hairGroup.add(cup);
      });
    }
  }

  private buildEyewear(metalMat: THREE.Material) {
    const style = this.avatarConfig.eyewear;
    if (style === 'none') return;

    const frameMat = style === 'tortoise_shell'
      ? new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3 })
      : metalMat;

    // Two rims
    const rimGeo = new THREE.TorusGeometry(0.045, 0.007, 6, 16);
    const leftRim = new THREE.Mesh(rimGeo, frameMat);
    leftRim.position.set(-0.07, 0.02, 0.2);
    this.eyewearGroup.add(leftRim);

    const rightRim = new THREE.Mesh(rimGeo, frameMat);
    rightRim.position.set(0.07, 0.02, 0.2);
    this.eyewearGroup.add(rightRim);

    // Bridge
    const bridgeGeo = new THREE.BoxGeometry(0.05, 0.007, 0.007);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.set(0, 0.02, 0.2);
    this.eyewearGroup.add(bridge);
  }

  private buildAccessory(brassMat: THREE.Material) {
    const item = this.avatarConfig.accessory;

    if (item === 'cuppa_tea') {
      // Ceramic teacup with tea
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.04, 0.09, 12),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.2 })
      );
      this.accessoryGroup.add(cup);

      // Steam wisps (small glowing sphere)
      const steam = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
      );
      steam.position.y = 0.08;
      this.accessoryGroup.add(steam);
    } else if (item === 'feather_quill') {
      const quill = new THREE.Mesh(
        new THREE.ConeGeometry(0.02, 0.35, 6),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
      );
      quill.rotation.z = Math.PI / 4;
      this.accessoryGroup.add(quill);
    } else if (item === 'brass_lantern') {
      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8),
        brassMat
      );
      this.accessoryGroup.add(lantern);

      const glow = new THREE.PointLight(0xfde047, 0.8, 1.5);
      glow.position.y = 0;
      this.accessoryGroup.add(glow);
    } else if (item === 'vintage_tome') {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.26),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
      );
      this.accessoryGroup.add(book);
    }
  }

  public setDestination(target: THREE.Vector3) {
    this.targetPosition.copy(target);
    this.isWalking = true;
  }

  public update(dt: number) {
    this.breathTime += dt;

    // Subtle breathing motion
    const breath = Math.sin(this.breathTime * 2.5) * 0.015;
    this.bodyMesh.position.y = 0.85 + breath;

    // Movement towards destination
    const dist = this.group.position.distanceTo(this.targetPosition);
    if (dist > 0.1) {
      this.isWalking = true;
      this.walkTime += dt * 8;

      // Look at target smoothly
      const dir = this.targetPosition.clone().sub(this.group.position).normalize();
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 8, dt);

      // Walk step
      const stepDist = Math.min(dist, 2.2 * dt);
      this.group.position.addScaledVector(dir, stepDist);

      // Leg swing
      const swing = Math.sin(this.walkTime) * 0.5;
      this.leftLegGroup.rotation.x = swing;
      this.rightLegGroup.rotation.x = -swing;
      this.leftArmGroup.rotation.x = -swing * 0.6;
    } else {
      if (this.isWalking) {
        this.isWalking = false;
        this.leftLegGroup.rotation.x = 0;
        this.rightLegGroup.rotation.x = 0;
        this.leftArmGroup.rotation.x = 0;
      }
    }
  }
}
