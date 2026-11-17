/**
 * Responsabilidad: resumir en una línea los campos que el modelo leyó con
 * confianza alta y que nadie tocó, con un control para abrirlos y revisarlos
 * uno a uno.
 * Existe porque son la mayoría del formulario y listarlos como tarjetas haría
 * que el técnico leyera todo de nuevo; el resumen deja ver el valor de un
 * vistazo sin ocultarlo, y expandirlo es siempre posible.
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { twMerge } from "tailwind-merge";

import type { ErrorAccion } from "@/features/revision/hooks/use-revision-reporte";
import {
    contieneCampo,
    describirResumen,
    type ElementoSeccion,
} from "@/features/revision/lib/grupos";
import type {
    IdCampo,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { ListaElementos } from "./lista-elementos";
import type { AccionesCampo } from "./tarjeta-campo";

const CHIPS_VISIBLES = 6;

interface ResumenAutomaticosProps {
    reporte: ReporteVista;
    elementos: readonly ElementoSeccion[];
    campoActivoId: IdCampo | null;
    enCurso: boolean;
    modoEdicion: boolean;
    errorAccion?: ErrorAccion | null;
    acciones: AccionesCampo;
}

export function ResumenAutomaticos({
    reporte,
    elementos,
    campoActivoId,
    enCurso,
    modoEdicion,
    errorAccion,
    acciones,
}: ResumenAutomaticosProps) {
    const idLista = useId();
    const [expandido, setExpandido] = useState(false);

    // Si el teclado lleva el foco a uno de estos campos, se abre para mostrarlo
    // (ajuste durante el render: evita un efecto y un render de más).
    const contieneActivo = contieneCampo(elementos, campoActivoId);
    const [activoPrevio, setActivoPrevio] = useState(false);
    if (activoPrevio !== contieneActivo) {
        setActivoPrevio(contieneActivo);
        if (contieneActivo) setExpandido(true);
    }

    if (elementos.length === 0) return null;

    const total = elementos.reduce((n, elemento) => n + elemento.campos.length, 0);
    const chips = elementos.map((elemento) => ({
        clave: elemento.clave,
        ...describirResumen(elemento),
    }));
    const visibles = chips.slice(0, CHIPS_VISIBLES);
    const ocultos = chips.length - visibles.length;

    return (
        <div className="rounded-md border border-dashed border-line-strong bg-sunken px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="flex items-center gap-1.5 text-meta font-medium text-green-700">
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    {total === 1
                        ? "1 leído con confianza alta"
                        : `${total} leídos con confianza alta`}
                </p>
                <button
                    type="button"
                    aria-expanded={expandido}
                    aria-controls={idLista}
                    onClick={() => setExpandido((valor) => !valor)}
                    className="inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-meta font-medium text-petrol-700 hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600"
                >
                    {expandido ? "Ocultar" : "Revisar uno a uno"}
                    <ChevronDown
                        className={twMerge(
                            "size-3.5 transition-transform duration-150 motion-reduce:transition-none",
                            expandido && "rotate-180",
                        )}
                        aria-hidden="true"
                    />
                </button>
            </div>
            <ul
                aria-label="Valores leídos con confianza alta"
                className="mt-2 flex flex-wrap gap-1.5"
            >
                {visibles.map((chip) => (
                    <li
                        key={chip.clave}
                        className="max-w-full truncate rounded-xs border border-line bg-raised px-2 py-0.5 text-meta"
                    >
                        <span className="text-muted">{chip.etiqueta}</span>{" "}
                        <span
                            className={twMerge(
                                "font-medium text-ink",
                                chip.valor === "vacío" && "italic text-faint",
                            )}
                        >
                            {chip.valor}
                        </span>
                    </li>
                ))}
                {ocultos > 0 ? (
                    <li className="rounded-xs px-1.5 py-0.5 text-meta text-faint">
                        +{ocultos}
                    </li>
                ) : null}
            </ul>

            {expandido ? (
                <div id={idLista} className="mt-3">
                    <ListaElementos
                        reporte={reporte}
                        elementos={elementos}
                        campoActivoId={campoActivoId}
                        enCurso={enCurso}
                        modoEdicion={modoEdicion}
                        errorAccion={errorAccion}
                        acciones={acciones}
                    />
                </div>
            ) : null}
        </div>
    );
}
