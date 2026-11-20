/**
 * Responsabilidad: contrato y cliente HTTP para el Tablero del Administrador
 * (SIREP-S4-T06, T07 y T08).
 */

import { apiClient } from "@/lib/api";

export interface MetricasRevisorPeriodo {
  reportes_cerrados: number;
  horas_activas: number;
  minutos_activos: number;
  sesiones: number;
  minutos_por_reporte: number;
  reportes_por_hora_activa: number;
  campos_corregidos: number;
  campos_confirmados: number;
  campos_ilegibles: number;
  campos_corregidos_por_reporte: number;
  ultima_actividad: string | null;
}

export interface MetricasRevisorPersona extends MetricasRevisorPeriodo {
  usuario_id: string | null;
  nombre: string;
  roles: string[];
  hoy: MetricasRevisorPeriodo;
  esta_semana: MetricasRevisorPeriodo;
}

export interface MetricasIngestorPeriodo {
  pdfs_subidos: number;
  duplicados: number;
  errores: number;
  horas_activas: number;
  minutos_activos: number;
  sesiones: number;
  ultima_actividad: string | null;
}

export interface MetricasIngestorPersona extends MetricasIngestorPeriodo {
  usuario_id: string | null;
  nombre: string;
  roles: string[];
  hoy: MetricasIngestorPeriodo;
  esta_semana: MetricasIngestorPeriodo;
}

export interface AlertaCalidad {
  numero_reporte: string;
  revisor: string;
  cerrado_en: string;
  duracion_minutos: number;
  campos_corregidos: number;
  motivo: string;
}

export interface DiscrepanciaDobleRevision {
  campo: string;
  valor_primera: string | null;
  valor_segunda: string | null;
}

export interface TableroAdministrador {
  generado_en: string;
  resumen: {
    subidos: number;
    en_cola: number;
    en_revision: number;
    revisados: number;
    doble_revision_pendiente: number;
    enviados_rptech: number;
    pendientes_envio_rptech: number;
  };
  proyeccion: {
    pendientes_totales: number;
    promedio_diario_revisados: number;
    dias_con_actividad: number;
    dias_restantes_estimados: number | null;
    fecha_estimada_termino: string | null;
    serie_diaria: Array<{ fecha: string; revisados: number }>;
  };
  revisores: MetricasRevisorPersona[];
  ingestores: MetricasIngestorPersona[];
  reservas_activas: Array<{
    numero_reporte: string;
    cliente: string;
    reservado_por: string;
    reservado_por_id: string | null;
    reservado_en: string;
    expira_en: string;
    minutos_transcurridos: number;
  }>;
  alertas_calidad: AlertaCalidad[];
  doble_revision: {
    pendientes: Array<{
      numero_reporte: string;
      primer_revisor: string;
      elegido_en: string;
    }>;
    completadas: Array<{
      numero_reporte: string;
      primer_revisor: string;
      segundo_revisor: string;
      porcentaje_coincidencia: number;
      campos_coincidentes: number;
      campos_totales: number;
      completado_en: string;
      discrepancias: DiscrepanciaDobleRevision[];
    }>;
    promedio_coincidencia: number | null;
  };
}

export function leerTablero(): Promise<TableroAdministrador> {
  return apiClient.get<TableroAdministrador>("/reportes/tablero", {
    cache: "no-store",
  });
}

export function liberarReservaDesdeTablero(numero: string): Promise<{ mensaje: string }> {
  return apiClient.post<{ mensaje: string }>(
    `/reportes/${encodeURIComponent(numero)}/liberar`,
    undefined,
    { cache: "no-store" },
  );
}
