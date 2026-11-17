/**
 * Responsabilidad: convertir los cuatro campos de repuestos (tipo, código,
 * descripción y cantidad) en filas de una tabla y volver a escribirlos.
 * Existe porque en el papel los repuestos son una sola tabla, pero el modelo los
 * devuelve como columnas separadas: cada columna es un texto con una línea por
 * fila, y la fila N de cada columna forma el repuesto N. Esa correspondencia es
 * lógica de datos y no de pantalla, por eso vive aparte y con pruebas.
 */

import type { IdCampo } from "@/features/revision/types/campos";

export const OPCIONES_TIPO_REPUESTO = ["Venta", "Descarte", "Garantía"] as const;

export interface FilaRepuesto {
    codigo: string;
    descripcion: string;
    cantidad: string;
}

export type ColumnaRepuesto = keyof FilaRepuesto;

export const COLUMNAS_REPUESTO: readonly ColumnaRepuesto[] = [
    "codigo",
    "descripcion",
    "cantidad",
];

/** Campo del inventario que guarda cada columna de la tabla. */
export const CAMPO_DE_COLUMNA: Record<ColumnaRepuesto, IdCampo> = {
    codigo: "codigo_repuesto",
    descripcion: "repuestos_descripcion",
    cantidad: "repuestos_cantidad",
};

export function dividirLineas(valor: string | null | undefined): string[] {
    return (valor ?? "").split(/\r?\n/).map((linea) => linea.trim());
}

function sinLineasFinalesVacias(lineas: string[]): string[] {
    const copia = [...lineas];
    while (copia.length > 0 && copia[copia.length - 1] === "") copia.pop();
    return copia;
}

/**
 * Forma canónica de un texto de varias líneas: líneas recortadas y sin líneas
 * vacías al final. Sirve para decidir si una edición cambió algo de verdad.
 */
export function normalizarMultilinea(valor: string | null | undefined): string {
    return sinLineasFinalesVacias(dividirLineas(valor)).join("\n");
}

export function filaEstaVacia(fila: FilaRepuesto): boolean {
    return COLUMNAS_REPUESTO.every((columna) => fila[columna].trim() === "");
}

/** La fila N de cada columna forma el repuesto N; las columnas más cortas se rellenan con vacío. */
export function filasDesdeColumnas(
    columnas: Record<ColumnaRepuesto, string | null | undefined>,
): FilaRepuesto[] {
    const lineas = {
        codigo: dividirLineas(columnas.codigo),
        descripcion: dividirLineas(columnas.descripcion),
        cantidad: dividirLineas(columnas.cantidad),
    };
    const total = Math.max(
        lineas.codigo.length,
        lineas.descripcion.length,
        lineas.cantidad.length,
    );

    const filas: FilaRepuesto[] = [];
    for (let i = 0; i < total; i += 1) {
        filas.push({
            codigo: lineas.codigo[i] ?? "",
            descripcion: lineas.descripcion[i] ?? "",
            cantidad: lineas.cantidad[i] ?? "",
        });
    }
    return sinFilasFinalesVacias(filas);
}

function sinFilasFinalesVacias(filas: FilaRepuesto[]): FilaRepuesto[] {
    const copia = [...filas];
    while (copia.length > 0 && filaEstaVacia(copia[copia.length - 1])) copia.pop();
    return copia;
}

/**
 * Las filas completamente vacías se descartan (en el medio también): quitan la
 * misma posición de las tres columnas y la correspondencia fila a fila se
 * mantiene. Una celda vacía dentro de una fila con datos conserva su línea.
 */
export function columnasDesdeFilas(
    filas: readonly FilaRepuesto[],
): Record<ColumnaRepuesto, string> {
    const utiles = filas.filter((fila) => !filaEstaVacia(fila));
    const columna = (clave: ColumnaRepuesto): string =>
        sinLineasFinalesVacias(utiles.map((fila) => fila[clave].trim())).join("\n");

    return {
        codigo: columna("codigo"),
        descripcion: columna("descripcion"),
        cantidad: columna("cantidad"),
    };
}

/** Para comparar textos sin que importen acentos ni mayúsculas. */
export function sinAcentos(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}

/** Casillas marcadas según el texto del modelo ("Venta, Garantía"), en el orden del papel. */
export function tiposDesdeValor(valor: string | null | undefined): string[] {
    const texto = sinAcentos(valor ?? "");
    return OPCIONES_TIPO_REPUESTO.filter((opcion) =>
        texto.includes(sinAcentos(opcion)),
    );
}

export function valorDesdeTipos(tipos: readonly string[]): string {
    return OPCIONES_TIPO_REPUESTO.filter((opcion) => tipos.includes(opcion)).join(
        ", ",
    );
}
