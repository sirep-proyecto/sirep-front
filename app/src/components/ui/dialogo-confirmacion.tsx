/**
 * Responsabilidad: diálogo modal de confirmación accesible (foco atrapado,
 * Escape para cancelar, foco devuelto al botón que lo abrió).
 * Existe porque `window.confirm` no se puede estilizar ni leer bien con
 * lectores de pantalla, y la bandeja necesita confirmar acciones en lote.
 */

"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import { Boton } from "@/components/ui/boton";

interface DialogoConfirmacionProps {
  titulo: string;
  children: ReactNode;
  textoConfirmar: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function DialogoConfirmacion({
  titulo,
  children,
  textoConfirmar,
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: DialogoConfirmacionProps) {
  const idTitulo = useId();
  const idDescripcion = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("[data-cancelar]")?.focus();
    return () => previo?.focus?.();
  }, []);

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      evento.stopPropagation();
      onCancelar();
      return;
    }
    if (evento.key !== "Tab") return;
    const elementos = panel.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
    if (!elementos || elementos.length === 0) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={alTeclear}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" onClick={onCancelar} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescripcion}
        className="relative w-full max-w-md rounded-lg border border-line bg-paper p-5 shadow-sheet"
      >
        <h2 id={idTitulo} className="text-base font-semibold text-ink">
          {titulo}
        </h2>
        <div id={idDescripcion} className="mt-2 text-body text-muted">
          {children}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton data-cancelar variante="secundario" onClick={onCancelar}>
            {textoCancelar}
          </Boton>
          <Boton variante="primario" onClick={onConfirmar}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
