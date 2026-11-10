# Plan para llegar a 1 USD/día (y pasar de ahí)

**Lo primero, sin rodeos:** ninguna persona ni IA puede *garantizar* ingresos. Lo que sí se puede hacer es elegir el camino con mayor probabilidad para tu perfil, construir el producto, y hacer las acciones concretas que llevan al primer pago. Este documento es ese plan. El producto ya está construido en la carpeta `vencimientos/`.

## La meta en números

- 1 USD/día = 30 USD/mes ≈ **120.000 COP/mes** (a ~4.000 COP por dólar, ajusta según la tasa del día).
- Eso es **un solo cliente** pagando 120.000 COP al mes. No hace falta audiencia, ni miles de visitas, ni suerte.
- Con 5 clientes estás en 5 USD/día. Con 20 clientes, 20 USD/día y ya es un negocio.

## Por qué este camino y no los otros que mencionaste

| Opción | Tiempo hasta el primer dólar | Probabilidad real | Veredicto |
|---|---|---|---|
| **Software/servicio para droguerías (SQL Server, informes, automatización)** | 2–6 semanas | Alta: ya conoces el sector, el sistema y las dolencias | **Hacer primero** |
| Freelance de automatización con Python (Workana, Upwork, Fiverr) | 2–8 semanas | Media-alta: hay demanda, pero compites por precio | **Hacer en paralelo** |
| App Android con anuncios (AdMob) | 3–12 meses | Baja sin descargas masivas: 1.000 usuarios activos dan ~1–3 USD/día | Después, con Bolsillo si quieres |
| YouTube / TikTok / Reels | 6–18 meses | Baja: YouTube exige 1.000 suscriptores y 4.000 horas antes de pagar | Solo como vitrina, no como ingreso |
| Página web con anuncios | 6–12 meses | Baja: necesitas ~30.000 visitas/mes para 1 USD/día | No |
| Cripto / trading | Hoy mismo, pero también puedes perder | Negativa en promedio para principiantes; no es ingreso, es apuesta | No |

La fila de arriba gana porque combina tres cosas que ya tienes: experiencia en farmacias, acceso a cómo funcionan sus sistemas (SQL Server) y la capacidad de programar la solución. Un dueño de droguería pierde más de 120.000 COP al mes en vencidos sin saberlo; eso hace que la venta sea fácil de explicar.

## Qué quedó listo en este repositorio

1. `vencimientos/index.html` + `app.js` + `styles.css`: página web pública con herramienta gratuita. Sirve de gancho: la droguería sube su inventario, ve el dinero en riesgo, y de ahí sale la conversación de venta.
2. `vencimientos/reporte_vencimientos.py`: el producto pago. Se instala en el computador de la droguería, lee su base de datos, genera Excel y lo envía por correo cada mañana.
3. `negocio/mensajes.md`: los mensajes exactos para WhatsApp, visita presencial y correo.
4. Este plan.

## Lo que solo tú puedes hacer (yo no puedo): lista de 30 días

### Semana 1: publicar y preparar
- [ ] Reemplazar `57XXXXXXXXXX` en `vencimientos/index.html` por tu WhatsApp.
- [ ] Activar GitHub Pages (instrucciones en `vencimientos/README.md`). Costo: 0.
- [ ] Hacer una lista de **20 droguerías** que conozcas o tengas cerca (nombre, dueño o administrador, WhatsApp, qué sistema de punto de venta usan).
- [ ] Probar `reporte_vencimientos.py` contra la base de datos del sistema que ya conoces para tener la consulta SQL lista para ese sistema.
- [ ] Preparar cómo cobrar: Nequi o Daviplata para empezar (gratis); para empresas más grandes, cuenta de ahorros y factura por cuenta de cobro.

### Semana 2: contactar
- [ ] Escribir a las 20 droguerías con el mensaje 1 de `negocio/mensajes.md`. Meta: 5 respuestas, 3 demostraciones.
- [ ] En la demostración: pedir un export del inventario, cargarlo en la página en frente de ellos, y mostrar el número de "dinero en riesgo". Ese número vende solo.
- [ ] Ofrecer el primer mes a 120.000 COP con instalación gratis. Si dudan, 15 días de prueba gratis con instalación incluida.

### Semana 3: instalar al primer cliente
- [ ] Instalar el script, programarlo con el Programador de tareas de Windows, confirmar que el correo llega.
- [ ] Pedir un testimonio corto por WhatsApp ("me mostró $X en productos por vencer que no sabía que tenía") y permiso para usar el nombre de la droguería.
- [ ] Publicar ese testimonio en la página y en tu perfil de LinkedIn.

### Semana 4: repetir y subir precio
- [ ] Contactar 20 droguerías más con el testimonio incluido.
- [ ] A partir del tercer cliente, subir a 150.000–200.000 COP/mes. Los informes de ventas y márgenes que ya sabes hacer son el siguiente producto que les vendes (plan "Gerencia": 300.000 COP/mes).

## En paralelo: freelance (segunda fuente, 1 hora al día)

- Crear perfil en **Workana** (en español, mucho cliente latinoamericano) y en **Upwork**.
- Título del perfil: "Automatización con Python: Playwright, pywinauto, SQL Server. Convierto tareas repetitivas en scripts".
- Portafolio: enlaza este repositorio, Bolsillo y la página de vencimientos. Describe un caso real de la farmacia (sin datos privados): "informe que tomaba 2 horas al día ahora corre solo".
- Aplica a 3 proyectos al día, solo donde puedas entregar en menos de una semana. Precio inicial: 15–25 USD/hora o proyectos fijos de 50–150 USD. Un solo proyecto de 50 USD al mes ya cubre la meta.

## Qué NO hacer

- No pagar por cursos, "bots de trading", ni publicidad hasta tener el primer cliente pagando.
- No construir más funciones antes de vender. El producto actual alcanza para cobrar; se mejora con lo que pidan los clientes.
- No poner anuncios en Bolsillo por ahora: le prometiste a los usuarios "sin anuncios" y tu reputación vale más que 0,5 USD/día.

## Cómo medir si va bien

| Semana | Señal de que vas bien |
|---|---|
| 1 | Página publicada, 20 contactos en la lista, consulta SQL probada |
| 2 | Al menos 3 demostraciones hechas |
| 3 | 1 cliente instalado y pagando (meta cumplida: 1 USD/día) |
| 8 | 3–5 clientes (3–5 USD/día) |
| 16 | 10 clientes o 1 cliente grande (cadena de droguerías) |

Si en la semana 3 no hay ningún cliente, el problema casi siempre es cantidad de contactos, no el producto: pasa a 40 contactos y pide retroalimentación a quienes dijeron que no.
