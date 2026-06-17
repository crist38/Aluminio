/**
 * canvas-interactive.js — Lógica de interacción CAD
 * Permite cambiar el tamaño arrastrando bordes y sincroniza inputs flotantes
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;

  const inpAncho = document.getElementById('inp-ancho');
  const inpAlto = document.getElementById('inp-alto');
  const cadWidthInput = document.getElementById('cad-width-input');
  const cadHeightInput = document.getElementById('cad-height-input');

  let activeDrag = null; // 'width' | 'height' | null
  let startX = 0;
  let startY = 0;
  let startVal = 0;

  // --- Sincronizar inputs flotantes sobre CAD con inputs del formulario ---
  function syncInputsToCAD() {
    if (inpAncho && cadWidthInput) {
      cadWidthInput.value = Math.round(inpAncho.value) || 1200;
    }
    if (inpAlto && cadHeightInput) {
      cadHeightInput.value = Math.round(inpAlto.value) || 1000;
    }
  }

  // Escuchar inputs del formulario para sincronizar con CAD
  if (inpAncho) inpAncho.addEventListener('input', syncInputsToCAD);
  if (inpAlto) inpAlto.addEventListener('input', syncInputsToCAD);

  // También sincroniza en cualquier cambio de subtipo
  document.addEventListener('click', (e) => {
    if (e.target.closest('.option-card') || e.target.closest('.product-card') || e.target.closest('.back-btn')) {
      setTimeout(syncInputsToCAD, 50);
    }
  });

  // Escuchar inputs sobre CAD para actualizar formulario y redibujar
  if (cadWidthInput) {
    cadWidthInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value) || 100;
      if (val < 100) val = 100;
      if (val > 10000) val = 10000;
      if (inpAncho) inpAncho.value = val;
      
      // Redibujar
      if (typeof CanvasDraw !== 'undefined' && typeof Wizard !== 'undefined') {
        CanvasDraw.drawPreview(Wizard.getCfg());
      }
    });
  }

  if (cadHeightInput) {
    cadHeightInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value) || 100;
      if (val < 100) val = 100;
      if (val > 10000) val = 10000;
      if (inpAlto) inpAlto.value = val;
      
      // Redibujar
      if (typeof CanvasDraw !== 'undefined' && typeof Wizard !== 'undefined') {
        CanvasDraw.drawPreview(Wizard.getCfg());
      }
    });
  }

  // --- Drag-to-resize en Canvas ---
  canvas.addEventListener('mousemove', (e) => {
    if (activeDrag) return; // Ya estamos arrastrando
    
    if (typeof CanvasDraw === 'undefined' || !CanvasDraw.getLatestBox) return;
    const box = CanvasDraw.getLatestBox();
    if (!box) return;

    const rect = canvas.getBoundingClientRect();
    // Obtener mouse relativo a la resolución lógica del canvas
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Detectar borde derecho: x = ox + dw
    const distRight = Math.abs(mouseX - (box.ox + box.dw));
    // Detectar borde superior: y = oy
    const distTop = Math.abs(mouseY - box.oy);

    // Prioridad borde derecho
    if (distRight < 16 && mouseY >= box.oy && mouseY <= box.oy + box.dh) {
      canvas.style.cursor = 'ew-resize';
    } else if (distTop < 16 && mouseX >= box.ox && mouseX <= box.ox + box.dw) {
      canvas.style.cursor = 'ns-resize';
    } else {
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (typeof CanvasDraw === 'undefined' || !CanvasDraw.getLatestBox) return;
    const box = CanvasDraw.getLatestBox();
    if (!box) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const distRight = Math.abs(mouseX - (box.ox + box.dw));
    const distTop = Math.abs(mouseY - box.oy);

    if (distRight < 16 && mouseY >= box.oy && mouseY <= box.oy + box.dh) {
      activeDrag = 'width';
      startX = e.clientX;
      startVal = box.anchoMm;
      canvas.style.cursor = 'ew-resize';
      e.preventDefault();
    } else if (distTop < 16 && mouseX >= box.ox && mouseX <= box.ox + box.dw) {
      activeDrag = 'height';
      startY = e.clientY;
      startVal = box.altoMm;
      canvas.style.cursor = 'ns-resize';
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!activeDrag) return;

    if (typeof CanvasDraw === 'undefined' || !CanvasDraw.getLatestBox) return;
    const box = CanvasDraw.getLatestBox();
    if (!box) return;

    const rect = canvas.getBoundingClientRect();

    if (activeDrag === 'width') {
      const deltaPx = ((e.clientX - startX) / rect.width) * canvas.width;
      const deltaMm = (deltaPx / box.ratio) * 1000;
      let newVal = Math.round(startVal + deltaMm);
      if (newVal < 100) newVal = 100;
      if (newVal > 10000) newVal = 10000;

      if (inpAncho) inpAncho.value = newVal;
      if (cadWidthInput) cadWidthInput.value = newVal;
      
      if (typeof Wizard !== 'undefined') {
        CanvasDraw.drawPreview(Wizard.getCfg());
      }
    } else if (activeDrag === 'height') {
      const deltaPx = ((startY - e.clientY) / rect.height) * canvas.height;
      const deltaMm = (deltaPx / box.ratio) * 1000;
      let newVal = Math.round(startVal + deltaMm);
      if (newVal < 100) newVal = 100;
      if (newVal > 10000) newVal = 10000;

      if (inpAlto) inpAlto.value = newVal;
      if (cadHeightInput) cadHeightInput.value = newVal;

      if (typeof Wizard !== 'undefined') {
        CanvasDraw.drawPreview(Wizard.getCfg());
      }
    }
  });

  window.addEventListener('mouseup', () => {
    if (activeDrag) {
      activeDrag = null;
      canvas.style.cursor = 'default';
    }
  });

  // Inicializar sincronización al cargar
  setTimeout(syncInputsToCAD, 250);
});
