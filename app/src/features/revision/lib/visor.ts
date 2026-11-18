/**
 * Responsabilidad: reglas puras del visor del escaneo: zoom con la rueda (hacia
 * el cursor) y qué campo hay bajo un clic sobre la hoja.
 * Existe aparte del componente para poder probarlas sin navegador.
 */

import type { CampoVista, IdCampo } from "@/features/revision/types/dominio";
import type { NumeroPagina } from "@/features/revision/types/regiones";

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 4;
/** Paso de los botones − / +. */
export const PASO_ZOOM = 0.2;

export function limitarZoom(zoom: number): number {
    if (!Number.isFinite(zoom)) return 1;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom * 100) / 100));
}

/** Zoom después de un giro de rueda (o pellizco en el touchpad): suave y proporcional. */
export function zoomConRueda(zoom: number, deltaY: number): number {
    return limitarZoom(zoom * Math.exp(-deltaY * 0.0015));
}

/**
 * Desplazamiento para que el punto bajo el cursor siga bajo el cursor al
 * cambiar el zoom. `offset` es la distancia del cursor al borde visible.
 */
export function desplazamientoAnclado(scroll: number, offset: number, zoomAntes: number, zoomDespues: number): number {
    if (zoomAntes <= 0) return scroll;
    return Math.max(0, (scroll + offset) * (zoomDespues / zoomAntes) - offset);
}

/** Margen (fracción de la hoja) para que un clic justo en el borde del recuadro cuente. */
const TOLERANCIA = 0.006;

/**
 * Campo cuya zona contiene el punto (x, y en 0–1 de la página). Si hay varias
 * zonas encimadas gana la más chica, que es la más específica (una casilla
 * dentro de un recuadro grande).
 */
export function campoEnPunto(
    campos: readonly CampoVista[],
    pagina: NumeroPagina,
    x: number,
    y: number,
): IdCampo | null {
    let mejor: { id: IdCampo; area: number } | null = null;
    for (const campo of campos) {
        const r = campo.region;
        if (!r || r.pagina !== pagina) continue;
        const dentro =
            x >= r.x - TOLERANCIA &&
            x <= r.x + r.ancho + TOLERANCIA &&
            y >= r.y - TOLERANCIA &&
            y <= r.y + r.alto + TOLERANCIA;
        if (!dentro) continue;
        const area = r.ancho * r.alto;
        if (!mejor || area < mejor.area) mejor = { id: campo.id, area };
    }
    return mejor?.id ?? null;
}
