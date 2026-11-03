/**
 * Responsabilidad: inventario de los campos del formulario físico de GO Service
 * Latam, agrupado por secciones, y accesos indexados para el resto de la app.
 * Existe como el único archivo que hay que tocar cuando el equipo agregue o
 * renombre un campo: nada de esto vive dentro de un componente.
 *
 * Debe coincidir con `sirep-back/src/escaneos/campos-formulario.ts`.
 *
 * TODO(inventario): faltan los campos que el formulario trae y el backend aún no
 * extrae (teléfono, contacto, último mantenimiento, cabezales, firmas). Se
 * agregan junto con la tabla de comparación acordada con RP-TECH.
 */

import type {
  DefinicionCampo,
  IdCampo,
  IdSeccion,
  SeccionFormulario,
} from "@/features/revision/types/campos";

export const SECCIONES_FORMULARIO: readonly SeccionFormulario[] = [
  {
    id: "identificacion",
    titulo: "Identificación",
    descripcion: "Quién atendió, a quién y cuándo.",
  },
  {
    id: "equipo",
    titulo: "Equipo y motivo",
    descripcion: "Equipo intervenido, motivo de la visita y su estado.",
  },
  {
    id: "servicio",
    titulo: "Servicio realizado",
    descripcion: "Procedimiento, conclusión y recomendaciones.",
  },
  {
    id: "repuestos",
    titulo: "Repuestos",
    descripcion: "Código de los repuestos requeridos.",
  },
  {
    id: "cierre",
    titulo: "Visita al cliente",
    descripcion: "Horas de llegada y de salida del técnico.",
  },
] as const;

export const CAMPOS_FORMULARIO: readonly DefinicionCampo[] = [
  {
    id: "tecnico",
    etiqueta: "Técnico",
    etiqueta_formulario: "Técnico",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
  },
  {
    id: "empresa",
    etiqueta: "Empresa",
    etiqueta_formulario: "Empresa",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
    ayuda: "Cliente o empresa atendida.",
  },
  {
    id: "fecha",
    etiqueta: "Fecha",
    etiqueta_formulario: "Fecha",
    seccion: "identificacion",
    tipo: "fecha",
    mono: true,
    ayuda: "Formato día/mes/año, tal como está escrito en el papel.",
  },
  {
    id: "direccion",
    etiqueta: "Dirección",
    etiqueta_formulario: "Dirección",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
  },
  {
    id: "equipo",
    etiqueta: "Equipo",
    etiqueta_formulario: "Equipo",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
    ayuda: "Marca y modelo del equipo intervenido.",
  },
  {
    id: "motivo",
    etiqueta: "Motivo",
    etiqueta_formulario: "Motivo",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
  },
  {
    id: "estado_del_equipo",
    etiqueta: "Estado del equipo",
    etiqueta_formulario: "Estado del equipo",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
    ayuda: "Casilla marcada: operativo o inoperativo.",
  },
  {
    id: "procedimiento",
    etiqueta: "Procedimiento",
    etiqueta_formulario: "Procedimiento",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "conclusion",
    etiqueta: "Conclusión",
    etiqueta_formulario: "Conclusión",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "recomendaciones",
    etiqueta: "Recomendaciones",
    etiqueta_formulario: "Recomendaciones",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "codigo_repuesto",
    etiqueta: "Código de repuesto",
    etiqueta_formulario: "Código",
    seccion: "repuestos",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "hora_llegada",
    etiqueta: "Hora de llegada",
    etiqueta_formulario: "Hora de llegada cliente",
    seccion: "cierre",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "hora_salida",
    etiqueta: "Hora de salida",
    etiqueta_formulario: "Hora de salida cliente",
    seccion: "cierre",
    tipo: "codigo",
    mono: true,
  },
] as const;

export const CAMPOS_POR_ID: Record<IdCampo, DefinicionCampo> = Object.fromEntries(
  CAMPOS_FORMULARIO.map((campo) => [campo.id, campo]),
) as Record<IdCampo, DefinicionCampo>;

export const ORDEN_CAMPOS: Record<IdCampo, number> = Object.fromEntries(
  CAMPOS_FORMULARIO.map((campo, indice) => [campo.id, indice]),
) as Record<IdCampo, number>;

/*
 * `Object.fromEntries` devuelve `{ [k: string]: T }` y TypeScript no puede
 * comprobar que las claves cubren exactamente `IdSeccion`. El doble cast es
 * seguro porque la fuente es `SECCIONES_FORMULARIO`, que es exhaustiva.
 */
export const CAMPOS_POR_SECCION: Record<IdSeccion, readonly DefinicionCampo[]> =
  Object.fromEntries(
    SECCIONES_FORMULARIO.map((seccion) => [
      seccion.id,
      CAMPOS_FORMULARIO.filter((campo) => campo.seccion === seccion.id),
    ]),
  ) as unknown as Record<IdSeccion, readonly DefinicionCampo[]>;
