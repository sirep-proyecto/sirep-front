/**
 * Responsabilidad: reglas de validación de un archivo antes de subirlo (tipo,
 * tamaño) y su identidad para detectar repetidos dentro de la misma subida.
 * Existe en el navegador para no gastar red ni lectura de la IA en archivos
 * que el backend rechazaría igual, y para dar el motivo al instante.
 */

import type { DatosArchivo, TipoArchivo } from "./tipos";

export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;
export const MENSAJE_FORMATO = "Formato no admitido · solo PDF, JPG, PNG o WebP";
export const MENSAJE_TAMANO = "El archivo supera el máximo de 10 MB";
export const MENSAJE_VACIO = "El archivo está vacío";

const EXTENSIONES_PDF = ["pdf"];
const EXTENSIONES_IMAGEN = ["jpg", "jpeg", "png", "webp"];
const MIME_PDF = ["application/pdf"];
const MIME_IMAGEN = ["image/jpeg", "image/png", "image/webp"];

function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf(".");
  return punto < 0 ? "" : nombre.slice(punto + 1).toLowerCase();
}

/**
 * Clasifica por extensión y por MIME a la vez: ambos deben coincidir. Algunos
 * navegadores dejan el MIME vacío (por ejemplo en arrastres desde ciertos
 * gestores); en ese caso solo manda la extensión.
 */
export function tipoDeArchivo(datos: Pick<DatosArchivo, "nombre" | "mime">): TipoArchivo {
  const extension = extensionDe(datos.nombre);
  const mime = datos.mime.toLowerCase();

  if (EXTENSIONES_PDF.includes(extension) && (mime === "" || MIME_PDF.includes(mime))) {
    return "pdf";
  }
  if (EXTENSIONES_IMAGEN.includes(extension) && (mime === "" || MIME_IMAGEN.includes(mime))) {
    return "imagen";
  }
  return "otro";
}

/** Devuelve el motivo del rechazo, o `null` si el archivo se puede subir. */
export function motivoRechazo(datos: DatosArchivo): string | null {
  if (tipoDeArchivo(datos) === "otro") return MENSAJE_FORMATO;
  if (datos.tamano <= 0) return MENSAJE_VACIO;
  if (datos.tamano > TAMANO_MAXIMO_BYTES) return MENSAJE_TAMANO;
  return null;
}

/** Identidad barata de un archivo: sirve para repetidos antes de leer su contenido. */
export function claveArchivo(datos: DatosArchivo): string {
  return `${datos.nombre}|${datos.tamano}|${datos.ultimaModificacion}`;
}

const FORMATO_NUMERO = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${FORMATO_NUMERO.format(bytes / (1024 * 1024))} MB`;
}

/** Huella SHA-256 en hexadecimal; `undefined` si el navegador no ofrece `crypto.subtle`. */
export async function calcularHuellaSha256(
  archivo: Pick<Blob, "arrayBuffer">,
): Promise<string | undefined> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return undefined;
  const resumen = await subtle.digest("SHA-256", await archivo.arrayBuffer());
  return Array.from(new Uint8Array(resumen))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
