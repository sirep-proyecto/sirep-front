/**
 * Responsabilidad: gestionar la sesión autenticada del revisor (SIREP-S3-T04)
 * e identificar a quien firma cada revisión de campo.
 */

export interface UsuarioActual {
  id: string;
  email?: string;
  nombre: string;
  iniciales: string;
  rol: string;
}

interface SesionAlmacenada {
  token: string;
  usuario: UsuarioActual;
}

const CLAVE_STORAGE = "sirep_sesion_v1";

export function calcularIniciales(nombre: string): string {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "");
  return letras.join("") || "R";
}

const NOMBRE_FALLBACK =
  process.env.NEXT_PUBLIC_REVISOR_NOMBRE?.trim() || "Revisor";

const USUARIO_POR_DEFECTO: UsuarioActual = {
  id: "revisor-local",
  nombre: NOMBRE_FALLBACK,
  iniciales: calcularIniciales(NOMBRE_FALLBACK),
  rol: "Revisión técnica",
};

let sesionEnMemoria: SesionAlmacenada | null = null;
const oyentes = new Set<() => void>();

function notificarCambio() {
  for (const fn of oyentes) {
    fn();
  }
}

function leerSesionStorage(): SesionAlmacenada | null {
  if (sesionEnMemoria) return sesionEnMemoria;
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_STORAGE);
    if (!crudo) return null;
    const parsed = JSON.parse(crudo) as SesionAlmacenada;
    if (!parsed?.token || !parsed?.usuario?.nombre) return null;
    sesionEnMemoria = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function obtenerTokenSesion(): string | null {
  return leerSesionStorage()?.token ?? null;
}

export function obtenerUsuarioSesion(): UsuarioActual | null {
  return leerSesionStorage()?.usuario ?? null;
}

export function guardarSesion(
  token: string,
  datos: { id: string; email?: string; nombre: string; rol?: string },
): UsuarioActual {
  const nombreLimpio = datos.nombre.trim() || datos.email || "Revisor";
  const usuario: UsuarioActual = {
    id: datos.id,
    email: datos.email,
    nombre: nombreLimpio,
    iniciales: calcularIniciales(nombreLimpio),
    rol: datos.rol?.trim() || "Revisión técnica",
  };
  sesionEnMemoria = { token, usuario };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        CLAVE_STORAGE,
        JSON.stringify(sesionEnMemoria),
      );
    } catch {
      // Si localStorage está bloqueado, se mantiene en memoria.
    }
  }
  notificarCambio();
  return usuario;
}

export function cerrarSesion(): void {
  sesionEnMemoria = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(CLAVE_STORAGE);
    } catch {
      // Ignorar errores de acceso a storage
    }
  }
  notificarCambio();
}

export function suscribirSesion(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/**
 * Objeto dinámico compatible con el código existente (`USUARIO_ACTUAL.nombre`, etc.).
 * Devuelve siempre los datos del usuario autenticado en la sesión activa.
 */
export const USUARIO_ACTUAL: UsuarioActual = {
  get id() {
    return leerSesionStorage()?.usuario.id ?? USUARIO_POR_DEFECTO.id;
  },
  get email() {
    return leerSesionStorage()?.usuario.email;
  },
  get nombre() {
    return leerSesionStorage()?.usuario.nombre ?? USUARIO_POR_DEFECTO.nombre;
  },
  get iniciales() {
    return (
      leerSesionStorage()?.usuario.iniciales ?? USUARIO_POR_DEFECTO.iniciales
    );
  },
  get rol() {
    return leerSesionStorage()?.usuario.rol ?? USUARIO_POR_DEFECTO.rol;
  },
};
