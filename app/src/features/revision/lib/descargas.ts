/**
 * Responsabilidad: orquestar la descarga de transcripciones: el Markdown se arma
 * en el cliente y el PDF (formato del reporte técnico de RP-TECH) lo genera el
 * backend con los valores ya corregidos; ambos se guardan mediante Blobs y
 * un enlace temporal.
 */

import { generarMarkdownReporte } from "./serializador-markdown";
import { obtenerPdfReporte } from "@/lib/api";
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

/** Descarga el PDF generado por el backend. Lanza `ApiError` si el servidor falla. */
export async function descargarReportePDF(reporte: ReporteVista): Promise<void> {
  const numero = reporte.numero_reporte || reporte.numero_talonario;
  if (!numero) throw new Error("El reporte no tiene número para generar el PDF.");
  const blob = await obtenerPdfReporte(numero);
  descargarBlob(blob, `Reporte_${numero}.pdf`);
}

export async function descargarReporteAmbos(reporte: ReporteVista): Promise<void> {
  // Primero descargamos el PDF
  await descargarReportePDF(reporte);

  // Pequeña pausa asíncrona para que el navegador no bloquee la segunda descarga
  await new Promise((resolve) => setTimeout(resolve, 350));

  // Luego descargamos el Markdown
  descargarReporteMarkdown(reporte);
}

