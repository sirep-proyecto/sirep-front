/**
 * Responsabilidad: describir en palabras dónde está cada reporte histórico
 * respecto de RP-TECH (guardado, rechazado, por reintentar o por enviar).
 * Existe para que la bandeja, la cabecera del reporte y el aviso de rechazo
 * usen la misma regla y el mismo texto.
 *
 * Contrato: docs/contrato-historico.md. El backend de SIREP envía solo el
 * reporte al terminar de revisarlo; aquí solo se muestra el resultado.
 */

import type { ErrorRptech, Reporte } from "@/features/revision/types/dominio";

export type EstadoRptech = "guardado" | "rechazado" | "reintentar" | "por_enviar";

export function estadoRptech(
  reporte: Pick<Reporte, "origen" | "estado" | "estado_reporte" | "rptech_id" | "rptech_error">,
): EstadoRptech | null {
  if (reporte.origen !== "historico") return null;
  if (reporte.rptech_id || reporte.estado_reporte === "aprobado_rptech") return "guardado";
  if (reporte.estado_reporte === "observado" && reporte.rptech_error) return "rechazado";
  if (reporte.rptech_error?.codigo === "reintentar") return "reintentar";
  if (reporte.estado === "completo") return "por_enviar";
  return null;
}

export const ETIQUETAS_RPTECH: Record<
  EstadoRptech,
  { etiqueta: string; descripcion: string; tono: "green" | "brick" | "amber" | "neutral" }
> = {
  guardado: {
    etiqueta: "En RP-TECH",
    descripcion: "RP-TECH confirmó que lo guardó. Ya no se puede reabrir.",
    tono: "green",
  },
  rechazado: {
    etiqueta: "Rechazado por RP-TECH",
    descripcion: "RP-TECH no lo aceptó. Corrige los campos indicados y se vuelve a enviar.",
    tono: "brick",
  },
  reintentar: {
    etiqueta: "Envío pendiente",
    descripcion: "No hubo respuesta de RP-TECH. Se reintenta en el próximo envío.",
    tono: "amber",
  },
  por_enviar: {
    etiqueta: "Por enviar",
    descripcion: "Revisado. Se enviará a RP-TECH en el próximo envío.",
    tono: "neutral",
  },
};

/** Nombre del contrato → campo del formulario de SIREP, para mostrar el motivo con la etiqueta que ve el revisor. */
const CAMPO_FORMULARIO: Record<string, string> = {
  cliente_texto: "empresa",
  equipo_texto: "equipo",
  tecnico_texto: "tecnico",
  direccion_texto: "direccion",
  contacto_texto: "contacto",
  telefono_texto: "telefono",
  estado_equipo: "estado_del_equipo",
  limpieza: "limpieza_equipo",
  estado_cabezales: "cabezales",
  voltaje_ln: "revision_linea_ln",
  voltaje_lt: "revision_linea_lt",
  voltaje_nt: "revision_linea_nt",
  firma_operador_presente: "firma_operador",
  firma_cliente_presente: "firma_cliente",
};

const MOTIVOS_GENERALES: Record<string, string> = {
  talonario_duplicado: "Ese N° de talonario ya está cargado en RP-TECH con otro reporte.",
  escaneo_muy_grande: "El escaneo pesa más de lo que acepta RP-TECH (10 MB).",
  escaneo: "No se pudo leer el escaneo original.",
};

export interface MotivoRechazo {
  campo: string | null;
  texto: string;
}

/** Convierte el error de RP-TECH en una lista de motivos legibles. */
export function motivosRechazo(
  error: ErrorRptech | null | undefined,
  etiquetaDe: (idCampo: string) => string | undefined,
): MotivoRechazo[] {
  if (!error) return [];
  const { codigo, detalle } = error;
  if (detalle && typeof detalle === "object" && !Array.isArray(detalle)) {
    return Object.entries(detalle as Record<string, unknown>).map(([campo, motivo]) => {
      const base = campo.split(/[.[]/)[0];
      const id = CAMPO_FORMULARIO[base] ?? base;
      return { campo: etiquetaDe(id) ?? campo, texto: String(motivo) };
    });
  }
  const texto = typeof detalle === "string" && detalle ? detalle : MOTIVOS_GENERALES[codigo] ?? `RP-TECH respondió: ${codigo}`;
  return [{ campo: null, texto }];
}
