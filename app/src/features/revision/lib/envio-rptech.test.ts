import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api";

import {
  contarPorEnviar,
  loteConProblemas,
  mensajeEnvioExitoso,
  mensajeErrorEnvio,
  puedeEnviarse,
  textoBotonEnvio,
  textoResumenLote,
  type ResumenLote,
} from "./envio-rptech";

const base = {
  origen: "historico" as const,
  estado: "completo" as const,
  estado_reporte: "aprobado",
  rptech_id: null,
  rptech_error: null,
};
const rechazado = {
  ...base,
  estado_reporte: "observado",
  rptech_error: { codigo: "datos_invalidos", detalle: {} },
};
const reintentar = { ...base, rptech_error: { codigo: "reintentar", detalle: "x" } };
const guardado = { ...base, rptech_id: "rt-1", estado_reporte: "aprobado_rptech" };

describe("envío a RP-TECH", () => {
  it("el botón por fila solo aparece donde corresponde", () => {
    expect(puedeEnviarse(base)).toBe(true);
    expect(puedeEnviarse(reintentar)).toBe(true);
    expect(puedeEnviarse(rechazado)).toBe(true);
    expect(puedeEnviarse(guardado)).toBe(false);
    expect(puedeEnviarse({ ...base, origen: "sistema" })).toBe(false);
    expect(puedeEnviarse({ ...base, estado: "en_revision", estado_reporte: "pendiente_revision" })).toBe(false);
  });

  it("dice Enviar o Reenviar según el estado", () => {
    expect(textoBotonEnvio(base)).toBe("Enviar");
    expect(textoBotonEnvio(reintentar)).toBe("Reenviar");
    expect(textoBotonEnvio(rechazado)).toBe("Reenviar");
  });

  it("cuenta por enviar y por reintentar, no rechazados ni guardados", () => {
    expect(contarPorEnviar([base, reintentar, rechazado, guardado, { ...base, origen: "sistema" }])).toBe(2);
    expect(contarPorEnviar([])).toBe(0);
  });

  it("mensaje de éxito individual", () => {
    const r = { numero_reporte: "1", mensaje: "" };
    expect(mensajeEnvioExitoso({ ...r, status: "importado_exitoso" })).toBe("Enviado a RP-TECH");
    expect(mensajeEnvioExitoso({ ...r, status: "ya_importado" })).toBe("Ya estaba en RP-TECH");
  });

  it("errores: usa el message del backend y cae a textos por código", () => {
    expect(mensajeErrorEnvio(new ApiError("RP-TECH no respondió", 503))).toBe("RP-TECH no respondió");
    expect(mensajeErrorEnvio(new ApiError("Campos inválidos", 409, { codigo: "x" }))).toBe("Campos inválidos");
    expect(mensajeErrorEnvio(new ApiError("", 409))).toBe("RP-TECH rechazó el reporte.");
    expect(mensajeErrorEnvio(new ApiError("", 503))).toBe("RP-TECH no está disponible en este momento.");
    expect(mensajeErrorEnvio(new ApiError("falló", 0))).toMatch(/No hay conexión/);
    expect(mensajeErrorEnvio(new ApiError("t", 408))).toMatch(/No hay conexión/);
    expect(mensajeErrorEnvio("raro")).toBe("No se pudo enviar el reporte a RP-TECH.");
  });

  it("resumen del lote", () => {
    const r: ResumenLote = {
      totalRevisadosListos: 8,
      importadosNuevos: 3,
      yaImportados: 1,
      pendientesOmitidos: 0,
      numerosImportados: ["1", "2", "3"],
      observados: ["000845", "000846"],
      porReintentar: ["7"],
    };
    expect(textoResumenLote(r)).toBe("3 enviados · 1 ya estaba · 2 rechazados (N°s 000845, 000846) · 1 por reintentar");
    expect(loteConProblemas(r)).toBe(true);
    const ok = { ...r, importadosNuevos: 1, yaImportados: 2, observados: [], porReintentar: [] };
    expect(textoResumenLote(ok)).toBe("1 enviado · 2 ya estaban");
    expect(loteConProblemas(ok)).toBe(false);
    expect(textoResumenLote({ ...ok, importadosNuevos: 0, yaImportados: 0 })).toBe("No había reportes para enviar.");
    expect(textoResumenLote({ ...r, importadosNuevos: 0, yaImportados: 0, observados: ["9"], porReintentar: [] })).toBe("1 rechazado (N° 9)");
  });
});
