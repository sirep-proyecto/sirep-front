import { describe, expect, it } from "vitest";

import { estadoRptech, motivosRechazo } from "./rptech";

const base = { origen: "historico" as const, estado: "completo" as const, estado_reporte: "aprobado", rptech_id: null, rptech_error: null };

describe("estado en RP-TECH", () => {
  it("guardado, rechazado, por reintentar y por enviar", () => {
    expect(estadoRptech({ ...base, rptech_id: "rt-1", estado_reporte: "aprobado_rptech" })).toBe("guardado");
    expect(estadoRptech({ ...base, estado_reporte: "observado", rptech_error: { codigo: "datos_invalidos", detalle: {} } })).toBe("rechazado");
    expect(estadoRptech({ ...base, rptech_error: { codigo: "reintentar", detalle: "sin conexión" } })).toBe("reintentar");
    expect(estadoRptech(base)).toBe("por_enviar");
  });

  it("no aplica a reportes del sistema ni a los que siguen en revisión", () => {
    expect(estadoRptech({ ...base, origen: "sistema" })).toBeNull();
    expect(estadoRptech({ ...base, estado: "en_revision", estado_reporte: "pendiente_revision" })).toBeNull();
  });

  it("traduce los motivos al nombre del campo que ve el revisor", () => {
    const etiquetas: Record<string, string> = { revision_linea_ln: "Revisión línea L+N", estado_del_equipo: "Estado del equipo" };
    const m = motivosRechazo(
      { codigo: "datos_invalidos", detalle: { voltaje_ln: "debe ser un número entre 0 y 1000", estado_equipo: "operativo o inoperativo", "repuestos[0].tipo": "venta, descarte o garantia" } },
      (id) => etiquetas[id],
    );
    expect(m).toEqual([
      { campo: "Revisión línea L+N", texto: "debe ser un número entre 0 y 1000" },
      { campo: "Estado del equipo", texto: "operativo o inoperativo" },
      { campo: "repuestos[0].tipo", texto: "venta, descarte o garantia" },
    ]);
    expect(motivosRechazo({ codigo: "talonario_duplicado", detalle: "El talonario 004512 ya está cargado" }, () => undefined)).toEqual([
      { campo: null, texto: "El talonario 004512 ya está cargado" },
    ]);
  });
});
