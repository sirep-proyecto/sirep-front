/**
 * Responsabilidad: verificar que el archivo simulado cubre los casos que el
 * proyecto exige (caso 000845, no leído, corrección humana, completo,
 * recibido y tipos especiales de campo).
 * Existe porque estos datos son la especificación visible del prototipo: si se
 * rompen, la demo deja de mostrar justo lo que hay que revisar.
 */

import { describe, expect, it } from "vitest";

import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";
import { esDudoso } from "@/features/revision/lib/dudosos";
import { REPORTES_SIMULADOS } from "@/mocks/reportes";

function porNumero(numero: string) {
  const reporte = REPORTES_SIMULADOS.find((r) => r.numero_reporte === numero);
  expect(reporte, `falta el reporte N° ${numero}`).toBeDefined();
  return reporte!;
}

function campoDe(numero: string, id: (typeof CAMPOS_FORMULARIO)[number]["id"]) {
  const reporte = porNumero(numero);
  const campo = reporte.campos.find((c) => c.id === id);
  expect(campo, `el reporte ${numero} no tiene el campo ${id}`).toBeDefined();
  return campo!;
}

describe("reportes simulados", () => {
  it("tiene entre 8 y 12 reportes", () => {
    expect(REPORTES_SIMULADOS.length).toBeGreaterThanOrEqual(8);
    expect(REPORTES_SIMULADOS.length).toBeLessThanOrEqual(12);
  });

  it("cubre el caso N° 000845 con sus tres niveles de confianza", () => {
    expect(campoDe("000845", "cliente").valor_modelo).toBeTruthy();
    expect(campoDe("000845", "cliente").confianza).toBe("alta");
    expect(campoDe("000845", "fecha").valor_modelo).toBeTruthy();
    expect(campoDe("000845", "numero_serie").valor_modelo).toBeTruthy();

    expect(campoDe("000845", "procedimiento").confianza).toBe("media");
    expect(campoDe("000845", "procedimiento").valor_modelo).toBeTruthy();

    const repuesto = campoDe("000845", "repuesto_1_codigo");
    expect(repuesto.no_leido).toBe(true);
    expect(repuesto.estado_revision).toBe("pendiente");
    expect(esDudoso(repuesto)).toBe(true);
  });

  it("incluye al menos un campo corregido por una persona, con auditoría", () => {
    const corregido = REPORTES_SIMULADOS.flatMap((r) => r.campos).find(
      (c) => c.estado_revision === "corregido",
    );

    expect(corregido).toBeDefined();
    expect(corregido?.valor_corregido).toBeTruthy();
    expect(corregido?.corregido_por).toBeTruthy();
    expect(corregido?.corregido_en).toBeTruthy();
  });

  it("incluye al menos un reporte completo y uno recibido", () => {
    expect(REPORTES_SIMULADOS.some((r) => r.estado === "completo")).toBe(true);
    expect(REPORTES_SIMULADOS.some((r) => r.estado === "recibido")).toBe(true);
  });

  it("incluye reportes en revisión y procesados", () => {
    expect(REPORTES_SIMULADOS.some((r) => r.estado === "en_revision")).toBe(
      true,
    );
    expect(REPORTES_SIMULADOS.some((r) => r.estado === "procesado")).toBe(
      true,
    );
  });

  it("tiene campos de todos los orígenes", () => {
    expect(REPORTES_SIMULADOS.some((r) => r.origen === "historico")).toBe(true);
    expect(REPORTES_SIMULADOS.some((r) => r.origen === "sistema")).toBe(true);
  });

  it("cubre los tipos de campo especiales: firma, sello y multilinea", () => {
    const tipos = new Set(CAMPOS_FORMULARIO.map((c) => c.tipo));
    expect(tipos.has("firma")).toBe(true);
    expect(tipos.has("sello")).toBe(true);
    expect(tipos.has("multilinea")).toBe(true);

    const conFirma = REPORTES_SIMULADOS.find((r) =>
      r.campos.some((c) => c.id === "firma_cliente" && c.valor_modelo),
    );
    expect(conFirma, "ningún reporte tiene firma registrada").toBeDefined();
  });

  it("todos los campos del inventario existen en todos los reportes", () => {
    for (const reporte of REPORTES_SIMULADOS) {
      expect(reporte.campos.map((c) => c.id).sort()).toEqual(
        CAMPOS_FORMULARIO.map((c) => c.id).sort(),
      );
    }
  });
});
