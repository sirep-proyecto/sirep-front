/**
 * Responsabilidad: serializar los datos de un reporte técnico al formato Markdown
 * de transcripción formal, basado en la estructura de BACETTO_03.md.
 * Es una función pura y determinista: no depende del DOM ni de librerías de UI.
 */

import { valorVigente } from "@/features/revision/lib/campos";
import type { CampoReporte, ReporteVista } from "@/features/revision/types/dominio";
import type { IdCampo } from "@/features/revision/types/campos";

function obtenerMapaValores(campos: readonly CampoReporte[]): Record<IdCampo, string | null> {
  const mapa = {} as Record<IdCampo, string | null>;
  for (const c of campos) {
    mapa[c.id] = valorVigente(c);
  }
  return mapa;
}

function formatearCasillaOpcion(
  valor: string | null,
  opciones: readonly string[],
): string {
  if (!valor || valor.trim() === "") {
    return opciones.map((op) => `☐ ${op}`).join(" ");
  }

  const normalizado = valor.toLowerCase().trim();
  return opciones
    .map((op) => {
      const match = normalizado.includes(op.toLowerCase());
      return `${match ? "☑" : "☐"} ${op}`;
    })
    .join(" ");
}

function casillaBooleana(valor: string | null): string {
  if (!valor) return "☐";
  const v = valor.toLowerCase().trim();
  const esVerdadero = v === "si" || v === "sí" || v === "true" || v === "1" || v === "x";
  return esVerdadero ? "☑" : "☐";
}

function valorOTextoVacio(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor.trim() === "") {
    return "(vacío)";
  }
  return valor.trim();
}

export function generarMarkdownReporte(reporte: ReporteVista): string {
  const v = obtenerMapaValores(reporte.campos);

  const numReporte = reporte.numero_reporte || "(sin número)";
  const tecnico = v.tecnico ?? reporte.tecnico ?? "(vacío)";
  const empresa = v.empresa ?? reporte.cliente ?? "(vacío)";
  const fecha = v.fecha ?? reporte.fecha_reporte ?? "(vacío)";
  const telefono = valorOTextoVacio(v.telefono);
  const direccion = valorOTextoVacio(v.direccion);
  const equipo = v.equipo ?? reporte.equipo ?? "(vacío)";
  const contacto = valorOTextoVacio(v.contacto);
  const motivo = valorOTextoVacio(v.motivo);

  const estadoEquipo = formatearCasillaOpcion(v.estado_del_equipo, ["Operativo", "Inoperativo"]);
  const ultimoMant = valorOTextoVacio(v.ultimo_mantenimiento);
  const limpieza = formatearCasillaOpcion(v.limpieza_equipo, ["Limpio", "Sucio"]);
  const cabezales = formatearCasillaOpcion(v.cabezales, ["Bueno", "Regular", "Malo"]);
  const sistProteccion = formatearCasillaOpcion(v.sistema_proteccion, ["Estab.", "UPS"]);
  const tinta = valorOTextoVacio(v.tinta);
  const lineaLN = valorOTextoVacio(v.revision_linea_ln);
  const lineaLT = valorOTextoVacio(v.revision_linea_lt);
  const lineaNT = valorOTextoVacio(v.revision_linea_nt);
  const operador = valorOTextoVacio(v.operador);

  const procedimiento = valorOTextoVacio(v.procedimiento);
  const conclusion = valorOTextoVacio(v.conclusion);
  const recomendaciones = valorOTextoVacio(v.recomendaciones);

  const repuestosTipo = formatearCasillaOpcion(v.repuestos_tipo, ["Venta", "Descarte", "Garantía"]);
  const codigoRepuesto = v.codigo_repuesto?.trim();
  const descRepuesto = v.repuestos_descripcion?.trim();
  const cantRepuesto = v.repuestos_cantidad?.trim();
  const tieneRepuestos = Boolean(codigoRepuesto || descRepuesto || cantRepuesto);

  const horaLlegada = valorOTextoVacio(v.hora_llegada);
  const horaSalida = valorOTextoVacio(v.hora_salida);
  const garantia = casillaBooleana(v.garantia);
  const facturado = casillaBooleana(v.facturado);

  const firmaOperador = v.firma_operador ? `Firmado (${v.firma_operador})` : "Sin firmar";
  const firmaCliente = v.firma_cliente ? `Firmado (${v.firma_cliente})` : "Sin firmar";

  let md = `# **Reporte técnico N.º ${numReporte}**\n\n`;
  md += `**Encabezado:** GO LATAM – Soporte técnico multimarcas\n\n`;

  md += `| Campo | Contenido |\n`;
  md += `| :---- | :---- |\n`;
  md += `| **Técnico** | ${tecnico} |\n`;
  md += `| **N.º** | ${numReporte} |\n`;
  md += `| **Empresa** | ${empresa} |\n`;
  md += `| **Fecha** | ${fecha} |\n`;
  md += `| **Teléfono** | ${telefono} |\n`;
  md += `| **Dirección** | ${direccion} |\n`;
  md += `| **Equipo** | ${equipo} |\n`;
  md += `| **Contacto** | ${contacto} |\n`;
  md += `| **Motivo** | ${motivo} |\n\n`;

  md += `***Texto impreso:** El cliente acepta los términos y condiciones del servicio, de acuerdo a las cláusulas de la carta de garantía de servicio. Los servicios que se realicen y no sean considerados parte de la garantía serán cobrados al cliente, de acuerdo a la tarifa estándar de servicio ($ 40.00 más IGV la hora o fracción).*\n\n`;

  md += `## **Revisión inicial**\n\n`;
  md += `| Campo | Opciones / Valor |\n`;
  md += `| :---- | :---- |\n`;
  md += `| Estado del equipo | ${estadoEquipo} |\n`;
  md += `| Último mant. | ${ultimoMant} |\n`;
  md += `| Limpieza del equipo | ${limpieza} |\n`;
  md += `| Cabezales | ${cabezales} |\n`;
  md += `| Sist. de protección | ${sistProteccion} |\n`;
  md += `| Tinta | ${tinta} |\n`;
  md += `| Revisión de líneas | L+N (${lineaLN}) · L+T (${lineaLT}) · N+T (${lineaNT}) |\n`;
  md += `| Operador | ${operador} |\n\n`;

  md += `## **Procedimiento, conclusión y recomendaciones**\n\n`;
  md += `| Sección | Texto manuscrito |\n`;
  md += `| :---- | :---- |\n`;
  md += `| **Procedimiento** | ${procedimiento} |\n`;
  md += `| **Conclusión** | ${conclusion} |\n`;
  md += `| **Recomendaciones** | ${recomendaciones} |\n\n`;

  md += `## **Repuestos e información de la labor**\n\n`;
  md += `| Repuestos requeridos | Detalle |\n`;
  md += `| :---- | :---- |\n`;
  md += `| Tipo | ${repuestosTipo} |\n`;
  if (tieneRepuestos) {
    md += `| Tabla (Código / Descripción / Cant.) | ${codigoRepuesto ?? "-"} / ${descRepuesto ?? "-"} / ${cantRepuesto ?? "-"} |\n\n`;
  } else {
    md += `| Tabla (Código / Descripción / Cant.) | Vacía |\n\n`;
  }

  md += `| Información de la labor | Valor |\n`;
  md += `| :---- | :---- |\n`;
  md += `| Hora de llegada del cliente | ${horaLlegada} |\n`;
  md += `| Hora de salida del cliente | ${horaSalida} |\n`;
  md += `| Garantía | ${garantia} |\n`;
  md += `| Facturado | ${facturado} |\n\n`;

  md += `***Texto impreso:** Con el VB° doy la conformidad de que el servicio se realizó tal como indica este informe.*\n\n`;
  md += `**Firmas:** Operador: ${firmaOperador} · Cliente: ${firmaCliente}\n\n`;

  md += `### Pie de página y datos de contacto\n\n`;
  md += `* WhatsApp: 51 943116468  \n`;
  md += `* Correos: admin@goservicelatam.com.pe · serviciotecnico@goservicelatam.co  \n`;
  md += `* Dirección: Jirón Huánuco 2131 int 233 – Galería LA MULTI (cruce de Huánuco con Italia – Gamarra)  \n`;
  md += `* Redes: goservicelatam\n`;

  return md;
}

