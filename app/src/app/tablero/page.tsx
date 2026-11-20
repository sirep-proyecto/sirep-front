/**
 * Responsabilidad: ruta /tablero para el Tablero del Administrador (SIREP-S4-T07).
 */

import type { Metadata } from "next";

import { VistaTablero } from "@/features/tablero/vista-tablero";

export const metadata: Metadata = { title: "Tablero del administrador" };

export default function PaginaTablero() {
  return (
    <div className="mx-auto w-full max-w-(--layout-max) px-(--space-gutter) pb-16">
      <header className="pt-10 pb-7">
        <p className="mb-2 inline-flex items-center gap-2 text-micro font-medium uppercase tracking-label text-petrol-700">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-petrol-600" />
          Coordinación y avance
        </p>
        <h1 className="text-display font-semibold tracking-tight text-ink">
          Tablero del administrador
        </h1>
        <p className="mt-2 text-base text-muted">
          Avance por revisor e ingestor, sesiones activas (pausas mayores a 20 minutos), fecha estimada de término y control de calidad.
        </p>
      </header>
      <VistaTablero />
    </div>
  );
}
