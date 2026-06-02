/**
 * wizard.js — Controlador del Wizard de Pautas de Corte
 * Versión simplificada: 4 pasos (Tipo → Subtipo → Datos/Medidas → Resultado)
 */

const Wizard = (() => {
  let history = [];
  let cfg = {};
  let preciosData = [];

  // ── Árbol de menús ──
  const MENU = {
    'ventana-corr': {
      label: 'Ventanas Correderas',
      subs: [
        { id: 'AL15',  label: 'AL/15 — Ventana Corredera Línea AL/15' },
        { id: 'AL20',  label: 'AL/20 — Ventana Corredera Línea AL/20' },
        { id: 'AL25',  label: 'AL/25 — Ventana Corredera Línea AL/25' },
        { id: 'L5000', label: 'L-5000 — Ventana Corredera Línea 5000' },
      ],
      opciones: 'ventana-corr',
    },
    'ventana-doble': {
      label: 'Ventanas Doble Contacto',
      subs: [
        { id: 'AL32_ABATIR',   label: 'Proyectante / Abatir Simple — Línea AL/32' },
        { id: 'AL32_ABATIR_D', label: 'Abatir Doble — Línea AL/32' },
        { id: 'AL42_ABATIR',   label: 'Proyectante / Abatir Simple — Línea AL/42' },
        { id: 'AL42_ABATIR_D', label: 'Abatir Doble — Línea AL/42' },
      ],
      opciones: 'ventana-doble',
    },
    'shower': {
      label: 'Shower Doors',
      subs: [
        { id: 'AM12_RECEP', label: 'Shower Doors Receptáculo (AM-12)' },
        { id: 'AM12_TINAS', label: 'Shower Doors Tinas (AM-12)' },
      ],
      opciones: 'shower',
    },
    'puerta': {
      label: 'Puertas',
      subs: [
        { id: 'AM35_ABATIR_90',       label: 'Puerta Abatir AM/35 — Corte 90°' },
        { id: 'AM35_ABATIR_45',       label: 'Puerta Abatir AM/35 — Corte 45°' },
        { id: 'AM35_VAIVEN',          label: 'Puerta Vaivén AM/35 — Corte 45°' },
        { id: 'PUERTA_ABATIR_TUBOS',  label: 'Puerta Abatir Tubos 4040/4080' },
        { id: 'PUERTA_VAIVEN_TUBULAR',label: 'Puerta Vaivén Tubular 4080' },
        { id: 'MARCO_5034',           label: 'Marco Puerta 5034' },
        { id: 'MARCO_7095',           label: 'Marco Puerta 7095' },
        { id: 'MARCO_3060',           label: 'Marco Puerta 3060' },
        { id: 'MARCO_2575',           label: 'Marco Puerta 2575' },
        { id: 'MARCO_2066',           label: 'Marco Puerta 2066' },
      ],
      opciones: 'puerta',
    },
    'pano-fijo': {
      label: 'Paños Fijos',
      subs: [
        { id: 'AL32_PANO', label: 'Paño Fijo Línea AL/32' },
        { id: 'AL42_PANO', label: 'Paño Fijo Línea AL/42' },
        { id: 'FIJO_TUBOS',label: 'Paño Fijo Tubos Cuadrados / Rectangulares' },
      ],
      opciones: 'pano-fijo',
    },
  };

  // ── Opciones extras por tipo ──
  const OPCIONES_FORMS = {
    'ventana-corr': [
      { id: 'hoja', label: 'Número de Hojas', type: 'select',
        opts: ['2 hojas','1 Corredera + 1 Fija','3 Hojas','4 Hojas'], vals: [2,21,3,4] },
      { id: 'pal', label: 'Palillo horizontal', type: 'yn' },
      { id: 'car', label: 'Caracol / cierre especial', type: 'yn' },
    ],
    'ventana-doble': [
      { id: 'pave', label: 'Palillos verticales (cant.)',   type: 'number', default: 0 },
      { id: 'pala', label: 'Palillos horizontales (cant.)', type: 'number', default: 0 },
      { id: 'cam',  label: 'Cámara de Agua',               type: 'yn' },
    ],
    'shower': [
      { id: 'fondo', label: 'Fondo del receptáculo (m, 0=sin fondo)', type: 'number', default: 0 },
    ],
    'puerta': [
      { id: 'pave', label: 'Nº Hojas (0=1 hoja, 2=2 hojas)', type: 'number', default: 0 },
      { id: 'pala', label: 'Palillo (0=No, 1=Sí)',            type: 'number', default: 0 },
      { id: 'bisa', label: 'Nº Bisagras',                     type: 'number', default: 3 },
    ],
    'pano-fijo': [
      { id: 'pave', label: 'Palillos verticales (cant.)',   type: 'number', default: 0 },
      { id: 'pala', label: 'Palillos horizontales (cant.)', type: 'number', default: 0 },
      { id: 'cam',  label: 'Cámara de Agua (solo AL/42)',   type: 'yn' },
    ],
  };

  const linMap = {
    'AL15': 'AL15', 'AL20': 'AL20', 'AL25': 'AL25', 'L5000': 'L5000',
    'AL32_ABATIR': 'AL32_ABATIR', 'AL32_ABATIR_D': 'AL32_ABATIR',
    'AL42_ABATIR': 'AL42_ABATIR', 'AL42_ABATIR_D': 'AL42_ABATIR',
    'AM12_RECEP': 'AM12', 'AM12_TINAS': 'AM12',
    'AM35_ABATIR_90': 'AM35_ABATIR', 'AM35_ABATIR_45': 'AM35_ABATIR',
    'AM35_VAIVEN': 'AM35_VAIVEN',
    'PUERTA_ABATIR_TUBOS': 'PUERTA_ABATIR_TUBOS',
    'PUERTA_VAIVEN_TUBULAR': 'PUERTA_VAIVEN_TUBULAR',
    'MARCO_5034': 'MARCO_5034', 'MARCO_7095': 'MARCO_7095',
    'MARCO_3060': 'MARCO_3060', 'MARCO_2575': 'MARCO_2575', 'MARCO_2066': 'MARCO_2066',
    'AL32_PANO': 'AL32_PANO', 'AL42_PANO': 'AL42_PANO', 'FIJO_TUBOS': 'FIJO_TUBOS',
  };

  function showStep(id) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function selectTipo(tipo) {
    cfg.tipo = tipo;
    history = ['step-tipo'];
    const menu = MENU[tipo];
    document.getElementById('subtipo-title').textContent = menu.label;
    const container = document.getElementById('subtipo-options');
    container.innerHTML = '';
    menu.subs.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = sub.label;
      btn.onclick = () => selectSubtipo(tipo, sub.id, sub.label);
      container.appendChild(btn);
    });
    history.push('step-subtipo');
    showStep('step-subtipo');
  }

  function selectSubtipo(tipo, subId, label) {
    cfg.subtipo = subId;
    cfg.rotu = label;
    cfg.lin = linMap[subId] || subId;

    // Título del paso 3
    document.getElementById('medidas-title').textContent = label;

    // Rellenar opciones extra dentro del paso de medidas
    const opKey = MENU[tipo].opciones;
    const fields = OPCIONES_FORMS[opKey] || [];
    const form = document.getElementById('opciones-form');
    const secTitle = document.getElementById('opciones-dinamicas');
    form.innerHTML = '';

    if (fields.length > 0) {
      secTitle.style.display = 'block';
      fields.forEach(f => {
        const grp = document.createElement('div');
        grp.className = 'form-group';
        const lbl = document.createElement('label');
        lbl.textContent = f.label;
        grp.appendChild(lbl);

        if (f.type === 'yn') {
          const sel = document.createElement('select');
          sel.id = 'opt-' + f.id;
          sel.innerHTML = '<option value="N">No</option><option value="S">Sí</option>';
          grp.appendChild(sel);
        } else if (f.type === 'select') {
          const sel = document.createElement('select');
          sel.id = 'opt-' + f.id;
          f.opts.forEach((o, i) => {
            const op = document.createElement('option');
            op.value = f.vals[i]; op.textContent = o;
            sel.appendChild(op);
          });
          grp.appendChild(sel);
        } else {
          const inp = document.createElement('input');
          inp.type = 'number'; inp.id = 'opt-' + f.id;
          inp.value = f.default !== undefined ? f.default : 0; inp.min = 0;
          grp.appendChild(inp);
        }
        form.appendChild(grp);
      });
    } else {
      secTitle.style.display = 'none';
    }

    // Conectar preview al canvas cuando cambien las medidas
    ['inp-ancho','inp-alto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => CanvasDraw.drawPreview(cfg);
    });
    // Conectar radio de color → redibuja perfiles en tiempo real
    document.querySelectorAll('input[name="color"]').forEach(radio => {
      radio.onchange = () => CanvasDraw.drawPreview(cfg);
    });
    CanvasDraw.drawPreview(cfg);

    history.push('step-medidas');
    showStep('step-medidas');
  }

  function _readOpciones() {
    const opKey = MENU[cfg.tipo].opciones;
    const fields = OPCIONES_FORMS[opKey] || [];
    fields.forEach(f => {
      const el = document.getElementById('opt-' + f.id);
      if (!el) return;
      if (f.type === 'select') {
        const numVal = parseInt(el.value);
        if (f.id === 'hoja') {
          if (numVal === 21) { cfg.hoja = 2; cfg.fija = 1; }
          else if (numVal === 3) { cfg.hoja = 3; cfg.fija = 1; }
          else if (numVal === 4) { cfg.hoja = 4; cfg.fija = 2; }
          else { cfg.hoja = numVal; cfg.fija = 0; }
        } else { cfg[f.id] = el.value; }
      } else { cfg[f.id] = el.value; }
    });
  }

  async function calcular() {
    const obra    = document.getElementById('inp-obra').value.trim();
    const anchoMm = parseFloat(document.getElementById('inp-ancho').value);
    const altoMm  = parseFloat(document.getElementById('inp-alto').value);
    const cant    = parseInt(document.getElementById('inp-cant').value) || 1;
    const porce   = parseFloat(document.getElementById('inp-porce').value) || 100;
    const iva     = parseFloat(document.getElementById('inp-iva').value) || 19;
    const vidi    = document.getElementById('sel-vidrio').value;
    const coloal  = document.querySelector('input[name="color"]:checked')?.value || 'M';

    if (!anchoMm || !altoMm || anchoMm < 100 || altoMm < 100) {
      App.toast('Ingrese medidas válidas (mínimo 100 mm)', 'error');
      return;
    }

    // Convertir mm → metros para los cálculos internos
    const ancho = anchoMm / 1000;
    const alto  = altoMm  / 1000;

    // Mapear colores nuevos a sufijos compatibles con los precios
    // BL (Blanco) → usa base M (Mate) ya que no hay precios BL
    // RO (Roble)  → usa base M
    // T  (Titanio)→ usa base M
    // B  (Bronce) → B
    // M  (Mate)   → M
    const colorSufijo = { 'BL': 'M', 'B': 'B', 'M': 'M', 'RO': 'M', 'T': 'M' };
    const coloalCalc  = colorSufijo[coloal] || 'M';

    _readOpciones();

    cfg = {
      ...cfg, obra, ancho, alto, anchoMm, altoMm, cant, porce, iva, vidi,
      coloal: coloalCalc,  // sufijo para cálculos
      coloalLabel: coloal, // nombre real para mostrar
      hoja:  cfg.hoja  || 2,
      fija:  cfg.fija  || 0,
      pal:   cfg.pal   || 'N',
      pala:  parseFloat(cfg.pala)  || 0,
      pave:  parseFloat(cfg.pave)  || 0,
      car:   cfg.car   || 'N',
      cam:   cfg.cam   || 'N',
      fondo: parseFloat(cfg.fondo) || 0,
      bisa:  parseFloat(cfg.bisa)  || 3,
      jun:   'ALCO5051',
    };

    try {
      preciosData = await Precios.getData();
      const resultado = Calculos.calcular(cfg, preciosData);
      // Guardar para módulo de cotización
      window._lastCfg     = { ...cfg };
      window._lastTotales = { ...resultado.totales };
      mostrarResultado(resultado);
    } catch (e) {
      App.toast('Error al calcular: ' + e.message, 'error');
      console.error(e);
    }
  }

  // ── Calcula y abre directamente el modal de cotización ──
  async function calcularYCotizar() {
    const anchoMm = parseFloat(document.getElementById('inp-ancho').value);
    const altoMm  = parseFloat(document.getElementById('inp-alto').value);
    if (!anchoMm || !altoMm || anchoMm < 100 || altoMm < 100) {
      App.toast('Ingrese medidas válidas (mínimo 100 mm)', 'error');
      return;
    }
    // Reutiliza la lógica de calcular() pero en vez de ir a resultado, abre el modal
    const obra    = document.getElementById('inp-obra').value.trim();
    const cant    = parseInt(document.getElementById('inp-cant').value) || 1;
    const porce   = parseFloat(document.getElementById('inp-porce').value) || 100;
    const iva     = parseFloat(document.getElementById('inp-iva').value) || 19;
    const vidi    = document.getElementById('sel-vidrio').value;
    const coloal  = document.querySelector('input[name="color"]:checked')?.value || 'M';
    const ancho   = anchoMm / 1000;
    const alto    = altoMm  / 1000;
    const colorSufijo = { 'BL': 'M', 'B': 'B', 'M': 'M', 'RO': 'M', 'T': 'M' };
    const coloalCalc  = colorSufijo[coloal] || 'M';
    _readOpciones();
    cfg = {
      ...cfg, obra, ancho, alto, anchoMm, altoMm, cant, porce, iva, vidi,
      coloal: coloalCalc, coloalLabel: coloal,
      hoja:  cfg.hoja  || 2, fija:  cfg.fija  || 0,
      pal:   cfg.pal   || 'N', pala:  parseFloat(cfg.pala)  || 0,
      pave:  parseFloat(cfg.pave)  || 0, car:   cfg.car   || 'N',
      cam:   cfg.cam   || 'N', fondo: parseFloat(cfg.fondo) || 0,
      bisa:  parseFloat(cfg.bisa)  || 3, jun:   'ALCO5051',
    };
    try {
      preciosData = await Precios.getData();
      const resultado = Calculos.calcular(cfg, preciosData);
      window._lastCfg     = { ...cfg };
      window._lastTotales = { ...resultado.totales };
      // Capturar canvas de preview como imagen
      const canvas = document.getElementById('preview-canvas');
      const canvasDataUrl = canvas ? canvas.toDataURL('image/png') : null;
      Cotizacion.abrirModal({ cfg: { ...cfg }, totales: { ...resultado.totales }, canvasDataUrl });
    } catch (e) {
      App.toast('Error al calcular: ' + e.message, 'error');
      console.error(e);
    }
  }

  // Etiquetas de colores
  const COLOR_LABEL = { 'BL': 'Blanco', 'B': 'Bronce', 'M': 'Mate', 'RO': 'Roble', 'T': 'Titanio' };

  function mostrarResultado(resultado) {
    const { items, totales, cfg: c } = resultado;
    document.getElementById('resultado-title').textContent = cfg.rotu || 'Pauta de Corte';

    const fmt = v => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
    const anchoMm = cfg.anchoMm || (c.ancho * 1000);
    const altoMm  = cfg.altoMm  || (c.alto  * 1000);
    const colorNombre = COLOR_LABEL[cfg.coloalLabel] || cfg.coloalLabel || 'Mate';

    // Chips de info
    const chips = [
      { val: `${Math.round(anchoMm)} × ${Math.round(altoMm)} mm`, lbl: 'Medida' },
      { val: c.cant, lbl: 'Cantidad' },
      { val: colorNombre, lbl: 'Color' },
      { val: totales.kilos.toFixed(2) + ' kg', lbl: 'Aluminio (kg)' },
      { val: totales.metros.toFixed(2) + ' m²', lbl: 'Cristal (m²)' },
      { val: fmt(totales.aluminio),   lbl: 'Aluminio' },
      { val: fmt(totales.accesorios), lbl: 'Quincallería' },
      { val: totales.cristal > 0 ? fmt(totales.cristal) : 'S/V', lbl: 'Cristal' },
      { val: fmt(totales.neto),   lbl: 'Total Neto' },
      { val: fmt(totales.conIva), lbl: `Total c/ IVA (${c.iva}%)` },
    ];
    document.getElementById('resultado-info').innerHTML = chips.map(ch => `
      <div class="info-chip">
        <div class="chip-val">${ch.val}</div>
        <div class="chip-lbl">${ch.lbl}</div>
      </div>
    `).join('');

    // Tabla
    const tbody = document.getElementById('resultado-body');
    tbody.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'row-' + item.tipo;
      tr.innerHTML = `
        <td><code style="font-size:0.76rem;color:var(--accent);font-family:'JetBrains Mono',monospace">${item.codigo}</code></td>
        <td>${item.descripcion}</td>
        <td class="num">${item.alto  > 0 ? item.alto.toFixed(3)  : '—'}</td>
        <td class="num">${item.ancho > 0 ? item.ancho.toFixed(3) : '—'}</td>
        <td class="num">${item.cantidad.toFixed(2)}</td>
        <td class="num">${item.unidad}</td>
        <td class="num">${fmt(item.precio)}</td>
        <td class="num" style="font-weight:600">${fmt(item.total)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Footer
    document.getElementById('resultado-foot').innerHTML = `
      <tr><td colspan="6">Total Aluminio</td><td colspan="2" class="num">${fmt(totales.aluminio)}</td></tr>
      <tr><td colspan="6">Total Quincallería</td><td colspan="2" class="num">${fmt(totales.accesorios)}</td></tr>
      <tr><td colspan="6">Total Cristal / Vidrio</td><td colspan="2" class="num">${fmt(totales.cristal)}</td></tr>
      <tr><td colspan="6" style="font-weight:700;color:var(--accent)">TOTAL NETO</td>
          <td colspan="2" class="num" style="font-weight:700;color:var(--accent)">${fmt(totales.neto)}</td></tr>
      <tr><td colspan="6">IVA (${c.iva}%)</td><td colspan="2" class="num">${fmt(totales.iva)}</td></tr>
      <tr><td colspan="6" style="font-weight:700;color:var(--success)">TOTAL CON IVA</td>
          <td colspan="2" class="num" style="font-weight:700;color:var(--success)">${fmt(totales.conIva)}</td></tr>
    `;

    CanvasDraw.drawResult(cfg, resultado);
    history.push('step-resultado');
    showStep('step-resultado');
  }

  function nuevaMedida() {
    showStep('step-medidas');
    history.push('step-medidas');
    CanvasDraw.drawPreview(cfg);
  }

  function back() {
    history.pop();
    const prev = history[history.length - 1] || 'step-tipo';
    if (prev === 'step-tipo') { cfg = {}; history = []; }
    showStep(prev);
  }

  // ── Actualiza el badge del botón cotizar en paso 3 ──
  function actualizarBadgePaso3(n) {
    const badge = document.getElementById('cot-badge-paso3');
    if (!badge) return;
    if (n > 0) {
      badge.textContent = n;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  return { selectTipo, selectSubtipo, calcular, calcularYCotizar, nuevaMedida, back, actualizarBadgePaso3 };
})();
