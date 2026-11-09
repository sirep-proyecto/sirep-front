/**
 * Responsabilidad: generar un documento PDF sobrio, profesional y en blanco y negro
 * con la transcripción técnica del reporte, usando jsPDF y jspdf-autotable.
 * Sigue la misma estructura y contenido que BACETTO_03.md.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    return opciones.map((op) => `[ ] ${op}`).join("   ");
  }

  const normalizado = valor.toLowerCase().trim();
  return opciones
    .map((op) => {
      const match = normalizado.includes(op.toLowerCase());
      return `${match ? "[X]" : "[ ]"} ${op}`;
    })
    .join("   ");
}

function casillaBooleana(valor: string | null): string {
  if (!valor) return "[ ]";
  const v = valor.toLowerCase().trim();
  const esVerdadero = v === "si" || v === "sí" || v === "true" || v === "1" || v === "x";
  return esVerdadero ? "[X]" : "[ ]";
}

function valorOTextoVacio(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor.trim() === "") {
    return "(vacío)";
  }
  return valor.trim();
}

export function generarPDFReporte(reporte: ReporteVista): jsPDF {
  const v = obtenerMapaValores(reporte.campos);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

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

  const margenIzq = 14;
  const margenDer = 14;
  const anchoPagina = 210;
  const anchoContenido = anchoPagina - margenIzq - margenDer;

  // 1. Encabezado principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text("GO SERVICE LATAM", margenIzq, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Soporte Técnico Multimarcas · Digitalización de Reportes Técnicos", margenIzq, 21);

  // Número de reporte a la derecha
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`REPORTE TÉCNICO N.º ${numReporte}`, anchoPagina - margenDer, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fecha: ${fecha}`, anchoPagina - margenDer, 21, { align: "right" });

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margenIzq, 24, anchoPagina - margenDer, 24);

  let cursorY = 28;

  // Estilos compartidos de tablas para monocromía limpia y legible
  const estilosBase = {
    font: "helvetica" as const,
    fontSize: 8,
    cellPadding: 2,
    lineColor: [215, 215, 215] as [number, number, number],
    lineWidth: 0.2,
    textColor: [30, 30, 30] as [number, number, number],
  };

  const estiloCabecera = {
    fillColor: [243, 244, 246] as [number, number, number],
    textColor: [20, 20, 20] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 8.5,
  };

  // 2. Tabla Identificación y Equipo
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenIzq, right: margenDer },
    styles: estilosBase,
    headStyles: estiloCabecera,
    head: [["Campo", "Contenido", "Campo", "Contenido"]],
    body: [
      ["Técnico", tecnico, "N.° de reporte", numReporte],
      ["Empresa", empresa, "Fecha", fecha],
      ["Contacto", contacto, "Teléfono", telefono],
      ["Equipo", equipo, "Motivo", motivo],
      ["Dirección", { content: direccion, colSpan: 3 }],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26 },
      1: { cellWidth: 65 },
      2: { fontStyle: "bold", cellWidth: 26 },
      3: { cellWidth: 65 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

  // Texto legal términos de garantía
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.8);
  doc.setTextColor(110, 110, 110);
  const textoLegal =
    "Texto impreso: El cliente acepta los términos y condiciones del servicio, de acuerdo a las cláusulas de la carta de garantía de servicio. Los servicios no considerados parte de la garantía serán cobrados según la tarifa estándar ($ 40.00 más IGV la hora o fracción).";
  const lineasLegal = doc.splitTextToSize(textoLegal, anchoContenido);
  doc.text(lineasLegal, margenIzq, cursorY);
  cursorY += lineasLegal.length * 3 + 2;

  // 3. Revisión inicial
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenIzq, right: margenDer },
    styles: estilosBase,
    headStyles: estiloCabecera,
    head: [["Revisión inicial", "Opciones / Valor"]],
    body: [
      ["Estado del equipo", estadoEquipo],
      ["Último mantenimiento", ultimoMant],
      ["Limpieza del equipo", limpieza],
      ["Cabezales", cabezales],
      ["Sistema de protección", sistProteccion],
      ["Tinta", tinta],
      ["Revisión de líneas", `L+N: ${lineaLN}   ·   L+T: ${lineaLT}   ·   N+T: ${lineaNT}`],
      ["Operador del equipo", operador],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 46 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 4. Procedimiento, conclusión y recomendaciones
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenIzq, right: margenDer },
    styles: estilosBase,
    headStyles: estiloCabecera,
    head: [["Sección", "Detalle técnico transcrito"]],
    body: [
      ["Procedimiento", procedimiento],
      ["Conclusión", conclusion],
      ["Recomendaciones", recomendaciones],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 5. Repuestos e información de la labor
  const detalleRepuestos = tieneRepuestos
    ? `Código: ${codigoRepuesto ?? "-"}  |  Descripción: ${descRepuesto ?? "-"}  |  Cantidad: ${cantRepuesto ?? "-"}`
    : "Vacía (Sin repuestos solicitados)";

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenIzq, right: margenDer },
    styles: estilosBase,
    headStyles: estiloCabecera,
    head: [["Repuestos e información de la labor", "Detalle"]],
    body: [
      ["Tipo de repuestos", repuestosTipo],
      ["Tabla de repuestos", detalleRepuestos],
      ["Horario de atención", `Llegada: ${horaLlegada}   ·   Salida: ${horaSalida}`],
      ["Garantía / Facturado", `Garantía: ${garantia}   ·   Facturado: ${facturado}`],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 6. Conformidad y firmas
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenIzq, right: margenDer },
    styles: estilosBase,
    headStyles: estiloCabecera,
    head: [["Conformidad y firmas", "Estado"]],
    body: [
      ["Conformidad del servicio", "Con el VB° doy la conformidad de que el servicio se realizó tal como indica este informe."],
      ["Firma del operador del equipo", firmaOperador],
      ["Firma del cliente o administrador", firmaCliente],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
    },
  });

  // 7. Pie de página en todas las páginas generadas
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margenIzq, 285, anchoPagina - margenDer, 285);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "GO Service Latam SAC · admin@goservicelatam.com.pe · WhatsApp: +51 943116468",
      margenIzq,
      289,
    );
    doc.text(`Página ${i} de ${totalPaginas}`, anchoPagina - margenDer, 289, { align: "right" });
  }

  return doc;
}

