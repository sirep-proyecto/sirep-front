/**
 * Responsabilidad: tipos del dominio de la subida de reportes (cola de
 * archivos, estados, respuesta del backend).
 * Existe aparte de la cola y de la validación para que la interfaz, el
 * almacén y las pruebas compartan un mismo vocabulario sin importarse entre sí.
 */

/** Dónde está cada archivo en el camino "elegido → leído por la IA". */
export type EstadoSubida =
  | "espera"
  | "validando"
  | "subiendo"
  | "leyendo"
  | "listo"
  | "duplicado"
  /** Igual a otro archivo de la misma subida: no se envía. */
  | "repetido"
  | "error";

export type TipoArchivo = "pdf" | "imagen" | "otro";

/** Lo mínimo que se sabe de un archivo elegido; no se guarda el `File`. */
export interface DatosArchivo {
  nombre: string;
  tamano: number;
  mime: string;
  ultimaModificacion: number;
}

/** Respuesta 2xx de `POST /escaneos/upload`. */
export interface RespuestaUpload {
  escaneoId: string;
  numeroReporte: string | null;
  estado: string;
  camposDudosos: string[];
  totalPaginas?: number | null;
  /** Con qué clave de Gemini se leyó: la propia de quien sube, la de la empresa o la de la empresa porque la propia falló. */
  claveIa?: { origen: "personal" | "empresa" | "respaldo_empresa"; aviso: string | null } | null;
}

export type CodigoDuplicado =
  | "archivo_duplicado"
  | "reporte_duplicado"
  /** Respuesta antigua del backend: solo trae `message`. */
  | "desconocido";

/** Cuerpo del 409; los campos opcionales pueden faltar. */
export interface InfoDuplicado {
  codigo: CodigoDuplicado;
  mensaje?: string;
  numeroReporte?: string;
  escaneoId?: string;
  recibidoEn?: string;
  enviadoPor?: string;
  /** Canal por el que llegó el existente: "telegram" o "web". */
  origen?: string;
}

export interface FalloSubida {
  mensaje: string;
  codigo?: string;
  /** `false` cuando repetir el mismo archivo daría el mismo resultado. */
  reintentable: boolean;
}

export interface ItemSubida extends DatosArchivo {
  id: string;
  tipo: TipoArchivo;
  estado: EstadoSubida;
  /** N° del talonario escrito por la persona; vacío si lo lee la IA. */
  numeroManual: string;
  /** Avance real del envío, de 0 a 1. */
  progreso: number;
  huella?: string;
  resultado?: RespuestaUpload;
  duplicado?: InfoDuplicado;
  fallo?: FalloSubida;
}

export interface EstadoCola {
  items: readonly ItemSubida[];
  /** Cuántos archivos terminaron bien: avisa a la bandeja de que recargue. */
  listos: number;
}
