/**
 * Responsabilidad: exponer el modo del visor como estado de React respaldado por
 * `localStorage`.
 * Existe con `useSyncExternalStore` para que el servidor y la primera pasada del
 * cliente rendericen el modo por defecto (sin desajuste de hidratación) y el
 * valor guardado entre en la pasada siguiente.
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
    guardarModoVisor,
    leerModoVisor,
    MODO_VISOR_POR_DEFECTO,
    type ModoVisor,
} from "@/features/revision/lib/preferencia-visor";

const oyentes = new Set<() => void>();

function suscribir(oyente: () => void): () => void {
    oyentes.add(oyente);
    window.addEventListener("storage", oyente);
    return () => {
        oyentes.delete(oyente);
        window.removeEventListener("storage", oyente);
    };
}

export function useModoVisor(): [ModoVisor, (modo: ModoVisor) => void] {
    const modo = useSyncExternalStore(
        suscribir,
        leerModoVisor,
        () => MODO_VISOR_POR_DEFECTO,
    );

    const cambiar = useCallback((nuevo: ModoVisor) => {
        guardarModoVisor(nuevo);
        oyentes.forEach((oyente) => oyente());
    }, []);

    return [modo, cambiar];
}
