/**
 * Responsabilidad: el botón "Omitir" de UN campo dentro de una tarjeta agrupada
 * (estado, limpieza, L+N, hora de llegada…), y su "Deshacer" cuando ya se omitió.
 * Existe porque en el papel cada casilla o recuadro puede venir en blanco por su
 * cuenta: la persona decide campo por campo, nunca el grupo entero de golpe.
 */

"use client";

import { RotateCcw, SkipForward } from "lucide-react";
import { twMerge } from "tailwind-merge";

import type { CampoReporte } from "@/features/revision/types/dominio";

import type { AccionesCampo } from "./tarjeta-campo";

interface OmitirCampoProps {
    campo: CampoReporte;
    etiqueta: string;
    editable: boolean;
    acciones: AccionesCampo;
    className?: string;
}

export function OmitirCampo({ campo, etiqueta, editable, acciones, className }: OmitirCampoProps) {
    const omitido = campo.estado_revision === "omitido";
    const base =
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-xs px-2 text-meta transition-colors duration-150 ease-[var(--ease-salida)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600 disabled:cursor-not-allowed disabled:opacity-50";

    if (omitido) {
        return (
            <span className={twMerge("inline-flex items-center gap-1.5", className)}>
                <span className="rounded-xs bg-line px-1.5 py-0.5 text-micro font-medium text-muted">
                    Omitido
                </span>
                <button
                    type="button"
                    disabled={!editable}
                    onClick={() => acciones.reabrir(campo.id)}
                    aria-label={`Deshacer omitir ${etiqueta}`}
                    className={twMerge(base, "text-muted hover:bg-raised hover:text-ink")}
                >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Deshacer
                </button>
            </span>
        );
    }

    return (
        <button
            type="button"
            disabled={!editable}
            onClick={() => acciones.omitir(campo.id)}
            aria-label={`Omitir ${etiqueta}: está vacío en el papel`}
            title="Está vacío en el papel"
            className={twMerge(
                base,
                "border border-line text-muted hover:border-line-strong hover:bg-raised hover:text-ink",
                className,
            )}
        >
            <SkipForward className="size-3.5" aria-hidden="true" />
            Omitir
        </button>
    );
}
