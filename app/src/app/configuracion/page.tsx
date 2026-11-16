/**
 * Responsabilidad: página de Configuración. Hoy tiene el bot de Telegram:
 * a qué backend de SIREP le llegan sus mensajes y cambiarlo.
 */

import type { Metadata } from "next";

import { ConfiguracionBot } from "@/features/configuracion/configuracion-bot";

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
        <p className="mt-2 text-base text-muted">El bot de Telegram: a qué dirección de este backend le llegan los reportes que se mandan por el bot.</p>
      </header>
      <ConfiguracionBot />
    </div>
  );
}
