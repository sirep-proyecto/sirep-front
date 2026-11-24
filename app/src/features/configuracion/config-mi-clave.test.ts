import { describe, expect, it } from "vitest";

import { describirMiClave, sePuedeElegir, textoOpcionModelo, type EstadoMiClave } from "./config-mi-clave";

const base: EstadoMiClave = {
  disponible: true,
  configurada: true,
  final: "7f3K",
  modelo: "gemini-3.5-flash-lite",
  activa: true,
  lecturas: 3,
  ultimo_uso_en: null,
  ultimo_error: null,
  ultimo_error_en: null,
  ilegible: false,
  modelo_por_defecto: "gemini-3.5-flash-lite",
};

describe("Mi clave de Gemini", () => {
  it("describe el estado de la clave sin mostrarla entera", () => {
    expect(describirMiClave(base)).toContain("••••7f3K activa");
    expect(describirMiClave({ ...base, activa: false })).toContain("pausada");
    expect(describirMiClave({ ...base, configurada: false })).toContain("clave de la empresa");
    expect(describirMiClave({ ...base, ilegible: true })).toContain("vuelve a pegarla");
  });

  it("el selector marca el recomendado y si es gratuito", () => {
    expect(textoOpcionModelo({ id: "gemini-3.5-flash-lite", cupo: "gratuito", por_defecto: true })).toBe(
      "gemini-3.5-flash-lite · gratuito · recomendado",
    );
    expect(textoOpcionModelo({ id: "gemini-4-neon", cupo: "sin_cupo_gratuito", por_defecto: false })).toBe("gemini-4-neon · de pago");
  });

  it("no deja elegir modelos de pago ni sin acceso", () => {
    expect(sePuedeElegir({ id: "a", cupo: "gratuito", por_defecto: false })).toBe(true);
    expect(sePuedeElegir({ id: "a", cupo: "sin_probar", por_defecto: false })).toBe(true);
    expect(sePuedeElegir({ id: "a", cupo: "sin_cupo_gratuito", por_defecto: false })).toBe(false);
    expect(sePuedeElegir({ id: "a", cupo: "no_disponible", por_defecto: false })).toBe(false);
  });
});
