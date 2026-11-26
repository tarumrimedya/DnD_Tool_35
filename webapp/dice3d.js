/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — DICE3D V2 (NEXT-GEN STUDIO PBR, MATERIALS & PHYSICS)
 * ============================================================================
 * Features:
 *  - 6 Distinct Physical Materials (Obsidian, Forged Metal, Carved Wood, Arcane Crystal, Ivory Bone, Swirled Resin)
 *  - Material-Specific Procedural Internal Surface Patterns (Albedo + Bump maps)
 *  - Independent Body Color & Edge/Line Color Customization (live tinting + presets)
 *  - Material-Matched Stereo-Panned Procedural Foley Audio (Metal rings, Crystal chimes, Wood knocks, Bone clicks, Stone clacks, Resin snaps)
 *  - Procedural PMREM Studio Lightbox Environment (live clearcoat/metallic reflections)
 *  - Flawless Polyhedral Geometries for ALL 7 Dice (d4, d6, d8, d10, d12, d20, d100) with clean non-diagonal Zocchihedron edges
 *  - Sweeping Tabletop Throw, Rolling-Coupled Physics, Tray Wall Ricochets, Spring-Damped Settle & Crit/Fumble VFX
 */

(function (global) {
  'use strict';

  const DICE3D_V2_THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const DICE3D_V2_THREE_WAIT_MS = 6000;

  // 6 Distinct Physical Materials (PBR surface + pattern + weight physics + audio signature)
  const DICE_V2_MATERIALS = {
    obsidian: {
      name: 'Polished Obsidian',
      massLabel: 'Heavy · 18g',
      gravity: 0.0188,
      restitution: 0.36,
      feltFriction: 0.72,
      maxBounces: 3,
      launchSpeedScale: 0.92,
      shakeScale: 1.35,
      roughness: 0.20,
      metalness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.78,
      bumpScale: 0.028,
      edgeMetalness: 0.88,
      edgeRoughness: 0.18,
      edgeEmissiveIntensity: 0.55,
      defaultBody: '#16111c',
      defaultEdge: '#f5a623'
    },
    metal: {
      name: 'Forged Metal',
      massLabel: 'Ultra Heavy · 28g',
      gravity: 0.0225,
      restitution: 0.24,
      feltFriction: 0.64,
      maxBounces: 2,
      launchSpeedScale: 0.84,
      shakeScale: 1.85,
      roughness: 0.26,
      metalness: 0.90,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.15,
      bumpScale: 0.032,
      edgeMetalness: 0.95,
      edgeRoughness: 0.12,
      edgeEmissiveIntensity: 0.35,
      defaultBody: '#3b4252',
      defaultEdge: '#fbbf24'
    },
    wood: {
      name: 'Carved Hardwood',
      massLabel: 'Ultra Light · 3.5g',
      gravity: 0.0118,
      restitution: 0.58,
      feltFriction: 0.84,
      maxBounces: 5,
      launchSpeedScale: 1.12,
      shakeScale: 0.38,
      roughness: 0.56,
      metalness: 0.04,
      clearcoat: 0.22,
      clearcoatRoughness: 0.38,
      envMapIntensity: 0.45,
      bumpScale: 0.045,
      edgeMetalness: 0.65,
      edgeRoughness: 0.32,
      edgeEmissiveIntensity: 0.22,
      defaultBody: '#4a2c18',
      defaultEdge: '#e5b869'
    },
    crystal: {
      name: 'Arcane Crystal',
      massLabel: 'Med-Heavy · 14g',
      gravity: 0.0170,
      restitution: 0.44,
      feltFriction: 0.77,
      maxBounces: 3,
      launchSpeedScale: 0.96,
      shakeScale: 1.05,
      roughness: 0.08,
      metalness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.05,
      bumpScale: 0.022,
      edgeMetalness: 0.78,
      edgeRoughness: 0.10,
      edgeEmissiveIntensity: 0.85,
      defaultBody: '#112a54',
      defaultEdge: '#7dd3fc'
    },
    bone: {
      name: 'Ancient Ivory Bone',
      massLabel: 'Medium · 10g',
      gravity: 0.0154,
      restitution: 0.49,
      feltFriction: 0.79,
      maxBounces: 4,
      launchSpeedScale: 1.00,
      shakeScale: 0.85,
      roughness: 0.44,
      metalness: 0.02,
      clearcoat: 0.30,
      clearcoatRoughness: 0.34,
      envMapIntensity: 0.48,
      bumpScale: 0.036,
      edgeMetalness: 0.38,
      edgeRoughness: 0.45,
      edgeEmissiveIntensity: 0.15,
      defaultBody: '#d9ccb2',
      defaultEdge: '#6b2016'
    },
    resin: {
      name: 'Sharp-Edge Liquid Resin',
      massLabel: 'Light · 5g',
      gravity: 0.0128,
      restitution: 0.65,
      feltFriction: 0.87,
      maxBounces: 5,
      launchSpeedScale: 1.15,
      shakeScale: 0.50,
      roughness: 0.04,
      metalness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.45,
      bumpScale: 0.004,
      edgeMetalness: 0.72,
      edgeRoughness: 0.10,
      edgeEmissiveIntensity: 0.25,
      defaultBody: '#0c8599',
      defaultSwirl: '#072a36',
      defaultEdge: '#99f6e4',
      defaultText: '#e07a3f'
    }
  };

  // Progressive Die-Size Physics & Acoustic Mass Scale (light crisp d4 -> heavy substantial d100)
  const DICE_V2_SIZE_PROFILES = {
    d4:   { pitchScale: 1.28, thumpBoost: 0.62, thumpFreqScale: 1.26, gravityScale: 0.90, spinScale: 1.18, rollGlide: 0.84, shakeBoost: 0.55 },
    d6:   { pitchScale: 1.16, thumpBoost: 0.78, thumpFreqScale: 1.14, gravityScale: 0.95, spinScale: 1.10, rollGlide: 0.92, shakeBoost: 0.72 },
    d8:   { pitchScale: 1.08, thumpBoost: 0.88, thumpFreqScale: 1.06, gravityScale: 0.98, spinScale: 1.05, rollGlide: 0.96, shakeBoost: 0.84 },
    d10:  { pitchScale: 1.02, thumpBoost: 0.96, thumpFreqScale: 1.00, gravityScale: 1.00, spinScale: 1.00, rollGlide: 1.00, shakeBoost: 0.94 },
    d12:  { pitchScale: 0.93, thumpBoost: 1.10, thumpFreqScale: 0.92, gravityScale: 1.05, spinScale: 0.95, rollGlide: 1.04, shakeBoost: 1.10 },
    d20:  { pitchScale: 0.85, thumpBoost: 1.24, thumpFreqScale: 0.84, gravityScale: 1.10, spinScale: 0.90, rollGlide: 1.07, shakeBoost: 1.28 },
    d100: { pitchScale: 0.72, thumpBoost: 1.52, thumpFreqScale: 0.72, gravityScale: 1.22, spinScale: 0.80, rollGlide: 1.12, shakeBoost: 1.60 }
  };

  // Curated quick-pick presets combining material + bodyColor + edgeColor
  const DICE_V2_THEMES = {
    'obsidian-gold': { name: 'Obsidian Gold', material: 'obsidian', bodyColor: '#16111c', edgeColor: '#f5a623' },
    'forged-steel': { name: 'Forged Steel', material: 'metal', bodyColor: '#3b4252', edgeColor: '#fbbf24' },
    'arcane-crystal': { name: 'Arcane Crystal', material: 'crystal', bodyColor: '#112a54', edgeColor: '#7dd3fc' },
    'ebony-wood': { name: 'Carved Ebony', material: 'wood', bodyColor: '#4a2c18', edgeColor: '#e5b869' },
    'ivory-crimson': { name: 'Ivory & Crimson', material: 'bone', bodyColor: '#d9ccb2', edgeColor: '#8b1e1e' },
    'eldritch-resin': { name: 'Eldritch Resin', material: 'resin', bodyColor: '#0c3b2e', edgeColor: '#6ee7b7' }
  };

  function hexToRgb(hex) {
    const clean = String(hex || '#16111c').replace('#', '').trim();
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6);
    const num = parseInt(full, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function shiftColor(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    if (amount >= 0) {
      return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
    }
    const f = 1 + amount;
    return rgbToHex(r * f, g * f, b * f);
  }

  function mixHex(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex(
      a.r + (b.r - a.r) * t,
      a.g + (b.g - a.g) * t,
      a.b + (b.b - a.b) * t
    );
  }

  function pushOutwardTri(vertices, va, vb, vc) {
    const cx = (va.x + vb.x + vc.x) / 3;
    const cy = (va.y + vb.y + vc.y) / 3;
    const cz = (va.z + vb.z + vc.z) / 3;
    const e1x = vb.x - va.x, e1y = vb.y - va.y, e1z = vb.z - va.z;
    const e2x = vc.x - va.x, e2y = vc.y - va.y, e2z = vc.z - va.z;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    if (nx * cx + ny * cy + nz * cz < 0) {
      vertices.push(va.x, va.y, va.z, vc.x, vc.y, vc.z, vb.x, vb.y, vb.z);
    } else {
      vertices.push(va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
    }
  }

  class Dice3DV2Controller {
    constructor(options = {}) {
      this.mountEl = options.mountEl || null;
      this.autoDismiss = options.autoDismiss !== undefined ? options.autoDismiss : !options.mountEl;
      this.holdMs = options.holdMs !== undefined ? options.holdMs : 1100;
      this.soundEnabled = options.soundEnabled !== undefined ? options.soundEnabled : true;
      this.timeScale = options.timeScale || 1.0;
      this.onMetrics = typeof options.onMetrics === 'function' ? options.onMetrics : null;

      let savedMat = 'obsidian', savedBody = null, savedSwirl = null, savedEdge = null, savedText = null;
      try {
        if (typeof localStorage !== 'undefined') {
          savedMat = localStorage.getItem('dnd_dice_material') || 'obsidian';
          savedBody = localStorage.getItem('dnd_dice_color') || null;
          savedSwirl = localStorage.getItem('dnd_dice_swirl_color') || null;
          savedEdge = localStorage.getItem('dnd_dice_edge_color') || null;
          savedText = localStorage.getItem('dnd_dice_text_color') || null;
        }
      } catch (e) {}
      this.materialId = options.material || (DICE_V2_MATERIALS[savedMat] ? savedMat : 'obsidian');
      const matDef = this.getMaterialDef();
      this.bodyColor = options.bodyColor || options.diceColor || savedBody || matDef.defaultBody;
      this.swirlColor = options.swirlColor || savedSwirl || matDef.defaultSwirl || '#072a36';
      this.edgeColor = options.edgeColor || savedEdge || matDef.defaultEdge;
      this.textColor = options.textColor || savedText || matDef.defaultText || matDef.defaultEdge;

      if (options.theme && DICE_V2_THEMES[options.theme]) {
        const preset = DICE_V2_THEMES[options.theme];
        this.materialId = preset.material;
        this.bodyColor = preset.bodyColor;
        this.edgeColor = preset.edgeColor;
      }

      this.container = null;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.envMap = null;
      this.activeDice = [];
      this.vfxItems = [];
      this.isRolling = false;
      this.initialized = false;
      this.audioCtx = null;
      this.noiseBuffer = null;
      this.threePromise = null;
      this.textureCache = new Map();
      this.surfaceCache = new Map();
      this.vfxTextureCache = new Map();
      this.onFinishCallback = null;
      this.animationFrameId = null;
      this.holdTimeoutId = null;
      this.dismissTimeoutId = null;
      this.resizeObserver = null;

      this.baseCamPos = null;
      this.baseCamLook = null;
      this.shakeEnergy = 0;

      this.unitCylGeo = null;
      this.unitSphereGeo = null;
      this.sparkGeo = null;
      this.ringGeo = null;

      this.trayBounds = { minX: -6.2, maxX: 6.2, minZ: -4.2, maxZ: 4.2 };
    }

    getMaterialDef() {
      return DICE_V2_MATERIALS[this.materialId] || DICE_V2_MATERIALS.obsidian;
    }

    getConfig() {
      return {
        material: this.materialId,
        bodyColor: this.bodyColor,
        swirlColor: this.swirlColor,
        edgeColor: this.edgeColor,
        textColor: this.textColor
      };
    }

    setMaterial(materialId) {
      if (!DICE_V2_MATERIALS[materialId]) return;
      this.materialId = materialId;
      this.surfaceCache.clear();
      this.textureCache.clear();
      try { if (typeof localStorage !== 'undefined') localStorage.setItem('dnd_dice_material', materialId); } catch (e) {}
    }

    setBodyColor(hex) {
      if (!hex) return;
      this.bodyColor = hex;
      this.surfaceCache.clear();
      this.textureCache.clear();
      try { if (typeof localStorage !== 'undefined') localStorage.setItem('dnd_dice_color', hex); } catch (e) {}
    }

    setSwirlColor(hex) {
      if (!hex) return;
      this.swirlColor = hex;
      this.surfaceCache.clear();
      try { if (typeof localStorage !== 'undefined') localStorage.setItem('dnd_dice_swirl_color', hex); } catch (e) {}
    }

    setEdgeColor(hex) {
      if (!hex) return;
      this.edgeColor = hex;
      this.surfaceCache.clear();
      try { if (typeof localStorage !== 'undefined') localStorage.setItem('dnd_dice_edge_color', hex); } catch (e) {}
    }

    setTextColor(hex) {
      if (!hex) return;
      this.textColor = hex;
      this.textureCache.clear();
      try { if (typeof localStorage !== 'undefined') localStorage.setItem('dnd_dice_text_color', hex); } catch (e) {}
    }

    _isConstrainedDevice() {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) return true;
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return true;
      } catch (e) {}
      return false;
    }

    _scheduleIdleSlice(fn) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback((deadline) => {
          if (this.isRolling) return;
          if (deadline && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() < 8 && !deadline.didTimeout) {
            this._scheduleIdleSlice(fn);
            return;
          }
          try { fn(); } catch (e) {}
        });
      } else {
        setTimeout(() => {
          if (this.isRolling) return;
          try { fn(); } catch (e) {}
        }, 60);
      }
    }

    _warmUpShaders() {
      if (this._shadersWarmed || !this.initialized || this.isRolling || !this.renderer || !this.scene || !this.camera) return;
      this._shadersWarmed = true;
      let tmpMesh = null;
      try {
        this._getMaterialSurfaceMaps();
        tmpMesh = this.createDieMesh('d20', 20);
        if (!tmpMesh) return;
        tmpMesh.position.set(0, 2, 0);
        this.scene.add(tmpMesh);
        if (typeof this.renderer.compile === 'function') {
          this.renderer.compile(this.scene, this.camera);
        }
        this.renderer.render(this.scene, this.camera);
      } catch (e) {
      } finally {
        if (tmpMesh && this.scene) {
          this.scene.remove(tmpMesh);
          try {
            tmpMesh.traverse((node) => {
              if (node.geometry && typeof node.geometry.dispose === 'function') node.geometry.dispose();
              if (node.material) {
                const mats = Array.isArray(node.material) ? node.material : [node.material];
                mats.forEach((m) => { if (m && typeof m.dispose === 'function') m.dispose(); });
              }
            });
          } catch (e) {}
        }
      }
    }

    warmUp() {
      if (this.isRolling) return Promise.resolve();
      if (this.initialized) {
        if (!this._shadersWarmed && !this._isConstrainedDevice()) {
          this._scheduleIdleSlice(() => this._warmUpShaders());
        }
        return Promise.resolve();
      }
      return this.loadThree().then(ok => {
        if (!ok || this.isRolling || this._isConstrainedDevice()) return;
        this._scheduleIdleSlice(() => {
          if (!this.initialized && !this.isRolling) {
            try { this.init(); } catch (e) { return; }
          }
          if (this.initialized && !this._shadersWarmed && !this.isRolling) {
            this._scheduleIdleSlice(() => this._warmUpShaders());
          }
        });
      });
    }

    setTheme(themeId) {
      const preset = DICE_V2_THEMES[themeId];
      if (!preset) return;
      this.materialId = preset.material;
      this.bodyColor = preset.bodyColor;
      this.edgeColor = preset.edgeColor;
      this.surfaceCache.clear();
      this.textureCache.clear();
    }

    setDiceColor(color) {
      this.setBodyColor(color);
    }

    getDiceColor() {
      return this.bodyColor;
    }

    setSoundEnabled(enabled) {
      this.soundEnabled = !!enabled;
    }

    setTimeScale(scale) {
      this.timeScale = Math.max(0.15, Math.min(2.0, Number(scale) || 1.0));
    }

    setAutoDismiss(autoDismiss) {
      this.autoDismiss = !!autoDismiss;
    }

    _getViewportSize() {
      if (this.mountEl) {
        const rect = this.mountEl.getBoundingClientRect();
        return {
          width: Math.max(300, Math.floor(rect.width)),
          height: Math.max(240, Math.floor(rect.height))
        };
      }
      return { width: window.innerWidth, height: window.innerHeight };
    }

    _updateTrayBounds() {
      if (!this.camera) return;
      const aspect = this.camera.aspect || 1.5;
      const halfZ = 4.2;
      const halfX = Math.max(3.8, Math.min(8.2, halfZ * aspect * 0.92));
      this.trayBounds = { minX: -halfX, maxX: halfX, minZ: -halfZ, maxZ: halfZ };
    }

    _buildStudioEnvMap() {
      if (!THREE.PMREMGenerator) return null;
      try {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();

        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x0b0a0e);

        const keyPanel = new THREE.Mesh(
          new THREE.PlaneGeometry(7.5, 4.5),
          new THREE.MeshBasicMaterial({ color: 0xfde6c4, side: THREE.DoubleSide })
        );
        keyPanel.position.set(5.5, 11, 5.5);
        keyPanel.lookAt(0, 0, 0);
        envScene.add(keyPanel);

        const coolStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(9, 1.8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        coolStrip.position.set(-11, 5, -2);
        coolStrip.lookAt(0, 0, 0);
        envScene.add(coolStrip);

        const goldStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(11, 1.8),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
        );
        goldStrip.position.set(0, 4.5, -12);
        goldStrip.lookAt(0, 0, 0);
        envScene.add(goldStrip);

        const frontFill = new THREE.Mesh(
          new THREE.PlaneGeometry(5, 1.4),
          new THREE.MeshBasicMaterial({ color: 0x6b5e50, side: THREE.DoubleSide })
        );
        frontFill.position.set(-4, 7, 11);
        frontFill.lookAt(0, 0, 0);
        envScene.add(frontFill);

        const rt = pmrem.fromScene(envScene, 0.035);
        pmrem.dispose();
        return rt.texture;
      } catch (e) {
        return null;
      }
    }

    init() {
      if (this.initialized) return;
      if (typeof THREE === 'undefined') {
        console.warn('Dice3DV2: Three.js is not loaded yet.');
        return;
      }

      this.unitCylGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
      this.unitSphereGeo = new THREE.SphereGeometry(1, 8, 8);
      this.sparkGeo = new THREE.OctahedronGeometry(0.11, 0);
      this.ringGeo = new THREE.PlaneGeometry(1, 1);

      this.container = document.createElement('div');
      if (this.mountEl) {
        this.container.className = 'dice3d-v2-mounted';
        this.container.style.cssText = 'position:absolute;inset:0;pointer-events:auto;opacity:1;overflow:hidden;';
        this.mountEl.appendChild(this.container);
      } else {
        this.container.id = 'dice-3d-v2-overlay';
        this.container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;transition:opacity 0.28s ease-out;opacity:0;will-change:opacity;transform:translateZ(0);';
        this.container.addEventListener('click', () => this.dismissImmediately());
        document.body.appendChild(this.container);
      }

      const { width, height } = this._getViewportSize();

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      this.baseCamPos = new THREE.Vector3(0, 17.0, 12.6);
      this.baseCamLook = new THREE.Vector3(0, 0.25, 0.15);
      this.camera.position.copy(this.baseCamPos);
      this.camera.lookAt(this.baseCamLook);
      this._updateTrayBounds();

      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.container.appendChild(this.renderer.domElement);

      this.envMap = this._buildStudioEnvMap();
      if (this.envMap) this.scene.environment = this.envMap;

      const hemi = new THREE.HemisphereLight(0xfef3c7, 0x1a1423, 0.65);
      this.scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.8);
      keyLight.position.set(7.5, 22, 9.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 48;
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 14;
      keyLight.shadow.camera.bottom = -14;
      keyLight.shadow.bias = -0.0006;
      keyLight.shadow.radius = 3.5;
      this.scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xff9f2e, 1.45);
      rimLight.position.set(-4, 9, -14);
      this.scene.add(rimLight);

      const coolFill = new THREE.PointLight(0x60a5fa, 0.8, 38);
      coolFill.position.set(-10, 11, 6);
      this.scene.add(coolFill);

      const floorGeo = new THREE.PlaneGeometry(60, 60);
      const floorMat = new THREE.ShadowMaterial({ opacity: 0.56 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      this.scene.add(floor);

      const onResize = () => {
        if (!this.renderer || !this.camera) return;
        const size = this._getViewportSize();
        this.camera.aspect = size.width / size.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(size.width, size.height);
        this._updateTrayBounds();
        if (!this.isRolling) this.renderer.render(this.scene, this.camera);
      };

      if (this.mountEl && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(onResize);
        this.resizeObserver.observe(this.mountEl);
      } else {
        window.addEventListener('resize', onResize);
      }

      this.initialized = true;
    }

    // ------------------------------------------------------------------------
    // MATERIAL-MATCHED STEREO-PANNED PROCEDURAL FOLEY AUDIO ENGINE
    // ------------------------------------------------------------------------
    _ensureAudio() {
      if (!this.soundEnabled) return null;
      try {
        if (!this.audioCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return null;
          this.audioCtx = new AudioCtx();
          // Master loudness bus + transparent soft limiter so bandpass foley hits clearly without clipping
          const masterGain = this.audioCtx.createGain();
          masterGain.gain.value = 3.2;
          if (typeof this.audioCtx.createDynamicsCompressor === 'function') {
            const comp = this.audioCtx.createDynamicsCompressor();
            comp.threshold.value = -8;
            comp.knee.value = 12;
            comp.ratio.value = 6;
            comp.attack.value = 0.002;
            comp.release.value = 0.08;
            masterGain.connect(comp);
            comp.connect(this.audioCtx.destination);
          } else {
            masterGain.connect(this.audioCtx.destination);
          }
          this.masterOut = masterGain;
        }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        if (!this.noiseBuffer) {
          const sr = this.audioCtx.sampleRate;
          // 0.5s raw white-noise buffer; each impact reads from a random offset with exact ms shaping
          const len = Math.floor(sr * 0.5);
          const buf = this.audioCtx.createBuffer(1, len, sr);
          const data = buf.getChannelData(0);
          for (let i = 0; i < len; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          this.noiseBuffer = buf;
        }
        return this.audioCtx;
      } catch (e) {
        return null;
      }
    }

    _connectStereo(ctx, node, panX = 0) {
      const dest = this.masterOut || ctx.destination;
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-0.85, Math.min(0.85, panX / 6.5));
        node.connect(panner);
        panner.connect(dest);
      } else {
        node.connect(dest);
      }
    }

    _playNoiseBurst(ctx, startTime, filterType, freq, Q, gainVal, durSec, panX) {
      if (gainVal <= 0.002) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const maxOffset = Math.max(0.01, this.noiseBuffer.duration - durSec - 0.02);
      const offset = Math.random() * maxOffset;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(Math.max(40, Math.min(14000, freq)), startTime);
      if (Q) filter.Q.setValueAtTime(Q, startTime);

      // Compensate bandpass insertion loss so narrow-Q wood/bone/stone transients stay punchy
      const qComp = filterType === 'bandpass' ? Math.min(2.2, Math.sqrt(Math.max(1, Q || 1))) : 1.15;
      const peak = gainVal * qComp;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peak, startTime + 0.0012);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + durSec);

      src.connect(filter);
      filter.connect(gain);
      this._connectStereo(ctx, gain, panX);
      src.start(startTime, offset, durSec + 0.015);
    }

    playImpactSound(intensity = 0.8, panX = 0, surface = 'felt', dieType = 'd20') {
      const ctx = this._ensureAudio();
      if (!ctx || !this.noiseBuffer) return;
      try {
        const now = ctx.currentTime;
        const vol = Math.max(0.05, Math.min(1.0, intensity));
        const mat = this.materialId;
        const sz = DICE_V2_SIZE_PROFILES[dieType] || DICE_V2_SIZE_PROFILES.d20;
        const pScale = sz.pitchScale;
        const tBoost = sz.thumpBoost;
        const tFreq = sz.thumpFreqScale;
        const jitter = () => 0.88 + Math.random() * 0.24;
        const isDie = surface === 'die';
        const isWall = surface === 'wall';

        if (mat === 'metal') {
          // Forged steel: punchy metallic clack + heavy thump + bright steel overtone rings
          const sMult = (isDie ? 1.35 : (isWall ? 0.82 : 1.0)) * pScale;
          this._playNoiseBurst(ctx, now, 'bandpass', 2200 * sMult * jitter(), 2.6, 0.28 * vol, 0.014, panX);
          if (!isDie) {
            this._playNoiseBurst(ctx, now, 'lowpass', 150 * tFreq * jitter(), 0.9, Math.min(0.55, 0.34 * vol * tBoost), 0.028, panX);
          }
          const ringBoost = isDie ? 1.45 : 0.85;
          [1680, 2840, 4120].forEach((rf, idx) => {
            const rOsc = ctx.createOscillator();
            const rGain = ctx.createGain();
            rOsc.type = 'sine';
            rOsc.frequency.setValueAtTime(rf * pScale * (0.96 + Math.random() * 0.08), now);
            rGain.gain.setValueAtTime((0.10 / (idx + 1)) * vol * ringBoost, now);
            rGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.19);
            rOsc.connect(rGain);
            this._connectStereo(ctx, rGain, panX);
            rOsc.start(now);
            rOsc.stop(now + 0.21);
          });
          return;
        }

        if (mat === 'wood') {
          // Carved hardwood: warm, dry, organic "tok-tok" with zero metallic/can resonance
          const sMult = (isDie ? 1.28 : (isWall ? 0.88 : 1.0)) * pScale;
          this._playNoiseBurst(ctx, now, 'bandpass', 490 * sMult * jitter(), 2.2, 0.44 * vol, 0.015, panX);
          this._playNoiseBurst(ctx, now, 'bandpass', 940 * sMult * jitter(), 1.8, 0.25 * vol, 0.010, panX);
          if (!isDie) {
            this._playNoiseBurst(ctx, now, 'lowpass', 175 * tFreq * jitter(), 0.8, Math.min(0.52, 0.30 * vol * tBoost), 0.024, panX);
          }
          if (surface === 'felt' && vol > 0.38) {
            const t2 = now + 0.014 + Math.random() * 0.008;
            this._playNoiseBurst(ctx, t2, 'bandpass', 560 * pScale * jitter(), 2.1, 0.20 * vol, 0.011, panX);
          }
          return;
        }

        if (mat === 'obsidian') {
          // Polished stone / onyx: weighty solid mineral clack + dense leather-pad thump
          const sMult = (isDie ? 1.4 : (isWall ? 0.85 : 1.0)) * pScale;
          this._playNoiseBurst(ctx, now, 'bandpass', 2150 * sMult * jitter(), 1.9, 0.34 * vol, 0.008, panX);
          this._playNoiseBurst(ctx, now, 'bandpass', 920 * sMult * jitter(), 1.6, 0.30 * vol, 0.012, panX);
          if (!isDie) {
            this._playNoiseBurst(ctx, now, 'lowpass', 130 * tFreq * jitter(), 0.85, Math.min(0.58, 0.40 * vol * tBoost), 0.026, panX);
          } else {
            this._playNoiseBurst(ctx, now, 'bandpass', 3400 * pScale * jitter(), 3.2, 0.24 * vol, 0.007, panX);
          }
          return;
        }

        if (mat === 'bone') {
          // Ancient ivory / bone: dense, lower-mid hollow-ivory domino "klak"
          const sMult = (isDie ? 1.28 : (isWall ? 0.86 : 1.0)) * pScale;
          this._playNoiseBurst(ctx, now, 'bandpass', 1080 * sMult * jitter(), 4.2, 0.42 * vol, 0.010, panX);
          this._playNoiseBurst(ctx, now, 'bandpass', 2080 * sMult * jitter(), 4.5, 0.24 * vol, 0.007, panX);
          this._playNoiseBurst(ctx, now, 'highpass', 3800 * pScale * jitter(), 1.4, 0.14 * vol, 0.0035, panX);
          if (!isDie) {
            this._playNoiseBurst(ctx, now, 'lowpass', 200 * tFreq * jitter(), 0.9, Math.min(0.48, 0.26 * vol * tBoost), 0.018, panX);
          }
          return;
        }

        if (mat === 'crystal') {
          // Cut quartz / arcane crystal: ultra-crisp glassy tap + delicate high quartz shimmer
          const sMult = (isDie ? 1.25 : 1.0) * pScale;
          this._playNoiseBurst(ctx, now, 'highpass', 4200 * pScale * jitter(), 1.2, 0.22 * vol, 0.005, panX);
          this._playNoiseBurst(ctx, now, 'bandpass', 2650 * sMult * jitter(), 2.8, 0.22 * vol, 0.0075, panX);
          if (!isDie) {
            this._playNoiseBurst(ctx, now, 'lowpass', 165 * tFreq * jitter(), 0.8, Math.min(0.42, 0.18 * vol * tBoost), 0.018, panX);
          }
          const chimeVol = (isDie ? 0.065 : 0.032) * vol;
          [4850, 7120].forEach((cf, idx) => {
            const cOsc = ctx.createOscillator();
            const cGain = ctx.createGain();
            cOsc.type = 'sine';
            cOsc.frequency.setValueAtTime(cf * pScale * (0.97 + Math.random() * 0.06), now);
            cGain.gain.setValueAtTime(chimeVol / (idx + 1), now);
            cGain.gain.exponentialRampToValueAtTime(0.0006, now + (isDie ? 0.11 : 0.075));
            cOsc.connect(cGain);
            this._connectStereo(ctx, cGain, panX);
            cOsc.start(now);
            cOsc.stop(now + 0.12);
          });
          return;
        }

        // Default / Resin: light, lively, higher-pitched acrylic RPG dice triple-skitter clatter
        const sMult = (isDie ? 1.38 : (isWall ? 0.88 : 1.0)) * pScale;
        this._playNoiseBurst(ctx, now, 'bandpass', 2450 * sMult * jitter(), 2.2, 0.30 * vol, 0.0055, panX);
        this._playNoiseBurst(ctx, now, 'bandpass', 4650 * sMult * jitter(), 2.4, 0.24 * vol, 0.0042, panX);
        if (!isDie) {
          this._playNoiseBurst(ctx, now, 'lowpass', 240 * tFreq * jitter(), 0.7, Math.min(0.36, 0.15 * vol * tBoost), 0.014, panX);
        }
        if (surface === 'felt' && vol > 0.28) {
          const t2 = now + 0.009 + Math.random() * 0.005;
          this._playNoiseBurst(ctx, t2, 'bandpass', 2750 * pScale * jitter(), 2.4, 0.18 * vol, 0.0045, panX);
          if (vol > 0.5) {
            const t3 = t2 + 0.012 + Math.random() * 0.006;
            this._playNoiseBurst(ctx, t3, 'bandpass', 3100 * pScale * jitter(), 2.5, 0.11 * vol, 0.004, panX);
          }
        }
      } catch (e) {}
    }

    playCritSound(isNat20, panX = 0) {
      const ctx = this._ensureAudio();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        if (isNat20) {
          const freqs = [587.33, 739.99, 880.0, 1174.66];
          freqs.forEach((f, idx) => {
            const t = now + idx * 0.055;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = this.materialId === 'metal' ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.11, t + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.72);
            osc.connect(gain);
            this._connectStereo(ctx, gain, panX);
            osc.start(t);
            osc.stop(t + 0.75);
          });
        } else {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc2.type = 'sine';
          osc.frequency.setValueAtTime(98, now);
          osc.frequency.exponentialRampToValueAtTime(52, now + 0.36);
          osc2.frequency.setValueAtTime(73.4, now);
          osc2.frequency.exponentialRampToValueAtTime(41, now + 0.42);

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(260, now);

          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(lp);
          osc2.connect(lp);
          lp.connect(gain);
          this._connectStereo(ctx, gain, panX);
          osc.start(now);
          osc2.start(now);
          osc.stop(now + 0.48);
          osc2.stop(now + 0.48);
        }
      } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // MATERIAL-SPECIFIC PROCEDURAL SURFACE PATTERN GENERATORS (ALBEDO + BUMP)
    // ------------------------------------------------------------------------
    _getMaterialSurfaceMaps() {
      const key = `${this.materialId}_${this.bodyColor}_${this.swirlColor}_${this.edgeColor}`;
      if (this.surfaceCache.has(key)) return this.surfaceCache.get(key);

      const size = 256;
      const albedoCanvas = document.createElement('canvas');
      albedoCanvas.width = size;
      albedoCanvas.height = size;
      const actx = albedoCanvas.getContext('2d');

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = size;
      bumpCanvas.height = size;
      const bctx = bumpCanvas.getContext('2d');

      const base = this.bodyColor;
      const dark = shiftColor(base, -0.42);
      const mid = shiftColor(base, 0.18);
      const light = shiftColor(base, 0.40);
      const veinTint = mixHex(base, this.edgeColor, 0.65);

      actx.fillStyle = base;
      actx.fillRect(0, 0, size, size);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, size, size);

      if (this.materialId === 'metal') {
        // Forged brushed metal: fine directional anisotropic hairlines + subtle hammer dimples
        for (let y = 0; y < size; y += 2) {
          const v = Math.sin(y * 1.7) * 0.5 + 0.5;
          actx.strokeStyle = v > 0.5 ? light : dark;
          actx.globalAlpha = 0.08 + (y % 5) * 0.015;
          actx.lineWidth = 1;
          actx.beginPath();
          actx.moveTo(0, y);
          actx.lineTo(size, y + Math.sin(y * 0.3) * 1.5);
          actx.stroke();

          bctx.strokeStyle = v > 0.5 ? '#a8a8a8' : '#585858';
          bctx.globalAlpha = 0.25;
          bctx.beginPath();
          bctx.moveTo(0, y);
          bctx.lineTo(size, y);
          bctx.stroke();
        }
        // Subtle forged hammer dimples
        for (let i = 0; i < 24; i++) {
          const x = ((i * 59) % size);
          const y = ((i * 97) % size);
          const r = 10 + (i % 4) * 5;
          const g = bctx.createRadialGradient(x, y, 1, x, y, r);
          g.addColorStop(0, 'rgba(60,60,60,0.45)');
          g.addColorStop(1, 'rgba(128,128,128,0)');
          bctx.globalAlpha = 1;
          bctx.fillStyle = g;
          bctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      } else if (this.materialId === 'wood') {
        // Carved hardwood: organic wavy growth rings + fibrous grain streaks
        for (let i = 0; i < 42; i++) {
          const y0 = (i / 42) * size;
          actx.strokeStyle = i % 3 === 0 ? dark : mid;
          actx.globalAlpha = i % 3 === 0 ? 0.38 : 0.22;
          actx.lineWidth = 1.5 + (i % 3);
          actx.beginPath();
          bctx.strokeStyle = i % 3 === 0 ? '#505050' : '#a4a4a4';
          bctx.globalAlpha = 0.35;
          bctx.lineWidth = actx.lineWidth;
          bctx.beginPath();
          for (let x = 0; x <= size; x += 8) {
            const wave = Math.sin((x / size) * Math.PI * 2 + i * 0.25) * 9 + Math.cos(x * 0.08 + i) * 3;
            if (x === 0) { actx.moveTo(x, y0 + wave); bctx.moveTo(x, y0 + wave); }
            else { actx.lineTo(x, y0 + wave); bctx.lineTo(x, y0 + wave); }
          }
          actx.stroke();
          bctx.stroke();
        }
        // Subtle wood knot
        const kx = 148, ky = 112;
        for (let r = 8; r < 34; r += 6) {
          actx.strokeStyle = dark;
          actx.globalAlpha = 0.28;
          actx.lineWidth = 2;
          actx.beginPath();
          actx.ellipse(kx, ky, r * 1.4, r * 0.65, 0.25, 0, Math.PI * 2);
          actx.stroke();
        }
      } else if (this.materialId === 'crystal') {
        // Arcane crystal: sharp internal geometric cleavage planes + starlight motes
        for (let i = 0; i < 16; i++) {
          const x1 = (Math.sin(i * 19.3) * 0.5 + 0.5) * size;
          const y1 = (Math.cos(i * 31.7) * 0.5 + 0.5) * size;
          const x2 = x1 + Math.cos(i * 1.4) * 95;
          const y2 = y1 + Math.sin(i * 1.4) * 95;
          const x3 = x1 + Math.cos(i * 1.4 + 1.1) * 70;
          const y3 = y1 + Math.sin(i * 1.4 + 1.1) * 70;
          actx.fillStyle = i % 2 === 0 ? light : veinTint;
          actx.globalAlpha = 0.16;
          actx.beginPath();
          actx.moveTo(x1, y1); actx.lineTo(x2, y2); actx.lineTo(x3, y3);
          actx.closePath();
          actx.fill();

          bctx.strokeStyle = '#d8d8d8';
          bctx.globalAlpha = 0.4;
          bctx.lineWidth = 1.5;
          bctx.beginPath();
          bctx.moveTo(x1, y1); bctx.lineTo(x2, y2);
          bctx.stroke();
        }
        // Luminous stardust inclusions
        for (let s = 0; s < 55; s++) {
          const sx = (s * 47 + 13) % size;
          const sy = (s * 83 + 29) % size;
          actx.fillStyle = s % 3 === 0 ? '#ffffff' : this.edgeColor;
          actx.globalAlpha = 0.45 + (s % 4) * 0.12;
          actx.beginPath();
          actx.arc(sx, sy, 0.8 + (s % 3) * 0.6, 0, Math.PI * 2);
          actx.fill();
        }
      } else if (this.materialId === 'bone') {
        // Carved ivory / bone: warm mottled tone + fine organic pores + aged hairline fissures
        for (let i = 0; i < 20; i++) {
          const x = (i * 53) % size;
          const y = (i * 71) % size;
          const g = actx.createRadialGradient(x, y, 4, x, y, 44);
          g.addColorStop(0, i % 2 === 0 ? dark : light);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          actx.globalAlpha = 0.14;
          actx.fillStyle = g;
          actx.fillRect(0, 0, size, size);
        }
        // Fine bone pores
        for (let p = 0; p < 160; p++) {
          const px = (p * 37 + 11) % size;
          const py = (p * 61 + 19) % size;
          actx.fillStyle = dark;
          actx.globalAlpha = 0.22;
          actx.fillRect(px, py, 1.5, 1.5);
          bctx.fillStyle = '#484848';
          bctx.globalAlpha = 0.38;
          bctx.fillRect(px, py, 1.5, 1.5);
        }
        // Delicate age fissures
        actx.strokeStyle = dark;
        bctx.strokeStyle = '#383838';
        for (let c = 0; c < 6; c++) {
          actx.globalAlpha = 0.3;
          actx.lineWidth = 0.9;
          bctx.globalAlpha = 0.45;
          bctx.lineWidth = 1.2;
          let cx = (c * 49) % size;
          let cy = (c * 37) % size;
          actx.beginPath(); actx.moveTo(cx, cy);
          bctx.beginPath(); bctx.moveTo(cx, cy);
          for (let k = 0; k < 5; k++) {
            cx += Math.sin(c * 2.7 + k * 1.4) * 22 + 8;
            cy += Math.cos(c * 1.9 + k * 2.1) * 18 + 6;
            actx.lineTo(cx, cy); bctx.lineTo(cx, cy);
          }
          actx.stroke(); bctx.stroke();
        }
      } else if (this.materialId === 'resin') {
        // Translucent sharp-edge resin: soft billowing alcohol-ink clouds (no hard stripes!)
        const inkA = this.bodyColor;
        const inkB = this.swirlColor || '#072a36';
        const inkBright = shiftColor(inkA, 0.35);

        actx.fillStyle = mixHex(inkA, inkB, 0.45);
        actx.fillRect(0, 0, size, size);

        // Layered billowing smoke / alcohol-ink blooms (seamless wraparound)
        for (let i = 0; i < 34; i++) {
          const cx = ((Math.sin(i * 19.17) * 0.5 + 0.5) * size);
          const cy = ((Math.cos(i * 31.43) * 0.5 + 0.5) * size);
          const rad = 28 + (i % 6) * 16;
          const col = i % 3 === 0 ? inkBright : (i % 3 === 1 ? inkB : inkA);
          const alpha = i % 3 === 0 ? 0.32 : 0.42;

          for (const ox of [-size, 0, size]) {
            for (const oy of [-size, 0, size]) {
              const gx = cx + ox;
              const gy = cy + oy;
              if (gx + rad < 0 || gx - rad > size || gy + rad < 0 || gy - rad > size) continue;
              const g = actx.createRadialGradient(gx, gy, rad * 0.08, gx, gy, rad);
              g.addColorStop(0, col);
              g.addColorStop(0.55, col);
              g.addColorStop(1, 'rgba(0,0,0,0)');
              actx.globalAlpha = alpha;
              actx.fillStyle = g;
              actx.beginPath();
              actx.arc(gx, gy, rad, 0, Math.PI * 2);
              actx.fill();
            }
          }
        }
        // Soft glossy surface (near-flat bump)
        bctx.fillStyle = '#808080';
        bctx.fillRect(0, 0, size, size);
      } else {
        // Polished obsidian: deep volcanic smoky clouds + razor mineral veins
        for (let i = 0; i < 18; i++) {
          const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * size;
          const y = (Math.cos(i * 78.233) * 0.5 + 0.5) * size;
          const r = 34 + (i % 5) * 22;
          const g = actx.createRadialGradient(x, y, 2, x, y, r);
          g.addColorStop(0, mid);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          actx.globalAlpha = 0.36;
          actx.fillStyle = g;
          actx.fillRect(0, 0, size, size);
        }
        actx.globalAlpha = 0.34;
        actx.strokeStyle = veinTint;
        bctx.strokeStyle = 'rgba(235,235,235,0.4)';
        for (let v = 0; v < 7; v++) {
          actx.lineWidth = 0.9 + (v % 3) * 0.6;
          bctx.lineWidth = actx.lineWidth + 0.5;
          actx.beginPath(); bctx.beginPath();
          let px = (v * 43) % size;
          let py = (v * 29) % size;
          actx.moveTo(px, py); bctx.moveTo(px, py);
          for (let s = 0; s < 8; s++) {
            px += Math.sin(v * 2.1 + s * 1.3) * 34 + 18;
            py += Math.cos(v * 1.7 + s * 1.9) * 30 + 12;
            actx.lineTo(px, py); bctx.lineTo(px, py);
          }
          actx.stroke(); bctx.stroke();
        }
      }

      actx.globalAlpha = 1.0;
      bctx.globalAlpha = 1.0;

      const map = new THREE.CanvasTexture(albedoCanvas);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.encoding = THREE.sRGBEncoding;

      const bumpMap = new THREE.CanvasTexture(bumpCanvas);
      bumpMap.wrapS = THREE.RepeatWrapping;
      bumpMap.wrapT = THREE.RepeatWrapping;

      const bundle = { map, bumpMap };
      this.surfaceCache.set(key, bundle);
      return bundle;
    }

    // ------------------------------------------------------------------------
    // CRISP RECESSED FOIL FACE NUMERALS (Harmonized with Edge/Line Color)
    // ------------------------------------------------------------------------
    createFaceTexture(numberText, sides) {
      const inkHex = this.textColor || this.edgeColor;
      const key = `${this.materialId}_${inkHex}_${sides}_${numberText}`;
      if (this.textureCache.has(key)) return this.textureCache.get(key);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 512, 512);

      const num = parseInt(numberText, 10) || 0;
      const isCrit20 = (sides === 20 && num === 20) || (sides === 100 && num === 100);
      const isCrit1 = (sides === 20 && num === 1) || (sides === 100 && num === 1);
      const displayText = String(numberText);
      const hasDot = (displayText === '6' || displayText === '9') && sides > 4;

      const cx = 256;
      const cy = 256;
      const len = displayText.length;
      const fontSize = len >= 3 ? 154 : (len === 2 ? 216 : 258);

      const edgeLight = shiftColor(inkHex, 0.55);
      const edgeMid = inkHex;
      const edgeDark = shiftColor(inkHex, -0.45);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${fontSize}px "Cinzel", "Palatino Linotype", "Book Antiqua", "Georgia", serif`;

      ctx.shadowColor = isCrit20
        ? 'rgba(253, 224, 71, 0.92)'
        : (isCrit1 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.82)');
      ctx.shadowBlur = isCrit20 ? 28 : (isCrit1 ? 22 : 12);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isCrit20 || isCrit1 ? 0 : 5;

      const grad = ctx.createLinearGradient(120, 90, 392, 420);
      if (isCrit20) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, '#fef08a');
        grad.addColorStop(0.65, '#f59e0b');
        grad.addColorStop(1, '#b45309');
      } else if (isCrit1) {
        grad.addColorStop(0, '#fecaca');
        grad.addColorStop(0.45, '#ef4444');
        grad.addColorStop(1, '#7f1d1d');
      } else {
        grad.addColorStop(0, edgeLight);
        grad.addColorStop(0.45, edgeMid);
        grad.addColorStop(1, edgeDark);
      }

      // Tight dark engraved recess outline (preserves open inner triangle of '4' and crisp serif geometry)
      ctx.lineWidth = Math.max(5, fontSize * 0.034);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isCrit20 ? '#92400e' : (isCrit1 ? '#450a0a' : 'rgba(14, 11, 10, 0.92)');
      ctx.strokeText(displayText, cx, cy);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      if (isCrit20) {
        const core = ctx.createRadialGradient(cx, cy - 22, 12, cx, cy, 150);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.45, '#fef08a');
        core.addColorStop(1, '#d97706');
        ctx.fillStyle = core;
      } else if (isCrit1) {
        ctx.fillStyle = '#ef4444';
      } else {
        const fillGrad = ctx.createLinearGradient(cx, cy - fontSize * 0.45, cx, cy + fontSize * 0.45);
        fillGrad.addColorStop(0, edgeLight);
        fillGrad.addColorStop(0.55, edgeMid);
        fillGrad.addColorStop(1, edgeDark);
        ctx.fillStyle = fillGrad;
      }
      ctx.fillText(displayText, cx, cy);

      // Subtle inner specular hairline
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = isCrit20 ? '#ffffff' : 'rgba(255, 255, 255, 0.55)';
      ctx.strokeText(displayText, cx, cy);

      if (hasDot) {
        ctx.beginPath();
        ctx.arc(cx, cy + fontSize * 0.56, fontSize * 0.072, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 4;
      texture.encoding = THREE.sRGBEncoding;
      this.textureCache.set(key, texture);
      return texture;
    }

    createD4FaceTexture(cornerValues, isApexHighlight = true) {
      const [vTop, vLeft, vRight] = cornerValues || [4, 1, 2];
      const inkHex = this.textColor || this.edgeColor;
      const key = `${this.materialId}_${inkHex}_d4_${vTop}_${vLeft}_${vRight}_${isApexHighlight ? 1 : 0}`;
      if (this.textureCache.has(key)) return this.textureCache.get(key);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 512, 512);

      const cx = 256;
      const cy = 256;
      const distPx = 152;
      const edgeLight = shiftColor(inkHex, 0.55);
      const edgeMid = inkHex;
      const edgeDark = shiftColor(inkHex, -0.45);

      const corners = [
        { text: String(vTop), dx: 0, dy: -distPx, angle: 0, isPeak: isApexHighlight },
        { text: String(vLeft), dx: -distPx * 0.8660254, dy: distPx * 0.5, angle: -(2 * Math.PI) / 3, isPeak: false },
        { text: String(vRight), dx: distPx * 0.8660254, dy: distPx * 0.5, angle: (2 * Math.PI) / 3, isPeak: false }
      ];

      corners.forEach(c => {
        ctx.save();
        ctx.translate(cx + c.dx, cy + c.dy);
        ctx.rotate(c.angle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = c.isPeak ? 120 : 98;
        ctx.font = `700 ${fontSize}px "Cinzel", "Palatino Linotype", "Georgia", serif`;
        ctx.shadowColor = c.isPeak ? 'rgba(250, 204, 21, 0.85)' : 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = c.isPeak ? 16 : 9;

        const g = ctx.createLinearGradient(-40, -50, 40, 50);
        g.addColorStop(0, edgeLight);
        g.addColorStop(0.5, edgeMid);
        g.addColorStop(1, edgeDark);

        ctx.lineWidth = Math.max(4, fontSize * 0.036);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(14, 11, 10, 0.9)';
        ctx.strokeText(c.text, 0, 0);

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = c.isPeak ? '#ffffff' : g;
        ctx.fillText(c.text, 0, 0);
        ctx.restore();
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;
      this.textureCache.set(key, texture);
      return texture;
    }

    // ------------------------------------------------------------------------
    // PROCEDURAL VFX TEXTURES & PARTICLES
    // ------------------------------------------------------------------------
    _getVfxRingTexture(kind) {
      if (this.vfxTextureCache.has(kind)) return this.vfxTextureCache.get(kind);
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const cx = 256;
      const cy = 256;

      if (kind === 'crit20') {
        const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 240);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
        glow.addColorStop(0.55, 'rgba(245, 158, 11, 0.25)');
        glow.addColorStop(0.85, 'rgba(245, 158, 11, 0.08)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = '#fef08a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(cx, cy, 208, 0, Math.PI * 2); ctx.stroke();

        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 174, 0, Math.PI * 2); ctx.stroke();

        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8;
          const r1 = i % 2 === 0 ? 150 : 174;
          const r2 = i % 2 === 0 ? 228 : 206;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
          ctx.lineWidth = i % 2 === 0 ? 5 : 2.5;
          ctx.stroke();
        }
      } else if (kind === 'crit1') {
        const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 235);
        glow.addColorStop(0, 'rgba(220, 38, 38, 0.5)');
        glow.addColorStop(0.65, 'rgba(153, 27, 27, 0.22)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = '#f87171';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const a = (i * Math.PI * 2) / 24;
          const r = 182 + (i % 2 === 0 ? 26 : -14);
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(cx, cy, 130, cx, cy, 240);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.55, 'rgba(254, 243, 199, 0.32)');
        g.addColorStop(0.8, 'rgba(254, 243, 199, 0.14)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      this.vfxTextureCache.set(kind, tex);
      return tex;
    }

    _spawnImpactBurst(pos, intensity = 1.0, kind = 'impact') {
      if (!this.scene) return;
      const ringMat = new THREE.MeshBasicMaterial({
        map: this._getVfxRingTexture(kind),
        transparent: true,
        opacity: kind === 'impact' ? 0.42 * intensity : 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(this.ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.03, pos.z);
      const startScale = kind === 'impact' ? 1.2 : 1.6;
      const endScale = kind === 'crit20' ? 7.4 : (kind === 'crit1' ? 6.2 : 3.2 + intensity * 1.4);
      ring.scale.set(startScale, startScale, 1);
      this.scene.add(ring);

      this.vfxItems.push({
        type: 'ring',
        mesh: ring,
        age: 0,
        life: kind === 'impact' ? 380 : 1250,
        startScale,
        endScale,
        spin: kind === 'crit20' ? 0.018 : (kind === 'crit1' ? -0.012 : 0),
        baseOpacity: ringMat.opacity
      });

      const count = kind === 'crit20' ? 24 : (kind === 'crit1' ? 18 : Math.min(10, Math.floor(4 + intensity * 6)));
      const sparkColor = kind === 'crit20'
        ? 0xfef08a
        : (kind === 'crit1' ? 0xef4444 : new THREE.Color(this.edgeColor).getHex());

      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: sparkColor,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const m = new THREE.Mesh(this.sparkGeo, mat);
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = (kind === 'impact' ? 0.08 : 0.11) + Math.random() * 0.12;
        m.position.set(pos.x, 0.18 + Math.random() * 0.25, pos.z);
        const sc = kind === 'crit20' ? (0.75 + Math.random() * 0.9) : (0.55 + Math.random() * 0.65);
        m.scale.setScalar(sc);
        this.scene.add(m);

        this.vfxItems.push({
          type: 'spark',
          mesh: m,
          vx: Math.cos(angle) * speed,
          vy: (kind === 'crit20' ? 0.12 : 0.07) + Math.random() * 0.11,
          vz: Math.sin(angle) * speed,
          gravity: kind === 'crit20' ? 0.0018 : 0.0055,
          swirl: kind === 'crit20' ? 0.045 : 0,
          age: 0,
          life: kind === 'impact' ? (320 + Math.random() * 200) : (780 + Math.random() * 480)
        });
      }
    }

    _updateVfx(rawDtMs, dt) {
      for (let i = this.vfxItems.length - 1; i >= 0; i--) {
        const item = this.vfxItems[i];
        item.age += rawDtMs;
        const t = Math.min(1, item.age / item.life);

        if (item.type === 'ring') {
          const easeOut = 1 - Math.pow(1 - t, 3);
          const s = item.startScale + (item.endScale - item.startScale) * easeOut;
          item.mesh.scale.set(s, s, 1);
          if (item.spin) item.mesh.rotation.z += item.spin * dt;
          item.mesh.material.opacity = item.baseOpacity * (1 - Math.pow(t, 1.6));
        } else if (item.type === 'spark') {
          if (item.swirl) {
            const cosS = Math.cos(item.swirl * dt);
            const sinS = Math.sin(item.swirl * dt);
            const nvx = item.vx * cosS - item.vz * sinS;
            const nvz = item.vx * sinS + item.vz * cosS;
            item.vx = nvx;
            item.vz = nvz;
          }
          item.mesh.position.x += item.vx * dt;
          item.mesh.position.y += item.vy * dt;
          item.mesh.position.z += item.vz * dt;
          item.vy -= item.gravity * dt;
          item.mesh.rotation.x += 0.14 * dt;
          item.mesh.rotation.y += 0.18 * dt;
          const fade = 1 - t;
          item.mesh.material.opacity = fade * fade;
          item.mesh.scale.multiplyScalar(Math.pow(0.985, dt));
        }

        if (t >= 1) {
          this.scene.remove(item.mesh);
          if (item.mesh.material) item.mesh.material.dispose();
          this.vfxItems.splice(i, 1);
        }
      }
    }

    _clearVfx() {
      this.vfxItems.forEach(item => {
        this.scene.remove(item.mesh);
        if (item.mesh.material) item.mesh.material.dispose();
      });
      this.vfxItems = [];
    }

    // ------------------------------------------------------------------------
    // EXACT POLYHEDRAL GEOMETRIES (d4, d6, d8, d10, d12, d20, d100)
    // ------------------------------------------------------------------------
    createD4Geometry(radius, targetValue) {
      const geo = new THREE.BufferGeometry();
      const vertices = [];
      const customFaces = [];
      const R = radius * 1.24;
      const rBase = R * Math.sqrt(8 / 9);
      const yBase = -R / 3;

      const V0 = new THREE.Vector3(0, R, 0);
      const V1 = new THREE.Vector3(0, yBase, rBase);
      const V2 = new THREE.Vector3(rBase * Math.cos(Math.PI / 6), yBase, -rBase * Math.sin(Math.PI / 6));
      const V3 = new THREE.Vector3(-rBase * Math.cos(Math.PI / 6), yBase, -rBase * Math.sin(Math.PI / 6));

      const val0 = [1, 2, 3, 4].includes(Number(targetValue)) ? Number(targetValue) : 4;
      const others = [1, 2, 3, 4].filter(v => v !== val0);
      const faceDefs = [
        { va: V0, vb: V1, vc: V2, vals: [val0, others[0], others[1]], isSide: true },
        { va: V0, vb: V2, vc: V3, vals: [val0, others[1], others[2]], isSide: true },
        { va: V0, vb: V3, vc: V1, vals: [val0, others[2], others[0]], isSide: true },
        { va: V1, vb: V3, vc: V2, vals: [others[0], others[2], others[1]], isSide: false }
      ];

      faceDefs.forEach(fd => {
        pushOutwardTri(vertices, fd.va, fd.vb, fd.vc);
        const center = new THREE.Vector3().add(fd.va).add(fd.vb).add(fd.vc).divideScalar(3);
        const e1 = new THREE.Vector3().subVectors(fd.vb, fd.va);
        const e2 = new THREE.Vector3().subVectors(fd.vc, fd.va);
        const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
        if (normal.dot(center) < 0) normal.negate();
        const topVec = new THREE.Vector3().subVectors(fd.va, center).normalize();
        customFaces.push({ center, normal, topVec, scale: 1.72, cornerValues: fd.vals, isApexHighlight: fd.isSide });
      });

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      geo.userData = { customFaces };
      return geo;
    }

    createD10Geometry(radius) {
      const geo = new THREE.BufferGeometry();
      const vertices = [];
      const customFaces = [];
      const H = radius * 1.15;
      const R = radius * 0.98;
      const cos36 = (1 + Math.sqrt(5)) / 4;
      const h = H * (1 - cos36) / (1 + cos36);

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

        pushOutwardTri(vertices, topPole, uCurr, lCurr);
        pushOutwardTri(vertices, topPole, lCurr, uNext);

        const upperCenter = new THREE.Vector3().add(topPole).add(uCurr).add(lCurr).add(uNext).multiplyScalar(0.25);
        const uTrans = new THREE.Vector3().subVectors(uNext, uCurr);
        const uLong = new THREE.Vector3().subVectors(lCurr, topPole);
        const upperNormal = new THREE.Vector3().crossVectors(uLong, uTrans).normalize();
        if (upperNormal.dot(upperCenter) < 0) upperNormal.negate();
        const uTopVec = new THREE.Vector3().subVectors(topPole, upperCenter).normalize();

        pushOutwardTri(vertices, botPole, lNext, uNext);
        pushOutwardTri(vertices, botPole, uNext, lCurr);

        const lowerCenter = new THREE.Vector3().add(botPole).add(lCurr).add(uNext).add(lNext).multiplyScalar(0.25);
        const lLong = new THREE.Vector3().subVectors(uNext, botPole);
        const lTrans = new THREE.Vector3().subVectors(lNext, lCurr);
        const lowerNormal = new THREE.Vector3().crossVectors(lTrans, lLong).normalize();
        if (lowerNormal.dot(lowerCenter) < 0) lowerNormal.negate();
        const lTopVec = new THREE.Vector3().subVectors(uNext, lowerCenter).normalize();

        customFaces.push({ center: upperCenter, normal: upperNormal, topVec: uTopVec, scale: 0.52 });
        customFaces.push({ center: lowerCenter, normal: lowerNormal, topVec: lTopVec, scale: 0.52 });
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      geo.userData = { customFaces };
      return geo;
    }

    // Flawless 100-sided Zocchihedron: true flat polar caps, guaranteed outward CCW winding,
    // and explicit clean latitude/meridian edges (zero quad diagonals or polar spokes!)
    createD100Geometry(radius) {
      const geo = new THREE.BufferGeometry();
      const vertices = [];
      const customFaces = [];
      const customEdges = [];

      const spherePoint = (r, theta, phi) => new THREE.Vector3(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi)
      );

      // 1 + 10 + 15 + 24 + 24 + 15 + 10 + 1 = 100 facets
      const thetas = [
        0.30,
        0.60,
        0.96,
        Math.PI / 2,
        Math.PI - 0.96,
        Math.PI - 0.60,
        Math.PI - 0.30
      ];
      const bandCounts = [10, 15, 24, 24, 15, 10];

      // 1. Flat North Pole Decagon Cap (Face 0 - Target Value)
      const yNorth = radius * Math.cos(thetas[0]);
      const C_north = new THREE.Vector3(0, yNorth, 0);
      const P = [];
      for (let k = 0; k < 10; k++) {
        P.push(spherePoint(radius, thetas[0], (k * 2 * Math.PI) / 10));
      }
      for (let k = 0; k < 10; k++) {
        const pCurr = P[k];
        const pNext = P[(k + 1) % 10];
        pushOutwardTri(vertices, C_north, pCurr, pNext);
        customEdges.push([pCurr.clone(), pNext.clone()]);
      }
      customFaces.push({
        center: C_north,
        normal: new THREE.Vector3(0, 1, 0),
        topVec: new THREE.Vector3(0, 0, -1),
        scale: 0.44
      });

      // 2. Intermediate Bands 1..6 (Outward CCW quads + clean latitude/meridian edges only)
      for (let b = 0; b < 6; b++) {
        const thA = thetas[b];
        const thB = thetas[b + 1];
        const N = bandCounts[b];

        for (let i = 0; i < N; i++) {
          const phi0 = (i * 2 * Math.PI) / N;
          const phi1 = ((i + 1) * 2 * Math.PI) / N;

          const V00 = spherePoint(radius, thA, phi0);
          const V10 = spherePoint(radius, thA, phi1);
          const V11 = spherePoint(radius, thB, phi1);
          const V01 = spherePoint(radius, thB, phi0);

          const center = new THREE.Vector3().add(V00).add(V10).add(V11).add(V01).multiplyScalar(0.25);
          const normal = center.clone().normalize();

          pushOutwardTri(vertices, V00, V01, V11);
          pushOutwardTri(vertices, V00, V11, V10);

          // Explicit clean quad perimeter (meridian + bottom ring; skip diagonals!)
          customEdges.push([V00.clone(), V01.clone()]);
          customEdges.push([V01.clone(), V11.clone()]);
          if (b === 0) customEdges.push([V00.clone(), V10.clone()]);

          let topVec = new THREE.Vector3(0, 1, 0).sub(normal.clone().multiplyScalar(normal.y)).normalize();
          if (topVec.lengthSq() < 0.001) topVec = new THREE.Vector3(0, 0, 1);

          const facetScale = b === 0 || b === 5 ? 0.25 : (b === 1 || b === 4 ? 0.22 : 0.19);
          customFaces.push({ center, normal, topVec, scale: facetScale });
        }
      }

      // 3. Flat South Pole Decagon Cap (Face 99)
      const ySouth = -radius * Math.cos(thetas[0]);
      const C_south = new THREE.Vector3(0, ySouth, 0);
      const Q = [];
      for (let k = 0; k < 10; k++) {
        Q.push(spherePoint(radius, thetas[6], (k * 2 * Math.PI) / 10));
      }
      for (let k = 0; k < 10; k++) {
        const qCurr = Q[k];
        const qNext = Q[(k + 1) % 10];
        pushOutwardTri(vertices, C_south, qNext, qCurr);
      }
      customFaces.push({
        center: C_south,
        normal: new THREE.Vector3(0, -1, 0),
        topVec: new THREE.Vector3(0, 0, 1),
        scale: 0.40
      });

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      geo.userData = { customFaces, customEdges };
      return geo;
    }

    extractFaces(geo) {
      if (geo.userData && geo.userData.customFaces && geo.userData.customFaces.length > 0) {
        return geo.userData.customFaces;
      }
      const nonIndexed = geo.index ? geo.toNonIndexed() : geo.clone();
      const pos = nonIndexed.attributes.position.array;
      const faceGroups = [];
      const triCount = pos.length / 9;

      for (let i = 0; i < triCount; i++) {
        const i9 = i * 9;
        const v0 = new THREE.Vector3(pos[i9], pos[i9 + 1], pos[i9 + 2]);
        const v1 = new THREE.Vector3(pos[i9 + 3], pos[i9 + 4], pos[i9 + 5]);
        const v2 = new THREE.Vector3(pos[i9 + 6], pos[i9 + 7], pos[i9 + 8]);
        let normal = new THREE.Vector3().crossVectors(
          new THREE.Vector3().subVectors(v1, v0),
          new THREE.Vector3().subVectors(v2, v0)
        ).normalize();
        const triCenter = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3);
        if (normal.dot(triCenter) < 0) normal.negate();

        let group = faceGroups.find(g => g.normal.dot(normal) > 0.95);
        if (!group) {
          group = { normal: normal.clone(), vertices: [] };
          faceGroups.push(group);
        }
        [v0, v1, v2].forEach(v => {
          if (!group.vertices.some(gv => gv.distanceTo(v) < 0.005)) group.vertices.push(v.clone());
        });
      }

      return faceGroups.map(g => {
        const center = new THREE.Vector3();
        g.vertices.forEach(v => center.add(v));
        if (g.vertices.length > 0) center.divideScalar(g.vertices.length);
        let normal = center.clone().normalize();
        if (normal.dot(g.normal) < 0) normal.negate();

        let refUp = new THREE.Vector3(0, 1, 0);
        if (Math.abs(normal.dot(refUp)) > 0.92) refUp = new THREE.Vector3(0, 0, 1);
        let topVec = refUp.clone().sub(normal.clone().multiplyScalar(normal.dot(refUp))).normalize();

        if (g.vertices.length === 5) {
          let bestVec = null;
          let maxDot = -Infinity;
          g.vertices.forEach(v => {
            const rad = new THREE.Vector3().subVectors(v, center).normalize();
            const dot = rad.dot(topVec);
            if (dot > maxDot) { maxDot = dot; bestVec = rad; }
          });
          if (bestVec && maxDot > 0.25) topVec = bestVec;
        }
        return { center, normal, topVec };
      });
    }

    _ensurePlanarUVs(geo) {
      if (geo.attributes.uv) return;
      const pos = geo.attributes.position;
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        uvs[i * 2] = (x + z) * 0.28 + 0.5;
        uvs[i * 2 + 1] = (y + x * 0.4) * 0.28 + 0.5;
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    _getResinCloudTexture(hexColor) {
      const key = `resin_cloud_${hexColor}`;
      if (this.vfxTextureCache.has(key)) return this.vfxTextureCache.get(key);
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);

      // Multi-lobed organic billowing alcohol-ink cloud fading smoothly to alpha 0 at edges
      const lobes = [
        { x: 64, y: 64, r: 54, a: 0.62 },
        { x: 48, y: 54, r: 36, a: 0.45 },
        { x: 80, y: 72, r: 34, a: 0.42 },
        { x: 58, y: 78, r: 30, a: 0.36 }
      ];
      lobes.forEach(l => {
        const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
        g.addColorStop(0, hexColor);
        g.addColorStop(0.5, hexColor);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = l.a;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      this.vfxTextureCache.set(key, tex);
      return tex;
    }

    // ------------------------------------------------------------------------
    // BUILD STUDIO PBR POLYHEDRAL DIE MESH
    // ------------------------------------------------------------------------
    createDieMesh(type, targetValue) {
      let geo;
      let sides = 20;
      let radius = 1.52;
      let decalScale = 0.56;

      if (type === 'd4') {
        sides = 4; radius = 1.48; decalScale = 1.72;
        geo = this.createD4Geometry(radius, targetValue);
      } else if (type === 'd6') {
        sides = 6; radius = 1.56; decalScale = 0.74;
        geo = new THREE.BoxGeometry(radius, radius, radius);
      } else if (type === 'd8') {
        sides = 8; radius = 1.48; decalScale = 0.66;
        geo = new THREE.OctahedronGeometry(radius, 0);
      } else if (type === 'd100') {
        sides = 100; radius = 1.72; decalScale = 0.44;
        geo = this.createD100Geometry(radius);
      } else if (type === 'd10') {
        sides = 10; radius = 1.30; decalScale = 0.52;
        geo = this.createD10Geometry(radius);
      } else if (type === 'd12') {
        sides = 12; radius = 1.44; decalScale = 0.62;
        geo = new THREE.DodecahedronGeometry(radius, 0);
      } else {
        sides = 20; radius = 1.52; decalScale = 0.56;
        geo = new THREE.IcosahedronGeometry(radius, 0);
      }

      this._ensurePlanarUVs(geo);
      const matDef = this.getMaterialDef();
      const surfaceMaps = this._getMaterialSurfaceMaps();

      const isResin = this.materialId === 'resin';
      const dieMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: surfaceMaps.map,
        bumpMap: isResin ? null : surfaceMaps.bumpMap,
        bumpScale: matDef.bumpScale,
        roughness: matDef.roughness,
        metalness: matDef.metalness,
        clearcoat: matDef.clearcoat,
        clearcoatRoughness: matDef.clearcoatRoughness,
        envMapIntensity: matDef.envMapIntensity,
        transparent: isResin,
        opacity: isResin ? 0.68 : 1.0,
        depthWrite: !isResin,
        flatShading: true
      });

      const dieMesh = new THREE.Mesh(geo, dieMat);
      dieMesh.castShadow = true;
      dieMesh.receiveShadow = false;
      if (isResin) dieMesh.renderOrder = 2;

      // TRUE VOLUMETRIC ORGANIC INK-CLOUD WISPS + FOIL FLAKES INSIDE RESIN (zero hard inner polygon!)
      if (isResin) {
        // 1. Soft back-face resin refraction tint (fills die silhouette seamlessly to every corner)
        const backMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(this.swirlColor || '#072a36'),
          roughness: 0.45,
          metalness: 0.08,
          transparent: true,
          opacity: 0.62,
          side: THREE.BackSide,
          depthWrite: false
        });
        const backShell = new THREE.Mesh(geo, backMat);
        backShell.renderOrder = 0;
        dieMesh.add(backShell);

        // 2. Organic billowing internal smoke/ink sprites (feathered radial alpha -> zero hard seams)
        const cloudTexA = this._getResinCloudTexture(this.swirlColor || '#072a36');
        const cloudTexB = this._getResinCloudTexture(shiftColor(this.bodyColor, 0.25));
        const puffCount = 12;
        for (let p = 0; p < puffCount; p++) {
          const sMat = new THREE.SpriteMaterial({
            map: p % 2 === 0 ? cloudTexA : cloudTexB,
            transparent: true,
            opacity: p % 2 === 0 ? 0.58 : 0.46,
            depthWrite: false
          });
          const sp = new THREE.Sprite(sMat);
          const theta = (p * 2.39996) % (Math.PI * 2);
          const phi = Math.acos(1 - 2 * ((p + 0.5) / puffCount));
          const rr = radius * (0.14 + (p % 3) * 0.14);
          sp.position.set(
            rr * Math.sin(phi) * Math.cos(theta),
            rr * Math.cos(phi),
            rr * Math.sin(phi) * Math.sin(theta)
          );
          const sc = radius * (0.72 + (p % 3) * 0.18);
          sp.scale.set(sc, sc, 1);
          sp.renderOrder = 1;
          dieMesh.add(sp);
        }

        // 3. Suspended metallic foil leaf inclusions floating inside the resin volume
        const foilGeo = new THREE.OctahedronGeometry(radius * 0.11, 0);
        const foilMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(this.textColor || this.edgeColor),
          emissive: new THREE.Color(this.textColor || this.edgeColor).multiplyScalar(0.32),
          metalness: 0.96,
          roughness: 0.14,
          envMapIntensity: 1.8,
          side: THREE.DoubleSide
        });
        const flakeCount = 18;
        const flakeMesh = new THREE.InstancedMesh(foilGeo, foilMat, flakeCount);
        const fPos = new THREE.Vector3();
        const fQuat = new THREE.Quaternion();
        const fEuler = new THREE.Euler();
        const fScale = new THREE.Vector3();
        const fMat = new THREE.Matrix4();
        for (let f = 0; f < flakeCount; f++) {
          const theta = (f * 2.39996) % (Math.PI * 2);
          const phi = Math.acos(1 - 2 * ((f + 0.5) / flakeCount));
          const rr = radius * (0.20 + (f % 4) * 0.11);
          fPos.set(
            rr * Math.sin(phi) * Math.cos(theta),
            rr * Math.cos(phi),
            rr * Math.sin(phi) * Math.sin(theta)
          );
          fEuler.set(f * 1.1, f * 2.3, f * 0.7);
          fQuat.setFromEuler(fEuler);
          fScale.set(0.7 + (f % 3) * 0.35, 0.12, 0.55 + (f % 2) * 0.45);
          fMat.compose(fPos, fQuat, fScale);
          flakeMesh.setMatrixAt(f, fMat);
        }
        flakeMesh.instanceMatrix.needsUpdate = true;
        flakeMesh.renderOrder = 1;
        dieMesh.add(flakeMesh);
      }

      // Build clean sculpted bevel edges (using customEdges for d100 so zero quad diagonals appear!)
      const edgeSegments = [];
      if (geo.userData && geo.userData.customEdges) {
        geo.userData.customEdges.forEach(([a, b]) => edgeSegments.push([a, b]));
      } else {
        const edgeGeo = new THREE.EdgesGeometry(geo, 12);
        const posAttr = edgeGeo.attributes.position;
        const count = posAttr ? posAttr.count / 2 : 0;
        for (let i = 0; i < count; i++) {
          edgeSegments.push([
            new THREE.Vector3(posAttr.getX(i * 2), posAttr.getY(i * 2), posAttr.getZ(i * 2)),
            new THREE.Vector3(posAttr.getX(i * 2 + 1), posAttr.getY(i * 2 + 1), posAttr.getZ(i * 2 + 1))
          ]);
        }
      }

      let edgeMat = null;
      if (edgeSegments.length > 0 && this.unitCylGeo && this.unitSphereGeo) {
        const edgeRadius = type === 'd100' ? 0.014 : (isResin ? 0.011 : 0.028);
        const edgeColorObj = new THREE.Color(this.edgeColor);
        const emissiveObj = edgeColorObj.clone().multiplyScalar(0.55);

        edgeMat = new THREE.MeshStandardMaterial({
          color: edgeColorObj,
          emissive: emissiveObj,
          emissiveIntensity: matDef.edgeEmissiveIntensity,
          metalness: matDef.edgeMetalness,
          roughness: matDef.edgeRoughness,
          envMapIntensity: 1.4,
          transparent: isResin,
          opacity: isResin ? 0.48 : 1.0
        });

        const edgeMesh = new THREE.InstancedMesh(this.unitCylGeo, edgeMat, edgeSegments.length);
        const upVec = new THREE.Vector3(0, 1, 0);
        const dir = new THREE.Vector3();
        const mid = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const mat4 = new THREE.Matrix4();
        const uniqueVerts = [];

        edgeSegments.forEach(([p1, p2], i) => {
          dir.subVectors(p2, p1);
          const len = dir.length();
          mid.addVectors(p1, p2).multiplyScalar(0.5);
          quat.setFromUnitVectors(upVec, dir.clone().normalize());
          scale.set(edgeRadius, len, edgeRadius);
          mat4.compose(mid, quat, scale);
          edgeMesh.setMatrixAt(i, mat4);

          if (type !== 'd100') {
            if (!uniqueVerts.some(v => v.distanceTo(p1) < 0.05)) uniqueVerts.push(p1.clone());
            if (!uniqueVerts.some(v => v.distanceTo(p2) < 0.05)) uniqueVerts.push(p2.clone());
          }
        });
        edgeMesh.instanceMatrix.needsUpdate = true;
        dieMesh.add(edgeMesh);

        if (uniqueVerts.length > 0) {
          const cornerMesh = new THREE.InstancedMesh(this.unitSphereGeo, edgeMat, uniqueVerts.length);
          const idQuat = new THREE.Quaternion();
          uniqueVerts.forEach((v, idx) => {
            scale.setScalar(edgeRadius * 1.15);
            mat4.compose(v, idQuat, scale);
            cornerMesh.setMatrixAt(idx, mat4);
          });
          cornerMesh.instanceMatrix.needsUpdate = true;
          dieMesh.add(cornerMesh);
        }
      }

      // Attach recessed numeral decals onto facets
      const faces = this.extractFaces(geo);
      const numFaces = Math.min(faces.length, sides);
      const faceValues = [];

      if (type === 'd10') {
        const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const targetStr = targetValue === 10 ? '0' : String(targetValue);
        digits.forEach(d => { if (d !== targetStr) faceValues.push(d); });
        faceValues.sort(() => Math.random() - 0.5);
        faceValues.unshift(targetStr);
      } else {
        for (let i = 1; i <= sides; i++) {
          if (i !== targetValue) faceValues.push(i);
        }
        faceValues.sort(() => Math.random() - 0.5);
        faceValues.unshift(targetValue);
      }

      const maxDecals = type === 'd100' ? Math.min(faces.length, 52) : numFaces;
      for (let i = 0; i < maxDecals; i++) {
        const face = faces[i];
        const val = faceValues[i] !== undefined ? faceValues[i] : (i + 1);
        const tex = face.cornerValues
          ? this.createD4FaceTexture(face.cornerValues, face.isApexHighlight)
          : this.createFaceTexture(val, sides);

        const fScale = face.scale || decalScale;
        const decalGeo = new THREE.PlaneGeometry(radius * fScale, radius * fScale);
        const decalMat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.04,
          depthWrite: false,
          side: THREE.FrontSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        });

        const decalMesh = new THREE.Mesh(decalGeo, decalMat);
        if (isResin) decalMesh.renderOrder = 3;
        const normal = face.normal.clone().normalize();
        let up = face.topVec ? face.topVec.clone().normalize() : new THREE.Vector3(0, 1, 0);
        if (Math.abs(normal.dot(up)) > 0.92) up = new THREE.Vector3(0, 0, 1);
        const right = new THREE.Vector3().crossVectors(up, normal).normalize();
        const faceUp = new THREE.Vector3().crossVectors(normal, right).normalize();
        decalMesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, faceUp, normal));
        decalMesh.position.copy(face.center).addScaledVector(face.normal, type === 'd100' ? 0.026 : 0.02);
        dieMesh.add(decalMesh);
      }

      let normal0, right0, faceUp0;
      if (type === 'd4') {
        const yaw = Math.random() * Math.PI * 2;
        const tilt = 0.2;
        normal0 = new THREE.Vector3(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw)).normalize();
        const refUp = new THREE.Vector3(-Math.sin(yaw), 0, Math.cos(yaw)).normalize();
        right0 = new THREE.Vector3().crossVectors(refUp, normal0).normalize();
        faceUp0 = new THREE.Vector3().crossVectors(normal0, right0).normalize();
      } else {
        const f0 = faces[0];
        normal0 = f0 ? f0.normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
        let up0 = (f0 && f0.topVec) ? f0.topVec.clone().normalize() : new THREE.Vector3(0, 1, 0);
        if (Math.abs(normal0.dot(up0)) > 0.92) up0 = new THREE.Vector3(0, 0, 1);
        right0 = new THREE.Vector3().crossVectors(up0, normal0).normalize();
        faceUp0 = new THREE.Vector3().crossVectors(normal0, right0).normalize();
      }

      return {
        mesh: dieMesh,
        edgeMat,
        radius,
        sides,
        type,
        targetValue,
        targetNormal: normal0,
        targetFaceUp: faceUp0,
        targetRight: right0
      };
    }

    computeTargetQuat(dieData, diePos) {
      const toCamera = new THREE.Vector3().subVectors(this.camera.position, diePos).normalize();
      const blendedUp = new THREE.Vector3(0, 1, 0).multiplyScalar(0.28).addScaledVector(toCamera, 0.72).normalize();
      const camScreenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).normalize();

      const zWorld = blendedUp;
      const xWorld = new THREE.Vector3().crossVectors(camScreenUp, zWorld).normalize();
      const yWorld = new THREE.Vector3().crossVectors(zWorld, xWorld).normalize();

      const mWorld = new THREE.Matrix4().makeBasis(xWorld, yWorld, zWorld);
      const mLocal = new THREE.Matrix4().makeBasis(dieData.targetRight, dieData.targetFaceUp, dieData.targetNormal);
      const mTarget = new THREE.Matrix4().multiplyMatrices(mWorld, mLocal.clone().transpose());
      return new THREE.Quaternion().setFromRotationMatrix(mTarget);
    }

    computeFloorY(geo, quat, fallbackRadius) {
      if (!geo || !geo.attributes || !geo.attributes.position) return (fallbackRadius || 1.5) * 0.96;
      const pos = geo.attributes.position;
      let minY = 0;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyQuaternion(quat);
        if (v.y < minY) minY = v.y;
      }
      return Math.abs(minY) + 0.03;
    }

    loadThree() {
      if (typeof THREE !== 'undefined') return Promise.resolve(true);
      if (this.threePromise) return this.threePromise;
      this.threePromise = new Promise(resolve => {
        const s = document.createElement('script');
        s.src = DICE3D_V2_THREE_URL;
        s.async = true;
        s.onload = () => resolve(typeof THREE !== 'undefined');
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
      return this.threePromise;
    }

    roll(diceList, onComplete) {
      if (typeof THREE !== 'undefined') {
        this.rollNow(diceList, onComplete);
        return;
      }
      let started = false;
      const proceed = () => {
        if (started) return;
        started = true;
        this.rollNow(diceList, onComplete);
      };
      this.loadThree().then(proceed, proceed);
      setTimeout(proceed, DICE3D_V2_THREE_WAIT_MS);
    }

    rollNow(diceList, onComplete) {
      this.init();
      if (!this.initialized) {
        if (onComplete) onComplete(diceList);
        return;
      }

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.holdTimeoutId) { clearTimeout(this.holdTimeoutId); this.holdTimeoutId = null; }
      if (this.dismissTimeoutId) { clearTimeout(this.dismissTimeoutId); this.dismissTimeoutId = null; }

      this.onFinishCallback = onComplete;
      this.isRolling = true;
      this.shakeEnergy = 0;

      if (!this.mountEl) {
        this.container.style.pointerEvents = 'auto';
        this.container.style.opacity = '1';
      }

      this.activeDice.forEach(d => this.scene.remove(d.mesh));
      this.activeDice = [];
      this._clearVfx();
      this._updateTrayBounds();

      const count = diceList.length;
      const b = this.trayBounds;
      const phys = this.getMaterialDef();

      diceList.forEach((d, idx) => {
        const dieData = this.createDieMesh(d.type, d.value);
        const mesh = dieData.mesh;

        const spread = count > 1 ? ((idx / (count - 1)) - 0.5) : 0;
        const spawnX = b.maxX * 0.78 + (Math.random() - 0.5) * 0.9;
        const spawnZ = b.maxZ * 0.58 + spread * 2.6 + (Math.random() - 0.5) * 0.7;
        const spawnY = (4.4 + Math.random() * 1.3 + idx * 0.22) * (phys.launchSpeedScale || 1.0);

        mesh.position.set(spawnX, spawnY, spawnZ);
        mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        mesh.visible = false;
        this.scene.add(mesh);

        const targetX = spread * Math.min(4.2, b.maxX * 0.68) + (Math.random() - 0.5) * 0.9;
        const targetZ = (idx % 2 === 0 ? -1.1 : 1.1) * (count > 3 ? 1.0 : 0.45) + (Math.random() - 0.5) * 0.9;
        const dirX = targetX - spawnX;
        const dirZ = targetZ - spawnZ;
        const dist = Math.hypot(dirX, dirZ) || 1;
        const launchSpeed = (0.22 + Math.random() * 0.08) * (phys.launchSpeedScale || 1.0);

        const vx = (dirX / dist) * launchSpeed;
        const vz = (dirZ / dist) * launchSpeed;
        const vy = (0.075 + Math.random() * 0.065) * (phys.launchSpeedScale || 1.0);

        const sz = DICE_V2_SIZE_PROFILES[d.type] || DICE_V2_SIZE_PROFILES.d20;
        const spinAxis = new THREE.Vector3(-vz, (Math.random() - 0.5) * 0.14, vx).normalize();
        const targetQuat = this.computeTargetQuat(dieData, new THREE.Vector3(targetX, 1.5, targetZ));
        const floorY = this.computeFloorY(mesh.geometry, targetQuat, dieData.radius);

        this.activeDice.push({
          ...dieData,
          sizeProfile: sz,
          vx,
          vy,
          vz,
          spinAxis,
          spinSpeed: (0.28 + Math.random() * 0.14) * (phys.launchSpeedScale || 1.0) * sz.spinScale,
          releaseDelayMs: idx * 50,
          released: false,
          bounces: 0,
          settled: false,
          critTriggered: false,
          settleStartTime: 0,
          settleStartQuat: mesh.quaternion.clone(),
          targetQuat,
          floorY
        });
      });

      this.renderer.compile(this.scene, this.camera);

      let startTime = null;
      let lastTime = 0;
      let simElapsed = 0;
      let frameCount = 0;
      let fpsAccum = 0;
      let currentFps = 60;
      const stepQuat = new THREE.Quaternion();
      const rollAxis = new THREE.Vector3();

      const animate = (now) => {
        if (startTime === null) {
          startTime = now;
          lastTime = now;
        }
        const realDtMs = Math.min(40, Math.max(4, now - lastTime));
        lastTime = now;

        frameCount++;
        fpsAccum += realDtMs;
        if (fpsAccum >= 250) {
          currentFps = Math.round((frameCount * 1000) / fpsAccum);
          frameCount = 0;
          fpsAccum = 0;
        }

        const scaledDtMs = realDtMs * this.timeScale;
        simElapsed += scaledDtMs;
        const dt = scaledDtMs / 16.667;

        let allSettled = true;
        const bounds = this.trayBounds;

        this.activeDice.forEach(die => {
          if (!die.released) {
            if (simElapsed >= die.releaseDelayMs) {
              die.released = true;
              die.mesh.visible = true;
            } else {
              allSettled = false;
              return;
            }
          }

          if (!die.settled) {
            die.mesh.position.x += die.vx * dt;
            die.mesh.position.y += die.vy * dt;
            die.mesh.position.z += die.vz * dt;

            // Weight & die-size driven gravity & air drag
            const sz = die.sizeProfile || DICE_V2_SIZE_PROFILES.d20;
            die.vy -= (phys.gravity || 0.0155) * sz.gravityScale * dt;
            const airDrag = Math.pow(0.994, dt);
            die.vx *= airDrag;
            die.vz *= airDrag;

            const pad = die.radius * 0.92;
            const wallBounce = Math.max(0.45, Math.min(0.76, (phys.restitution || 0.5) + 0.22));
            if (die.mesh.position.x < bounds.minX + pad) {
              die.mesh.position.x = bounds.minX + pad;
              die.vx = Math.abs(die.vx) * wallBounce;
              die.spinSpeed = Math.min(0.36, die.spinSpeed + 0.05);
              this.playImpactSound(Math.min(0.7, Math.abs(die.vx) * 3.2), die.mesh.position.x, 'wall', die.type);
            } else if (die.mesh.position.x > bounds.maxX - pad) {
              die.mesh.position.x = bounds.maxX - pad;
              die.vx = -Math.abs(die.vx) * wallBounce;
              die.spinSpeed = Math.min(0.36, die.spinSpeed + 0.05);
              this.playImpactSound(Math.min(0.7, Math.abs(die.vx) * 3.2), die.mesh.position.x, 'wall', die.type);
            }
            if (die.mesh.position.z < bounds.minZ + pad) {
              die.mesh.position.z = bounds.minZ + pad;
              die.vz = Math.abs(die.vz) * wallBounce;
              this.playImpactSound(Math.min(0.7, Math.abs(die.vz) * 3.2), die.mesh.position.x, 'wall', die.type);
            } else if (die.mesh.position.z > bounds.maxZ - pad) {
              die.mesh.position.z = bounds.maxZ - pad;
              die.vz = -Math.abs(die.vz) * wallBounce;
              this.playImpactSound(Math.min(0.7, Math.abs(die.vz) * 3.2), die.mesh.position.x, 'wall', die.type);
            }

            if (die.spinSpeed > 0.002) {
              stepQuat.setFromAxisAngle(die.spinAxis, die.spinSpeed * dt);
              die.mesh.quaternion.premultiply(stepQuat);
            }

            const steerStartBounce = (phys.maxBounces || 4) <= 2 ? 1 : 2;
            if (die.bounces >= steerStartBounce) {
              die.targetQuat = this.computeTargetQuat(die, die.mesh.position);
              const steer = die.bounces === steerStartBounce ? 0.075 : 0.15;
              die.mesh.quaternion.slerp(die.targetQuat, 1 - Math.pow(1 - steer, dt));
            }

            if (die.mesh.position.y <= die.floorY) {
              die.mesh.position.y = die.floorY;
              const impactVel = Math.abs(die.vy);
              die.bounces++;

              // Material weight + die geometry (pyramid d4 stops fast; round d20/d100 glides farther)
              const baseRest = phys.restitution || 0.50;
              const restitution = Math.max(0.14, baseRest - (die.bounces - 1) * 0.085);
              die.vy = impactVel * restitution;

              const friction = Math.min(0.92, Math.max(0.55, (phys.feltFriction || 0.80) * sz.rollGlide));
              die.vx *= friction;
              die.vz *= friction;
              const hSpeed = Math.hypot(die.vx, die.vz);
              if (hSpeed > 0.015) {
                rollAxis.set(die.vz, (Math.random() - 0.5) * 0.15, -die.vx).normalize();
                die.spinAxis.lerp(rollAxis, 0.62).normalize();
                die.spinSpeed = Math.max(die.spinSpeed * (friction * 0.8), (hSpeed / die.radius) * 1.15);
              } else {
                die.spinSpeed *= 0.52;
              }

              const intensity = Math.min(1.0, impactVel * 2.9);
              if (intensity > 0.12) {
                this.playImpactSound(intensity, die.mesh.position.x, 'felt', die.type);
                if (die.bounces <= 2 && intensity > 0.30) {
                  this._spawnImpactBurst(die.mesh.position, intensity, 'impact');
                  this.shakeEnergy = Math.min(0.36, this.shakeEnergy + intensity * 0.10 * (phys.shakeScale || 1.0) * sz.shakeBoost);
                }
              }

              const maxB = phys.maxBounces || 4;
              if (die.bounces >= maxB || (die.bounces >= Math.min(2, maxB) && die.vy < 0.028 && hSpeed < 0.068)) {
                die.vy = 0;
                die.settled = true;
                die.settleStartTime = simElapsed;
                die.settleStartQuat.copy(die.mesh.quaternion);
                die.targetQuat = this.computeTargetQuat(die, die.mesh.position);
                die.floorY = this.computeFloorY(die.mesh.geometry, die.targetQuat, die.radius);
              }
            }
            allSettled = false;
          } else {
            const glide = Math.pow(0.84, dt);
            die.vx *= glide;
            die.vz *= glide;
            die.mesh.position.x = Math.max(bounds.minX + die.radius, Math.min(bounds.maxX - die.radius, die.mesh.position.x + die.vx * dt));
            die.mesh.position.z = Math.max(bounds.minZ + die.radius, Math.min(bounds.maxZ - die.radius, die.mesh.position.z + die.vz * dt));
            die.mesh.position.y += (die.floorY - die.mesh.position.y) * (1 - Math.pow(0.74, dt));
          }
        });

        // Inter-die elastic collisions & soft settled separation
        const n = this.activeDice.length;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const a = this.activeDice[i];
            const bDie = this.activeDice[j];
            if (!a.released || !bDie.released) continue;

            const dx = bDie.mesh.position.x - a.mesh.position.x;
            const dy = bDie.mesh.position.y - a.mesh.position.y;
            const dz = bDie.mesh.position.z - a.mesh.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const minDist = (a.radius + bDie.radius) * 1.15;

            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const overlap = (minDist - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              a.mesh.position.x -= nx * overlap;
              a.mesh.position.y = Math.max(a.floorY, a.mesh.position.y - ny * overlap);
              a.mesh.position.z -= nz * overlap;
              bDie.mesh.position.x += nx * overlap;
              bDie.mesh.position.y = Math.max(bDie.floorY, bDie.mesh.position.y + ny * overlap);
              bDie.mesh.position.z += nz * overlap;

              const velAlong = (bDie.vx - a.vx) * nx + (bDie.vy - a.vy) * ny + (bDie.vz - a.vz) * nz;
              if (velAlong < 0) {
                const imp = -(1 + 0.62) * velAlong * 0.5;
                a.vx -= imp * nx; a.vy -= imp * ny; a.vz -= imp * nz;
                bDie.vx += imp * nx; bDie.vy += imp * ny; bDie.vz += imp * nz;
                a.spinSpeed = Math.min(0.36, a.spinSpeed + 0.05);
                bDie.spinSpeed = Math.min(0.36, bDie.spinSpeed + 0.05);
                this.playImpactSound(Math.min(0.85, Math.abs(velAlong) * 3.6), (a.mesh.position.x + bDie.mesh.position.x) * 0.5, 'die', a.sides >= bDie.sides ? a.type : bDie.type);
              }

              if (a.settled) a.targetQuat = this.computeTargetQuat(a, a.mesh.position);
              if (bDie.settled) bDie.targetQuat = this.computeTargetQuat(bDie, bDie.mesh.position);
            }
          }
        }

        let allAligned = allSettled;
        this.activeDice.forEach(die => {
          if (!die.settled) return;
          const sElapsed = simElapsed - die.settleStartTime;
          const duration = 380;
          const t = Math.min(1, sElapsed / duration);
          const eased = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 1.15);
          die.mesh.quaternion.copy(die.settleStartQuat).slerp(die.targetQuat, Math.min(1.03, eased));

          if (t < 1) {
            allAligned = false;
          } else if (!die.critTriggered) {
            die.critTriggered = true;
            const isNat20 = (die.sides === 20 && die.targetValue === 20) || (die.sides === 100 && die.targetValue === 100);
            const isNat1 = (die.sides === 20 && die.targetValue === 1) || (die.sides === 100 && die.targetValue === 1);
            if (isNat20) {
              this._spawnImpactBurst(die.mesh.position, 1.2, 'crit20');
              this.playCritSound(true, die.mesh.position.x);
              this.shakeEnergy = Math.max(this.shakeEnergy, 0.14);
              if (die.edgeMat) {
                die.edgeMat.emissive.setHex(0xffb703);
                die.edgeMat.emissiveIntensity = 1.9;
              }
            } else if (isNat1) {
              this._spawnImpactBurst(die.mesh.position, 1.1, 'crit1');
              this.playCritSound(false, die.mesh.position.x);
              this.shakeEnergy = Math.max(this.shakeEnergy, 0.22);
              if (die.edgeMat) {
                die.edgeMat.emissive.setHex(0xdc2626);
                die.edgeMat.emissiveIntensity = 1.75;
              }
            }
          }
        });

        if (this.shakeEnergy > 0.002) {
          this.camera.position.set(
            this.baseCamPos.x + (Math.random() - 0.5) * this.shakeEnergy,
            this.baseCamPos.y + (Math.random() - 0.5) * this.shakeEnergy * 0.7,
            this.baseCamPos.z + (Math.random() - 0.5) * this.shakeEnergy
          );
          this.camera.lookAt(this.baseCamLook);
          this.shakeEnergy *= Math.pow(0.80, dt);
        } else {
          this.camera.position.copy(this.baseCamPos);
          this.camera.lookAt(this.baseCamLook);
        }

        this._updateVfx(scaledDtMs, dt);
        this.renderer.render(this.scene, this.camera);

        if (this.onMetrics) {
          this.onMetrics({
            fps: currentFps,
            elapsedMs: Math.round(now - startTime),
            activeDice: this.activeDice.length,
            vfxCount: this.vfxItems.length,
            rolling: true
          });
        }

        const hasLiveVfx = this.vfxItems.length > 0;
        if ((!allAligned && simElapsed < 2700) || (allAligned && hasLiveVfx && simElapsed < 3700)) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.camera.position.copy(this.baseCamPos);
          this.camera.lookAt(this.baseCamLook);
          this.activeDice.forEach(die => {
            die.mesh.visible = true;
            die.targetQuat = this.computeTargetQuat(die, die.mesh.position);
            die.floorY = this.computeFloorY(die.mesh.geometry, die.targetQuat, die.radius);
            die.mesh.position.y = die.floorY;
            die.mesh.quaternion.copy(die.targetQuat);
          });
          this.renderer.render(this.scene, this.camera);

          this.isRolling = false;
          if (this.onMetrics) {
            this.onMetrics({
              fps: currentFps,
              elapsedMs: Math.round(now - startTime),
              activeDice: this.activeDice.length,
              vfxCount: 0,
              rolling: false
            });
          }

          if (this.autoDismiss) {
            this.holdTimeoutId = setTimeout(() => this.finishRoll(diceList), this.holdMs);
          } else if (this.onFinishCallback) {
            const cb = this.onFinishCallback;
            this.onFinishCallback = null;
            cb(diceList);
          }
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    }

    dismissImmediately() {
      if (!this.isRolling && this.activeDice.length === 0) return;
      this.finishRoll(this.activeDice.map(d => ({ type: d.type || ('d' + d.sides), value: d.targetValue })));
    }

    finishRoll(diceList) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.holdTimeoutId) { clearTimeout(this.holdTimeoutId); this.holdTimeoutId = null; }
      this.isRolling = false;

      if (!this.mountEl && this.container) {
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
      }

      this.dismissTimeoutId = setTimeout(() => {
        if (this.autoDismiss) {
          this.activeDice.forEach(d => this.scene.remove(d.mesh));
          this.activeDice = [];
          this._clearVfx();
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        }
        if (this.onFinishCallback) {
          const cb = this.onFinishCallback;
          this.onFinishCallback = null;
          cb(diceList);
        }
      }, this.mountEl ? 40 : 280);
    }
  }

  global.DICE_V2_MATERIALS = DICE_V2_MATERIALS;
  global.DICE_V2_THEMES = DICE_V2_THEMES;
  global.Dice3DController = Dice3DV2Controller;
  global.Dice3D = new Dice3DV2Controller();

  // Background warm-up after page load: never delays boot, skipped on data-saver connections.
  (function scheduleDice3DWarmUp() {
    try {
      if (navigator.connection && navigator.connection.saveData) return;
      // Warm WebAudio context on first user gesture (respects autoplay policy, avoids first-roll audio hitch)
      if (typeof document !== 'undefined') {
        document.addEventListener('pointerdown', () => {
          try { if (global.Dice3D && global.Dice3D.soundEnabled) global.Dice3D._ensureAudio(); } catch (e) {}
        }, { once: true, passive: true });
      }
      const run = () => {
        const go = () => { if (global.Dice3D) global.Dice3D.warmUp(); };
        setTimeout(() => {
          if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 });
          else setTimeout(go, 200);
        }, 1500);
      };
      if (document.readyState === 'complete') run();
      else window.addEventListener('load', run, { once: true });
    } catch (e) {}
  })();
})(window);
