import * as THREE from 'three';
import { PointerLockControls } from
'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from
'three/addons/loaders/GLTFLoader.js';
//import { GestorInteracciones } from '/gestorInteracciones.js';
import { HistoriaTerminal } from '/recursos/historias/historiaP1.js';
import { inicializarModulo } from '/recursos/historias/modulo.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { inicializarSojou } from '/recursos/historias/sojou.js';




// ==========================================
// 1. ESCENA
// ==========================================
const scene = new THREE.Scene();
//scene.background = new THREE.Color(0xFF8000);

// ==========================================
// 2. CÁMARA
// ==========================================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

//camera.position.set(0, 1.6, 10);
camera.position.set(0, 5, 10);
// ==========================================
// 3. RENDERIZADOR
// ==========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

// Identificar el canvas del juego
renderer.domElement.id = 'mars-bg';

document.body.appendChild(renderer.domElement);

// ==========================================
// 4. CONTROLES EN PRIMERA PERSONA
// ==========================================

const controls = new PointerLockControls(
    camera,
    renderer.domElement
);

// ==========================================
// SISTEMA DE HISTORIA AUTOMÁTICA - PARTE 1
// ==========================================

const contenedorHistoria = document.getElementById('contenedorHistoria');

// Crear la terminal de historia
const terminalHistoria = new HistoriaTerminal(
    contenedorHistoria,
    controls
);

// Estado de la historia
let historiaAutomaticaAbierta = false;

let temporizadorHistoriaP1 = null;






const movementSpeed = 8;

// ==========================================
// SISTEMA DE FÍSICAS - RAPIER
// ==========================================

let physicsWorld;
let playerBody;
let playerCollider;
let characterController;
let verticalVelocity = 0;

const PHYSICS_GRAVITY = -3.71;
const PLAYER_EYE_OFFSET = 2.5;

async function inicializarFisicas() {

    await RAPIER.init();

    physicsWorld = new RAPIER.World({
        x: 0,
        y: PHYSICS_GRAVITY,
        z: 0
    });

    // Jugador: cuerpo cinemático
    const playerDesc =
        RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(
                camera.position.x,
                camera.position.y,
                camera.position.z
            );

    playerBody = physicsWorld.createRigidBody(playerDesc);

    // Cápsula del jugador
    const playerColliderDesc =
        RAPIER.ColliderDesc.capsule(2.5, 0.5);

    playerCollider = physicsWorld.createCollider(
        playerColliderDesc,
        playerBody
    );

    characterController =
    physicsWorld.createCharacterController(0.05);

// Configuración del movimiento
characterController.setMaxSlopeClimbAngle(
    45 * Math.PI / 180
);

characterController.enableAutostep(
    0.35,
    0.2,
    true
);

characterController.enableSnapToGround(0.25);

    console.log('Sistema de físicas inicializado');

}
await inicializarFisicas();


// ==========================================
// REGISTRO DE OBJETOS INTERACTIVOS
// ==========================================

const objetosInteractivos = [];

let objetoCercano = null;

function agregarObjetoInteractivo(
    objeto,
    nombre,
    archivoHTML,
    distancia = 15,
    inicializar = null
) {

    objetosInteractivos.push({
        objeto,
        nombre,
        archivoHTML,
        distancia,
        inicializar
    });

    console.log('Objeto interactivo registrado:', nombre);
}

////////////////////
// ==========================================
// PANEL DE HISTORIA
// ==========================================

const mensajeInteraccion = document.createElement('div');

mensajeInteraccion.innerHTML = `
    Presiona <strong>E</strong> para interactuar
`;

mensajeInteraccion.style.cssText = `
    position: absolute;
    bottom: 12%;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    background: rgba(0, 0, 0, 0.75);
    padding: 15px 25px;
    border-radius: 8px;
    font-family: Arial;
    display: none;
    z-index: 20;
`;

document.body.appendChild(mensajeInteraccion);


// Panel que mostrará la historia

const panelHistoria = document.createElement('div');

panelHistoria.style.cssText = `
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: none;
    z-index: 30;
    overflow-y: auto;
`;

panelHistoria.innerHTML = `
    <button id="cerrarHistoria" style="
        position: fixed;
        top: 20px;
        right: 25px;
        padding: 12px 20px;
        cursor: pointer;
        z-index: 40;
    ">
        Cerrar ✕
    </button>

    <div id="historiaContenido"></div>
`;

document.body.appendChild(panelHistoria);

const historiaContenido = panelHistoria.querySelector(
    '#historiaContenido'
);

const botonCerrar = panelHistoria.querySelector(
    '#cerrarHistoria'
);


/////////////////////

// =================================
// MÚSICA AMBIENTAL DE MARTE
// =================================

const musicaMarte = new Audio(
    'recursos/musica/hyperspace.mp3'
);

musicaMarte.volume = 0.9;
musicaMarte.loop = true;

function iniciarMusica() {

    if (musicaMarte.paused) {

        musicaMarte.play().catch(error => {
            console.log(
                'No se pudo reproducir el audio:',
                error
            );
        });

    }

}










// ==========================================
// PANTALLA DE INICIO - MISSION MARS
// ==========================================

let introActiva = true;
let introFinalizada = false;

// Obtener elementos HTML
const introOverlay = document.getElementById('intro-overlay');

const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

const btnStart = document.getElementById('btn-start');
const btnUnderstood1 = document.getElementById('btn-understood-1');
const btnUnderstood2 = document.getElementById('btn-understood-2');


// PASO 1 -> PASO 2

btnStart.addEventListener('click', () => {

    step1.classList.add('hidden');
    step2.classList.remove('hidden');

});


// PASO 2 -> PASO 3

btnUnderstood1.addEventListener('click', () => {

    step2.classList.add('hidden');
    step3.classList.remove('hidden');

});

// FINALIZAR INTRODUCCIÓN

btnUnderstood2.addEventListener('click', () => {

    introActiva = false;
    introFinalizada = true;

    introOverlay.classList.add('fade-out');

    // Iniciar música
    iniciarMusica();

    // Activar controles de primera persona
    controls.lock();

    setTimeout(() => {

        introOverlay.style.display = 'none';

    }, 800);


    // ======================================
    // HISTORIA PARTE 1 - APARECE A LOS 5 SEG
    // ======================================

    temporizadorHistoriaP1 = setTimeout(async () => {

        // Marcar que la historia está abierta
        historiaAutomaticaAbierta = true;

        // Ocultar el menú de pausa
        pauseOverlay.style.display = 'none';

        try {

            // Abrir la historia
            await terminalHistoria.abrir('/recursos/historias/historiaP1.html');

            console.log('Historia Parte 1 abierta correctamente');

        } catch (error) {

            historiaAutomaticaAbierta = false;

            console.error('Error al abrir la historia:', error);

        }

    }, 5000);

});
//////

// ==========================================
// MENÚ DE PAUSA
// ==========================================

const pauseOverlay = document.createElement('div');

pauseOverlay.innerHTML = `
    <h2>Exploración pausada</h2>
    <p>Haz clic para continuar</p>
`;

pauseOverlay.style.cssText = `
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: white;
    background: rgba(0,0,0,0.65);
    font-family: Arial;
    cursor: pointer;
    z-index: 15;
`;

document.body.appendChild(pauseOverlay);


// Reanudar exploración

pauseOverlay.addEventListener('click', () => {

    controls.lock();

});


// Detectar bloqueo y desbloqueo del mouse

controls.addEventListener('lock', () => {

    pauseOverlay.style.display = 'none';

});

controls.addEventListener('unlock', () => {
    const historiaVisible =
        contenedorHistoria.style.display === 'block';

    const panelVisible =
        panelHistoria.style.display === 'block';

    if (
        introFinalizada &&
        !historiaVisible &&
        !panelVisible
    ) {
        pauseOverlay.style.display = 'flex';
    }
});

// ==========================================
// DETECTAR OBJETO CERCANO
// ==========================================
function detectarObjetoCercano() {

    objetoCercano = null;

    if (!controls.isLocked) {
        mensajeInteraccion.style.display = 'none';
        return;
    }

    for (const item of objetosInteractivos) {

        const posicionObjeto = new THREE.Vector3();

        item.objeto.getWorldPosition(posicionObjeto);

        const distancia = camera.position.distanceTo(posicionObjeto);      
        if (distancia <= item.distancia) {
        objetoCercano = item;
        }
    }

    if (objetoCercano) {
        mensajeInteraccion.style.display = 'block';
    } else {
        mensajeInteraccion.style.display = 'none';
    }
}




// ==========================================
// ABRIR HISTORIA
// ==========================================

// ==========================================
// CERRAR HISTORIA
// ==========================================

function cerrarPanelHistoria() {

    panelHistoria.style.display = 'none';

    historiaContenido.innerHTML = '';

    botonCerrar.style.display = 'block';

    controls.lock();
}


// ==========================================
// ABRIR HISTORIA
// ==========================================

async function abrirHistoria(item) {

    if (!item) return;

    mensajeInteraccion.style.display = 'none';

    // Mostrar el panel antes de desbloquear el cursor.
    // Así el menú de pausa no aparece accidentalmente.
    panelHistoria.style.display = 'block';
    pauseOverlay.style.display = 'none';

    controls.unlock();

    // Las historias con inicializador propio
    // tienen su propio botón de cierre.
    botonCerrar.style.display = item.inicializar ? 'none' : 'block';

    historiaContenido.innerHTML = `
        <p style="
            color: white;
            text-align: center;
            margin-top: 100px;
            font-family: Arial;
        ">
            Cargando historia...
        </p>
    `;

    try {

        const respuesta = await fetch(item.archivoHTML);

        if (!respuesta.ok) {
            throw new Error('No se pudo cargar el archivo HTML');
        }

        const contenido = await respuesta.text();

        historiaContenido.innerHTML = contenido;

        // Inicializar el JavaScript propio de la historia.
        if (item.inicializar) {

            await item.inicializar(historiaContenido, {
                onClose: cerrarPanelHistoria
            });

        }

    } catch (error) {

        console.error('Error cargando la historia:', error);

        historiaContenido.innerHTML = `
            <p style="color: white; text-align: center;">
                No se pudo cargar la historia.
                Comprueba que el archivo HTML exista.
            </p>
        `;

        botonCerrar.style.display = 'block';
    }
}


// ==========================================
// EVENTO DEL BOTÓN EXTERIOR DE CERRAR
// ==========================================

botonCerrar.addEventListener('click', cerrarPanelHistoria);


// ==========================================
// TECLA E PARA INTERACTUAR
// ==========================================

document.addEventListener('keydown', (event) => {

    if (event.code === 'KeyE' && !event.repeat) {

        if (controls.isLocked && objetoCercano) {
            abrirHistoria(objetoCercano);
        }
    }
});

///////////
















/////
// Luz ambiental
const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.6
);

scene.add(ambientLight);

// Luz direccional (simula el Sol)
const sunlight = new THREE.DirectionalLight(
    0xffffff,
    2
);

sunlight.position.set(10, 20, 10);

scene.add(sunlight);

//////////////////////////////
// ===== CIELO MARCIANO =====

// Color del cielo: naranja rojizo
scene.background = new THREE.Color(0xEA9371);

// Bruma atmosférica

scene.fog = new THREE.Fog(0xEA9371, 100, 250);
///////////////////
// ===== SOL =====

const solGeometry = new THREE.SphereGeometry(3, 32, 32);

const solMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFECC4
});

const sol = new THREE.Mesh(solGeometry, solMaterial);

// Posición en el cielo
sol.position.set(-35, 35, -80);

scene.add(sol);


// ===== NUBES DE POLVO =====

const polvoMaterial = new THREE.MeshBasicMaterial({
    color: 0xd99a78,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
});

function crearNube(x, y, z, escalaX, escalaY) {

    const geometria = new THREE.CircleGeometry(1, 32);

    const nube = new THREE.Mesh(
        geometria,
        polvoMaterial
    );

    nube.position.set(x, y, z);
    nube.scale.set(escalaX, escalaY, 1);

    scene.add(nube);
}

crearNube(-25, 18, -65, 15, 4);
crearNube(20, 22, -75, 18, 5);
crearNube(45, 16, -90, 20, 4);




// ==========================================
// 6. TERRENO
// ==========================================

const geometry = new THREE.PlaneGeometry(
    600,
    600,
    450,
    450
);

const positions = geometry.attributes.position;

for (let i = 0; i < positions.count; i++) {

    const x = positions.getX(i);
    const y = positions.getY(i);

    const height =
        Math.sin(x * 0.15) * 0.8 +
        Math.cos(y * 0.12) * 0.6;

    positions.setZ(i, height);
}

geometry.computeVertexNormals();


const loader = new THREE.TextureLoader();
const BaseColor = loader.load('recursos/imagnes/Ground090_4K-PNG_Color.png');
const roughness = loader.load('recursos/imagnes/Ground090_4K-PNG_Roughness.png');
//const displacementMap = loader.load('recursos/imagnes/Ground090_4K-PNG_Displacement.png');
const ambientO = loader.load('recursos/imagnes/Ground090_4K-PNG_AmbientOcclusion.png');
const NormalMapGL = loader.load('recursos/imagnes/Ground090_4K-PNG_NormalGL.png');



BaseColor.wrapS = THREE.RepeatWrapping;
BaseColor.wrapT = THREE.RepeatWrapping;

BaseColor.repeat.set(11, 11);

roughness.wrapS = THREE.RepeatWrapping;
roughness.wrapT = THREE.RepeatWrapping;

roughness.repeat.set(11, 11);


//displacementMap.wrapS = THREE.RepeatWrapping;
//displacementMap.wrapT = THREE.RepeatWrapping;

//displacementMap.repeat.set(8, 8);


ambientO.wrapS = THREE.RepeatWrapping;
ambientO.wrapT = THREE.RepeatWrapping;

ambientO.repeat.set(11, 11);


NormalMapGL.wrapS = THREE.RepeatWrapping;
NormalMapGL.wrapT = THREE.RepeatWrapping;

NormalMapGL.repeat.set(11, 11);




const posiciones = geometry.attributes.position;
const colores = [];

for (let i = 0; i < posiciones.count; i++) {

    const x = posiciones.getX(i);
    const z = posiciones.getY(i);

    // Variaciones de color
    const variacion =
        Math.sin(x * 0.12 + z * 0.08) * 0.08 +
    Math.cos(x * 0.07 - z * 0.15) * 0.06;
    const rojo = 0.75 + variacion;
    const verde = 0.30 + variacion * 0.9;
    const azul = 0.20 + variacion * 0.5;

    colores.push(rojo, verde, azul);
}

geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colores, 3)
);


const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: BaseColor,
    roughnessMap: roughness,
    roughness: 1,
    //displacementMap : displacementMap,
    aoMap: ambientO,
    normalMap: NormalMapGL,
    side: THREE.DoubleSide



}); 

//material.color.set('#C77B45');

const ground = new THREE.Mesh(geometry, material);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);

//SOHOURNER

// SOJOURNER
const loaderSojo = new GLTFLoader();

loaderSojo.load(
    'recursos/modelos/SOJOURNER.glb',

    (gltf) => {

        const rover = gltf.scene;

        rover.position.set(-112, 0.7, -198);
        rover.scale.set(30, 30, 30);

        scene.add(rover);

        agregarColliderFijoDesdeModelo(rover, 0.85);

        // Registrar interacción con el Sojourner
        agregarObjetoInteractivo(
            rover,
            'Rover Sojourner',
            '/recursos/historias/sojou.html',
            30,
            inicializarSojou
        );

        console.log('Sojourner cargado e interactivo');

    },

    undefined,

    (error) => {
        console.error('Error cargando el Sojourner:', error);
    }
);

// ==========================================
// MÓDULO DE ATERRIZAJE
// ==========================================

let moduloAterrizaje;

const loaderModulo = new GLTFLoader();

loaderModulo.load(
    'recursos/modelos/Modulo de aterrizaje.glb',

    (gltf) => {

        moduloAterrizaje = gltf.scene;

        moduloAterrizaje.position.set(-60, 0, -190);

        moduloAterrizaje.scale.set(0.3, 0.3, 0.3);

        scene.add(moduloAterrizaje);

                agregarColliderFijoDesdeModelo(
            moduloAterrizaje,
            0.9
        );

        // Registrar interacción
            agregarObjetoInteractivo(
            moduloAterrizaje,
            'Módulo de aterrizaje',
            '/recursos/historias/modulo.html',
            30,
            inicializarModulo
        );

        console.log('Módulo de aterrizaje cargado e interactivo');

    },

    undefined,

    (error) => {
        console.error('Error cargando el módulo:', error);
    }
);



// ==========================================
// ROCAS0
// ==========================================

// ==========================================
// ROCAS - DISTRIBUCIÓN MARCIANA
// ==========================================

const loaderRoca = new GLTFLoader();
const loaderRoca02 = new GLTFLoader();
const loaderRoca03 = new GLTFLoader();


// Altura del terreno
function getTerrainHeight(x, z) {
    return Math.sin(x * 0.15) * 0.8 +
           Math.cos(z * 0.12) * 0.6;
}

// ==========================================
// COLLIDER DEL TERRENO
// ==========================================

function crearColliderTerreno() {

    // Geometría invisible de menor resolución
    const collisionGeometry = new THREE.PlaneGeometry(
        600,
        600,
        80,
        80
    );

    const positions = collisionGeometry.attributes.position;

    const vertices = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {

        const x = positions.getX(i);
        const localY = positions.getY(i);

        const z = -localY;

        vertices[i * 3] = x;
        vertices[i * 3 + 1] = getTerrainHeight(x, z);
        vertices[i * 3 + 2] = z;

    }

    const indices = new Uint32Array(
        collisionGeometry.index.array
    );

    const body = physicsWorld.createRigidBody(
        RAPIER.RigidBodyDesc.fixed()
    );

    const collider = RAPIER.ColliderDesc.trimesh(
        vertices,
        indices
    );

    physicsWorld.createCollider(collider, body);

    collisionGeometry.dispose();

    console.log('Collider del terreno creado');

}



// ==========================================
// COLLIDERS PARA MODELOS 3D
// ==========================================

function agregarColliderFijoDesdeModelo(objeto, factor = 0.9) {

    objeto.updateWorldMatrix(true, true);

    // Obtener dimensiones del modelo
    const box = new THREE.Box3().setFromObject(objeto);

    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    // Crear cuerpo físico fijo
    const body = physicsWorld.createRigidBody(
        RAPIER.RigidBodyDesc.fixed()
            .setTranslation(
                center.x,
                center.y,
                center.z
            )
    );

    // Crear collider de caja
    const collider = RAPIER.ColliderDesc.cuboid(
        Math.max(size.x * factor / 2, 0.08),
        Math.max(size.y * factor / 2, 0.08),
        Math.max(size.z * factor / 2, 0.08)
    );

    collider.setFriction(0.8);

    physicsWorld.createCollider(collider, body);



// Crear colisión del terreno
crearColliderTerreno();

// Ajustar jugador a la altura inicial del terreno
const alturaInicial = getTerrainHeight(
    camera.position.x,
    camera.position.z
);

const centroJugador = alturaInicial + 2.51;

playerBody.setTranslation({
    x: camera.position.x,
    y: centroJugador,
    z: camera.position.z
}, true);

camera.position.y = centroJugador + PLAYER_EYE_OFFSET;















}

// ==========================================
// MODELO 1 - ROCK001
// Rocas pequeñas, medianas y grandes
// ==========================================

const posicionesRocas = [

    // ORIGEN - alrededor del jugador
    { x: 5, z: -10, escala: 1.3 },
    { x: -37, z: -10, escala: 1 },
    { x: 30, z: -3, escala: 1.3 },
    { x: -12, z: -8, escala: 1.5 },
    { x: 15, z: 12, escala: 1.7 },
    { x: -20, z: 18, escala: 1 },
    { x: 25, z: -15, escala: 1.5 },
    { x: -30, z: -19, escala: 1.8 },
    { x: -15, z: -26, escala: 1.5 },
    { x: -39, z: 31, escala: 1.5 },
    { x: -28, z: 23, escala: 0.8 },
    { x: 35, z: 30, escala: 1.2 },
    { x: -40, z: -36, escala: 0.8 },

    // ZONA INTERMEDIA
    { x: 65, z: -60, escala: 5 },
    { x: -75, z: -65, escala: 3 },
    { x: 90, z: -40, escala: 4 },
    { x: -90, z: -35, escala: 3 },
    { x: 75, z: 55, escala: 4 },
    { x: -85, z: 60, escala: 3 },
    { x: 45, z: -95, escala: 3 },
    { x: -110, z: -70, escala: 4 },

    // ALREDEDORES DEL MÓDULO
    { x: -95, z: -129, escala: 7 },
    { x: -70, z: -134, escala: 1.5 },
    { x: -85, z: -110, escala: 2 },
    { x: -105, z: -101, escala: 5 },
    { x: -25, z: -145, escala: 6 },
    { x: -10, z: -120, escala: 2 },

    // LEJANÍA - formaciones grandes
    { x: -140, z: -160, escala: 8 },
    { x: -180, z: -100, escala: 9 },
    { x: -120, z: -190, escala: 7 },
    { x: -60, z: -190, escala: 9 },
    { x: 20, z: -200, escala: 10 },
    { x: 100, z: -180, escala: 8 },
    { x: 150, z: -130, escala: 9 },
    { x: 180, z: -60, escala: 7 },
    { x: -190, z: 20, escala: 8 },
    { x: 190, z: 90, escala: 9 },
    { x: -160, z: 140, escala: 7 }

];


// ==========================================
// MODELO 2 - ROCA2
// Variación de formas
// ==========================================

const posicionesRocas02 = [

    // ORIGEN
    { x: -20, z: 18, escala: 0.1 },
    { x: 25, z: -15, escala: 0.2 },
    { x: 10, z: 25, escala: 0.1 },
    { x: 12, z: -15, escala: 0.2 },
    { x: 8, z: 33, escala: 0.1 },
    { x: 28, z: -31, escala: 0.1 },
    { x: 28, z: 31, escala: 0.1 },
    { x: 22, z: 21, escala: 0.1 },
    { x: 15, z: 23, escala: 0.1 },
    { x: 35, z: 13, escala: 0.1},
    { x: -8, z: -1, escala: 0.2 },
    { x: -25, z: 20, escala: 0.3},

    // ZONA INTERMEDIA
    { x: 67, z: -23, escala: 2 },
    { x: -79, z: 70, escala: 3 },
    { x: 75, z: -79, escala: 2 },
    { x: 60, z: 71, escala: 4 },
    { x: -90, z: -100, escala: 1 },
    { x: -50, z: 65, escala: 2 },
    { x: 110, z: 30, escala: 1 },
    { x: -110, z: 35, escala: 0.9 },

    // ALREDEDORES DEL MÓDULO
    { x: -120, z: -115, escala: 3 },
    { x: -35, z: -150, escala: 2 },
    { x: -75, z: -155, escala: 2.5 },

    // LEJANÍA
    { x: -170, z: -175, escala: 5 },
    { x: -100, z: -205, escala: 5},
    { x: 60, z: -185, escala: 4 },
    { x: 140, z: -195, escala: 6.1 },
    { x: 200, z: -130, escala: 4 },
    { x: 180, z: 30, escala: 3.2 },
    { x: -200, z: -30, escala: 4 },
    { x: -180, z: 160, escala: 5.1 },
    { x: 130, z: 170, escala: 6 }

];


// ==========================================
// MODELO 3 - ROCA3
// Formaciones rocosas más llamativas
// ==========================================

const posicionesRocas03 = [

    // ORIGEN
    { x: -30, z: 41, escala: 4 },
    { x: 12, z: 23, escala: 3 },
    { x: -22, z: -25, escala: 1.5 },
    { x: 31, z: -15, escala: 2 },
    { x: 8, z: 33, escala: 1 },
    { x: 28, z: -20, escala: 4 },
    { x: -10, z: -15, escala: 3 },
    { x: -28, z: 20, escala: 4.5 },
    { x: 4, z: 10, escala: 5 },
    { x: 8, z: -7, escala: 2},
    { x: -27, z: 21, escala: 1 },

    // ZONA INTERMEDIA
    { x: 31, z: -75, escala: 4 },
    { x: 22, z: -90, escala: 3 },
    { x: -30, z: 80, escala: 3 },
    { x: -110, z: -40, escala: 4 },
    { x: 100, z: -100, escala: 5 },
    { x: 120, z: 65, escala: 4 },
    { x: -110, z: 85, escala: 4 },

    // ALREDEDORES DEL MÓDULO
    { x: -35, z: -125, escala: 3 },
    { x: -90, z: -145, escala: 4 },
    { x: -120, z: -90, escala: 3 },
    { x: -20, z: -165, escala: 3 },

    // LEJANÍA - rocas grandes
    { x: -195, z: -160, escala: 9 },
    { x: -130, z: -205, escala: 8 },
    { x: -35, z: -210, escala: 10 },
    { x: 75, z: -205, escala: 8 },
    { x: 160, z: -170, escala: 10 },
    { x: 205, z: -80, escala: 8 },
    { x: 190, z: 110, escala: 9 },
    { x: 100, z: 190, escala: 8 },
    { x: -100, z: 190, escala: 9 },
    { x: -205, z: 100, escala: 8 }

];


// ==========================================
// FUNCIÓN PARA COLOCAR LAS ROCAS
// ==========================================

function colocarRoca(roca, x, z, escala, rotacion = 0) {

    roca.scale.setScalar(escala);
    roca.rotation.y = rotacion;

    roca.position.set(x, 0, z);

    roca.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(roca);

    roca.position.y = getTerrainHeight(x, z) - box.min.y;

    scene.add(roca);
        // Agregar física a la roca
    agregarColliderFijoDesdeModelo(roca, 0.85);
}


// ==========================================
// CARGAR MODELO 1
// ==========================================

loaderRoca.load(
    'recursos/modelos/Rock001_LOD2.glb',

    (gltf) => {

        const rocaOriginal = gltf.scene;

        posicionesRocas.forEach((pos) => {

            const roca = rocaOriginal.clone(true);

            colocarRoca(
                roca,
                pos.x,
                pos.z,
                pos.escala,
                Math.random() * Math.PI * 2
            );

        });

        console.log("Modelo 1:", posicionesRocas.length, "rocas cargadas");
    },

    undefined,

    (error) => {
        console.error("Error cargando modelo 1:", error);
    }
);


// ==========================================
// CARGAR MODELO 2
// ==========================================

loaderRoca02.load(
    'recursos/modelos/Roca2.glb',

    (gltf) => {

        const rocaOriginal = gltf.scene;

        posicionesRocas02.forEach((pos) => {

            const roca = rocaOriginal.clone(true);

            colocarRoca(
                roca,
                pos.x,
                pos.z,
                pos.escala,
                Math.random() * Math.PI * 2
            );

        });

        console.log("Modelo 2:", posicionesRocas02.length, "rocas cargadas");
    },

    undefined,

    (error) => {
        console.error("Error cargando modelo 2:", error);
    }
);


// ==========================================
// CARGAR MODELO 3
// ==========================================

loaderRoca03.load(
    'recursos/modelos/roca3.glb',

    (gltf) => {

        const rocaOriginal = gltf.scene;

        posicionesRocas03.forEach((pos) => {

            const roca = rocaOriginal.clone(true);

            colocarRoca(
                roca,
                pos.x,
                pos.z,
                pos.escala,
                Math.random() * Math.PI * 2
            );

        });

        console.log("Modelo 3:", posicionesRocas03.length, "rocas cargadas");
    },

    undefined,

    (error) => {
        console.error("Error cargando modelo 3:", error);
    }
);






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

// Limpiar teclas cuando se libera el cursor
controls.addEventListener('unlock', () => {

    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;

});

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
    // Movimiento panorámico durante la introducción
   if (introActiva) {

    const tiempo = clock.elapsedTime;

    camera.rotation.y =
        Math.sin(tiempo * 0.25) * 0.10;

}

if (controls.isLocked) {

    let forward = 0;
    let right = 0;

    if (keys.forward) forward += 1;
    if (keys.backward) forward -= 1;

    if (keys.right) right += 1;
    if (keys.left) right -= 1;

    // Evitar velocidad diagonal adicional
    const length = Math.hypot(forward, right);

    if (length > 0) {
        forward /= length;
        right /= length;
    }

    // Dirección hacia adelante de la cámara
    const forwardDirection =
        camera.getWorldDirection(new THREE.Vector3());

    forwardDirection.y = 0;
    forwardDirection.normalize();

    // Dirección lateral
    const rightDirection =
        new THREE.Vector3().crossVectors(
            forwardDirection,
            camera.up
        ).normalize();

    // Movimiento deseado
    const desiredMovement = new THREE.Vector3();

    desiredMovement.addScaledVector(
        forwardDirection,
        forward * movementSpeed * delta
    );

    desiredMovement.addScaledVector(
        rightDirection,
        right * movementSpeed * delta
    );

    // Gravedad marciana
    verticalVelocity -= 3.71 * delta;

    desiredMovement.y = verticalVelocity * delta;

    // Calcular movimiento permitido
    characterController.computeColliderMovement(
        playerCollider,
        {
            x: desiredMovement.x,
            y: desiredMovement.y,
            z: desiredMovement.z
        }
    );

    // Obtener desplazamiento corregido
    const correctedMovement =
        characterController.computedMovement();

    // Posición actual del jugador
    const currentPosition = playerBody.translation();

    // Aplicar movimiento al cuerpo cinemático
    playerBody.setNextKinematicTranslation({

        x: currentPosition.x + correctedMovement.x,

        y: currentPosition.y + correctedMovement.y,

        z: currentPosition.z + correctedMovement.z

    });

    // Comprobar si está apoyado en el suelo
    if (characterController.computedGrounded()) {
        verticalVelocity = 0;
    }

            const posicionJugador = playerBody.translation();

        camera.position.set(
            posicionJugador.x,
            posicionJugador.y + 2.5,
            posicionJugador.z
        );

}
    // Actualizar física
     physicsWorld.timestep = delta;
    physicsWorld.step();



    // Detectar si el jugador está cerca de un objeto interactivo
    detectarObjetoCercano();
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

