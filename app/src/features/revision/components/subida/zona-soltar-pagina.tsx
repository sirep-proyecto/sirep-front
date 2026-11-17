/**
 * Responsabilidad: aviso de pantalla completa "Suelta los reportes aquí" al
 * arrastrar archivos sobre cualquier parte de la bandeja, y entrega de lo
 * soltado a la cola abriendo el panel.
 * El aviso es solo visual (no captura el puntero): el soltar lo recoge la
 * ventana, así no hay parpadeo al cruzar elementos.
 */

"use client";

import { Upload } from "lucide-react";

import { useArrastreArchivos } from "@/features/revision/hooks/use-arrastre-archivos";
import { useSubida } from "@/features/revision/providers/subida-contexto";

export function ZonaSoltarPagina() {
  const { agregarArchivos, abrirPanel } = useSubida();
  const arrastrando = useArrastreArchivos((archivos) => {
    agregarArchivos(archivos);
    abrirPanel();
  });

  if (!arrastrando) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-3xl flex-col items-center rounded-2xl border-2 border-dashed border-petrol-600 bg-raised/90 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-xl bg-petrol-50 text-petrol-700">
          <Upload className="size-7" />
        </span>
        <p className="mt-6 text-title font-semibold text-ink">Suelta los reportes aquí</p>
        <p className="mt-2 text-base text-muted">
          PDF, JPG, PNG o WebP · uno o varios a la vez · se suben y la IA los lee uno por uno
        </p>
      </div>
    </div>
  );
}
