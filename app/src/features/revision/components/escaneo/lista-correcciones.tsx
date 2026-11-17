/**
 * Responsabilidad: tabla plegable con las correcciones del reporte (qué leyó el
 * modelo, qué quedó, quién y cuándo) enlazada con los recuadros de la hoja.
 * Existe para auditar de un vistazo lo que cambió una persona sin recorrer los
 * 31 campos: pasar el mouse o el foco por una fila resalta su recuadro en la
 * hoja, y a la inversa.
 */

"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import type { CapaCorreccion } from "@/features/revision/lib/capas-correccion";
import { formatearFecha, formatearFechaHora } from "@/features/revision/lib/formato";
import type { NumeroPagina } from "@/features/revision/types/regiones";

interface ListaCorreccionesProps {
  capas: readonly CapaCorreccion[];
  capaResaltada: string | null;
  onResaltarCapa: (id: string | null) => void;
  /** Cambia la hoja visible cuando la fila pertenece a otra página. */
  onIrAPagina?: (pagina: NumeroPagina) => void;
  /** Contenido a la derecha de la barra (p. ej. el botón de descarga). */
  acciones?: ReactNode;
}

export function ListaCorrecciones({
  capas,
  capaResaltada,
  onResaltarCapa,
  onIrAPagina,
  acciones,
}: ListaCorreccionesProps) {
  const [abierta, setAbierta] = useState(true);
  const corregidas = capas.filter((capa) => capa.tipo === "corregido").length;
  const omitidas = capas.length - corregidas;

  return (
    <div className="shrink-0 rounded-xs border border-line bg-raised">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls="lista-correcciones"
          onClick={() => setAbierta((valor) => !valor)}
          className="inline-flex items-center gap-1.5 text-micro font-medium uppercase tracking-label text-muted hover:text-ink"
        >
          <ChevronDown
            className={`size-3.5 transition-transform ${abierta ? "" : "-rotate-90"}`}
            aria-hidden="true"
          />
          Correcciones
          <span className="rounded-xs bg-sunken px-1.5 py-0.5 font-mono normal-case tracking-normal text-ink">
            {corregidas}
            {omitidas ? ` + ${omitidas} omitid${omitidas === 1 ? "o" : "os"}` : ""}
          </span>
        </button>
        {acciones}
      </div>

      {abierta ? (
        <div
          id="lista-correcciones"
          className="scroll-fino max-h-44 overflow-auto border-t border-line"
        >
          {capas.length === 0 ? (
            <p className="px-3 py-3 text-meta text-muted">
              Todavía nadie corrigió ni omitió campos de este reporte.
            </p>
          ) : (
            <table className="w-full border-collapse text-meta">
              <thead>
                <tr className="text-left text-micro uppercase tracking-label text-faint">
                  <th scope="col" className="px-2.5 py-1.5 font-medium">#</th>
                  <th scope="col" className="px-2 py-1.5 font-medium">Campo</th>
                  <th scope="col" className="px-2 py-1.5 font-medium">El modelo leyó</th>
                  <th scope="col" className="px-2 py-1.5 font-medium">Corregido</th>
                  <th scope="col" className="px-2 py-1.5 font-medium">Por</th>
                </tr>
              </thead>
              <tbody>
                {capas.map((capa) => {
                  const resaltada = capaResaltada === capa.id;
                  const corregida = capa.tipo === "corregido";
                  return (
                    <tr
                      key={capa.id}
                      tabIndex={0}
                      data-fila-capa={capa.id}
                      aria-label={
                        corregida
                          ? `Corrección ${capa.numero}: ${capa.etiqueta}`
                          : `Campo omitido: ${capa.etiqueta}`
                      }
                      onMouseEnter={() => onResaltarCapa(capa.id)}
                      onMouseLeave={() => onResaltarCapa(null)}
                      onFocus={() => onResaltarCapa(capa.id)}
                      onBlur={() => onResaltarCapa(null)}
                      onClick={() => onIrAPagina?.(capa.region.pagina)}
                      className={[
                        "cursor-default border-t border-line outline-none transition-colors",
                        resaltada ? "bg-petrol-50" : "hover:bg-sunken",
                      ].join(" ")}
                    >
                      <td className="px-2.5 py-1.5 font-mono text-muted">
                        {capa.numero ?? "—"}
                      </td>
                      <td className="px-2 py-1.5 text-ink">{capa.etiqueta}</td>
                      <td className="px-2 py-1.5 font-mono text-faint">
                        {capa.valor_modelo ? (
                          <s>{capa.valor_modelo}</s>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-mono font-semibold text-ink">
                        {corregida ? (
                          capa.texto
                        ) : (
                          <span className="font-sans font-normal italic text-muted">
                            vacío en el papel
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-muted">
                        {capa.corregido_por ?? "—"}
                        {capa.corregido_en ? (
                          <span
                            className="block whitespace-nowrap text-micro text-faint"
                            title={formatearFechaHora(capa.corregido_en)}
                          >
                            {formatearFecha(capa.corregido_en.slice(0, 10))}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
