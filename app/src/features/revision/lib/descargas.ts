/**
 * Responsabilidad: orquestar la descarga de transcripciones en Markdown y PDF
 * en el cliente mediante Blobs y disparadores de enlace temporal.
 */

import { generarMarkdownReporte } from "./serializador-markdown";
import { generarPDFReporte } from "./generador-pdf";
import type { ReporteVista } from "@/features/revision/types/dominio";

export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export function descargarReporteMarkdown(reporte: ReporteVista): void {
  const md = generarMarkdownReporte(reporte);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const numero = reporte.numero_reporte || "reporte";
  descargarBlob(blob, `Reporte_${numero}.md`);
}

export function descargarReportePDF(reporte: ReporteVista): void {
  const doc = generarPDFReporte(reporte);
  const numero = reporte.numero_reporte || "reporte";
  doc.save(`Reporte_${numero}.pdf`);
}

export async function descargarReporteAmbos(reporte: ReporteVista): Promise<void> {
  // Primero descargamos el PDF
  descargarReportePDF(reporte);

  // Pequeña pausa asíncrona para que el navegador no bloquee la segunda descarga
  await new Promise((resolve) => setTimeout(resolve, 350));

  // Luego descargamos el Markdown
  descargarReporteMarkdown(reporte);
}

