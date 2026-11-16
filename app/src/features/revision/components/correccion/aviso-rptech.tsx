/**
 * Responsabilidad: explicar por qué RP-TECH rechazó un reporte histórico y qué
 * hacer, campo por campo, encima de la revisión.
 * Al corregir un campo y dejar el reporte sin pendientes, el backend lo vuelve
 * a enviar solo; si RP-TECH lo guarda, el aviso desaparece.
 */

import { CloudCheck, CloudOff } from "lucide-react";

import { CAMPOS_POR_ID } from "@/config/campos-formulario";
import { estadoRptech, motivosRechazo } from "@/features/revision/lib/rptech";
import type { ReporteVista } from "@/features/revision/types/dominio";
import type { IdCampo } from "@/features/revision/types/campos";

export function AvisoRptech({ reporte }: { reporte: ReporteVista }) {
  const estado = estadoRptech(reporte);

  if (estado === "guardado") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-meta text-green-700">
        <CloudCheck className="size-4 shrink-0" aria-hidden="true" />
        Este reporte ya está guardado en RP-TECH. Allá entra cerrado, por eso aquí ya no se puede reabrir.
      </p>
    );
  }
  if (estado !== "rechazado") return null;

  const motivos = motivosRechazo(
    reporte.rptech_error,
    (id) => CAMPOS_POR_ID[id as IdCampo]?.etiqueta,
  );

  return (
    <section
      role="alert"
      className="rounded-lg border border-brick-200 bg-brick-50 px-4 py-3 text-brick-700"
    >
      <p className="flex items-center gap-2 font-medium">
        <CloudOff className="size-4 shrink-0" aria-hidden="true" />
        RP-TECH no aceptó este reporte
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-meta">
        {motivos.map((m, i) => (
          <li key={i}>
            {m.campo ? <span className="font-medium">{m.campo}: </span> : null}
            {m.texto}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-meta">
        Corrige el campo en la revisión: al quedar sin pendientes se vuelve a enviar solo.
      </p>
    </section>
  );
}
