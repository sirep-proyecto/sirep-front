/**
 * Responsabilidad: hablar con `/configuracion/ia` del backend de SIREP: qué
 * proveedor de IA (Gemini o ChatGPT) lee los reportes, con qué modelo y clave.
 * Las claves nunca vuelven del backend: solo si hay una y sus 4 últimos caracteres.
 */

import { apiClient } from "@/lib/api";

export type ProveedorIa = "gemini" | "openai";
export const PROVEEDORES_IA: ProveedorIa[] = ["gemini", "openai"];

export const NOMBRE_PROVEEDOR: Record<ProveedorIa, string> = { gemini: "Gemini", openai: "ChatGPT" };

export interface EstadoClave {
  configurada: boolean;
  final: string | null;
  origen: "pantalla" | "servidor" | null;
  ilegible?: boolean;
}

export interface EstadoIa {
  proveedor: ProveedorIa;
  modelos: Record<ProveedorIa, string>;
  claves: Record<ProveedorIa, EstadoClave>;
  origen: "pantalla" | "servidor";
  disponible: boolean;
  actualizado_por: string | null;
  actualizado_en: string | null;
  modelos_sugeridos: Record<ProveedorIa, string[]>;
}

export interface CambioIa {
  proveedor: ProveedorIa;
  modelo_gemini?: string;
  modelo_openai?: string;
  clave_gemini?: string;
  clave_openai?: string;
}

export function leerEstadoIa(): Promise<EstadoIa> {
  return apiClient.get<EstadoIa>("/configuracion/ia", { cache: "no-store" });
}

export function guardarIa(cambio: CambioIa): Promise<EstadoIa> {
  return apiClient.put<EstadoIa>("/configuracion/ia", cambio, { timeoutMs: 20000 });
}

export function probarIa(datos: { proveedor: ProveedorIa; modelo: string; clave?: string }) {
  return apiClient.post<{ ok: boolean; mensaje: string }>("/configuracion/ia/probar", datos, { timeoutMs: 25000 });
}

/** Modelos que puede usar la clave (la escrita o, si va vacía, la guardada), según el proveedor. */
export function listarModelosIa(datos: { proveedor: ProveedorIa; clave?: string }) {
  return apiClient.post<{ ok: boolean; modelos: string[]; mensaje: string }>("/configuracion/ia/modelos", datos, {
    timeoutMs: 25000,
  });
}

export function quitarClaveIa(proveedor: ProveedorIa): Promise<EstadoIa> {
  return apiClient.delete<EstadoIa>(`/configuracion/ia/clave/${proveedor}`, { timeoutMs: 15000 });
}

/**
 * Lo que se manda al guardar: solo el modelo y la clave que cambiaron. Una clave
 * vacía no se manda, así el backend deja la que ya tenía guardada.
 */
export function armarCambio(
  proveedor: ProveedorIa,
  modelos: Record<ProveedorIa, string>,
  claves: Record<ProveedorIa, string>,
  estado: EstadoIa,
): CambioIa {
  const cambio: CambioIa = { proveedor };
  for (const p of PROVEEDORES_IA) {
    const modelo = modelos[p].trim();
    if (modelo && modelo !== estado.modelos[p]) cambio[`modelo_${p}`] = modelo;
    const clave = claves[p].trim();
    if (clave) cambio[`clave_${p}`] = clave;
  }
  return cambio;
}

/** Texto corto de la clave guardada: "Guardada ••••1234", "Del servidor ••••1234" o "Sin clave". */
export function describirClave(c: EstadoClave): string {
  if (c.ilegible && !c.configurada) return "La guardada ya no sirve: vuelve a pegarla";
  if (!c.configurada) return "Sin clave";
  const final = c.final ? ` ••••${c.final}` : "";
  return c.origen === "servidor" ? `Del servidor${final}` : `Guardada${final}`;
}
