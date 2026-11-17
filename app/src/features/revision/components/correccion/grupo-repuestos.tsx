/**
 * Responsabilidad: la tarjeta de repuestos: casillas Venta / Descarte /
 * Garantía y la tabla código, descripción y cantidad.
 * Existe porque en el papel es una sola tabla, aunque el modelo la lea como
 * cuatro campos: la fila N de cada columna forma el repuesto N, y se edita como
 * tabla. Al confirmar, cada columna cuyo contenido cambió se corrige, y el resto
 * se confirma; las columnas vacías nunca se omiten solas.
 */

"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import { valorVigente } from "@/features/revision/lib/campos";
import type { Borrador } from "@/features/revision/lib/grupos";
import {
    CAMPO_DE_COLUMNA,
    COLUMNAS_REPUESTO,
    OPCIONES_TIPO_REPUESTO,
    columnasDesdeFilas,
    filasDesdeColumnas,
    normalizarMultilinea,
    tiposDesdeValor,
    valorDesdeTipos,
    type ColumnaRepuesto,
    type FilaRepuesto,
} from "@/features/revision/lib/repuestos";
import type { CampoVista } from "@/features/revision/types/dominio";

import { AccionesGrupo } from "./acciones-grupo";
import type { CuerpoGrupoProps } from "./tarjeta-grupo";

const ENCABEZADOS: Record<ColumnaRepuesto, string> = {
    codigo: "Código",
    descripcion: "Descripción",
    cantidad: "Cant.",
};

const CLASES_CELDA =
    "h-8 w-full rounded-xs border border-line-strong bg-inset px-2 text-meta text-ink placeholder:text-faint " +
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600 disabled:cursor-not-allowed disabled:opacity-60";

function textoDe(campo: CampoVista | undefined): string {
    return campo ? (valorVigente(campo) ?? "") : "";
}

export function GrupoRepuestos({
    campos,
    enCurso,
    modoEdicion,
    acciones,
    onSeleccionarCampo,
}: CuerpoGrupoProps) {
    const porId = (id: string) => campos.find((campo) => campo.id === id);
    const campoTipo = porId("repuestos_tipo");

    const [tipos, setTipos] = useState<string[]>(() =>
        tiposDesdeValor(textoDe(campoTipo)),
    );
    const [filas, setFilas] = useState<FilaRepuesto[]>(() =>
        filasDesdeColumnas({
            codigo: textoDe(porId("codigo_repuesto")),
            descripcion: textoDe(porId("repuestos_descripcion")),
            cantidad: textoDe(porId("repuestos_cantidad")),
        }),
    );

    // El borrador solo incluye lo que cambió respecto de lo vigente: lo demás se
    // confirma o se deja como está, nunca se reescribe.
    const borrador: Borrador = {};
    const columnas = columnasDesdeFilas(filas);
    for (const columna of COLUMNAS_REPUESTO) {
        const id = CAMPO_DE_COLUMNA[columna];
        const original = normalizarMultilinea(textoDe(porId(id)));
        if (columnas[columna] !== original) borrador[id] = columnas[columna];
    }
    const tiposOriginales = tiposDesdeValor(textoDe(campoTipo));
    if (valorDesdeTipos(tipos) !== valorDesdeTipos(tiposOriginales)) {
        borrador.repuestos_tipo = valorDesdeTipos(tipos);
    }

    const editable = modoEdicion && !enCurso;

    function cambiarCelda(indice: number, columna: ColumnaRepuesto, valor: string) {
        setFilas((actuales) =>
            actuales.map((fila, i) =>
                i === indice ? { ...fila, [columna]: valor } : fila,
            ),
        );
    }

    function alternarTipo(opcion: string) {
        setTipos((actuales) =>
            actuales.includes(opcion)
                ? actuales.filter((tipo) => tipo !== opcion)
                : [...actuales, opcion],
        );
    }

    return (
        <div>
            <fieldset
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
                onFocus={() => onSeleccionarCampo("repuestos_tipo")}
            >
                <legend className="sr-only">Tipo de repuestos</legend>
                <span aria-hidden="true" className="text-meta text-muted">
                    Tipo:
                </span>
                {OPCIONES_TIPO_REPUESTO.map((opcion) => (
                    <label
                        key={opcion}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-body text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                    >
                        <input
                            type="checkbox"
                            checked={tipos.includes(opcion)}
                            onChange={() => alternarTipo(opcion)}
                            disabled={!editable}
                            className="size-4 accent-[var(--petrol-600)]"
                        />
                        {opcion}
                    </label>
                ))}
            </fieldset>

            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[26rem] border-collapse text-left">
                    <caption className="sr-only">Repuestos requeridos</caption>
                    <thead>
                        <tr>
                            {COLUMNAS_REPUESTO.map((columna) => (
                                <th
                                    key={columna}
                                    scope="col"
                                    className="px-1 pb-1 text-micro font-medium uppercase tracking-label text-faint"
                                >
                                    {ENCABEZADOS[columna]}
                                </th>
                            ))}
                            <th scope="col" className="w-8">
                                <span className="sr-only">Quitar fila</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-1 py-2 text-meta italic text-faint"
                                >
                                    Sin repuestos en la tabla.
                                </td>
                            </tr>
                        ) : null}
                        {filas.map((fila, indice) => (
                            <tr key={indice}>
                                {COLUMNAS_REPUESTO.map((columna) => (
                                    <td
                                        key={columna}
                                        className={
                                            columna === "descripcion"
                                                ? "px-1 py-0.5"
                                                : columna === "codigo"
                                                  ? "w-32 px-1 py-0.5"
                                                  : "w-20 px-1 py-0.5"
                                        }
                                    >
                                        <input
                                            type="text"
                                            value={fila[columna]}
                                            onChange={(evento) =>
                                                cambiarCelda(indice, columna, evento.target.value)
                                            }
                                            onFocus={() =>
                                                onSeleccionarCampo(CAMPO_DE_COLUMNA[columna])
                                            }
                                            disabled={!editable}
                                            aria-label={`${ENCABEZADOS[columna]} del repuesto ${indice + 1}`}
                                            className={
                                                CLASES_CELDA +
                                                (columna === "descripcion" ? "" : " font-mono")
                                            }
                                        />
                                    </td>
                                ))}
                                <td className="w-8 px-0.5 py-0.5 text-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilas((actuales) =>
                                                actuales.filter((_, i) => i !== indice),
                                            )
                                        }
                                        disabled={!editable}
                                        aria-label={`Quitar el repuesto ${indice + 1}`}
                                        className="inline-flex size-7 items-center justify-center rounded-xs text-faint hover:bg-brick-50 hover:text-brick-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <X className="size-3.5" aria-hidden="true" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Boton
                variante="fantasma"
                tamano="sm"
                onClick={() =>
                    setFilas((actuales) => [
                        ...actuales,
                        { codigo: "", descripcion: "", cantidad: "" },
                    ])
                }
                disabled={!editable}
                className="mt-1"
            >
                <Plus className="size-4 shrink-0" aria-hidden="true" />
                Agregar fila
            </Boton>

            <AccionesGrupo
                campos={campos}
                borrador={borrador}
                etiquetaConfirmar="Confirmar repuestos"
                enCurso={enCurso}
                modoEdicion={modoEdicion}
                acciones={acciones}
            />
        </div>
    );
}
