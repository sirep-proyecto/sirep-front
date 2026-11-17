import { describe, expect, it } from "vitest";

import {
  avanceGlobal,
  COLA_VACIA,
  crearItems,
  reducirCola,
  resumirCola,
  siguienteEnEspera,
  textoResumen,
} from "./cola";
import type { DatosArchivo, EstadoCola } from "./tipos";

const archivo = (nombre: string, extra: Partial<DatosArchivo> = {}): DatosArchivo => ({
  nombre,
  tamano: 1000,
  mime: nombre.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
  ultimaModificacion: 1,
  ...extra,
});

let n = 0;
const id = () => `i${(n += 1)}`;

function colaCon(...archivos: DatosArchivo[]): EstadoCola {
  return reducirCola(COLA_VACIA, { tipo: "agregar", items: crearItems(archivos, [], id) });
}

describe("crearItems", () => {
  it("rechaza formatos no admitidos sin reintento", () => {
    const [item] = crearItems([archivo("factura.docx", { mime: "x" })], [], id);
    expect(item.estado).toBe("error");
    expect(item.fallo?.reintentable).toBe(false);
  });

  it("marca repetido el mismo nombre+tamaño+fecha, en la misma tanda o ya en cola", () => {
    const items = crearItems([archivo("a.pdf"), archivo("a.pdf")], [], id);
    expect(items.map((i) => i.estado)).toEqual(["espera", "repetido"]);
    const mas = crearItems([archivo("a.pdf")], items, id);
    expect(mas[0].estado).toBe("repetido");
  });

  it("distinta fecha de modificación no es repetido", () => {
    const items = crearItems([archivo("a.pdf"), archivo("a.pdf", { ultimaModificacion: 2 })], [], id);
    expect(items.map((i) => i.estado)).toEqual(["espera", "espera"]);
  });

  it("un archivo con error previo se puede volver a elegir", () => {
    const previo = crearItems([archivo("a.pdf")], [], id);
    const conError = reducirCola(
      { items: previo, listos: 0 },
      { tipo: "fallo", id: previo[0].id, fallo: { mensaje: "x", reintentable: true } },
    );
    expect(crearItems([archivo("a.pdf")], conError.items, id)[0].estado).toBe("espera");
  });
});

describe("reducirCola", () => {
  it("procesa de a uno, en orden", () => {
    let cola = colaCon(archivo("a.pdf"), archivo("b.pdf"));
    const [a, b] = cola.items;
    expect(siguienteEnEspera(cola.items)?.id).toBe(a.id);
    cola = reducirCola(cola, { tipo: "validando", id: a.id });
    expect(siguienteEnEspera(cola.items)).toBeNull();
    cola = reducirCola(cola, { tipo: "duplicado", id: a.id, info: { codigo: "desconocido" } });
    expect(siguienteEnEspera(cola.items)?.id).toBe(b.id);
  });

  it("la huella igual a un item anterior lo deja repetido", () => {
    let cola = colaCon(archivo("a.pdf"), archivo("b.pdf"));
    const [a, b] = cola.items;
    cola = reducirCola(cola, { tipo: "huella", id: a.id, huella: "h" });
    cola = reducirCola(cola, { tipo: "validando", id: b.id });
    cola = reducirCola(cola, { tipo: "huella", id: b.id, huella: "h" });
    expect(cola.items[1].estado).toBe("repetido");
    expect(cola.items[0].estado).toBe("espera");
  });

  it("el progreso solo aplica subiendo y se acota", () => {
    let cola = colaCon(archivo("a.pdf"));
    const { id: x } = cola.items[0];
    cola = reducirCola(cola, { tipo: "progreso", id: x, fraccion: 0.5 });
    expect(cola.items[0].progreso).toBe(0);
    cola = reducirCola(cola, { tipo: "subiendo", id: x });
    cola = reducirCola(cola, { tipo: "progreso", id: x, fraccion: 3 });
    expect(cola.items[0].progreso).toBe(1);
  });

  it("listo cuenta para refrescar la bandeja", () => {
    let cola = colaCon(archivo("a.pdf"));
    cola = reducirCola(cola, {
      tipo: "listo",
      id: cola.items[0].id,
      respuesta: { escaneoId: "e", numeroReporte: "1", estado: "", camposDudosos: [] },
    });
    expect(cola.listos).toBe(1);
  });

  it("quitar no saca un archivo en curso", () => {
    let cola = colaCon(archivo("a.pdf"), archivo("b.pdf"));
    cola = reducirCola(cola, { tipo: "subiendo", id: cola.items[0].id });
    cola = reducirCola(cola, { tipo: "quitar", id: cola.items[0].id });
    cola = reducirCola(cola, { tipo: "quitar", id: cola.items[1].id });
    expect(cola.items).toHaveLength(1);
  });

  it("el N° manual solo se edita en espera", () => {
    let cola = colaCon(archivo("a.pdf"));
    const { id: x } = cola.items[0];
    cola = reducirCola(cola, { tipo: "numero", id: x, valor: "000375" });
    expect(cola.items[0].numeroManual).toBe("000375");
    cola = reducirCola(cola, { tipo: "validando", id: x });
    cola = reducirCola(cola, { tipo: "numero", id: x, valor: "999" });
    expect(cola.items[0].numeroManual).toBe("000375");
  });

  it("reintentar vuelve a espera solo si el error es reintentable", () => {
    let cola = colaCon(archivo("a.pdf"), archivo("b.pdf"));
    const [a, b] = cola.items;
    cola = reducirCola(cola, { tipo: "fallo", id: a.id, fallo: { mensaje: "x", reintentable: true } });
    cola = reducirCola(cola, { tipo: "fallo", id: b.id, fallo: { mensaje: "y", reintentable: false } });
    cola = reducirCola(cola, { tipo: "reintentar", id: a.id });
    cola = reducirCola(cola, { tipo: "reintentar", id: b.id });
    expect(cola.items.map((i) => i.estado)).toEqual(["espera", "error"]);
  });

  it("agregar con la cola ociosa retira los listos anteriores", () => {
    let cola = colaCon(archivo("a.pdf"));
    cola = reducirCola(cola, {
      tipo: "listo",
      id: cola.items[0].id,
      respuesta: { escaneoId: "e", numeroReporte: "1", estado: "", camposDudosos: [] },
    });
    cola = reducirCola(cola, { tipo: "agregar", items: crearItems([archivo("b.pdf")], cola.items, id) });
    expect(cola.items.map((i) => i.nombre)).toEqual(["b.pdf"]);
  });
});

describe("resumen y avance", () => {
  it("resume y escribe el texto", () => {
    let cola = colaCon(
      archivo("a.pdf"),
      archivo("b.pdf"),
      archivo("c.pdf"),
      archivo("d.pdf"),
      archivo("e.docx", { mime: "x" }),
    );
    const [a, b, c, d] = cola.items;
    cola = reducirCola(cola, {
      tipo: "listo",
      id: a.id,
      respuesta: { escaneoId: "e", numeroReporte: "1", estado: "", camposDudosos: [] },
    });
    cola = reducirCola(cola, { tipo: "duplicado", id: b.id, info: { codigo: "desconocido" } });
    cola = reducirCola(cola, { tipo: "leyendo", id: c.id });
    expect(d.estado).toBe("espera");
    expect(textoResumen(resumirCola(cola.items))).toBe(
      "1 listo · 1 leyendo · 1 en espera · 1 ya existía · 1 con error",
    );
  });

  it("el avance cuenta el archivo en curso sobre los que entraron a la cola", () => {
    let cola = colaCon(archivo("a.pdf"), archivo("b.pdf"), archivo("x.docx", { mime: "x" }));
    expect(avanceGlobal(cola.items)).toEqual({ actual: 1, total: 2 });
    cola = reducirCola(cola, {
      tipo: "listo",
      id: cola.items[0].id,
      respuesta: { escaneoId: "e", numeroReporte: "1", estado: "", camposDudosos: [] },
    });
    expect(avanceGlobal(cola.items)).toEqual({ actual: 2, total: 2 });
    cola = reducirCola(cola, { tipo: "fallo", id: cola.items[1].id, fallo: { mensaje: "x", reintentable: true } });
    expect(avanceGlobal(cola.items)).toBeNull();
  });
});
