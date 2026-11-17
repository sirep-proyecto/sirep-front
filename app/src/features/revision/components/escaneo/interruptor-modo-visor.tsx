/**
 * Responsabilidad: grupo de botones para elegir cómo se muestra el escaneo
 * (Original / Corregido / Lado a lado).
 * Existe como componente aparte para que la cabecera del visor no cargue con la
 * lógica de accesibilidad: cada botón es un `aria-pressed`, no un radio, porque
 * se comporta como un interruptor de vista y el lector de pantalla anuncia cuál
 * está activo.
 */

"use client";

import {
  MODOS_VISOR,
  type ModoVisor,
} from "@/features/revision/lib/preferencia-visor";

interface InterruptorModoVisorProps {
  modo: ModoVisor;
  onCambiar: (modo: ModoVisor) => void;
}

export function InterruptorModoVisor({ modo, onCambiar }: InterruptorModoVisorProps) {
  return (
    <div
      role="group"
      aria-label="Vista del escaneo"
      className="inline-flex items-center rounded-md border border-line-strong bg-raised p-0.5"
    >
      {MODOS_VISOR.map((opcion) => {
        const activo = opcion.valor === modo;
        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambiar(opcion.valor)}
            className={[
              "h-7 rounded-xs px-2.5 text-micro font-medium transition-colors duration-150 ease-[var(--ease-salida)]",
              activo
                ? "bg-petrol-100 text-petrol-700 shadow-xs"
                : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
