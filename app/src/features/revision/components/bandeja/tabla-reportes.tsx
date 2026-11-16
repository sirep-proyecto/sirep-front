/**
 * Responsabilidad: tabla densa de escritorio con un reporte por fila y la
 * fila entera como enlace accesible al detalle.
 * Incluye paginación de 10 elementos por página con navegación numérica y elipsis.
 * Existe porque en pantalla grande el técnico compara reportes uno debajo del
 * otro: separadores de 1 px, cabecera tenue sobre una tarjeta con borde; el
 * enlace extendido hace que cualquier punto de la fila abra el reporte sin
 * apuntar a un texto chico.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CeldaDudosos } from "@/features/revision/components/bandeja/celda-dudosos";
import { EtiquetaEstado } from "@/features/revision/components/comunes/etiqueta-estado";
import { EtiquetaOrigen } from "@/features/revision/components/comunes/etiqueta-origen";
import { EtiquetaRptech } from "@/features/revision/components/comunes/etiqueta-rptech";
import {
  formatearFecha,
  formatearNumeroReporte,
} from "@/features/revision/lib/formato";
import type { Reporte } from "@/features/revision/types/dominio";

const ELEMENTOS_POR_PAGINA = 10;

interface TablaReportesProps {
  reportes: readonly Reporte[];
  ruta: string;
}

interface FilaReporteProps {
  reporte: Reporte;
  ruta: string;
}

const CLASE_CELDA = "border-b border-line px-4 py-2.5";

const CLASE_CABECERA =
  "border-b border-line px-4 py-3 text-left text-micro font-medium uppercase tracking-label text-muted";

function FilaReporte({ reporte, ruta }: FilaReporteProps) {
  const {
    numero_reporte,
    cliente,
    equipo,
    tecnico,
    estado,
    origen,
    campos,
    fecha_reporte,
  } = reporte;

  return (
    <tr className="relative transition-colors duration-150 ease-[var(--ease-salida)] hover:bg-petrol-50/60">
      <td className={CLASE_CELDA}>
        {/*
         * El `::after` extendido usa la fila como bloque contenedor (por eso
         * la fila es `relative`): cubre las ocho columnas, así el clic en
         * cualquier punto navega y el foco visible se dibuja sobre la fila
         * completa. El nombre accesible agrega el cliente porque el texto
         * visible solo dice el N°.
         */}
        <Link
          href={`${ruta}${numero_reporte}`}
          aria-label={`Abrir el reporte N° ${numero_reporte} de ${cliente}`}
          className={[
            "rounded-xs font-mono text-meta font-medium text-petrol-700",
            "after:absolute after:inset-0 after:rounded-xs after:content-['']",
            "focus-visible:outline-2",
            "focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-petrol-600",
          ].join(" ")}
        >
          {formatearNumeroReporte(numero_reporte)}
        </Link>
      </td>
      <td className={`${CLASE_CELDA} text-body text-ink`}>{cliente}</td>
      <td className={`${CLASE_CELDA} text-meta text-muted`}>{equipo}</td>
      <td className={`${CLASE_CELDA} text-meta text-muted`}>{tecnico}</td>
      <td className={CLASE_CELDA}>
        <EtiquetaEstado estado={estado} />
      </td>
      <td className={CLASE_CELDA}>
        <div className="flex flex-wrap items-center gap-1.5">
          <EtiquetaOrigen origen={origen} />
          <EtiquetaRptech reporte={reporte} />
        </div>
      </td>
      <td className={CLASE_CELDA}>
        <CeldaDudosos campos={campos} />
      </td>
      <td className={`${CLASE_CELDA} font-mono text-meta text-faint`}>
        {formatearFecha(fecha_reporte)}
      </td>
    </tr>
  );
}

function generarNumerosPagina(actual: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (actual <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (actual >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", actual - 1, actual, actual + 1, "...", total];
}

export function TablaReportes({ reportes, ruta }: TablaReportesProps) {
  const [paginaActual, setPaginaActual] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(reportes.length / ELEMENTOS_POR_PAGINA));
  // Reseteo / clamping seguro si los filtros reducen la cantidad de páginas
  const paginaSegura = Math.min(Math.max(1, paginaActual), totalPaginas);

  const reportesPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA;
    return reportes.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);
  }, [reportes, paginaSegura]);

  const indiceInicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA + 1;
  const indiceFin = Math.min(paginaSegura * ELEMENTOS_POR_PAGINA, reportes.length);
  const numerosPagina = generarNumerosPagina(paginaSegura, totalPaginas);

  return (
    <div className="hidden overflow-hidden rounded-lg border border-line bg-raised shadow-lift lg:block">
      <div className="overflow-x-auto scroll-fino">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Reportes de la bandeja: número, cliente, equipo, técnico, estado,
            origen, dudosos pendientes y fecha del reporte.
          </caption>
          <thead>
            <tr className="bg-sunken/70">
              <th scope="col" className={CLASE_CABECERA}>
                N° de reporte
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Cliente
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Equipo
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Técnico
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Estado
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Origen
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Dudosos pendientes
              </th>
              <th scope="col" className={CLASE_CABECERA}>
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {reportesPaginados.map((reporte) => (
              <FilaReporte key={reporte.id} reporte={reporte} ruta={ruta} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line bg-raised px-4 py-3 sm:flex-row">
          <p className="text-meta text-muted">
            Mostrando <span className="font-medium text-ink">{indiceInicio}</span> a{" "}
            <span className="font-medium text-ink">{indiceFin}</span> de{" "}
            <span className="font-medium text-ink">{reportes.length}</span> reportes
          </p>

          <nav aria-label="Paginación de reportes" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaSegura === 1}
              className="cursor-pointer inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-meta font-medium text-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span>Atrás</span>
            </button>

            <div className="flex items-center gap-1">
              {numerosPagina.map((item, index) => {
                if (item === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex size-8 items-center justify-center text-meta text-faint"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  );
                }

                const esActiva = item === paginaSegura;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPaginaActual(item)}
                    aria-current={esActiva ? "page" : undefined}
                    className={[
                      "cursor-pointer flex size-8 items-center justify-center rounded-md text-meta font-medium transition-colors",
                      esActiva
                        ? "bg-petrol-600 text-[#181513] shadow-xs font-semibold"
                        : "text-muted hover:bg-sunken hover:text-ink",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura === totalPaginas}
              className="cursor-pointer inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-meta font-medium text-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página siguiente"
            >
              <span>Siguiente</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
