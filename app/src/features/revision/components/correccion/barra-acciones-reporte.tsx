/**
 * Responsabilidad: barra superior del reporte (identificación, descarga y visor
 * del escaneo original). El modo edición vive en la cabecera del panel de campos.
 * Existe porque cada revisión se guarda en el servidor al instante: la barra ya
 * no ofrece "Guardar" ni "Revertir" (antes existían porque los datos vivían en
 * memoria) y avisa que el guardado es automático.
 */

"use client";

import { Check, Eye, FileText, Map } from "lucide-react";
import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import { MenuDescarga, type FormatoDescarga } from "./menu-descarga";

interface BarraAccionesReporteProps {
  numeroReporte: string;
  cliente: string;
  onDescargar?: (formato: FormatoDescarga) => Promise<void> | void;
  onDescargarPDF?: () => void;
  onVerImagenReal: () => void;
}

export function BarraAccionesReporte({
  numeroReporte,
  cliente,
  onDescargar,
  onDescargarPDF,
  onVerImagenReal,
}: BarraAccionesReporteProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-3 shadow-lift sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-petrol-50 text-petrol-700"
          aria-hidden="true"
        >
          <FileText className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-ink">
            Reporte N° <span className="font-mono">{numeroReporte}</span>
            {cliente ? <span className="font-normal text-muted"> · {cliente}</span> : null}
          </h1>
          <p className="flex items-center gap-1.5 text-micro text-faint">
            <Check className="size-3 text-green-600" aria-hidden="true" />
            Los cambios se guardan automáticamente
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={onVerImagenReal}
          aria-label="Ver archivo escaneado original"
          className="gap-1.5"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          Ver original
        </Boton>

        <Boton
          variante="secundario"
          tamano="sm"
          aria-label="Ver archivo escaneado original"
          className="gap-1.5"
        >
          <Map className="size-3.5" aria-hidden="true" />
          <Link href={`/dev/regiones?reporte=${numeroReporte}`}>
            Ver Regiones
          </Link>
        </Boton>        

        <MenuDescarga
          onDescargar={(formato) => {
            if (onDescargar) return onDescargar(formato);
            if (onDescargarPDF) onDescargarPDF();
          }}
        />
      </div>
    </div>
  );
}
