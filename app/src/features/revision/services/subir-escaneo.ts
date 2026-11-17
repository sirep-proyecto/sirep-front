/**
 * Responsabilidad: enviar un archivo a `POST /escaneos/upload` con progreso
 * real de subida y espera larga para la lectura de la IA.
 * Existe aparte de `apiFetch` porque `fetch` no informa el avance del envío;
 * con `XMLHttpRequest` la barra refleja los bytes subidos. Los fallos salen
 * como `ApiError` con el cuerpo JSON en `data`, igual que el resto del cliente.
 */

import { cerrarSesion, obtenerTokenSesion } from "@/config/sesion";
import { API_BASE_URL, ApiError } from "@/lib/api";
import type { ParametrosEnvio } from "@/features/revision/lib/subida/almacen";
import {
  interpretarRespuestaHttp,
  leerFallo,
  leerRespuestaUpload,
} from "@/features/revision/lib/subida/respuesta";
import type { RespuestaUpload } from "@/features/revision/lib/subida/tipos";

/** La IA tarda ~30-60 s por reporte: se da margen de 3 minutos. */
export const TIEMPO_MAXIMO_SUBIDA_MS = 3 * 60 * 1000;

export function subirEscaneo({
  archivo,
  numeroReporte,
  alProgreso,
  alEnviado,
}: ParametrosEnvio): Promise<RespuestaUpload> {
  return new Promise((resolver, rechazar) => {
    const formulario = new FormData();
    formulario.append("file", archivo, archivo.name);
    if (numeroReporte) formulario.append("numeroReporte", numeroReporte);

    const peticion = new XMLHttpRequest();
    peticion.open("POST", `${API_BASE_URL}/escaneos/upload`);
    peticion.timeout = TIEMPO_MAXIMO_SUBIDA_MS;
    const token = obtenerTokenSesion();
    if (token) peticion.setRequestHeader("Authorization", `Bearer ${token}`);
    peticion.setRequestHeader("Accept", "application/json");

    peticion.upload.onprogress = (evento) => {
      if (evento.lengthComputable && evento.total > 0) {
        alProgreso(evento.loaded / evento.total);
      }
    };
    peticion.upload.onload = () => alEnviado();

    peticion.onload = () => {
      const interpretada = interpretarRespuestaHttp(
        peticion.status,
        peticion.responseText,
        peticion.getResponseHeader("content-type") ?? "",
      );
      if (interpretada.ok) {
        const respuesta = leerRespuestaUpload(interpretada.cuerpo);
        if (respuesta) resolver(respuesta);
        else rechazar(new ApiError("Respuesta inesperada del servidor", 502, interpretada.cuerpo));
        return;
      }
      if (interpretada.status === 401) cerrarSesion();
      rechazar(
        new ApiError(
          leerFallo(interpretada.status, interpretada.cuerpo).mensaje,
          interpretada.status,
          interpretada.cuerpo,
        ),
      );
    };
    peticion.onerror = () => rechazar(new ApiError("Error de red al subir el archivo", 0));
    peticion.ontimeout = () => rechazar(new ApiError("Tiempo de espera agotado", 408));
    peticion.onabort = () => rechazar(new ApiError("La subida fue cancelada", 0));

    peticion.send(formulario);
  });
}
