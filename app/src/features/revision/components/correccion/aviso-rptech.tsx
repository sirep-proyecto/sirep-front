/**
 * Responsabilidad: explicar por qué RP-TECH rechazó un reporte histórico y qué
 * hacer, campo por campo, encima de la revisión.
 * Al corregir un campo y dejar el reporte sin pendientes, el backend lo vuelve
 * a enviar solo; si RP-TECH lo guarda, el aviso desaparece.
 */

import { CloudCheck, CloudOff, RefreshCw, ShieldCheck } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { CAMPOS_POR_ID } from "@/config/campos-formulario";
import { estadoRptech, motivosRechazo } from "@/features/revision/lib/rptech";
import type { ReporteVista } from "@/features/revision/types/dominio";
import type { IdCampo } from "@/features/revision/types/campos";

interface AvisoRptechProps {
  reporte: ReporteVista;
  reintentando?: boolean;
  onReintentar?: () => void;
}

export function AvisoRptech({ reporte, reintentando = false, onReintentar }: AvisoRptechProps) {
  const estado = estadoRptech(reporte);

  const avisoDoble = reporte.doble_revision_pendiente ? (
    <p className="flex items-center gap-2 rounded-lg border border-petrol-200 bg-petrol-50 px-4 py-2.5 text-meta text-petrol-800">
      <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
      Doble revisión a ciegas (5%): revisa los campos pendientes de forma independiente para validar la calidad.
    </p>
  ) : null;

  if (estado === "guardado") {
    return (
      <>
        {avisoDoble}
        <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-meta text-green-700">
          <CloudCheck className="size-4 shrink-0" aria-hidden="true" />
          Este reporte ya está guardado en RP-TECH. Allá entra cerrado, por eso aquí ya no se puede reabrir.
        </p>
      </>
    );
  }

  if (estado !== "rechazado" && estado !== "reintentar") {
    return avisoDoble;
  }

  const motivos = motivosRechazo(
    reporte.rptech_error,
    (id) => CAMPOS_POR_ID[id as IdCampo]?.etiqueta,
  );
  const esReintentar = estado === "reintentar";

  return (
    <div className="flex flex-col gap-3">
      {avisoDoble}
      <section
        role="alert"
        className={
          esReintentar
            ? "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
            : "rounded-lg border border-brick-200 bg-brick-50 px-4 py-3 text-brick-700"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-medium">
            <CloudOff className="size-4 shrink-0" aria-hidden="true" />
            {esReintentar
              ? "El envío automático a RP-TECH falló (pendiente de reintento)"
              : "RP-TECH no aceptó este reporte"}
          </p>
          {onReintentar ? (
            <Boton
              variante="secundario"
              tamano="sm"
              disabled={reintentando}
              onClick={onReintentar}
            >
              <RefreshCw className={`size-3.5 ${reintentando ? "animate-spin" : ""}`} aria-hidden="true" />
              {reintentando ? "Reintentando…" : "Reintentar envío a RP-TECH"}
            </Boton>
          ) : null}
        </div>
        {motivos.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-6 text-meta">
            {motivos.map((m, i) => (
              <li key={i}>
                {m.campo ? <span className="font-medium">{m.campo}: </span> : null}
                {m.texto}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-2 text-meta">
          {esReintentar
            ? "Puedes reintentar ahora el envío a RP-TECH."
            : "Corrige el campo en la revisión: al quedar sin pendientes se volverá a enviar automáticamente."}
        </p>
      </section>
    </div>
  );
}
