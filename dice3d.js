/**
 * Ultra-Realistic 3D Physics-Simulated Animated Dice Roller for D&D 3.5e
 * Features true polyhedral geometries (d4, d6, d8, d10, d12, d20, d100),
 * dark smoky obsidian / onyx crystal materials with high-gloss specular reflections,
 * radiant molten gold neon glowing beveled edges & corner vertices,
 * gold-foil outlined serif Roman numerals (Cinzel style) with dark obsidian cores,
 * soft tabletop contact shadows, dynamic camera alignment, and rich acoustic clatter.
 */

class Dice3DController {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.activeDice = [];
    this.isRolling = false;
    this.audioCtx = null;
    this.initialized = false;
    this.textureCache = new Map();
    this.onFinishCallback = null;
    this.animationFrameId = null;

    // Shared unit geometries for glowing edge rendering
    this.unitCylGeo = null;
    this.unitSphereGeo = null;

    let savedColor = '#851316';
    try {
      if (typeof localStorage !== 'undefined') {
        savedColor = localStorage.getItem('dnd_dice_color') || '#851316';
      }
    } catch (e) {}
    this.diceColor = savedColor;
  }

  setDiceColor(color) {
    if (!color) return;
    this.diceColor = color;
    this.textureCache.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dnd_dice_color', color);
      }
    } catch (e) {}
  }

  getDiceColor() {
    return this.diceColor || '#851316';
  }

  init() {
    if (this.initialized) return;
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded yet.');
      return;
    }

    // Shared edge geometries
    this.unitCylGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    this.unitSphereGeo = new THREE.SphereGeometry(1, 8, 8);

    // Fullscreen transparent overlay
    this.container = document.createElement('div');
    this.container.id = 'dice-3d-overlay';
    this.container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;transition:opacity 0.25s ease-out;opacity:0;';
    
    // Allow clicking anywhere to skip/dismiss immediately
    this.container.addEventListener('click', () => {
      this.dismissImmediately();
    });

    document.body.appendChild(this.container);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene & Perspective Camera (Looking down at ~50° tabletop angle)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 16, 13);
    this.camera.lookAt(0, 0.4, 0);

    // Renderer with soft PCF shadow maps & high pixel ratio
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);

    // Ambient Light (Dark moody obsidian contrast)
    const ambientLight = new THREE.AmbientLight(0x28201a, 1.25);
    this.scene.add(ambientLight);

    // Main Overhead Directional Light (Key Light casting realistic shadows & glints)
    const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.6);
    keyLight.position.set(9, 24, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -15;
    keyLight.shadow.camera.right = 15;
    keyLight.shadow.camera.top = 15;
    keyLight.shadow.camera.bottom = -15;
    keyLight.shadow.bias = -0.0008;
    keyLight.shadow.radius = 3;
    this.scene.add(keyLight);

    // Rim Backlight (Casts intense glowing golden rim lighting on bevels)
    const rimLight = new THREE.DirectionalLight(0xff8c00, 1.8);
    rimLight.position.set(0, 8, -14);
    this.scene.add(rimLight);

    // Fill Point Light (Produces subtle specular highlights)
    const fillLight = new THREE.PointLight(0x7c8ba1, 0.7, 40);
    fillLight.position.set(-8, 12, 6);
    this.scene.add(fillLight);

    // Floor Shadow Receiver (Invisible tabletop plane receiving dark contact shadows)
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.52 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Window Resize Handler
    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.initialized = true;
  }

  // Realistic Acoustic Dice Clatter Synthesizer (Zero external audio files required)
  playDiceSound(volume = 1.0) {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const clicks = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < clicks; i++) {
        const t = now + i * 0.045;
        // High frequency plastic impact click
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 450, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

        gain.gain.setValueAtTime(0.18 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.07);

        // Low body thud resonance
        const thud = this.audioCtx.createOscillator();
        const thudGain = this.audioCtx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(140 + Math.random() * 60, t);
        thudGain.gain.setValueAtTime(0.22 * volume, t);
        thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        thud.connect(thudGain);
        thudGain.connect(this.audioCtx.destination);
        thud.start(t);
        thud.stop(t + 0.06);
      }
    } catch (e) {}
  }

  // Generate crisp 512x512 decal texture: Gold-foil serif numerals with obsidian core
  createFaceTexture(numberText, sides) {
    const key = `${sides}_${numberText}_${this.diceColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const num = parseInt(numberText) || 0;
    const isD20Nat20 = (sides === 20 && num === 20) || (sides === 100 && num === 100);
    const isD20Nat1 = (sides === 20 && num === 1) || (sides === 100 && num === 1);

    ctx.clearRect(0, 0, 512, 512);

    let displayText = String(numberText);
    const hasDotUnderline = ((displayText === '6' || displayText === '9') && sides > 4);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = 256;
    const cy = 256;

    // Font sizing: Serif Roman font (Cinzel / Palatino / Georgia)
    const len = displayText.length;
    const fontSize = len >= 3 ? 150 : (len === 2 ? 210 : 250);
    ctx.font = `900 ${fontSize}px "Cinzel", "Palatino Linotype", "Book Antiqua", "Georgia", serif`;

    // 1. Warm radiant drop shadow / ambient glow
    if (isD20Nat20) {
      ctx.shadowColor = 'rgba(250, 204, 21, 0.95)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else if (isD20Nat1) {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.shadowColor = 'rgba(245, 158, 11, 0.65)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    // 2. Outer Bold Golden Foil Bevel Stroke (Dual Gold Gradient)
    const goldGrad = ctx.createLinearGradient(120, 80, 392, 432);
    if (isD20Nat20) {
      goldGrad.addColorStop(0, '#ffffff');
      goldGrad.addColorStop(0.2, '#fef08a');
      goldGrad.addColorStop(0.5, '#f59e0b');
      goldGrad.addColorStop(0.85, '#d97706');
      goldGrad.addColorStop(1, '#92400e');
    } else if (isD20Nat1) {
      goldGrad.addColorStop(0, '#fca5a5');
      goldGrad.addColorStop(0.4, '#dc2626');
      goldGrad.addColorStop(1, '#7f1d1d');
    } else {
      goldGrad.addColorStop(0, '#fffbeb'); // Specular highlight
      goldGrad.addColorStop(0.25, '#fef08a'); // Warm bright gold
      goldGrad.addColorStop(0.55, '#f59e0b'); // Amber gold
      goldGrad.addColorStop(0.85, '#b45309'); // Burnished bronze
      goldGrad.addColorStop(1, '#451a03'); // Deep lowlight
    }

    ctx.lineWidth = Math.max(12, fontSize * 0.085);
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 3;
    ctx.strokeStyle = goldGrad;
    ctx.strokeText(displayText, cx, cy);

    // 3. Inner Core Fill
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    if (isD20Nat20) {
      // Radiant incandescent gold core
      const coreGrad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, 140);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.35, '#fef08a');
      coreGrad.addColorStop(0.8, '#f59e0b');
      coreGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = coreGrad;
      ctx.fillText(displayText, cx, cy);
    } else if (isD20Nat1) {
      // Crimson obsidian core
      ctx.fillStyle = '#220808';
      ctx.fillText(displayText, cx, cy);
    } else {
      // Deep obsidian crystal core matching the photo!
      ctx.fillStyle = '#161311';
      ctx.fillText(displayText, cx, cy);
    }

    // 4. Delicate inner metallic hairline glint
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = isD20Nat20 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(254, 243, 199, 0.65)';
    ctx.strokeText(displayText, cx, cy);

    // 5. Elegant dot underline for 6 and 9
    if (hasDotUnderline) {
      ctx.beginPath();
      ctx.arc(cx, cy + fontSize * 0.58, fontSize * 0.075, 0, Math.PI * 2);
      ctx.fillStyle = goldGrad;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this.textureCache.set(key, texture);
    return texture;
  }

  // Custom 10-sided pentagonal trapezohedron geometry for true D&D d10
  createD10Geometry(radius) {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const customFaces = [];

    const H = radius * 1.55;  // Apex height
    const R = radius * 1.30;  // Equator radius
    const cos36 = (1 + Math.sqrt(5)) / 4;
    const h = H * (1 - cos36) / (1 + cos36);  // Exact coplanar ratio ~0.105573 * H

    const topPole = new THREE.Vector3(0, H, 0);
    const botPole = new THREE.Vector3(0, -H, 0);

    const U = [];
    const L = [];

    for (let i = 0; i < 5; i++) {
      const aU = (i * 2 * Math.PI) / 5;
      U.push(new THREE.Vector3(Math.cos(aU) * R, h, Math.sin(aU) * R));

      const aL = ((i + 0.5) * 2 * Math.PI) / 5;
      L.push(new THREE.Vector3(Math.cos(aL) * R, -h, Math.sin(aL) * R));
    }

    for (let i = 0; i < 5; i++) {
      const uCurr = U[i];
      const uNext = U[(i + 1) % 5];
      const lCurr = L[i];
      const lNext = L[(i + 1) % 5];

      // Upper Kite i
      vertices.push(
        topPole.x, topPole.y, topPole.z,
        lCurr.x, lCurr.y, lCurr.z,
        uCurr.x, uCurr.y, uCurr.z
      );
      vertices.push(
        topPole.x, topPole.y, topPole.z,
        uNext.x, uNext.y, uNext.z,
        lCurr.x, lCurr.y, lCurr.z
      );

      const upperCenter = new THREE.Vector3()
        .add(topPole).add(uCurr).add(lCurr).add(uNext)
        .multiplyScalar(0.25);

      const uTrans = new THREE.Vector3().subVectors(uNext, uCurr);
      const uLong = new THREE.Vector3().subVectors(lCurr, topPole);
      const upperNormal = new THREE.Vector3().crossVectors(uTrans, uLong).normalize();
      if (upperNormal.dot(upperCenter) < 0) {
        upperNormal.negate();
      }

      const uTopVec = new THREE.Vector3().subVectors(topPole, upperCenter).normalize();

      // Lower Kite i
      vertices.push(
        botPole.x, botPole.y, botPole.z,
        uNext.x, uNext.y, uNext.z,
        lNext.x, lNext.y, lNext.z
      );
      vertices.push(
        botPole.x, botPole.y, botPole.z,
        lCurr.x, lCurr.y, lCurr.z,
        uNext.x, uNext.y, uNext.z
      );

      const lowerCenter = new THREE.Vector3()
        .add(botPole).add(lCurr).add(uNext).add(lNext)
        .multiplyScalar(0.25);

      const lLong = new THREE.Vector3().subVectors(uNext, botPole);
      const lTrans = new THREE.Vector3().subVectors(lNext, lCurr);
      const lowerNormal = new THREE.Vector3().crossVectors(lLong, lTrans).normalize();
      if (lowerNormal.dot(lowerCenter) < 0) {
        lowerNormal.negate();
      }

      const lTopVec = new THREE.Vector3().subVectors(uNext, lowerCenter).normalize();

      customFaces.push({ center: upperCenter, normal: upperNormal, topVec: uTopVec });
      customFaces.push({ center: lowerCenter, normal: lowerNormal, topVec: lTopVec });
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    geo.userData = { customFaces };
    return geo;
  }

  // Custom 100-sided geodesic multifaceted sphere geometry (Zocchihedron style)
  createD100Geometry(radius) {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const customFaces = [];

    const spherePoint = (r, theta, phi) => {
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      return new THREE.Vector3(
        r * sinT * Math.cos(phi),
        r * cosT,
        r * sinT * Math.sin(phi)
      );
    };

    // Latitude boundaries for 1 + 10 + 15 + 24 + 24 + 15 + 10 + 1 = 100 facets
    const thetas = [
      0.28,                     // θ1 (North Pole cap boundary)
      0.58,                     // θ2 (Band 1 boundary)
      0.95,                     // θ3 (Band 2 boundary)
      Math.PI / 2,              // θ4 (Equator boundary between Band 3 and Band 4)
      Math.PI - 0.95,           // θ5 (Band 4 boundary)
      Math.PI - 0.58,           // θ6 (Band 5 boundary)
      Math.PI - 0.28            // θ7 (South Pole cap boundary)
    ];

    const bandCounts = [10, 15, 24, 24, 15, 10];

    // 1. North Pole Facet (Face 0 - Prominent Flat Gem Face for Target Value)
    const C_north = new THREE.Vector3(0, radius, 0);
    const P = [];
    for (let k = 0; k < 10; k++) {
      P.push(spherePoint(radius, thetas[0], (k * 2 * Math.PI) / 10));
    }
    for (let k = 0; k < 10; k++) {
      const pCurr = P[k];
      const pNext = P[(k + 1) % 10];
      vertices.push(
        C_north.x, C_north.y, C_north.z,
        pCurr.x, pCurr.y, pCurr.z,
        pNext.x, pNext.y, pNext.z
      );
    }
    customFaces.push({
      center: C_north,
      normal: new THREE.Vector3(0, 1, 0),
      topVec: new THREE.Vector3(0, 0, 1),
      scale: 0.52
    });

    // 2. Intermediate Bands 1 to 6
    for (let b = 0; b < 6; b++) {
      const thA = thetas[b];
      const thB = thetas[b + 1];
      const N = bandCounts[b];

      for (let i = 0; i < N; i++) {
        const phi0 = (i * 2 * Math.PI) / N;
        const phi1 = ((i + 1) * 2 * Math.PI) / N;

        const V00 = spherePoint(radius, thA, phi0); // top-left
        const V10 = spherePoint(radius, thA, phi1); // top-right
        const V11 = spherePoint(radius, thB, phi1); // bottom-right
        const V01 = spherePoint(radius, thB, phi0); // bottom-left

        const center = new THREE.Vector3()
          .add(V00).add(V10).add(V11).add(V01)
          .multiplyScalar(0.25);
        const normal = center.clone().normalize();

        // Tri 1: V00, V01, V11 (CCW)
        vertices.push(
          V00.x, V00.y, V00.z,
          V01.x, V01.y, V01.z,
          V11.x, V11.y, V11.z
        );
        // Tri 2: V00, V11, V10 (CCW)
        vertices.push(
          V00.x, V00.y, V00.z,
          V11.x, V11.y, V11.z,
          V10.x, V10.y, V10.z
        );

        let topVec = new THREE.Vector3(0, 1, 0).sub(normal.clone().multiplyScalar(normal.y)).normalize();
        if (topVec.lengthSq() < 0.001) topVec = new THREE.Vector3(0, 0, 1);

        const facetScale = (b === 0) ? 0.32 : (b === 1 ? 0.28 : 0.24);
        customFaces.push({ center, normal, topVec, scale: facetScale });
      }
    }

    // 3. South Pole Facet (Face 99 - Bottom Cap)
    const C_south = new THREE.Vector3(0, -radius, 0);
    const Q = [];
    for (let k = 0; k < 10; k++) {
      Q.push(spherePoint(radius, thetas[6], (k * 2 * Math.PI) / 10));
    }
    for (let k = 0; k < 10; k++) {
      const qCurr = Q[k];
      const qNext = Q[(k + 1) % 10];
      vertices.push(
        C_south.x, C_south.y, C_south.z,
        qNext.x, qNext.y, qNext.z,
        qCurr.x, qCurr.y, qCurr.z
      );
    }
    customFaces.push({
      center: C_south,
      normal: new THREE.Vector3(0, -1, 0),
      topVec: new THREE.Vector3(0, 0, -1),
      scale: 0.42
    });

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    geo.userData = { customFaces };
    return geo;
  }

  // Extract unique coplanar faces (centers and outward unit normals)
  extractFaces(geo) {
    if (geo.userData && geo.userData.customFaces && geo.userData.customFaces.length > 0) {
      return geo.userData.customFaces;
    }

    const nonIndexed = geo.index ? geo.toNonIndexed() : geo.clone();
    const pos = nonIndexed.attributes.position.array;
    const faces = [];
    const triCount = pos.length / 9;

    for (let i = 0; i < triCount; i++) {
      const i9 = i * 9;
      const v0 = new THREE.Vector3(pos[i9], pos[i9 + 1], pos[i9 + 2]);
      const v1 = new THREE.Vector3(pos[i9 + 3], pos[i9 + 4], pos[i9 + 5]);
      const v2 = new THREE.Vector3(pos[i9 + 6], pos[i9 + 7], pos[i9 + 8]);

      const center = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3);
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      let found = false;
      for (const f of faces) {
        if (f.normal.dot(normal) > 0.92) {
          f.center.add(center).multiplyScalar(0.5);
          found = true;
          break;
        }
      }
      if (!found) {
        faces.push({ center, normal });
      }
    }
    return faces;
  }

  // Build a true 3D polyhedral die with obsidian body, glowing neon gold edges, and gold foil numerals
  createDieMesh(type, targetValue) {
    let geo;
    let sides = 20;
    let radius = 1.65;
    let decalScale = 0.58;

    if (type === 'd4') {
      sides = 4;
      radius = 1.55;
      geo = new THREE.TetrahedronGeometry(radius, 0);
      decalScale = 0.65;
    } else if (type === 'd6') {
      sides = 6;
      radius = 1.75;
      geo = new THREE.BoxGeometry(radius, radius, radius);
      decalScale = 0.75;
    } else if (type === 'd8') {
      sides = 8;
      radius = 1.6;
      geo = new THREE.OctahedronGeometry(radius, 0);
      decalScale = 0.68;
    } else if (type === 'd100') {
      sides = 100;
      radius = 1.85;
      geo = this.createD100Geometry(radius);
      decalScale = 0.52;
    } else if (type === 'd10') {
      sides = 10;
      radius = 1.5;
      geo = this.createD10Geometry(radius);
      decalScale = 0.58;
    } else if (type === 'd12') {
      sides = 12;
      radius = 1.55;
      geo = new THREE.DodecahedronGeometry(radius, 0);
      decalScale = 0.62;
    } else {
      // d20 default
      sides = 20;
      radius = 1.65;
      geo = new THREE.IcosahedronGeometry(radius, 0);
      decalScale = 0.56;
    }

    // Dark Smoky Obsidian / Polished Onyx Crystal Material
    const userColor = new THREE.Color(this.diceColor || '#851316');
    const darkObsidian = new THREE.Color(0x120f0d).lerp(userColor, 0.22);

    const dieMat = new THREE.MeshStandardMaterial({
      color: darkObsidian,
      roughness: 0.12,
      metalness: 0.35,
      flatShading: true,
      side: THREE.DoubleSide
    });

    const dieMesh = new THREE.Mesh(geo, dieMat);
    dieMesh.castShadow = true;
    dieMesh.receiveShadow = false;

    // Glowing Molten Gold Neon Edges & Vertices
    const edgeGeo = new THREE.EdgesGeometry(geo, 12);
    const posAttr = edgeGeo.attributes.position;
    const edgeCount = posAttr ? posAttr.count / 2 : 0;

    if (edgeCount > 0 && this.unitCylGeo && this.unitSphereGeo) {
      const edgeRadius = (type === 'd100') ? 0.020 : 0.034;
      const glowEdgeMat = new THREE.MeshBasicMaterial({
        color: 0xffa800,
        transparent: true,
        opacity: 0.96
      });
      const edgeMesh = new THREE.InstancedMesh(this.unitCylGeo, glowEdgeMat, edgeCount);

      const upVec = new THREE.Vector3(0, 1, 0);
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const mid = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      const mat4 = new THREE.Matrix4();
      const uniqueVerts = [];
      const vertThreshold = 0.05;

      for (let i = 0; i < edgeCount; i++) {
        p1.set(posAttr.getX(i * 2), posAttr.getY(i * 2), posAttr.getZ(i * 2));
        p2.set(posAttr.getX(i * 2 + 1), posAttr.getY(i * 2 + 1), posAttr.getZ(i * 2 + 1));

        dir.subVectors(p2, p1);
        const len = dir.length();
        mid.addVectors(p1, p2).multiplyScalar(0.5);

        quat.setFromUnitVectors(upVec, dir.clone().normalize());
        scale.set(edgeRadius, len, edgeRadius);
        mat4.compose(mid, quat, scale);
        edgeMesh.setMatrixAt(i, mat4);

        [p1, p2].forEach(p => {
          if (!uniqueVerts.some(v => v.distanceTo(p) < vertThreshold)) {
            uniqueVerts.push(p.clone());
          }
        });
      }
      edgeMesh.instanceMatrix.needsUpdate = true;
      dieMesh.add(edgeMesh);

      // Glowing corner beads at vertices
      const cornerMat = new THREE.MeshBasicMaterial({
        color: 0xffc42e,
        transparent: true,
        opacity: 0.98
      });
      const cornerMesh = new THREE.InstancedMesh(this.unitSphereGeo, cornerMat, uniqueVerts.length);
      uniqueVerts.forEach((v, idx) => {
        scale.set(edgeRadius * 1.18, edgeRadius * 1.18, edgeRadius * 1.18);
        mat4.compose(v, new THREE.Quaternion(), scale);
        cornerMesh.setMatrixAt(idx, mat4);
      });
      cornerMesh.instanceMatrix.needsUpdate = true;
      dieMesh.add(cornerMesh);

      // White-hot laser center lines
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xfffae0,
        transparent: true,
        opacity: 0.88
      });
      const lineSegments = new THREE.LineSegments(edgeGeo, lineMat);
      dieMesh.add(lineSegments);
    }

    // Inner warm amber point light radiating from within the die
    const innerGlow = new THREE.PointLight(0xff9d00, 2.2, radius * 3.8);
    dieMesh.add(innerGlow);

    // Extract face planes & attach transparent numeral decals directly onto flat facets
    const faces = this.extractFaces(geo);
    const numFaces = Math.min(faces.length, sides);

    // Determine target face index (place targetValue on face 0)
    const faceValues = [];
    if (type === 'd100') {
      for (let i = 1; i <= 100; i++) {
        if (i !== targetValue) faceValues.push(i);
      }
      faceValues.sort(() => Math.random() - 0.5);
      faceValues.unshift(targetValue);
    } else if (type === 'd10') {
      const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const targetStr = (targetValue === 10) ? '0' : String(targetValue);
      digits.forEach(d => {
        if (d !== targetStr) faceValues.push(d);
      });
      faceValues.sort(() => Math.random() - 0.5);
      faceValues.unshift(targetStr);
    } else {
      for (let i = 1; i <= sides; i++) {
        if (i !== targetValue) faceValues.push(i);
      }
      faceValues.sort(() => Math.random() - 0.5);
      faceValues.unshift(targetValue);
    }

    const maxDecals = (type === 'd100') ? Math.min(faces.length, 50) : numFaces;

    for (let i = 0; i < maxDecals; i++) {
      const face = faces[i];
      const val = faceValues[i] || (i + 1);
      const texture = this.createFaceTexture(val, sides);

      const fScale = face.scale || decalScale;
      const decalGeo = new THREE.PlaneGeometry(radius * fScale, radius * fScale);

      const decalMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
        side: THREE.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      });

      const decalMesh = new THREE.Mesh(decalGeo, decalMat);
      
      const normal = face.normal.clone().normalize();
      let up = face.topVec ? face.topVec.clone().normalize() : new THREE.Vector3(0, 1, 0);
      if (Math.abs(normal.dot(up)) > 0.92) {
        up = new THREE.Vector3(0, 0, 1);
      }
      const right = new THREE.Vector3().crossVectors(up, normal).normalize();
      const faceUp = new THREE.Vector3().crossVectors(normal, right).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(right, faceUp, normal);
      decalMesh.quaternion.setFromRotationMatrix(rotMatrix);

      decalMesh.position.copy(face.center).addScaledVector(face.normal, 0.024);
      dieMesh.add(decalMesh);
    }

    // Target face 0 coordinate frame for 100% upright camera alignment
    const f0 = faces[0];
    const normal0 = f0 ? f0.normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
    let up0 = (f0 && f0.topVec) ? f0.topVec.clone().normalize() : new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal0.dot(up0)) > 0.92) {
      up0 = new THREE.Vector3(0, 0, 1);
    }
    const right0 = new THREE.Vector3().crossVectors(up0, normal0).normalize();
    const faceUp0 = new THREE.Vector3().crossVectors(normal0, right0).normalize();

    return {
      mesh: dieMesh,
      radius,
      sides,
      targetValue,
      targetNormal: normal0,
      targetFaceUp: faceUp0,
      targetRight: right0
    };
  }

  // Calculate dual-axis orientation matrix so target face faces camera AND stands 100% upright in viewport
  computeTargetQuat(dieData, diePos) {
    const toCamera = new THREE.Vector3().subVectors(this.camera.position, diePos).normalize();
    const camScreenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).normalize();

    const zWorld = toCamera.clone();
    const xWorld = new THREE.Vector3().crossVectors(camScreenUp, zWorld).normalize();
    const yWorld = new THREE.Vector3().crossVectors(zWorld, xWorld).normalize();

    const mWorld = new THREE.Matrix4().makeBasis(xWorld, yWorld, zWorld);
    const mLocal = new THREE.Matrix4().makeBasis(dieData.targetRight, dieData.targetFaceUp, dieData.targetNormal);
    const mLocalInv = mLocal.clone().transpose();
    const mTarget = new THREE.Matrix4().multiplyMatrices(mWorld, mLocalInv);
    return new THREE.Quaternion().setFromRotationMatrix(mTarget);
  }

  getInitialSpawnPositions(count) {
    if (count <= 1) return [{ x: 0, z: 0 }];
    if (count === 2) return [{ x: -2.8, z: 0 }, { x: 2.8, z: 0 }];
    if (count === 3) return [{ x: -3.8, z: -0.4 }, { x: 0, z: 0.5 }, { x: 3.8, z: -0.4 }];
    if (count === 4) {
      return [
        { x: -2.8, z: -1.8 }, { x: 2.8, z: -1.8 },
        { x: -2.8, z: 1.8 },  { x: 2.8, z: 1.8 }
      ];
    }
    if (count === 5) {
      return [
        { x: -3.6, z: -1.8 }, { x: 0, z: -1.8 }, { x: 3.6, z: -1.8 },
        { x: -2.2, z: 1.8 },  { x: 2.2, z: 1.8 }
      ];
    }
    // 6 dice (2 rows of 3)
    return [
      { x: -3.8, z: -1.8 }, { x: 0, z: -1.8 }, { x: 3.8, z: -1.8 },
      { x: -3.8, z: 1.8 },  { x: 0, z: 1.8 },  { x: 3.8, z: 1.8 }
    ];
  }

  // Roll dice list with realistic 3D tumbling physics, inter-dice collision, and camera alignment
  roll(diceList, onComplete) {
    this.init();
    if (!this.initialized) {
      if (onComplete) onComplete(diceList);
      return;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.onFinishCallback = onComplete;
    this.isRolling = true;

    // Show container
    this.container.style.pointerEvents = 'auto';
    this.container.style.opacity = '1';
    this.playDiceSound(1.0);

    // Remove previous dice
    this.activeDice.forEach(d => this.scene.remove(d.mesh));
    this.activeDice = [];

    // Calculate well-separated initial spread layout
    const count = diceList.length;
    const spawnPositions = this.getInitialSpawnPositions(count);

    diceList.forEach((d, idx) => {
      const dieData = this.createDieMesh(d.type, d.value);
      const mesh = dieData.mesh;
      const sp = spawnPositions[idx] || { x: (idx - (count - 1) / 2) * 3.2, z: 0 };

      // Spawn height with random stagger and distinct horizontal offset
      mesh.position.set(
        sp.x + (Math.random() - 0.5) * 0.4,
        9.5 + Math.random() * 3.0,
        sp.z + (Math.random() - 0.5) * 0.4
      );

      // Fast initial random tumble rotation
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      this.scene.add(mesh);

      const targetQuat = this.computeTargetQuat(dieData, mesh.position);

      this.activeDice.push({
        ...dieData,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -0.32 - Math.random() * 0.12,
        vz: (Math.random() - 0.5) * 0.08,
        rx: (Math.random() > 0.5 ? 1 : -1) * (0.28 + Math.random() * 0.22),
        ry: (Math.random() > 0.5 ? 1 : -1) * (0.28 + Math.random() * 0.22),
        rz: (Math.random() > 0.5 ? 1 : -1) * (0.28 + Math.random() * 0.22),
        bounces: 0,
        settled: false,
        settleProgress: 0,
        targetQuat,
        floorY: dieData.radius * 0.95
      });
    });

    const startTime = performance.now();
    const maxDuration = 1450; // ms

    const animate = (now) => {
      const elapsed = now - startTime;
      let allSettled = true;

      // 1. Position & gravity update for unsettled dice
      this.activeDice.forEach(die => {
        if (!die.settled) {
          die.mesh.position.x += die.vx;
          die.mesh.position.y += die.vy;
          die.mesh.position.z += die.vz;

          die.mesh.rotation.x += die.rx;
          die.mesh.rotation.y += die.ry;
          die.mesh.rotation.z += die.rz;

          die.vy -= 0.016;

          // Floor collision bounce
          if (die.mesh.position.y <= die.floorY) {
            die.mesh.position.y = die.floorY;
            die.vy = -die.vy * 0.42; // Elastic restitution
            die.vx *= 0.72; // Horizontal friction
            die.vz *= 0.72;
            die.rx *= 0.65;
            die.ry *= 0.65;
            die.rz *= 0.65;
            die.bounces++;

            this.playDiceSound(Math.max(0.2, 1.0 - die.bounces * 0.25));

            if (die.bounces >= 3 || Math.abs(die.vy) < 0.035) {
              die.settled = true;
              die.mesh.position.y = die.floorY;
              die.targetQuat = this.computeTargetQuat(die, die.mesh.position);
            }
          }
          allSettled = false;
        }
      });

      // 2. Inter-Dice Elastic Collision & Mutual Repulsion (Prevents clipping/overlapping)
      const numDice = this.activeDice.length;
      for (let i = 0; i < numDice; i++) {
        for (let j = i + 1; j < numDice; j++) {
          const dieA = this.activeDice[i];
          const dieB = this.activeDice[j];
          const posA = dieA.mesh.position;
          const posB = dieB.mesh.position;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const dz = posB.z - posA.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          const minDist = (dieA.radius + dieB.radius) * 1.15;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            // Push apart along collision normal
            const push = overlap * 0.5;
            posA.x -= nx * push;
            posA.y -= ny * push;
            posA.z -= nz * push;
            posB.x += nx * push;
            posB.y += ny * push;
            posB.z += nz * push;

            if (posA.y < dieA.floorY) posA.y = dieA.floorY;
            if (posB.y < dieB.floorY) posB.y = dieB.floorY;

            // Velocity impulse exchange (elastic collision)
            const rvx = dieB.vx - dieA.vx;
            const rvy = dieB.vy - dieA.vy;
            const rvz = dieB.vz - dieA.vz;
            const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;

            if (velAlongNormal < 0) {
              const restitution = 0.55;
              const impulse = -(1 + restitution) * velAlongNormal * 0.5;
              dieA.vx -= impulse * nx;
              dieA.vy -= impulse * ny;
              dieA.vz -= impulse * nz;
              dieB.vx += impulse * nx;
              dieB.vy += impulse * ny;
              dieB.vz += impulse * nz;

              dieA.rx += (Math.random() - 0.5) * 0.12;
              dieA.rz += (Math.random() - 0.5) * 0.12;
              dieB.rx += (Math.random() - 0.5) * 0.12;
              dieB.rz += (Math.random() - 0.5) * 0.12;

              this.playDiceSound(0.35);
            }
          }
        }
      }

      // 3. Ground Plane Separation & Upright Alignment for Settled Dice
      for (let i = 0; i < numDice; i++) {
        for (let j = i + 1; j < numDice; j++) {
          const a = this.activeDice[i];
          const b = this.activeDice[j];
          const dx = b.mesh.position.x - a.mesh.position.x;
          const dz = b.mesh.position.z - a.mesh.position.z;
          const dSq = dx * dx + dz * dz;
          const minDist = (a.radius + b.radius) * 1.18;
          if (dSq < minDist * minDist && dSq > 0.0001) {
            const dist = Math.sqrt(dSq);
            const overlap = minDist - dist;
            const pushX = (dx / dist) * overlap * 0.5;
            const pushZ = (dz / dist) * overlap * 0.5;
            a.mesh.position.x -= pushX;
            a.mesh.position.z -= pushZ;
            b.mesh.position.x += pushX;
            b.mesh.position.z += pushZ;

            if (a.settled) a.targetQuat = this.computeTargetQuat(a, a.mesh.position);
            if (b.settled) b.targetQuat = this.computeTargetQuat(b, b.mesh.position);
          }
        }
      }

      // 4. Smooth Slerp alignment for settled dice
      this.activeDice.forEach(die => {
        if (die.settled) {
          if (die.settleProgress < 1.0) {
            die.settleProgress += 0.08;
            die.mesh.quaternion.slerp(die.targetQuat, 0.18);
            if (die.settleProgress >= 1.0) {
              die.mesh.quaternion.copy(die.targetQuat);
            }
          }
        }
      });

      this.renderer.render(this.scene, this.camera);

      if (elapsed < maxDuration || (!allSettled && elapsed < 2000)) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Ensure final separation & exact camera alignment
        for (let pass = 0; pass < 6; pass++) {
          for (let i = 0; i < numDice; i++) {
            for (let j = i + 1; j < numDice; j++) {
              const a = this.activeDice[i];
              const b = this.activeDice[j];
              const dx = b.mesh.position.x - a.mesh.position.x;
              const dz = b.mesh.position.z - a.mesh.position.z;
              const dSq = dx * dx + dz * dz;
              const minDist = (a.radius + b.radius) * 1.20;
              if (dSq < minDist * minDist && dSq > 0.0001) {
                const dist = Math.sqrt(dSq);
                const overlap = minDist - dist;
                const pushX = (dx / dist) * overlap * 0.5;
                const pushZ = (dz / dist) * overlap * 0.5;
                a.mesh.position.x -= pushX;
                a.mesh.position.z -= pushZ;
                b.mesh.position.x += pushX;
                b.mesh.position.z += pushZ;
              }
            }
          }
        }

        this.activeDice.forEach(die => {
          die.mesh.position.y = die.floorY;
          die.targetQuat = this.computeTargetQuat(die, die.mesh.position);
          die.mesh.quaternion.copy(die.targetQuat);
        });
        this.renderer.render(this.scene, this.camera);

        // Hold result on screen briefly then fade out smoothly
        setTimeout(() => {
          this.finishRoll(diceList);
        }, 850);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // Dismiss immediately when user clicks/taps screen
  dismissImmediately() {
    if (!this.isRolling) return;
    this.finishRoll(this.activeDice.map(d => ({ type: d.sides ? 'd' + d.sides : 'd20', value: d.targetValue })));
  }

  finishRoll(diceList) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRolling = false;
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';

    setTimeout(() => {
      this.activeDice.forEach(d => this.scene.remove(d.mesh));
      this.activeDice = [];
      if (this.onFinishCallback) {
        const cb = this.onFinishCallback;
        this.onFinishCallback = null;
        cb(diceList);
      }
    }, 250);
  }
}

// Global Singleton Instance
window.Dice3D = new Dice3DController();
