/**
 * Responsabilidad: generar y descargar el PNG de una página del escaneo con las
 * correcciones dibujadas encima.
 * Existe porque el técnico necesita adjuntar "lo que dice el papel, ya
 * corregido" fuera de SIREP. Corre solo en el navegador.
 *
 * CORS: el escaneo llega como enlace firmado de Storage. Dibujarlo directo en un
 * canvas lo dejaría "tainted" (`toBlob` fallaría), así que se baja con `fetch`
 * a un Blob y se dibuja desde un `ImageBitmap` local: el canvas nunca ve una
 * imagen de otro origen. Si el servidor no permite el `fetch` entre orígenes se
 * informa en lugar de entregar un archivo sin correcciones.
 *
 * PDF: el modelo guarda cada página como imagen (`paginas_urls`), de modo que lo
 * que se dibuja es siempre la página ya rasterizada; no hay lectura de PDF aquí.
 */

import {
    calcularGeometrias,
    nombreArchivoCorregido,
    type CapaCorreccion,
} from "@/features/revision/lib/capas-correccion";
import { descargarBlob } from "@/features/revision/lib/descargas";
import { dibujarCapas } from "@/features/revision/lib/dibujo-capas";
import type { MapaRegiones, NumeroPagina } from "@/features/revision/types/regiones";

/** Lado máximo del PNG: por encima, algunos navegadores devuelven un canvas vacío. */
const LADO_MAXIMO = 8000;

async function cargarImagen(url: string): Promise<ImageBitmap> {
    let respuesta: Response;
    try {
        respuesta = await fetch(url, { mode: "cors" });
    } catch {
        throw new Error(
            "No se pudo leer la imagen del escaneo (el enlace expiró o el servidor no permite descargarla desde aquí). Recarga la página e inténtalo de nuevo.",
        );
    }
    if (!respuesta.ok) {
        throw new Error(
            `No se pudo leer la imagen del escaneo (respuesta ${respuesta.status}). Recarga la página para obtener un enlace nuevo.`,
        );
    }
    return createImageBitmap(await respuesta.blob());
}

export async function generarPngCorregido(
    urlImagen: string,
    capas: readonly CapaCorreccion[],
    mapa: Pick<MapaRegiones, "ancho_pagina" | "alto_pagina">,
): Promise<Blob> {
    const imagen = await cargarImagen(urlImagen);

    // La hoja se estira al tamaño del mapa, igual que en el visor, y se conserva
    // la resolución horizontal del escaneo.
    const escala = Math.min(
        imagen.width / mapa.ancho_pagina,
        LADO_MAXIMO / mapa.ancho_pagina,
        LADO_MAXIMO / mapa.alto_pagina,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(mapa.ancho_pagina * escala);
    canvas.height = Math.round(mapa.alto_pagina * escala);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador no permite dibujar el escaneo corregido.");

    ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    imagen.close();
    // El canvas no resuelve `var(--font-mono)`: se lee ya calculada del documento.
    const fuente = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-mono")
        .trim();
    dibujarCapas(ctx, calcularGeometrias(capas, mapa), escala, fuente || undefined);

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error("No se pudo generar el PNG.")),
            "image/png",
        );
    });
}

export async function descargarEscaneoCorregido(
    urlImagen: string,
    capas: readonly CapaCorreccion[],
    mapa: Pick<MapaRegiones, "ancho_pagina" | "alto_pagina">,
    numeroReporte: string,
    pagina: NumeroPagina,
): Promise<void> {
    const blob = await generarPngCorregido(urlImagen, capas, mapa);
    descargarBlob(blob, nombreArchivoCorregido(numeroReporte, pagina));
}
