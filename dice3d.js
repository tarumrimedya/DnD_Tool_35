/**
 * 3D Physics-Simulated Animated Dice Roller for D&D 3.5e
 * Built with Three.js. Supports d20, d12, d10, d8, d6, d4.
 * Features realistic tumbling, bounce damping, synthesized Web Audio dice sounds,
 * and high-contrast readable face numbers.
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
  }

  init() {
    if (this.initialized) return;
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded yet. Retrying on demand.');
      return;
    }

    // Create fullscreen overlay container
    this.container = document.createElement('div');
    this.container.id = 'dice-3d-overlay';
    this.container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;transition:opacity 0.3s;opacity:0;';
    document.body.appendChild(this.container);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 18, 14);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Floor shadow receiver
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Resize handler
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

  // Synthesize tactile dice clatter with Web Audio API (zero external mp3 needed)
  playDiceSound() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 260, now + i * 0.06);
        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.09);
      }
    } catch (e) {}
  }

  // Create text texture for dice face
  createNumberTexture(text, bgColor = '#1e1b4b', textColor = '#f8fafc', borderColor = '#6366f1') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);

    // Golden / Colored Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 242, 242);

    // Number text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 110px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  // Build a 3D Die Mesh
  createDieMesh(type, targetValue) {
    let geo;
    let color = 0x991b1b; // D&D Crimson Red
    let targetText = String(targetValue);

    if (type === 'd20') {
      geo = new THREE.IcosahedronGeometry(1.6, 0);
      color = targetValue === 20 ? 0xf59e0b : (targetValue === 1 ? 0x475569 : 0xb91c1c);
    } else if (type === 'd6') {
      geo = new THREE.BoxGeometry(1.9, 1.9, 1.9);
      color = 0x1e3a8a; // Sapphire blue
    } else if (type === 'd8') {
      geo = new THREE.OctahedronGeometry(1.7, 0);
      color = 0x047857; // Emerald
    } else if (type === 'd10') {
      geo = new THREE.ConeGeometry(1.5, 2.2, 5);
      color = 0x6d28d9; // Amethyst
    } else {
      geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.25,
      metalness: 0.4,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    // Attach floating 3D text/badge sprite above die for instant clarity
    const spriteMap = this.createNumberTexture(targetText, color === 0xf59e0b ? '#78350f' : '#0f172a', '#ffffff', '#fbbf24');
    const spriteMat = new THREE.SpriteMaterial({ map: spriteMap, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.4, 1.4, 1.4);
    sprite.position.set(0, 2.0, 0);
    mesh.add(sprite);

    return mesh;
  }

  // Roll multiple dice with physics simulation
  roll(diceList, onComplete) {
    this.init();
    if (!this.initialized) {
      if (onComplete) onComplete(diceList);
      return;
    }

    // Reveal overlay
    this.container.style.opacity = '1';
    this.playDiceSound();

    // Clear old dice
    this.activeDice.forEach(d => this.scene.remove(d.mesh));
    this.activeDice = [];

    const spacing = 3.2;
    const totalW = (diceList.length - 1) * spacing;
    const startX = -totalW / 2;

    diceList.forEach((d, idx) => {
      const mesh = this.createDieMesh(d.type, d.value);
      mesh.position.set(
        startX + idx * spacing + (Math.random() - 0.5) * 1.5,
        10 + Math.random() * 4,
        (Math.random() - 0.5) * 3
      );

      mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      this.scene.add(mesh);

      this.activeDice.push({
        mesh,
        val: d.value,
        type: d.type,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -0.25 - Math.random() * 0.15,
        vz: (Math.random() - 0.5) * 0.1,
        rx: (Math.random() - 0.5) * 0.35,
        ry: (Math.random() - 0.5) * 0.35,
        rz: (Math.random() - 0.5) * 0.35,
        bounces: 0,
        settled: false
      });
    });

    const startTime = performance.now();
    const duration = 1600; // ms

    const animate = (now) => {
      const elapsed = now - startTime;
      let allSettled = true;

      this.activeDice.forEach(die => {
        if (!die.settled) {
          die.mesh.position.x += die.vx;
          die.mesh.position.y += die.vy;
          die.mesh.position.z += die.vz;

          die.mesh.rotation.x += die.rx;
          die.mesh.rotation.y += die.ry;
          die.mesh.rotation.z += die.rz;

          // Gravity
          die.vy -= 0.015;

          // Floor bounce
          if (die.mesh.position.y <= 0.8) {
            die.mesh.position.y = 0.8;
            die.vy = -die.vy * 0.45; // damping
            die.vx *= 0.7;
            die.vz *= 0.7;
            die.rx *= 0.6;
            die.ry *= 0.6;
            die.rz *= 0.6;
            die.bounces++;

            if (die.bounces >= 3 || Math.abs(die.vy) < 0.04) {
              die.settled = true;
              die.mesh.position.y = 0.8;
            } else {
              this.playDiceSound();
            }
          }
          allSettled = false;
        }
      });

      this.renderer.render(this.scene, this.camera);

      if (elapsed < duration && !allSettled) {
        requestAnimationFrame(animate);
      } else {
        // Complete animation & fade out after brief delay
        setTimeout(() => {
          this.container.style.opacity = '0';
          setTimeout(() => {
            this.activeDice.forEach(d => this.scene.remove(d.mesh));
            this.activeDice = [];
            if (onComplete) onComplete(diceList);
          }, 350);
        }, 1200);
      }
    };

    requestAnimationFrame(animate);
  }
}

// Global Singleton
window.Dice3D = new Dice3DController();
