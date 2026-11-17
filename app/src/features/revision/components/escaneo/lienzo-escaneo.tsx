/**
 * Responsabilidad: componer la(s) hoja(s) del visor según el modo elegido y
 * aplicarles el zoom.
 * Existe para que `vista-correccion` solo pase datos: aquí se decide si se ve la
 * hoja original, la corregida (con capas) o las dos en paralelo con el mismo
 * zoom, así las dos hojas siempre se ven a la misma escala.
 */

import { HojaEscaneada, type ResaltadoRegion } from "@/features/revision/components/escaneo/hoja-escaneada";
import {
  capasDePagina,
  type CapaCorreccion,
} from "@/features/revision/lib/capas-correccion";
import type { ModoVisor } from "@/features/revision/lib/preferencia-visor";
import type { ReporteVista } from "@/features/revision/types/dominio";
import type { NumeroPagina } from "@/features/revision/types/regiones";

interface LienzoEscaneoProps {
  reporte: ReporteVista;
  pagina: NumeroPagina;
  modo: ModoVisor;
  zoom: number;
  /** Todas las capas del reporte; aquí se filtra la página visible. */
  capas: readonly CapaCorreccion[];
  resaltado: ResaltadoRegion | null;
  capaResaltada: string | null;
  onResaltarCapa: (id: string | null) => void;
}

export function LienzoEscaneo({
  reporte,
  pagina,
  modo,
  zoom,
  capas,
  resaltado,
  capaResaltada,
  onResaltarCapa,
}: LienzoEscaneoProps) {
  const capasPagina = capasDePagina(capas, pagina);
  const ladoALado = modo === "lado_a_lado";

  const original = (
    <HojaEscaneada
      mapa={reporte.mapa}
      pagina={pagina}
      reporte={reporte}
      resaltado={modo === "corregido" ? null : resaltado}
    />
  );
  const corregida = (
    <HojaEscaneada
      mapa={reporte.mapa}
      pagina={pagina}
      reporte={reporte}
      resaltado={resaltado}
      capas={capasPagina}
      capaResaltada={capaResaltada}
      onResaltarCapa={onResaltarCapa}
    />
  );

  return (
    <div
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: "top center",
        transition: "transform 150ms ease-out",
        width: "100%",
        maxWidth: ladoALado ? "1200px" : "600px",
      }}
    >
      {ladoALado ? (
        <div className="grid grid-cols-2 gap-3">
          <figure className="m-0">
            <figcaption className="mb-1 text-micro font-medium uppercase tracking-label text-muted">
              Original
            </figcaption>
            {original}
          </figure>
          <figure className="m-0">
            <figcaption className="mb-1 text-micro font-medium uppercase tracking-label text-petrol-700">
              Corregido
            </figcaption>
            {corregida}
          </figure>
        </div>
      ) : modo === "corregido" ? (
        corregida
      ) : (
        original
      )}
    </div>
  );
}
