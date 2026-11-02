/**
 * Responsabilidad: inventario provisional del formulario físico, agrupado por
 * secciones, y accesos indexados para el resto de la aplicación.
 * Existe como el único archivo que hay que reemplazar cuando el equipo cierre el
 * inventario real con los escaneos. Nada de esto vive dentro de un componente.
 *
 * TODO(inventario): los campos de repuestos y la firma son provisionales; el
 * inventario definitivo depende de la tabla de comparación con RP-TECH.
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
    descripcion: "Datos impresos y de cabecera del talonario.",
  },
  {
    id: "equipo",
    titulo: "Equipo",
    descripcion: "Identifica el equipo intervenido.",
  },
  {
    id: "servicio",
    titulo: "Servicio realizado",
    descripcion: "Falla, diagnóstico y procedimiento.",
  },
  {
    id: "repuestos",
    titulo: "Repuestos",
    descripcion: "Tabla de códigos, descripciones y cantidades.",
  },
  {
    id: "cierre",
    titulo: "Cierre",
    descripcion: "Observaciones, conformidad y sello.",
  },
] as const;

export const CAMPOS_FORMULARIO: readonly DefinicionCampo[] = [
  {
    id: "numero_reporte",
    etiqueta: "N° de reporte",
    etiqueta_formulario: "Reporte N°",
    seccion: "identificacion",
    tipo: "codigo",
    mono: true,
    ayuda: "Número impreso del talonario; es la clave de duplicados.",
  },
  {
    id: "fecha",
    etiqueta: "Fecha",
    etiqueta_formulario: "Fecha",
    seccion: "identificacion",
    tipo: "fecha",
    mono: true,
    ayuda: "Formato día/mes/año.",
  },
  {
    id: "cliente",
    etiqueta: "Cliente",
    etiqueta_formulario: "Cliente",
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
  },
  {
    id: "marca",
    etiqueta: "Marca",
    etiqueta_formulario: "Marca",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
  },
  {
    id: "modelo",
    etiqueta: "Modelo",
    etiqueta_formulario: "Modelo",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
  },
  {
    id: "numero_serie",
    etiqueta: "N° de serie",
    etiqueta_formulario: "N° de serie",
    seccion: "equipo",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "tecnico",
    etiqueta: "Técnico",
    etiqueta_formulario: "Técnico",
    seccion: "servicio",
    tipo: "texto",
    mono: false,
  },
  {
    id: "falla_reportada",
    etiqueta: "Falla reportada",
    etiqueta_formulario: "Falla reportada",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "diagnostico",
    etiqueta: "Diagnóstico",
    etiqueta_formulario: "Diagnóstico",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
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
    id: "repuesto_1_codigo",
    etiqueta: "Código del repuesto 1",
    etiqueta_formulario: "Código",
    seccion: "repuestos",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "repuesto_1_descripcion",
    etiqueta: "Descripción del repuesto 1",
    etiqueta_formulario: "Descripción",
    seccion: "repuestos",
    tipo: "texto",
    mono: false,
  },
  {
    id: "repuesto_1_cantidad",
    etiqueta: "Cantidad del repuesto 1",
    etiqueta_formulario: "Cant.",
    seccion: "repuestos",
    tipo: "numero",
    mono: true,
  },
  {
    id: "repuesto_2_codigo",
    etiqueta: "Código del repuesto 2",
    etiqueta_formulario: "Código",
    seccion: "repuestos",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "repuesto_2_descripcion",
    etiqueta: "Descripción del repuesto 2",
    etiqueta_formulario: "Descripción",
    seccion: "repuestos",
    tipo: "texto",
    mono: false,
  },
  {
    id: "repuesto_2_cantidad",
    etiqueta: "Cantidad del repuesto 2",
    etiqueta_formulario: "Cant.",
    seccion: "repuestos",
    tipo: "numero",
    mono: true,
  },
  {
    id: "observaciones",
    etiqueta: "Observaciones",
    etiqueta_formulario: "Observaciones",
    seccion: "cierre",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "firma_cliente",
    etiqueta: "Firma del cliente",
    etiqueta_formulario: "Firma del cliente",
    seccion: "cierre",
    tipo: "firma",
    mono: false,
    ayuda: "Se registra la presencia de la firma, no su contenido.",
  },
  {
    id: "sello",
    etiqueta: "Sello",
    etiqueta_formulario: "Sello",
    seccion: "cierre",
    tipo: "sello",
    mono: false,
    ayuda: "Sello de recepción del taller o de la empresa.",
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
