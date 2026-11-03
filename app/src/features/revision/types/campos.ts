/**
 * Responsabilidad: identificadores de los campos del reporte técnico y de las
 * secciones del formulario.
 * Existe como fuente de verdad de los identificadores: el mapa de regiones y la
 * vista de corrección se tipan contra esta lista. Son exactamente las claves que
 * el backend le pide al modelo (`sirep-back/src/escaneos/campos-formulario.ts`):
 * si una cambia, tiene que cambiar en los dos lados.
 */

export const IDS_CAMPOS = [
  "tecnico",
  "empresa",
  "fecha",
  "direccion",
  "equipo",
  "motivo",
  "estado_del_equipo",
  "procedimiento",
  "conclusion",
  "recomendaciones",
  "codigo_repuesto",
  "hora_llegada",
  "hora_salida",
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
