/**
 * Responsabilidad: botón global "Enviar completados a RP-TECH (N)" con su
 * diálogo de confirmación.
 * Existe porque el envío en lote es masivo y lento: pide confirmación,
 * muestra "Enviando…" y bloquea el botón hasta que termina.
 */

"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import { DialogoConfirmacion } from "@/components/ui/dialogo-confirmacion";
import { pluralizar } from "@/features/revision/lib/formato";

interface BotonEnviarCompletadosProps {
  cantidad: number;
  enviando: boolean;
  onConfirmar: () => void;
}

export function BotonEnviarCompletados({ cantidad, enviando, onConfirmar }: BotonEnviarCompletadosProps) {
  const [confirmando, setConfirmando] = useState(false);
  const Icono = enviando ? Loader2 : Send;

  return (
    <>
      <Boton
        variante="primario"
        disabled={cantidad === 0 || enviando}
        aria-busy={enviando}
        onClick={() => setConfirmando(true)}
        className="h-11 w-full md:h-9 md:w-auto"
      >
        <Icono
          aria-hidden="true"
          className={`size-4 ${enviando ? "animate-spin motion-reduce:animate-none" : ""}`}
        />
        {enviando ? "Enviando…" : `Enviar completados a RP-TECH (${cantidad})`}
      </Boton>
      {confirmando ? (
        <DialogoConfirmacion
          titulo="Enviar a RP-TECH"
          textoConfirmar="Enviar"
          onCancelar={() => setConfirmando(false)}
          onConfirmar={() => {
            setConfirmando(false);
            onConfirmar();
          }}
        >
          Se enviarán {pluralizar(cantidad, "reporte revisado", "reportes revisados")} a RP-TECH. ¿Continuar?
        </DialogoConfirmacion>
      ) : null}
    </>
  );
}
