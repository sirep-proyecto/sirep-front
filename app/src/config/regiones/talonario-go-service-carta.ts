/**
 * Responsabilidad: mapa de regiones del talonario "Reporte técnico" de GO
 * Service Latam (tamaño carta, una cara).
 * Existe para recortar la zona exacta de cada campo sobre el escaneo, sin
 * depender de que el modelo de IA informe coordenadas. Si aparece otro diseño de
 * talonario, se agrega otro archivo como este y se registra en `index.ts`.
 *
 * Coordenadas normalizadas 0–1, calibradas sobre un escaneo plano y completo de
 * 1275 × 1650 px (carta a 150 dpi).
 *
 * LIMITACIÓN CONOCIDA: las regiones son fijas. Solo recortan bien cuando la hoja
 * ocupa toda la imagen y está derecha (escáner de la impresora). Una foto con otro
 * encuadre, inclinación o perspectiva desplaza el recorte; en ese caso el técnico
 * usa el visor del escaneo completo. Ver "pendientes" en el informe de mejoras.
 */

import type { MapaRegiones } from "@/features/revision/types/regiones";

export const MAPA_TALONARIO_GO_SERVICE: MapaRegiones = {
  id: "talonario-go-service-carta",
  nombre: "Talonario GO Service · Carta",
  descripcion:
    "Reporte técnico de una cara: identificación arriba, revisión inicial, procedimiento, conclusión, repuestos y horas de la visita.",
  ancho_pagina: 1275,
  alto_pagina: 1650,
  paginas: 1,
  regiones: {
    tecnico: { x: 0.7, y: 0.145, ancho: 0.228, alto: 0.023, pagina: 1 },
    empresa: { x: 0.152, y: 0.2085, ancho: 0.43, alto: 0.0215, pagina: 1 },
    fecha: { x: 0.64, y: 0.2085, ancho: 0.115, alto: 0.0215, pagina: 1 },
    direccion: { x: 0.158, y: 0.236, ancho: 0.536, alto: 0.0215, pagina: 1 },
    equipo: { x: 0.762, y: 0.236, ancho: 0.166, alto: 0.0215, pagina: 1 },
    motivo: { x: 0.561, y: 0.262, ancho: 0.368, alto: 0.0205, pagina: 1 },
    estado_del_equipo: { x: 0.075, y: 0.347, ancho: 0.345, alto: 0.021, pagina: 1 },
    procedimiento: { x: 0.065, y: 0.423, ancho: 0.862, alto: 0.183, pagina: 1 },
    conclusion: { x: 0.065, y: 0.617, ancho: 0.862, alto: 0.054, pagina: 1 },
    recomendaciones: { x: 0.065, y: 0.683, ancho: 0.862, alto: 0.054, pagina: 1 },
    codigo_repuesto: { x: 0.065, y: 0.7985, ancho: 0.122, alto: 0.0625, pagina: 1 },
    hora_llegada: { x: 0.812, y: 0.782, ancho: 0.112, alto: 0.022, pagina: 1 },
    hora_salida: { x: 0.812, y: 0.809, ancho: 0.112, alto: 0.022, pagina: 1 },
  },
};
