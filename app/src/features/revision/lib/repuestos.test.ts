/**
 * Responsabilidad: probar cómo se arma y se vuelve a escribir la tabla de
 * repuestos.
 * Existe porque la fila N de cada columna forma el repuesto N: si una columna se
 * desalineara al guardar, la cantidad de un repuesto quedaría pegada a otro.
 */

import { describe, expect, it } from "vitest";

import {
    columnasDesdeFilas,
    filasDesdeColumnas,
    normalizarMultilinea,
    tiposDesdeValor,
    valorDesdeTipos,
} from "./repuestos";

describe("filasDesdeColumnas", () => {
    it("une la fila N de cada columna", () => {
        const filas = filasDesdeColumnas({
            codigo: "A-1\nB-2",
            descripcion: "Damper JVS\nCabezal",
            cantidad: "8\n2",
        });
        expect(filas).toEqual([
            { codigo: "A-1", descripcion: "Damper JVS", cantidad: "8" },
            { codigo: "B-2", descripcion: "Cabezal", cantidad: "2" },
        ]);
    });

    it("rellena con vacío las columnas más cortas y conserva la posición", () => {
        const filas = filasDesdeColumnas({
            codigo: "",
            descripcion: "Damper\nCabezal",
            cantidad: "\n2",
        });
        expect(filas).toEqual([
            { codigo: "", descripcion: "Damper", cantidad: "" },
            { codigo: "", descripcion: "Cabezal", cantidad: "2" },
        ]);
    });

    it("no inventa filas cuando todo está vacío", () => {
        expect(
            filasDesdeColumnas({ codigo: null, descripcion: "", cantidad: " \n " }),
        ).toEqual([]);
    });

    it("acepta saltos de línea de Windows", () => {
        expect(
            filasDesdeColumnas({
                codigo: "A\r\nB",
                descripcion: "x\r\ny",
                cantidad: "1\r\n2",
            }),
        ).toHaveLength(2);
    });
});

describe("columnasDesdeFilas", () => {
    it("escribe una línea por fila en cada columna", () => {
        expect(
            columnasDesdeFilas([
                { codigo: "A-1", descripcion: "Damper", cantidad: "8" },
                { codigo: "B-2", descripcion: "Cabezal", cantidad: "2" },
            ]),
        ).toEqual({
            codigo: "A-1\nB-2",
            descripcion: "Damper\nCabezal",
            cantidad: "8\n2",
        });
    });

    it("descarta las filas totalmente vacías y mantiene la alineación", () => {
        const columnas = columnasDesdeFilas([
            { codigo: "A", descripcion: "x", cantidad: "1" },
            { codigo: "", descripcion: "", cantidad: "" },
            { codigo: "C", descripcion: "z", cantidad: "3" },
        ]);
        expect(columnas).toEqual({
            codigo: "A\nC",
            descripcion: "x\nz",
            cantidad: "1\n3",
        });
    });

    it("una celda vacía dentro de una fila con datos conserva su línea", () => {
        const columnas = columnasDesdeFilas([
            { codigo: "", descripcion: "Damper", cantidad: "8" },
            { codigo: "B", descripcion: "Cabezal", cantidad: "2" },
        ]);
        expect(columnas.codigo).toBe("\nB");
        expect(filasDesdeColumnas(columnas)[0].codigo).toBe("");
    });

    it("deja una columna vacía cuando no hay ningún dato en ella", () => {
        expect(
            columnasDesdeFilas([{ codigo: "", descripcion: "Damper", cantidad: "" }])
                .codigo,
        ).toBe("");
    });

    it("ida y vuelta no cambia lo leído", () => {
        const original = {
            codigo: "A-1\nB-2",
            descripcion: "Damper\nCabezal",
            cantidad: "8\n2",
        };
        expect(columnasDesdeFilas(filasDesdeColumnas(original))).toEqual(original);
    });
});

describe("normalizarMultilinea", () => {
    it("recorta líneas y descarta las vacías del final", () => {
        expect(normalizarMultilinea(" A \n B \n\n ")).toBe("A\nB");
        expect(normalizarMultilinea(null)).toBe("");
    });
});

describe("tipos de repuestos", () => {
    it("reconoce las casillas aunque cambien acentos o mayúsculas", () => {
        expect(tiposDesdeValor("garantia")).toEqual(["Garantía"]);
        expect(tiposDesdeValor("Venta, Garantía")).toEqual(["Venta", "Garantía"]);
        expect(tiposDesdeValor(null)).toEqual([]);
    });

    it("escribe las casillas en el orden del papel", () => {
        expect(valorDesdeTipos(["Garantía", "Venta"])).toBe("Venta, Garantía");
        expect(valorDesdeTipos([])).toBe("");
    });
});
