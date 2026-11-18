/**
 * Responsabilidad: componer la(s) hoja(s) del visor según el modo elegido y
 * aplicarles el zoom. El zoom agranda el ancho de la hoja (no un `transform`):
 * así el área de desplazamiento crece con ella y se puede recorrer toda la hoja
 * ampliada, también hacia la izquierda.
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
  /** Clic sobre la hoja, en coordenadas 0–1 de la página (para elegir el campo de ahí). */
  onClicPunto?: (x: number, y: number) => void;
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
  onClicPunto,
}: LienzoEscaneoProps) {
  const capasPagina = capasDePagina(capas, pagina);
  const ladoALado = modo === "lado_a_lado";

  const original = (
    <HojaEscaneada
      mapa={reporte.mapa}
      pagina={pagina}
      reporte={reporte}
      resaltado={modo === "corregido" ? null : resaltado}
      onClicPunto={onClicPunto}
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
      onClicPunto={onClicPunto}
    />
  );
  const anchoBase = ladoALado ? 1200 : 600;

  return (
    <div
      style={{
        width: `${zoom * 100}%`,
        maxWidth: `${anchoBase * zoom}px`,
        flexShrink: 0,
        // margin auto centra mientras cabe y, si la hoja es más ancha, la deja
        // empezar en el borde (justify-center cortaría la parte izquierda).
        margin: "0 auto",
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
