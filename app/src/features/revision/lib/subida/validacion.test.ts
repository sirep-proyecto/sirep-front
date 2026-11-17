import { describe, expect, it } from "vitest";

import {
  calcularHuellaSha256,
  claveArchivo,
  formatearTamano,
  MENSAJE_FORMATO,
  motivoRechazo,
  tipoDeArchivo,
} from "./validacion";

const datos = (nombre: string, mime: string, tamano = 1000) => ({
  nombre,
  mime,
  tamano,
  ultimaModificacion: 1,
});

describe("validación de archivos", () => {
  it("acepta PDF, JPG, PNG y WebP", () => {
    expect(motivoRechazo(datos("a.pdf", "application/pdf"))).toBeNull();
    expect(motivoRechazo(datos("a.JPG", "image/jpeg"))).toBeNull();
    expect(motivoRechazo(datos("a.png", "image/png"))).toBeNull();
    expect(motivoRechazo(datos("a.webp", "image/webp"))).toBeNull();
  });

  it("acepta MIME vacío si la extensión es válida", () => {
    expect(tipoDeArchivo(datos("a.pdf", ""))).toBe("pdf");
  });

  it("rechaza otros formatos y extensión que no coincide con el MIME", () => {
    expect(motivoRechazo(datos("factura.docx", "application/vnd.openxmlformats"))).toBe(MENSAJE_FORMATO);
    expect(motivoRechazo(datos("a.pdf", "image/png"))).toBe(MENSAJE_FORMATO);
    expect(motivoRechazo(datos("sin_extension", "application/pdf"))).toBe(MENSAJE_FORMATO);
  });

  it("rechaza lo vacío y lo mayor a 10 MB", () => {
    expect(motivoRechazo(datos("a.pdf", "application/pdf", 0))).toMatch(/vacío/);
    expect(motivoRechazo(datos("a.pdf", "application/pdf", 10 * 1024 * 1024))).toBeNull();
    expect(motivoRechazo(datos("a.pdf", "application/pdf", 10 * 1024 * 1024 + 1))).toMatch(/10 MB/);
  });

  it("la clave distingue nombre, tamaño y fecha", () => {
    const base = datos("a.pdf", "application/pdf");
    expect(claveArchivo(base)).toBe(claveArchivo({ ...base }));
    expect(claveArchivo(base)).not.toBe(claveArchivo({ ...base, tamano: 5 }));
    expect(claveArchivo(base)).not.toBe(claveArchivo({ ...base, ultimaModificacion: 2 }));
  });

  it("formatea tamaños", () => {
    expect(formatearTamano(500)).toBe("500 B");
    expect(formatearTamano(2048)).toBe("2 KB");
    expect(formatearTamano(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });

  it("calcula SHA-256 conocido", async () => {
    const blob = new Blob(["abc"]);
    expect(await calcularHuellaSha256(blob)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
