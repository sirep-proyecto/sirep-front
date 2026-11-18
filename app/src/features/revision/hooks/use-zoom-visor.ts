/**
 * Responsabilidad: zoom y desplazamiento del visor del escaneo con el mouse.
 *   - Rueda (o pellizco en el touchpad): acerca o aleja hacia donde está el cursor.
 *   - Arrastrar con el botón izquierdo (la "manito"): mueve la hoja ampliada.
 *   - Doble clic: vuelve al 100 %.
 * Un arrastre no cuenta como clic, así no se elige un campo sin querer al soltar.
 * En pantallas táctiles se deja el desplazamiento nativo del navegador.
 */

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

import { desplazamientoAnclado, limitarZoom, zoomConRueda } from "@/features/revision/lib/visor";

/** Píxeles que hay que mover el mouse para que deje de ser un clic. */
const UMBRAL_ARRASTRE = 4;

interface Ancla {
    x: number;
    y: number;
    antes: number;
    despues: number;
}

export function useZoomVisor() {
    const contenedorRef = useRef<HTMLDivElement | null>(null);
    // El contenedor aparece después de cargar el reporte: con un ref de función
    // se sabe cuándo existe y recién ahí se engancha la rueda.
    const [contenedor, setContenedor] = useState<HTMLDivElement | null>(null);
    const refContenedor = useCallback((nodo: HTMLDivElement | null) => {
        contenedorRef.current = nodo;
        setContenedor(nodo);
    }, []);
    const [zoom, setZoomEstado] = useState(1);
    const zoomRef = useRef(1);
    const anclaRef = useRef<Ancla | null>(null);
    const arrastreRef = useRef<{ x: number; y: number; izq: number; arriba: number; movido: boolean } | null>(null);
    const fueArrastreRef = useRef(false);
    const [arrastrando, setArrastrando] = useState(false);

    /** Cambia el zoom dejando fijo el punto (x, y) relativo al contenedor (por defecto, el centro). */
    const cambiarZoom = useCallback((nuevo: number, punto?: { x: number; y: number }) => {
        const el = contenedorRef.current;
        const antes = zoomRef.current;
        const despues = limitarZoom(nuevo);
        if (despues === antes) return;
        anclaRef.current = {
            x: punto?.x ?? (el ? el.clientWidth / 2 : 0),
            y: punto?.y ?? (el ? el.clientHeight / 2 : 0),
            antes,
            despues,
        };
        zoomRef.current = despues;
        setZoomEstado(despues);
    }, []);

    // Tras el nuevo tamaño, se corrige el desplazamiento para que el punto quede bajo el cursor.
    useLayoutEffect(() => {
        const el = contenedorRef.current;
        const ancla = anclaRef.current;
        if (!el || !ancla) return;
        anclaRef.current = null;
        el.scrollLeft = desplazamientoAnclado(el.scrollLeft, ancla.x, ancla.antes, ancla.despues);
        el.scrollTop = desplazamientoAnclado(el.scrollTop, ancla.y, ancla.antes, ancla.despues);
    }, [zoom]);

    // La rueda se escucha a mano: con React el evento es pasivo y no se puede cancelar el scroll.
    useEffect(() => {
        const el = contenedor;
        if (!el) return;
        const alGirar = (evento: WheelEvent) => {
            evento.preventDefault();
            const caja = el.getBoundingClientRect();
            cambiarZoom(zoomConRueda(zoomRef.current, evento.deltaY), {
                x: evento.clientX - caja.left,
                y: evento.clientY - caja.top,
            });
        };
        el.addEventListener("wheel", alGirar, { passive: false });
        return () => el.removeEventListener("wheel", alGirar);
    }, [contenedor, cambiarZoom]);

    const alPresionar = useCallback((evento: ReactPointerEvent<HTMLDivElement>) => {
        if (evento.button !== 0 || evento.pointerType === "touch") return;
        if ((evento.target as HTMLElement).closest("button, a, input, textarea, select")) return;
        const el = contenedorRef.current;
        if (!el) return;
        fueArrastreRef.current = false;
        arrastreRef.current = { x: evento.clientX, y: evento.clientY, izq: el.scrollLeft, arriba: el.scrollTop, movido: false };

        const alMover = (mov: PointerEvent) => {
            const a = arrastreRef.current;
            if (!a) return;
            const dx = mov.clientX - a.x;
            const dy = mov.clientY - a.y;
            if (!a.movido && Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
            if (!a.movido) {
                a.movido = true;
                setArrastrando(true);
            }
            el.scrollLeft = a.izq - dx;
            el.scrollTop = a.arriba - dy;
        };
        const alSoltar = () => {
            fueArrastreRef.current = Boolean(arrastreRef.current?.movido);
            arrastreRef.current = null;
            setArrastrando(false);
            window.removeEventListener("pointermove", alMover);
            window.removeEventListener("pointerup", alSoltar);
            window.removeEventListener("pointercancel", alSoltar);
        };
        window.addEventListener("pointermove", alMover);
        window.addEventListener("pointerup", alSoltar);
        window.addEventListener("pointercancel", alSoltar);
    }, []);

    /** Se engancha en fase de captura: un arrastre no debe llegar como clic a la hoja. */
    const alClicCaptura = useCallback((evento: ReactMouseEvent<HTMLDivElement>) => {
        if (fueArrastreRef.current) {
            fueArrastreRef.current = false;
            evento.stopPropagation();
            evento.preventDefault();
        }
    }, []);

    const alDobleClic = useCallback((evento: ReactMouseEvent<HTMLDivElement>) => {
        const caja = evento.currentTarget.getBoundingClientRect();
        cambiarZoom(1, { x: evento.clientX - caja.left, y: evento.clientY - caja.top });
    }, [cambiarZoom]);

    return { zoom, cambiarZoom, refContenedor, arrastrando, alPresionar, alClicCaptura, alDobleClic };
}
