/* Control de vencimientos: todo se procesa en el navegador. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const estado = $('estado');
  const tbody = $('tabla').querySelector('tbody');
  let filas = [];      // {producto, lote, vence(Date), dias, cantidad, costo, valor}
  let omitidas = 0;

  // ---------- Detección de columnas ----------
  const ALIAS = {
    producto: ['producto', 'nombre', 'descripcion', 'descripción', 'articulo', 'artículo', 'item', 'medicamento', 'detalle'],
    lote: ['lote', 'batch', 'nro lote', 'no lote', 'numero lote'],
    vence: ['vencimiento', 'vence', 'fecha vencimiento', 'fecha de vencimiento', 'fechavencimiento', 'f vencimiento', 'fvence', 'expira', 'expiracion', 'expiración', 'caducidad', 'fecha'],
    cantidad: ['cantidad', 'existencia', 'existencias', 'stock', 'saldo', 'unidades', 'cant', 'qty'],
    costo: ['costo', 'costo unitario', 'costo unit', 'precio', 'precio costo', 'valor unitario', 'vlr unitario', 'costo promedio'],
  };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function mapear(encabezados) {
    const n = encabezados.map(norm);
    const idx = {};
    for (const campo in ALIAS) {
      const alias = ALIAS[campo].map(norm);
      let pos = n.findIndex((h) => alias.includes(h));
      if (pos < 0) pos = n.findIndex((h) => alias.some((a) => h.includes(a)));
      idx[campo] = pos;
    }
    return idx;
  }

  // ---------- Fechas ----------
  function parseFecha(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    if (typeof v === 'number') { // serial de Excel
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return isNaN(d) ? null : d;
    }
    const s = String(v).trim();
    let m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return mk(m[1], m[2], m[3]);
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/))) return mk(m[3], m[2], m[1]);
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2})$/))) return mk('20' + m[3], m[2], m[1]);
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{4})$/))) { // mm/yyyy: último día del mes
      return new Date(+m[2], +m[1], 0);
    }
    if ((m = s.match(/^(\d{4})[\/.-](\d{1,2})$/))) return new Date(+m[1], +m[2], 0);
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }
  function mk(y, mo, d) {
    const dt = new Date(+y, +mo - 1, +d);
    return isNaN(dt) ? null : dt;
  }
  function parseNum(v) {
    if (typeof v === 'number') return v;
    const s = String(v || '').replace(/[^\d,.-]/g, '');
    if (!s) return 0;
    let limpio;
    const tienePunto = s.includes('.'), tieneComa = s.includes(',');
    if (tienePunto && tieneComa) {
      // 1.234.567,89 -> 1234567.89 ; 1,234.56 -> 1234.56
      limpio = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (tienePunto || tieneComa) {
      // Un solo tipo de separador: si todos los grupos tras el primero tienen 3 dígitos es de miles (4.200 -> 4200)
      const sep = tienePunto ? '.' : ',';
      const partes = s.split(sep);
      const esMiles = partes.length > 1 && partes.slice(1).every((g) => /^\d{3}$/.test(g));
      limpio = esMiles ? partes.join('') : s.replace(sep, '.');
    } else limpio = s;
    const n = parseFloat(limpio);
    return isNaN(n) ? 0 : n;
  }

  // ---------- Carga de archivos ----------
  function parseCSV(texto) {
    const sep = (texto.split('\n')[0].match(/;/g) || []).length > (texto.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const out = [];
    let fila = [], campo = '', enComillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (enComillas) {
        if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') enComillas = false;
        else campo += c;
      } else if (c === '"') enComillas = true;
      else if (c === sep) { fila.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        fila.push(campo); out.push(fila); fila = []; campo = '';
      } else campo += c;
    }
    if (campo || fila.length) { fila.push(campo); out.push(fila); }
    return out.filter((f) => f.some((x) => String(x).trim() !== ''));
  }

  function procesar(matriz, nombre) {
    if (!matriz.length) { estado.textContent = 'El archivo está vacío.'; return; }
    const idx = mapear(matriz[0]);
    const faltan = ['producto', 'vence'].filter((c) => idx[c] < 0);
    if (faltan.length) {
      estado.textContent = 'No encontré estas columnas: ' + faltan.join(', ') + '. Encabezados leídos: ' + matriz[0].join(' | ');
      return;
    }
    filas = []; omitidas = 0;
    for (const r of matriz.slice(1)) {
      const vence = parseFecha(r[idx.vence]);
      if (!vence) { omitidas++; continue; }
      const cantidad = idx.cantidad >= 0 ? parseNum(r[idx.cantidad]) : 1;
      const costo = idx.costo >= 0 ? parseNum(r[idx.costo]) : 0;
      filas.push({
        producto: String(r[idx.producto] || '').trim(),
        lote: idx.lote >= 0 ? String(r[idx.lote] || '').trim() : '',
        vence, cantidad, costo, valor: cantidad * costo,
      });
    }
    estado.textContent = `Archivo "${nombre}": ${filas.length} lotes leídos` + (omitidas ? `, ${omitidas} filas sin fecha válida` : '') + '.';
    render();
  }

  $('archivo').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    estado.textContent = 'Leyendo…';
    const esExcel = /\.xlsx?$/i.test(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (esExcel) {
          if (typeof XLSX === 'undefined') throw new Error('no se pudo cargar el lector de Excel; guarda el archivo como CSV e inténtalo de nuevo');
          const wb = XLSX.read(reader.result, { type: 'array', cellDates: true });
          const hoja = wb.Sheets[wb.SheetNames[0]];
          procesar(XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: '' }), f.name);
        } else {
          procesar(parseCSV(reader.result), f.name);
        }
      } catch (err) {
        estado.textContent = 'No pude leer el archivo: ' + err.message;
      }
    };
    if (esExcel) reader.readAsArrayBuffer(f); else reader.readAsText(f, 'utf-8');
  });

  // ---------- Demo ----------
  $('demo').addEventListener('click', () => {
    const hoy = fechaRef();
    const d = (n) => { const x = new Date(hoy); x.setDate(x.getDate() + n); return x; };
    const demo = [
      ['Acetaminofén 500 mg x 100', 'L2301', d(-12), 3, 4200],
      ['Ibuprofeno 400 mg x 30', 'IB778', d(5), 12, 6100],
      ['Amoxicilina 500 mg x 50', 'AMX09', d(21), 4, 18500],
      ['Losartán 50 mg x 30', 'LS441', d(44), 20, 5200],
      ['Metformina 850 mg x 30', 'MT120', d(75), 15, 4900],
      ['Omeprazol 20 mg x 30', 'OM555', d(130), 30, 7300],
      ['Jarabe para la tos 120 ml', 'JT02', d(-40), 2, 9800],
      ['Suero oral x 500 ml', 'SO88', d(28), 9, 3100],
      ['Vitamina C 500 mg x 100', 'VC19', d(300), 25, 11000],
      ['Loratadina 10 mg x 10', 'LR33', d(60), 18, 2500],
    ];
    const matriz = [['Producto', 'Lote', 'Vencimiento', 'Cantidad', 'Costo']].concat(demo);
    procesar(matriz, 'datos de ejemplo');
  });

  // ---------- Render ----------
  function fechaRef() {
    const v = $('hoy').value;
    const d = v ? new Date(v + 'T00:00:00') : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const fmtFecha = (d) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  function accion(dias) {
    if (dias < 0) return 'Retirar de venta y gestionar devolución';
    if (dias <= 30) return 'Devolver al proveedor o promocionar ya';
    if (dias <= 60) return 'Poner adelante en estante, no reabastecer';
    if (dias <= 90) return 'Vigilar rotación';
    return 'Sin acción';
  }

  function render() {
    const hoy = fechaRef();
    for (const f of filas) f.dias = Math.round((f.vence - hoy) / 86400000);
    const c = { vencidos: 0, d30: 0, d60: 0, d90: 0, riesgo: 0 };
    for (const f of filas) {
      if (f.dias < 0) c.vencidos++;
      else if (f.dias <= 30) c.d30++;
      else if (f.dias <= 60) c.d60++;
      else if (f.dias <= 90) c.d90++;
      if (f.dias <= 90) c.riesgo += f.valor;
    }
    $('k-vencidos').textContent = c.vencidos;
    $('k-30').textContent = c.d30;
    $('k-60').textContent = c.d60;
    $('k-90').textContent = c.d90;
    $('k-riesgo').textContent = COP.format(c.riesgo);

    const filtro = $('filtro').value;
    const q = norm($('buscar').value);
    const visibles = filas
      .filter((f) => filtro === 'all' || f.dias <= +filtro)
      .filter((f) => !q || norm(f.producto).includes(q) || norm(f.lote).includes(q))
      .sort((a, b) => a.dias - b.dias);

    tbody.innerHTML = '';
    for (const f of visibles) {
      const tr = document.createElement('tr');
      tr.className = f.dias < 0 ? 'vencido' : f.dias <= 30 ? 'pronto' : '';
      tr.innerHTML =
        `<td>${esc(f.producto)}</td><td>${esc(f.lote)}</td><td>${fmtFecha(f.vence)}</td>` +
        `<td class="num dias">${f.dias}</td><td class="num">${f.cantidad}</td>` +
        `<td class="num">${COP.format(f.costo)}</td><td class="num">${COP.format(f.valor)}</td><td>${accion(f.dias)}</td>`;
      tbody.appendChild(tr);
    }
    $('omitidos').textContent = visibles.length ? `${visibles.length} lotes mostrados.` : 'Nada que mostrar con este filtro.';
    $('resultados').hidden = false;
    render.visibles = visibles;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  $('filtro').addEventListener('change', render);
  $('buscar').addEventListener('input', render);
  $('hoy').addEventListener('change', () => filas.length && render());
  $('imprimir').addEventListener('click', () => window.print());
  $('exportar').addEventListener('click', () => {
    const v = render.visibles || [];
    const lineas = [['Producto', 'Lote', 'Vence', 'Dias', 'Cantidad', 'Costo', 'Valor', 'Accion']]
      .concat(v.map((f) => [f.producto, f.lote, fmtFecha(f.vence), f.dias, f.cantidad, f.costo, f.valor, accion(f.dias)]))
      .map((r) => r.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const blob = new Blob(['﻿' + lineas], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vencimientos.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Fecha de referencia por defecto: hoy
  const t = new Date();
  $('hoy').value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
})();
