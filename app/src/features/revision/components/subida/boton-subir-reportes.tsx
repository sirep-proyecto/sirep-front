/**
 * Responsabilidad: botón "Subir reportes" de la cabecera de la bandeja, con el
 * avance de la cola ("Subiendo 2/5") cuando hay archivos en curso.
 * Existe para que, con el panel cerrado, la persona siga viendo que la subida
 * avanza sin tener que reabrirlo.
 */

"use client";

import { Loader2, Upload } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { useSubida } from "@/features/revision/providers/subida-contexto";

export function BotonSubirReportes() {
  const { abrirPanel, avance } = useSubida();

  return (
    <Boton variante="primario" tamano="lg" onClick={abrirPanel} aria-haspopup="dialog">
      {avance ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Upload className="size-4" aria-hidden="true" />
      )}
      Subir reportes
      {avance ? (
        <span
          role="status"
          aria-live="polite"
          className="rounded-full bg-black/15 px-2 py-0.5 text-meta font-semibold"
        >
          Subiendo {avance.actual}/{avance.total}
        </span>
      ) : null}
    </Boton>
  );
}
