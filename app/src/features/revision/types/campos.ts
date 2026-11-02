/**
 * Responsabilidad: inventario provisional de los campos del reporte técnico y
 * de las secciones del formulario.
 * Existe como fuente de verdad de los identificadores: el mapa de regiones, los
 * datos simulados y la vista de corrección se tipan contra esta lista. Cuando el
 * equipo cierre el inventario real, este archivo y su mapa se reemplazan.
 *
 * TODO(inventario): validar esta lista contra los 5 reportes escaneados y la
 * tabla de comparación con RP-TECH antes de la reunión con Adrián.
 */

export const IDS_CAMPOS = [
  "numero_reporte",
  "fecha",
  "cliente",
  "equipo",
  "marca",
  "modelo",
  "numero_serie",
  "tecnico",
  "falla_reportada",
  "diagnostico",
  "procedimiento",
  "repuesto_1_codigo",
  "repuesto_1_descripcion",
  "repuesto_1_cantidad",
  "repuesto_2_codigo",
  "repuesto_2_descripcion",
  "repuesto_2_cantidad",
  "observaciones",
  "firma_cliente",
  "sello",
] as const;

export type IdCampo = (typeof IDS_CAMPOS)[number];

export const IDS_SECCIONES = [
  "identificacion",
  "equipo",
  "servicio",
  "repuestos",
  "cierre",
] as const;

export type IdSeccion = (typeof IDS_SECCIONES)[number];

export type TipoCampo =
  | "texto"
  | "fecha"
  | "numero"
  | "codigo"
  | "multilinea"
  | "firma"
  | "sello";

export interface DefinicionCampo {
  id: IdCampo;
  etiqueta: string;
  /** Etiqueta impresa en el talonario; puede diferir de la de la interfaz. */
  etiqueta_formulario: string;
  seccion: IdSeccion;
  tipo: TipoCampo;
  /** Los datos que se copian o comparan se muestran en monoespaciada. */
  mono: boolean;
  ayuda?: string;
}

export interface SeccionFormulario {
  id: IdSeccion;
  titulo: string;
  descripcion?: string;
}
