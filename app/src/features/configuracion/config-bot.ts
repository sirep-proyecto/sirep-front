/**
 * Responsabilidad: hablar con `/configuracion/bot` del backend de SIREP.
 * El backend comprueba que la dirección escrita llegue a él mismo antes de
 * conectar el bot; aquí solo se muestra y se pide.
 */

import { apiClient, ApiError } from "@/lib/api";

export interface EstadoBot {
  configurado: boolean;
  bot: { usuario: string | null; nombre: string | null } | null;
  conectado: boolean;
  url_webhook: string | null;
  direccion_actual: string | null;
  direccion_sugerida: string | null;
  ruta_webhook: string;
  mensajes_pendientes: number;
  ultimo_error: string | null;
  ultimo_error_en: string | null;
  puede_cambiar: boolean;
}

export function leerEstadoBot(): Promise<EstadoBot> {
  return apiClient.get<EstadoBot>("/configuracion/bot", { cache: "no-store" });
}

// Conectar incluye comprobar la dirección y hablar con Telegram: se da más tiempo.
export function conectarBot(url: string): Promise<EstadoBot> {
  return apiClient.put<EstadoBot>("/configuracion/bot", { url }, { timeoutMs: 25000 });
}

export function desconectarBot(): Promise<EstadoBot> {
  return apiClient.delete<EstadoBot>("/configuracion/bot", { timeoutMs: 15000 });
}

/** Misma limpieza que hace el backend: sin espacios, sin "/" final ni la ruta del webhook. */
export function limpiarDireccion(texto: string, rutaWebhook = "/telegram/webhook"): string {
  const t = texto.trim().replace(/\/+$/, "");
  return t.endsWith(rutaWebhook) ? t.slice(0, -rutaWebhook.length) : t;
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data as { message?: string | string[] } | undefined;
    const m = Array.isArray(data?.message) ? data?.message.join(" ") : data?.message;
    return m || error.message;
  }
  return error instanceof Error ? error.message : "No se pudo completar la acción.";
}
