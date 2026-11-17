/**
 * Responsabilidad: validar y persistir el modo del visor (Original / Corregido /
 * Lado a lado) en `localStorage`.
 * Existe para que la elección sobreviva a recargar la página sin que un valor
 * viejo o corrupto rompa el visor, y para que el acceso a `localStorage`, que
 * puede lanzar en ventanas privadas o con datos bloqueados, nunca tumbe la vista.
 */

export type ModoVisor = "original" | "corregido" | "lado_a_lado";

export const MODOS_VISOR: readonly { valor: ModoVisor; etiqueta: string }[] = [
    { valor: "original", etiqueta: "Original" },
    { valor: "corregido", etiqueta: "Corregido" },
    { valor: "lado_a_lado", etiqueta: "Lado a lado" },
];

export const CLAVE_MODO_VISOR = "sirep.visor.modo";
export const MODO_VISOR_POR_DEFECTO: ModoVisor = "original";

export function interpretarModoVisor(valor: string | null): ModoVisor {
    return MODOS_VISOR.some((modo) => modo.valor === valor)
        ? (valor as ModoVisor)
        : MODO_VISOR_POR_DEFECTO;
}

/** Respaldo en memoria para cuando `localStorage` no deja escribir. */
let ultimoModo: ModoVisor | null = null;

export function leerModoVisor(): ModoVisor {
    if (ultimoModo) return ultimoModo;
    try {
        return interpretarModoVisor(window.localStorage.getItem(CLAVE_MODO_VISOR));
    } catch {
        return MODO_VISOR_POR_DEFECTO;
    }
}

export function guardarModoVisor(modo: ModoVisor): void {
    ultimoModo = modo;
    try {
        window.localStorage.setItem(CLAVE_MODO_VISOR, modo);
    } catch {
        // Sin almacenamiento el visor sigue funcionando; solo no recuerda la elección.
    }
}
