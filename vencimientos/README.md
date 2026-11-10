# Control de vencimientos para droguerías

Producto con dos partes:

1. **Herramienta gratuita en línea** (`index.html`, `app.js`, `styles.css`): el dueño de la droguería sube el inventario en CSV o Excel y ve qué está vencido, qué vence en 30/60/90 días y cuánto dinero tiene en riesgo. Todo corre en el navegador. Sirve como gancho para conseguir clientes.
2. **Plan automático** (`reporte_vencimientos.py`): script que se conecta a la base de datos del punto de venta, genera un Excel diario y lo envía por correo. Es lo que se cobra mensualmente.

## Publicar la página gratis (GitHub Pages)

1. En GitHub, en este repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
2. La página queda en `https://davidhc4.github.io/davidhc4/vencimientos/`.
3. Si prefieres un dominio corto, crea un repositorio llamado `davidhc4.github.io` y copia ahí la carpeta `vencimientos`.

Antes de publicar, reemplaza en `index.html` el número de WhatsApp `57XXXXXXXXXX` por el tuyo (búscalo en el enlace `wa.me`).

## Instalar el plan automático en una droguería

```bash
pip install pyodbc openpyxl
copy config.ejemplo.json config.json
# editar config.json: cadena de conexión, consulta y correo
python reporte_vencimientos.py config.json
```

La consulta SQL debe devolver exactamente cinco columnas en este orden: producto, lote, fecha de vencimiento, cantidad, costo unitario. Se adapta a cada sistema de punto de venta.

Para que corra solo cada mañana: Programador de tareas de Windows → Crear tarea básica → Diariamente 7:00 → Iniciar un programa → `python` con argumentos `C:\ruta\reporte_vencimientos.py C:\ruta\config.json`.

Para el correo con Gmail se necesita una "contraseña de aplicación" (Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones).

## Probar el script sin base de datos

```bash
python -c "import reporte_vencimientos as r, datetime as d; print(r.clasificar([{'producto':'x','lote':'1','vence':d.date.today(),'cantidad':2,'costo':100,'valor':200}], d.date.today(), 90))"
```
