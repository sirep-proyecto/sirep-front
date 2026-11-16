/**
 * Responsabilidad: etiqueta de dónde está el reporte histórico respecto de
 * RP-TECH. No se muestra en reportes del sistema ni mientras se revisan.
 */

import { CloudCheck, CloudOff, CloudUpload, Clock, type LucideIcon } from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import { ETIQUETAS_RPTECH, estadoRptech, type EstadoRptech } from "@/features/revision/lib/rptech";
import type { Reporte } from "@/features/revision/types/dominio";

const ICONOS: Record<EstadoRptech, LucideIcon> = {
  guardado: CloudCheck,
  rechazado: CloudOff,
  reintentar: Clock,
  por_enviar: CloudUpload,
};

export function EtiquetaRptech({
  reporte,
}: {
  reporte: Pick<Reporte, "origen" | "estado" | "estado_reporte" | "rptech_id" | "rptech_error">;
}) {
  const estado = estadoRptech(reporte);
  if (!estado) return null;
  const d = ETIQUETAS_RPTECH[estado];
  const Icono = ICONOS[estado];
  return (
    <Insignia tono={d.tono} title={d.descripcion}>
      <Icono className="size-3.5 shrink-0" aria-hidden="true" />
      {d.etiqueta}
    </Insignia>
  );
}
