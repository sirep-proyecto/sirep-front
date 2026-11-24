/**
 * Responsabilidad: hablar con `/configuracion/ia/mi-clave` del backend de SIREP:
 * la clave de Gemini propia de cada cuenta, con la que se leen los reportes que
 * esa persona sube desde la página.
 * Existe porque Gemini limita las lecturas por minuto por proyecto de Google: con
 * una clave propia (creada en la cuenta propia) cada persona tiene su propio cupo.
 * La clave nunca vuelve del backend: solo sus 4 últimos caracteres.
 */

import { apiClient } from "@/lib/api";

export interface EstadoMiClave {
  disponible: boolean;
  configurada: boolean;
  final: string | null;
  modelo: string;
  activa: boolean;
  lecturas: number;
  ultimo_uso_en: string | null;
  ultimo_error: string | null;
  ultimo_error_en: string | null;
  ilegible: boolean;
  modelo_por_defecto: string;
}

export type CupoModelo = "gratuito" | "sin_cupo_gratuito" | "limite_alcanzado" | "no_disponible" | "sin_probar";

export interface ModeloConCupo {
  id: string;
  cupo: CupoModelo;
  por_defecto: boolean;
}

export interface ClaveDeUsuario {
  usuario_id: string;
  nombre: string | null;
  usuario: string | null;
  rol: string | null;
  final: string | null;
  modelo: string;
  activa: boolean;
  lecturas: number;
  ultimo_uso_en: string | null;
  ultimo_error: string | null;
  ultimo_error_en: string | null;
}

export function leerMiClave(): Promise<EstadoMiClave> {
  return apiClient.get<EstadoMiClave>("/configuracion/ia/mi-clave", { cache: "no-store" });
}

/** Guarda la clave y/o el modelo. Una clave nueva la prueba el backend antes de guardarla. */
export function guardarMiClave(cambio: { clave?: string; modelo?: string; activa?: boolean }): Promise<EstadoMiClave> {
  return apiClient.put<EstadoMiClave>("/configuracion/ia/mi-clave", cambio, { timeoutMs: 25000 });
}

export function quitarMiClave(): Promise<EstadoMiClave> {
  return apiClient.delete<EstadoMiClave>("/configuracion/ia/mi-clave", { timeoutMs: 15000 });
}

export function probarMiClave(datos: { clave?: string; modelo?: string }) {
  return apiClient.post<{ ok: boolean; mensaje: string }>("/configuracion/ia/mi-clave/probar", datos, {
    timeoutMs: 25000,
  });
}

/** Modelos de la clave y si tienen cupo gratuito. Hace una prueba mínima por modelo: tarda unos segundos. */
export function modelosMiClave(datos: { clave?: string }) {
  return apiClient.post<{ ok: boolean; modelos: ModeloConCupo[]; mensaje: string }>(
    "/configuracion/ia/mi-clave/modelos",
    datos,
    { timeoutMs: 90000 },
  );
}

/** Solo administrador: quién tiene clave propia y su estado (nunca las claves). */
export function leerClavesDeUsuarios(): Promise<ClaveDeUsuario[]> {
  return apiClient.get<ClaveDeUsuario[]>("/configuracion/ia/claves-usuarios", { cache: "no-store" });
}

export const ETIQUETA_CUPO: Record<CupoModelo, string> = {
  gratuito: "gratuito",
  limite_alcanzado: "gratuito · límite alcanzado por ahora",
  sin_probar: "no se pudo comprobar ahora",
  sin_cupo_gratuito: "de pago",
  no_disponible: "sin acceso",
};

/** Texto de una opción del selector de modelos: "gemini-3.5-flash-lite · gratuito · recomendado". */
export function textoOpcionModelo(m: ModeloConCupo): string {
  return [m.id, ETIQUETA_CUPO[m.cupo], m.por_defecto ? "recomendado" : null].filter(Boolean).join(" · ");
}

/** Un modelo de pago o sin acceso no se ofrece para elegir: la lectura fallaría o cobraría. */
export function sePuedeElegir(m: ModeloConCupo): boolean {
  return m.cupo !== "sin_cupo_gratuito" && m.cupo !== "no_disponible";
}

/** Resumen corto del estado de la clave para la cabecera. */
export function describirMiClave(e: EstadoMiClave): string {
  if (!e.configurada) return "Sin clave propia: tus reportes se leen con la clave de la empresa.";
  if (e.ilegible) return "Tu clave guardada ya no se puede usar: vuelve a pegarla.";
  if (!e.activa) return `Clave ••••${e.final ?? ""} pausada: tus reportes se leen con la clave de la empresa.`;
  return `Clave ••••${e.final ?? ""} activa: tus reportes se leen con tu propio cupo de Gemini.`;
}
