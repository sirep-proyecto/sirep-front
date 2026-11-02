/**
 * Responsabilidad: dibujo del talonario falso (papel, tinta, marca de agua e
 * irregularidades de la letra manuscrita simulada).
 * Existe en `config/` y no en `mocks/` porque es el artefacto visual que
 * comparten la vista de corrección y la calibración: no son datos de negocio y
 * ningún componente debe depender de datos simulados. El contenido manuscrito
 * real de cada reporte llega por props desde el repositorio.
 *
 * Las coordenadas de las regiones salen del mapa (`MAPA_TALONARIO_2005`); acá
 * sólo viven las constantes de tinta y el truco de que cada campo tenga una
 * escritura ligeramente distinta, para que la hoja no parezca un formulario
 * digital con la fuente puesta.
 */

import type { IdCampo } from "@/features/revision/types/campos";

/** Tinta del formulario impreso. */
export const TINTA_IMPRESA = "#4a5a5c";
/** Reglón impreso bajo cada campo. */
export const TINTA_REGLON = "#d6cdb9";
/** Papel del escaneo. */
export const PAPEL = "#fbf8f0";
/** Lapicera del técnico. */
export const TINTA_MANO = "#1f3f5f";
/** Sello de recepción y número de reporte. */
export const TINTA_SELLO = "#a23e2c";

export const MARCA_AGUA = "Technical Training Center";

export const MONO = "var(--font-plex-mono, monospace)";
export const MANO = "var(--font-hand, cursive)";

export interface MarcaMano {
  /** Inclinación en grados: la mano nunca escribe recto. */
  rotacion: number;
  /** Desplazamiento vertical sobre el renglón, en píxeles de la hoja. */
  desfase_y: number;
  /** Escala relativa del texto. */
  escala: number;
  /** Si el campo lleva una tachadura encima. */
  tachadura: boolean;
}

/** Sólo el procedimiento se tacha en las muestras: es el campo más difícil. */
const CAMPOS_TACHADOS: ReadonlySet<IdCampo> = new Set(["procedimiento"]);

/**
 * Hash determinista del identificador: la misma hoja se dibuja igual en el
 * servidor y en el cliente, sin estado aleatorio ni semillas.
 */
function hash(texto: string): number {
  let valor = 5381;
  for (let i = 0; i < texto.length; i += 1) {
    valor = (valor * 33) ^ texto.charCodeAt(i);
  }
  return Math.abs(valor);
}

export function marcasDeMano(id: IdCampo): MarcaMano {
  const base = hash(id);
  return {
    rotacion: ((base % 100) / 100) * 2.6 - 1.3,
    desfase_y: ((base >> 7) % 7) - 3,
    escala: 0.94 + ((base >> 3) % 12) / 100,
    tachadura: CAMPOS_TACHADOS.has(id),
  };
}
