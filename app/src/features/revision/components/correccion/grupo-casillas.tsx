/**
 * Responsabilidad: la tarjeta de casillas de revisión (estado del equipo,
 * limpieza, cabezales y sistema de protección) como controles segmentados.
 * Existe porque en el papel son casillas para tildar, y el técnico las compara de
 * un vistazo: cada opción del papel es un segmento y "Vacío" es una decisión
 * explícita (omite el campo al confirmar), nunca un valor que se asuma.
 */

"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { Entrada } from "@/components/ui/entrada";
import { valorVigente } from "@/features/revision/lib/campos";
import { coincideOpcion, type Borrador } from "@/features/revision/lib/grupos";
import type { IdCampo } from "@/features/revision/types/dominio";

import { AccionesGrupo } from "./acciones-grupo";
import type { CuerpoGrupoProps } from "./tarjeta-grupo";

interface ConfigCasilla {
    rotulo: string;
    opciones: readonly string[];
    /** Además de las casillas hay un recuadro libre ("Otro"). */
    libre?: boolean;
}

const CONFIG_CASILLAS: Partial<Record<IdCampo, ConfigCasilla>> = {
    estado_del_equipo: { rotulo: "Estado", opciones: ["Operativo", "Inoperativo"] },
    limpieza_equipo: { rotulo: "Limpieza", opciones: ["Limpio", "Sucio"] },
    cabezales: { rotulo: "Cabezales", opciones: ["Bueno", "Regular", "Malo"] },
    sistema_proteccion: {
        rotulo: "Protección",
        opciones: ["Estab.", "UPS"],
        libre: true,
    },
};

const OTRO = "Otro";
const VACIO = "Vacío";

interface SegmentoProps {
    etiqueta: string;
    activo: boolean;
    deshabilitado: boolean;
    onElegir: () => void;
}

function Segmento({ etiqueta, activo, deshabilitado, onElegir }: SegmentoProps) {
    return (
        <button
            type="button"
            aria-pressed={activo}
            disabled={deshabilitado}
            onClick={onElegir}
            className={twMerge(
                "inline-flex h-7 items-center rounded-xs px-3 text-meta transition-colors duration-150 ease-[var(--ease-salida)]",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600 disabled:cursor-not-allowed",
                activo
                    ? "bg-petrol-50 font-semibold text-petrol-700 ring-1 ring-petrol-200"
                    : "text-muted hover:bg-raised hover:text-ink disabled:hover:bg-transparent",
                deshabilitado && !activo && "opacity-60",
            )}
        >
            {etiqueta}
        </button>
    );
}

export function GrupoCasillas({
    campos,
    enCurso,
    modoEdicion,
    acciones,
    onSeleccionarCampo,
}: CuerpoGrupoProps) {
    const [borrador, setBorrador] = useState<Borrador>({});
    const editable = modoEdicion && !enCurso;

    const vigente = (id: IdCampo): string => {
        const campo = campos.find((item) => item.id === id);
        return campo ? (valorVigente(campo) ?? "").trim() : "";
    };

    // "Otro" se abre si el valor del modelo no es ninguna casilla conocida.
    const [otroAbierto, setOtroAbierto] = useState(() => {
        const config = CONFIG_CASILLAS.sistema_proteccion;
        const actual = vigente("sistema_proteccion");
        return Boolean(
            config?.libre &&
                actual !== "" &&
                !config.opciones.some((opcion) => coincideOpcion(actual, opcion)),
        );
    });

    function elegir(id: IdCampo, valor: string) {
        setBorrador((actual) => ({ ...actual, [id]: valor }));
        if (id === "sistema_proteccion") setOtroAbierto(false);
        onSeleccionarCampo(id);
    }

    return (
        <div>
            <div className="flex flex-col gap-2">
                {campos.map((campo) => {
                    const config = CONFIG_CASILLAS[campo.id];
                    if (!config) return null;

                    const original = vigente(campo.id);
                    const mostrado = (borrador[campo.id] ?? original).trim();
                    const opcionActual = config.opciones.find((opcion) =>
                        coincideOpcion(mostrado, opcion),
                    );
                    const enOtro = Boolean(config.libre) && otroAbierto;
                    // Un valor que no es ninguna casilla (ni "Otro") se muestra tal cual.
                    const valorSuelto =
                        !enOtro && mostrado !== "" && !opcionActual ? mostrado : null;

                    return (
                        <div
                            key={campo.id}
                            className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_1fr]"
                        >
                            <span
                                id={`casilla-${campo.id}`}
                                className="text-micro uppercase tracking-label text-faint"
                            >
                                {config.rotulo}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <div
                                    role="group"
                                    aria-labelledby={`casilla-${campo.id}`}
                                    onFocus={() => onSeleccionarCampo(campo.id)}
                                    className="inline-flex flex-wrap gap-1 rounded-sm border border-line bg-sunken p-1"
                                >
                                    {config.opciones.map((opcion) => (
                                        <Segmento
                                            key={opcion}
                                            etiqueta={opcion}
                                            activo={!enOtro && opcionActual === opcion}
                                            deshabilitado={!editable}
                                            onElegir={() =>
                                                elegir(
                                                    campo.id,
                                                    // Si ya es esa casilla se conserva el texto del modelo.
                                                    coincideOpcion(original, opcion) ? original : opcion,
                                                )
                                            }
                                        />
                                    ))}
                                    {valorSuelto ? (
                                        <Segmento
                                            etiqueta={valorSuelto}
                                            activo
                                            deshabilitado={!editable}
                                            onElegir={() => undefined}
                                        />
                                    ) : null}
                                    {config.libre ? (
                                        <Segmento
                                            etiqueta={OTRO}
                                            activo={enOtro}
                                            deshabilitado={!editable}
                                            onElegir={() => {
                                                setOtroAbierto(true);
                                                onSeleccionarCampo(campo.id);
                                            }}
                                        />
                                    ) : null}
                                    <Segmento
                                        etiqueta={VACIO}
                                        activo={!enOtro && mostrado === ""}
                                        deshabilitado={!editable}
                                        onElegir={() => elegir(campo.id, "")}
                                    />
                                </div>
                                {enOtro ? (
                                    <Entrada
                                        value={opcionActual ? "" : mostrado}
                                        onChange={(evento) =>
                                            setBorrador((actual) => ({
                                                ...actual,
                                                [campo.id]: evento.target.value,
                                            }))
                                        }
                                        onFocus={() => onSeleccionarCampo(campo.id)}
                                        disabled={!editable}
                                        placeholder="Lo escrito en el recuadro"
                                        aria-label={`Otro valor de ${campo.definicion.etiqueta}`}
                                        className="h-8 w-48"
                                    />
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AccionesGrupo
                campos={campos}
                borrador={borrador}
                etiquetaConfirmar="Confirmar casillas"
                enCurso={enCurso}
                modoEdicion={modoEdicion}
                acciones={acciones}
            />
        </div>
    );
}
