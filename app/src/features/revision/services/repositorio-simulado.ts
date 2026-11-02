/**
 * Responsabilidad: implementación en memoria de `RepositorioReportes` sobre los
 * reportes simulados.
 * Existe para que la bandeja y la vista de corrección funcionen sin backend y
 * sin escaneos reales, manteniendo intacto el contrato: una implementación con
 * Supabase reemplaza este archivo y ningún componente se entera.
 *
 * Los cambios viven en memoria: se reflejan al instante en la UI y se pierden
 * al recargar, que es exactamente el comportamiento del prototipo.
 */

import { coincideNumeroReporte } from "@/features/revision/lib/filtros";
import { derivarEstadoReporte } from "@/features/revision/lib/estados";
import { REPORTES_SIMULADOS } from "@/mocks/reportes";
import type {
  AccionRevision,
  CampoReporte,
  IdCampo,
  RepositorioReportes,
  Reporte,
} from "@/features/revision/types/dominio";

import { ErrorRepositorio } from "./errores";

export interface OpcionesRepositorioSimulado {
  /**
   * Retraso artificial de red. En las pruebas es 0; en la demo es lo que hace
   * visible el estado de carga de la bandeja.
   */
  latencia_ms?: number;
}

const LATENCIA_DEFECTO = 260;

function clonar(reportes: readonly Reporte[]): Reporte[] {
  // `structuredClone` copia en profundidad: si la UI mutara un reporte
  // devuelto, no podría alterar la fuente de datos de las siguientes lecturas.
  // El spread previo es solo para que el tipo de salida sea mutable.
  return structuredClone([...reportes]);
}

function ahora(): string {
  return new Date().toISOString();
}

/**
 * Resuelve un número de reporte como lo haría la URL: primero exacto y después
 * tolerante a ceros y separadores. Si la búsqueda tolerante es ambigua, no se
 * inventa una respuesta.
 */
function indicePorNumero(
  reportes: readonly Reporte[],
  numero: string,
): number {
  const consulta = numero.trim();
  if (!consulta) return -1;

  const exacto = reportes.findIndex(
    (reporte) => reporte.numero_reporte === consulta,
  );
  if (exacto !== -1) return exacto;

  const coincidencias = reportes
    .map((reporte, indice) => ({ reporte, indice }))
    .filter(({ reporte }) =>
      coincideNumeroReporte(reporte.numero_reporte, consulta),
    );

  return coincidencias.length === 1 ? coincidencias[0].indice : -1;
}

function aplicarAccion(campo: CampoReporte, accion: AccionRevision): CampoReporte {
  const en = ahora();

  switch (accion.tipo) {
    case "confirmar":
      return {
        ...campo,
        estado_revision: "confirmado",
        revisado_por: accion.actor,
        revisado_en: en,
        corregido_por: null,
        corregido_en: null,
        valor_corregido: null,
      };
    case "corregir":
      return {
        ...campo,
        estado_revision: "corregido",
        valor_corregido: accion.valor,
        revisado_por: accion.actor,
        revisado_en: en,
        corregido_por: accion.actor,
        corregido_en: en,
      };
    case "ilegible":
      return {
        ...campo,
        estado_revision: "ilegible",
        revisado_por: accion.actor,
        revisado_en: en,
        corregido_por: null,
        corregido_en: null,
        valor_corregido: null,
      };
    case "reabrir":
      return {
        ...campo,
        estado_revision: "pendiente",
        revisado_por: null,
        revisado_en: null,
        corregido_por: null,
        corregido_en: null,
        valor_corregido: null,
      };
  }
}

export function crearRepositorioSimulado(
  opciones: OpcionesRepositorioSimulado = {},
): RepositorioReportes {
  const latencia = opciones.latencia_ms ?? LATENCIA_DEFECTO;
  let almacen = clonar(REPORTES_SIMULADOS);

  const esperar = async (): Promise<void> => {
    if (latencia > 0) {
      await new Promise((resolver) => setTimeout(resolver, latencia));
    }
  };

  return {
    async listarReportes() {
      await esperar();
      return clonar(almacen);
    },

    async obtenerReporte(numero: string) {
      await esperar();
      const indice = indicePorNumero(almacen, numero);
      if (indice === -1) return null;
      return structuredClone(almacen[indice]);
    },

    async revisarCampo(numero: string, campoId: IdCampo, accion: AccionRevision) {
      await esperar();

      const indice = indicePorNumero(almacen, numero);
      if (indice === -1) {
        throw new ErrorRepositorio(
          `No existe el reporte N° ${numero}.`,
          "no_encontrado",
        );
      }

      const reporte = almacen[indice];
      const indiceCampo = reporte.campos.findIndex(
        (campo) => campo.id === campoId,
      );
      if (indiceCampo === -1) {
        throw new ErrorRepositorio(
          `El reporte N° ${numero} no tiene el campo "${campoId}".`,
          "no_encontrado",
        );
      }

      const actual = reporte.campos[indiceCampo];
      const estaPendiente = actual.estado_revision === "pendiente";

      if (accion.tipo === "reabrir") {
        // Reabrir un pendiente sería un no-op que deja al técnico creyendo
        // que hizo algo: solo se reabre lo que quedó resuelto.
        if (estaPendiente) {
          throw new ErrorRepositorio(
            `El campo "${campoId}" no está resuelto.`,
            "conflicto",
          );
        }
      } else if (!estaPendiente) {
        throw new ErrorRepositorio(
          `El campo "${campoId}" no está pendiente de revisión.`,
          "conflicto",
        );
      }

      if (accion.tipo === "corregir" && accion.valor.trim() === "") {
        throw new ErrorRepositorio(
          "La corrección no puede quedar vacía.",
          "conflicto",
        );
      }

      const campos = [...reporte.campos];
      campos[indiceCampo] = aplicarAccion(
        actual,
        accion.tipo === "corregir"
          ? { ...accion, valor: accion.valor.trim() }
          : accion,
      );

      const estado = derivarEstadoReporte(campos, {
        procesado: reporte.escaneo.procesado_en !== null,
      });

      const actualizado: Reporte = {
        ...reporte,
        campos,
        estado,
        escaneo: { ...reporte.escaneo, estado },
        actualizado_en: ahora(),
        completado_en:
          estado === "completo"
            ? (reporte.completado_en ?? ahora())
            : null,
      };

      almacen[indice] = actualizado;
      return structuredClone(actualizado);
    },

    async reiniciarDatosSimulados() {
      await esperar();
      almacen = clonar(REPORTES_SIMULADOS);
    },
  };
}
