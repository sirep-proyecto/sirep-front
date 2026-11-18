/**
 * Responsabilidad: probar cómo el estado "omitido" entra en el conteo de
 * dudosos, el valor vigente y las disposiciones.
 * Existe porque omitido cuenta como revisado pero no tiene valor: si se tratara
 * como pendiente el reporte nunca cerraría, y si conservara el valor del modelo
 * se exportaría algo que la persona dijo que no estaba en el papel.
 */

import { describe, expect, it } from "vitest";

import type {
    CampoReporte,
    EstadoRevisionCampo,
} from "@/features/revision/types/dominio";

import { valorDeRespaldo, valorVigente } from "./campos";
import {
    calcularPendientes,
    entraEnRevision,
    fueResueltoPorPersona,
    requiereRevision,
    resumirDisposiciones,
    siguienteCampoPendiente,
} from "./dudosos";
import { ETIQUETAS_REVISION } from "./etiquetas";

function campo(
    estado: EstadoRevisionCampo,
    extra: Partial<CampoReporte> = {},
): CampoReporte {
    return {
        id: "telefono",
        valor_modelo: null,
        confianza: null,
        no_leido: true,
        valor_corregido: null,
        estado_revision: estado,
        revisado_por: null,
        revisado_en: null,
        corregido_por: null,
        corregido_en: null,
        ...extra,
    };
}

describe("estado omitido", () => {
    it("cuenta como revisado y no como pendiente", () => {
        const omitido = campo("omitido");
        expect(fueResueltoPorPersona(omitido)).toBe(true);
        expect(requiereRevision(omitido)).toBe(false);
    });

    it("resuelve un dudoso sin dejar pendientes", () => {
        expect(
            calcularPendientes([campo("omitido"), campo("pendiente", { id: "tinta" })]),
        ).toEqual({ total: 2, resueltos: 1, dudosos: 1 });
    });

    it("no entra en la cola de pendientes del teclado", () => {
        expect(
            siguienteCampoPendiente(
                [campo("omitido"), campo("pendiente", { id: "tinta" })],
                null,
            ),
        ).toBe("tinta");
    });

    it("es vacío aunque el modelo hubiera devuelto un valor", () => {
        const omitido = campo("omitido", { valor_modelo: "algo", no_leido: false });
        expect(valorVigente(omitido)).toBeNull();
        expect(valorDeRespaldo(omitido)).toBe("Omitido");
    });

    it("se cuenta aparte en las disposiciones", () => {
        expect(
            resumirDisposiciones([
                campo("omitido"),
                campo("omitido", { id: "tinta" }),
                campo("confirmado", { id: "equipo" }),
            ]),
        ).toEqual({ confirmados: 1, corregidos: 0, ilegibles: 0, omitidos: 2 });
    });

    it("se muestra como 'Omitido'", () => {
        expect(ETIQUETAS_REVISION.omitido.etiqueta).toBe("Omitido");
    });
});

describe("campos pendientes que el modelo leyó con confianza alta", () => {
    it("cuentan como pendientes porque frenan el cierre del reporte", () => {
        const pendienteAlta = campo("pendiente", { confianza: "alta", no_leido: false });
        expect(calcularPendientes([pendienteAlta])).toEqual({
            total: 1,
            resueltos: 0,
            dudosos: 1,
        });
    });

    it("un campo de confianza alta ya confirmado sin ser dudoso no entra en la cuenta", () => {
        const sinDuda = campo("auto", { confianza: "alta", no_leido: false });
        expect(calcularPendientes([sinDuda])).toEqual({ total: 0, resueltos: 0, dudosos: 0 });
    });
});


describe("campos que entran en revisión", () => {
    it("incluye un pendiente leído con confianza alta (marcado dudoso por la IA)", () => {
        const alta = campo("pendiente", { confianza: "alta", no_leido: false });
        expect(entraEnRevision(alta)).toBe(true);
        expect(calcularPendientes([alta])).toEqual({ total: 1, resueltos: 0, dudosos: 1 });
    });

    it("deja fuera un campo de confianza alta que no está pendiente", () => {
        expect(entraEnRevision(campo("auto", { confianza: "alta", no_leido: false }))).toBe(false);
    });
});
