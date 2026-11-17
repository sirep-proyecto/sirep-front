/**
 * Responsabilidad: reglas puras de la cola de subida —armar los items desde
 * los archivos elegidos, avanzar el estado de cada uno y resumir la cola—.
 * Existe sin React ni red para que cada transición ("repetido", "reintentar",
 * "quitar") se pruebe con datos simples y para que el almacén solo orqueste.
 */

import type {
  DatosArchivo,
  EstadoCola,
  EstadoSubida,
  FalloSubida,
  InfoDuplicado,
  ItemSubida,
  RespuestaUpload,
} from "./tipos";
import { claveArchivo, motivoRechazo, tipoDeArchivo } from "./validacion";

export const COLA_VACIA: EstadoCola = { items: [], listos: 0 };

/** Estados en los que el archivo está en manos de la cola (no se puede quitar). */
const ESTADOS_ACTIVOS: readonly EstadoSubida[] = ["validando", "subiendo", "leyendo"];
/** Estados que ya no cambian solos. */
const ESTADOS_FINALES: readonly EstadoSubida[] = [
  "listo",
  "duplicado",
  "repetido",
  "error",
];

export function estaActivo(item: ItemSubida): boolean {
  return ESTADOS_ACTIVOS.includes(item.estado);
}

export function estaPendiente(item: ItemSubida): boolean {
  return item.estado === "espera" || estaActivo(item);
}

export type AccionCola =
  | { tipo: "agregar"; items: readonly ItemSubida[] }
  | { tipo: "quitar"; id: string }
  | { tipo: "numero"; id: string; valor: string }
  | { tipo: "validando"; id: string }
  | { tipo: "huella"; id: string; huella: string }
  | { tipo: "subiendo"; id: string }
  | { tipo: "progreso"; id: string; fraccion: number }
  | { tipo: "leyendo"; id: string }
  | { tipo: "listo"; id: string; respuesta: RespuestaUpload }
  | { tipo: "duplicado"; id: string; info: InfoDuplicado }
  | { tipo: "fallo"; id: string; fallo: FalloSubida }
  | { tipo: "reintentar"; id: string }
  | { tipo: "limpiar_terminados" };

/**
 * Convierte los archivos elegidos en items. Los que no pasan la validación
 * nacen en "error" (sin reintento) y los que repiten a otro de la subida nacen
 * "repetido": ninguno llega al backend. Los repetidos se detectan por nombre,
 * tamaño y fecha; la huella del contenido se revisa después, al validar.
 */
export function crearItems(
  archivos: readonly DatosArchivo[],
  existentes: readonly ItemSubida[],
  generarId: () => string,
): ItemSubida[] {
  const vistos = new Set(
    existentes.filter(cuentaParaRepetidos).map((item) => claveArchivo(item)),
  );

  return archivos.map((datos) => {
    const base: ItemSubida = {
      ...datos,
      id: generarId(),
      tipo: tipoDeArchivo(datos),
      estado: "espera",
      numeroManual: "",
      progreso: 0,
    };

    const rechazo = motivoRechazo(datos);
    if (rechazo) {
      return {
        ...base,
        estado: "error",
        fallo: { mensaje: rechazo, reintentable: false },
      };
    }

    const clave = claveArchivo(datos);
    if (vistos.has(clave)) return { ...base, estado: "repetido" };
    vistos.add(clave);
    return base;
  });
}

/** Un item ya fallido o repetido no "ocupa" su archivo: se puede volver a elegir. */
function cuentaParaRepetidos(item: ItemSubida): boolean {
  return item.estado !== "error" && item.estado !== "repetido";
}

function actualizar(
  estado: EstadoCola,
  id: string,
  cambio: (item: ItemSubida) => ItemSubida,
): EstadoCola {
  let tocado = false;
  const items = estado.items.map((item) => {
    if (item.id !== id) return item;
    tocado = true;
    return cambio(item);
  });
  return tocado ? { ...estado, items } : estado;
}

/** ¿Hay otro item anterior, aún válido, con el mismo contenido? */
function repiteHuella(items: readonly ItemSubida[], id: string, huella: string): boolean {
  const posicion = items.findIndex((item) => item.id === id);
  return items
    .slice(0, posicion)
    .some((otro) => otro.huella === huella && cuentaParaRepetidos(otro));
}

export function reducirCola(estado: EstadoCola, accion: AccionCola): EstadoCola {
  switch (accion.tipo) {
    case "agregar": {
      // Con la cola ociosa, lo que ya salió bien se retira: la lista nueva
      // arranca limpia y "2/5" no cuenta reportes de una subida anterior.
      const ociosa = !estado.items.some(estaPendiente);
      const conservados = ociosa
        ? estado.items.filter((item) => item.estado !== "listo")
        : estado.items;
      return { ...estado, items: [...conservados, ...accion.items] };
    }

    case "quitar":
      return {
        ...estado,
        items: estado.items.filter((item) => item.id !== accion.id || estaActivo(item)),
      };

    case "numero":
      return actualizar(estado, accion.id, (item) =>
        item.estado === "espera" ? { ...item, numeroManual: accion.valor } : item,
      );

    case "validando":
      return actualizar(estado, accion.id, (item) => ({
        ...item,
        estado: "validando",
        progreso: 0,
      }));

    case "huella":
      return actualizar(estado, accion.id, (item) => ({
        ...item,
        huella: accion.huella,
        estado: repiteHuella(estado.items, accion.id, accion.huella)
          ? "repetido"
          : item.estado,
      }));

    case "subiendo":
      return actualizar(estado, accion.id, (item) => ({
        ...item,
        estado: "subiendo",
        progreso: 0,
      }));

    case "progreso":
      return actualizar(estado, accion.id, (item) =>
        item.estado === "subiendo"
          ? { ...item, progreso: Math.min(1, Math.max(0, accion.fraccion)) }
          : item,
      );

    case "leyendo":
      return actualizar(estado, accion.id, (item) => ({
        ...item,
        estado: "leyendo",
        progreso: 1,
      }));

    case "listo": {
      const conItem = actualizar(estado, accion.id, (item) => ({
        ...item,
        estado: "listo",
        progreso: 1,
        resultado: accion.respuesta,
      }));
      return { ...conItem, listos: estado.listos + 1 };
    }

    case "duplicado":
      return actualizar(estado, accion.id, (item) => ({
        ...item,
        estado: "duplicado",
        duplicado: accion.info,
      }));

    case "fallo":
      return actualizar(estado, accion.id, (item) => ({
        ...item,
        estado: "error",
        fallo: accion.fallo,
      }));

    case "reintentar":
      return actualizar(estado, accion.id, (item) =>
        item.estado === "error" && item.fallo?.reintentable
          ? { ...item, estado: "espera", progreso: 0, fallo: undefined }
          : item,
      );

    case "limpiar_terminados":
      return {
        ...estado,
        items: estado.items.filter(
          (item) =>
            item.estado === "error" ||
            !ESTADOS_FINALES.includes(item.estado),
        ),
      };
  }
}

/** El siguiente archivo a procesar, o `null` si no toca (ya hay uno activo o no queda ninguno). */
export function siguienteEnEspera(items: readonly ItemSubida[]): ItemSubida | null {
  if (items.some(estaActivo)) return null;
  return items.find((item) => item.estado === "espera") ?? null;
}

export interface ResumenCola {
  total: number;
  listos: number;
  leyendo: number;
  espera: number;
  existian: number;
  errores: number;
}

export function resumirCola(items: readonly ItemSubida[]): ResumenCola {
  const resumen: ResumenCola = {
    total: items.length,
    listos: 0,
    leyendo: 0,
    espera: 0,
    existian: 0,
    errores: 0,
  };
  for (const item of items) {
    if (item.estado === "listo") resumen.listos += 1;
    else if (estaActivo(item)) resumen.leyendo += 1;
    else if (item.estado === "espera") resumen.espera += 1;
    else if (item.estado === "duplicado" || item.estado === "repetido") resumen.existian += 1;
    else resumen.errores += 1;
  }
  return resumen;
}

/** "2 listos · 1 leyendo · 1 en espera · 1 ya existía · 1 con error"; solo lo que no es cero. */
export function textoResumen(resumen: ResumenCola): string {
  const partes: string[] = [];
  if (resumen.listos > 0) {
    partes.push(`${resumen.listos} ${resumen.listos === 1 ? "listo" : "listos"}`);
  }
  if (resumen.leyendo > 0) partes.push(`${resumen.leyendo} leyendo`);
  if (resumen.espera > 0) partes.push(`${resumen.espera} en espera`);
  if (resumen.existian > 0) {
    partes.push(`${resumen.existian} ya ${resumen.existian === 1 ? "existía" : "existían"}`);
  }
  if (resumen.errores > 0) partes.push(`${resumen.errores} con error`);
  return partes.join(" · ");
}

/**
 * Avance para el botón ("Subiendo 2/5"): el archivo en curso sobre el total de
 * la subida. Los rechazados al elegirlos no cuentan: nunca entraron a la cola.
 */
export function avanceGlobal(
  items: readonly ItemSubida[],
): { actual: number; total: number } | null {
  if (!items.some(estaPendiente)) return null;
  const contados = items.filter(
    (item) => !(item.estado === "error" && !item.fallo?.reintentable && !item.huella && item.progreso === 0),
  );
  const terminados = contados.filter((item) => !estaPendiente(item)).length;
  return { actual: Math.min(terminados + 1, contados.length), total: contados.length };
}
