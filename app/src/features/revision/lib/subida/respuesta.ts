/**
 * Responsabilidad: traducir lo que responde el backend al subir un escaneo
 * (éxito, 409 de duplicado, errores con código, fallos de red) en estados y
 * textos para la persona.
 * Existe para que la regla "mostrar siempre `message` si viene; si no, un texto
 * en español" y el manejo del 409 viejo (solo `message`) vivan en un único
 * lugar probado, y no repartidos por los componentes.
 */

import { formatearNumeroReporte } from "@/features/revision/lib/formato";

import type {
  CodigoDuplicado,
  FalloSubida,
  InfoDuplicado,
  RespuestaUpload,
} from "./tipos";

/** Errores que se repiten igual si se reenvía el mismo archivo. */
const CODIGOS_NO_REINTENTABLES = [
  "formato_no_admitido",
  "demasiadas_paginas",
  "archivo_danado",
  "muy_grande",
  "falta_archivo",
];

const TEXTOS_POR_CODIGO: Record<string, string> = {
  formato_no_admitido: "Formato no admitido · solo PDF, JPG, PNG o WebP",
  demasiadas_paginas: "El PDF tiene demasiadas páginas (máximo 4)",
  archivo_danado: "El archivo está dañado y no se pudo abrir",
  muy_grande: "El archivo supera el máximo de 10 MB",
  falta_archivo: "No se recibió ningún archivo. Vuelve a elegirlo",
  lectura_ia: "La IA no pudo leer el reporte. Vuelve a intentarlo",
};

function comoObjeto(cuerpo: unknown): Record<string, unknown> | null {
  return typeof cuerpo === "object" && cuerpo !== null && !Array.isArray(cuerpo)
    ? (cuerpo as Record<string, unknown>)
    : null;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : undefined;
}

/** Nest puede devolver `message` como arreglo (validaciones): se unen en un texto. */
function mensajeDelCuerpo(cuerpo: unknown): string | undefined {
  const objeto = comoObjeto(cuerpo);
  if (!objeto) return texto(cuerpo);
  const mensaje = objeto.message;
  if (Array.isArray(mensaje)) {
    const partes = mensaje.map(texto).filter((parte): parte is string => !!parte);
    return partes.length > 0 ? partes.join(" · ") : undefined;
  }
  return texto(mensaje);
}

function textoGenerico(status: number): string {
  if (status === 0) return "No se pudo conectar con el servidor. Revisa tu conexión";
  if (status === 408) return "La IA tardó demasiado en responder. Vuelve a intentarlo";
  if (status === 401) return "Tu sesión expiró. Inicia sesión de nuevo";
  if (status === 413) return TEXTOS_POR_CODIGO.muy_grande;
  if (status >= 500) return "El servidor no pudo procesar el archivo. Vuelve a intentarlo";
  return "No se pudo subir el archivo";
}

export function esDuplicado(status: number, cuerpo: unknown): boolean {
  const codigo = texto(comoObjeto(cuerpo)?.codigo);
  return (
    status === 409 || codigo === "archivo_duplicado" || codigo === "reporte_duplicado"
  );
}

/** Lee el cuerpo de un 409; tolera la forma vieja `{ message }` sin código. */
export function leerDuplicado(cuerpo: unknown): InfoDuplicado {
  const objeto = comoObjeto(cuerpo);
  const codigoCrudo = texto(objeto?.codigo);
  const codigo: CodigoDuplicado =
    codigoCrudo === "archivo_duplicado" || codigoCrudo === "reporte_duplicado"
      ? codigoCrudo
      : "desconocido";
  const numero = objeto?.numeroReporte;
  return {
    codigo,
    mensaje: mensajeDelCuerpo(cuerpo),
    numeroReporte:
      texto(numero) ?? (typeof numero === "number" ? String(numero) : undefined),
    escaneoId: texto(objeto?.escaneoId),
    recibidoEn: texto(objeto?.recibidoEn),
    enviadoPor: texto(objeto?.enviadoPor),
    origen: texto(objeto?.origen),
  };
}

export function leerFallo(status: number, cuerpo: unknown): FalloSubida {
  const codigo = texto(comoObjeto(cuerpo)?.codigo);
  const mensaje =
    mensajeDelCuerpo(cuerpo) ??
    (codigo ? TEXTOS_POR_CODIGO[codigo] : undefined) ??
    textoGenerico(status);
  const sinRemedio =
    (codigo !== undefined && CODIGOS_NO_REINTENTABLES.includes(codigo)) ||
    status === 413;
  return { mensaje, codigo, reintentable: !sinRemedio };
}

export type ResultadoFallido =
  | { tipo: "duplicado"; info: InfoDuplicado }
  | { tipo: "error"; fallo: FalloSubida };

/** Decide si un fallo HTTP es un duplicado (se avisa en ámbar) o un error. */
export function clasificarFallo(status: number, cuerpo: unknown): ResultadoFallido {
  return esDuplicado(status, cuerpo)
    ? { tipo: "duplicado", info: leerDuplicado(cuerpo) }
    : { tipo: "error", fallo: leerFallo(status, cuerpo) };
}

/** Lo que el backend devuelve como N° cuando la IA no logró leerlo. */
export const NUMERO_SIN_DETECTAR = "Sin N° detectado";

/** El N° real del reporte, o `null` si falta o la IA no lo detectó. */
export function numeroDetectado(respuesta: RespuestaUpload): string | null {
  const numero = respuesta.numeroReporte?.trim();
  if (!numero || numero.toLowerCase() === NUMERO_SIN_DETECTAR.toLowerCase()) return null;
  return numero;
}

/** Normaliza una respuesta 2xx; devuelve `null` si no trae lo mínimo esperado. */
export function leerRespuestaUpload(cuerpo: unknown): RespuestaUpload | null {
  const objeto = comoObjeto(cuerpo);
  if (!objeto) return null;
  const numero = objeto.numeroReporte;
  const paginas = objeto.totalPaginas;
  return {
    escaneoId: texto(objeto.escaneoId) ?? String(objeto.escaneoId ?? ""),
    numeroReporte:
      texto(numero) ?? (typeof numero === "number" ? String(numero) : null),
    estado: texto(objeto.estado) ?? "",
    camposDudosos: Array.isArray(objeto.camposDudosos)
      ? objeto.camposDudosos.filter((campo): campo is string => typeof campo === "string")
      : [],
    totalPaginas: typeof paginas === "number" ? paginas : null,
    claveIa: leerClaveIa(objeto.claveIa),
  };
}

/** `claveIa` de la respuesta, solo si viene bien formada (backends anteriores no la mandan). */
function leerClaveIa(valor: unknown): RespuestaUpload["claveIa"] {
  const objeto = comoObjeto(valor);
  const origen = objeto?.origen;
  if (origen !== "personal" && origen !== "empresa" && origen !== "respaldo_empresa") return null;
  return { origen, aviso: texto(objeto?.aviso) ?? null };
}

/** Interpreta la respuesta cruda de un `XMLHttpRequest`. */
export function interpretarRespuestaHttp(
  status: number,
  textoCuerpo: string,
  tipoContenido: string,
): { ok: true; cuerpo: unknown } | { ok: false; status: number; cuerpo: unknown } {
  let cuerpo: unknown = textoCuerpo;
  if (tipoContenido.includes("application/json")) {
    try {
      cuerpo = JSON.parse(textoCuerpo);
    } catch {
      cuerpo = textoCuerpo;
    }
  }
  return status >= 200 && status < 300
    ? { ok: true, cuerpo }
    : { ok: false, status, cuerpo };
}

/** `"3 campos por revisar"` o `"sin dudas"`. */
export function textoDudas(cantidad: number): string {
  if (cantidad <= 0) return "sin dudas";
  return `${cantidad} ${cantidad === 1 ? "campo" : "campos"} por revisar`;
}

/** Fecha corta de llegada (`10/11`); si no es fecha válida, devuelve el texto tal cual. */
export function formatearFechaCorta(valor: string): string {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/**
 * Texto del aviso ámbar de un duplicado. `titulo` es lo principal; `detalle`
 * aclara qué pasó cuando el backend dio datos.
 */
export function textoDuplicado(info: InfoDuplicado): {
  titulo: string;
  detalle?: string;
} {
  const numero = info.numeroReporte;
  const medio =
    info.origen === "web"
      ? "se subió desde la página"
      : info.origen === "telegram"
        ? "llegó por Telegram"
        : info.enviadoPor
          ? `llegó por ${info.enviadoPor}`
          : null;
  // Si además se conoce quién lo envió por la página, se agrega al medio.
  const quien = info.origen === "web" && info.enviadoPor ? ` (${info.enviadoPor})` : "";
  const llegada = [
    medio ? `${medio}${quien}` : null,
    info.recibidoEn ? `el ${formatearFechaCorta(info.recibidoEn)}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (info.codigo === "archivo_duplicado" && numero) {
    return {
      titulo: `Ya estaba subido · es el reporte ${formatearNumeroReporte(numero)}`,
      detalle: llegada ? `(${llegada})` : undefined,
    };
  }
  if (info.codigo === "reporte_duplicado" && numero) {
    return {
      titulo: `Ya existe un reporte con el ${formatearNumeroReporte(numero)}`,
      detalle: "Puede ser el mismo papel escaneado otra vez",
    };
  }
  return {
    titulo: info.mensaje ?? "Este reporte ya existía",
    detalle: numero ? `Reporte ${formatearNumeroReporte(numero)}` : undefined,
  };
}
