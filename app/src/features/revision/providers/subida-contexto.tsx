/**
 * Responsabilidad: mantener viva la cola de subida por encima de las pantallas
 * y del panel, y exponerla a los componentes.
 * Vive en el layout para que cerrar el panel o navegar a un reporte no corte
 * lo que se está subiendo; también avisa al cerrar la pestaña con subidas
 * pendientes.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  crearAlmacenSubida,
  type AlmacenSubida,
} from "@/features/revision/lib/subida/almacen";
import { avanceGlobal, estaPendiente } from "@/features/revision/lib/subida/cola";
import type { EstadoCola } from "@/features/revision/lib/subida/tipos";
import { calcularHuellaSha256 } from "@/features/revision/lib/subida/validacion";
import { subirEscaneo } from "@/features/revision/services/subir-escaneo";

interface ValorSubida {
  estado: EstadoCola;
  /** "Subiendo 2/5": `null` si no hay nada pendiente. */
  avance: { actual: number; total: number } | null;
  panelAbierto: boolean;
  abrirPanel: () => void;
  cerrarPanel: () => void;
  agregarArchivos: (archivos: readonly File[]) => void;
  quitar: AlmacenSubida["quitar"];
  establecerNumero: AlmacenSubida["establecerNumero"];
  reintentar: AlmacenSubida["reintentar"];
  limpiarTerminados: AlmacenSubida["limpiarTerminados"];
}

const SubidaContext = createContext<ValorSubida | null>(null);

export function ProveedorSubida({ children }: { children: ReactNode }) {
  const [almacen] = useState(() =>
    crearAlmacenSubida({
      subir: subirEscaneo,
      calcularHuella: calcularHuellaSha256,
    }),
  );
  const estado = useSyncExternalStore(
    almacen.suscribir,
    almacen.obtener,
    almacen.obtener,
  );
  const [panelAbierto, setPanelAbierto] = useState(false);

  const hayPendientes = estado.items.some(estaPendiente);
  useEffect(() => {
    if (!hayPendientes) return;
    // El navegador muestra su propio aviso; el texto ya no se personaliza.
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayPendientes]);

  const abrirPanel = useCallback(() => setPanelAbierto(true), []);
  const cerrarPanel = useCallback(() => setPanelAbierto(false), []);
  const avance = useMemo(() => avanceGlobal(estado.items), [estado.items]);

  const valor = useMemo<ValorSubida>(
    () => ({
      estado,
      avance,
      panelAbierto,
      abrirPanel,
      cerrarPanel,
      agregarArchivos: almacen.agregar,
      quitar: almacen.quitar,
      establecerNumero: almacen.establecerNumero,
      reintentar: almacen.reintentar,
      limpiarTerminados: almacen.limpiarTerminados,
    }),
    [estado, avance, panelAbierto, abrirPanel, cerrarPanel, almacen],
  );

  return (
    <SubidaContext.Provider value={valor}>
      {children}
    </SubidaContext.Provider>
  );
}

export function useSubida(): ValorSubida {
  const valor = useContext(SubidaContext);
  if (!valor) {
    throw new Error("useSubida debe usarse dentro de <ProveedorSubida>.");
  }
  return valor;
}
