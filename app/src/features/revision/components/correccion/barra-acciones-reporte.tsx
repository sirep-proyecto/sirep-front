/**
 * Responsabilidad: barra de herramientas superior para el control del reporte
 * (título tipo Google Sheets, modo edición con candado, revertir, guardar,
 * descargar PDF y ver escaneo original).
 * Permite al técnico editar el nombre del reporte, habilitar la edición de
 * campos y exportar el informe final.
 */

"use client";

import { useState, type KeyboardEvent } from "react";
import {
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  Pencil,
  RotateCcw,
  Save,
  Unlock,
} from "lucide-react";

import { Boton } from "@/components/ui/boton";

interface BarraAccionesReporteProps {
  nombreReporte: string;
  onCambioNombre: (nuevoNombre: string) => void;
  modoEdicion: boolean;
  onAlternarEdicion: () => void;
  tieneCambios: boolean;
  guardando: boolean;
  onGuardar: () => Promise<void>;
  onRevertir: () => void;
  onDescargarPDF: () => void;
  onVerImagenReal: () => void;
}

export function BarraAccionesReporte({
  nombreReporte,
  onCambioNombre,
  modoEdicion,
  onAlternarEdicion,
  tieneCambios,
  guardando,
  onGuardar,
  onRevertir,
  onDescargarPDF,
  onVerImagenReal,
}: BarraAccionesReporteProps) {
  const [nombreTemporal, setNombreTemporal] = useState(nombreReporte);

  const confirmarNombre = () => {
    const limpio = nombreTemporal.trim();
    if (limpio && limpio !== nombreReporte) {
      onCambioNombre(limpio);
    } else {
      setNombreTemporal(nombreReporte);
    }
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setNombreTemporal(nombreReporte);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-paper p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      {/* Campo editable de nombre estilo Google Sheets */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-petrol-50 text-petrol-700"
          title="Documento de reporte técnico"
          aria-hidden="true"
        >
          <FileSpreadsheet className="size-4" />
        </span>
        <div className="relative flex-1 min-w-0 group">
          <input
            type="text"
            value={nombreTemporal}
            onChange={(e) => setNombreTemporal(e.target.value)}
            onBlur={confirmarNombre}
            onKeyDown={alPresionarTecla}
            aria-label="Nombre del reporte editable estilo Google Sheets"
            placeholder="Nombre identificador del reporte..."
            className="w-full truncate rounded-xs border border-transparent bg-transparent px-2.5 py-1 text-base font-medium text-ink transition-colors duration-150 ease-out hover:border-line-strong hover:bg-raised focus:border-petrol-600 focus:bg-paper focus:outline-hidden focus:ring-1 focus:ring-petrol-600"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 text-faint">
            <Pencil className="size-3" />
          </span>
        </div>
      </div>

      {/* Botones de acción CRUD */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Botón Ver Imagen Real */}
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={onVerImagenReal}
          aria-label="Ver archivo escaneado original"
          className="gap-1.5"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          Ver Original
        </Boton>

        {/* Botón Editar con alternancia de candado */}
        <Boton
          variante={modoEdicion ? "primario" : "secundario"}
          tamano="sm"
          onClick={onAlternarEdicion}
          aria-pressed={modoEdicion}
          aria-label={modoEdicion ? "Desactivar modo edición" : "Activar modo edición"}
          className={["gap-1.5", modoEdicion ? "bg-amber-700 hover:bg-amber-800 border-amber-800 text-paper" : ""].join(" ")}
        >
          {modoEdicion ? (
            <>
              <Unlock className="size-3.5" aria-hidden="true" />
              Edición Habilitada
            </>
          ) : (
            <>
              <Lock className="size-3.5" aria-hidden="true" />
              Editar
            </>
          )}
        </Boton>

        {/* Botón Revertir Todos los Cambios */}
        <Boton
          variante="fantasma"
          tamano="sm"
          onClick={onRevertir}
          disabled={!tieneCambios || guardando}
          title={tieneCambios ? "Revertir cambios al estado guardado" : "Sin cambios para revertir"}
          aria-label="Revertir todos los cambios"
          className={["gap-1.5", !tieneCambios ? "cursor-not-allowed opacity-50" : ""].join(" ")}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Revertir
        </Boton>

        {/* Botón Guardar (habilitado SOLO si tieneCambios) */}
        <Boton
          variante="exito"
          tamano="sm"
          onClick={() => void onGuardar()}
          disabled={!tieneCambios || guardando}
          title={tieneCambios ? "Guardar cambios realizados" : "No hay cambios pendientes de guardar"}
          aria-label="Guardar cambios del reporte"
          className={["gap-1.5", !tieneCambios ? "cursor-not-allowed opacity-50" : ""].join(" ")}
        >
          <Save className="size-3.5" aria-hidden="true" />
          {guardando ? "Guardando..." : "Guardar"}
        </Boton>

        {/* Botón Descargar PDF */}
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={onDescargarPDF}
          aria-label="Descargar reporte como PDF"
          className="gap-1.5"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Descargar PDF
        </Boton>
      </div>
    </div>
  );
}
