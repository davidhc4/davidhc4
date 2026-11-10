"""
Informe diario de vencimientos para droguerías.

Se conecta a la base de datos del sistema de punto de venta, clasifica los lotes
(vencidos, <=30, <=60, <=90 días), genera un Excel y opcionalmente lo envía por correo.
Es el entregable del "plan automático": se instala una vez en el computador de la
droguería y se programa con el Programador de tareas de Windows.

Uso:
    pip install pyodbc openpyxl
    python reporte_vencimientos.py config.json

Ver config.ejemplo.json para la configuración.
"""
import json
import smtplib
import sys
from datetime import date, datetime
from email.message import EmailMessage
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter


def leer_lotes(cfg):
    """Ejecuta la consulta configurada. Debe devolver: producto, lote, vence, cantidad, costo."""
    import pyodbc  # solo se necesita con base de datos real

    with pyodbc.connect(cfg["conexion"]) as con:
        cur = con.cursor()
        cur.execute(cfg["consulta"])
        filas = []
        for producto, lote, vence, cantidad, costo in cur.fetchall():
            if isinstance(vence, datetime):
                vence = vence.date()
            if not isinstance(vence, date):
                continue
            cantidad = float(cantidad or 0)
            costo = float(costo or 0)
            filas.append({
                "producto": str(producto or "").strip(),
                "lote": str(lote or "").strip(),
                "vence": vence,
                "cantidad": cantidad,
                "costo": costo,
                "valor": cantidad * costo,
            })
    return filas


def accion(dias):
    if dias < 0:
        return "Retirar de venta y gestionar devolución"
    if dias <= 30:
        return "Devolver al proveedor o promocionar ya"
    if dias <= 60:
        return "Poner adelante en estante, no reabastecer"
    if dias <= 90:
        return "Vigilar rotación"
    return "Sin acción"


def clasificar(filas, hoy, horizonte):
    for f in filas:
        f["dias"] = (f["vence"] - hoy).days
        f["accion"] = accion(f["dias"])
    seleccion = sorted((f for f in filas if f["dias"] <= horizonte), key=lambda f: f["dias"])
    resumen = {
        "vencidos": sum(1 for f in filas if f["dias"] < 0),
        "d30": sum(1 for f in filas if 0 <= f["dias"] <= 30),
        "d60": sum(1 for f in filas if 30 < f["dias"] <= 60),
        "d90": sum(1 for f in filas if 60 < f["dias"] <= 90),
        "riesgo": sum(f["valor"] for f in filas if f["dias"] <= 90),
    }
    return seleccion, resumen


def escribir_excel(seleccion, resumen, hoy, ruta):
    wb = Workbook()
    ws = wb.active
    ws.title = "Vencimientos"
    ws.append([f"Informe de vencimientos - {hoy:%d/%m/%Y}"])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([
        f"Vencidos: {resumen['vencidos']}",
        f"<=30 días: {resumen['d30']}",
        f"31-60 días: {resumen['d60']}",
        f"61-90 días: {resumen['d90']}",
        f"Dinero en riesgo (<=90 días): ${resumen['riesgo']:,.0f}",
    ])
    ws.append([])
    encabezado = ["Producto", "Lote", "Vence", "Días", "Cantidad", "Costo unit.", "Valor", "Acción sugerida"]
    ws.append(encabezado)
    for c in ws[4]:
        c.font = Font(bold=True)
    rojo = PatternFill("solid", fgColor="F8D7DA")
    amarillo = PatternFill("solid", fgColor="FFF3CD")
    for f in seleccion:
        ws.append([f["producto"], f["lote"], f["vence"], f["dias"], f["cantidad"], f["costo"], f["valor"], f["accion"]])
        fila = ws.max_row
        ws.cell(fila, 3).number_format = "DD/MM/YYYY"
        ws.cell(fila, 6).number_format = "#,##0"
        ws.cell(fila, 7).number_format = "#,##0"
        if f["dias"] < 0:
            for c in ws[fila]:
                c.fill = rojo
        elif f["dias"] <= 30:
            for c in ws[fila]:
                c.fill = amarillo
    for i, ancho in enumerate([45, 14, 12, 7, 10, 14, 14, 42], start=1):
        ws.column_dimensions[get_column_letter(i)].width = ancho
    ws.freeze_panes = "A5"
    wb.save(ruta)


def enviar_correo(cfg, ruta, resumen, hoy):
    c = cfg.get("correo")
    if not c or not c.get("para"):
        return False
    msg = EmailMessage()
    msg["Subject"] = f"Vencimientos {hoy:%d/%m/%Y}: {resumen['vencidos']} vencidos, {resumen['d30']} vencen en 30 días"
    msg["From"] = c["usuario"]
    msg["To"] = ", ".join(c["para"])
    msg.set_content(
        f"Resumen del {hoy:%d/%m/%Y}\n\n"
        f"Vencidos: {resumen['vencidos']}\n"
        f"Vencen en 30 días: {resumen['d30']}\n"
        f"Vencen en 31-60 días: {resumen['d60']}\n"
        f"Vencen en 61-90 días: {resumen['d90']}\n"
        f"Dinero en riesgo (<=90 días): ${resumen['riesgo']:,.0f}\n\n"
        "El detalle va adjunto en Excel."
    )
    with open(ruta, "rb") as fh:
        msg.add_attachment(fh.read(), maintype="application",
                           subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           filename=Path(ruta).name)
    with smtplib.SMTP(c.get("servidor", "smtp.gmail.com"), int(c.get("puerto", 587))) as s:
        s.starttls()
        s.login(c["usuario"], c["clave"])
        s.send_message(msg)
    return True


def main():
    if len(sys.argv) < 2:
        print("Uso: python reporte_vencimientos.py config.json")
        sys.exit(1)
    cfg = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    hoy = date.today()
    horizonte = int(cfg.get("horizonte_dias", 90))
    carpeta = Path(cfg.get("carpeta_salida", "informes"))
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"vencimientos_{hoy:%Y-%m-%d}.xlsx"

    filas = leer_lotes(cfg)
    seleccion, resumen = clasificar(filas, hoy, horizonte)
    escribir_excel(seleccion, resumen, hoy, ruta)
    print(f"{len(filas)} lotes leídos, {len(seleccion)} en el informe -> {ruta}")
    print(f"Vencidos {resumen['vencidos']} | <=30 {resumen['d30']} | 31-60 {resumen['d60']} | 61-90 {resumen['d90']} | riesgo ${resumen['riesgo']:,.0f}")
    if enviar_correo(cfg, ruta, resumen, hoy):
        print("Correo enviado a", ", ".join(cfg["correo"]["para"]))


if __name__ == "__main__":
    main()
