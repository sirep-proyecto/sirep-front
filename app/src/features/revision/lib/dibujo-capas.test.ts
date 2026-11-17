/**
 * Responsabilidad: probar que el dibujo en canvas usa la geometría calculada.
 * Existe porque la descarga no se puede ver en pruebas de unidad: con un contexto
 * simulado se comprueba que cada recuadro, texto e insignia llegan a las
 * coordenadas del mapa multiplicadas por la escala.
 */

import { describe, expect, it } from "vitest";

import { MAPA_TALONARIO_GO_SERVICE as MAPA } from "@/config/regiones/talonario-go-service-carta";

import {
    calcularGeometrias,
    type CapaCorreccion,
} from "./capas-correccion";
import { dibujarCapas } from "./dibujo-capas";

function capa(extra: Partial<CapaCorreccion>): CapaCorreccion {
    return {
        id: "empresa",
        tipo: "corregido",
        numero: 1,
        etiqueta: "Empresa",
        texto: "Abregu S.A.C.",
        valor_modelo: "Abregu",
        region: MAPA.regiones.empresa,
        multilinea: false,
        corregido_por: null,
        corregido_en: null,
        ...extra,
    };
}

function contextoSimulado() {
    const llamadas: [string, unknown[]][] = [];
    const ctx = new Proxy(
        {},
        {
            get: (_, nombre: string) => (...args: unknown[]) => {
                llamadas.push([nombre, args]);
            },
            set: () => true,
        },
    );
    return { ctx: ctx as unknown as CanvasRenderingContext2D, llamadas };
}

describe("dibujarCapas", () => {
    it("pinta recuadro, texto e insignia de un corregido con la escala pedida", () => {
        const geometrias = calcularGeometrias([capa({})], MAPA);
        const { ctx, llamadas } = contextoSimulado();
        dibujarCapas(ctx, geometrias, 2);

        const g = geometrias[0];
        expect(llamadas[1]).toEqual(["scale", [2, 2]]);
        expect(llamadas.find(([n]) => n === "fillRect")?.[1]).toEqual([g.x, g.y, g.ancho, g.alto]);
        expect(llamadas.find(([n]) => n === "fillText")?.[1]).toEqual([
            "Abregu S.A.C.",
            g.texto_x,
            g.texto_y,
        ]);
        expect(llamadas.some(([n]) => n === "arc")).toBe(true);
        expect(llamadas.filter(([n]) => n === "fillText").map(([, a]) => (a as unknown[])[0])).toContain("1");
    });

    it("dibuja trama y sin insignia en los omitidos", () => {
        const geometrias = calcularGeometrias(
            [capa({ tipo: "omitido", numero: null, texto: "vacío" })],
            MAPA,
        );
        const { ctx, llamadas } = contextoSimulado();
        dibujarCapas(ctx, geometrias, 1);

        expect(llamadas.some(([n]) => n === "clip")).toBe(true);
        expect(llamadas.some(([n]) => n === "arc")).toBe(false);
        expect(llamadas.find(([n]) => n === "fillText")?.[1][0]).toBe("vacío");
    });
});
