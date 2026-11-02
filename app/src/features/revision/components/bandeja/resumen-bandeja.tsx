/**
 * Responsabilidad: mostrar las tres cifras del archivo —reportes pendientes,
 * campos dudosos y completados hoy— sobre papel, separadas por líneas de 1 px.
 * Existe porque la primera mirada del técnico responde "¿cuánto trabajo hay?"
 * antes de tocar un filtro; una tarjeta por cifra convertiría la bandeja en un
 * dashboard, que es justo lo que la dirección de diseño descarta.
 */

import type {
  ResumenBandeja as ResumenBandejaDatos,
} from "@/features/revision/types/dominio";

interface ResumenBandejaProps {
  resumen: ResumenBandejaDatos;
}

interface CifraProps {
  etiqueta: string;
  valor: number;
}

function Cifra({ etiqueta, valor }: CifraProps) {
  return (
    <div className="px-4 py-4 first:pl-0">
      <dt className="text-micro uppercase tracking-label text-faint">
        {etiqueta}
      </dt>
      <dd className="mt-1 font-mono text-display font-medium tabular-nums text-ink">
        {valor}
      </dd>
    </div>
  );
}

export function ResumenBandeja({ resumen }: ResumenBandejaProps) {
  return (
    <section aria-labelledby="titulo-resumen" className="border-b border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-6 pb-3">
        <h2
          id="titulo-resumen"
          className="text-micro uppercase tracking-label text-faint"
        >
          Resumen del archivo
        </h2>
        <p className="text-meta text-muted">
          Total:{" "}
          <span className="font-mono text-ink">{resumen.total}</span>
        </p>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
        <Cifra
          etiqueta="Reportes pendientes"
          valor={resumen.reportes_pendientes}
        />
        <Cifra etiqueta="Campos dudosos" valor={resumen.campos_dudosos} />
        <Cifra etiqueta="Completados hoy" valor={resumen.completados} />
      </dl>
    </section>
  );
}
