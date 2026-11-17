/**
 * Responsabilidad: botón pequeño "Enviar"/"Reenviar" de una fila de la bandeja,
 * con spinner mientras se envía.
 * Existe para que la tabla y las tarjetas compartan el mismo botón y la misma
 * regla de cuándo aparece (`puedeEnviarse`). Detiene la propagación del clic
 * para no abrir el reporte.
 */

import { Loader2, Send } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { puedeEnviarse, textoBotonEnvio } from "@/features/revision/lib/envio-rptech";
import type { Reporte } from "@/features/revision/types/dominio";

interface BotonEnviarRptechProps {
  reporte: Reporte;
  enviando: boolean;
  onEnviar: (numero: string) => void;
}

export function BotonEnviarRptech({ reporte, enviando, onEnviar }: BotonEnviarRptechProps) {
  if (!puedeEnviarse(reporte)) return null;
  const texto = textoBotonEnvio(reporte);
  const Icono = enviando ? Loader2 : Send;
  return (
    <Boton
      variante="secundario"
      tamano="sm"
      disabled={enviando}
      aria-busy={enviando}
      aria-label={`${texto} reporte N° ${reporte.numero_reporte} a RP-TECH`}
      onClick={(evento) => {
        evento.stopPropagation();
        onEnviar(reporte.numero_reporte);
      }}
      className="relative z-10 h-7 gap-1.5 px-2.5"
    >
      <Icono
        aria-hidden="true"
        className={`size-3.5 ${enviando ? "animate-spin motion-reduce:animate-none" : ""}`}
      />
      {enviando ? "Enviando…" : texto}
    </Boton>
  );
}
