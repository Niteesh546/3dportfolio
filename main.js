/**
 * NITEESH NAIK — 3D Interactive Portfolio
 * Inspired by Bruno Simon's creative 3D portfolio
 * Built with Three.js + GSAP
 */

'use strict';

// ─────────────────────────────────────────────
// GLOBALS & STATE
// ─────────────────────────────────────────────
let scene, camera, renderer;
let clock, raycaster, mouse;
let animationId;
let currentSection = 0;
let totalSections = 5;
let isScrolling = false;
let scrollCooldown = false;

// 3D Objects
let starField, nebula, floatingCubes = [], orbGroup, groundGrid;
let geometricRings = [];
let particleSystem;
let waveField;

// Section world positions (camera Y positions)
const sectionPositions = [0, -5, -10, -15, -20];

// Theme colors per section
const sectionColors = [
    { primary: 0x6366f1, secondary: 0x00f5d4 },
    { primary: 0x8b5cf6, secondary: 0xf97316 },
    { primary: 0x06b6d4, secondary: 0x6366f1 },
    { primary: 0x00f5d4, secondary: 0xec4899 },
    { primary: 0xf97316, secondary: 0x6366f1 },
];

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initThreeJS();
    buildScene();
    initEvents();
    initCursor();
    startRenderLoop();
});

// ─────────────────────────────────────────────
// LOADER SEQUENCE
// ─────────────────────────────────────────────
function initLoader() {
    const bar = document.getElementById('loaderBar');
    const pct = document.getElementById('loaderPct');
    const txt = document.getElementById('loaderText');
    const loader = document.getElementById('loader');

    const messages = [
        'Initializing 3D World...',
        'Loading Neural Networks...',
        'Compiling Shaders...',
        'Spawning Particles...',
        'Calibrating Camera...',
        'Ready!'
    ];

    let progress = 0;
    let msgIndex = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 18 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            setTimeout(() => {
                loader.classList.add('fade-out');
                document.getElementById('hud').classList.remove('hidden');
                document.getElementById('hud').style.opacity = '1';
                gsap.fromTo('#hud', { opacity: 0 }, { opacity: 1, duration: 0.8 });
                showSection(0);
            }, 400);
        }

        bar.style.width = progress + '%';
        pct.textContent = Math.floor(progress) + '%';

        if (progress > (msgIndex + 1) * (100 / messages.length)) {
            msgIndex = Math.min(msgIndex + 1, messages.length - 1);
            txt.textContent = messages[msgIndex];
        }
    }, 100);
}

// ─────────────────────────────────────────────
// THREE.JS SETUP
// ─────────────────────────────────────────────
function initThreeJS() {
    const canvas = document.getElementById('threeCanvas');

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.012);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Helpers
    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

// ─────────────────────────────────────────────
// BUILD 3D SCENE
// ─────────────────────────────────────────────
function buildScene() {
    buildStarField();
    buildNebula();
    buildGroundGrid();
    buildFloatingGeometry();
    buildOrbCenter();
    buildParticleRing();
    buildSectionMarkers();
    buildLighting();
    buildWaveField();
}

function buildStarField() {
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 400;
        positions[i3 + 1] = (Math.random() - 0.5) * 200 - 10;
        positions[i3 + 2] = (Math.random() - 0.5) * 400;

        // Color variation: blue, purple, cyan
        const c = Math.random();
        if (c < 0.4) { colors[i3] = 0.4; colors[i3+1] = 0.4; colors[i3+2] = 1.0; }
        else if (c < 0.7) { colors[i3] = 0.6; colors[i3+1] = 0.3; colors[i3+2] = 1.0; }
        else { colors[i3] = 0.2; colors[i3+1] = 0.9; colors[i3+2] = 0.85; }

        sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

function buildNebula() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * 60 + 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.cos(phi) * 0.3 - 10;
        positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    nebula = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 1.5,
        color: 0x4040aa,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));

    scene.add(nebula);
}

function buildGroundGrid() {
    // Infinite grid extending below
    const gridHelper = new THREE.GridHelper(200, 40, 0x1a1a3e, 0x0f0f2a);
    gridHelper.position.y = -12;
    scene.add(gridHelper);

    // Glow plane
    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const planeMat = new THREE.MeshBasicMaterial({
        color: 0x050510,
        transparent: true,
        opacity: 0.5,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -12.1;
    scene.add(plane);
}

function buildFloatingGeometry() {
    const shapes = [
        { geo: new THREE.IcosahedronGeometry(0.8, 0), color: 0x6366f1, x: 14, y: 3, z: -5 },
        { geo: new THREE.OctahedronGeometry(0.6, 0), color: 0x00f5d4, x: -12, y: 2, z: -3 },
        { geo: new THREE.TetrahedronGeometry(0.7, 0), color: 0xec4899, x: 16, y: -2, z: -12 },
        { geo: new THREE.IcosahedronGeometry(0.5, 0), color: 0xf97316, x: -15, y: 1, z: -8 },
        { geo: new THREE.OctahedronGeometry(0.9, 0), color: 0x818cf8, x: 18, y: 4, z: -18 },
        { geo: new THREE.IcosahedronGeometry(0.6, 0), color: 0x00f5d4, x: -18, y: -3, z: -14 },
        { geo: new THREE.TetrahedronGeometry(0.8, 0), color: 0x6366f1, x: 12, y: 2, z: -22 },
        { geo: new THREE.OctahedronGeometry(0.5, 0), color: 0xec4899, x: -14, y: 3, z: -20 },
    ];

    shapes.forEach((s, i) => {
        const mat = new THREE.MeshStandardMaterial({
            color: s.color,
            wireframe: true,
            emissive: s.color,
            emissiveIntensity: 0.3,
        });
        const mesh = new THREE.Mesh(s.geo, mat);
        mesh.position.set(s.x, s.y, s.z);
        mesh.userData = {
            originalY: s.y,
            speed: 0.3 + Math.random() * 0.5,
            phaseOffset: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
        };
        scene.add(mesh);
        floatingCubes.push(mesh);
    });
}

function buildOrbCenter() {
    orbGroup = new THREE.Group();

    // Core sphere
    const coreGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x3730a3,
        emissiveIntensity: 1.5,
        wireframe: false,
        transparent: true,
        opacity: 0.9,
        metalness: 0.8,
        roughness: 0.2,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    orbGroup.add(core);

    // Wireframe outer sphere
    const outerGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const outerMat = new THREE.MeshBasicMaterial({
        color: 0x00f5d4,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    orbGroup.add(outer);

    // Rings
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(2.8 + i * 0.5, 0.02, 8, 80);
        const ringMat = new THREE.MeshBasicMaterial({
            color: [0x6366f1, 0x00f5d4, 0xec4899][i],
            transparent: true,
            opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        orbGroup.add(ring);
        geometricRings.push(ring);
    }

    orbGroup.position.set(8, 1, 0);
    scene.add(orbGroup);
}

function buildParticleRing() {
    const count = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const angle = (i / count) * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        const noise = (Math.random() - 0.5) * 0.5;

        positions[i3] = (Math.cos(angle) * radius + noise) + 8;
        positions[i3 + 1] = (Math.random() - 0.5) * 1.5 + 1;
        positions[i3 + 2] = (Math.sin(angle) * radius + noise);

        const t = i / count;
        colors[i3] = 0.4 + t * 0.4;
        colors[i3 + 1] = 0.3;
        colors[i3 + 2] = 1.0 - t * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    particleSystem = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));

    scene.add(particleSystem);
}

function buildSectionMarkers() {
    const labels = ['HOME', 'ABOUT', 'SKILLS', 'PROJECTS', 'CONTACT'];
    const sectionPositionsWorld = [0, -5, -10, -15, -20];

    sectionPositionsWorld.forEach((yPos, i) => {
        // Small glowing sphere marker
        const geo = new THREE.SphereGeometry(0.15, 8, 8);
        const mat = new THREE.MeshStandardMaterial({
            emissive: 0x6366f1,
            emissiveIntensity: 2,
            color: 0x6366f1,
        });
        const marker = new THREE.Mesh(geo, mat);
        marker.position.set(-6, yPos, 5);
        scene.add(marker);
    });
}

function buildWaveField() {
    const geo = new THREE.PlaneGeometry(40, 40, 60, 60);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x06071a,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
        emissive: 0x1a1aff,
        emissiveIntensity: 0.05,
    });
    waveField = new THREE.Mesh(geo, mat);
    waveField.position.set(0, -6, 0);
    scene.add(waveField);
}

function buildLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x0a0a2a, 0.6);
    scene.add(ambient);

    // Main directional
    const dirLight = new THREE.DirectionalLight(0x6366f1, 1.5);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Accent lights
    const light1 = new THREE.PointLight(0x00f5d4, 2, 30);
    light1.position.set(-8, 5, -5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xec4899, 1.5, 25);
    light2.position.set(8, -3, -10);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xf97316, 1.2, 20);
    light3.position.set(0, 8, 5);
    scene.add(light3);
}

// ─────────────────────────────────────────────
// RENDER LOOP
// ─────────────────────────────────────────────
function startRenderLoop() {
    function animate() {
        animationId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Animate starfield
        if (starField) {
            starField.rotation.y = elapsed * 0.008;
            starField.rotation.x = Math.sin(elapsed * 0.003) * 0.02;
        }

        // Animate nebula
        if (nebula) {
            nebula.rotation.y = elapsed * 0.004;
        }

        // Animate floating cubes
        floatingCubes.forEach(cube => {
            cube.rotation.x += cube.userData.rotSpeed;
            cube.rotation.y += cube.userData.rotSpeed * 0.7;
            cube.position.y = cube.userData.originalY +
                Math.sin(elapsed * cube.userData.speed + cube.userData.phaseOffset) * 0.8;
        });

        // Animate orb
        if (orbGroup) {
            orbGroup.rotation.y = elapsed * 0.3;
            geometricRings.forEach((ring, i) => {
                ring.rotation.z += 0.004 + i * 0.002;
                ring.rotation.x += 0.003;
            });

            // Pulsing scale
            const pulse = 1 + Math.sin(elapsed * 1.5) * 0.04;
            orbGroup.scale.setScalar(pulse);
        }

        // Animate particle ring
        if (particleSystem) {
            particleSystem.rotation.y = elapsed * 0.12;
        }

        // Animate wave field
        if (waveField) {
            const positions = waveField.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const z = positions.getZ(i);
                const y = Math.sin(x * 0.3 + elapsed * 0.8) * 0.4 +
                          Math.sin(z * 0.2 + elapsed * 0.6) * 0.4;
                positions.setY(i, y);
            }
            positions.needsUpdate = true;
        }

        // Mouse parallax on camera
        camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02;

        renderer.render(scene, camera);
    }

    animate();
}

// ─────────────────────────────────────────────
// SECTION NAVIGATION
// ─────────────────────────────────────────────
function showSection(index) {
    if (index < 0 || index >= totalSections) return;

    // Update HTML panels
    document.querySelectorAll('.panel').forEach((panel, i) => {
        panel.classList.toggle('active', i === index);
    });

    // Update indicator dots
    document.querySelectorAll('.indicator-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Hide scroll hint after first scroll
    if (index > 0) {
        document.getElementById('scrollHint').style.opacity = '0';
    }

    // Animate camera to section
    const targetY = sectionPositions[index];
    const targetZ = 20 + index * 0.5;

    gsap.to(camera.position, {
        y: targetY,
        z: targetZ,
        duration: 1.2,
        ease: 'power3.inOut',
    });

    // Transition scene color accent
    const colors = sectionColors[index];
    gsap.to(scene.fog.color, {
        r: ((colors.primary >> 16) & 255) / 255 * 0.05,
        g: ((colors.primary >> 8) & 255) / 255 * 0.05,
        b: (colors.primary & 255) / 255 * 0.08,
        duration: 1.5,
    });

    currentSection = index;
    isScrolling = false;
}

function navigateSection(dir) {
    if (scrollCooldown) return;
    const next = currentSection + dir;
    if (next < 0 || next >= totalSections) return;

    scrollCooldown = true;
    showSection(next);

    setTimeout(() => {
        scrollCooldown = false;
    }, 1200);
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
function initEvents() {
    // Wheel scroll
    window.addEventListener('wheel', (e) => {
        const dir = e.deltaY > 0 ? 1 : -1;
        navigateSection(dir);
    }, { passive: true });

    // Touch scroll
    let touchStart = 0;
    window.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', (e) => {
        const dy = touchStart - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 40) navigateSection(dy > 0 ? 1 : -1);
    }, { passive: true });

    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') navigateSection(1);
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') navigateSection(-1);
    });

    // Mouse move (parallax)
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) - 0.5;
        mouse.y = (e.clientY / window.innerHeight) - 0.5;
    });

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Menu trigger
    const menuTrigger = document.getElementById('menuTrigger');
    const sideMenu = document.getElementById('sideMenu');
    const menuClose = document.getElementById('menuClose');
    const menuBackdrop = sideMenu.querySelector('.menu-backdrop');

    function openMenu() {
        sideMenu.classList.add('open');
        menuTrigger.classList.add('active');
    }

    function closeMenu() {
        sideMenu.classList.remove('open');
        menuTrigger.classList.remove('active');
    }

    menuTrigger.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', closeMenu);

    // Menu navigation links
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIdx = parseInt(link.dataset.section);
            showSection(sectionIdx);
            closeMenu();
        });
    });

    // Indicator dots
    document.querySelectorAll('.indicator-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const sectionIdx = parseInt(dot.dataset.section);
            if (!scrollCooldown) {
                scrollCooldown = true;
                showSection(sectionIdx);
                setTimeout(() => { scrollCooldown = false; }, 1200);
            }
        });
    });

    // Explore button
    document.getElementById('exploreBtn').addEventListener('click', () => {
        navigateSection(1);
    });

    // Sound toggle
    const soundBtn = document.getElementById('soundToggle');
    const onIcon = document.getElementById('soundOnIcon');
    const offIcon = document.getElementById('soundOffIcon');
    let soundOn = true;

    soundBtn.addEventListener('click', () => {
        soundOn = !soundOn;
        onIcon.classList.toggle('hidden', !soundOn);
        offIcon.classList.toggle('hidden', soundOn);
    });
}

// ─────────────────────────────────────────────
// CUSTOM CURSOR
// ─────────────────────────────────────────────
function initCursor() {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);

    let rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        dot.style.left = x - 3 + 'px';
        dot.style.top = y - 3 + 'px';

        // Smooth ring follow
        rx += (x - rx - 16) * 0.15;
        ry += (y - ry - 16) * 0.15;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
    });

    function animRing() {
        requestAnimationFrame(animRing);
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
    }
    animRing();

    // Scale on hover
    document.querySelectorAll('button, a, [data-section]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.style.transform = 'scale(2.5)';
            ring.style.transform = 'scale(1.5)';
            ring.style.borderColor = 'rgba(99,102,241,0.8)';
        });
        el.addEventListener('mouseleave', () => {
            dot.style.transform = 'scale(1)';
            ring.style.transform = 'scale(1)';
            ring.style.borderColor = 'rgba(99,102,241,0.5)';
        });
    });
}

// ─────────────────────────────────────────────
// UTILITY: Animate text with glitch effect
// ─────────────────────────────────────────────
function glitchText(el, finalText) {
    const chars = '!@#$%^&*()_+=-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let iteration = 0;
    const maxIterations = 20;

    const interval = setInterval(() => {
        el.textContent = finalText
            .split('')
            .map((char, i) => {
                if (i < iteration) return char;
                return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');

        iteration += 0.5;
        if (iteration >= finalText.length) {
            clearInterval(interval);
            el.textContent = finalText;
        }
    }, 40);
}

// Apply glitch to hero name on load
window.addEventListener('load', () => {
    setTimeout(() => {
        const nameLines = document.querySelectorAll('.hero-name-line');
        nameLines.forEach((line, i) => {
            setTimeout(() => glitchText(line, line.textContent.trim()), i * 300);
        });
    }, 1500);
});
