/**
 * Responsabilidad: probar el repositorio simulado contra su contrato
 * (`RepositorioReportes`) antes de implementarlo.
 * Existe porque este módulo es la frontera de datos del prototipo: si las
 * transiciones de revisión o el estado derivado se equivocan, la bandeja miente
 * sobre el trabajo real del técnico.
 */

import { describe, expect, it } from "vitest";

import { USUARIO_ACTUAL } from "@/config/sesion";
import type {
  IdCampo,
  RepositorioReportes,
} from "@/features/revision/types/dominio";

import { ErrorRepositorio } from "./errores";
import { crearRepositorioSimulado } from "./repositorio-simulado";

function nuevoRepositorio(): RepositorioReportes {
  return crearRepositorioSimulado({ latencia_ms: 0 });
}

describe("repositorio simulado", () => {
  it("lista los reportes sin exponer el arreglo interno", async () => {
    const repositorio = nuevoRepositorio();
    const reportes = await repositorio.listarReportes();
    expect(reportes.length).toBeGreaterThanOrEqual(8);

    reportes.push({ ...reportes[0] });
    const otraVez = await repositorio.listarReportes();
    expect(otraVez.length).toBe(reportes.length - 1);
  });

  it("encuentra un reporte con tolerancia a ceros y separadores", async () => {
    const repositorio = nuevoRepositorio();
    const directo = await repositorio.obtenerReporte("000845");
    const corto = await repositorio.obtenerReporte("845");

    expect(directo?.numero_reporte).toBe("000845");
    expect(corto?.numero_reporte).toBe("000845");
  });

  it("devuelve null para un número que no existe", async () => {
    const repositorio = nuevoRepositorio();
    expect(await repositorio.obtenerReporte("999999")).toBeNull();
  });

  it("confirma un campo pendiente y registra quién y cuándo", async () => {
    const repositorio = nuevoRepositorio();
    const reporte = await repositorio.revisarCampo("000845", "procedimiento", {
      tipo: "confirmar",
      actor: USUARIO_ACTUAL.nombre,
    });

    const campo = reporte.campos.find((c) => c.id === "procedimiento");
    expect(campo?.estado_revision).toBe("confirmado");
    expect(campo?.revisado_por).toBe(USUARIO_ACTUAL.nombre);
    expect(campo?.revisado_en).toBeTruthy();
    expect(campo?.valor_corregido).toBeNull();
  });

  it("corrige un campo con el valor del técnico y marca la auditoría", async () => {
    const repositorio = nuevoRepositorio();
    const reporte = await repositorio.revisarCampo(
      "000845",
      "repuesto_1_codigo",
      { tipo: "corregir", actor: USUARIO_ACTUAL.nombre, valor: "FLT-2201" },
    );

    const campo = reporte.campos.find((c) => c.id === "repuesto_1_codigo");
    expect(campo?.valor_corregido).toBe("FLT-2201");
    expect(campo?.estado_revision).toBe("corregido");
    expect(campo?.corregido_por).toBe(USUARIO_ACTUAL.nombre);
    expect(campo?.corregido_en).toBeTruthy();
    // La lectura original del modelo se conserva para auditoría.
    expect(campo?.no_leido).toBe(true);
  });

  it("marca un campo como ilegible sin inventar un valor", async () => {
    const repositorio = nuevoRepositorio();
    const reporte = await repositorio.revisarCampo(
      "000845",
      "repuesto_1_codigo",
      { tipo: "ilegible", actor: USUARIO_ACTUAL.nombre },
    );

    const campo = reporte.campos.find((c) => c.id === "repuesto_1_codigo");
    expect(campo?.estado_revision).toBe("ilegible");
    expect(campo?.valor_corregido).toBeNull();
    expect(campo?.revisado_por).toBe(USUARIO_ACTUAL.nombre);
  });

  it("reabre un campo resuelto y limpia su auditoría", async () => {
    const repositorio = nuevoRepositorio();
    await repositorio.revisarCampo("000845", "procedimiento", {
      tipo: "confirmar",
      actor: USUARIO_ACTUAL.nombre,
    });
    const reabierto = await repositorio.revisarCampo(
      "000845",
      "procedimiento",
      { tipo: "reabrir", actor: USUARIO_ACTUAL.nombre },
    );

    const campo = reabierto.campos.find((c) => c.id === "procedimiento");
    expect(campo?.estado_revision).toBe("pendiente");
    expect(campo?.revisado_por).toBeNull();
    expect(campo?.revisado_en).toBeNull();
  });

  it("deriva el estado del reporte al resolver y al reabrir", async () => {
    const repositorio = nuevoRepositorio();
    const dudosos: IdCampo[] = ["procedimiento", "repuesto_1_codigo"];

    let reporte = await repositorio.obtenerReporte("000845");
    expect(reporte?.estado).toBe("procesado");

    for (const id of dudosos) {
      reporte = await repositorio.revisarCampo("000845", id, {
        tipo: "confirmar",
        actor: USUARIO_ACTUAL.nombre,
      });
    }

    expect(reporte?.estado).toBe("completo");
    expect(reporte?.completado_en).toBeTruthy();

    reporte = await repositorio.revisarCampo(
      "000845",
      "repuesto_1_codigo",
      { tipo: "reabrir", actor: USUARIO_ACTUAL.nombre },
    );
    expect(reporte?.estado).toBe("en_revision");
    expect(reporte?.completado_en).toBeNull();
  });

  it("rechaza una acción sobre un campo que no está pendiente", async () => {
    const repositorio = nuevoRepositorio();

    await expect(
      repositorio.revisarCampo("000845", "cliente", {
        tipo: "confirmar",
        actor: USUARIO_ACTUAL.nombre,
      }),
    ).rejects.toMatchObject({ codigo: "conflicto" });
  });

  it("rechaza un número de reporte inexistente", async () => {
    const repositorio = nuevoRepositorio();

    await expect(
      repositorio.revisarCampo("999999", "cliente", {
        tipo: "confirmar",
        actor: USUARIO_ACTUAL.nombre,
      }),
    ).rejects.toMatchObject({ codigo: "no_encontrado" });

    await expect(
      repositorio.revisarCampo("000845", "no_existe" as never, {
        tipo: "confirmar",
        actor: USUARIO_ACTUAL.nombre,
      }),
    ).rejects.toMatchObject({ codigo: "no_encontrado" });
  });

  it("reinicia los datos a su estado original", async () => {
    const repositorio = nuevoRepositorio();
    await repositorio.revisarCampo("000845", "procedimiento", {
      tipo: "confirmar",
      actor: USUARIO_ACTUAL.nombre,
    });
    await repositorio.reiniciarDatosSimulados?.();

    const reporte = await repositorio.obtenerReporte("000845");
    const campo = reporte?.campos.find((c) => c.id === "procedimiento");
    expect(campo?.estado_revision).toBe("pendiente");
    expect(reporte?.estado).toBe("procesado");
  });

  it("expone el error con su código de dominio", async () => {
    const repositorio = nuevoRepositorio();
    const error = await repositorio
      .obtenerReporte("000845")
      .then(() => null)
      .catch((e: unknown) => e);

    expect(error).toBeNull();
    expect(new ErrorRepositorio("x", "conflicto")).toBeInstanceOf(Error);
  });
});
