/**
 * Responsabilidad: saber qué personas (cuentas) intervinieron en un reporte.
 * Cada confirmación, corrección, omisión o marca de ilegible queda con el nombre de la
 * cuenta que la hizo; aquí se juntan esos nombres para mostrarlos en la bandeja.
 */

import type { CampoReporte } from "@/features/revision/types/dominio";

/** Nombres sin repetir, de quien intervino más recientemente a quien lo hizo antes. */
export function revisoresDeReporte(campos: readonly CampoReporte[]): string[] {
  const ultimaIntervencion = new Map<string, number>();

  const anotar = (nombre: string | null, fecha: string | null) => {
    const limpio = nombre?.trim();
    if (!limpio) return;
    const instante = fecha ? Date.parse(fecha) : Number.NaN;
    const valor = Number.isFinite(instante) ? instante : 0;
    ultimaIntervencion.set(limpio, Math.max(ultimaIntervencion.get(limpio) ?? 0, valor));
  };

  for (const campo of campos) {
    anotar(campo.revisado_por, campo.revisado_en);
    anotar(campo.corregido_por, campo.corregido_en);
  }

  return [...ultimaIntervencion.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([nombre]) => nombre);
}

/** Texto corto para la celda: "Ana" o "Ana +1"; null si nadie revisó aún. */
export function etiquetaRevisores(nombres: readonly string[]): string | null {
  if (nombres.length === 0) return null;
  if (nombres.length === 1) return nombres[0];
  return `${nombres[0]} +${nombres.length - 1}`;
}
