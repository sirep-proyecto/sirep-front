/**
 * Responsabilidad: mostrar una página del escaneo real dentro de un SVG con la
 * misma geometría que usa el recorte, y resaltar encima la región activa.
 * Existe porque es la fuente de luz de la vista de corrección: el técnico compara
 * lo que leyó el modelo contra su propio papel. La imagen llega como enlace
 * firmado de Storage (`escaneo.paginas_urls`); si no hay imagen se dice, en lugar
 * de dibujar un formulario inventado que parecería un escaneo.
 *
 * Encima de la imagen se pueden dibujar las correcciones (`capas`): recuadros
 * con el valor corregido, calculados en `lib/capas-correccion` con la misma
 * geometría que usa la descarga en canvas.
 *
 * La imagen se estira a las dimensiones del mapa (`preserveAspectRatio="none"`)
 * para que las coordenadas normalizadas de las regiones apunten al mismo punto
 * de la hoja en cualquier resolución.
 */

import { useId, useMemo } from "react";
import { twMerge } from "tailwind-merge";

import {
  calcularGeometrias,
  etiquetaAccesibleCapa,
  FUENTE_MONO,
  PALETA_CAPAS,
  type CapaCorreccion,
  type GeometriaCapa,
} from "@/features/revision/lib/capas-correccion";

import type { ReporteVista } from "@/features/revision/types/dominio";
import type {
  MapaRegiones,
  NumeroPagina,
  Region,
} from "@/features/revision/types/regiones";

export type TonoResaltado = "petrol" | "amber" | "brick" | "green";

export interface ResaltadoRegion {
  region: Region;
  etiqueta?: string;
  tono?: TonoResaltado;
}

interface HojaEscaneadaProps {
  mapa: MapaRegiones;
  pagina: NumeroPagina;
  /** Reporte cuyo escaneo se muestra. Sin reporte no hay nada que mostrar. */
  reporte?: ReporteVista | null;
  resaltado?: ResaltadoRegion | null;
  /** Correcciones a dibujar encima del escaneo (solo las de esta página). */
  capas?: readonly CapaCorreccion[];
  /** Capa que se destaca (por hover o foco en la lista de correcciones). */
  capaResaltada?: string | null;
  onResaltarCapa?: (id: string | null) => void;
  /** Clic sobre la hoja, en coordenadas 0–1 de la página. */
  onClicPunto?: (x: number, y: number) => void;
  className?: string;
}

const COLORES: Record<TonoResaltado, string> = {
  petrol: "#dcae6e",
  amber: "#f59e0b",
  brick: "#ef4444",
  green: "#34d399",
};

export function HojaEscaneada({
  mapa,
  pagina,
  reporte = null,
  resaltado = null,
  capas,
  capaResaltada = null,
  onResaltarCapa,
  onClicPunto,
  className,
}: HojaEscaneadaProps) {
  const ancho = mapa.ancho_pagina;
  const alto = mapa.alto_pagina;
  const url = reporte?.escaneo?.paginas_urls?.[pagina - 1] ?? null;
  const idTrama = `trama-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const geometrias = useMemo(
    () => (capas?.length ? calcularGeometrias(capas, mapa) : []),
    [capas, mapa],
  );

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={twMerge("block h-full w-full", className)}
      onClick={
        onClicPunto
          ? (evento) => {
              const caja = evento.currentTarget.getBoundingClientRect();
              if (caja.width <= 0 || caja.height <= 0) return;
              onClicPunto(
                (evento.clientX - caja.left) / caja.width,
                (evento.clientY - caja.top) / caja.height,
              );
            }
          : undefined
      }
      role="group"
      aria-label={
        reporte
          ? `Escaneo del reporte N° ${reporte.numero_reporte}, página ${pagina}`
          : "Escaneo no disponible"
      }
    >
      <rect width={ancho} height={alto} fill="#eef1f6" />

      {url ? (
        <image
          href={url}
          x={0}
          y={0}
          width={ancho}
          height={alto}
          preserveAspectRatio="none"
        />
      ) : (
        <g aria-hidden="true">
          <text
            x={ancho / 2}
            y={alto / 2}
            textAnchor="middle"
            fontSize={Math.round(ancho * 0.035)}
            fill="#64748b"
          >
            Sin imagen del escaneo
          </text>
        </g>
      )}

      {geometrias.length ? (
        <>
          <defs>
            <pattern
              id={idTrama}
              width={9}
              height={9}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width={9} height={9} fill={PALETA_CAPAS.omitido.relleno} />
              <line x1={0} y1={0} x2={0} y2={9} stroke={PALETA_CAPAS.omitido.trama} strokeWidth={2.5} />
            </pattern>
          </defs>
          {geometrias.map((geometria) => (
            <CapaDibujada
              key={geometria.capa.id}
              geometria={geometria}
              idTrama={idTrama}
              resaltada={capaResaltada === geometria.capa.id}
              onResaltar={onResaltarCapa}
            />
          ))}
        </>
      ) : null}

      {resaltado ? (
        <Resaltado
          region={resaltado.region}
          etiqueta={resaltado.etiqueta}
          tono={resaltado.tono ?? "amber"}
          ancho={ancho}
          alto={alto}
        />
      ) : null}
    </svg>
  );
}

function Resaltado({
  region,
  etiqueta,
  tono,
  ancho,
  alto,
}: {
  region: Region;
  etiqueta?: string;
  tono: TonoResaltado;
  ancho: number;
  alto: number;
}) {
  const color = COLORES[tono];
  const x = region.x * ancho;
  const y = region.y * alto;
  const anchoRegion = region.ancho * ancho;
  const altoRegion = region.alto * alto;
  const texto = etiqueta ?? "";
  const tamanoLetra = Math.round(ancho * 0.0125);
  const altoEtiqueta = Math.round(tamanoLetra * 1.9);
  const anchoEtiqueta = Math.max(
    tamanoLetra * 5,
    texto.length * tamanoLetra * 0.62 + tamanoLetra * 1.6,
  );
  const yEtiqueta = Math.max(4, y - altoEtiqueta - 6);

  return (
    <g aria-hidden="true">
      <rect
        x={x - 5}
        y={y - 5}
        width={anchoRegion + 10}
        height={altoRegion + 10}
        rx={6}
        fill={color}
        fillOpacity={0.1}
        stroke={color}
        strokeWidth={3.5}
      />
      {texto ? (
        <>
          <rect
            x={x - 5}
            y={yEtiqueta}
            width={anchoEtiqueta}
            height={altoEtiqueta}
            rx={5}
            fill={color}
          />
          <text
            x={x + tamanoLetra * 0.4}
            y={yEtiqueta + altoEtiqueta * 0.68}
            fontSize={tamanoLetra}
            fontWeight={600}
            letterSpacing={0.4}
            fill="#ffffff"
          >
            {texto}
          </text>
        </>
      ) : null}
    </g>
  );
}

function CapaDibujada({
  geometria,
  idTrama,
  resaltada,
  onResaltar,
}: {
  geometria: GeometriaCapa;
  idTrama: string;
  resaltada: boolean;
  onResaltar?: (id: string | null) => void;
}) {
  const { capa, x, y, ancho, alto, tamano, interlineado, lineas, insignia } = geometria;
  const corregida = capa.tipo === "corregido";
  const paleta = corregida ? PALETA_CAPAS.corregido : PALETA_CAPAS.omitido;

  return (
    <g
      role="img"
      aria-label={etiquetaAccesibleCapa(capa)}
      tabIndex={0}
      data-capa={capa.id}
      className="outline-none"
      onMouseEnter={() => onResaltar?.(capa.id)}
      onMouseLeave={() => onResaltar?.(null)}
      onFocus={() => onResaltar?.(capa.id)}
      onBlur={() => onResaltar?.(null)}
    >
      {resaltada ? (
        <rect
          x={x - 6}
          y={y - 6}
          width={ancho + 12}
          height={alto + 12}
          rx={6}
          fill={PALETA_CAPAS.resaltado}
          fillOpacity={0.4}
          stroke={PALETA_CAPAS.resaltado}
          strokeWidth={6}
        />
      ) : null}
      <rect
        x={x}
        y={y}
        width={ancho}
        height={alto}
        rx={2}
        fill={corregida ? paleta.relleno : `url(#${idTrama})`}
        stroke={paleta.borde}
        strokeWidth={2.5}
      />
      <text
        fontSize={tamano}
        fill={paleta.texto}
        fontStyle={corregida ? "normal" : "italic"}
        style={{ fontFamily: `var(--font-mono), ${FUENTE_MONO}` }}
      >
        {lineas.map((linea, indice) => (
          <tspan
            key={indice}
            x={geometria.texto_x}
            y={geometria.texto_y + indice * interlineado}
          >
            {linea}
          </tspan>
        ))}
      </text>
      {insignia ? (
        <>
          <circle cx={insignia.cx} cy={insignia.cy} r={insignia.r} fill={PALETA_CAPAS.insignia.relleno} />
          <text
            x={insignia.cx}
            y={insignia.cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={insignia.r * 1.15}
            fontWeight={700}
            fill={PALETA_CAPAS.insignia.texto}
            style={{ fontFamily: `var(--font-mono), ${FUENTE_MONO}` }}
          >
            {capa.numero}
          </text>
        </>
      ) : null}
    </g>
  );
}
