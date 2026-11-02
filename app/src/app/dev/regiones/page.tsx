/**
 * Responsibilidad: página de calibración del mapa de regiones.
 * Existe para verificar, sobre el escaneo falso, que cada campo del inventario
 * tenga su región dibujada donde de verdad está: es la herramienta que hace
 * confiable el recorte antes de que haya escaneos reales.
 */

import { notFound } from "next/navigation";

import { MAPA_POR_DEFECTO, obtenerMapa } from "@/config/regiones";
import { MOSTRAR_CALIBRACION } from "@/config/entorno";
import { MapaCalibracion } from "@/features/revision/components/calibracion/mapa-calibracion";
import { ListaCobertura } from "@/features/revision/components/calibracion/lista-cobertura";

export const metadata = {
  title: "Calibración de regiones",
  robots: { index: false, follow: false },
};

export default function PaginaCalibracion() {
  if (!MOSTRAR_CALIBRACION) notFound();

  const mapa = obtenerMapa(MAPA_POR_DEFECTO);

  return (
    <div className="mx-auto w-full max-w-(--layout-max) px-(--space-gutter) py-8">
      <header className="mb-6 max-w-3xl">
        <p className="text-micro uppercase tracking-label text-faint">
          Solo desarrollo
        </p>
        <h1 className="text-display font-semibold tracking-tight">
          Calibración del talonario
        </h1>
        <p className="mt-2 text-base text-muted">
          {mapa.nombre} · {mapa.paginas} páginas ·{" "}
          {Object.keys(mapa.regiones).length} regiones.{" "}
          {mapa.descripcion}
        </p>
        <p className="mt-1 text-meta text-faint">
          Si una región no coincide con la hoja, el recorte del campo va a
          mostrar otra cosa: ajustá el mapa acá antes de confiar en la vista de
          corrección.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <MapaCalibracion mapa={mapa} />
        <ListaCobertura mapa={mapa} />
      </div>
    </div>
  );
}
