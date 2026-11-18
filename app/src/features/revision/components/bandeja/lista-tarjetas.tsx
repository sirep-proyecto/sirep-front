/**
 * Responsabilidad: la misma información de la tabla en tarjetas apiladas para
 * móvil y tablet (una columna a 360 px, dos a 768 px).
 * Existe porque la tabla de ocho columnas no cabe en una pantalla chica: acá
 * cada tarjeta es un solo enlace con nombre accesible explícito, para que el
 * gesto de abrir el reporte siga siendo de un toque y no de precisiones.
 */

import Link from "next/link";

import { BotonEnviarRptech } from "@/features/revision/components/bandeja/boton-enviar-rptech";
import { CeldaDudosos } from "@/features/revision/components/bandeja/celda-dudosos";
import { CeldaRevisores } from "@/features/revision/components/bandeja/celda-revisores";
import { EtiquetaEstado } from "@/features/revision/components/comunes/etiqueta-estado";
import { EtiquetaOrigen } from "@/features/revision/components/comunes/etiqueta-origen";
import { EtiquetaRptech } from "@/features/revision/components/comunes/etiqueta-rptech";
import {
    formatearFecha,
    formatearNumeroReporte,
} from "@/features/revision/lib/formato";
import type { Reporte } from "@/features/revision/types/dominio";

interface ListaTarjetasProps {
    reportes: readonly Reporte[];
    enviando?: ReadonlySet<string>;
    onEnviar?: (numero: string) => void;
}

export function ListaTarjetas({ reportes, enviando = new Set(), onEnviar }: ListaTarjetasProps) {
    return (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {reportes.map((reporte) => (
                <li key={reporte.id} className="min-w-0">
                    {/*
                     * El enlace se extiende sobre la tarjeta con `::after` y el
                     * botón de envío queda por encima (`z-10`): un botón no
                     * puede ir dentro de un enlace.
                     */}
                    <div
                        className={[
                            "relative flex h-full flex-col gap-3 rounded-md border border-line bg-raised p-4",
                            "transition-colors duration-150 ease-[var(--ease-salida)]",
                            "hover:border-line-strong hover:bg-sunken",
                        ].join(" ")}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <Link
                                    href={`/reportes/${reporte.numero_reporte}`}
                                    aria-label={`Abrir el reporte N° ${reporte.numero_reporte} de ${reporte.cliente}`}
                                    className="rounded-xs font-mono text-meta font-medium text-petrol-700 after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-petrol-600"
                                >
                                    {formatearNumeroReporte(reporte.numero_reporte)}
                                </Link>
                                <p className="mt-1 truncate text-base font-medium text-ink">
                                    {reporte.cliente}
                                </p>
                                <p className="mt-0.5 truncate text-meta text-muted">
                                    {reporte.equipo}
                                </p>
                                <p className="mt-0.5 truncate text-meta text-faint">
                                    {reporte.tecnico}
                                </p>
                                <p className="mt-0.5 truncate text-meta text-muted">
                                    Revisado por:{" "}
                                    <CeldaRevisores campos={reporte.campos} />
                                </p>
                            </div>
                            <CeldaDudosos
                                campos={reporte.campos}
                                etiqueta="Dudosos"
                                className="shrink-0"
                            />
                        </div>

                        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                            <EtiquetaEstado estado={reporte.estado} />
                            <EtiquetaOrigen origen={reporte.origen} />
                            <EtiquetaRptech reporte={reporte} />
                            <span className="ml-auto flex items-center gap-2">
                                <span className="font-mono text-meta text-faint">
                                    {formatearFecha(reporte.fecha_reporte)}
                                </span>
                                {onEnviar ? (
                                    <BotonEnviarRptech
                                        reporte={reporte}
                                        enviando={enviando.has(reporte.numero_reporte)}
                                        onEnviar={onEnviar}
                                    />
                                ) : null}
                            </span>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}