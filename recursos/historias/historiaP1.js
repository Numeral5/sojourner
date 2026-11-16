// terminalController.js (ES Module)
export class HistoriaTerminal {
  constructor(containerElement, pointerLockControls) {
    this.container = containerElement;
    this.controls = pointerLockControls;
    this.current = 0;
    this.isAnimating = false;
    this.timer = null;
  }

  async abrir(rutaHtml = './historiaP1.html') {
    const res = await fetch(rutaHtml);
    this.container.innerHTML = await res.text();
    this.container.style.display = 'block';

    // Liberar el cursor para que el jugador pueda hacer clic en la terminal
    if (this.controls?.isLocked) {
      this.controls.unlock();
    }

    this._inicializarDOM();
  }

  cerrar() {
    if (this.timer) clearInterval(this.timer);
    this.videos?.forEach(v => v.pause());
    this.container.innerHTML = '';
    this.container.style.display = 'none';

    // Devolver el control de la cámara al jugador
    if (this.controls && !this.controls.isLocked) {
      this.controls.lock();
    }
  }

  _inicializarDOM() {
    this.root = this.container.querySelector('#hp1-root');
    this.scenes = [...this.root.querySelectorAll('.hp1-scene')];
    this.videos = [...this.root.querySelectorAll('.hp1-scene-video')];
    this.dots = [...this.root.querySelectorAll('.hp1-dot')];
    this.prevBtn = this.root.querySelector('[data-hp1-action="prev"]');
    this.nextBtn = this.root.querySelector('[data-hp1-action="next"]');
    this.current = 0;

    // Guardar textos originales para el efecto máquina de escribir
    this.textData = this.scenes.map(scene => {
      const p1 = scene.querySelector('.hp1-story-copy');
      const p2 = scene.querySelector('.hp1-story-copy-short');
      const bottomBox = scene.querySelector('.hp1-info-bottom');
      return {
        el1: p1, html1: p1 ? p1.innerHTML.trim() : '',
        el2: p2, html2: p2 ? p2.innerHTML.trim() : '',
        bottomBox
      };
    });

    // Delegación de eventos en los botones del componente
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-hp1-action]');
      if (!btn) return;
      const action = btn.dataset.hp1Action;

      if (action === 'prev') this._cambiarEscena(-1);
      if (action === 'next') this._cambiarEscena(1);
      if (action === 'close-terminal') this.cerrar();
      if (action === 'toggle-crt') {
        const crt = this.root.querySelector('#hp1-crt');
        const status = this.root.querySelector('#hp1-crt-status');
        crt.classList.toggle('hp1-hidden');
        status.textContent = crt.classList.contains('hp1-hidden') ? 'DESACTIVADO' : 'ACTIVADO';
      }
    });

    this._reproducirVideoActual();
    this._iniciarEscritura(0);
  }

  _cambiarEscena(dir) {
    if (this.isAnimating) return;
    const target = this.current + dir;
    if (target < 0 || target >= this.scenes.length) return;

    this.isAnimating = true;
    const outScene = this.scenes[this.current];
    const inScene = this.scenes[target];

    const outClass = dir > 0 ? 'hp1-leave-left' : 'hp1-leave-right';
    const inClass  = dir > 0 ? 'hp1-enter-right' : 'hp1-enter-left';

    outScene.classList.remove('hp1-active');
    outScene.classList.add(outClass);
    inScene.classList.add(inClass);

    this.current = target;
    this.dots.forEach((d, i) => d.classList.toggle('hp1-active', i === this.current));
    this.prevBtn.disabled = this.current === 0;
    this.nextBtn.disabled = this.current === this.scenes.length - 1;
    this.nextBtn.textContent = this.current === this.scenes.length - 1 ? 'FIN' : 'SIGUIENTE →';

    this._reproducirVideoActual();
    this._iniciarEscritura(this.current);

    setTimeout(() => {
      outScene.classList.remove(outClass);
      inScene.classList.remove(inClass);
      inScene.classList.add('hp1-active');
      this.isAnimating = false;
    }, 520);
  }

  _reproducirVideoActual() {
    this.videos.forEach((v, i) => {
      if (i === this.current) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  _iniciarEscritura(idx) {
    if (this.timer) clearInterval(this.timer);
    const data = this.textData[idx];
    if (!data) return;

    data.bottomBox?.classList.remove('hp1-visible');
    data.el1.innerHTML = '';
    data.el2.innerHTML = '';

    this._typeWriter(data.el1, data.html1, 28, () => {
      data.bottomBox?.classList.add('hp1-visible');
      this._typeWriter(data.el2, data.html2, 28);
    });
  }

  _typeWriter(el, html, speed, onComplete) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const segments = [...temp.childNodes].map(n => ({
      text: n.textContent,
      className: n.nodeType === Node.ELEMENT_NODE ? n.className : null
    }));

    el.classList.add('hp1-typing-cursor');
    let segIdx = 0, charIdx = 0, span = null;

    this.timer = setInterval(() => {
      if (segIdx >= segments.length) {
        clearInterval(this.timer);
        el.classList.remove('hp1-typing-cursor');
        if (onComplete) onComplete();
        return;
      }
      const seg = segments[segIdx];
      if (charIdx === 0) {
        span = seg.className ? Object.assign(document.createElement('span'), { className: seg.className }) : null;
        if (span) el.appendChild(span);
      }
      const ch = seg.text[charIdx++];
      span ? (span.textContent += ch) : el.appendChild(document.createTextNode(ch));

      if (charIdx >= seg.text.length) {
        segIdx++;
        charIdx = 0;
      }
    }, speed);
  }
}