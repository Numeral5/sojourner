import * as THREE from 'three';
import { PointerLockControls } from
'three/examples/jsm/controls/PointerLockControls.js';
 
// ==========================================
// 1. ESCENA
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// ==========================================
// 2. CÁMARA
// ==========================================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 1.6, 10);

// ==========================================
// 3. RENDERIZADOR
// ==========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

document.body.appendChild(renderer.domElement);

// ==========================================
// 4. CONTROLES EN PRIMERA PERSONA
// ==========================================

const controls = new PointerLockControls(
    camera,
    renderer.domElement
);

// Velocidad del movimiento
const movementSpeed = 5;

// Activar los controles al hacer clic
renderer.domElement.addEventListener('click', () => {
    controls.lock();
});

// ==========================================
// 5. MENSAJE PARA ACTIVAR LA CÁMARA
// ==========================================

const instructions = document.createElement('div');

instructions.innerHTML = `
    <h2>Explorar Marte</h2>
    <p>Haz clic para comenzar</p>
    <p>W A S D - Moverse</p>
    <p>Mouse - Mirar alrededor</p>
    <p>ESC - Liberar el cursor</p>
`;

instructions.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    background: rgba(0,0,0,0.7);
    padding: 25px;
    text-align: center;
    font-family: Arial;
    cursor: pointer;
    z-index: 10;
`;

document.body.appendChild(instructions);

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
});

// ==========================================
// 6. TERRENO
// ==========================================

const geometry = new THREE.PlaneGeometry(100, 100);

const material = new THREE.MeshBasicMaterial({
    color: 0x8b4513,
    side: THREE.DoubleSide
});

const ground = new THREE.Mesh(geometry, material);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);

// ==========================================
// 7. MOVIMIENTO DEL JUGADOR
// ==========================================

// Registrar las teclas presionadas
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = true;
            break;

        case 'KeyS':
        case 'ArrowDown':
            keys.backward = true;
            break;

        case 'KeyA':
        case 'ArrowLeft':
            keys.left = true;
            break;

        case 'KeyD':
        case 'ArrowRight':
            keys.right = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = false;
            break;

        case 'KeyS':
        case 'ArrowDown':
            keys.backward = false;
            break;

        case 'KeyA':
        case 'ArrowLeft':
            keys.left = false;
            break;

        case 'KeyD':
        case 'ArrowRight':
            keys.right = false;
            break;
    }
});

// ==========================================
// 8. CICLO DE ANIMACIÓN
// ==========================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (controls.isLocked) {

        let forward = 0;
        let right = 0;

        if (keys.forward) forward += 1;
        if (keys.backward) forward -= 1;

        if (keys.right) right += 1;
        if (keys.left) right -= 1;

        // Evitar que el movimiento diagonal sea más rápido
        const length = Math.hypot(forward, right);

        if (length > 0) {
            forward /= length;
            right /= length;
        }

        // Mover la cámara
        controls.moveForward(forward * movementSpeed * delta);
        controls.moveRight(right * movementSpeed * delta);

        // Mantener la altura del jugador
        camera.position.y = 1.6;

        // Limitar el movimiento al terreno
        camera.position.x = THREE.MathUtils.clamp(
            camera.position.x, -49, 49
        );

        camera.position.z = THREE.MathUtils.clamp(
            camera.position.z, -49, 49
        );
    }

    renderer.render(scene, camera);
}

animate();

// ==========================================
// 9. ADAPTAR LA VENTANA
// ==========================================

window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});
