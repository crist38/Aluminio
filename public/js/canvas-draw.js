/**
 * canvas-draw.js — Visualización con HTML5 Canvas
 * Dibuja esquemas de ventanas, puertas y cubicación
 */

const CanvasDraw = (() => {

  const COLORS = {
    frame:   '#00d4ff',
    hoja:    '#7c3aed',
    glass:   'rgba(147, 210, 255, 0.18)',
    glassBorder: 'rgba(147, 210, 255, 0.5)',
    text:    '#e2e8f0',
    muted:   '#64748b',
    grid:    '#2a3346',
    arrow:   '#f59e0b',
    bg:      '#1a1f2e',
  };

  function clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }

  function drawDimension(ctx, x1, y1, x2, y2, label, outside = false) {
    ctx.strokeStyle = COLORS.arrow;
    ctx.fillStyle = COLORS.arrow;
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';

    const isHoriz = Math.abs(y1 - y2) < 2;
    const offset = outside ? -18 : 14;

    if (isHoriz) {
      const y = y1 + (outside ? -offset : offset);
      ctx.beginPath();
      ctx.moveTo(x1, y); ctx.lineTo(x2, y);
      ctx.moveTo(x1, y1); ctx.lineTo(x1, y);
      ctx.moveTo(x2, y2); ctx.lineTo(x2, y);
      ctx.stroke();
      // arrows
      ctx.beginPath();
      ctx.moveTo(x1 + 5, y - 3); ctx.lineTo(x1, y); ctx.lineTo(x1 + 5, y + 3); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x2 - 5, y - 3); ctx.lineTo(x2, y); ctx.lineTo(x2 - 5, y + 3); ctx.fill();
      ctx.fillStyle = COLORS.arrow;
      ctx.textAlign = 'center';
      ctx.fillText(label, (x1 + x2) / 2, y - 4);
    } else {
      const x = x1 + (outside ? -offset - 10 : offset);
      ctx.beginPath();
      ctx.moveTo(x, y1); ctx.lineTo(x, y2);
      ctx.moveTo(x1, y1); ctx.lineTo(x, y1);
      ctx.moveTo(x2, y2); ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 3, y1 + 5); ctx.lineTo(x, y1); ctx.lineTo(x + 3, y1 + 5); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 3, y2 - 5); ctx.lineTo(x, y2); ctx.lineTo(x + 3, y2 - 5); ctx.fill();
      ctx.save();
      ctx.translate(x - 4, (y1 + y2) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.arrow;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  function drawWindow(ctx, x, y, w, h, cfg) {
    const hojas = cfg.hoja || 2;
    const fija = cfg.fija || 0;
    const frameW = 8;

    // Outer frame
    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);

    // Glass area
    ctx.fillStyle = COLORS.glass;
    ctx.strokeStyle = COLORS.glassBorder;
    ctx.lineWidth = 1;
    ctx.fillRect(x + frameW, y + frameW, w - frameW * 2, h - frameW * 2);
    ctx.strokeRect(x + frameW, y + frameW, w - frameW * 2, h - frameW * 2);

    // Sliding panels
    const panelW = (w - frameW * 2) / hojas;
    for (let i = 0; i < hojas; i++) {
      const px = x + frameW + panelW * i;
      const isFijaPanel = fija > 0 && i >= hojas - fija;
      ctx.strokeStyle = isFijaPanel ? COLORS.muted : COLORS.hoja;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, y + frameW, panelW, h - frameW * 2);

      // Sliding indicator
      if (!isFijaPanel) {
        ctx.strokeStyle = COLORS.hoja;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const dirX = i % 2 === 0 ? px + 10 : px + panelW - 10;
        ctx.beginPath();
        ctx.moveTo(dirX, y + h / 2 - 10);
        ctx.lineTo(dirX, y + h / 2 + 10);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Fixed panel mark
        ctx.fillStyle = COLORS.muted;
        ctx.font = '9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('FIJA', px + panelW / 2, y + h / 2);
      }
    }
  }

  function drawDoor(ctx, x, y, w, h, cfg) {
    const isVaiven = cfg.lin && cfg.lin.includes('VAIVEN');
    const frameW = 8;

    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(x + frameW, y + frameW, w - frameW * 2, h - frameW * 2);

    // Door panel
    ctx.strokeStyle = COLORS.hoja;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + frameW, y + frameW, w - frameW * 2, h - frameW * 2);

    if (isVaiven) {
      // Double arrow for vaivén
      ctx.fillStyle = COLORS.hoja;
      ctx.font = '18px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('⇄', x + w / 2, y + h / 2 + 6);
    } else {
      // Arc for abatir
      ctx.strokeStyle = COLORS.hoja;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x + frameW, y + h - frameW, w - frameW * 2, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawShower(ctx, x, y, w, h, cfg) {
    const frameW = 8;
    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(x + frameW, y + frameW, w - frameW * 2, h - frameW * 2);

    // Sliding panels
    const half = (w - frameW * 2) / 2;
    ctx.strokeStyle = COLORS.hoja;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + frameW, y + frameW, half, h - frameW * 2);
    ctx.strokeRect(x + frameW + half, y + frameW, half, h - frameW * 2);

    // Shower icon
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('🚿', x + w / 2, y + h / 2 + 8);
  }

  function drawPane(ctx, x, y, w, h, cfg) {
    const pala = parseInt(cfg.pala) || 0;
    const pave = parseInt(cfg.pave) || 0;
    const frameW = 8;

    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(x + frameW, y + frameW, w - frameW * 2, h - frameW * 2);

    // Horizontal dividers (pala)
    if (pala > 0) {
      const ih = (h - frameW * 2) / (pala + 1);
      for (let i = 1; i <= pala; i++) {
        const py = y + frameW + ih * i;
        ctx.strokeStyle = COLORS.hoja;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + frameW, py); ctx.lineTo(x + w - frameW, py);
        ctx.stroke();
      }
    }

    // Vertical dividers (pave)
    if (pave > 0) {
      const iw = (w - frameW * 2) / (pave + 1);
      for (let i = 1; i <= pave; i++) {
        const px = x + frameW + iw * i;
        ctx.strokeStyle = COLORS.hoja;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, y + frameW); ctx.lineTo(px, y + h - frameW);
        ctx.stroke();
      }
    }
  }

  function drawPreview(cfg) {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;
    const ctx = clearCanvas(canvas);
    const W = canvas.width;
    const H = canvas.height;

    // Lee en mm, convierte a metros para el ratio visual
    const anchoMm = parseFloat(document.getElementById('inp-ancho')?.value) || 1200;
    const altoMm  = parseFloat(document.getElementById('inp-alto')?.value)  || 1000;
    const ancho = anchoMm / 1000;
    const alto  = altoMm  / 1000;

    const margin = 60;
    const availW = W - margin * 2;
    const availH = H - margin * 2;
    const ratio = Math.min(availW / ancho, availH / alto);
    const dw = ancho * ratio;
    const dh = alto * ratio;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;

    const tipo = cfg.tipo;
    if (tipo === 'ventana-corr') drawWindow(ctx, ox, oy, dw, dh, cfg);
    else if (tipo === 'shower') drawShower(ctx, ox, oy, dw, dh, cfg);
    else if (tipo === 'puerta') drawDoor(ctx, ox, oy, dw, dh, cfg);
    else if (tipo === 'pano-fijo' || tipo === 'ventana-doble') drawPane(ctx, ox, oy, dw, dh, cfg);
    else drawPane(ctx, ox, oy, dw, dh, cfg);

    // Dimensiones en mm
    drawDimension(ctx, ox, oy + dh, ox + dw, oy + dh, `${Math.round(anchoMm)} mm`, false);
    drawDimension(ctx, ox + dw, oy, ox + dw, oy + dh, `${Math.round(altoMm)} mm`, false);
  }

  function drawResult(cfg, resultado) {
    const canvas = document.getElementById('resultado-canvas');
    if (!canvas) return;
    const wrap = document.getElementById('canvas-resultado-wrap');
    if (wrap) wrap.style.display = 'block';

    const ctx = clearCanvas(canvas);
    const W = canvas.width;
    const H = canvas.height;
    const ancho = cfg.ancho || 1;
    const alto  = cfg.alto || 1;

    const margin = 80;
    const availW = W - margin * 2;
    const availH = H - margin * 2;
    const ratio = Math.min(availW / ancho, availH / alto) * 0.7;
    const dw = ancho * ratio;
    const dh = alto * ratio;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;

    const tipo = cfg.tipo;
    if (tipo === 'ventana-corr') drawWindow(ctx, ox, oy, dw, dh, cfg);
    else if (tipo === 'shower') drawShower(ctx, ox, oy, dw, dh, cfg);
    else if (tipo === 'puerta') drawDoor(ctx, ox, oy, dw, dh, cfg);
    else drawPane(ctx, ox, oy, dw, dh, cfg);

    const anchoMm = cfg.anchoMm || (cfg.ancho * 1000);
    const altoMm  = cfg.altoMm  || (cfg.alto  * 1000);

    drawDimension(ctx, ox, oy + dh + 10, ox + dw, oy + dh + 10, `Ancho: ${Math.round(anchoMm)} mm`, false);
    drawDimension(ctx, ox + dw + 10, oy, ox + dw + 10, oy + dh, `Alto: ${Math.round(altoMm)} mm`, false);

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.rotu || 'Esquema de Corte', W / 2, 28);
  }

  return { drawPreview, drawResult };
})();
