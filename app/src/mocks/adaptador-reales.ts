/**
 * Responsabilidad: adaptar los 10 reportes técnicos reales escaneados del PDF
 * procesados por Gemini al tipo de dominio `Reporte`.
 * Proporciona la ruta al escaneo real (`/escaneos/pagina-XX.png`) y asigna
 * las confianzas reales y los campos extraídos.
 */

import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";
import { MAPA_TALONARIO_2005 } from "@/config/regiones/talonario-2005-a4";
import { derivarEstadoReporte } from "@/features/revision/lib/estados";
import type { IdCampo } from "@/features/revision/types/campos";
import type {
  CampoReporte,
  Confianza,
  EstadoEscaneo,
  Reporte,
} from "@/features/revision/types/dominio";

import reportesJson from "./reportes-reales.json";

interface RawExtractedReport {
  numero_reporte: string;
  numero_talonario: string;
  cliente: string;
  equipo: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  tecnico: string;
  fecha_reporte: string;
  telefono: string | null;
  direccion: string | null;
  contacto: string | null;
  falla_reportada: string | null;
  diagnostico: string | null;
  procedimiento: string | null;
  observaciones: string | null;
  estado_equipo: string | null;
  limpieza_equipo: string | null;
  cabezales: string | null;
  confianzas?: Record<string, Confianza>;
  pagina_archivo: string;
  id: string;
}

function convertirFecha(fechaStr: string): string {
  if (!fechaStr) return "2026-11-02";
  const partes = fechaStr.split(/[/.-]/);
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, "0");
    const mes = partes[1].padStart(2, "0");
    let anio = partes[2];
    if (anio.length === 2) anio = `20${anio}`;
    return `${anio}-${mes}-${dia}`;
  }
  return "2026-11-02";
}

export function construirReportesReales(): Reporte[] {
  return (reportesJson as RawExtractedReport[]).map((raw, index) => {
    const confianzas = raw.confianzas ?? {};

    const mapaValores: Partial<Record<IdCampo, string | null>> = {
      numero_reporte: raw.numero_reporte,
      fecha: raw.fecha_reporte,
      cliente: raw.cliente || "Cliente sin registrar",
      equipo: raw.equipo || "Sin especificar",
      marca: raw.marca,
      modelo: raw.modelo,
      numero_serie: raw.numero_serie,
      tecnico: raw.tecnico || "Técnico de servicio",
      falla_reportada: raw.falla_reportada,
      diagnostico: raw.diagnostico,
      procedimiento: raw.procedimiento,
      observaciones: raw.observaciones,
      firma_cliente: "Firmado en original",
      sello: null,
    };

    const campos: CampoReporte[] = CAMPOS_FORMULARIO.map((def) => {
      const valor = mapaValores[def.id] ?? null;
      const conf = (confianzas[def.id] as Confianza) ?? (valor ? "alta" : "baja");
      const esDudoso = conf === "baja" || conf === "media" || !valor;

      return {
        id: def.id,
        valor_modelo: valor,
        confianza: conf,
        no_leido: !valor,
        valor_corregido: null,
        estado_revision: esDudoso ? "pendiente" : "auto",
        revisado_por: null,
        revisado_en: null,
        corregido_por: null,
        corregido_en: null,
      };
    });

    const estado: EstadoEscaneo = derivarEstadoReporte(campos, { procesado: true });
    const fechaIso = convertirFecha(raw.fecha_reporte);

    return {
      id: `rep-real-${raw.numero_reporte || index + 1}`,
      numero_reporte: raw.numero_reporte || `000${index + 1}`,
      numero_talonario: raw.numero_talonario || raw.numero_reporte || `000${index + 1}`,
      cliente: raw.cliente || "Cliente General",
      equipo: raw.equipo || "Equipo Técnico",
      tecnico: raw.tecnico || "Técnico Asignado",
      fecha_reporte: fechaIso,
      origen: "historico",
      estado,
      diseno_talonario: MAPA_TALONARIO_2005.id,
      escaneo: {
        id: `esc-${raw.numero_reporte || index + 1}`,
        numero_reporte: raw.numero_reporte || `000${index + 1}`,
        ruta_original: raw.pagina_archivo,
        paginas: 1,
        enviado_por: "Escaneo Multifuncional",
        canal: "telegram",
        estado,
        recibido_en: `${fechaIso}T08:30:00Z`,
        procesado_en: `${fechaIso}T08:32:00Z`,
      },
      campos,
      creado_en: `${fechaIso}T08:30:00Z`,
      actualizado_en: `${fechaIso}T08:32:00Z`,
      completado_en: estado === "completo" ? `${fechaIso}T08:32:00Z` : null,
    };
  });
}
