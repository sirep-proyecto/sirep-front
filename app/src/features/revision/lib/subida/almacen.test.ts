import { describe, expect, it } from "vitest";

import { crearAlmacenSubida, type ParametrosEnvio } from "./almacen";
import type { RespuestaUpload } from "./tipos";

const OK: RespuestaUpload = {
  escaneoId: "e1",
  numeroReporte: "000375",
  estado: "procesado",
  camposDudosos: ["x"],
  totalPaginas: 2,
};

function pdf(nombre: string, contenido = nombre) {
  return new File([contenido], nombre, { type: "application/pdf", lastModified: 5 });
}

describe("almacén de subida", () => {
  it("sube los archivos de a uno y en orden, con el N° manual", async () => {
    const orden: string[] = [];
    let simultaneos = 0;
    let maximo = 0;
    const almacen = crearAlmacenSubida({
      calcularHuella: async (f) => f.name,
      subir: async (p: ParametrosEnvio) => {
        simultaneos += 1;
        maximo = Math.max(maximo, simultaneos);
        orden.push(`${p.archivo.name}:${p.numeroReporte ?? "-"}`);
        p.alProgreso(0.5);
        p.alEnviado();
        await Promise.resolve();
        simultaneos -= 1;
        return OK;
      },
    });
    almacen.agregar([pdf("a.pdf"), pdf("b.pdf")]);
    almacen.establecerNumero(almacen.obtener().items[1].id, " 123 ");
    await almacen.esperarFin();
    expect(orden).toEqual(["a.pdf:-", "b.pdf:123"]);
    expect(maximo).toBe(1);
    expect(almacen.obtener().items.map((i) => i.estado)).toEqual(["listo", "listo"]);
    expect(almacen.obtener().listos).toBe(2);
  });

  it("no envía el contenido repetido", async () => {
    const enviados: string[] = [];
    const almacen = crearAlmacenSubida({
      calcularHuella: async () => "misma",
      subir: async (p) => {
        enviados.push(p.archivo.name);
        return OK;
      },
    });
    almacen.agregar([pdf("a.pdf"), pdf("copia.pdf")]);
    await almacen.esperarFin();
    expect(enviados).toEqual(["a.pdf"]);
    expect(almacen.obtener().items.map((i) => i.estado)).toEqual(["listo", "repetido"]);
  });

  it("clasifica 409 como duplicado y otros fallos como error, y continúa con el siguiente", async () => {
    const respuestas = [
      { status: 409, data: { codigo: "reporte_duplicado", numeroReporte: "000375" } },
      { status: 502, data: { codigo: "lectura_ia", message: "La IA falló" } },
      null,
    ];
    let i = 0;
    const almacen = crearAlmacenSubida({
      calcularHuella: async (f) => f.name,
      subir: async () => {
        const r = respuestas[i++];
        if (r) throw Object.assign(new Error("x"), r);
        return OK;
      },
    });
    almacen.agregar([pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf")]);
    await almacen.esperarFin();
    const items = almacen.obtener().items;
    expect(items.map((x) => x.estado)).toEqual(["duplicado", "error", "listo"]);
    expect(items[1].fallo?.mensaje).toBe("La IA falló");
  });

  it("reintentar vuelve a enviar", async () => {
    let intentos = 0;
    const almacen = crearAlmacenSubida({
      calcularHuella: async () => undefined,
      subir: async () => {
        intentos += 1;
        if (intentos === 1) throw Object.assign(new Error("red"), { status: 0 });
        return OK;
      },
    });
    almacen.agregar([pdf("a.pdf")]);
    await almacen.esperarFin();
    expect(almacen.obtener().items[0].estado).toBe("error");
    almacen.reintentar(almacen.obtener().items[0].id);
    await almacen.esperarFin();
    expect(almacen.obtener().items[0].estado).toBe("listo");
  });

  it("no llama al backend con un formato no admitido", async () => {
    let llamadas = 0;
    const almacen = crearAlmacenSubida({
      calcularHuella: async () => undefined,
      subir: async () => {
        llamadas += 1;
        return OK;
      },
    });
    almacen.agregar([new File(["x"], "factura.docx")]);
    await almacen.esperarFin();
    expect(llamadas).toBe(0);
    expect(almacen.obtener().items[0].fallo?.mensaje).toMatch(/Formato no admitido/);
  });

  it("avisa a los oyentes en cada cambio", async () => {
    let avisos = 0;
    const almacen = crearAlmacenSubida({ calcularHuella: async () => undefined, subir: async () => OK });
    almacen.suscribir(() => (avisos += 1));
    almacen.agregar([pdf("a.pdf")]);
    await almacen.esperarFin();
    expect(avisos).toBeGreaterThanOrEqual(4);
  });
});
