/**
 * Responsabilidad: archivo simulado de reportes escaneados.
 * Existe para poder construir y demostrar la bandeja sin backend y sin escaneos
 * reales (que contienen datos de clientes). La forma de cada reporte es la misma
 * que devolverá el repositorio real. El caso N° 000845 reproduce el ejemplo del
 * proyecto: cliente, fecha y serie en confianza alta; procedimiento en media; el
 * código de un repuesto marcado como no leído después de preguntar por Telegram.
 */

import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";
import { MAPA_TALONARIO_2005 } from "@/config/regiones/talonario-2005-a4";
import { derivarEstadoReporte } from "@/features/revision/lib/estados";
import type { IdCampo } from "@/features/revision/types/campos";
import type {
  CampoReporte,
  Confianza,
  EstadoEscaneo,
  EstadoRevisionCampo,
  OrigenReporte,
  Reporte,
} from "@/features/revision/types/dominio";

interface ValorDudoso {
  confianza: Confianza;
  valor?: string | null;
  no_leido?: boolean;
}

interface ValorResuelto {
  estado: Extract<EstadoRevisionCampo, "confirmado" | "corregido" | "ilegible">;
  por: string;
  en: string;
  corregido?: string;
}

interface SemillaReporte {
  numero: string;
  cliente: string;
  equipo: string;
  tecnico: string;
  fecha: string;
  origen: OrigenReporte;
  recibido_en: string;
  procesado_en: string | null;
  enviado_por?: string;
  valores: Partial<Record<IdCampo, string | null>>;
  dudosos?: Partial<Record<IdCampo, ValorDudoso>>;
  resueltos?: Partial<Record<IdCampo, ValorResuelto>>;
}

function fechaTalonario(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

function construirCampos(semilla: SemillaReporte): CampoReporte[] {
  /*
   * La cabecera del reporte también es campo del formulario. Sin este mapa,
   * cliente, fecha, técnico y N° quedarían vacíos en la vista de corrección
   * aunque el reporte los tenga, y el modelo parecería no haber leído nada.
   * La fecha se guarda como se escribe en el talonario (día/mes/año); la fecha
   * estructura del reporte sigue en ISO para poder ordenarla y formatearla.
   */
  const valoresBase: Partial<Record<IdCampo, string | null>> = {
    numero_reporte: semilla.numero,
    fecha: fechaTalonario(semilla.fecha),
    cliente: semilla.cliente,
    equipo: semilla.equipo,
    tecnico: semilla.tecnico,
    ...semilla.valores,
  };

  return CAMPOS_FORMULARIO.map((definicion) => {
    const dudoso = semilla.dudosos?.[definicion.id];
    const resuelto = semilla.resueltos?.[definicion.id];
    const valorBase = valoresBase[definicion.id] ?? null;

    const valorModelo = dudoso?.valor !== undefined ? dudoso.valor : valorBase;
    const noLeido = dudoso?.no_leido ?? false;

    let estado: EstadoRevisionCampo = "auto";
    if (semilla.recibido_en && semilla.procesado_en === null) {
      // El modelo todavía no leyó: no hay campos dudosos ni revisión posible.
      estado = "auto";
    } else if (resuelto) {
      estado = resuelto.estado;
    } else if (dudoso) {
      estado = "pendiente";
    }

    return {
      id: definicion.id,
      valor_modelo: valorModelo,
      confianza:
        semilla.procesado_en === null ? null : (dudoso?.confianza ?? "alta"),
      no_leido: noLeido,
      valor_corregido: resuelto?.corregido ?? null,
      estado_revision: estado,
      revisado_por: resuelto?.por ?? null,
      revisado_en: resuelto?.en ?? null,
      corregido_por: resuelto?.estado === "corregido" ? resuelto.por : null,
      corregido_en: resuelto?.estado === "corregido" ? resuelto.en : null,
    };
  });
}

function estadoDerivado(
  semilla: SemillaReporte,
  campos: readonly CampoReporte[],
): EstadoEscaneo {
  // La regla vive en `lib/estados.ts` para que el repositorio simulado y este
  // archivo no puedan divergir sobre cuándo un reporte está completo.
  return derivarEstadoReporte(campos, {
    procesado: semilla.procesado_en !== null,
  });
}

function construirReporte(semilla: SemillaReporte): Reporte {
  const campos = construirCampos(semilla);
  const estado = estadoDerivado(semilla, campos);

  const fechaResolucion = Object.values(semilla.resueltos ?? {})
    .map((resuelto) => resuelto.en)
    .sort()
    .at(-1);

  const actualizadoEn =
    fechaResolucion ??
    semilla.procesado_en ??
    semilla.recibido_en;

  return {
    id: `rep-${semilla.numero}`,
    numero_reporte: semilla.numero,
    numero_talonario: semilla.numero,
    cliente: semilla.cliente,
    equipo: semilla.equipo,
    tecnico: semilla.tecnico,
    fecha_reporte: semilla.fecha,
    origen: semilla.origen,
    estado,
    diseno_talonario: MAPA_TALONARIO_2005.id,
    escaneo: {
      id: `esc-${semilla.numero}`,
      numero_reporte: semilla.numero,
      ruta_original: `/escaneos/${semilla.numero}.pdf`,
      paginas: 2,
      enviado_por: semilla.enviado_por ?? "Secretaría",
      canal: "telegram",
      estado,
      recibido_en: semilla.recibido_en,
      procesado_en: semilla.procesado_en,
    },
    campos,
    creado_en: semilla.recibido_en,
    actualizado_en: actualizadoEn,
    completado_en: estado === "completo" ? actualizadoEn : null,
  };
}

const SEMILLAS: readonly SemillaReporte[] = [
  {
    numero: "000845",
    cliente: "Ferretería San Martín",
    equipo: "Compresor de aire",
    tecnico: "Téc. Diego Ferreyra",
    fecha: "2026-10-14",
    origen: "historico",
    recibido_en: "2026-10-15T09:12:00-03:00",
    procesado_en: "2026-10-15T09:14:00-03:00",
    valores: {
      marca: "Stanley",
      modelo: "C-2400",
      numero_serie: "MX-4471-A",
      falla_reportada: "Pérdida de presión en la línea principal.",
      diagnostico: "Empaque del cabezal vencido.",
      procedimiento:
        "Se desmontó el cabezal, se reemplazó el empaque y se probó a 8 bar.",
      repuesto_1_descripcion: "Empaque de cabezal 40 mm",
      repuesto_1_cantidad: "2",
      repuesto_2_codigo: "F-2210",
      repuesto_2_descripcion: "Filtro de aire",
      repuesto_2_cantidad: "1",
      observaciones: "Cliente solicita revisión en 30 días.",
      firma_cliente: "Presente",
      sello: "RECIBIDO",
    },
    dudosos: {
      procedimiento: {
        confianza: "media",
        valor:
          "Se desmontó el cabezal, se reemplazó el empaque y se probó a 6 bar.",
      },
      // La secretaría respondió "no se lee" al recorte del código.
      repuesto_1_codigo: { confianza: "baja", valor: null, no_leido: true },
    },
  },
  {
    numero: "000912",
    cliente: "Clínica del Parque",
    equipo: "Autoclave",
    tecnico: "Téc. Mariela Ortiz",
    fecha: "2026-10-27",
    origen: "sistema",
    recibido_en: "2026-10-28T08:05:00-03:00",
    procesado_en: "2026-10-28T08:07:00-03:00",
    valores: {
      marca: "Tuttnauer",
      modelo: "2540M",
      numero_serie: "AU-2291-B",
      falla_reportada: "No alcanza la temperatura de esterilización.",
      diagnostico: "Resistencia con baja continuidad.",
      procedimiento:
        "Se midió continuidad, se reemplazó la resistencia y se calibró el termostato.",
      repuesto_1_codigo: "R-5540",
      repuesto_1_descripcion: "Resistencia 2 kW",
      repuesto_1_cantidad: "1",
      repuesto_2_codigo: "J-1180",
      repuesto_2_descripcion: "Junta de puerta",
      repuesto_2_cantidad: "1",
      observaciones: "Queda en observación por 48 horas.",
    },
    dudosos: {
      cliente: { confianza: "media", valor: "Clínica del Parque S.A." },
      numero_serie: { confianza: "baja", valor: "AU-2291-8" },
      diagnostico: {
        confianza: "media",
        valor: "Resistencia con baja continuidad en uno de los bornes.",
      },
      repuesto_2_cantidad: { confianza: "baja", valor: "7" },
    },
  },
  {
    numero: "000763",
    cliente: "Talleres Vargas",
    equipo: "Elevador de dos columnas",
    tecnico: "Téc. Bruno Salas",
    fecha: "2026-09-30",
    origen: "historico",
    recibido_en: "2026-10-01T10:20:00-03:00",
    procesado_en: "2026-10-01T10:22:00-03:00",
    valores: {
      marca: "Ravaglioli",
      modelo: "KP-30",
      falla_reportada: "Ruido metálico al subir.",
      diagnostico: "Cable de tracción desgastado.",
      procedimiento:
        "Se reemplazó el cable de tracción y se ajustaron los patines guía.",
      repuesto_1_codigo: "C-7781",
      repuesto_1_descripcion: "Cable de tracción 8 mm",
      repuesto_1_cantidad: "1",
      observaciones: "Se recomienda revisión semestral.",
    },
    dudosos: {
      numero_serie: { confianza: "baja", valor: "MX-8842-6" },
      observaciones: { confianza: "media", valor: "Se recomienda revisión mensual." },
    },
    resueltos: {
      numero_serie: {
        estado: "corregido",
        corregido: "MX-8842-C",
        por: "Téc. Ana Salas",
        en: "2026-10-02T14:05:00-03:00",
      },
      observaciones: {
        estado: "ilegible",
        por: "Téc. Ana Salas",
        en: "2026-10-02T14:06:00-03:00",
      },
    },
  },
  {
    numero: "000901",
    cliente: "Hotel Miramar",
    equipo: "Bomba de agua",
    tecnico: "Téc. Lucía Paz",
    fecha: "2026-10-24",
    origen: "sistema",
    recibido_en: "2026-10-25T11:40:00-03:00",
    procesado_en: "2026-10-25T11:42:00-03:00",
    valores: {
      marca: "Pedrollo",
      modelo: "CP-660",
      numero_serie: "PD-6610-D",
      falla_reportada: "Corte intermitente del suministro.",
      diagnostico: "Capacitor del motor agotado.",
      procedimiento:
        "Se reemplazó el capacitor y se verificó el caudal con manómetro.",
      repuesto_1_codigo: "K-3302",
      repuesto_1_descripcion: "Capacitor 25 µF",
      repuesto_1_cantidad: "1",
      observaciones: "Sin novedades en la prueba de 20 minutos.",
    },
    dudosos: {
      equipo: { confianza: "media", valor: "Bomba de agua centrífuga" },
      marca: { confianza: "baja", valor: "Pedrolo" },
      procedimiento: {
        confianza: "media",
        valor:
          "Se reemplazó el capacitor y se verificó el caudal con manómetro digital.",
      },
    },
    resueltos: {
      marca: {
        estado: "confirmado",
        por: "Téc. Daniel Rivas",
        en: "2026-11-01T16:40:00-03:00",
      },
    },
  },
  {
    numero: "000877",
    cliente: "Panificadora La Espiga",
    equipo: "Horno rotativo",
    tecnico: "Téc. Diego Ferreyra",
    fecha: "2026-10-19",
    origen: "historico",
    recibido_en: "2026-10-20T07:50:00-03:00",
    procesado_en: "2026-10-20T07:53:00-03:00",
    valores: {
      marca: "Zanolli",
      modelo: "R-120",
      numero_serie: "ZN-1022-F",
      falla_reportada: "El carro no gira y la puerta no cierra bien.",
      diagnostico: "Motor de giro trabado por grasa endurecida.",
      procedimiento:
        "Se limpió el reductor, se engrasó y se ajustó el cierre de puerta.",
      repuesto_1_codigo: "G-9041",
      repuesto_1_descripcion: "Grasa sintética de alta temperatura",
      repuesto_1_cantidad: "1",
      observaciones: "Se dejó funcionando en vacío por 30 minutos.",
    },
    dudosos: {
      cliente: { confianza: "media", valor: "Panificadora La Espig" },
      fecha: { confianza: "baja", valor: "19/09/2026" },
      numero_serie: { confianza: "media", valor: "ZN-1022-E" },
      falla_reportada: {
        confianza: "media",
        valor: "El carro no gira y la puerta no cierra.",
      },
      procedimiento: {
        confianza: "baja",
        valor: "Se limpió el reductor y se ajustó la puerta.",
      },
      repuesto_1_descripcion: {
        confianza: "media",
        valor: "Grasa sintética de alta temperatura para horno",
      },
    },
  },
  {
    numero: "000940",
    cliente: "Transportes Ríos",
    equipo: "Montacargas",
    tecnico: "Téc. Mariela Ortiz",
    fecha: "2026-10-31",
    origen: "sistema",
    recibido_en: "2026-11-01T18:10:00-03:00",
    procesado_en: null,
    valores: {
      marca: "Toyota",
      modelo: "8FGU25",
      numero_serie: "TY-5520-G",
      falla_reportada: "Pérdida de fuerza en pendiente.",
      diagnostico: "Filtro de combustible obstruido.",
      procedimiento:
        "Se cambió el filtro de combustible y se purgó la línea.",
      repuesto_1_codigo: "FL-2201",
      repuesto_1_descripcion: "Filtro de combustible",
      repuesto_1_cantidad: "1",
      observaciones: "Pendiente de prueba de carga.",
    },
  },
  {
    numero: "000822",
    cliente: "Escuela Técnica N°4",
    equipo: "Proyector",
    tecnico: "Téc. Bruno Salas",
    fecha: "2026-10-08",
    origen: "historico",
    recibido_en: "2026-10-09T09:00:00-03:00",
    procesado_en: "2026-10-09T09:02:00-03:00",
    valores: {
      marca: "Epson",
      modelo: "PowerLite X49",
      numero_serie: "EP-3488-H",
      falla_reportada: "La imagen se apaga después de unos minutos.",
      diagnostico: "Lámpara al final de su vida útil.",
      procedimiento: "Se reemplazó la lámpara y se limpió el filtro de aire.",
      repuesto_1_codigo: "L-9910",
      repuesto_1_descripcion: "Lámpara de repuesto",
      repuesto_1_cantidad: "1",
      observaciones: "Equipo entregado al preceptor.",
    },
    dudosos: {
      cliente: { confianza: "media", valor: "Escuela Técnica N° 4" },
      observaciones: { confianza: "baja", valor: "Equipo entregado al preceptor" },
    },
    resueltos: {
      cliente: {
        estado: "confirmado",
        por: "Téc. Bruno Salas",
        en: "2026-10-10T12:05:00-03:00",
      },
      observaciones: {
        estado: "ilegible",
        por: "Téc. Bruno Salas",
        en: "2026-10-10T12:06:00-03:00",
      },
    },
  },
  {
    numero: "000928",
    cliente: "Copiadora Central",
    equipo: "Copiadora",
    tecnico: "Téc. Lucía Paz",
    fecha: "2026-10-29",
    origen: "sistema",
    recibido_en: "2026-10-30T10:35:00-03:00",
    procesado_en: "2026-10-30T10:37:00-03:00",
    valores: {
      marca: "Ricoh",
      modelo: "MP-301SPF",
      numero_serie: "RC-7714-K",
      falla_reportada: "Atasco constante en la bandeja 2.",
      diagnostico: "Rodillo de arrastre desgastado.",
      procedimiento:
        "Se reemplazó el rodillo de arrastre y se ajustó la guía del papel.",
      repuesto_1_codigo: "RB-4102",
      repuesto_1_descripcion: "Rodillo de arrastre",
      repuesto_1_cantidad: "2",
      observaciones: "Se dejó copia de prueba en recepción.",
    },
    dudosos: {
      modelo: { confianza: "media", valor: "MP-3015PF" },
      procedimiento: {
        confianza: "media",
        valor:
          "Se reemplazó el rodillo de arrastre y se ajustó la guía del papel en la bandeja.",
      },
      observaciones: {
        confianza: "baja",
        valor: null,
        no_leido: true,
      },
    },
    resueltos: {
      modelo: {
        estado: "confirmado",
        por: "Téc. Daniel Rivas",
        en: "2026-11-02T08:55:00-03:00",
      },
    },
  },
  {
    numero: "000889",
    cliente: "Imprenta Sur",
    equipo: "Guillotina",
    tecnico: "Téc. Diego Ferreyra",
    fecha: "2026-10-22",
    origen: "historico",
    recibido_en: "2026-10-23T14:15:00-03:00",
    procesado_en: "2026-10-23T14:17:00-03:00",
    valores: {
      marca: "Ideal",
      modelo: "4700",
      numero_serie: "ID-2090-L",
      falla_reportada: "El tope de seguridad no bloquea.",
      diagnostico: "Sensor óptico desalineado.",
      procedimiento:
        "Se alineó el sensor y se verificó el bloqueo en tres posiciones.",
      repuesto_1_codigo: "S-1204",
      repuesto_1_descripcion: "Sensor óptico",
      repuesto_1_cantidad: "1",
      observaciones: "Prueba de bloqueo conforme.",
    },
    dudosos: {
      repuesto_1_cantidad: { confianza: "baja", valor: "11" },
    },
  },
  {
    numero: "000957",
    cliente: "Cooperativa El Sol",
    equipo: "Generador",
    tecnico: "Téc. Mariela Ortiz",
    fecha: "2026-11-01",
    origen: "sistema",
    recibido_en: "2026-11-01T20:25:00-03:00",
    procesado_en: "2026-11-01T20:27:00-03:00",
    valores: {
      marca: "Cummins",
      modelo: "C-150",
      numero_serie: "CU-9102-M",
      falla_reportada: "Arranque dificultoso en frío.",
      diagnostico: "Baterías con baja carga y bornes sulfatados.",
      procedimiento:
        "Se limpiaron bornes, se cargaron las baterías y se probó el arranque.",
      repuesto_1_codigo: "B-4410",
      repuesto_1_descripcion: "Batería 12 V 90 Ah",
      repuesto_1_cantidad: "2",
      repuesto_2_codigo: "BT-2210",
      repuesto_2_descripcion: "Botón de arranque",
      repuesto_2_cantidad: "1",
      observaciones: "Se recomienda reemplazo de baterías en 6 meses.",
    },
    dudosos: {
      cliente: { confianza: "media", valor: "Cooperativa El Sol Ltda." },
      equipo: { confianza: "media", valor: "Grupo electrógeno" },
      numero_serie: { confianza: "baja", valor: "CU-9102-N" },
      tecnico: { confianza: "media", valor: "Mariela Ortíz" },
      repuesto_2_codigo: { confianza: "baja", valor: "8T-2210" },
    },
  },
  {
    numero: "000801",
    cliente: "Farmacia Belgrano",
    equipo: "Refrigerador",
    tecnico: "Téc. Bruno Salas",
    fecha: "2026-10-03",
    origen: "historico",
    recibido_en: "2026-10-04T08:45:00-03:00",
    procesado_en: "2026-10-04T08:47:00-03:00",
    valores: {
      marca: "Whirlpool",
      modelo: "WR-420",
      numero_serie: "WP-6650-N",
      falla_reportada: "No mantiene la temperatura de refrigeración.",
      diagnostico: "Termostato descalibrado.",
      procedimiento: "Se reemplazó el termostato y se calibró a 4 °C.",
      repuesto_1_codigo: "T-8802",
      repuesto_1_descripcion: "Termostato digital",
      repuesto_1_cantidad: "1",
      observaciones: "Temperatura estabilizada después de 2 horas.",
    },
    dudosos: {
      repuesto_1_codigo: { confianza: "baja", valor: "T-8807" },
      numero_serie: { confianza: "media", valor: "WP-6650-H" },
    },
    resueltos: {
      repuesto_1_codigo: {
        estado: "corregido",
        corregido: "T-8802",
        por: "Téc. Ana Salas",
        en: "2026-10-05T09:30:00-03:00",
      },
      numero_serie: {
        estado: "confirmado",
        por: "Téc. Ana Salas",
        en: "2026-10-05T09:31:00-03:00",
      },
    },
  },
  {
    numero: "000934",
    cliente: "Metalúrgica Andina",
    equipo: "Compresor",
    tecnico: "Téc. Lucía Paz",
    fecha: "2026-10-31",
    origen: "sistema",
    recibido_en: "2026-11-01T09:05:00-03:00",
    procesado_en: "2026-11-01T09:07:00-03:00",
    valores: {
      marca: "Atlas Copco",
      modelo: "GA-30",
      numero_serie: "AC-3312-P",
      falla_reportada: "Sobrecalentamiento del motor.",
      diagnostico: "Ventilador de enfriamiento obstruido.",
      procedimiento:
        "Se limpió el intercambiador, se revisó el ventilador y se midió temperatura.",
      repuesto_1_codigo: "V-1900",
      repuesto_1_descripcion: "Correa de ventilador",
      repuesto_1_cantidad: "1",
      observaciones: "Se programó seguimiento en 15 días.",
    },
    dudosos: {
      diagnostico: {
        confianza: "media",
        valor: "Ventilador de enfriamiento obstruido por polvo.",
      },
      procedimiento: {
        confianza: "baja",
        valor: "Se limpió el intercambiador y se midió temperatura.",
      },
      sello: { confianza: "media", valor: "RECIBIDO" },
    },
    resueltos: {
      procedimiento: {
        estado: "confirmado",
        por: "Téc. Daniel Rivas",
        en: "2026-11-01T17:20:00-03:00",
      },
    },
  },
];

export const REPORTES_SIMULADOS: readonly Reporte[] = SEMILLAS.map(
  construirReporte,
);
