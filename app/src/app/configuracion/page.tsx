/**
 * Responsabilidad: página de Configuración. Tiene el bot de Telegram (a qué
 * backend le llegan sus mensajes) y, para administradores, las cuentas de
 * usuario y lo que puede hacer cada una.
 */

import type { Metadata } from "next";

import { ConfiguracionPestanas } from "@/features/configuracion/configuracion-pestanas";

export const metadata: Metadata = { title: "Configuración" };

export default function PaginaConfiguracion() {
  return (
    <div className="mx-auto w-full max-w-3xl px-(--space-gutter) pb-16">
      <header className="pt-10 pb-7">
        <p className="mb-2 inline-flex items-center gap-2 text-micro font-medium uppercase tracking-label text-petrol-700">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-petrol-600" />
          Sistema
        </p>
        <h1 className="text-display font-semibold tracking-tight text-ink">Configuración</h1>
        <p className="mt-2 text-base text-muted">
          El bot de Telegram y, para el administrador, las cuentas de usuario, la lectura con IA y la actividad.
        </p>
      </header>
      <ConfiguracionPestanas />
    </div>
  );
}
