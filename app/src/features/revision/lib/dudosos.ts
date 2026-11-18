/**
 * Responsabilidad: contar dudosos y resolver la navegación entre campos
 * pendientes. La agrupación por secciones y tarjetas vive en `lib/grupos.ts`.
 * Existe separado de los componentes porque es la lógica que define el ahorro
 * real del producto: si esta cuenta se equivoca, el técnico revisa de más o de
 * menos.
 */

import { ORDEN_CAMPOS } from "@/config/campos-formulario";
import type { IdCampo } from "@/features/revision/types/campos";
import type {
    CampoReporte,
    CampoVista,
    PendientesRevision,
} from "@/features/revision/types/dominio";

/** Un campo es dudoso por cómo lo leyó el modelo, no por su estado de revisión. */
export function esDudoso(
    campo: Pick<CampoReporte, "confianza" | "no_leido">,
): boolean {
    return (
        campo.no_leido ||
        campo.confianza === "media" ||
        campo.confianza === "baja"
    );
}

export function requiereRevision(
    campo: Pick<CampoReporte, "estado_revision">,
): boolean {
    return campo.estado_revision === "pendiente";
}

/**
 * Lo que el técnico tiene que mirar: dudoso por cómo lo leyó el modelo o
 * pendiente porque el backend lo marcó para revisión. El backend deja
 * pendiente también un campo leído con confianza alta si la IA lo marcó
 * `dudoso` (pasa, por ejemplo, cuando se suben muchos reportes a la vez); sin
 * esto quedaba fuera de "Solo dudosos" y solo se veía en "Todos los campos".
 */
export function entraEnRevision(
    campo: Pick<CampoReporte, "confianza" | "no_leido" | "estado_revision">,
): boolean {
    return esDudoso(campo) || requiereRevision(campo);
}

export function fueResueltoPorPersona(
    campo: Pick<CampoReporte, "estado_revision">,
): boolean {
    return (
        campo.estado_revision === "confirmado" ||
        campo.estado_revision === "corregido" ||
        campo.estado_revision === "ilegible" ||
        campo.estado_revision === "omitido"
    );
}

export function contarPendientes(campos: readonly CampoReporte[]): number {
    return campos.filter(requiereRevision).length;
}

/**
 * Pendientes = campos que de verdad frenan el cierre del reporte (estado "pendiente"),
 * sean dudosos por cómo los leyó el modelo o marcados para revisión por el backend.
 * Así el contador coincide con el estado "En revisión" del reporte: antes un campo
 * pendiente con confianza alta no se contaba y el reporte parecía no tener nada por revisar.
 */
export function calcularPendientes(
    campos: readonly CampoReporte[],
): PendientesRevision {
    const involucrados = campos.filter(entraEnRevision);
    return {
        total: involucrados.length,
        resueltos: involucrados.filter(fueResueltoPorPersona).length,
        dudosos: involucrados.filter(requiereRevision).length,
    };
}

export interface ResumenDisposiciones {
    confirmados: number;
    corregidos: number;
    ilegibles: number;
    omitidos: number;
}

export function resumirDisposiciones(
    campos: readonly CampoReporte[],
): ResumenDisposiciones {
    return {
        confirmados: campos.filter((campo) => campo.estado_revision === "confirmado")
            .length,
        corregidos: campos.filter((campo) => campo.estado_revision === "corregido")
            .length,
        ilegibles: campos.filter((campo) => campo.estado_revision === "ilegible")
            .length,
        omitidos: campos.filter((campo) => campo.estado_revision === "omitido")
            .length,
    };
}

/**
 * Devuelve el siguiente (o anterior) campo pendiente en el orden del inventario.
 * Itera circularmente porque el técnico puede volver al principio sin usar el
 * mouse; si el campo actual ya no está pendiente, arranca por el primero.
 */
export function siguienteCampoPendiente(
    campos: readonly CampoReporte[],
    actual: IdCampo | null,
    direccion: 1 | -1 = 1,
): IdCampo | null {
    const pendientes = campos
        .filter(requiereRevision)
        .sort((a, b) => ORDEN_CAMPOS[a.id] - ORDEN_CAMPOS[b.id])
        .map((campo) => campo.id);

    if (pendientes.length === 0) return null;

    const indiceActual = actual ? pendientes.indexOf(actual) : -1;
    if (indiceActual === -1) {
        return direccion === 1 ? pendientes[0] : pendientes[pendientes.length - 1];
    }

    const siguiente =
        (indiceActual + direccion + pendientes.length) % pendientes.length;
    return pendientes[siguiente];
}

export function camposPendientesOrdenados(
    campos: readonly CampoVista[],
): CampoVista[] {
    return campos
        .filter(requiereRevision)
        .sort((a, b) => ORDEN_CAMPOS[a.id] - ORDEN_CAMPOS[b.id]);
}