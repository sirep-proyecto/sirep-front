/**
 * Responsabilidad: bloque plegable de una sección del formulario con su
 * contador de estado ("1 pendiente", "1 sin leer", "✓ Listo") y el botón
 * "Confirmar sección".
 * Existe porque sin páginas el panel muestra las seis secciones a la vez: el
 * contador deja ver dónde queda trabajo sin abrir nada, y las listas se pliegan
 * para que el técnico no vuelva a pasar por lo que ya resolvió.
 */

"use client";

import { Check, CheckCircle2, ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { pluralizar } from "@/features/revision/lib/formato";
import type { SeccionVista } from "@/features/revision/lib/grupos";

interface SeccionPlegableProps {
    seccion: SeccionVista;
    abierta: boolean;
    enCurso: boolean;
    modoEdicion: boolean;
    onAlternar: () => void;
    onConfirmarSeccion: () => void;
    children: ReactNode;
}

export function SeccionPlegable({
    seccion,
    abierta,
    enCurso,
    modoEdicion,
    onAlternar,
    onConfirmarSeccion,
    children,
}: SeccionPlegableProps) {
    const idCuerpo = useId();
    const { seccion: definicion } = seccion;
    const confirmables = seccion.confirmables.length;

    return (
        <section
            aria-label={definicion.titulo}
            className="rounded-md border border-line bg-raised shadow-xs"
        >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-3">
                <h3 className="min-w-0 flex-1">
                    <button
                        type="button"
                        aria-expanded={abierta}
                        aria-controls={idCuerpo}
                        onClick={onAlternar}
                        className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-md px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-petrol-600"
                    >
                        <span className="text-base font-semibold text-ink">
                            {definicion.titulo}
                        </span>
                        <span className="text-micro text-faint">
                            {pluralizar(seccion.totalCampos, "campo", "campos")}
                        </span>
                        {seccion.pendientes > 0 ? (
                            <Insignia tono="amber" tamano="micro">
                                {pluralizar(seccion.pendientes, "pendiente", "pendientes")}
                            </Insignia>
                        ) : null}
                        {seccion.sinLeer > 0 ? (
                            <Insignia tono="brick" tamano="micro">
                                {seccion.sinLeer} sin leer
                            </Insignia>
                        ) : null}
                        {seccion.listo ? (
                            <Insignia tono="green" tamano="micro">
                                <Check className="size-3 shrink-0" aria-hidden="true" />
                                Listo
                            </Insignia>
                        ) : null}
                        <ChevronDown
                            className={twMerge(
                                "ml-auto size-4 shrink-0 text-faint transition-transform duration-150 motion-reduce:transition-none",
                                abierta && "rotate-180",
                            )}
                            aria-hidden="true"
                        />
                    </button>
                </h3>

                {confirmables > 0 ? (
                    <Boton
                        variante="secundario"
                        tamano="sm"
                        onClick={onConfirmarSeccion}
                        disabled={enCurso || !modoEdicion}
                        title={`Confirma ${pluralizar(confirmables, "campo", "campos")} de confianza media con valor. No omite ni toca los que el modelo no leyó.`}
                        className={twMerge(
                            "text-green-700",
                            !modoEdicion && "cursor-not-allowed",
                        )}
                    >
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                        Confirmar sección
                    </Boton>
                ) : null}
            </div>

            {abierta ? (
                <div
                    id={idCuerpo}
                    className="flex flex-col gap-2 border-t border-line px-3 py-3"
                >
                    {children}
                </div>
            ) : null}
        </section>
    );
}
