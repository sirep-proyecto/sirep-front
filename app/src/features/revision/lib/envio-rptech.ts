/**
 * Responsabilidad: reglas puras del envío manual a RP-TECH —qué reportes se
 * pueden enviar, cuántos hay por enviar y cómo se redactan los resultados y
 * los errores que ve la persona.
 * Existe separado de los componentes y del servicio para probar los textos y
 * el conteo sin red ni DOM, y para que el botón por fila y el botón global
 * hablen igual.
 */

import { ApiError } from "@/lib/api";
import { estadoRptech, type EstadoRptech } from "@/features/revision/lib/rptech";
import type { Reporte } from "@/features/revision/types/dominio";

/** Respuesta de `PATCH /reportes/:numero/importar`. */
export interface RespuestaEnvio {
  status: "ya_importado" | "importado_exitoso";
  numero_reporte: string;
  mensaje: string;
  reporte?: Reporte;
}

/** Respuesta de `POST /reportes/importar-lote`. */
export interface ResumenLote {
  totalRevisadosListos: number;
  importadosNuevos: number;
  yaImportados: number;
  pendientesOmitidos: number;
  numerosImportados: string[];
  observados: string[];
  porReintentar: string[];
}

type ReporteEnviable = Pick<
  Reporte,
  "origen" | "estado" | "estado_reporte" | "rptech_id" | "rptech_error"
>;

const ESTADOS_ENVIABLES: readonly EstadoRptech[] = ["por_enviar", "reintentar", "rechazado"];

/** El botón por fila aparece en estos estados (incluye rechazados: se reenvían). */
export function puedeEnviarse(reporte: ReporteEnviable): boolean {
  const estado = estadoRptech(reporte);
  return estado !== null && ESTADOS_ENVIABLES.includes(estado);
}

/** "Reenviar" cuando ya hubo un intento (rechazado o por reintentar). */
export function textoBotonEnvio(reporte: ReporteEnviable): "Enviar" | "Reenviar" {
  return estadoRptech(reporte) === "por_enviar" ? "Enviar" : "Reenviar";
}

/** Cuántos reportes toma el envío en lote: `por_enviar` + `reintentar` (los rechazados esperan corrección). */
export function contarPorEnviar(reportes: readonly ReporteEnviable[]): number {
  return reportes.filter((r) => {
    const estado = estadoRptech(r);
    return estado === "por_enviar" || estado === "reintentar";
  }).length;
}

export function mensajeEnvioExitoso(respuesta: RespuestaEnvio): string {
  return respuesta.status === "ya_importado"
    ? "Ya estaba en RP-TECH"
    : "Enviado a RP-TECH";
}

/** Texto del error para mostrar tal cual; prefiere el `message` del backend. */
export function mensajeErrorEnvio(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0 || error.status === 408) {
      return "No hay conexión con el servidor de SIREP. Inténtalo de nuevo.";
    }
    const mensaje = error.message?.trim();
    if (mensaje) return mensaje;
    if (error.status === 409) return "RP-TECH rechazó el reporte.";
    if (error.status === 503) return "RP-TECH no está disponible en este momento.";
    if (error.status === 400) return "El reporte no se puede enviar todavía.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "No se pudo enviar el reporte a RP-TECH.";
}

function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

/** "3 enviados · 1 ya estaba · 1 rechazado (N° 000845) · 2 por reintentar". */
export function textoResumenLote(resumen: ResumenLote): string {
  const partes: string[] = [];
  if (resumen.importadosNuevos > 0) {
    partes.push(plural(resumen.importadosNuevos, "enviado", "enviados"));
  }
  if (resumen.yaImportados > 0) {
    partes.push(
      resumen.yaImportados === 1 ? "1 ya estaba" : `${resumen.yaImportados} ya estaban`,
    );
  }
  if (resumen.observados.length > 0) {
    const n = resumen.observados.length;
    partes.push(
      `${plural(n, "rechazado", "rechazados")} (${n === 1 ? "N°" : "N°s"} ${resumen.observados.join(", ")})`,
    );
  }
  if (resumen.porReintentar.length > 0) {
    partes.push(`${resumen.porReintentar.length} por reintentar`);
  }
  return partes.length > 0 ? partes.join(" · ") : "No había reportes para enviar.";
}

/** El lote es "con problemas" si hubo rechazos o reintentos: cambia el tono del aviso. */
export function loteConProblemas(resumen: ResumenLote): boolean {
  return resumen.observados.length > 0 || resumen.porReintentar.length > 0;
}
