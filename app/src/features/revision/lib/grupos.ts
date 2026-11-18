/**
 * Responsabilidad: agrupar los campos del reporte en lo que el técnico ve en el
 * papel (una tarjeta por dato) y armar las secciones plegables con sus
 * contadores y sus acciones en lote.
 * Existe porque en el papel los repuestos, las casillas, las líneas, el horario y
 * las firmas son un solo dato aunque el modelo los lea como campos separados. La
 * agrupación es solo de presentación: cada acción de un grupo se traduce a una
 * lista de pasos, uno por campo, y el backend sigue recibiendo una acción por
 * campo. Todo lo que decide qué se confirma, qué se corrige y qué se omite está
 * acá como función pura y probada: omitir nunca ocurre solo, siempre es una
 * decisión explícita de la persona.
 */

import { ORDEN_CAMPOS, SECCIONES_FORMULARIO } from "@/config/campos-formulario";
import { valorVigente } from "@/features/revision/lib/campos";
import {
    entraEnRevision,
    fueResueltoPorPersona,
    requiereRevision,
} from "@/features/revision/lib/dudosos";
import {
    normalizarMultilinea,
    sinAcentos,
} from "@/features/revision/lib/repuestos";
import type {
    IdCampo,
    IdSeccion,
    SeccionFormulario,
} from "@/features/revision/types/campos";
import type {
    AccionRevision,
    CampoReporte,
    CampoVista,
} from "@/features/revision/types/dominio";
import type { Tono } from "@/features/revision/lib/etiquetas";

export type IdGrupo = "repuestos" | "casillas" | "lineas" | "horario" | "labor" | "firmas";

export interface DefinicionGrupo {
    id: IdGrupo;
    titulo: string;
    seccion: IdSeccion;
    campos: readonly IdCampo[];
}

export const GRUPOS: readonly DefinicionGrupo[] = [
    {
        id: "repuestos",
        titulo: "Repuestos",
        seccion: "repuestos",
        campos: [
            "repuestos_tipo",
            "codigo_repuesto",
            "repuestos_descripcion",
            "repuestos_cantidad",
        ],
    },
    {
        id: "casillas",
        titulo: "Casillas de revisión",
        seccion: "revision",
        campos: [
            "estado_del_equipo",
            "limpieza_equipo",
            "cabezales",
            "sistema_proteccion",
        ],
    },
    {
        id: "lineas",
        titulo: "Revisión de líneas",
        seccion: "revision",
        campos: ["revision_linea_ln", "revision_linea_lt", "revision_linea_nt"],
    },
    {
        id: "horario",
        titulo: "Horario de atención",
        seccion: "cierre",
        campos: ["hora_llegada", "hora_salida"],
    },
    {
        // Casillas de "Información de la labor": se marcan o no, como las de revisión.
        id: "labor",
        titulo: "Información de la labor",
        seccion: "cierre",
        campos: ["garantia", "facturado"],
    },
    {
        id: "firmas",
        titulo: "Firmas",
        seccion: "cierre",
        campos: ["firma_operador", "firma_cliente"],
    },
];

const GRUPO_POR_CAMPO: ReadonlyMap<IdCampo, DefinicionGrupo> = new Map(
    GRUPOS.flatMap((grupo) =>
        grupo.campos.map((campo) => [campo, grupo] as const),
    ),
);

export function grupoDeCampo(campo: IdCampo): DefinicionGrupo | null {
    return GRUPO_POR_CAMPO.get(campo) ?? null;
}

/* ------------------------------------------------------------------ */
/* Estado de lectura                                                   */
/* ------------------------------------------------------------------ */

function textoVigente(campo: CampoReporte): string {
    return (valorVigente(campo) ?? "").trim();
}

export function tieneValor(campo: CampoReporte): boolean {
    return textoVigente(campo) !== "";
}

/** El modelo no leyó nada: `no_leido` o valor vacío. Es lo que se omite, no lo que se confirma. */
export function esSinLectura(campo: CampoReporte): boolean {
    return campo.no_leido || !tieneValor(campo);
}

/** Pendiente y sin nada que confirmar: candidato a "Omitir · está vacío". */
export function esOmitible(campo: CampoReporte): boolean {
    return requiereRevision(campo) && esSinLectura(campo);
}

export type EstadoElemento = "pendiente" | "sin_lectura" | "listo";

/**
 * "Sin leer" solo cuando lo único pendiente está en blanco; si queda algo con
 * valor por confirmar, la tarjeta es "pendiente" aunque también tenga vacíos.
 */
export function estadoDeCampos(
    campos: readonly CampoReporte[],
): EstadoElemento {
    const pendientes = campos.filter(requiereRevision);
    if (pendientes.length === 0) return "listo";
    return pendientes.every(esSinLectura) ? "sin_lectura" : "pendiente";
}

export interface RotuloGrupo {
    etiqueta: string;
    tono: Tono;
}

/** La etiqueta de estado de una tarjeta agrupada, con el mismo vocabulario que la de un campo. */
export function rotuloDeCampos(campos: readonly CampoReporte[]): RotuloGrupo {
    const estado = estadoDeCampos(campos);
    if (estado === "sin_lectura") return { etiqueta: "Sin leer", tono: "brick" };
    if (estado === "pendiente") return { etiqueta: "Pendiente", tono: "amber" };
    if (campos.every((campo) => campo.estado_revision === "ilegible")) {
        return { etiqueta: "Ilegible", tono: "brick" };
    }
    if (campos.every((campo) => campo.estado_revision === "omitido")) {
        return { etiqueta: "Omitido", tono: "neutral" };
    }
    if (campos.every((campo) => campo.estado_revision === "auto")) {
        return { etiqueta: "Lectura automática", tono: "petrol" };
    }
    return { etiqueta: "Revisado", tono: "green" };
}

/* ------------------------------------------------------------------ */
/* Elementos y secciones                                               */
/* ------------------------------------------------------------------ */

export type ElementoSeccion =
    | { tipo: "campo"; clave: string; campos: CampoVista[] }
    | {
          tipo: "grupo";
          clave: string;
          definicion: DefinicionGrupo;
          campos: CampoVista[];
      };

export interface SeccionVista {
    seccion: SeccionFormulario;
    /** Total de campos de la sección, sin importar el filtro. */
    totalCampos: number;
    /** Elementos que piden mirada: todo lo que no es lectura automática pura. */
    elementos: ElementoSeccion[];
    /** Elementos leídos con confianza alta que nadie tocó: van resumidos en una línea. */
    automaticos: ElementoSeccion[];
    /** Elementos con algo pendiente que tiene valor (o mezcla). */
    pendientes: number;
    /** Elementos cuyo único pendiente está en blanco. */
    sinLeer: number;
    listo: boolean;
    /** Pendientes de confianza media con valor: lo que "Confirmar sección" confirma. */
    confirmables: CampoVista[];
}

function elementoDe(
    campos: CampoVista[],
    grupo: DefinicionGrupo | null,
): ElementoSeccion {
    return grupo
        ? { tipo: "grupo", clave: `grupo-${grupo.id}`, definicion: grupo, campos }
        : { tipo: "campo", clave: `campo-${campos[0].id}`, campos };
}

function esAutomatico(elemento: ElementoSeccion): boolean {
    return elemento.campos.every((campo) => campo.estado_revision === "auto");
}

/** La posición del grupo en la sección es la de su primer campo en el inventario. */
function elementosDeSeccion(
    campos: readonly CampoVista[],
    seccion: IdSeccion,
): ElementoSeccion[] {
    const delaSeccion = campos
        .filter((campo) => campo.definicion.seccion === seccion)
        .sort((a, b) => ORDEN_CAMPOS[a.id] - ORDEN_CAMPOS[b.id]);

    const vistos = new Set<IdGrupo>();
    const elementos: ElementoSeccion[] = [];
    for (const campo of delaSeccion) {
        const grupo = grupoDeCampo(campo.id);
        if (!grupo) {
            elementos.push(elementoDe([campo], null));
            continue;
        }
        if (vistos.has(grupo.id)) continue;
        vistos.add(grupo.id);
        const miembros = delaSeccion.filter(
            (otro) => grupoDeCampo(otro.id)?.id === grupo.id,
        );
        elementos.push(elementoDe(miembros, grupo));
    }
    return elementos;
}

export function construirSecciones(
    campos: readonly CampoVista[],
    opciones: { soloDudosos?: boolean } = {},
): SeccionVista[] {
    const secciones: SeccionVista[] = [];

    for (const seccion of SECCIONES_FORMULARIO) {
        const todos = elementosDeSeccion(campos, seccion.id);
        if (todos.length === 0) continue;

        // En "solo dudosos" un elemento se queda si cualquiera de sus campos es
        // dudoso, y se muestra completo: un grupo a medias no se puede revisar.
        const visibles = opciones.soloDudosos
            ? todos.filter((elemento) => elemento.campos.some(entraEnRevision))
            : todos;
        if (visibles.length === 0) continue;

        const automaticos = visibles.filter(esAutomatico);
        const aRevisar = visibles
            .filter((elemento) => !esAutomatico(elemento))
            .map((elemento, indice) => ({ elemento, indice }))
            // Lo que falta revisar va primero; el resto conserva el orden del papel.
            .sort((a, b) => {
                const pa = estadoDeCampos(a.elemento.campos) === "listo" ? 1 : 0;
                const pb = estadoDeCampos(b.elemento.campos) === "listo" ? 1 : 0;
                return pa - pb || a.indice - b.indice;
            })
            .map(({ elemento }) => elemento);

        const estados = aRevisar.map((elemento) => estadoDeCampos(elemento.campos));
        const sinLeer = estados.filter((estado) => estado === "sin_lectura").length;
        const pendientes = estados.filter((estado) => estado === "pendiente").length;

        secciones.push({
            seccion,
            totalCampos: todos.reduce((n, elemento) => n + elemento.campos.length, 0),
            elementos: aRevisar,
            automaticos,
            pendientes,
            sinLeer,
            listo: pendientes === 0 && sinLeer === 0,
            confirmables: aRevisar
                .flatMap((elemento) => elemento.campos)
                .filter(esConfirmableEnBloque),
        });
    }

    return secciones;
}

/** Solo lo de confianza media con valor se confirma en bloque: lo bajo o vacío exige una decisión propia. */
export function esConfirmableEnBloque(campo: CampoReporte): boolean {
    return (
        requiereRevision(campo) &&
        tieneValor(campo) &&
        !campo.no_leido &&
        campo.confianza === "media"
    );
}

/** Todos los campos que muestra la sección, para la navegación por teclado. */
export function camposDeSeccion(seccion: SeccionVista): CampoVista[] {
    return [...seccion.elementos, ...seccion.automaticos].flatMap(
        (elemento) => elemento.campos,
    );
}

export function contieneCampo(
    elementos: readonly ElementoSeccion[],
    id: IdCampo | null | undefined,
): boolean {
    if (!id) return false;
    return elementos.some((elemento) =>
        elemento.campos.some((campo) => campo.id === id),
    );
}

export interface ChipResumen {
    etiqueta: string;
    valor: string;
}

/** Una línea corta por elemento para el resumen de confianza alta. */
export function describirResumen(elemento: ElementoSeccion): ChipResumen {
    if (elemento.tipo === "grupo") {
        const valores = elemento.campos
            .map(textoVigente)
            .filter((valor) => valor !== "")
            .map((valor) => valor.replace(/\s*\n\s*/g, ", "));
        return {
            etiqueta: elemento.definicion.titulo,
            valor: valores.length > 0 ? valores.join(" · ") : "vacío",
        };
    }
    const [campo] = elemento.campos;
    return {
        etiqueta: campo.definicion.etiqueta,
        valor: textoVigente(campo).replace(/\s*\n\s*/g, " ") || "vacío",
    };
}

/* ------------------------------------------------------------------ */
/* Planes de acción                                                    */
/* ------------------------------------------------------------------ */

/** La acción sin el actor: quien firma la revisión lo pone el hook. */
export type AccionSinActor = AccionRevision extends infer A
    ? A extends { tipo: string }
        ? Omit<A, "actor">
        : never
    : never;

export interface PasoLote {
    campo: IdCampo;
    accion: AccionSinActor;
}

/** Lo que la persona tocó en la tarjeta: solo los campos editados, el resto sigue como está. */
export type Borrador = Partial<Record<IdCampo, string>>;

/**
 * Qué hace "Confirmar" sobre un grupo, campo por campo:
 * - editado con texto distinto del vigente: corrige;
 * - editado con el mismo texto: confirma si estaba pendiente;
 * - editado y vaciado: omite (la persona dijo que está vacío);
 * - sin tocar y pendiente con valor: confirma;
 * - sin tocar y sin valor: no se hace nada. Omitir es una decisión aparte.
 */
export function planConfirmar(
    campos: readonly CampoReporte[],
    borrador: Borrador = {},
): PasoLote[] {
    const pasos: PasoLote[] = [];

    for (const campo of campos) {
        const actual = textoVigente(campo);
        const editado = borrador[campo.id];

        if (editado === undefined) {
            if (requiereRevision(campo) && actual !== "") {
                pasos.push({ campo: campo.id, accion: { tipo: "confirmar" } });
            }
            continue;
        }

        const nuevo = normalizarMultilinea(editado);
        if (nuevo === "") {
            if (campo.estado_revision !== "omitido") {
                pasos.push({ campo: campo.id, accion: { tipo: "omitir" } });
            }
        } else if (nuevo !== normalizarMultilinea(actual)) {
            pasos.push({
                campo: campo.id,
                accion: { tipo: "corregir", valor: nuevo },
            });
        } else if (requiereRevision(campo)) {
            pasos.push({ campo: campo.id, accion: { tipo: "confirmar" } });
        }
    }

    return pasos;
}

/** "Omitir · está vacío": solo los pendientes sin nada leído. */
export function planOmitirVacios(campos: readonly CampoReporte[]): PasoLote[] {
    return campos
        .filter(esOmitible)
        .map((campo) => ({ campo: campo.id, accion: { tipo: "omitir" } }));
}

/** "Deshacer" de una tarjeta: reabre todo lo que una persona ya resolvió. */
export function planReabrir(campos: readonly CampoReporte[]): PasoLote[] {
    return campos
        .filter(fueResueltoPorPersona)
        .map((campo) => ({ campo: campo.id, accion: { tipo: "reabrir" } }));
}

/** "Confirmar sección": confirma lo de confianza media con valor; nunca omite ni toca lo sin lectura. */
export function planConfirmarSeccion(seccion: SeccionVista): PasoLote[] {
    return seccion.confirmables.map((campo) => ({
        campo: campo.id,
        accion: { tipo: "confirmar" },
    }));
}

/** Rótulo del botón de omitir según cuántos vacíos hay en la tarjeta. */
export function rotuloOmitir(vacios: number, total: number): string {
    if (vacios === 1) return "Omitir · está vacío";
    if (vacios === total) return `Omitir las ${vacios}`;
    return `Omitir ${vacios} vacíos`;
}

/** Una casilla del papel coincide con el valor del modelo aunque cambien mayúsculas, acentos o el punto final ("Estab."). */
export function coincideOpcion(valor: string, opcion: string): boolean {
    const limpiar = (texto: string) => sinAcentos(texto.trim()).replace(/\.$/, "");
    return limpiar(valor) !== "" && limpiar(valor) === limpiar(opcion);
}
