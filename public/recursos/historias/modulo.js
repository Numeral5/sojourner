// ==========================================
// TERMINAL DEL MÓDULO DE ATERRIZAJE
// ==========================================

export function inicializarModulo(contenedor, opciones = {}) {

    const { onClose = () => {} } = opciones;

    // Buscar elementos dentro de esta terminal
    const descarga = contenedor.querySelector('#story-terminal-download');
    const escenasContenedor = contenedor.querySelector('#story-terminal-scenes');
    const footer = contenedor.querySelector('#story-terminal-footer');

    const escenas = [...contenedor.querySelectorAll('.story-terminal__scene')];
    const videos = [...contenedor.querySelectorAll('.story-terminal__video')];
    const botonAnterior = contenedor.querySelector('#story-terminal-prev');
    const botonSiguiente = contenedor.querySelector('#story-terminal-next');
    const puntos = [...contenedor.querySelectorAll('#story-terminal-dots .story-terminal__dot')];

    const capaCRT = contenedor.querySelector('#story-terminal-crt');
    const estadoCRT = contenedor.querySelector('#story-terminal-crt-status');

    let escenaActual = 0;
    let temporizadorEscritura = null;
    let temporizadorCambio = null;
    let terminalAbierta = true;

    // ======================================
    // EFECTO DE ESCRITURA
    // ======================================

    function efectoEscritura(escena) {

        if (temporizadorEscritura) {
            clearInterval(temporizadorEscritura);
            temporizadorEscritura = null;
        }

        const parrafo = escena.querySelector('.story-terminal__copy');

        if (!parrafo) return;

        const textoHTML = parrafo.dataset.fulltext || '';

        // Escribir primero el texto sin etiquetas HTML.
        // Al terminar, restaurar el formato original.
        const elementoTemporal = document.createElement('div');
        elementoTemporal.innerHTML = textoHTML;

        const textoPlano = elementoTemporal.textContent;

        parrafo.textContent = '';
        parrafo.classList.add('story-terminal__typing-cursor');

        let indice = 0;

        temporizadorEscritura = setInterval(() => {

            if (!terminalAbierta) {
                clearInterval(temporizadorEscritura);
                temporizadorEscritura = null;
                return;
            }

            if (indice < textoPlano.length) {

                parrafo.textContent += textoPlano.charAt(indice);
                indice++;

            } else {

                clearInterval(temporizadorEscritura);
                temporizadorEscritura = null;

                // Recuperar negritas y formato original
                parrafo.innerHTML = textoHTML;

                parrafo.classList.remove('story-terminal__typing-cursor');
            }

        }, 15);
    }

    // ======================================
    // REPRODUCIR VIDEO DE LA ESCENA ACTUAL
    // ======================================

    function reproducirVideoActual() {

        videos.forEach(video => {

            const escenaVideo = video.closest('.story-terminal__scene');

            if (escenaVideo === escenas[escenaActual]) {

                video.currentTime = 0;

                video.play().catch(error => {
                    console.warn('No se pudo reproducir el video:', error);
                });

            } else {

                video.pause();
                video.currentTime = 0;

            }
        });
    }

    // ======================================
    // ACTUALIZAR NAVEGACIÓN
    // ======================================

    function actualizarNavegacion() {

        puntos.forEach((punto, indice) => {

            punto.classList.toggle(
                'story-terminal__dot--active',
                indice === escenaActual
            );

        });

        botonAnterior.disabled = escenaActual === 0;

        botonSiguiente.disabled = false;

        botonSiguiente.textContent =
            escenaActual === escenas.length - 1
                ? 'FIN'
                : 'SIGUIENTE →';
    }

    // ======================================
    // MOSTRAR UNA ESCENA
    // ======================================

    function mostrarEscena(indice) {

        escenas.forEach((escena, i) => {

            escena.classList.remove(
                'active',
                'story-terminal__scene--active',
                'leaving',
                'story-terminal__scene--leaving'
            );

            if (i === indice) {

                escena.classList.add(
                    'active',
                    'story-terminal__scene--active'
                );

            }

        });

        escenaActual = indice;

        actualizarNavegacion();
        reproducirVideoActual();
        efectoEscritura(escenas[escenaActual]);
    }

    // ======================================
    // CAMBIAR DE ESCENA
    // ======================================

    function cambiarEscena(direccion) {

        const destino = escenaActual + direccion;

        if (destino < 0 || destino >= escenas.length) return;

        if (temporizadorCambio) {
            clearTimeout(temporizadorCambio);
        }

        const escenaSaliente = escenas[escenaActual];

        escenaSaliente.classList.remove(
            'active',
            'story-terminal__scene--active'
        );

        escenaSaliente.classList.add(
            'leaving',
            'story-terminal__scene--leaving'
        );

        temporizadorCambio = setTimeout(() => {

            escenaSaliente.classList.remove(
                'leaving',
                'story-terminal__scene--leaving'
            );

            mostrarEscena(destino);

        }, 260);
    }

    // ======================================
    // COMENZAR TRANSMISIÓN
    // ======================================

    function comenzarTransmision() {

        descarga.style.opacity = '0';
        descarga.style.transform = 'scale(0.92)';

        setTimeout(() => {

            if (!terminalAbierta) return;

            descarga.classList.add('story-terminal--hidden');

            escenasContenedor.classList.remove('story-terminal--hidden');

            footer.classList.remove('story-terminal--hidden');
            footer.style.display = 'flex';

            mostrarEscena(0);

        }, 280);
    }

    // ======================================
    // ACTIVAR / DESACTIVAR EFECTO CRT
    // ======================================

    function alternarCRT() {

        capaCRT.classList.toggle('story-terminal__crt--off');

        const desactivado =
            capaCRT.classList.contains('story-terminal__crt--off');

        estadoCRT.textContent =
            desactivado ? 'DESACTIVADO' : 'ACTIVADO';
    }

    // ======================================
    // CERRAR TERMINAL
    // ======================================

    function cerrarTerminal() {

        if (!terminalAbierta) return;

        terminalAbierta = false;

        if (temporizadorEscritura) {
            clearInterval(temporizadorEscritura);
        }

        if (temporizadorCambio) {
            clearTimeout(temporizadorCambio);
        }

        videos.forEach(video => {
            video.pause();
        });

        document.removeEventListener('keydown', detectarEscape);

        onClose();
    }

    function detectarEscape(event) {

        if (event.code === 'Escape' && terminalAbierta) {

            event.preventDefault();
            cerrarTerminal();

        }
    }

    // ======================================
    // EVENTOS DE LOS BOTONES
    // ======================================

    contenedor.addEventListener('click', (event) => {

        const boton = event.target.closest('[data-st-action]');

        if (!boton || !terminalAbierta) return;

        const accion = boton.dataset.stAction;

        switch (accion) {

            case 'start-transmission':
                comenzarTransmision();
                break;

            case 'next':
                cambiarEscena(1);
                break;

            case 'prev':
                cambiarEscena(-1);
                break;

            case 'toggle-crt':
                alternarCRT();
                break;

            case 'close':
                cerrarTerminal();
                break;
        }
    });

    document.addEventListener('keydown', detectarEscape);

    // Preparar botones y videos
    actualizarNavegacion();

    console.log('Terminal del módulo inicializada correctamente');

    // Devolver una función para limpiar la terminal si fuera necesario
    return cerrarTerminal;
}