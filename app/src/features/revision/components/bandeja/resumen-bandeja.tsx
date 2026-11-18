/**
 * Responsabilidad: mostrar las tres cifras del archivo —reportes pendientes,
 * campos dudosos y completados hoy— con una línea que explica cada una.
 * Existe porque la primera mirada del técnico responde "¿cuánto trabajo hay?"
 * antes de tocar un filtro. Cada cifra lleva su color de estado (ámbar =
 * pendiente, rojo = dudoso, verde = completo) además del texto, nunca color solo.
 */

import { AlertTriangle, CheckCircle2, Clock, type LucideIcon } from "lucide-react";

import type {
  ResumenBandeja as ResumenBandejaDatos,
} from "@/features/revision/types/dominio";

interface ResumenBandejaProps {
  resumen: ResumenBandejaDatos;
}

type Tono = "amber" | "brick" | "green";

const TONOS: Record<Tono, { barra: string; icono: string }> = {
  amber: { barra: "bg-amber-600", icono: "bg-amber-50 text-amber-700" },
  brick: { barra: "bg-brick-600", icono: "bg-brick-50 text-brick-700" },
  green: { barra: "bg-green-600", icono: "bg-green-50 text-green-700" },
};

interface CifraProps {
  etiqueta: string;
  valor: number;
  tono: Tono;
  Icono: LucideIcon;
  /** Línea corta bajo la cifra que explica de qué está hecha. */
  detalle?: string;
}

function Cifra({ etiqueta, valor, tono, Icono, detalle }: CifraProps) {
  const clases = TONOS[tono];

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-raised p-4 shadow-lift">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 ${clases.barra}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <dt className="text-micro uppercase tracking-label text-faint">
            {etiqueta}
          </dt>
          <dd className="mt-1.5 font-mono text-display font-semibold tabular-nums text-ink">
            {valor}
          </dd>
          {detalle ? (
            <p className="mt-1 max-w-[16rem] truncate text-meta text-muted" title={detalle}>
              {detalle}
            </p>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className={`flex size-9 items-center justify-center rounded-md ${clases.icono}`}
        >
          <Icono className="size-[1.1rem]" />
        </span>
      </div>
    </div>
  );
}

const plural = (n: number, singular: string, pluralTexto: string) =>
  `${n} ${n === 1 ? singular : pluralTexto}`;

function detalleCompletados(revisores: readonly string[]): string {
  if (revisores.length === 0) return "Nadie ha revisado hoy";
  return `Revisaron hoy: ${revisores.join(", ")}`;
}

export function ResumenBandeja({ resumen }: ResumenBandejaProps) {
  return (
    <section aria-labelledby="titulo-resumen" className="pb-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3">
        <h2
          id="titulo-resumen"
          className="text-micro font-medium uppercase tracking-label text-faint"
        >
          Resumen del archivo
        </h2>
        <p className="text-meta text-muted">
          Total:{" "}
          <span className="font-mono text-ink">{resumen.total}</span>
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Cifra
          etiqueta="Reportes pendientes"
          valor={resumen.reportes_pendientes}
          detalle={`de ${plural(resumen.total, "reporte", "reportes")} en el archivo`}
          tono="amber"
          Icono={Clock}
        />
        <Cifra
          etiqueta="Campos dudosos"
          valor={resumen.campos_dudosos}
          detalle={
            resumen.campos_dudosos === 0
              ? "Nada por revisar"
              : `en ${plural(resumen.reportes_con_dudosos, "reporte", "reportes")}`
          }
          tono="brick"
          Icono={AlertTriangle}
        />
        <Cifra
          etiqueta="Completados hoy"
          valor={resumen.completados}
          detalle={detalleCompletados(resumen.revisores_hoy)}
          tono="green"
          Icono={CheckCircle2}
        />
      </dl>
    </section>
  );
}
