import { describe, expect, it } from "vitest";

import {
  clasificarFallo,
  interpretarRespuestaHttp,
  leerRespuestaUpload,
  numeroDetectado,
  textoDudas,
  textoDuplicado,
} from "./respuesta";

describe("clasificarFallo", () => {
  it("reconoce el 409 de archivo duplicado con todos sus datos", () => {
    const r = clasificarFallo(409, {
      statusCode: 409,
      message: "dup",
      codigo: "archivo_duplicado",
      numeroReporte: "000412",
      escaneoId: "e1",
      recibidoEn: "2026-11-10T12:00:00Z",
      origen: "telegram",
      enviadoPor: "Ana",
    });
    expect(r.tipo).toBe("duplicado");
    if (r.tipo === "duplicado") {
      expect(r.info.codigo).toBe("archivo_duplicado");
      expect(r.info.numeroReporte).toBe("000412");
      expect(r.info.origen).toBe("telegram");
    }
  });

  it("reconoce el 409 viejo con solo message", () => {
    const r = clasificarFallo(409, { message: "Ya existe ese reporte" });
    expect(r).toMatchObject({
      tipo: "duplicado",
      info: { codigo: "desconocido", mensaje: "Ya existe ese reporte" },
    });
  });

  it("tolera campos null en el 409", () => {
    const r = clasificarFallo(409, {
      codigo: "reporte_duplicado",
      numeroReporte: "000375",
      enviadoPor: null,
      recibidoEn: null,
      origen: null,
    });
    expect(r.tipo === "duplicado" && r.info.enviadoPor).toBeUndefined();
  });

  it("muestra el message del backend y marca los no reintentables", () => {
    const r = clasificarFallo(400, { message: "Eso no es un PDF", codigo: "formato_no_admitido" });
    expect(r).toEqual({
      tipo: "error",
      fallo: { mensaje: "Eso no es un PDF", codigo: "formato_no_admitido", reintentable: false },
    });
  });

  it("une un message en arreglo", () => {
    const r = clasificarFallo(400, { message: ["a", "b"] });
    expect(r.tipo === "error" && r.fallo.mensaje).toBe("a · b");
  });

  it("usa texto en español según el código si no hay message", () => {
    const r = clasificarFallo(502, { codigo: "lectura_ia" });
    expect(r.tipo === "error" && r.fallo.mensaje).toMatch(/IA no pudo leer/);
    expect(r.tipo === "error" && r.fallo.reintentable).toBe(true);
  });

  it("413 es muy grande y no se reintenta", () => {
    const r = clasificarFallo(413, "Payload Too Large");
    expect(r.tipo === "error" && r.fallo.reintentable).toBe(false);
  });

  it("red y timeout dan textos genéricos reintentables", () => {
    const red = clasificarFallo(0, undefined);
    const tiempo = clasificarFallo(408, undefined);
    expect(red.tipo === "error" && red.fallo.mensaje).toMatch(/conectar/);
    expect(tiempo.tipo === "error" && tiempo.fallo.reintentable).toBe(true);
  });
});

describe("textoDuplicado", () => {
  it("archivo duplicado desde Telegram", () => {
    const t = textoDuplicado({
      codigo: "archivo_duplicado",
      numeroReporte: "000412",
      origen: "telegram",
      enviadoPor: "Ana",
      recibidoEn: "2026-11-10T12:00:00",
    });
    expect(t.titulo).toBe("Ya estaba subido · es el reporte N° 000412");
    expect(t.detalle).toBe("(llegó por Telegram el 10/11)");
  });

  it("archivo duplicado subido desde la página", () => {
    const t = textoDuplicado({
      codigo: "archivo_duplicado",
      numeroReporte: "7",
      origen: "web",
      recibidoEn: "2026-11-10T12:00:00",
    });
    expect(t.detalle).toBe("(se subió desde la página el 10/11)");
  });

  it("reporte duplicado y caso viejo", () => {
    expect(textoDuplicado({ codigo: "reporte_duplicado", numeroReporte: "000375" }).titulo).toBe(
      "Ya existe un reporte con el N° 000375",
    );
    expect(textoDuplicado({ codigo: "desconocido", mensaje: "Ya existe" }).titulo).toBe("Ya existe");
  });
});

describe("respuesta de éxito", () => {
  it("normaliza la respuesta", () => {
    expect(
      leerRespuestaUpload({
        escaneoId: "e1",
        numeroReporte: "000375",
        estado: "procesado",
        camposDudosos: ["a", "b", "c"],
        totalPaginas: 2,
      }),
    ).toMatchObject({ numeroReporte: "000375", totalPaginas: 2, camposDudosos: ["a", "b", "c"] });
    expect(leerRespuestaUpload("x")).toBeNull();
  });

  it("'Sin N° detectado' no cuenta como número", () => {
    const base = { escaneoId: "e", estado: "", camposDudosos: [] };
    expect(numeroDetectado({ ...base, numeroReporte: "Sin N° detectado" })).toBeNull();
    expect(numeroDetectado({ ...base, numeroReporte: null })).toBeNull();
    expect(numeroDetectado({ ...base, numeroReporte: "000375" })).toBe("000375");
  });

  it("texto de dudas", () => {
    expect(textoDudas(0)).toBe("sin dudas");
    expect(textoDudas(1)).toBe("1 campo por revisar");
    expect(textoDudas(3)).toBe("3 campos por revisar");
  });
});

describe("interpretarRespuestaHttp", () => {
  it("parsea JSON y separa éxito de error", () => {
    expect(interpretarRespuestaHttp(201, '{"a":1}', "application/json; charset=utf-8")).toEqual({
      ok: true,
      cuerpo: { a: 1 },
    });
    expect(interpretarRespuestaHttp(409, '{"codigo":"x"}', "application/json")).toEqual({
      ok: false,
      status: 409,
      cuerpo: { codigo: "x" },
    });
    expect(interpretarRespuestaHttp(502, "Bad Gateway", "text/html")).toMatchObject({
      ok: false,
      cuerpo: "Bad Gateway",
    });
  });
});
