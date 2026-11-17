/**
 * Responsabilidad: orquestar el envío manual a RP-TECH —un reporte o todos los
 * completados— con su estado de "enviando" y el aviso de resultado.
 * Existe para que la bandeja muestre progreso y resultado sin que los
 * componentes conozcan la API; los textos salen de `lib/envio-rptech`.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  loteConProblemas,
  mensajeEnvioExitoso,
  mensajeErrorEnvio,
  textoResumenLote,
} from "@/features/revision/lib/envio-rptech";
import { useRepositorio } from "@/features/revision/providers/repositorio-contexto";

export interface AvisoEnvio {
  tipo: "exito" | "aviso" | "error";
  texto: string;
}

const MS_AVISO = 12_000;

export function useEnvioRptech(refrescar: () => void) {
  const repositorio = useRepositorio();
  const [enviando, setEnviando] = useState<ReadonlySet<string>>(new Set());
  const [enviandoLote, setEnviandoLote] = useState(false);
  const [aviso, setAviso] = useState<AvisoEnvio | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback((nuevo: AvisoEnvio) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setAviso(nuevo);
    temporizador.current = setTimeout(() => setAviso(null), MS_AVISO);
  }, []);

  const cerrarAviso = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setAviso(null);
  }, []);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const enviar = useCallback(
    async (numero: string) => {
      setEnviando((previo) => new Set(previo).add(numero));
      try {
        const respuesta = await repositorio.enviarARptech(numero);
        mostrar({
          tipo: "exito",
          texto: `Reporte N° ${numero}: ${mensajeEnvioExitoso(respuesta)}`,
        });
      } catch (error) {
        mostrar({
          tipo: "error",
          texto: `Reporte N° ${numero}: ${mensajeErrorEnvio(error)}`,
        });
      } finally {
        setEnviando((previo) => {
          const siguiente = new Set(previo);
          siguiente.delete(numero);
          return siguiente;
        });
        // También tras un rechazo: el reporte ya quedó marcado en el servidor.
        refrescar();
      }
    },
    [repositorio, mostrar, refrescar],
  );

  const enviarLote = useCallback(async () => {
    setEnviandoLote(true);
    try {
      const resumen = await repositorio.enviarLoteARptech();
      mostrar({
        tipo: loteConProblemas(resumen) ? "aviso" : "exito",
        texto: textoResumenLote(resumen),
      });
    } catch (error) {
      mostrar({ tipo: "error", texto: mensajeErrorEnvio(error) });
    } finally {
      setEnviandoLote(false);
      refrescar();
    }
  }, [repositorio, mostrar, refrescar]);

  return { enviando, enviandoLote, aviso, cerrarAviso, enviar, enviarLote };
}
