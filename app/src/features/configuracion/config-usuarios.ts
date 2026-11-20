/**
 * Responsabilidad: hablar con `/usuarios` del backend de SIREP, donde un
 * administrador crea cuentas y decide qué puede hacer cada una.
 */

import { apiClient } from "@/lib/api";

export type RolUsuario =
  | "administrador"
  | "ingestor"
  | "revisor"
  | "admin"
  | "supervisor"
  | "operador";

export interface PermisoDefinicion {
  id: string;
  etiqueta: string;
  descripcion: string;
  soloAdmin?: boolean;
}

export interface RolDefinicion {
  id: RolUsuario;
  etiqueta: string;
  permisos_por_defecto: string[];
}

export interface CuentaUsuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  roles?: RolUsuario[];
  permisos: string[];
  activo: boolean;
  creado_por: string | null;
  creado_en: string;
  ultimo_acceso: string | null;
}

export interface ListadoUsuarios {
  cuentas: CuentaUsuario[];
  catalogo: { permisos: PermisoDefinicion[]; roles: RolDefinicion[] };
}

export interface NuevaCuenta {
  usuario: string;
  nombre: string;
  password: string;
  rol: RolUsuario;
  roles?: RolUsuario[];
  permisos: string[];
}

export interface CambiosCuenta {
  nombre?: string;
  password?: string;
  rol?: RolUsuario;
  roles?: RolUsuario[];
  permisos?: string[];
  activo?: boolean;
}

export function leerUsuarios(): Promise<ListadoUsuarios> {
  return apiClient.get<ListadoUsuarios>("/usuarios", { cache: "no-store" });
}

export function crearUsuario(datos: NuevaCuenta): Promise<CuentaUsuario> {
  return apiClient.post<CuentaUsuario>("/usuarios", datos, { timeoutMs: 15000 });
}

export function actualizarUsuario(id: string, cambios: CambiosCuenta): Promise<CuentaUsuario> {
  return apiClient.patch<CuentaUsuario>(`/usuarios/${encodeURIComponent(id)}`, cambios, {
    timeoutMs: 15000,
  });
}

export function eliminarUsuario(id: string): Promise<void> {
  return apiClient.delete<void>(`/usuarios/${encodeURIComponent(id)}`, { timeoutMs: 15000 });
}
