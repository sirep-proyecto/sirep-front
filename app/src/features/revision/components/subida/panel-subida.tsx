/**
 * Responsabilidad: panel lateral con la cola de subida —zona para elegir o
 * soltar archivos, resumen y una fila por archivo—.
 * Es un diálogo modal accesible (foco atrapado, Escape cierra, el foco vuelve
 * al botón que lo abrió). Cerrarlo no detiene la subida: el estado vive en el
 * proveedor.
 */

"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { Upload, X } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { resumirCola, textoResumen } from "@/features/revision/lib/subida/cola";
import { useSubida } from "@/features/revision/providers/subida-contexto";

import { FilaSubida } from "./fila-subida";

const FOCALIZABLES =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PanelSubida() {
  const {
    panelAbierto,
    cerrarPanel,
    estado,
    agregarArchivos,
    quitar,
    reintentar,
    establecerNumero,
    limpiarTerminados,
  } = useSubida();
  const panel = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);

  // Al abrir, el foco entra al panel; al cerrar, vuelve a donde estaba.
  useEffect(() => {
    if (!panelAbierto) return;
    const previo = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("[data-cerrar]")?.focus();
    return () => previo?.focus?.();
  }, [panelAbierto]);

  if (!panelAbierto) return null;

  const resumen = resumirCola(estado.items);
  const hayTerminados = estado.items.some(
    (item) => item.estado === "listo" || item.estado === "duplicado" || item.estado === "repetido",
  );

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      evento.stopPropagation();
      cerrarPanel();
      return;
    }
    if (evento.key !== "Tab" || !panel.current) return;
    const elementos = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCALIZABLES));
    if (elementos.length === 0) return;
    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50" onKeyDown={alTeclear}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={cerrarPanel}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-subida"
        className="absolute inset-y-0 right-0 flex w-full max-w-[34rem] flex-col border-l border-line bg-paper shadow-sheet"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="titulo-subida" className="text-base font-semibold text-ink">
              Subir reportes
            </h2>
            <p className="mt-0.5 text-meta text-muted">
              Igual que enviarlos por Telegram: la IA los lee y quedan en la bandeja.
            </p>
          </div>
          <Boton
            variante="fantasma"
            tamano="icono"
            onClick={cerrarPanel}
            aria-label="Cerrar el panel de subida"
            data-cerrar
          >
            <X className="size-4" aria-hidden="true" />
          </Boton>
        </header>

        <div className="scroll-fino flex-1 overflow-y-auto px-5 py-4">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-petrol-300 bg-raised p-4 text-left hover:bg-petrol-50"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-petrol-50 text-petrol-700"
            >
              <Upload className="size-5" />
            </span>
            <span>
              <span className="block text-body font-medium text-ink">
                Arrastra los archivos o <span className="text-petrol-700">elígelos</span>
              </span>
              <span className="block text-meta text-muted">
                PDF, JPG, PNG o WebP · máx. 10 MB c/u
              </span>
            </span>
          </button>
          <input
            ref={entrada}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label="Elegir archivos de reportes"
            onChange={(evento) => {
              agregarArchivos(Array.from(evento.target.files ?? []));
              // Permite elegir de nuevo el mismo archivo.
              evento.target.value = "";
            }}
          />

          {estado.items.length > 0 ? (
            <>
              <div className="mt-5 mb-2 flex items-baseline justify-between gap-3">
                <h3 className="font-mono text-micro uppercase tracking-label text-faint">
                  {estado.items.length} {estado.items.length === 1 ? "archivo" : "archivos"}
                </h3>
                <p role="status" aria-live="polite" className="text-meta text-muted">
                  {textoResumen(resumen)}
                </p>
              </div>
              <ul className="space-y-2.5">
                {estado.items.map((item) => (
                  <FilaSubida
                    key={item.id}
                    item={item}
                    onQuitar={quitar}
                    onReintentar={reintentar}
                    onCambioNumero={establecerNumero}
                    onNavegar={cerrarPanel}
                  />
                ))}
              </ul>
              {hayTerminados ? (
                <div className="mt-3">
                  <Boton variante="fantasma" tamano="sm" onClick={limpiarTerminados}>
                    Limpiar terminados
                  </Boton>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <p className="text-meta text-muted">Puedes cerrar este panel: la subida sigue.</p>
          <Boton variante="secundario" onClick={cerrarPanel}>
            Cerrar
          </Boton>
        </footer>
      </div>
    </div>
  );
}
