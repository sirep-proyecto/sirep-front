/**
 * Responsabilidad: orquestar la bandeja —cargar el archivo, mantener búsqueda,
 * filtros y orden, y derivar qué estado se muestra— sin renderizar nada.
 * Existe para que `page.tsx` sea un compositor delgado y para que la lógica de
 * "cargar, filtrar, ordenar" viva separada de la presentación: así se prueba y
 * se reemplaza sin tocar los componentes.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  filtrarReportes,
  hayFiltrosActivos,
} from "@/features/revision/lib/filtros";
import { ordenarReportes } from "@/features/revision/lib/orden";
import { calcularResumenBandeja } from "@/features/revision/lib/resumen";
import { useRepositorio } from "@/features/revision/providers/repositorio-contexto";
import type {
  FiltrosBandeja,
  FiltroEstado,
  FiltroOrigen,
  OrdenBandeja,
  Reporte,
  ResumenBandeja,
} from "@/features/revision/types/dominio";

export type EstadoCargaBandeja = "cargando" | "listo" | "error";

export interface UsoBandeja {
  estadoCarga: EstadoCargaBandeja;
  /** Resumen del archivo completo, sin filtros: es el pulso del archivo. */
  resumen: ResumenBandeja;
  /** Reportes visibles: filtrados por la búsqueda y ordenados. */
  reportes: Reporte[];
  /** Carga total, para el "de N" del contador de resultados. */
  totalArchivo: number;
  filtros: FiltrosBandeja;
  orden: OrdenBandeja;
  filtrosActivos: boolean;
  establecerBusqueda: (valor: string) => void;
  establecerEstado: (valor: FiltroEstado) => void;
  establecerOrigen: (valor: FiltroOrigen) => void;
  establecerOrden: (valor: OrdenBandeja) => void;
  limpiarFiltros: () => void;
  reintentar: () => void;
}

const FILTROS_INICIALES: FiltrosBandeja = {
  busqueda: "",
  estado: "todos",
  origen: "todos",
};

export function useBandeja(): UsoBandeja {
  const repositorio = useRepositorio();
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaBandeja>(
    "cargando",
  );
  const [reportesArchivo, setReportesArchivo] = useState<readonly Reporte[]>(
    [],
  );
  const [filtros, setFiltros] = useState<FiltrosBandeja>(FILTROS_INICIALES);
  const [orden, setOrden] = useState<OrdenBandeja>("dudosos");
  // Cada reintento vuelve a ejecutar el efecto de carga.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;

    repositorio
      .listarReportes()
      .then((reportes) => {
        if (!vivo) return;
        // Demo por URL (plan §3): `?demo=error` y `?demo=vacio`. Se resuelve
        // dentro del callback porque `window` no existe al prerender y porque
        // el cuerpo del efecto no debe encadenar renders con setState
        // síncrono; un parámetro de demostración no necesita reactividad.
        const demo = new URLSearchParams(window.location.search).get("demo");

        if (demo === "error") {
          setEstadoCarga("error");
          return;
        }
        setReportesArchivo(demo === "vacio" ? [] : reportes);
        setEstadoCarga("listo");
      })
      .catch(() => {
        // El prototipo no distingue tipos de error: cualquier fallo cae al
        // mismo estado y con el mismo reintento, sin inventar diagnósticos.
        if (!vivo) return;
        setEstadoCarga("error");
      });

    return () => {
      vivo = false;
    };
  }, [repositorio, intento]);

  const reportes = useMemo(
    () => ordenarReportes(filtrarReportes(reportesArchivo, filtros), orden),
    [reportesArchivo, filtros, orden],
  );

  // El resumen mira el archivo completo y no la selección filtrada: responde
  // "¿cuánto trabajo hay?" y sigue siendo cierto mientras se filtra.
  const resumen = useMemo(
    () => calcularResumenBandeja(reportesArchivo),
    [reportesArchivo],
  );

  const establecerBusqueda = useCallback(
    (busqueda: string) => setFiltros((previo) => ({ ...previo, busqueda })),
    [],
  );
  const establecerEstado = useCallback(
    (estado: FiltroEstado) => setFiltros((previo) => ({ ...previo, estado })),
    [],
  );
  const establecerOrigen = useCallback(
    (origen: FiltroOrigen) => setFiltros((previo) => ({ ...previo, origen })),
    [],
  );
  const establecerOrden = useCallback(
    (nuevoOrden: OrdenBandeja) => setOrden(nuevoOrden),
    [],
  );
  // Solo limpia filtros: el orden es una preferencia de lectura, no un filtro.
  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), []);
  // El "cargando" del reintento se declara en el evento y no en el efecto:
  // es una reacción directa a la persona y evita setState síncrono en el
  // cuerpo del efecto, que React trata como render en cascada.
  const reintentar = useCallback(() => {
    setEstadoCarga("cargando");
    setIntento((anterior) => anterior + 1);
  }, []);

  return {
    estadoCarga,
    resumen,
    reportes,
    totalArchivo: reportesArchivo.length,
    filtros,
    orden,
    filtrosActivos: hayFiltrosActivos(filtros),
    establecerBusqueda,
    establecerEstado,
    establecerOrigen,
    establecerOrden,
    limpiarFiltros,
    reintentar,
  };
}
