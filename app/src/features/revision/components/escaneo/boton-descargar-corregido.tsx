/**
 * Responsabilidad: botón que descarga la página visible del escaneo con las
 * correcciones dibujadas (PNG generado en el navegador).
 * Existe aparte para aislar el estado de "generando" y el mensaje de error de
 * la descarga: la imagen puede fallar por un enlace firmado vencido o por CORS y
 * el técnico debe enterarse, no recibir un archivo sin correcciones.
 */

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import type { CapaCorreccion } from "@/features/revision/lib/capas-correccion";
import { descargarEscaneoCorregido } from "@/features/revision/lib/descargar-escaneo-corregido";
import type { MapaRegiones, NumeroPagina } from "@/features/revision/types/regiones";

interface BotonDescargarCorregidoProps {
  urlImagen: string | null;
  capas: readonly CapaCorreccion[];
  mapa: MapaRegiones;
  numeroReporte: string;
  pagina: NumeroPagina;
}

export function BotonDescargarCorregido({
  urlImagen,
  capas,
  mapa,
  numeroReporte,
  pagina,
}: BotonDescargarCorregidoProps) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sinImagen = !urlImagen;
  const sinCapas = capas.length === 0;
  const deshabilitado = generando || sinImagen || sinCapas;

  const descargar = async () => {
    if (!urlImagen) return;
    setGenerando(true);
    setError(null);
    try {
      await descargarEscaneoCorregido(urlImagen, capas, mapa, numeroReporte, pagina);
    } catch (causa) {
      setError(
        causa instanceof Error ? causa.message : "No se pudo generar el escaneo corregido.",
      );
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void descargar()}
        disabled={deshabilitado}
        title={
          sinImagen
            ? "No hay imagen del escaneo en esta página"
            : sinCapas
              ? "Esta página no tiene correcciones que dibujar"
              : "Descargar esta página con las correcciones dibujadas (PNG)"
        }
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line-strong bg-raised px-2.5 text-micro font-medium text-ink transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generando ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-3.5" aria-hidden="true" />
        )}
        Descargar escaneo corregido
      </button>
      {error ? (
        <p role="alert" className="max-w-xs text-right text-micro text-brick-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
