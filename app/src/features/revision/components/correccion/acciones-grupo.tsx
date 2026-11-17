/**
 * Responsabilidad: los botones de una tarjeta agrupada: confirmar, omitir los
 * vacíos y reabrir.
 * Existe para que todos los grupos (repuestos, casillas, líneas, horario,
 * firmas) ofrezcan las mismas acciones con las mismas reglas: lo que se hace con
 * cada campo lo deciden `planConfirmar`, `planOmitirVacios` y `planReabrir`, y
 * acá solo se muestra el botón cuando hay algo que hacer.
 */

"use client";

import { CheckCircle2, RotateCcw, SkipForward } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Boton } from "@/components/ui/boton";
import {
    planConfirmar,
    planOmitirVacios,
    planReabrir,
    rotuloOmitir,
    type Borrador,
} from "@/features/revision/lib/grupos";
import type { CampoVista } from "@/features/revision/types/dominio";

import type { AccionesCampo } from "./tarjeta-campo";

interface AccionesGrupoProps {
    campos: readonly CampoVista[];
    /** Lo que la persona editó en la tarjeta; lo no editado sigue como está. */
    borrador?: Borrador;
    /** Texto del botón de confirmar, por ejemplo "Confirmar repuestos". */
    etiquetaConfirmar: string;
    enCurso: boolean;
    modoEdicion: boolean;
    acciones: Pick<AccionesCampo, "aplicarLote">;
}

export function AccionesGrupo({
    campos,
    borrador = {},
    etiquetaConfirmar,
    enCurso,
    modoEdicion,
    acciones,
}: AccionesGrupoProps) {
    const confirmar = planConfirmar(campos, borrador);
    // Un campo que la persona está escribiendo no es "vacío": no se ofrece omitirlo.
    const vacios = planOmitirVacios(
        campos.filter((campo) => borrador[campo.id] === undefined),
    );
    const reabrir = planReabrir(campos);

    if (confirmar.length === 0 && vacios.length === 0 && reabrir.length === 0) {
        return null;
    }

    const bloqueado = enCurso || !modoEdicion;
    const clasesBloqueo = !modoEdicion && "cursor-not-allowed opacity-50";

    return (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {reabrir.length > 0 ? (
                <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => void acciones.aplicarLote(reabrir)}
                    disabled={bloqueado}
                    className={twMerge(clasesBloqueo)}
                >
                    <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                    Reabrir
                </Boton>
            ) : null}
            {vacios.length > 0 ? (
                <Boton
                    // Si no hay nada con valor que confirmar, omitir es la acción principal.
                    variante={confirmar.length === 0 ? "primario" : "secundario"}
                    tamano="sm"
                    onClick={() => void acciones.aplicarLote(vacios)}
                    disabled={bloqueado}
                    className={twMerge(clasesBloqueo)}
                >
                    <SkipForward className="size-4 shrink-0" aria-hidden="true" />
                    {rotuloOmitir(vacios.length, campos.length)}
                </Boton>
            ) : null}
            {confirmar.length > 0 ? (
                <Boton
                    variante="exito"
                    tamano="sm"
                    onClick={() => void acciones.aplicarLote(confirmar)}
                    disabled={bloqueado}
                    className={twMerge(clasesBloqueo)}
                >
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                    {etiquetaConfirmar}
                </Boton>
            ) : null}
        </div>
    );
}
