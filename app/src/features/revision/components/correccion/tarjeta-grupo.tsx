/**
 * Responsabilidad: presentar como UNA tarjeta lo que en el papel es un solo dato
 * (repuestos, casillas de revisión, líneas, horario y firmas), con el recorte del
 * escaneo como evidencia y las acciones aplicadas a cada campo del grupo.
 * Existe porque revisar 31 tarjetas sueltas hace perder el hilo de lo que el
 * papel dice en conjunto. La agrupación es solo de presentación: por debajo
 * siguen siendo campos separados y cada acción se traduce a un paso por campo
 * (`lib/grupos.ts`).
 */

"use client";

import { AlertTriangle, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Insignia } from "@/components/ui/insignia";
import {
    estadoDeCampos,
    rotuloDeCampos,
    type DefinicionGrupo,
} from "@/features/revision/lib/grupos";
import { valorVigente } from "@/features/revision/lib/campos";
import type {
    CampoVista,
    IdCampo,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { GrupoCasillas } from "./grupo-casillas";
import { GrupoEntradas } from "./grupo-entradas";
import { GrupoRepuestos } from "./grupo-repuestos";
import { RecorteGrupo } from "./recorte-grupo";
import type { AccionesCampo } from "./tarjeta-campo";

/** Lo que recibe el cuerpo de cada tipo de grupo. */
export interface CuerpoGrupoProps {
    reporte: ReporteVista;
    campos: CampoVista[];
    enCurso: boolean;
    modoEdicion: boolean;
    acciones: AccionesCampo;
    /** Enfocar una celda marca ese campo como activo y el visor resalta su región. */
    onSeleccionarCampo: (campo: IdCampo) => void;
}

export interface TarjetaGrupoProps {
    reporte: ReporteVista;
    definicion: DefinicionGrupo;
    campos: CampoVista[];
    campoActivoId: IdCampo | null;
    enCurso: boolean;
    modoEdicion: boolean;
    /** Mensaje de error de alguno de los campos del grupo, si lo hay. */
    error: string | null;
    acciones: AccionesCampo;
}

/**
 * Si el servidor cambia un campo del grupo (otra persona, o la acción propia), el
 * borrador de la tarjeta deja de ser válido: cambiar la clave la reinicia.
 */
function firmaDeCampos(campos: readonly CampoVista[]): string {
    return campos
        .map((campo) => `${campo.id}:${campo.estado_revision}:${valorVigente(campo) ?? ""}`)
        .join("|");
}

const BORDE_POR_ESTADO = {
    pendiente: "border-l-amber-600",
    sin_lectura: "border-l-brick-600",
    listo: "border-l-green-600",
} as const;

export function TarjetaGrupo({
    reporte,
    definicion,
    campos,
    campoActivoId,
    enCurso,
    modoEdicion,
    error,
    acciones,
}: TarjetaGrupoProps) {
    const activo = campos.some((campo) => campo.id === campoActivoId);
    const estado = estadoDeCampos(campos);
    const rotulo = rotuloDeCampos(campos);
    const todoOmitido = campos.every((campo) => campo.estado_revision === "omitido");

    const seleccionarPrimero = () => {
        // Entrar a la tarjeta activa su primer campo; si ya hay uno activo del grupo
        // (por ejemplo una celda enfocada) se respeta.
        if (!activo) acciones.seleccionar(campos[0].id);
    };

    const props: CuerpoGrupoProps = {
        reporte,
        campos,
        enCurso,
        modoEdicion,
        acciones,
        onSeleccionarCampo: acciones.seleccionar,
    };

    return (
        <article
            aria-current={activo ? "true" : undefined}
            aria-busy={enCurso || undefined}
            aria-label={definicion.titulo}
            data-campos={campos.map((campo) => campo.id).join(" ")}
            onClick={seleccionarPrimero}
            onFocus={seleccionarPrimero}
            className={twMerge(
                "rounded-md border border-line border-l-4 bg-raised p-3",
                "transition-[box-shadow] duration-150 ease-[var(--ease-salida)]",
                BORDE_POR_ESTADO[estado],
                todoOmitido && "border-l-line-strong opacity-70",
                activo && "shadow-lift ring-1 ring-petrol-600",
            )}
        >
            <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-body font-semibold text-ink">{definicion.titulo}</h4>
                <span className="text-micro text-faint">
                    {campos.length} campos en 1 tarjeta
                </span>
                <Insignia tono={rotulo.tono} tamano="micro" className="ml-auto">
                    {rotulo.etiqueta}
                </Insignia>
                {!modoEdicion ? (
                    <span
                        className="flex items-center gap-1 rounded-xs bg-line px-1.5 py-0.5 text-micro font-medium text-faint"
                        title="Para editar esta tarjeta, hacé clic en 'Editar' en el encabezado del panel"
                    >
                        Bloqueado
                    </span>
                ) : null}
            </div>

            {definicion.id !== "firmas" && definicion.id !== "lineas" && definicion.id !== "horario" ? (
                <div className="mt-2.5">
                    <RecorteGrupo reporte={reporte} campos={campos} />
                </div>
            ) : null}

            <div className="mt-2.5">
                {definicion.id === "repuestos" ? (
                    <GrupoRepuestos key={firmaDeCampos(campos)} {...props} />
                ) : null}
                {definicion.id === "casillas" || definicion.id === "labor" ? (
                    <GrupoCasillas key={firmaDeCampos(campos)} {...props} />
                ) : null}
                {definicion.id === "lineas" ||
                definicion.id === "horario" ||
                definicion.id === "firmas" ? (
                    <GrupoEntradas
                        key={firmaDeCampos(campos)}
                        tipo={definicion.id}
                        {...props}
                    />
                ) : null}
            </div>

            {error ? (
                <div
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xs border border-brick-200 bg-brick-50 px-2.5 py-2 text-brick-700"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="min-w-0 flex-1 text-meta">{error}</p>
                    <button
                        type="button"
                        onClick={acciones.descartarError}
                        aria-label="Descartar el mensaje de error"
                        className="rounded-xs p-1 hover:bg-brick-200/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brick-600"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            ) : null}
        </article>
    );
}
