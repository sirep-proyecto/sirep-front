import { describe, expect, it } from "vitest";

import { etiquetaRevisores, revisoresDeReporte } from "@/features/revision/lib/revisores";
import type { CampoReporte } from "@/features/revision/types/dominio";

function campo(parcial: Partial<CampoReporte>): CampoReporte {
  return {
    id: "cliente",
    valor_modelo: null,
    confianza: "alta",
    no_leido: false,
    valor_corregido: null,
    estado_revision: "auto",
    revisado_por: null,
    revisado_en: null,
    corregido_por: null,
    corregido_en: null,
    ...parcial,
  } as CampoReporte;
}

describe("revisoresDeReporte", () => {
  it("devuelve vacío si nadie revisó nada", () => {
    expect(revisoresDeReporte([campo({}), campo({})])).toEqual([]);
  });

  it("junta quienes confirmaron y quienes corrigieron, sin repetir", () => {
    const nombres = revisoresDeReporte([
      campo({ revisado_por: "Ana", revisado_en: "2026-11-17T10:00:00Z" }),
      campo({ corregido_por: "Ana", corregido_en: "2026-11-17T10:05:00Z" }),
      campo({ revisado_por: "Luis", revisado_en: "2026-11-17T09:00:00Z" }),
    ]);
    expect(nombres).toEqual(["Ana", "Luis"]);
  });

  it("pone primero a quien intervino más recientemente", () => {
    const nombres = revisoresDeReporte([
      campo({ revisado_por: "Ana", revisado_en: "2026-11-16T10:00:00Z" }),
      campo({ revisado_por: "Luis", revisado_en: "2026-11-17T10:00:00Z" }),
    ]);
    expect(nombres).toEqual(["Luis", "Ana"]);
  });

  it("ignora nombres vacíos", () => {
    expect(revisoresDeReporte([campo({ revisado_por: "  " })])).toEqual([]);
  });
});

describe("etiquetaRevisores", () => {
  it("resume la lista para la celda", () => {
    expect(etiquetaRevisores([])).toBeNull();
    expect(etiquetaRevisores(["Ana"])).toBe("Ana");
    expect(etiquetaRevisores(["Luis", "Ana", "Pedro"])).toBe("Luis +2");
  });
});
