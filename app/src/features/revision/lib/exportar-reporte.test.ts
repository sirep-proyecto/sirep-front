import { describe, expect, it } from "vitest";

import { generarMarkdownReporte } from "./serializador-markdown";
import { generarPDFReporte } from "./generador-pdf";
import type { ReporteVista } from "@/features/revision/types/dominio";
import { MAPA_POR_DEFECTO, obtenerMapa } from "@/config/regiones";
import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";

function crearReportePrueba(): ReporteVista {
  const mapa = obtenerMapa(MAPA_POR_DEFECTO);
  const campos = CAMPOS_FORMULARIO.map((definicion) => ({
    id: definicion.id,
    valor_modelo: definicion.id === "tecnico" ? "Carlos" : definicion.id === "empresa" ? "Bocetto" : "Dato modelo",
    confianza: "alta" as const,
    no_leido: false,
    valor_corregido: definicion.id === "procedimiento" ? "Se reparó cabezal 1" : null,
    estado_revision: "auto" as const,
    revisado_por: null,
    revisado_en: null,
    corregido_por: null,
    corregido_en: null,
    definicion,
    region: mapa.regiones[definicion.id],
  }));

  return {
    id: "rep-001241",
    numero_reporte: "001241",
    numero_talonario: "T-01",
    cliente: "Bocetto",
    equipo: "Ecosolvente",
    tecnico: "Carlos",
    fecha_reporte: "2025-08-12",
    origen: "sistema",
    estado: "completo",
    diseno_talonario: MAPA_POR_DEFECTO,
    escaneo: {
      id: "esc-1",
      numero_reporte: "001241",
      ruta_original: "escaneos/001241.pdf",
      paginas: 1,
      paginas_urls: [],
      enviado_por: "Carlos",
      canal: "telegram",
      estado: "completo",
      recibido_en: "2025-08-12T10:00:00Z",
      procesado_en: "2025-08-12T10:05:00Z",
    },
    campos,
    mapa,
    creado_en: "2025-08-12T10:00:00Z",
    actualizado_en: "2025-08-12T10:30:00Z",
    completado_en: "2025-08-12T10:30:00Z",
  };
}

describe("Exportación de reportes", () => {
  it("genera un markdown estructurado según BACETTO_03.md", () => {
    const reporte = crearReportePrueba();
    const md = generarMarkdownReporte(reporte);

    expect(md).toContain("# **Reporte técnico N.º 001241**");
    expect(md).toContain("**Encabezado:** GO LATAM – Soporte técnico multimarcas");
    expect(md).toContain("| **Técnico** | Carlos |");
    expect(md).toContain("| **Empresa** | Bocetto |");
    // Prioriza el valor corregido
    expect(md).toContain("| **Procedimiento** | Se reparó cabezal 1 |");
    expect(md).toContain("## **Revisión inicial**");
    expect(md).toContain("## **Procedimiento, conclusión y recomendaciones**");
    expect(md).toContain("## **Repuestos e información de la labor**");
    expect(md).toContain("WhatsApp: 51 943116468");
  });

  it("genera un documento PDF válido con jsPDF", () => {
    const reporte = crearReportePrueba();
    const doc = generarPDFReporte(reporte);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});

