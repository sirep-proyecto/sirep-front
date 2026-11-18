/**
 * Responsabilidad: mostrar quién revisó un reporte, con el nombre de la cuenta que
 * confirmó o corrigió sus campos. Si intervinieron varias personas, muestra a la
 * más reciente y el resto en el texto de ayuda.
 */

import { etiquetaRevisores, revisoresDeReporte } from "@/features/revision/lib/revisores";
import type { CampoReporte } from "@/features/revision/types/dominio";

interface CeldaRevisoresProps {
  campos: readonly CampoReporte[];
  className?: string;
}

export function CeldaRevisores({ campos, className = "" }: CeldaRevisoresProps) {
  const nombres = revisoresDeReporte(campos);
  const etiqueta = etiquetaRevisores(nombres);

  if (!etiqueta) {
    return (
      <span className={`text-meta text-faint ${className}`} title="Nadie ha revisado este reporte todavía">
        —
      </span>
    );
  }

  return (
    <span
      className={`text-meta text-ink ${className}`}
      title={nombres.length > 1 ? `Revisaron: ${nombres.join(", ")}` : `Revisó: ${nombres[0]}`}
    >
      {etiqueta}
    </span>
  );
}
