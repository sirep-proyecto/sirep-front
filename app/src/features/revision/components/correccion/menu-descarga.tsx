/**
 * Responsabilidad: botón con menú desplegable (por hover y clic accesible)
 * para descargar la transcripción técnica en PDF, Markdown o ambos formatos.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileCode, Files, FileText, Loader2 } from "lucide-react";

import { Boton } from "@/components/ui/boton";

export type FormatoDescarga = "pdf" | "markdown" | "ambos";

interface MenuDescargaProps {
  onDescargar: (formato: FormatoDescarga) => Promise<void> | void;
  className?: string;
}

export function MenuDescarga({ onDescargar, className }: MenuDescargaProps) {
  const [abierto, setAbierto] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const temporizadorCierre = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abrirMenu = () => {
    if (temporizadorCierre.current) {
      clearTimeout(temporizadorCierre.current);
      temporizadorCierre.current = null;
    }
    setAbierto(true);
  };

  const cerrarMenuConRetardo = () => {
    temporizadorCierre.current = setTimeout(() => {
      setAbierto(false);
    }, 200);
  };

  const alternarMenu = () => {
    setAbierto((prev) => !prev);
  };

  const handleSeleccionar = async (formato: FormatoDescarga) => {
    setAbierto(false);
    try {
      setDescargando(true);
      await onDescargar(formato);
    } finally {
      setDescargando(false);
    }
  };

  // Cierre al hacer clic fuera o presionar Escape
  useEffect(() => {
    function manejarClickAfuera(event: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    }

    function manejarEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    }

    if (abierto) {
      document.addEventListener("mousedown", manejarClickAfuera);
      document.addEventListener("keydown", manejarEscape);
    }
    return () => {
      document.removeEventListener("mousedown", manejarClickAfuera);
      document.removeEventListener("keydown", manejarEscape);
      if (temporizadorCierre.current) clearTimeout(temporizadorCierre.current);
    };
  }, [abierto]);

  return (
    <div
      ref={contenedorRef}
      className={`relative inline-block text-left ${className ?? ""}`}
      onMouseEnter={abrirMenu}
      onMouseLeave={cerrarMenuConRetardo}
    >
      <Boton
        variante="secundario"
        tamano="sm"
        onClick={alternarMenu}
        aria-haspopup="menu"
        aria-expanded={abierto}
        disabled={descargando}
        aria-label="Opciones de descarga del reporte"
        className="gap-1.5"
      >
        {descargando ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-3.5" aria-hidden="true" />
        )}
        <span>Descargar</span>
        <ChevronDown
          className={`size-3 text-muted transition-transform duration-150 ${
            abierto ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </Boton>

      {abierto ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-line bg-raised p-1.5 shadow-lift focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1.5 text-micro font-semibold uppercase tracking-label text-faint">
            Opciones de transcripción
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSeleccionar("pdf")}
            className="flex w-full items-start gap-2.5 rounded-sm px-2.5 py-2 text-left text-meta text-ink transition-colors hover:bg-petrol-50 hover:text-petrol-800 focus:bg-petrol-50 focus:text-petrol-800"
          >
            <FileText className="mt-0.5 size-4 shrink-0 text-petrol-600" aria-hidden="true" />
            <div>
              <p className="font-medium">PDF (.pdf)</p>
              <p className="text-micro text-muted">Documento formal en blanco y negro</p>
            </div>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSeleccionar("markdown")}
            className="flex w-full items-start gap-2.5 rounded-sm px-2.5 py-2 text-left text-meta text-ink transition-colors hover:bg-petrol-50 hover:text-petrol-800 focus:bg-petrol-50 focus:text-petrol-800"
          >
            <FileCode className="mt-0.5 size-4 shrink-0 text-petrol-600" aria-hidden="true" />
            <div>
              <p className="font-medium">Markdown (.md)</p>
              <p className="text-micro text-muted">Transcripción en texto plano estructurado</p>
            </div>
          </button>

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSeleccionar("ambos")}
            className="flex w-full items-start gap-2.5 rounded-sm px-2.5 py-2 text-left text-meta text-ink transition-colors hover:bg-petrol-50 hover:text-petrol-800 focus:bg-petrol-50 focus:text-petrol-800"
          >
            <Files className="mt-0.5 size-4 shrink-0 text-petrol-700" aria-hidden="true" />
            <div>
              <p className="font-medium">Ambos (.pdf + .md)</p>
              <p className="text-micro text-muted">Descarga el PDF y el Markdown juntos</p>
            </div>
          </button>
        </div>
      ) : null}
    </div>
  );
}

