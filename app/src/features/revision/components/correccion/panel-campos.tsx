/**
 * Responsabilidad: listar el reporte en sus seis secciones plegables, con el
 * botón de modo edición y el filtro "solo dudosos / todos los campos" en la
 * cabecera del panel.
 * Existe porque el orden y el plegado de esta lista son el ahorro de trabajo del
 * producto: las secciones con pendientes empiezan abiertas y las que ya están
 * listas, plegadas; lo leído con confianza alta va resumido en una línea. Sin
 * páginas: el técnico ve el estado de todo el formulario de un vistazo.
 */

"use client";

import {
    AlertTriangle,
    ListChecks,
    Lock,
    Rows3,
    Unlock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Boton } from "@/components/ui/boton";
import type { ErrorAccion } from "@/features/revision/hooks/use-revision-reporte";
import {
    camposDeSeccion,
    planConfirmarSeccion,
    type SeccionVista,
} from "@/features/revision/lib/grupos";
import type {
    CampoVista,
    IdSeccion,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { AyudaTeclado } from "./ayuda-teclado";
import { ListaElementos } from "./lista-elementos";
import { ResumenAutomaticos } from "./resumen-automaticos";
import { SeccionPlegable } from "./seccion-plegable";
import type { AccionesCampo } from "./tarjeta-campo";

interface PanelCamposProps {
    reporte: ReporteVista;
    secciones: SeccionVista[];
    soloDudosos: boolean;
    campoActivo: CampoVista | null;
    /** `true` mientras el repositorio procesa cualquier acción. */
    enCurso: boolean;
    /** Mensaje de error para el campo activo en vuelo. */
    errorAccion?: ErrorAccion | null;
    /** Modo de edición activado por el técnico. */
    modoEdicion?: boolean;
    onAlternarEdicion: () => void;
    onCambiarVista: (soloDudosos: boolean) => void;
    acciones: AccionesCampo;
}

const OPCIONES_VISTA = [
    { solo: true, etiqueta: "Solo dudosos", Icono: AlertTriangle },
    { solo: false, etiqueta: "Todos", Icono: Rows3 },
] as const;

type SeccionesAbiertas = Partial<Record<IdSeccion, boolean>>;

export function PanelCampos({
    reporte,
    secciones,
    soloDudosos,
    campoActivo,
    enCurso,
    errorAccion,
    modoEdicion = false,
    onAlternarEdicion,
    onCambiarVista,
    acciones,
}: PanelCamposProps) {
    const sinCampos = secciones.length === 0;
    const raiz = useRef<HTMLElement>(null);

    // Las secciones con pendientes arrancan abiertas y las listas, plegadas. El
    // valor inicial se fija una sola vez por sección: si se recalculara en vivo,
    // una sección se plegaría sola en cuanto se resuelve su último pendiente y la
    // persona perdería de vista lo que acaba de hacer.
    const [abiertas, setAbiertas] = useState<SeccionesAbiertas>(() =>
        Object.fromEntries(
            secciones.map((seccion) => [seccion.seccion.id, !seccion.listo]),
        ),
    );
    // Secciones que aparecen después (al cambiar el filtro) también arrancan según su estado.
    const nuevas = secciones.filter(
        (seccion) => abiertas[seccion.seccion.id] === undefined,
    );
    if (nuevas.length > 0) {
        setAbiertas((previas) => ({
            ...previas,
            ...Object.fromEntries(
                nuevas.map((seccion) => [seccion.seccion.id, !seccion.listo]),
            ),
        }));
    }

    // Si el teclado lleva el campo activo a una sección plegada, se abre para que se vea.
    const idActivo = campoActivo?.id;
    const [activoPrevio, setActivoPrevio] = useState<string | undefined>(undefined);
    if (activoPrevio !== idActivo) {
        setActivoPrevio(idActivo);
        const dueña = secciones.find((seccion) =>
            camposDeSeccion(seccion).some((campo) => campo.id === idActivo),
        );
        if (dueña && !abiertas[dueña.seccion.id]) {
            setAbiertas((previas) => ({ ...previas, [dueña.seccion.id]: true }));
        }
    }

    // Lleva la tarjeta activa a la vista cuando cambia con el teclado.
    useEffect(() => {
        if (!idActivo) return;
        const tarjeta = raiz.current?.querySelector(`[data-campos~="${idActivo}"]`);
        tarjeta?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [idActivo]);

    return (
        <section
            ref={raiz}
            aria-label="Campos del reporte"
            className="flex min-h-0 flex-col gap-3 lg:h-full"
        >
            <div className="flex shrink-0 flex-col gap-3 rounded-md border border-line bg-raised px-3.5 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="flex items-center gap-2 text-micro uppercase tracking-label text-faint">
                        <ListChecks className="size-4" aria-hidden="true" />
                        Campos del reporte
                    </h2>
                    <Boton
                        variante={modoEdicion ? "primario" : "secundario"}
                        tamano="sm"
                        onClick={onAlternarEdicion}
                        aria-pressed={modoEdicion}
                        aria-label={
                            modoEdicion ? "Desactivar modo edición" : "Activar modo edición"
                        }
                        className="gap-1.5"
                    >
                        {modoEdicion ? (
                            <>
                                <Unlock className="size-3.5" aria-hidden="true" />
                                Edición habilitada
                            </>
                        ) : (
                            <>
                                <Lock className="size-3.5" aria-hidden="true" />
                                Editar
                            </>
                        )}
                    </Boton>
                </div>
                <div
                    role="group"
                    aria-label="Filtrar campos"
                    className="grid grid-cols-2 gap-1 rounded-md border border-line bg-sunken p-1 sm:inline-grid"
                >
                    {OPCIONES_VISTA.map(({ solo, etiqueta, Icono }) => {
                        const activo = soloDudosos === solo;
                        return (
                            <button
                                key={solo ? "dudosos" : "todos"}
                                type="button"
                                aria-pressed={activo}
                                title={solo ? "Solo los campos dudosos" : "Todos los campos"}
                                onClick={() => onCambiarVista(solo)}
                                className={[
                                    "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-meta transition-all duration-150 ease-[var(--ease-salida)]",
                                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600",
                                    activo
                                        ? "bg-raised font-semibold text-petrol-700 shadow-xs ring-1 ring-petrol-200"
                                        : "font-medium text-muted hover:bg-raised/60 hover:text-ink",
                                ].join(" ")}
                            >
                                <Icono className="size-3.5" aria-hidden="true" />
                                {etiqueta}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="scroll-fino flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto lg:overscroll-contain lg:pr-1.5">
                {sinCampos ? (
                    <div className="animar-aparecer rounded-md border border-dashed border-line-strong bg-raised px-4 py-8 text-center">
                        <p className="text-body text-muted">
                            {soloDudosos
                                ? "No quedan campos dudosos pendientes en este reporte."
                                : "Este reporte no tiene campos para revisar."}
                        </p>
                        {soloDudosos ? (
                            <Boton
                                variante="secundario"
                                tamano="sm"
                                onClick={() => onCambiarVista(false)}
                                className="mt-3"
                            >
                                Ver todos los campos
                            </Boton>
                        ) : null}
                    </div>
                ) : (
                    secciones.map((seccion) => (
                        <SeccionPlegable
                            key={seccion.seccion.id}
                            seccion={seccion}
                            abierta={abiertas[seccion.seccion.id] ?? !seccion.listo}
                            enCurso={enCurso}
                            modoEdicion={modoEdicion}
                            onAlternar={() =>
                                setAbiertas((previas) => ({
                                    ...previas,
                                    [seccion.seccion.id]: !(
                                        previas[seccion.seccion.id] ?? !seccion.listo
                                    ),
                                }))
                            }
                            onConfirmarSeccion={() =>
                                void acciones.aplicarLote(planConfirmarSeccion(seccion))
                            }
                        >
                            <ResumenAutomaticos
                                reporte={reporte}
                                elementos={seccion.automaticos}
                                campoActivoId={campoActivo?.id ?? null}
                                enCurso={enCurso}
                                modoEdicion={modoEdicion}
                                errorAccion={errorAccion}
                                acciones={acciones}
                            />
                            <ListaElementos
                                reporte={reporte}
                                elementos={seccion.elementos}
                                campoActivoId={campoActivo?.id ?? null}
                                enCurso={enCurso}
                                modoEdicion={modoEdicion}
                                errorAccion={errorAccion}
                                acciones={acciones}
                            />
                        </SeccionPlegable>
                    ))
                )}
            </div>

            <AyudaTeclado className="shrink-0" />
        </section>
    );
}
