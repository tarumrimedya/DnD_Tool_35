/**
 * Ultra-Realistic 3D Physics-Simulated Animated Dice Roller for D&D 3.5e
 * Features true polyhedral geometries (d4, d6, d8, d10, d12, d20, d100),
 * deep crimson red resin materials with glossy specular glints,
 * numbers painted directly on all die faces (no floating billboards),
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
  }

  init() {
    if (this.initialized) return;
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded yet.');
      return;
    }

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
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Warm Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Main Overhead Directional Light (Key Light casting realistic shadows)
    const keyLight = new THREE.DirectionalLight(0xfff7ee, 1.5);
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

    // Fill Point Light (Produces brilliant glossy specular glints on facets)
    const fillLight = new THREE.PointLight(0xffe4d6, 0.9, 40);
    fillLight.position.set(-8, 12, 6);
    this.scene.add(fillLight);

    // Floor Shadow Receiver (Invisible tabletop plane receiving dark contact shadows)
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.38 });
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

  // Generate crisp 256x256 transparent decal texture with numbers engraved directly on faces (NO round discs/circles)
  createFaceTexture(numberText, sides) {
    const key = `${sides}_${numberText}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const num = parseInt(numberText) || 0;
    const isD20Nat20 = (sides === 20 && num === 20);
    const isD20Nat1 = (sides === 20 && num === 1);

    // 100% transparent canvas background - NO circular fill, NO discs, pure flat facet
    ctx.clearRect(0, 0, 256, 256);

    ctx.save();
    let displayText = String(numberText);
    // Add dot to distinguish 6. and 9. on d20 / d12 / d10 / d8 / d6
    if ((displayText === '6' || displayText === '9') && sides > 4) {
      displayText = displayText + '.';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = displayText.length > 2 ? 88 : (displayText.length > 1 ? 108 : 128);
    ctx.font = `900 ${fontSize}px "Segoe UI", Arial, sans-serif`;

    // 1. Dark engraving cavity contour / shadow for 3D depth
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(displayText, 128, 128);

    // 2. High-contrast crisp numeral fill
    if (isD20Nat20) {
      ctx.fillStyle = '#fde047'; // Radiant gold for Nat 20
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 12;
    } else if (isD20Nat1) {
      ctx.fillStyle = '#fca5a5'; // Soft rose for Nat 1
    } else {
      ctx.fillStyle = '#ffffff'; // Pure crisp white engraved numeral
    }

    ctx.fillText(displayText, 128, 128);
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

    // Authentic D&D d10 pentagonal trapezohedron proportions
    const H = radius * 1.45;  // Apex height
    const R = radius * 1.30;  // Equator radius
    const h = radius * 0.22;  // Equator zigzag offset

    const topPole = new THREE.Vector3(0, H, 0);
    const botPole = new THREE.Vector3(0, -H, 0);

    // 5 Upper vertices at +h (angles 0°, 72°, 144°, 216°, 288°)
    const U = [];
    // 5 Lower vertices at -h (angles 36°, 108°, 180°, 252°, 324°)
    const L = [];

    for (let i = 0; i < 5; i++) {
      const aU = (i * 2 * Math.PI) / 5;
      U.push(new THREE.Vector3(Math.cos(aU) * R, h, Math.sin(aU) * R));

      const aL = ((i + 0.5) * 2 * Math.PI) / 5;
      L.push(new THREE.Vector3(Math.cos(aL) * R, -h, Math.sin(aL) * R));
    }

    // Build 5 Upper Kites and 5 Lower Kites (Total 10 Kites = 20 Triangles)
    for (let i = 0; i < 5; i++) {
      const uCurr = U[i];
      const uNext = U[(i + 1) % 5];
      const lCurr = L[i];
      const lNext = L[(i + 1) % 5];

      // 1. Upper Kite i (meeting at topPole, bounded by uCurr, lCurr, uNext)
      // Both triangles wound CCW seen from outside:
      // Tri 1: topPole, lCurr, uCurr
      vertices.push(
        topPole.x, topPole.y, topPole.z,
        lCurr.x, lCurr.y, lCurr.z,
        uCurr.x, uCurr.y, uCurr.z
      );
      // Tri 2: topPole, uNext, lCurr
      vertices.push(
        topPole.x, topPole.y, topPole.z,
        uNext.x, uNext.y, uNext.z,
        lCurr.x, lCurr.y, lCurr.z
      );

      const upperCenter = new THREE.Vector3()
        .add(topPole).add(uCurr).add(lCurr).add(uNext)
        .multiplyScalar(0.25);

      // Transverse (uNext - uCurr) x Longitudinal (lCurr - topPole)
      const uTrans = new THREE.Vector3().subVectors(uNext, uCurr);
      const uLong = new THREE.Vector3().subVectors(lCurr, topPole);
      const upperNormal = new THREE.Vector3().crossVectors(uTrans, uLong).normalize();
      if (upperNormal.dot(upperCenter) < 0) {
        upperNormal.negate();
      }

      const uTopVec = new THREE.Vector3().subVectors(topPole, upperCenter).normalize();

      // 2. Lower Kite i (meeting at botPole, bounded by lNext, uNext, lCurr)
      // Both triangles wound CCW seen from outside:
      // Tri 1: botPole, uNext, lNext
      vertices.push(
        botPole.x, botPole.y, botPole.z,
        uNext.x, uNext.y, uNext.z,
        lNext.x, lNext.y, lNext.z
      );
      // Tri 2: botPole, lCurr, uNext
      vertices.push(
        botPole.x, botPole.y, botPole.z,
        lCurr.x, lCurr.y, lCurr.z,
        uNext.x, uNext.y, uNext.z
      );

      const lowerCenter = new THREE.Vector3()
        .add(botPole).add(lCurr).add(uNext).add(lNext)
        .multiplyScalar(0.25);

      // Longitudinal (uNext - botPole) x Transverse (lNext - lCurr)
      const lLong = new THREE.Vector3().subVectors(uNext, botPole);
      const lTrans = new THREE.Vector3().subVectors(lNext, lCurr);
      const lowerNormal = new THREE.Vector3().crossVectors(lLong, lTrans).normalize();
      if (lowerNormal.dot(lowerCenter) < 0) {
        lowerNormal.negate();
      }

      const lTopVec = new THREE.Vector3().subVectors(uNext, lowerCenter).normalize();

      // Add to customFaces (alternating upper and lower)
      customFaces.push({ center: upperCenter, normal: upperNormal, topVec: uTopVec });
      customFaces.push({ center: lowerCenter, normal: lowerNormal, topVec: lTopVec });
    }

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

      // Check if coplanar to existing face (for Box / Dodecahedron)
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

  // Build a true 3D polyhedral die with engraved numbers on all faces
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
    } else if (type === 'd10' || type === 'd100') {
      sides = 10;
      radius = 1.5;
      geo = this.createD10Geometry(radius);
      decalScale = 0.60;
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

    // Deep Crimson Resin Material with sharp crystalline flat facet shading
    const dieMat = new THREE.MeshStandardMaterial({
      color: 0x851316,
      roughness: 0.16,
      metalness: 0.08,
      flatShading: true,
      side: THREE.DoubleSide
    });

    const dieMesh = new THREE.Mesh(geo, dieMat);
    dieMesh.castShadow = true;
    dieMesh.receiveShadow = false;

    // Extract face planes & attach transparent numeral decals directly onto flat facets
    const faces = this.extractFaces(geo);
    const numFaces = Math.min(faces.length, sides);

    // Determine target face index (place targetValue on face 0)
    const faceValues = [];
    if (type === 'd100') {
      const tens = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90'];
      const targetStr = (targetValue === 100 || targetValue === 0) ? '00' : String(targetValue).padStart(2, '0');
      tens.forEach(t => {
        if (t !== targetStr) faceValues.push(t);
      });
      faceValues.sort(() => Math.random() - 0.5);
      faceValues.unshift(targetStr);
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

    // Pure flat plane geometry - alphaTest completely clips everything outside the engraved number
    const decalGeo = new THREE.PlaneGeometry(radius * decalScale, radius * decalScale);

    for (let i = 0; i < numFaces; i++) {
      const face = faces[i];
      const val = faceValues[i] || (i + 1);
      const texture = this.createFaceTexture(val, sides);

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
      
      // Calculate clean orientation: decal normal = face.normal, with upright projection
      const normal = face.normal.clone().normalize();
      let up = face.topVec ? face.topVec.clone().normalize() : new THREE.Vector3(0, 1, 0);
      if (Math.abs(normal.dot(up)) > 0.92) {
        up = new THREE.Vector3(0, 0, 1);
      }
      const right = new THREE.Vector3().crossVectors(up, normal).normalize();
      const faceUp = new THREE.Vector3().crossVectors(normal, right).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(right, faceUp, normal);
      decalMesh.quaternion.setFromRotationMatrix(rotMatrix);

      // Offset outward along facet normal to prevent z-fighting
      decalMesh.position.copy(face.center).addScaledVector(face.normal, 0.020);
      dieMesh.add(decalMesh);
    }

    // Target normal on face 0
    const targetNormal = faces[0] ? faces[0].normal.clone() : new THREE.Vector3(0, 1, 0);

    return {
      mesh: dieMesh,
      radius,
      sides,
      targetValue,
      targetNormal
    };
  }

  // Roll dice list with realistic 3D tumbling physics and camera alignment
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

    // Calculate initial spread layout
    const count = diceList.length;
    const spacing = Math.min(3.6, 14 / Math.max(1, count));
    const totalW = (count - 1) * spacing;
    const startX = -totalW / 2;

    diceList.forEach((d, idx) => {
      const dieData = this.createDieMesh(d.type, d.value);
      const mesh = dieData.mesh;

      // Spawn height with random stagger
      mesh.position.set(
        startX + idx * spacing + (Math.random() - 0.5) * 1.2,
        9.5 + Math.random() * 3.5,
        (Math.random() - 0.5) * 2.5
      );

      // Fast initial random tumble rotation
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      this.scene.add(mesh);

      // Target world normal orientation facing directly towards camera (view vector)
      const cameraDir = new THREE.Vector3(0, 0.84, 0.54).normalize();
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(dieData.targetNormal, cameraDir);

      this.activeDice.push({
        ...dieData,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.32 - Math.random() * 0.12,
        vz: (Math.random() - 0.5) * 0.12,
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

      this.activeDice.forEach(die => {
        if (!die.settled) {
          // Physics step
          die.mesh.position.x += die.vx;
          die.mesh.position.y += die.vy;
          die.mesh.position.z += die.vz;

          // Free tumbling rotation
          die.mesh.rotation.x += die.rx;
          die.mesh.rotation.y += die.ry;
          die.mesh.rotation.z += die.rz;

          // Gravity
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
            }
          }
          allSettled = false;
        } else {
          // Smooth Slerp alignment so the target value faces player perfectly
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
        // Ensure final alignment
        this.activeDice.forEach(die => {
          die.mesh.position.y = die.floorY;
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
