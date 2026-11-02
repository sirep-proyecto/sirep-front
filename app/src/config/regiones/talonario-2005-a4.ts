/**
 * Responsabilidad: mapa de regiones del talonario técnico A4 de dos páginas.
 * Existe para recortar la zona exacta de cada campo sobre el escaneo, sin
 * depender de que el modelo de IA informe coordenadas. Si aparece otro diseño de
 * talonario, se agrega otro archivo como este y se registra en `index.ts`.
 *
 * Coordenadas normalizadas 0–1 medidas sobre una hoja de 1000 × 1414 px.
 */

import type { MapaRegiones } from "@/features/revision/types/regiones";

export const MAPA_TALONARIO_2005: MapaRegiones = {
  id: "talonario-2005-a4",
  nombre: "Talonario técnico 2005 · A4",
  descripcion:
    "Formulario de dos páginas: servicio en el anverso, observaciones y firmas en el reverso.",
  ancho_pagina: 1000,
  alto_pagina: 1414,
  paginas: 2,
  regiones: {
    numero_reporte: { x: 0.7, y: 0.055, ancho: 0.21, alto: 0.036, pagina: 1 },

    fecha: { x: 0.1, y: 0.145, ancho: 0.25, alto: 0.03, pagina: 1 },
    cliente: { x: 0.1, y: 0.205, ancho: 0.56, alto: 0.032, pagina: 1 },

    equipo: { x: 0.1, y: 0.265, ancho: 0.56, alto: 0.032, pagina: 1 },
    marca: { x: 0.1, y: 0.325, ancho: 0.24, alto: 0.03, pagina: 1 },
    modelo: { x: 0.38, y: 0.325, ancho: 0.24, alto: 0.03, pagina: 1 },
    numero_serie: { x: 0.66, y: 0.325, ancho: 0.25, alto: 0.03, pagina: 1 },

    tecnico: { x: 0.1, y: 0.385, ancho: 0.42, alto: 0.03, pagina: 1 },
    falla_reportada: { x: 0.1, y: 0.445, ancho: 0.8, alto: 0.06, pagina: 1 },
    diagnostico: { x: 0.1, y: 0.535, ancho: 0.8, alto: 0.07, pagina: 1 },
    procedimiento: { x: 0.1, y: 0.635, ancho: 0.8, alto: 0.095, pagina: 1 },

    repuesto_1_codigo: { x: 0.1, y: 0.806, ancho: 0.19, alto: 0.025, pagina: 1 },
    repuesto_1_descripcion: { x: 0.305, y: 0.806, ancho: 0.44, alto: 0.025, pagina: 1 },
    repuesto_1_cantidad: { x: 0.765, y: 0.806, ancho: 0.075, alto: 0.025, pagina: 1 },

    repuesto_2_codigo: { x: 0.1, y: 0.838, ancho: 0.19, alto: 0.025, pagina: 1 },
    repuesto_2_descripcion: { x: 0.305, y: 0.838, ancho: 0.44, alto: 0.025, pagina: 1 },
    repuesto_2_cantidad: { x: 0.765, y: 0.838, ancho: 0.075, alto: 0.025, pagina: 1 },

    observaciones: { x: 0.1, y: 0.12, ancho: 0.8, alto: 0.2, pagina: 2 },
    firma_cliente: { x: 0.1, y: 0.64, ancho: 0.4, alto: 0.095, pagina: 2 },
    sello: { x: 0.62, y: 0.6, ancho: 0.28, alto: 0.16, pagina: 2 },
  },
};
