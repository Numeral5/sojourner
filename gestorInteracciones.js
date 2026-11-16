
import * as THREE from 'three';

// ==========================================
// GESTOR DE INTERACCIONES CON OBJETOS 3D
// ==========================================

export class GestorInteracciones {

    constructor(camera, renderer, controls) {

        this.camera = camera;
        this.renderer = renderer;
        this.controls = controls;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(0, 0);

        this.objetos = [];
        this.panelAbierto = false;

        // Contenedor compartido de las interfaces
        this.contenedor = document.getElementById('contenedorHistoria');

        if (!this.contenedor) {
            throw new Error('No se encontró #contenedorHistoria en index.html');
        }

        // Detectar clics sobre el juego
        this.renderer.domElement.addEventListener('click', () => {
            this.detectarObjeto();
        });

        // Cerrar panel mediante botones
        this.contenedor.addEventListener('click', (event) => {

            const botonCerrar = event.target.closest(
                '[data-cerrar-panel], [data-st-action="close"]'
            );

            if (botonCerrar) {
                event.preventDefault();
                this.cerrarPanel();
            }

        });
    }

    // ==========================================
    // REGISTRAR OBJETOS INTERACTIVOS
    // ==========================================

    agregarObjeto(modelo, archivoHTML, inicializar = null) {

        this.objetos.push({
            modelo,
            archivoHTML,
            inicializar
        });

    }

    // ==========================================
    // DETECTAR OBJETO QUE MIRA EL JUGADOR
    // ==========================================

    detectarObjeto() {

        if (!this.controls.isLocked || this.panelAbierto) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const modelos = this.objetos.map(obj => obj.modelo);

        const intersecciones = this.raycaster.intersectObjects(
            modelos,
            true
        );

        if (intersecciones.length === 0) return;

        const objetoEncontrado = intersecciones[0].object;

        // Buscar el modelo registrado que contiene al objeto detectado
        const interaccion = this.objetos.find(obj => {

            let actual = objetoEncontrado;

            while (actual) {

                if (actual === obj.modelo) {
                    return true;
                }

                actual = actual.parent;
            }

            return false;

        });

        if (interaccion) {
            this.abrirPanel(interaccion);
        }

    }

    // ==========================================
    // ABRIR INTERFAZ
    // ==========================================

    async abrirPanel(interaccion) {

        if (this.panelAbierto) return;

        try {

            const respuesta = await fetch(interaccion.archivoHTML);

            if (!respuesta.ok) {
                throw new Error(
                    `No se pudo cargar la interfaz: ${respuesta.status}`
                );
            }

            const html = await respuesta.text();

            this.contenedor.innerHTML = html;

            this.contenedor.style.display = 'block';
            this.contenedor.style.position = 'fixed';
            this.contenedor.style.inset = '0';
            this.contenedor.style.zIndex = '1000';

            this.panelAbierto = true;

            // Liberar el mouse y mostrar la interfaz
            this.controls.unlock();

            // Ejecutar el JavaScript propio de esa terminal
            if (interaccion.inicializar) {
                await interaccion.inicializar(this.contenedor);
            }

        } catch (error) {

            console.error('Error al abrir la interfaz:', error);

            this.contenedor.innerHTML = '';
            this.contenedor.style.display = 'none';
            this.panelAbierto = false;

        }

    }

    // ==========================================
    // CERRAR INTERFAZ Y VOLVER AL JUEGO
    // ==========================================

    cerrarPanel() {

        if (!this.panelAbierto) return;

        this.contenedor.innerHTML = '';
        this.contenedor.style.display = 'none';

        this.panelAbierto = false;

        // Recuperar los controles del jugador
        this.controls.lock();

    }

}
