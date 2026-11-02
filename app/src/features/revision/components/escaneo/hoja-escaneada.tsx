/**
 * Responsabilidad: dibujar el escaneo falso del talonario sobre una página
 * normalizada, colocando cada valor en la misma región que usa el recorte.
 * Existe porque es la única fuente de luz de la vista de corrección: el técnico
 * tiene que reconocer su hoja, no un rectángulo gris. Se genera desde el mapa de
 * regiones para que un cambio de talonario no obligue a redibujar el SVG a mano.
 */

import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";
import {
  MANO,
  MARCA_AGUA,
  MONO,
  PAPEL,
  TINTA_IMPRESA,
  TINTA_MANO,
  TINTA_REGLON,
  TINTA_SELLO,
  marcasDeMano,
} from "@/config/escaneo-falso";
import { valorVigente } from "@/features/revision/lib/campos";
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
  /** Reporte cuyos valores se escriben a mano; en blanco si no hay. */
  reporte?: ReporteVista | null;
  resaltado?: ResaltadoRegion | null;
  className?: string;
}

const COLORES: Record<TonoResaltado, string> = {
  petrol: "#13545f",
  amber: "#9a640b",
  brick: "#a23e2c",
  green: "#2f6a4e",
};

/**
 * Ajusta el valor a los renglones disponibles. El ancho se estima con el
 * promedio de caracteres de una letra manuscrita: no es tipografía perfecta, es
 * lo justo para que el texto no se salga de su columna.
 */
function envolver(
  texto: string,
  anchoPx: number,
  altoPx: number,
  fs: number,
): string[] {
  const maxCaracteres = Math.max(6, Math.floor(anchoPx / (fs * 0.42)));
  const maxLineas = Math.max(1, Math.floor(altoPx / (fs * 1.16)));

  const palabras = texto.trim().split(/\s+/);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > maxCaracteres && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);

  if (lineas.length > maxLineas) {
    return lineas.slice(0, maxLineas).map((linea, indice) =>
      indice === maxLineas - 1 ? `${linea.slice(0, Math.max(0, maxCaracteres - 1))}…` : linea,
    );
  }
  return lineas;
}

/** Sello de recepción: círculo doble con el texto centrado. */
function DibujoSello({
  x,
  y,
  ancho,
  alto,
  valor,
}: {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  valor: string | null;
}) {
  const cx = x + ancho / 2;
  const cy = y + alto / 2;
  const radio = Math.min(ancho, alto) / 2 - 6;

  return (
    <g transform={`rotate(-9 ${cx} ${cy})`} opacity={0.85}>
      <circle cx={cx} cy={cy} r={radio} fill="none" stroke={TINTA_SELLO} strokeWidth={4} />
      <circle
        cx={cx}
        cy={cy}
        r={Math.max(8, radio - 9)}
        fill="none"
        stroke={TINTA_SELLO}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize={Math.max(12, radio * 0.2)}
        fontFamily={MONO}
        fontWeight={600}
        letterSpacing={2}
        fill={TINTA_SELLO}
      >
        RECIBIDO
      </text>
      {valor ? (
        <text
          x={cx}
          y={cy + radio * 0.32}
          textAnchor="middle"
          fontSize={Math.max(14, radio * 0.24)}
          fontFamily={MANO}
          fill={TINTA_SELLO}
        >
          {valor}
        </text>
      ) : null}
    </g>
  );
}

/** Firma manuscrita: dos trazos de lapicera dentro de la región. */
function DibujoFirma({
  x,
  y,
  ancho,
  alto,
  valor,
}: {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  valor: string | null;
}) {
  const base = y + alto * 0.6;
  const trazo = [
    `M ${x + 12} ${base}`,
    `C ${x + ancho * 0.14} ${base - alto * 0.42}`,
    `${x + ancho * 0.3} ${base + alto * 0.22}`,
    `${x + ancho * 0.46} ${base - alto * 0.3}`,
    `S ${x + ancho * 0.72} ${base + alto * 0.18}`,
    `${x + ancho * 0.9} ${base - alto * 0.08}`,
  ].join(" ");

  return (
    <g>
      <path d={trazo} fill="none" stroke={TINTA_MANO} strokeWidth={5} strokeLinecap="round" />
      <path
        d={`M ${x + ancho * 0.22} ${base + alto * 0.2} q ${ancho * 0.3} ${alto * 0.14} ${ancho * 0.52} ${-alto * 0.06}`}
        fill="none"
        stroke={TINTA_MANO}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.7}
      />
      {valor ? (
        <text x={x + 14} y={y + alto * 0.94} fontSize={alto * 0.3} fontFamily={MANO} fill={TINTA_MANO}>
          {valor}
        </text>
      ) : null}
    </g>
  );
}

/** Número de reporte: va sellado en rojo, como en el talonario físico. */
function SelloNumero({
  x,
  y,
  ancho,
  alto,
  valor,
  rotacion,
}: {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  valor: string | null;
  rotacion: number;
}) {
  const cx = x + ancho / 2;
  const cy = y + alto / 2;

  return (
    <g transform={`rotate(${rotacion} ${cx} ${cy})`}>
      <rect
        x={x}
        y={y}
        width={ancho}
        height={alto}
        rx={6}
        fill="none"
        stroke={TINTA_SELLO}
        strokeWidth={2.5}
        opacity={0.7}
      />
      {valor ? (
        <text
          x={cx}
          y={y + alto * 0.74}
          textAnchor="middle"
          fontSize={alto * 0.62}
          fontFamily={MONO}
          fontWeight={600}
          letterSpacing={3}
          fill={TINTA_SELLO}
        >
          {valor}
        </text>
      ) : null}
    </g>
  );
}

export function HojaEscaneada({
  mapa,
  pagina,
  reporte = null,
  resaltado = null,
  className,
}: HojaEscaneadaProps) {
  const ancho = mapa.ancho_pagina;
  const alto = mapa.alto_pagina;

  const entradas = CAMPOS_FORMULARIO.map((definicion) => {
    const region = mapa.regiones[definicion.id];
    const campo = reporte?.campos.find((c) => c.id === definicion.id);
    return {
      id: definicion.id,
      definicion,
      region,
      valor: campo ? valorVigente(campo) : null,
    };
  }).filter((entrada) => entrada.region.pagina === pagina);

  const etiquetaPagina = pagina === 1 ? "ANVERSO" : "REVERSO";
  const tieneImagenReal = Boolean(
    reporte?.escaneo?.ruta_original?.startsWith("/escaneos/"),
  );

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={twMerge("block h-full w-full", className)}
      role="img"
      aria-label={
        reporte
          ? `Escaneo del reporte N° ${reporte.numero_reporte}, página ${pagina} de ${mapa.paginas}`
          : `Formulario en blanco, página ${pagina} de ${mapa.paginas}`
      }
    >
      <rect width={ancho} height={alto} fill={PAPEL} />

      {tieneImagenReal && reporte?.escaneo?.ruta_original ? (
        <image
          href={reporte.escaneo.ruta_original}
          x={0}
          y={0}
          width={ancho}
          height={alto}
          preserveAspectRatio="none"
        />
      ) : null}

      {!tieneImagenReal ? (
        /* Marca de agua diagonal: está debajo de la tinta, como en el original. */
        <g
          transform={`rotate(-32 ${ancho / 2} ${alto / 2})`}
          opacity={0.055}
          aria-hidden="true"
        >
          <text
            x={ancho / 2}
            y={alto / 2}
            textAnchor="middle"
            fontSize={78}
            fontFamily={MONO}
            fontWeight={600}
            letterSpacing={6}
            fill="#0c4049"
          >
            {MARCA_AGUA}
          </text>
        </g>
      ) : null}

      {/* Encabezado impreso */}
      <text
        x={ancho * 0.06}
        y={alto * 0.024}
        fontSize={20}
        fontFamily={MONO}
        fontWeight={600}
        letterSpacing={2.5}
        fill={TINTA_IMPRESA}
      >
        GO SERVICE LATAM
      </text>
      <text
        x={ancho * 0.06}
        y={alto * 0.043}
        fontSize={13}
        fontFamily={MONO}
        letterSpacing={1.6}
        fill={TINTA_IMPRESA}
      >
        SOPORTE MULTIMARCAS · SERVICIO TÉCNICO
      </text>
      <text
        x={pagina === 1 ? ancho * 0.4 : ancho * 0.06}
        y={pagina === 1 ? alto * 0.038 : alto * 0.085}
        fontSize={22}
        fontFamily={MONO}
        fontWeight={600}
        letterSpacing={2}
        fill={TINTA_IMPRESA}
      >
        {pagina === 1 ? "REPORTE DE SERVICIO" : "OBSERVACIONES Y CONFORMIDAD"}
      </text>

      {/* Campos del formulario */}
      {entradas.map((entrada) => {
        const { id, definicion, region, valor } = entrada;
        const x = region.x * ancho;
        const y = region.y * alto;
        const anchoRegion = region.ancho * ancho;
        const altoRegion = region.alto * alto;
        const marcas = marcasDeMano(id);

        return (
          <Fragment key={id}>
            <text
              x={x}
              y={y - 7}
              fontSize={14}
              fontFamily={MONO}
              letterSpacing={1.4}
              fill={TINTA_IMPRESA}
            >
              {definicion.etiqueta_formulario.toUpperCase()}
            </text>
            <line
              x1={x}
              y1={y + altoRegion}
              x2={x + anchoRegion}
              y2={y + altoRegion}
              stroke={TINTA_REGLON}
              strokeWidth={1.5}
            />

            {!valor ? null : id === "numero_reporte" ? (
              <SelloNumero
                x={x}
                y={y}
                ancho={anchoRegion}
                alto={altoRegion}
                valor={valor}
                rotacion={marcas.rotacion}
              />
            ) : id === "firma_cliente" ? (
              <DibujoFirma
                x={x}
                y={y}
                ancho={anchoRegion}
                alto={altoRegion}
                valor={valor}
              />
            ) : id === "sello" ? (
              <DibujoSello
                x={x}
                y={y}
                ancho={anchoRegion}
                alto={altoRegion}
                valor={valor}
              />
            ) : (
              <Manuscrito
                x={x}
                y={y + altoRegion - 8}
                anchoRegion={anchoRegion}
                altoRegion={altoRegion}
                valor={valor}
                rotacion={marcas.rotacion}
                desfaseY={marcas.desfase_y}
                escala={marcas.escala}
                tachadura={marcas.tachadura}
              />
            )}
          </Fragment>
        );
      })}

      {/* Pie de página */}
      <line
        x1={ancho * 0.06}
        y1={alto * 0.965}
        x2={ancho * 0.94}
        y2={alto * 0.965}
        stroke={TINTA_REGLON}
        strokeWidth={1.5}
      />
      <text
        x={ancho * 0.06}
        y={alto * 0.986}
        fontSize={13}
        fontFamily={MONO}
        letterSpacing={1.4}
        fill={TINTA_IMPRESA}
      >
        {`PÁGINA ${pagina} DE ${mapa.paginas} · ${etiquetaPagina}`}
      </text>
      <text
        x={ancho * 0.94}
        y={alto * 0.986}
        textAnchor="end"
        fontSize={13}
        fontFamily={MONO}
        letterSpacing={1.4}
        fill={TINTA_IMPRESA}
      >
        TALONARIO 2005
      </text>

      {/* Resaltado de la región activa, siempre encima de todo */}
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

/** Texto manuscrito de un campo, con su inclinación y su tachadura. */
function Manuscrito({
  x,
  y,
  anchoRegion,
  altoRegion,
  valor,
  rotacion,
  desfaseY,
  escala,
  tachadura,
}: {
  x: number;
  y: number;
  anchoRegion: number;
  altoRegion: number;
  valor: string;
  rotacion: number;
  desfaseY: number;
  escala: number;
  tachadura: boolean;
}) {
  const fs = Math.max(16, Math.min(altoRegion * 0.6, 34)) * escala;
  const lineas = envolver(valor, anchoRegion - 10, altoRegion, fs);
  const primeraLinea = lineas[0] ?? "";
  const anchoTexto = primeraLinea.length * fs * 0.42;

  return (
    <g transform={`rotate(${rotacion} ${x} ${y})`}>
      {lineas.map((linea, indice) => (
        <text
          key={`${linea}-${indice}`}
          x={x + 5}
          y={y + indice * fs * 1.16 + desfaseY}
          fontSize={fs}
          fontFamily={MANO}
          fill={TINTA_MANO}
        >
          {linea}
        </text>
      ))}
      {tachadura ? (
        <line
          x1={x}
          y1={y - fs * 0.3 + desfaseY}
          x2={x + anchoTexto + 10}
          y2={y - fs * 0.3 + desfaseY + 4}
          stroke={TINTA_MANO}
          strokeWidth={Math.max(2, fs * 0.08)}
          strokeLinecap="round"
          opacity={0.85}
        />
      ) : null}
    </g>
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
  const anchoEtiqueta = Math.max(60, texto.length * 8.4 + 18);

  return (
    <g aria-hidden="true">
      <rect
        x={x - 5}
        y={y - 5}
        width={anchoRegion + 10}
        height={altoRegion + 10}
        rx={5}
        fill="none"
        stroke={color}
        strokeWidth={3}
      />
      <rect
        x={x - 5}
        y={Math.max(4, y - 32)}
        width={anchoEtiqueta}
        height={24}
        rx={4}
        fill={color}
      />
      <text
        x={x + 4}
        y={Math.max(4, y - 32) + 16}
        fontSize={13}
        fontFamily={MONO}
        letterSpacing={1.2}
        fill={PAPEL}
      >
        {texto.toUpperCase()}
      </text>
    </g>
  );
}
