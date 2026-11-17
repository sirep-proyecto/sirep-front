/**
 * Responsabilidad: mensaje breve con el resultado de un envío a RP-TECH,
 * anunciado a lectores de pantalla.
 * Existe porque la región `aria-live` debe estar siempre en el DOM para que
 * el cambio de texto se anuncie; el contenido visible aparece solo con aviso.
 */

import { X } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import type { AvisoEnvio } from "@/features/revision/hooks/use-envio-rptech";

const CLASES: Record<AvisoEnvio["tipo"], string> = {
  exito: "border-green-200 bg-green-50 text-ink",
  aviso: "border-amber-200 bg-amber-50 text-ink",
  error: "border-brick-200 bg-brick-50 text-ink",
};

export function AvisoEnvioRptech({ aviso, onCerrar }: { aviso: AvisoEnvio | null; onCerrar: () => void }) {
  return (
    <div role="status" aria-live="polite" className="empty:hidden">
      {aviso ? (
        <div
          className={`mt-3 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-body ${CLASES[aviso.tipo]}`}
        >
          <p>{aviso.texto}</p>
          <Boton variante="fantasma" tamano="icono" className="-my-1.5 -mr-2 size-8" onClick={onCerrar} aria-label="Cerrar el aviso">
            <X className="size-4" aria-hidden="true" />
          </Boton>
        </div>
      ) : null}
    </div>
  );
}
