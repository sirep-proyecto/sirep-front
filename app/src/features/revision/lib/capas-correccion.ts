/**
 * Responsabilidad: decidir qué correcciones se dibujan sobre el escaneo y con
 * qué geometría exacta (recuadro, texto ajustado, número de la insignia).
 * Existe como módulo puro porque lo consumen dos dibujantes distintos (el SVG
 * del visor y el canvas de la descarga) y los dos tienen que producir la misma
 * hoja: si cada uno calculara por su cuenta, el PNG descargado no coincidiría
 * con lo que el técnico vio. También fija el orden de numeración (el del
 * formulario, no el de corrección) para que "1, 2, 3…" se lea de arriba abajo.
 *
 * Todas las medidas salen en píxeles del mapa (`ancho_pagina` × `alto_pagina`),
 * el mismo espacio del `viewBox` del visor; escalan solas con cualquier zoom.
 */

import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";
import type { IdCampo } from "@/features/revision/types/campos";
import type { CampoVista } from "@/features/revision/types/dominio";
import type {
    MapaRegiones,
    NumeroPagina,
    Region,
} from "@/features/revision/types/regiones";

export type TipoCapa = "corregido" | "omitido";

export interface CapaCorreccion {
    id: IdCampo;
    tipo: TipoCapa;
    /** Posición de la corrección en el formulario (1, 2, 3…); `null` en omitidos. */
    numero: number | null;
    etiqueta: string;
    /** Valor que tapa lo escrito a mano; en omitidos es el texto fijo "vacío". */
    texto: string;
    /** Valor que había leído el modelo, para la lista de correcciones. */
    valor_modelo: string | null;
    region: Region;
    multilinea: boolean;
    corregido_por: string | null;
    corregido_en: string | null;
}

export interface GeometriaCapa {
    capa: CapaCorreccion;
    x: number;
    y: number;
    ancho: number;
    alto: number;
    /** Tamaño de letra en píxeles del mapa. */
    tamano: number;
    interlineado: number;
    /** Líneas ya cortadas (con elipsis si hizo falta); una sola en campos simples. */
    lineas: string[];
    recortado: boolean;
    /** Origen del texto dentro del recuadro. */
    texto_x: number;
    texto_y: number;
    insignia: { cx: number; cy: number; r: number } | null;
}

export const TEXTO_OMITIDO = "vacío";

/** Ancho de un carácter monoespaciado como fracción del tamaño de letra. */
export const ANCHO_CARACTER = 0.6;
const INTERLINEADO = 1.25;
const ELIPSIS = "…";

/** Tamaños de letra relativos al ancho de la hoja (1275 px → 14 px mínimo, 20 px máximo). */
const MINIMO_REL = 0.011;
const MAXIMO_REL = 0.0157;
const PADDING_REL = 0.0031;
const INSIGNIA_REL = 0.0125;

export const PALETA_CAPAS = {
    corregido: { relleno: "#fff4dc", borde: "#e8761a", texto: "#2a1a08" },
    omitido: { relleno: "#dcd9d4", borde: "#a8a39b", texto: "#4a463f", trama: "#b9b4ab" },
    insignia: { relleno: "#c2410c", texto: "#ffffff" },
    resaltado: "#dcae6e",
} as const;

export const FUENTE_MONO =
    '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

/** Índice de cada campo en el formulario, para ordenar de arriba abajo. */
const POSICION_EN_FORMULARIO: ReadonlyMap<IdCampo, number> = new Map(
    CAMPOS_FORMULARIO.map((definicion, indice) => [definicion.id, indice]),
);

/**
 * Construye las capas de todo el reporte (todas las páginas): `corregido`
 * dibuja el valor de la persona y `omitido` marca lo que estaba en blanco. La
 * numeración recorre solo los corregidos en orden de formulario, así la
 * insignia 2 de la hoja es la fila 2 de la lista aunque se corrijan en otro orden.
 */
export function construirCapas(campos: readonly CampoVista[]): CapaCorreccion[] {
    const ordenados = [...campos].sort(
        (a, b) =>
            (POSICION_EN_FORMULARIO.get(a.id) ?? 0) -
            (POSICION_EN_FORMULARIO.get(b.id) ?? 0),
    );

    const capas: CapaCorreccion[] = [];
    let numero = 0;

    for (const campo of ordenados) {
        if (campo.estado_revision !== "corregido" && campo.estado_revision !== "omitido") {
            continue;
        }
        const corregido = campo.estado_revision === "corregido";
        if (corregido) numero += 1;

        capas.push({
            id: campo.id,
            tipo: corregido ? "corregido" : "omitido",
            numero: corregido ? numero : null,
            etiqueta: campo.definicion.etiqueta,
            texto: corregido ? (campo.valor_corregido ?? "") : TEXTO_OMITIDO,
            valor_modelo: campo.valor_modelo,
            region: campo.region,
            multilinea: campo.definicion.tipo === "multilinea",
            corregido_por: campo.corregido_por,
            corregido_en: campo.corregido_en,
        });
    }
    return capas;
}

export function capasDePagina(
    capas: readonly CapaCorreccion[],
    pagina: NumeroPagina,
): CapaCorreccion[] {
    return capas.filter((capa) => capa.region.pagina === pagina);
}

/** Texto accesible del recuadro: "Campo Empresa corregido: Abregu S.A.C." */
export function etiquetaAccesibleCapa(capa: CapaCorreccion): string {
    return capa.tipo === "corregido"
        ? `Campo ${capa.etiqueta} corregido: ${capa.texto}`
        : `Campo ${capa.etiqueta} omitido: vacío en el papel`;
}

/** Posición y tamaño de una región como porcentajes de la hoja (para CSS). */
export function estiloRegionPorcentaje(region: Region): {
    left: string;
    top: string;
    width: string;
    height: string;
} {
    const pct = (valor: number) => `${+(valor * 100).toFixed(4)}%`;
    return {
        left: pct(region.x),
        top: pct(region.y),
        width: pct(region.ancho),
        height: pct(region.alto),
    };
}

export interface TextoAjustado {
    tamano: number;
    interlineado: number;
    lineas: string[];
    recortado: boolean;
}

export interface OpcionesAjuste {
    multilinea: boolean;
    minimo: number;
    maximo: number;
}

function cortarConElipsis(linea: string, maxCaracteres: number): string {
    if (linea.length <= maxCaracteres) return linea;
    if (maxCaracteres <= 1) return ELIPSIS;
    return `${linea.slice(0, maxCaracteres - 1).trimEnd()}${ELIPSIS}`;
}

/** Parte un texto en líneas de a lo sumo `maxCaracteres`, respetando saltos y palabras. */
export function envolverTexto(texto: string, maxCaracteres: number): string[] {
    const limite = Math.max(1, Math.floor(maxCaracteres));
    const lineas: string[] = [];

    for (const parrafo of texto.split(/\r?\n/)) {
        let actual = "";
        for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
            let resto = palabra;
            // Una palabra más larga que la línea se parte a la fuerza.
            while (resto.length > limite) {
                if (actual) {
                    lineas.push(actual);
                    actual = "";
                }
                lineas.push(resto.slice(0, limite));
                resto = resto.slice(limite);
            }
            if (!actual) actual = resto;
            else if (actual.length + 1 + resto.length <= limite) actual += ` ${resto}`;
            else {
                lineas.push(actual);
                actual = resto;
            }
        }
        lineas.push(actual);
    }
    return lineas;
}

/**
 * Ajusta un texto monoespaciado a una caja: baja el tamaño hasta `minimo` y,
 * si aun así no entra, corta con elipsis. En campos simples es una línea; en
 * los de varias líneas envuelve por palabras dentro del alto disponible.
 */
export function ajustarTexto(
    texto: string,
    ancho: number,
    alto: number,
    { multilinea, minimo, maximo }: OpcionesAjuste,
): TextoAjustado {
    const tope = Math.max(minimo, maximo);

    if (!multilinea) {
        const unaLinea = texto.replace(/\s*\r?\n\s*/g, " ").trim();
        const caben = (tamano: number) =>
            Math.floor(ancho / (tamano * ANCHO_CARACTER));
        const porAlto = alto / INTERLINEADO;
        const techo = Math.min(tope, Math.max(minimo, porAlto));
        const ideal = unaLinea.length
            ? ancho / (unaLinea.length * ANCHO_CARACTER)
            : techo;
        const tamano = Math.max(minimo, Math.min(techo, ideal));
        const maxCaracteres = caben(tamano);
        const linea = cortarConElipsis(unaLinea, maxCaracteres);
        return {
            tamano,
            interlineado: tamano * INTERLINEADO,
            lineas: [linea],
            recortado: linea !== unaLinea,
        };
    }

    for (let tamano = tope; tamano >= minimo; tamano -= 0.5) {
        const maxCaracteres = Math.floor(ancho / (tamano * ANCHO_CARACTER));
        const lineas = envolverTexto(texto, maxCaracteres);
        if (lineas.length * tamano * INTERLINEADO <= alto) {
            return { tamano, interlineado: tamano * INTERLINEADO, lineas, recortado: false };
        }
    }

    // No entra ni al mínimo: se queda lo que cabe y la última línea lleva elipsis.
    const maxCaracteres = Math.floor(ancho / (minimo * ANCHO_CARACTER));
    const todas = envolverTexto(texto, maxCaracteres);
    const maxLineas = Math.max(1, Math.floor(alto / (minimo * INTERLINEADO)));
    const lineas = todas.slice(0, maxLineas);
    const ultima = lineas[lineas.length - 1];
    lineas[lineas.length - 1] =
        ultima.length >= maxCaracteres
            ? cortarConElipsis(`${ultima}${ELIPSIS}`, maxCaracteres)
            : `${ultima}${ELIPSIS}`;
    return { tamano: minimo, interlineado: minimo * INTERLINEADO, lineas, recortado: true };
}

/** Geometría completa de una capa, en píxeles del mapa. */
export function calcularGeometriaCapa(
    capa: CapaCorreccion,
    mapa: Pick<MapaRegiones, "ancho_pagina" | "alto_pagina">,
): GeometriaCapa {
    const x = capa.region.x * mapa.ancho_pagina;
    const y = capa.region.y * mapa.alto_pagina;
    const ancho = capa.region.ancho * mapa.ancho_pagina;
    const alto = capa.region.alto * mapa.alto_pagina;
    const padding = PADDING_REL * mapa.ancho_pagina;

    const ajuste = ajustarTexto(
        capa.texto,
        Math.max(1, ancho - padding * 2),
        Math.max(1, alto - padding * 2),
        {
            multilinea: capa.multilinea && capa.tipo === "corregido",
            minimo: MINIMO_REL * mapa.ancho_pagina,
            maximo: MAXIMO_REL * mapa.ancho_pagina,
        },
    );

    const altoTexto = ajuste.lineas.length * ajuste.interlineado;
    const multi = ajuste.lineas.length > 1 || capa.multilinea;
    // Una línea se centra en vertical; varias arrancan arriba, como el papel.
    const arriba = multi
        ? padding
        : Math.max(padding, (alto - altoTexto) / 2);

    const r = INSIGNIA_REL * mapa.ancho_pagina;

    return {
        capa,
        x,
        y,
        ancho,
        alto,
        ...ajuste,
        texto_x: x + padding,
        // `y` de la línea base de la primera línea.
        texto_y: y + arriba + (ajuste.interlineado - ajuste.tamano) / 2 + ajuste.tamano * 0.8,
        insignia:
            capa.numero === null
                ? null
                : { cx: x + r * 0.2, cy: y - r * 0.35, r },
    };
}

export function calcularGeometrias(
    capas: readonly CapaCorreccion[],
    mapa: Pick<MapaRegiones, "ancho_pagina" | "alto_pagina">,
): GeometriaCapa[] {
    return capas.map((capa) => calcularGeometriaCapa(capa, mapa));
}

/** Nombre del PNG descargado: `Reporte_<numero>_corregido.png` (con sufijo en páginas > 1). */
export function nombreArchivoCorregido(
    numeroReporte: string,
    pagina: NumeroPagina,
): string {
    const numero = numeroReporte.trim().replace(/[^\w.-]+/g, "_") || "reporte";
    return pagina > 1
        ? `Reporte_${numero}_corregido_pag${pagina}.png`
        : `Reporte_${numero}_corregido.png`;
}
