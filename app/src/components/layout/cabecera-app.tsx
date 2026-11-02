/**
 * Responsabilidad: cabecera global de la aplicación.
 * Existe para que en cualquier pantalla se vea de dónde viene el trabajo
 * (SIREP, bandeja) y quién firma las revisiones, que es lo que hace creíble
 * la auditoría de cada campo.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Map } from "lucide-react";

import { USUARIO_ACTUAL } from "@/config/sesion";

function Marca() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 items-center justify-center rounded-xs bg-petrol-600 font-mono text-[0.7rem] font-semibold text-paper"
    >
      SR
    </span>
  );
}

export function CabeceraApp() {
  const ruta = usePathname();
  const enBandeja = ruta === "/" || ruta.startsWith("/reportes");
  const enCalibracion = ruta.startsWith("/dev/regiones");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-raised/95 backdrop-blur-sm">
      <div className="mx-auto flex h-(--header-h) max-w-(--layout-max) items-center gap-4 px-(--space-gutter)">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xs text-ink"
          aria-label="SIREP, ir a la bandeja de revisión"
        >
          <Marca />
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">
              SIREP
            </span>
            <span className="text-micro uppercase tracking-label text-faint">
              Bandeja de revisión
            </span>
          </span>
        </Link>

        <nav
          aria-label="Secciones principales"
          className="ml-auto flex items-center gap-1"
        >
          <Link
            href="/"
            aria-current={enBandeja ? "page" : undefined}
            className={[
              "flex h-9 items-center gap-2 rounded-sm px-3 text-meta font-medium",
              "transition-colors duration-150 ease-[var(--ease-salida)]",
              enBandeja
                ? "bg-petrol-50 text-petrol-700"
                : "text-muted hover:bg-sunken hover:text-ink",
            ].join(" ")}
          >
            <Inbox className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Bandeja</span>
          </Link>
          <Link
            href="/dev/regiones"
            aria-current={enCalibracion ? "page" : undefined}
            className={[
              "flex h-9 items-center gap-2 rounded-sm px-3 text-meta font-medium",
              "transition-colors duration-150 ease-[var(--ease-salida)]",
              enCalibracion
                ? "bg-petrol-50 text-petrol-700"
                : "text-muted hover:bg-sunken hover:text-ink",
            ].join(" ")}
          >
            <Map className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Regiones</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2 border-l border-line pl-3">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-sunken font-mono text-micro font-semibold text-muted"
          >
            {USUARIO_ACTUAL.iniciales}
          </span>
          <span className="hidden flex-col leading-none md:flex">
            <span className="text-meta font-medium text-ink">
              {USUARIO_ACTUAL.nombre}
            </span>
            <span className="text-micro uppercase tracking-label text-faint">
              {USUARIO_ACTUAL.rol}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
