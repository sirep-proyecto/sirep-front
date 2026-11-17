/**
 * Responsabilidad: probar la lectura segura del modo del visor.
 * Existe porque un valor viejo en `localStorage` o un navegador que lanza al
 * leerlo no pueden dejar el visor sin modo.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    guardarModoVisor,
    interpretarModoVisor,
    leerModoVisor,
} from "./preferencia-visor";

afterEach(() => vi.unstubAllGlobals());

describe("interpretarModoVisor", () => {
    it("acepta los tres modos y cae en original con cualquier otra cosa", () => {
        expect(interpretarModoVisor("corregido")).toBe("corregido");
        expect(interpretarModoVisor("lado_a_lado")).toBe("lado_a_lado");
        expect(interpretarModoVisor("original")).toBe("original");
        expect(interpretarModoVisor("basura")).toBe("original");
        expect(interpretarModoVisor(null)).toBe("original");
    });
});

describe("leerModoVisor / guardarModoVisor", () => {
    it("no lanza si localStorage falla y recuerda en memoria", () => {
        vi.stubGlobal("window", {
            localStorage: {
                getItem: () => {
                    throw new Error("bloqueado");
                },
                setItem: () => {
                    throw new Error("bloqueado");
                },
            },
        });
        expect(() => guardarModoVisor("lado_a_lado")).not.toThrow();
        expect(leerModoVisor()).toBe("lado_a_lado");
    });
});
