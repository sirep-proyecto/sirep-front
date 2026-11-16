/**
 * Responsabilidad: cabecera global de la aplicación.
 * Existe para que en cualquier pantalla se vea de dónde viene el trabajo
 * (SIREP, bandeja), quién firma las revisiones (SIREP-S3-T04) y permitir
 * exportar a Excel (SIREP-S3-T05) o cerrar sesión.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, Inbox, LogOut, Map, Settings } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { MOSTRAR_CALIBRACION } from "@/config/entorno";
import {
  cerrarSesion,
  obtenerUsuarioSesion,
  suscribirSesion,
  USUARIO_ACTUAL,
  type UsuarioActual,
} from "@/config/sesion";
import { descargarExcelReportes } from "@/lib/api";

import { IndicadorEnVivo } from "./indicador-en-vivo";

import Image from "next/image";
import LgoIcon from "../../app/icon.png";

function Marca() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
    >
      <Image
        src={LgoIcon}
        alt="logo empresa"
        className=" object-contain"
        priority
      />
    </span>
  );
}

function clasesEnlace(activo: boolean): string {
  return [
    "relative flex h-9 items-center gap-2 rounded-md px-3 text-meta font-medium cursor-pointer",
    "transition-colors duration-150 ease-[var(--ease-salida)]",
    activo
      ? "border border-petrol-600/35 bg-petrol-50 text-petrol-700 shadow-xs"
      : "border border-transparent text-muted hover:bg-sunken hover:text-ink",
  ].join(" ");
}

export function CabeceraApp() {
  const ruta = usePathname();
  const enBandeja = ruta === "/" || ruta.startsWith("/reportes");
  const enCalibracion = ruta.startsWith("/dev/regiones");
  const enConfiguracion = ruta.startsWith("/configuracion");

  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioActual | null>(
    null,
  );
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    setUsuarioSesion(obtenerUsuarioSesion());
    return suscribirSesion(() => {
      setUsuarioSesion(obtenerUsuarioSesion());
    });
  }, []);

  const usuarioVisible = usuarioSesion ?? USUARIO_ACTUAL;

  if (!usuarioSesion) {
    return null;
  }

  async function manejarExportarExcel() {
    if (exportando) return;
    setExportando(true);
    try {
      await descargarExcelReportes("xlsx");
    } catch {
      // Si falla la descarga o expira la sesión, api.ts gestiona el 401
    } finally {
      setExportando(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-raised/80 backdrop-blur-xl">
      {/* Filo de color: identifica el producto sin ocupar altura */}
      <div
        aria-hidden="true"
        className="h-0.5 bg-linear-to-r from-petrol-600 via-petrol-200 to-transparent"
      />
      <div className="mx-auto flex h-(--header-h) max-w-(--layout-max) items-center gap-4 px-(--space-gutter)">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md text-ink"
          aria-label="SIREP, ir a la bandeja de revisión"
        >
          <Marca />
          {/* En el celular solo queda el logo: el nombre no cabe junto al menú */}
          <span className="flex flex-col leading-none max-sm:hidden">
            <span className="text-base font-semibold tracking-tight">
              SIREP
            </span>
            <span className="mt-1 text-micro uppercase tracking-label text-faint">
              Digitalización de reportes
            </span>
          </span>
        </Link>

        {usuarioSesion ? (
          <>
            <nav
              aria-label="Secciones principales"
              className="ml-auto flex items-center gap-1 max-sm:gap-0"
            >
              <Link
                href="/"
                aria-current={enBandeja ? "page" : undefined}
                className={clasesEnlace(enBandeja)}
              >
                <Inbox className="size-4" aria-hidden="true" />
                <span className="max-sm:sr-only">Bandeja</span>
              </Link>
              {MOSTRAR_CALIBRACION ? (
                <Link
                  href="/dev/regiones"
                  aria-current={enCalibracion ? "page" : undefined}
                  className={clasesEnlace(enCalibracion)}
                >
                  <Map className="size-4" aria-hidden="true" />
                  <span className="max-sm:sr-only">Regiones</span>
                </Link>
              ) : null}
              <Link
                href="/configuracion"
                aria-current={enConfiguracion ? "page" : undefined}
                className={clasesEnlace(enConfiguracion)}
              >
                <Settings className="size-4" aria-hidden="true" />
                <span className="max-sm:sr-only">Configuración</span>
              </Link>
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={manejarExportarExcel}
                disabled={exportando}
                title="Exportar todos los reportes a Excel (.xlsx) con campos vitales primero"
                className="ml-1 h-9 px-3 text-meta"
              >
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                <span className="max-sm:sr-only">
                  {exportando ? "Exportando..." : "Exportar Excel"}
                </span>
              </Boton>
            </nav>

            {/* En el celular no cabe junto al menú: se oculta para que no haya desplazamiento horizontal */}
            <div className="max-md:hidden">
              <IndicadorEnVivo />
            </div>

            <div className="flex items-center gap-2.5 border-l border-line pl-4">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-petrol-50 font-mono text-micro font-semibold text-petrol-700 ring-1 ring-inset ring-petrol-200"
              >
                {usuarioVisible.iniciales}
              </span>
              <span className="hidden flex-col leading-none md:flex">
                <span className="text-meta font-medium text-ink">
                  {usuarioVisible.nombre}
                </span>
                <span className="mt-1 text-micro uppercase tracking-label text-faint">
                  {usuarioVisible.rol}
                </span>
              </span>
              <Boton
                variante="fantasma"
                tamano="sm"
                onClick={() => cerrarSesion()}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="ml-1 h-8 px-2 text-muted hover:text-brick-700"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="max-md:sr-only">Salir</span>
              </Boton>
            </div>
          </>
        ) : (
          <div className="ml-auto text-micro uppercase tracking-label text-faint">
            Sesión requerida
          </div>
        )}
      </div>
    </header>
  );
}
