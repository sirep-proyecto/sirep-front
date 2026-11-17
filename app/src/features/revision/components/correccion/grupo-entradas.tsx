/**
 * Responsabilidad: tarjetas de varios valores cortos que se escriben en una fila:
 * revisión de líneas (L+N, L+T, N+T), horario (llegada y salida) y firmas.
 * Existe porque los tres grupos se resuelven igual: un recuadro por campo, un
 * botón para confirmar lo leído y otro para omitir lo que está vacío. Las firmas
 * añaden el recorte de cada una como evidencia, porque ahí lo que se compara es
 * el trazo.
 */

"use client";

import { useState } from "react";

import { Entrada } from "@/components/ui/entrada";
import { valorVigente } from "@/features/revision/lib/campos";
import type { Borrador } from "@/features/revision/lib/grupos";
import { HojaEscaneada } from "@/features/revision/components/escaneo/hoja-escaneada";
import { RecorteEscaneo } from "@/features/revision/components/escaneo/recorte";
import type { IdCampo } from "@/features/revision/types/dominio";

import { MarcarCampo } from "./marcar-campo";
import { AccionesGrupo } from "./acciones-grupo";
import { RecorteGrupo } from "./recorte-grupo";
import type { CuerpoGrupoProps } from "./tarjeta-grupo";

interface ConfigEntradas {
    etiquetas: Partial<Record<IdCampo, string>>;
    etiquetaConfirmar: string;
    /** `campo`: un recorte por campo (firmas). `grupo`: un solo recorte que abarca todos. */
    recorte: "campo" | "grupo";
    mono: boolean;
}

const CONFIG: Record<"lineas" | "horario" | "firmas", ConfigEntradas> = {
    lineas: {
        etiquetas: {
            revision_linea_ln: "L+N",
            revision_linea_lt: "L+T",
            revision_linea_nt: "N+T",
        },
        etiquetaConfirmar: "Confirmar líneas",
        recorte: "grupo",
        mono: true,
    },
    horario: {
        etiquetas: { hora_llegada: "Llegada", hora_salida: "Salida" },
        etiquetaConfirmar: "Confirmar horario",
        recorte: "grupo",
        mono: true,
    },
    firmas: {
        etiquetas: { firma_operador: "Operador", firma_cliente: "Cliente" },
        etiquetaConfirmar: "Confirmar firmas",
        recorte: "campo",
        mono: false,
    },
};

interface GrupoEntradasProps extends CuerpoGrupoProps {
    tipo: keyof typeof CONFIG;
}

export function GrupoEntradas({
    tipo,
    reporte,
    campos,
    enCurso,
    modoEdicion,
    acciones,
    onSeleccionarCampo,
}: GrupoEntradasProps) {
    const config = CONFIG[tipo];
    const [borrador, setBorrador] = useState<Borrador>({});
    const editable = modoEdicion && !enCurso;

    return (
        <div>
            {config.recorte === "grupo" ? (
                <div className="mb-3">
                    <RecorteGrupo reporte={reporte} campos={campos} alturaMaxRem={5} />
                </div>
            ) : null}

            <div
                className={
                    campos.length === 3
                        ? "grid gap-3 sm:grid-cols-3"
                        : "grid gap-3 sm:grid-cols-2"
                }
            >
                {campos.map((campo) => {
                    const etiqueta = config.etiquetas[campo.id] ?? campo.definicion.etiqueta;
                    const original = valorVigente(campo) ?? "";
                    const omitido = campo.estado_revision === "omitido";
                    const idEntrada = `entrada-${campo.id}`;
                    return (
                        <div key={campo.id} className="min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <label
                                    htmlFor={idEntrada}
                                    className="block text-micro uppercase tracking-label text-faint"
                                >
                                    {etiqueta}
                                </label>
                                <MarcarCampo
                                    campo={campo}
                                    etiqueta={etiqueta}
                                    editable={editable}
                                    acciones={acciones}
                                />
                            </div>
                            {config.recorte === "campo" ? (
                                <div
                                    aria-hidden="true"
                                    className="mt-1 overflow-hidden rounded-xs border border-line bg-paper"
                                >
                                    <RecorteEscaneo
                                        mapa={reporte.mapa}
                                        region={campo.region}
                                        padding={0.012}
                                    >
                                        <HojaEscaneada
                                            mapa={reporte.mapa}
                                            pagina={campo.region.pagina}
                                            reporte={reporte}
                                            className="h-full w-full"
                                        />
                                    </RecorteEscaneo>
                                </div>
                            ) : null}
                            <Entrada
                                id={idEntrada}
                                value={borrador[campo.id] ?? original}
                                onChange={(evento) =>
                                    setBorrador((actual) => ({
                                        ...actual,
                                        [campo.id]: evento.target.value,
                                    }))
                                }
                                onFocus={() => onSeleccionarCampo(campo.id)}
                                disabled={!editable}
                                placeholder={
                                    omitido ? "Omitido" : tipo === "firmas" ? "Sin firma" : "—"
                                }
                                className={
                                    "mt-1 h-8 " + (config.mono ? "font-mono" : "")
                                }
                            />
                        </div>
                    );
                })}
            </div>

            <AccionesGrupo
                campos={campos}
                borrador={borrador}
                etiquetaConfirmar={config.etiquetaConfirmar}
                enCurso={enCurso}
                modoEdicion={modoEdicion}
                acciones={acciones}
            />
        </div>
    );
}
