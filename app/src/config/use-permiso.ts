/**
 * Responsabilidad: leer en un componente si la cuenta activa tiene un permiso,
 * y volver a pintar cuando cambia la sesión (otro inicio de sesión o permisos
 * actualizados por un administrador).
 */

"use client";

import { useSyncExternalStore } from "react";

import { obtenerUsuarioSesion, suscribirSesion } from "@/config/sesion";

export function usePermiso(permiso: string): boolean {
  return useSyncExternalStore(
    suscribirSesion,
    () => obtenerUsuarioSesion()?.permisos.includes(permiso) ?? false,
    () => false,
  );
}
