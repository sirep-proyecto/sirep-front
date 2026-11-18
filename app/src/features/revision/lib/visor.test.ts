import { describe, expect, it } from "vitest";

import type { CampoVista } from "@/features/revision/types/dominio";

import { campoEnPunto, desplazamientoAnclado, limitarZoom, zoomConRueda, ZOOM_MAX, ZOOM_MIN } from "./visor";

const campo = (id: string, x: number, y: number, ancho: number, alto: number, pagina = 1) =>
    ({ id, region: { x, y, ancho, alto, pagina } }) as unknown as CampoVista;

describe("zoom del visor", () => {
    it("se queda entre el mínimo y el máximo", () => {
        expect(limitarZoom(0.1)).toBe(ZOOM_MIN);
        expect(limitarZoom(99)).toBe(ZOOM_MAX);
        expect(limitarZoom(Number.NaN)).toBe(1);
    });

    it("la rueda hacia arriba acerca y hacia abajo aleja", () => {
        expect(zoomConRueda(1, -100)).toBeGreaterThan(1);
        expect(zoomConRueda(1, 100)).toBeLessThan(1);
    });

    it("mantiene bajo el cursor el mismo punto de la hoja", () => {
        // Cursor a 100 px del borde, sin desplazar: al duplicar el zoom ese punto pasa a 200 px.
        expect(desplazamientoAnclado(0, 100, 1, 2)).toBe(100);
        expect(desplazamientoAnclado(50, 100, 2, 1)).toBe(0);
    });
});

describe("clic sobre la hoja", () => {
    const campos = [
        campo("empresa", 0.1, 0.1, 0.4, 0.03),
        campo("procedimiento", 0.05, 0.4, 0.9, 0.2),
        campo("garantia", 0.5, 0.45, 0.03, 0.02),
        campo("firma_cliente", 0.1, 0.1, 0.3, 0.05, 2),
    ];

    it("devuelve el campo que contiene el punto", () => {
        expect(campoEnPunto(campos, 1, 0.2, 0.115)).toBe("empresa");
    });

    it("con zonas encimadas gana la más chica", () => {
        expect(campoEnPunto(campos, 1, 0.51, 0.46)).toBe("garantia");
        expect(campoEnPunto(campos, 1, 0.2, 0.5)).toBe("procedimiento");
    });

    it("solo mira la página visible", () => {
        expect(campoEnPunto(campos, 2, 0.2, 0.12)).toBe("firma_cliente");
    });

    it("fuera de toda zona no elige nada", () => {
        expect(campoEnPunto(campos, 1, 0.95, 0.95)).toBeNull();
    });
});
