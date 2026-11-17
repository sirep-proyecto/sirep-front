/**
 * Responsabilidad: detectar que se arrastran archivos sobre la ventana y
 * entregarlos al soltar.
 * Existe como hook porque `dragenter`/`dragleave` se disparan por cada hijo que
 * se cruza: un contador evita el parpadeo del aviso. Solo reacciona a archivos
 * (no a texto o enlaces arrastrados).
 */

"use client";

import { useEffect, useRef, useState } from "react";

function traeArchivos(evento: DragEvent): boolean {
  return Array.from(evento.dataTransfer?.types ?? []).includes("Files");
}

export function useArrastreArchivos(alSoltar: (archivos: File[]) => void): boolean {
  const [arrastrando, setArrastrando] = useState(false);
  const contador = useRef(0);
  const manejador = useRef(alSoltar);
  useEffect(() => {
    manejador.current = alSoltar;
  }, [alSoltar]);

  useEffect(() => {
    const terminar = () => {
      contador.current = 0;
      setArrastrando(false);
    };
    const entrar = (evento: DragEvent) => {
      if (!traeArchivos(evento)) return;
      evento.preventDefault();
      contador.current += 1;
      setArrastrando(true);
    };
    const sobre = (evento: DragEvent) => {
      if (!traeArchivos(evento)) return;
      // Sin esto el navegador abriría el archivo al soltarlo.
      evento.preventDefault();
      if (evento.dataTransfer) evento.dataTransfer.dropEffect = "copy";
    };
    const salir = (evento: DragEvent) => {
      if (!traeArchivos(evento)) return;
      contador.current = Math.max(0, contador.current - 1);
      if (contador.current === 0) setArrastrando(false);
    };
    const soltar = (evento: DragEvent) => {
      if (!traeArchivos(evento)) return;
      evento.preventDefault();
      const archivos = Array.from(evento.dataTransfer?.files ?? []);
      terminar();
      if (archivos.length > 0) manejador.current(archivos);
    };

    window.addEventListener("dragenter", entrar);
    window.addEventListener("dragover", sobre);
    window.addEventListener("dragleave", salir);
    window.addEventListener("drop", soltar);
    window.addEventListener("dragend", terminar);
    window.addEventListener("blur", terminar);
    return () => {
      window.removeEventListener("dragenter", entrar);
      window.removeEventListener("dragover", sobre);
      window.removeEventListener("dragleave", salir);
      window.removeEventListener("drop", soltar);
      window.removeEventListener("dragend", terminar);
      window.removeEventListener("blur", terminar);
    };
  }, []);

  return arrastrando;
}
