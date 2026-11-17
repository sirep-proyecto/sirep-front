/**
 * Responsabilidad: probar la selección, numeración y geometría de las capas de
 * corrección.
 * Existe porque un error aquí tapa el campo equivocado del escaneo o numera las
 * correcciones en otro orden que el de la lista, y el técnico lo confiaría.
 */

import { describe, expect, it } from "vitest";

import { CAMPOS_POR_ID } from "@/config/campos-formulario";
import { MAPA_TALONARIO_GO_SERVICE as MAPA } from "@/config/regiones/talonario-go-service-carta";
import type { IdCampo } from "@/features/revision/types/campos";
import type { CampoVista, EstadoRevisionCampo } from "@/features/revision/types/dominio";

import {
    ajustarTexto,
    calcularGeometriaCapa,
    capasDePagina,
    construirCapas,
    envolverTexto,
    estiloRegionPorcentaje,
    etiquetaAccesibleCapa,
    nombreArchivoCorregido,
} from "./capas-correccion";

function campo(
    id: IdCampo,
    estado: EstadoRevisionCampo,
    extra: Partial<CampoVista> = {},
): CampoVista {
    return {
        id,
        valor_modelo: "leído",
        confianza: "media",
        no_leido: false,
        valor_corregido: estado === "corregido" ? "corregido" : null,
        estado_revision: estado,
        revisado_por: null,
        revisado_en: null,
        corregido_por: null,
        corregido_en: null,
        definicion: CAMPOS_POR_ID[id],
        region: MAPA.regiones[id],
        ...extra,
    };
}

const OPCIONES = { multilinea: false, minimo: 14, maximo: 20 };

describe("construirCapas", () => {
    it("numera los corregidos en orden de formulario, no de llegada", () => {
        const capas = construirCapas([
            campo("hora_llegada", "corregido"),
            campo("fecha", "corregido"),
            campo("empresa", "corregido"),
        ]);

        expect(capas.map((c) => [c.id, c.numero])).toEqual([
            ["empresa", 1],
            ["fecha", 2],
            ["hora_llegada", 3],
        ]);
    });

    it("ignora los estados que no se dibujan y deja omitidos sin número", () => {
        const capas = construirCapas([
            campo("tecnico", "confirmado"),
            campo("empresa", "corregido"),
            campo("telefono", "omitido"),
            campo("fecha", "pendiente"),
            campo("direccion", "corregido"),
        ]);

        expect(capas.map((c) => [c.id, c.tipo, c.numero])).toEqual([
            ["empresa", "corregido", 1],
            ["telefono", "omitido", null],
            ["direccion", "corregido", 2],
        ]);
        expect(capas[1].texto).toBe("vacío");
    });

    it("usa la región propia del campo cuando existe y la del mapa si no", () => {
        const propia = { x: 0.1, y: 0.2, ancho: 0.3, alto: 0.04, pagina: 1 };
        const capas = construirCapas([
            campo("empresa", "corregido", { region: propia }),
            campo("fecha", "corregido"),
        ]);

        expect(capas[0].region).toEqual(propia);
        expect(capas[1].region).toEqual(MAPA.regiones.fecha);
    });

    it("marca multilínea los campos de procedimiento", () => {
        const [capa] = construirCapas([campo("procedimiento", "corregido")]);
        expect(capa.multilinea).toBe(true);
    });
});

describe("capasDePagina", () => {
    it("filtra por la página de la región", () => {
        const capas = construirCapas([
            campo("empresa", "corregido"),
            campo("fecha", "corregido", {
                region: { ...MAPA.regiones.fecha, pagina: 2 },
            }),
        ]);
        expect(capasDePagina(capas, 2).map((c) => c.id)).toEqual(["fecha"]);
    });
});

describe("estiloRegionPorcentaje y etiquetas", () => {
    it("expresa la región normalizada en porcentajes", () => {
        expect(
            estiloRegionPorcentaje({ x: 0.152, y: 0.2085, ancho: 0.43, alto: 0.0215, pagina: 1 }),
        ).toEqual({ left: "15.2%", top: "20.85%", width: "43%", height: "2.15%" });
    });

    it("compone el aria-label pedido", () => {
        const [capa] = construirCapas([campo("empresa", "corregido", { valor_corregido: "Abregu S.A.C." })]);
        expect(etiquetaAccesibleCapa(capa)).toBe("Campo Empresa corregido: Abregu S.A.C.");
    });

    it("nombra el archivo y sanea el número", () => {
        expect(nombreArchivoCorregido("000375", 1)).toBe("Reporte_000375_corregido.png");
        expect(nombreArchivoCorregido("A/12 3", 2)).toBe("Reporte_A_12_3_corregido_pag2.png");
    });
});

describe("ajustarTexto", () => {
    it("deja el tamaño máximo cuando el texto sobra de espacio", () => {
        const r = ajustarTexto("09-02-24", 400, 40, OPCIONES);
        expect(r.tamano).toBe(20);
        expect(r.recortado).toBe(false);
        expect(r.lineas).toEqual(["09-02-24"]);
    });

    it("reduce la fuente para que entre en una línea", () => {
        const texto = "x".repeat(30);
        const r = ajustarTexto(texto, 300, 40, OPCIONES);
        expect(r.tamano).toBeLessThan(20);
        expect(r.tamano).toBeGreaterThanOrEqual(14);
        expect(r.lineas[0].length * r.tamano * 0.6).toBeLessThanOrEqual(300 + 0.001);
        expect(r.recortado).toBe(false);
    });

    it("recorta con elipsis al llegar al mínimo", () => {
        const r = ajustarTexto("y".repeat(100), 200, 40, OPCIONES);
        expect(r.tamano).toBe(14);
        expect(r.recortado).toBe(true);
        expect(r.lineas[0].endsWith("…")).toBe(true);
        expect(r.lineas[0].length * 14 * 0.6).toBeLessThanOrEqual(200);
    });

    it("envuelve por palabras en campos multilínea", () => {
        const texto = "Se cambió cabezal de barniz pero el cabezal presenta fallas en dos líneas";
        const r = ajustarTexto(texto, 300, 200, { ...OPCIONES, multilinea: true });
        expect(r.lineas.length).toBeGreaterThan(1);
        expect(r.lineas.join(" ")).toBe(texto);
        expect(r.lineas.length * r.interlineado).toBeLessThanOrEqual(200);
        expect(r.recortado).toBe(false);
    });

    it("corta con elipsis la última línea si el multilínea no cabe", () => {
        const texto = "palabra ".repeat(200);
        const r = ajustarTexto(texto, 200, 60, { ...OPCIONES, multilinea: true });
        expect(r.recortado).toBe(true);
        expect(r.tamano).toBe(14);
        expect(r.lineas.length * r.interlineado).toBeLessThanOrEqual(60);
        expect(r.lineas.at(-1)?.endsWith("…")).toBe(true);
    });

    it("respeta saltos de línea y parte palabras más largas que la línea", () => {
        expect(envolverTexto("uno\ndos", 20)).toEqual(["uno", "dos"]);
        expect(envolverTexto("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
    });

    it("no revienta con texto vacío", () => {
        const r = ajustarTexto("", 100, 30, OPCIONES);
        expect(r.lineas).toEqual([""]);
    });
});

describe("calcularGeometriaCapa", () => {
    it("coincide exactamente con la región en píxeles del mapa", () => {
        const [capa] = construirCapas([campo("empresa", "corregido")]);
        const g = calcularGeometriaCapa(capa, MAPA);
        const r = MAPA.regiones.empresa;

        expect(g.x).toBeCloseTo(r.x * MAPA.ancho_pagina);
        expect(g.y).toBeCloseTo(r.y * MAPA.alto_pagina);
        expect(g.ancho).toBeCloseTo(r.ancho * MAPA.ancho_pagina);
        expect(g.alto).toBeCloseTo(r.alto * MAPA.alto_pagina);
    });

    it("es proporcional al tamaño del mapa (escala con cualquier resolución)", () => {
        const [capa] = construirCapas([campo("empresa", "corregido")]);
        const chica = calcularGeometriaCapa(capa, { ancho_pagina: 1000, alto_pagina: 1000 });
        const grande = calcularGeometriaCapa(capa, { ancho_pagina: 2000, alto_pagina: 2000 });

        expect(grande.x).toBeCloseTo(chica.x * 2);
        expect(grande.ancho).toBeCloseTo(chica.ancho * 2);
        expect(grande.tamano).toBeCloseTo(chica.tamano * 2);
        expect(grande.insignia?.r).toBeCloseTo((chica.insignia?.r ?? 0) * 2);
    });

    it("el texto queda dentro del recuadro", () => {
        const [capa] = construirCapas([
            campo("empresa", "corregido", { valor_corregido: "Abregu S.A.C." }),
        ]);
        const g = calcularGeometriaCapa(capa, MAPA);
        expect(g.texto_x).toBeGreaterThanOrEqual(g.x);
        expect(g.texto_y).toBeGreaterThan(g.y);
        expect(g.texto_y).toBeLessThanOrEqual(g.y + g.alto);
    });

    it("los omitidos no llevan insignia y los corregidos sí", () => {
        const capas = construirCapas([
            campo("empresa", "corregido"),
            campo("telefono", "omitido"),
        ]);
        expect(calcularGeometriaCapa(capas[0], MAPA).insignia).not.toBeNull();
        expect(calcularGeometriaCapa(capas[1], MAPA).insignia).toBeNull();
    });

    it("el procedimiento envuelve varias líneas dentro de su recuadro", () => {
        const [capa] = construirCapas([
            campo("procedimiento", "corregido", {
                valor_corregido:
                    "Se cambió el cabezal de barniz pero el cabezal presenta fallas en dos líneas que vuelven a destruirse. ".repeat(3),
            }),
        ]);
        const g = calcularGeometriaCapa(capa, MAPA);
        expect(g.lineas.length).toBeGreaterThan(1);
        const ultimaBase = g.texto_y + (g.lineas.length - 1) * g.interlineado;
        expect(ultimaBase).toBeLessThanOrEqual(g.y + g.alto);
    });
});
