/**
 * Responsabilidad: dibujar una lista de elementos de una sección, cada uno como
 * tarjeta de campo suelto o como tarjeta agrupada.
 * Existe porque la sección y el resumen de confianza alta (al expandirse) pintan
 * exactamente lo mismo, y el cableado entre tarjeta y acciones no debe repetirse.
 */

"use client";

import type { CSSProperties } from "react";

import type { ErrorAccion } from "@/features/revision/hooks/use-revision-reporte";
import type { ElementoSeccion } from "@/features/revision/lib/grupos";
import type {
    IdCampo,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { TarjetaCampo, type AccionesCampo } from "./tarjeta-campo";
import { TarjetaGrupo } from "./tarjeta-grupo";

interface ListaElementosProps {
    reporte: ReporteVista;
    elementos: readonly ElementoSeccion[];
    campoActivoId: IdCampo | null;
    enCurso: boolean;
    modoEdicion: boolean;
    errorAccion?: ErrorAccion | null;
    acciones: AccionesCampo;
}

export function ListaElementos({
    reporte,
    elementos,
    campoActivoId,
    enCurso,
    modoEdicion,
    errorAccion,
    acciones,
}: ListaElementosProps) {
    return (
        <ul className="flex flex-col gap-2">
            {elementos.map((elemento, indice) => {
                const error =
                    errorAccion &&
                    elemento.campos.some((campo) => campo.id === errorAccion.campo)
                        ? errorAccion.mensaje
                        : null;

                return (
                    <li
                        key={elemento.clave}
                        className="animar-tarjeta"
                        style={{ "--i": indice } as CSSProperties}
                    >
                        {elemento.tipo === "grupo" ? (
                            <TarjetaGrupo
                                reporte={reporte}
                                definicion={elemento.definicion}
                                campos={elemento.campos}
                                campoActivoId={campoActivoId}
                                enCurso={enCurso}
                                modoEdicion={modoEdicion}
                                error={error}
                                acciones={acciones}
                            />
                        ) : (
                            <TarjetaCampo
                                reporte={reporte}
                                campo={elemento.campos[0]}
                                activo={elemento.campos[0].id === campoActivoId}
                                enCurso={enCurso}
                                modoEdicion={modoEdicion}
                                error={error}
                                onSeleccionar={() => acciones.seleccionar(elemento.campos[0].id)}
                                onConfirmar={() => acciones.confirmar(elemento.campos[0].id)}
                                onCorregir={(valor) =>
                                    acciones.corregir(elemento.campos[0].id, valor)
                                }
                                onIlegible={() => acciones.ilegible(elemento.campos[0].id)}
                                onOmitir={() => acciones.omitir(elemento.campos[0].id)}
                                onReabrir={() => acciones.reabrir(elemento.campos[0].id)}
                                onDescartarError={acciones.descartarError}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
