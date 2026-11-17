/**
 * Responsabilidad: dibujar las correcciones en un `<canvas>` con la misma
 * geometría que calcula `capas-correccion` para el SVG del visor.
 * Existe aparte de la descarga para poder probar el dibujo con un contexto
 * simulado y para que el PNG descargado y la hoja en pantalla salgan de las
 * mismas medidas: solo cambia el pincel. `fuente` permite pasar la tipografía
 * ya resuelta de la página, porque el canvas no entiende `var(--font-mono)`.
 */

import {
    FUENTE_MONO,
    PALETA_CAPAS,
    type GeometriaCapa,
} from "@/features/revision/lib/capas-correccion";

const SEPARACION_TRAMA = 9;

function dibujarTrama(
    ctx: CanvasRenderingContext2D,
    { x, y, ancho, alto }: GeometriaCapa,
): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, ancho, alto);
    ctx.clip();
    ctx.strokeStyle = PALETA_CAPAS.omitido.trama;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let desfase = -alto; desfase < ancho; desfase += SEPARACION_TRAMA) {
        ctx.moveTo(x + desfase, y + alto);
        ctx.lineTo(x + desfase + alto, y);
    }
    ctx.stroke();
    ctx.restore();
}

/**
 * Dibuja todos los recuadros sobre lo que ya haya en el lienzo. `escala`
 * convierte píxeles del mapa en píxeles del canvas.
 */
export function dibujarCapas(
    ctx: CanvasRenderingContext2D,
    geometrias: readonly GeometriaCapa[],
    escala: number,
    fuente: string = FUENTE_MONO,
): void {
    ctx.save();
    ctx.scale(escala, escala);

    for (const g of geometrias) {
        const paleta =
            g.capa.tipo === "corregido" ? PALETA_CAPAS.corregido : PALETA_CAPAS.omitido;

        ctx.fillStyle = paleta.relleno;
        ctx.fillRect(g.x, g.y, g.ancho, g.alto);
        if (g.capa.tipo === "omitido") dibujarTrama(ctx, g);

        ctx.strokeStyle = paleta.borde;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(g.x, g.y, g.ancho, g.alto);

        ctx.fillStyle = paleta.texto;
        ctx.font = `${g.capa.tipo === "omitido" ? "italic " : ""}${g.tamano}px ${fuente}`;
        ctx.textBaseline = "alphabetic";
        g.lineas.forEach((linea, indice) => {
            ctx.fillText(linea, g.texto_x, g.texto_y + indice * g.interlineado);
        });

        if (g.insignia) {
            const { cx, cy, r } = g.insignia;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = PALETA_CAPAS.insignia.relleno;
            ctx.fill();
            ctx.fillStyle = PALETA_CAPAS.insignia.texto;
            ctx.font = `700 ${r * 1.15}px ${fuente}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(g.capa.numero), cx, cy + r * 0.05);
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
        }
    }

    ctx.restore();
}
