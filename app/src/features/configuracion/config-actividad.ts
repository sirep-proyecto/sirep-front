/**
 * Responsabilidad: leer de `/usuarios/actividad` la bitácora de lo que hizo cada cuenta.
 */

import { apiClient } from "@/lib/api";

export interface RegistroActividad {
  id: number;
  usuario_id: string | null;
  usuario: string;
  accion: string;
  detalle: Record<string, unknown>;
  creado_en: string;
}

export interface FiltroActividad {
  usuarioId?: string;
  accion?: string;
  limite?: number;
}

export function leerActividad(filtro: FiltroActividad = {}): Promise<RegistroActividad[]> {
  const parametros = new URLSearchParams();
  parametros.set("limite", String(filtro.limite ?? 200));
  if (filtro.usuarioId) parametros.set("usuario_id", filtro.usuarioId);
  if (filtro.accion) parametros.set("accion", filtro.accion);
  return apiClient.get<RegistroActividad[]>(`/usuarios/actividad?${parametros.toString()}`, {
    cache: "no-store",
  });
}

export const ACCIONES_ACTIVIDAD: Record<string, string> = {
  sesion_iniciada: "Inició sesión",
  campo_revisado: "Revisó un campo",
  reporte_cerrado: "Cerró un reporte",
  lote_cerrado: "Cerró reportes en lote",
  vinculos_actualizados: "Vinculó cliente o equipo",
  escaneo_subido: "Subió un reporte",
  excel_exportado: "Exportó a Excel",
  bot_conectado: "Conectó el bot",
  bot_desconectado: "Desconectó el bot",
  ia_configurada: "Cambió la lectura con IA",
  ia_clave_quitada: "Quitó una clave de IA",
  cuenta_creada: "Creó una cuenta",
  cuenta_actualizada: "Cambió una cuenta",
  cuenta_eliminada: "Eliminó una cuenta",
};

const VERBOS_REVISION: Record<string, string> = {
  confirmar: "Confirmó",
  corregir: "Corrigió",
  ilegible: "Marcó ilegible",
  omitir: "Omitió",
  reabrir: "Reabrió",
};

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

/** Frase corta con el detalle de un registro (reporte, campo, cuenta afectada…). */
export function describirDetalle(registro: RegistroActividad): string {
  const d = registro.detalle ?? {};
  switch (registro.accion) {
    case "campo_revisado": {
      const verbo = VERBOS_REVISION[texto(d.tipo)] ?? "Revisó";
      return `${verbo} «${texto(d.campo)}» del reporte N° ${texto(d.reporte)}`;
    }
    case "reporte_cerrado":
    case "vinculos_actualizados":
    case "escaneo_subido":
      return texto(d.reporte) ? `Reporte N° ${texto(d.reporte)}` : "";
    case "bot_conectado":
      return texto(d.url);
    case "ia_configurada": {
      const nombre = texto(d.proveedor) === "openai" ? "ChatGPT" : texto(d.proveedor) === "gemini" ? "Gemini" : "";
      return [nombre, d.clave_nueva ? "clave nueva" : ""].filter(Boolean).join(" · ");
    }
    case "ia_clave_quitada":
      return texto(d.proveedor) === "openai" ? "ChatGPT" : texto(d.proveedor) === "gemini" ? "Gemini" : "";
    case "cuenta_creada":
      return `Cuenta «${texto(d.usuario)}» (${texto(d.rol)})`;
    case "cuenta_actualizada": {
      const cambios = Array.isArray(d.cambios) ? d.cambios.join(", ") : "";
      const clave = d.contrasena_cambiada ? " · contraseña restablecida" : "";
      return `Cuenta «${texto(d.usuario)}»${cambios ? ` · ${cambios}` : ""}${clave}`;
    }
    case "cuenta_eliminada":
      return `Cuenta «${texto(d.usuario)}»`;
    default:
      return "";
  }
}
