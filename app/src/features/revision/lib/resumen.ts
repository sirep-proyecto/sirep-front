/**
 * Responsabilidad: calcular las cifras del resumen superior de la bandeja
 * (reportes pendientes, campos dudosos totales, completados hoy y total).
 * Existe como función pura para que la definición de "pendiente" y de "hoy"
 * esté probada en un solo lugar; si cada vista contara por su cuenta, el
 * resumen y la tabla podrían contradecirse.
 */

import { calcularPendientes } from "@/features/revision/lib/dudosos";
import type {
    Reporte,
    ResumenBandeja,
} from "@/features/revision/types/dominio";

/**
 * Compara el calendario local (año, mes, día) y no el instante: un reporte
 * cerrado a las 23:30 sigue contando para el día en que se cerró, aunque en
 * otra zona horaria la fecha del ISO ya haya cambiado.
 */
function esMismoDiaLocal(iso: string, dia: Date): boolean {
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return false;
    return (
        fecha.getFullYear() === dia.getFullYear() &&
        fecha.getMonth() === dia.getMonth() &&
        fecha.getDate() === dia.getDate()
    );
}

/**
 * Cuándo se completó un reporte: el momento de la última intervención de una persona
 * (confirmar o corregir un campo). Si nadie intervino, la fecha de completado del
 * backend. Así un reporte que solo se vuelve a guardar o se envía a RP-TECH no cuenta
 * como completado hoy.
 */
function fechaCompletado(reporte: Reporte): string | null {
    if (reporte.estado !== "completo") return null;
    let mejor: string | null = null;
    let mejorInstante = Number.NEGATIVE_INFINITY;
    for (const campo of reporte.campos) {
        for (const iso of [campo.revisado_en, campo.corregido_en]) {
            const instante = iso ? Date.parse(iso) : Number.NaN;
            if (Number.isFinite(instante) && instante > mejorInstante) {
                mejorInstante = instante;
                mejor = iso;
            }
        }
    }
    return mejor ?? reporte.completado_en;
}

/** Nombres de las cuentas que intervinieron en algún campo en el día `hoy`. */
function revisoresDelDia(reportes: readonly Reporte[], hoy: Date): string[] {
    const nombres = new Set<string>();
    for (const reporte of reportes) {
        for (const campo of reporte.campos) {
            if (campo.revisado_por && campo.revisado_en && esMismoDiaLocal(campo.revisado_en, hoy)) {
                nombres.add(campo.revisado_por.trim());
            }
            if (campo.corregido_por && campo.corregido_en && esMismoDiaLocal(campo.corregido_en, hoy)) {
                nombres.add(campo.corregido_por.trim());
            }
        }
    }
    return [...nombres].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * `hoy` es opcional para que las pruebas puedan fijar el día; en producción
 * siempre es la fecha del sistema (se evalúa en cada llamada, no al cargar el módulo).
 */
export function calcularResumenBandeja(
    reportes: readonly Reporte[],
    hoy: Date = new Date(),
): ResumenBandeja {
    const dudososPorReporte = reportes.map(
        (reporte) => calcularPendientes(reporte.campos).dudosos,
    );
    return {
        // Pendiente es todo lo que todavía espera trabajo del técnico: cualquier
        // estado distinto de "completo", incluido "recibido" (sin leer todavía).
        reportes_pendientes: reportes.filter((reporte) => reporte.estado !== "completo")
            .length,
        // Solo cuenta los campos que siguen sin resolver; es la misma regla que la
        // columna "Dudosos pendientes" de la tabla, así que ambas coinciden.
        campos_dudosos: dudososPorReporte.reduce((total, n) => total + n, 0),
        reportes_con_dudosos: dudososPorReporte.filter((n) => n > 0).length,
        completados: reportes.filter((reporte) => {
            const cuando = fechaCompletado(reporte);
            return cuando !== null && esMismoDiaLocal(cuando, hoy);
        }).length,
        revisores_hoy: revisoresDelDia(reportes, hoy),
        total: reportes.length,
    };
}
