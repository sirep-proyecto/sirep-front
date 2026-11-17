import { afterEach, describe, expect, it, vi } from "vitest";

import { generarMarkdownReporte } from "./serializador-markdown";
import { descargarReportePDF } from "./descargas";
import * as api from "@/lib/api";
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

  it("descarga el PDF que genera el backend con el nombre Reporte_<número>.pdf", async () => {
    const pedir = vi
      .spyOn(api, "obtenerPdfReporte")
      .mockResolvedValue(new Blob(["%PDF-1.7"], { type: "application/pdf" }));
    // El runner corre en node: se simula solo lo que usa la descarga del navegador.
    const nombres: string[] = [];
    const enlace = { href: "", download: "", click: () => nombres.push(enlace.download) };
    vi.stubGlobal("document", {
      createElement: () => enlace,
      body: { appendChild: () => undefined, removeChild: () => undefined },
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:prueba");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await descargarReportePDF(crearReportePrueba());

    expect(pedir).toHaveBeenCalledWith("001241");
    expect(nombres).toEqual(["Reporte_001241.pdf"]);
  });

  it("propaga el error si el backend no pudo generar el PDF", async () => {
    vi.spyOn(api, "obtenerPdfReporte").mockRejectedValue(new Error("boom"));
    await expect(descargarReportePDF(crearReportePrueba())).rejects.toThrow("boom");
  });
});
