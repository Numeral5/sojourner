
export function inicializarSojou(contenedor, opciones = {}) {

    const { onClose = () => {} } = opciones;

    // ==========================================
    // 1. ELEMENTOS DE LA TERMINAL
    // ==========================================

    const terminal = contenedor.querySelector('#story-terminal-root');

    if (!terminal) {
        throw new Error('No se encontró la terminal del Sojourner');
    }

    const escenas = [...terminal.querySelectorAll('.story-terminal__scene')];

    const videos = [...terminal.querySelectorAll('.story-terminal__scene-video')];

    const botonSiguiente = terminal.querySelector('#story-terminal-btn-next');
    const botonAnterior = terminal.querySelector('#story-terminal-btn-prev');

    const capaCRT = terminal.querySelector('#story-terminal-crt');
    const estadoCRT = terminal.querySelector('#story-terminal-crt-status');

    const warpFlash = terminal.querySelector('#story-terminal-warp-flash');

    let escenaActual = 0;
    let isAnimating = false;
    let terminalAbierta = true;
    let temporizadorCambio = null;
    let temporizadorEscritura = null;

    // ==========================================
    // 2. EFECTO DE ESCRITURA
    // ==========================================

    function typeWriter(element, htmlContent, speed = 12) {

        if (temporizadorEscritura) {
            clearInterval(temporizadorEscritura);
            temporizadorEscritura = null;
    }
    const temporal = document.createElement('div');
        temporal.innerHTML = htmlContent;
    // Clonar la estructura HTML conservando etiquetas como <strong>.
    const clon = temporal.cloneNode(true);

    const textosOriginales = [];
    const textosClonados = [];

    function preparar(original, copia) {

        [...original.childNodes].forEach((nodo, indice) => {

         const copiaNodo = copia.childNodes[indice];

        if (nodo.nodeType === Node.TEXT_NODE) {

            textosOriginales.push(nodo.nodeValue);
            textosClonados.push(copiaNodo);

        copiaNodo.nodeValue = '';

        } else if (nodo.nodeType === Node.ELEMENT_NODE) {

        preparar(nodo, copiaNodo);

         }
    });
    }

    preparar(temporal, clon);

    element.innerHTML = '';
     element.append(...clon.childNodes);

     let indiceTexto = 0;
    let indiceCaracter = 0;

        temporizadorEscritura = setInterval(() => {

    if (!terminalAbierta) {
     clearInterval(temporizadorEscritura);
     temporizadorEscritura = null;
    return;
        }

    if (indiceTexto >= textosOriginales.length) {

        clearInterval(temporizadorEscritura);
        temporizadorEscritura = null;
        return;
        }

     const texto = textosOriginales[indiceTexto];
    const nodo = textosClonados[indiceTexto];

            nodo.nodeValue += texto.charAt(indiceCaracter);

            indiceCaracter++;

            if (indiceCaracter >= texto.length) {
                indiceTexto++;
                indiceCaracter = 0;
            }

        }, speed);
    }

    function iniciarTextoEscena(indice) {

        const parrafo = escenas[indice]?.querySelector(
            '.story-terminal__story-copy'
        );

        if (!parrafo) return;

        const textoCompleto = parrafo.dataset.full || '';

        typeWriter(parrafo, textoCompleto, 10);
    }

    // ==========================================
    // 3. VIDEOS
    // ==========================================

    function reproducirVideoActual() {

        videos.forEach(video => {

            const escenaVideo = video.closest(
                '.story-terminal__scene'
            );

            const esVideoActual = escenaVideo === escenas[escenaActual];

        if (esVideoActual) {

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

    // ==========================================
    // 4. EFECTO DE DESTELLO
    // ==========================================

    function activarDestello() {

        if (!warpFlash) return;

        warpFlash.classList.remove(
            'story-terminal__warp-flash--trigger'
        );

        // Reiniciar la animación.
        void warpFlash.offsetWidth;

        warpFlash.classList.add(
            'story-terminal__warp-flash--trigger'
        );
    }

    // ==========================================
    // 5. ACTUALIZAR BOTONES
    // ==========================================

    function actualizarBotones() {

        botonAnterior.disabled = escenaActual === 0;

        botonSiguiente.disabled =
            escenaActual === escenas.length - 1;
    }

    // ==========================================
    // 6. MOSTRAR ESCENA
    // ==========================================

    function mostrarEscena(indice) {

        escenas.forEach((escena, i) => {

            const activa = i === indice;

            escena.classList.toggle(
                'story-terminal__scene--active',
                activa
            );

            escena.classList.remove(
                'story-terminal__scene--leaving'
            );

            escena.setAttribute(
                'aria-hidden',
                activa ? 'false' : 'true'
            );
        });

        escenaActual = indice;

        actualizarBotones();

        iniciarTextoEscena(escenaActual);

        reproducirVideoActual();
    }

    // ==========================================
    // 7. CAMBIAR DE ESCENA
    // ==========================================

    function cambiarEscena(direccion) {

        if (!terminalAbierta || isAnimating) return;

        const destino = escenaActual + direccion;

        if (destino < 0 || destino >= escenas.length) return;

        isAnimating = true;

        activarDestello();

        const escenaSaliente = escenas[escenaActual];

        escenaSaliente.classList.remove(
            'story-terminal__scene--active'
        );

        escenaSaliente.classList.add(
            'story-terminal__scene--leaving'
        );

        escenaSaliente.setAttribute('aria-hidden', 'true');

        if (temporizadorEscritura) {
            clearInterval(temporizadorEscritura);
            temporizadorEscritura = null;
        }

        videos.forEach(video => video.pause());

        temporizadorCambio = setTimeout(() => {

            if (!terminalAbierta) return;

            mostrarEscena(destino);

            isAnimating = false;

            temporizadorCambio = null;

        }, 320);
    }

    // ==========================================
    // 8. ACTIVAR / DESACTIVAR CRT
    // ==========================================

    function alternarCRT() {

        const desactivado = capaCRT.classList.toggle(
            'story-terminal--hidden'
        );

        estadoCRT.textContent = desactivado ? 'OFF' : 'ON';
    }

    // ==========================================
    // 9. CERRAR TERMINAL
    // ==========================================

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

        terminal.removeEventListener('click', manejarClick);
        document.removeEventListener('keydown', manejarTeclado);

        onClose();
    }

    // ==========================================
    // 10. EVENTOS DE BOTONES
    // ==========================================

    function manejarClick(event) {

        const boton = event.target.closest('[data-st-action]');

        if (!boton || !terminalAbierta) return;

        switch (boton.dataset.stAction) {

            case 'next-scene':
                cambiarEscena(1);
                break;

            case 'prev-scene':
                cambiarEscena(-1);
                break;

            case 'toggle-crt':
                alternarCRT();
                break;

            case 'close':
                cerrarTerminal();
                break;
        }
    }

    // ==========================================
    // 11. TECLAS DE NAVEGACIÓN
    // ==========================================

    function manejarTeclado(event) {

        if (!terminalAbierta || event.repeat) return;

        if (
            event.code === 'ArrowUp' ||
            event.code === 'ArrowRight'
        ) {

            event.preventDefault();
            cambiarEscena(1);

        }

        if (
            event.code === 'ArrowDown' ||
            event.code === 'ArrowLeft'
        ) {

            event.preventDefault();
            cambiarEscena(-1);

        }
    }

    terminal.addEventListener('click', manejarClick);

    document.addEventListener('keydown', manejarTeclado);

    // ==========================================
    // 12. INICIAR TERMINAL
    // ==========================================

    mostrarEscena(0);

    console.log('Terminal del Sojourner inicializada');

    return cerrarTerminal;
}
