/**
 * Responsabilidad: listar los campos agrupados por sección, con los dudosos
 * pendientes primero y el filtro "solo dudosos / todos los campos".
 * Existe porque el orden de esta lista es el ahorro de trabajo del producto:
 * si el técnico tiene que leer el formulario entero, el modelo no sirvió de
 * nada, por eso la vista por defecto muestra solo lo dudoso.
 */

"use client";

import { ListChecks } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import type { ErrorAccion } from "@/features/revision/hooks/use-revision-reporte";
import type { GrupoCampos } from "@/features/revision/lib/dudosos";
import { pluralizar } from "@/features/revision/lib/formato";
import type {
  CampoVista,
  ReporteVista,
} from "@/features/revision/types/dominio";

import { TarjetaCampo, type AccionesCampo } from "./tarjeta-campo";

interface PanelCamposProps {
  reporte: ReporteVista;
  grupos: GrupoCampos[];
  soloDudosos: boolean;
  campoActivo: CampoVista | null;
  /** `true` mientras el repositorio procesa cualquier acción. */
  enCurso: boolean;
  /** Mensaje de error para el campo activo en vuelo. */
  errorAccion?: ErrorAccion | null;
  /** Modo de edición activado por el técnico. */
  modoEdicion?: boolean;
  onCambiarVista: (soloDudosos: boolean) => void;
  acciones: AccionesCampo;
}

export function PanelCampos({
  reporte,
  grupos,
  soloDudosos,
  campoActivo,
  enCurso,
  errorAccion,
  modoEdicion = false,
  onCambiarVista,
  acciones,
}: PanelCamposProps) {
  const sinCampos = grupos.length === 0;

  return (
    <section aria-label="Campos del reporte" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-micro uppercase tracking-label text-faint">
          <ListChecks className="size-4" aria-hidden="true" />
          Campos del reporte
        </h2>
        <div
          role="group"
          aria-label="Filtrar campos"
          className="flex rounded-sm border border-line-strong p-0.5"
        >
          {[true, false].map((solo) => {
            const activo = soloDudosos === solo;
            return (
              <button
                key={solo ? "dudosos" : "todos"}
                type="button"
                aria-pressed={activo}
                onClick={() => onCambiarVista(solo)}
                className={[
                  "rounded-xs px-3 py-1 text-meta transition-colors duration-150 ease-[var(--ease-salida)]",
                  activo
                    ? "bg-petrol-600 font-semibold text-paper"
                    : "font-medium text-muted hover:bg-sunken hover:text-ink",
                ].join(" ")}
              >
                {solo ? "Solo dudosos" : "Todos los campos"}
              </button>
            );
          })}
        </div>
      </div>

      {sinCampos ? (
        <div className="rounded-md border border-dashed border-line-strong bg-raised px-4 py-8 text-center">
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
        grupos.map((grupo) => (
          <section
            key={grupo.seccion.id}
            aria-labelledby={`seccion-${grupo.seccion.id}`}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`seccion-${grupo.seccion.id}`}
                className="text-micro uppercase tracking-label text-faint"
              >
                {grupo.seccion.titulo}
              </h3>
              <span className="text-micro text-faint">
                {pluralizar(grupo.campos.length, "campo", "campos")}
              </span>
              {grupo.pendientes > 0 ? (
                <Insignia tono="amber" tamano="micro">
                  {pluralizar(grupo.pendientes, "pendiente", "pendientes")}
                </Insignia>
              ) : null}
            </div>
            <ul className="flex flex-col gap-2">
              {grupo.campos.map((campo) => (
                <li key={campo.id}>
                  <TarjetaCampo
                    reporte={reporte}
                    campo={campo}
                    activo={campo.id === campoActivo?.id}
                    enCurso={enCurso}
                    modoEdicion={modoEdicion}
                    error={
                      errorAccion?.campo === campo.id
                        ? errorAccion.mensaje
                        : null
                    }
                    onSeleccionar={() => acciones.seleccionar(campo.id)}
                    onConfirmar={() => acciones.confirmar(campo.id)}
                    onCorregir={(valor) => acciones.corregir(campo.id, valor)}
                    onIlegible={() => acciones.ilegible(campo.id)}
                    onReabrir={() => acciones.reabrir(campo.id)}
                    onDescartarError={acciones.descartarError}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
