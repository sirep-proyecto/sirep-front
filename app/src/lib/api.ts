/**
 * Cliente HTTP centralizado para comunicarse con el backend de SIREP (NestJS).
 * Usa `fetch` nativo y toma por defecto `process.env.NEXT_PUBLIC_API_URL`.
 * SIREP-S3-T04: Adjunta automáticamente el token Bearer de la sesión activa.
 */

import {
  cerrarSesion,
  guardarSesion,
  obtenerTokenSesion,
  type UsuarioActual,
} from "@/config/sesion";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_TIMEOUT_MS = 8000;

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL
).replace(/\/$/, "");

export interface HealthResponse {
  status: "ok" | string;
  timestamp: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, "signal"> {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Ejecuta una petición HTTP hacia el backend con soporte para timeout, token Bearer y manejo de errores.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    signal,
    ...restOptions
  } = options;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Si el llamador pasó su propio AbortSignal, propagamos su cancelación
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError("La solicitud fue cancelada.", 0);
    }
    signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    const isFormData =
      typeof FormData !== "undefined" && restOptions.body instanceof FormData;
    const token = obtenerTokenSesion();

    const response = await fetch(url, {
      ...restOptions,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401 && !path.startsWith("/auth/login")) {
        cerrarSesion();
      }
      const errorMessage =
        typeof body === "object" && body !== null && "message" in body
          ? String((body as { message: unknown }).message)
          : `Error HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        `Tiempo de espera agotado (${timeoutMs}ms) al conectar con ${url}`,
        408,
      );
    }
    throw new ApiError(
      error instanceof Error
        ? `Error de red al conectar con el backend: ${error.message}`
        : "Error de red desconocido al conectar con el backend",
      0,
    );
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", onExternalAbort);
    }
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};

export interface RespuestaLogin {
  access_token: string;
  token_type: "bearer";
  usuario: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
}

/**
 * SIREP-S3-T04: Autentica al usuario contra `POST /auth/login` y persiste su sesión.
 */
export async function iniciarSesionApi(
  identificador: string,
  password: string,
): Promise<UsuarioActual> {
  const respuesta = await apiClient.post<RespuestaLogin>("/auth/login", {
    usuario: identificador.trim(),
    email: identificador.trim(),
    password,
  });

  return guardarSesion(respuesta.access_token, respuesta.usuario);
}

/**
 * SIREP-S3-T05: Descarga el archivo Excel (`.xlsx` o `.csv`) con todos los reportes
 * y los 10 campos vitales primero desde el backend protegido.
 */
export async function descargarExcelReportes(
  formato: "xlsx" | "csv" = "xlsx",
): Promise<void> {
  const token = obtenerTokenSesion();
  const url = `${API_BASE_URL}/reportes/exportar/excel?formato=${formato}`;

  const response = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    if (response.status === 401) {
      cerrarSesion();
    }
    throw new ApiError(
      `No se pudo exportar el Excel (HTTP ${response.status})`,
      response.status,
    );
  }

  const blob = await response.blob();
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `reportes_sirep_${fechaHoy}.${formato}`;

  const blobUrl = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = blobUrl;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Pide al backend el PDF del reporte (mismo formato que el reporte técnico de RP-TECH,
 * con los valores ya corregidos) y lo devuelve como Blob. Falla con `ApiError` si el
 * servidor responde con error, para que quien llama pueda avisar a la persona.
 */
export async function obtenerPdfReporte(numero: string): Promise<Blob> {
  const token = obtenerTokenSesion();
  const url = `${API_BASE_URL}/reportes/${encodeURIComponent(numero)}/pdf`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error
        ? `Error de red al descargar el PDF: ${error.message}`
        : "Error de red al descargar el PDF",
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      cerrarSesion();
    }
    let detalle = "";
    try {
      const cuerpo = (await response.json()) as { message?: unknown };
      if (typeof cuerpo?.message === "string") detalle = cuerpo.message;
    } catch {
      // El cuerpo no es JSON: se usa el mensaje genérico.
    }
    throw new ApiError(
      detalle || `No se pudo generar el PDF (HTTP ${response.status})`,
      response.status,
    );
  }

  return response.blob();
}

/**
 * Verifica la conectividad con el backend consultando `GET /health`.
 * Captura errores de red o timeout y retorna un resultado seguro o lanza según se requiera.
 */
export async function checkBackendHealth(
  timeoutMs = 5000,
): Promise<{
  online: boolean;
  status: string;
  timestamp: string | null;
  error?: string;
}> {
  try {
    const data = await apiClient.get<HealthResponse>("/health", {
      timeoutMs,
      cache: "no-store",
    });

    return {
      online: data.status === "ok",
      status: data.status,
      timestamp: data.timestamp ?? new Date().toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo conectar con el servidor backend.";
    return {
      online: false,
      status: "error",
      timestamp: null,
      error: message,
    };
  }
}
