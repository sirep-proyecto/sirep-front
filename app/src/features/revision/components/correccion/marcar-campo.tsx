/**
 * Responsabilidad: los botones "Omitir" e "Ilegible" de UN campo dentro de una
 * tarjeta agrupada (estado, limpieza, L+N, hora de llegada…), y su "Deshacer".
 * Existe porque en el papel cada casilla o recuadro puede venir en blanco por su
 * cuenta: la persona decide campo por campo, nunca el grupo entero de golpe.
 */

"use client";

import { Ban, RotateCcw, SkipForward } from "lucide-react";
import { twMerge } from "tailwind-merge";

import type { CampoReporte } from "@/features/revision/types/dominio";

import type { AccionesCampo } from "./tarjeta-campo";

interface MarcarCampoProps {
    campo: CampoReporte;
    etiqueta: string;
    editable: boolean;
    acciones: AccionesCampo;
    className?: string;
}

export function MarcarCampo({ campo, etiqueta, editable, acciones, className }: MarcarCampoProps) {
    const omitido = campo.estado_revision === "omitido";
    const base =
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-xs px-2 text-meta transition-colors duration-150 ease-[var(--ease-salida)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600 disabled:cursor-not-allowed disabled:opacity-50";

    const ilegible = campo.estado_revision === "ilegible";

    if (omitido || ilegible) {
        return (
            <span className={twMerge("inline-flex items-center gap-1.5", className)}>
                <span
                    className={twMerge(
                        "rounded-xs px-1.5 py-0.5 text-micro font-medium",
                        ilegible ? "bg-brick-50 text-brick-700" : "bg-line text-muted",
                    )}
                >
                    {ilegible ? "Ilegible" : "Omitido"}
                </span>
                <button
                    type="button"
                    disabled={!editable}
                    onClick={() => acciones.reabrir(campo.id)}
                    aria-label={`Deshacer ${ilegible ? "ilegible" : "omitir"} en ${etiqueta}`}
                    className={twMerge(base, "text-muted hover:bg-raised hover:text-ink")}
                >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Deshacer
                </button>
            </span>
        );
    }

    return (
        <span className={twMerge("inline-flex items-center gap-1", className)}>
            <button
                type="button"
                disabled={!editable}
                onClick={() => acciones.omitir(campo.id)}
                aria-label={`Omitir ${etiqueta}: está vacío en el papel`}
                title="Está vacío en el papel"
                className={twMerge(
                    base,
                    "border border-line text-muted hover:border-line-strong hover:bg-raised hover:text-ink",
                )}
            >
                <SkipForward className="size-3.5" aria-hidden="true" />
                Omitir
            </button>
            <button
                type="button"
                disabled={!editable}
                onClick={() => acciones.ilegible(campo.id)}
                aria-label={`Marcar ${etiqueta} como ilegible`}
                title="Hay algo escrito, pero no se entiende"
                className={twMerge(base, "text-brick-700 hover:bg-brick-50")}
            >
                <Ban className="size-3.5" aria-hidden="true" />
                Ilegible
            </button>
        </span>
    );
}
