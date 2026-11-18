import { describe, expect, it } from "vitest";

import { armarCambio, describirClave, type EstadoIa } from "./config-ia";

const estado: EstadoIa = {
  proveedor: "gemini",
  modelos: { gemini: "gemini-3.8-flash", openai: "gpt-4o-mini" },
  claves: {
    gemini: { configurada: true, final: "1234", origen: "pantalla" },
    openai: { configurada: true, final: "5678", origen: "pantalla" },
  },
  origen: "pantalla",
  disponible: true,
  actualizado_por: null,
  actualizado_en: null,
  modelos_sugeridos: { gemini: [], openai: [] },
};

describe("armarCambio", () => {
  it("al cambiar de proveedor sin pegar clave no manda ninguna: la guardada se conserva", () => {
    const cambio = armarCambio("openai", { ...estado.modelos }, { gemini: "", openai: "  " }, estado);
    expect(cambio).toEqual({ proveedor: "openai" });
  });

  it("manda solo el modelo que cambió y la clave nueva, sin espacios", () => {
    const cambio = armarCambio(
      "openai",
      { gemini: "gemini-3.8-flash", openai: " gpt-4.1-mini " },
      { gemini: "", openai: " sk-nueva-123456 " },
      estado,
    );
    expect(cambio).toEqual({ proveedor: "openai", modelo_openai: "gpt-4.1-mini", clave_openai: "sk-nueva-123456" });
  });
});

describe("describirClave", () => {
  it("muestra de dónde viene la clave sin revelarla", () => {
    expect(describirClave({ configurada: true, final: "1234", origen: "pantalla" })).toBe("Guardada ••••1234");
    expect(describirClave({ configurada: true, final: "0000", origen: "servidor" })).toBe("Del servidor ••••0000");
    expect(describirClave({ configurada: false, final: null, origen: null })).toBe("Sin clave");
    expect(describirClave({ configurada: false, final: null, origen: null, ilegible: true })).toContain("vuelve a pegarla");
  });
});
