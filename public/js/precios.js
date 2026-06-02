/**
 * precios.js — Módulo de Gestión de Precios
 * Carga, muestra y guarda precios desde/hacia la API del servidor
 */

const Precios = (() => {
  let allData = [];
  let filteredData = [];

  async function getData() {
    if (allData.length > 0) return allData;
    try {
      const res = await fetch('/api/precios');
      allData = await res.json();
      return allData;
    } catch (e) {
      console.error('Error cargando precios:', e);
      return [];
    }
  }

  async function cargar() {
    allData = await getData();
    filteredData = [...allData];
    renderTabla(filteredData);
  }

  function filtrar(query) {
    const q = query.toLowerCase();
    filteredData = allData.filter(p =>
      p.codigo.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q)
    );
    renderTabla(filteredData);
  }

  function renderTabla(data) {
    const tbody = document.getElementById('precios-body');
    if (!tbody) return;
    const fmt = v => new Intl.NumberFormat('es-CL').format(v);

    tbody.innerHTML = data.map((p, i) => `
      <tr>
        <td><code style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;color:var(--accent)">${p.codigo}</code></td>
        <td>${p.descripcion}</td>
        <td class="num">
          <input
            class="precio-input"
            type="number"
            value="${p.precio}"
            min="0"
            data-codigo="${p.codigo}"
            oninput="Precios.updatePrice('${p.codigo}', this.value)"
          />
        </td>
        <td class="num">
          <span style="color:${p.medida === 'P' ? 'var(--accent)' : p.medida === 'A' ? 'var(--success)' : 'var(--text-muted)'}">
            ${p.medida === 'P' ? 'Metro lineal' : p.medida === 'A' ? 'Metro²' : 'Unidad'}
          </span>
        </td>
        <td class="num" style="color:var(--text-muted)">${p.peso ?? 1}</td>
      </tr>
    `).join('');
  }

  function updatePrice(codigo, newVal) {
    const item = allData.find(p => p.codigo === codigo);
    if (item) {
      item.precio = parseFloat(newVal) || 0;
    }
  }

  async function guardar() {
    try {
      const res = await fetch('/api/precios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData),
      });
      if (res.ok) {
        App.toast('✅ Precios guardados correctamente', 'success');
      } else {
        App.toast('Error al guardar precios', 'error');
      }
    } catch (e) {
      App.toast('Error de conexión', 'error');
    }
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'precios_aluminio.json';
    a.click();
    URL.revokeObjectURL(url);
    App.toast('Archivo JSON exportado', 'success');
  }

  return { getData, cargar, filtrar, updatePrice, guardar, exportar };
})();
