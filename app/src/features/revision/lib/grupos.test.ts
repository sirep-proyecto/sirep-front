/**
 * Responsabilidad: probar la agrupación en tarjetas, los contadores de las
 * secciones y los planes de acción de las tarjetas agrupadas.
 * Existe porque ahí se decide qué se confirma, qué se corrige y qué se omite: un
 * error haría que el sistema omitiera por su cuenta o que "Confirmar sección"
 * tocara lo que el modelo no leyó.
 */

import { describe, expect, it } from "vitest";

import { CAMPOS_POR_ID } from "@/config/campos-formulario";
import { MAPA_POR_DEFECTO, obtenerMapa } from "@/config/regiones";
import { componerCampo } from "@/features/revision/lib/campos";
import type {
    CampoReporte,
    CampoVista,
    Confianza,
    EstadoRevisionCampo,
    IdCampo,
} from "@/features/revision/types/dominio";

import {
    coincideOpcion,
    construirSecciones,
    describirResumen,
    estadoDeCampos,
    esOmitible,
    grupoDeCampo,
    planConfirmar,
    planConfirmarSeccion,
    planOmitirVacios,
    planReabrir,
    rotuloDeCampos,
    rotuloOmitir,
} from "./grupos";

interface Opciones {
    estado?: EstadoRevisionCampo;
    valor?: string | null;
    confianza?: Confianza | null;
    noLeido?: boolean;
    corregido?: string | null;
}

const MAPA = obtenerMapa(MAPA_POR_DEFECTO);

function campo(id: IdCampo, opciones: Opciones = {}): CampoVista {
    const base: CampoReporte = {
        id,
        valor_modelo: opciones.valor === undefined ? "x" : opciones.valor,
        confianza: opciones.confianza === undefined ? "media" : opciones.confianza,
        no_leido: opciones.noLeido ?? false,
        valor_corregido: opciones.corregido ?? null,
        estado_revision: opciones.estado ?? "pendiente",
        revisado_por: null,
        revisado_en: null,
        corregido_por: null,
        corregido_en: null,
    };
    return componerCampo(base, MAPA);
}

/** Un reporte completo con todo en lectura automática; cada prueba pisa lo que necesita. */
function reporteBase(pisar: Partial<Record<IdCampo, CampoVista>> = {}): CampoVista[] {
    return (Object.keys(CAMPOS_POR_ID) as IdCampo[]).map(
        (id) =>
            pisar[id] ?? campo(id, { estado: "auto", confianza: "alta", valor: "ok" }),
    );
}

const sinLeer = (id: IdCampo) =>
    campo(id, { valor: null, confianza: null, noLeido: true });

describe("grupoDeCampo", () => {
    it("agrupa los campos que en el papel son un solo dato", () => {
        expect(grupoDeCampo("codigo_repuesto")?.id).toBe("repuestos");
        expect(grupoDeCampo("repuestos_tipo")?.id).toBe("repuestos");
        expect(grupoDeCampo("cabezales")?.id).toBe("casillas");
        expect(grupoDeCampo("revision_linea_nt")?.id).toBe("lineas");
        expect(grupoDeCampo("hora_salida")?.id).toBe("horario");
        expect(grupoDeCampo("firma_cliente")?.id).toBe("firmas");
        expect(grupoDeCampo("empresa")).toBeNull();
        expect(grupoDeCampo("garantia")).toBeNull();
    });
});

describe("estado de una tarjeta", () => {
    it("es sin leer solo cuando lo único pendiente está en blanco", () => {
        expect(estadoDeCampos([sinLeer("tinta"), sinLeer("operador")])).toBe(
            "sin_lectura",
        );
    });

    it("es pendiente si queda algo con valor por confirmar, aunque haya vacíos", () => {
        expect(estadoDeCampos([sinLeer("tinta"), campo("operador")])).toBe("pendiente");
    });

    it("es listo cuando nada está pendiente", () => {
        expect(
            estadoDeCampos([
                campo("tinta", { estado: "omitido", valor: null }),
                campo("operador", { estado: "confirmado" }),
            ]),
        ).toBe("listo");
    });

    it("rotula con el mismo vocabulario que un campo", () => {
        expect(rotuloDeCampos([sinLeer("tinta")]).etiqueta).toBe("Sin leer");
        expect(rotuloDeCampos([campo("tinta")]).etiqueta).toBe("Pendiente");
        expect(
            rotuloDeCampos([campo("tinta", { estado: "omitido", valor: null })])
                .etiqueta,
        ).toBe("Omitido");
        expect(
            rotuloDeCampos([campo("tinta", { estado: "confirmado" })]).etiqueta,
        ).toBe("Revisado");
    });

    it("solo es omitible lo pendiente que el modelo no leyó", () => {
        expect(esOmitible(sinLeer("tinta"))).toBe(true);
        expect(esOmitible(campo("tinta", { valor: "" }))).toBe(true);
        expect(esOmitible(campo("tinta"))).toBe(false);
        expect(esOmitible(campo("tinta", { estado: "auto", valor: null }))).toBe(false);
    });
});

describe("construirSecciones", () => {
    it("devuelve las seis secciones del formulario cuando se piden todos los campos", () => {
        const secciones = construirSecciones(reporteBase());
        expect(secciones.map((s) => s.seccion.id)).toEqual([
            "identificacion",
            "equipo",
            "revision",
            "servicio",
            "repuestos",
            "cierre",
        ]);
        expect(secciones.every((s) => s.listo)).toBe(true);
    });

    it("resume en 'automáticos' lo leído con confianza alta y sin tocar", () => {
        const seccion = construirSecciones(reporteBase()).find(
            (s) => s.seccion.id === "identificacion",
        );
        expect(seccion?.elementos).toHaveLength(0);
        expect(seccion?.automaticos).toHaveLength(6);
        expect(seccion?.totalCampos).toBe(6);
    });

    it("muestra un grupo completo aunque solo uno de sus campos sea dudoso", () => {
        const secciones = construirSecciones(
            reporteBase({ codigo_repuesto: sinLeer("codigo_repuesto") }),
        );
        const repuestos = secciones.find((s) => s.seccion.id === "repuestos");
        expect(repuestos?.elementos).toHaveLength(1);
        const [elemento] = repuestos?.elementos ?? [];
        expect(elemento.tipo).toBe("grupo");
        expect(elemento.campos.map((c) => c.id)).toEqual([
            "repuestos_tipo",
            "codigo_repuesto",
            "repuestos_descripcion",
            "repuestos_cantidad",
        ]);
        // Los otros tres campos del grupo ya eran automáticos y no se resumen aparte.
        expect(repuestos?.automaticos).toHaveLength(0);
    });

    it("cuenta una tarjeta agrupada como un solo pendiente o sin leer", () => {
        const secciones = construirSecciones(
            reporteBase({
                revision_linea_ln: sinLeer("revision_linea_ln"),
                revision_linea_lt: sinLeer("revision_linea_lt"),
                revision_linea_nt: sinLeer("revision_linea_nt"),
                tinta: campo("tinta"),
            }),
        );
        const revision = secciones.find((s) => s.seccion.id === "revision");
        expect(revision?.sinLeer).toBe(1);
        expect(revision?.pendientes).toBe(1);
        expect(revision?.listo).toBe(false);
    });

    it("pone primero lo pendiente y conserva el orden del papel en el resto", () => {
        const secciones = construirSecciones(
            reporteBase({
                telefono: campo("telefono", { estado: "confirmado" }),
                direccion: campo("direccion"),
            }),
        );
        const identificacion = secciones.find((s) => s.seccion.id === "identificacion");
        expect(identificacion?.elementos.map((e) => e.campos[0].id)).toEqual([
            "direccion",
            "telefono",
        ]);
    });

    it("en 'solo dudosos' deja solo las secciones con algo dudoso", () => {
        const secciones = construirSecciones(
            reporteBase({ direccion: campo("direccion") }),
            { soloDudosos: true },
        );
        expect(secciones.map((s) => s.seccion.id)).toEqual(["identificacion"]);
        expect(secciones[0].automaticos).toHaveLength(0);
    });

    it("un campo omitido cuenta como revisado y deja la sección lista", () => {
        const secciones = construirSecciones(
            reporteBase({
                telefono: campo("telefono", {
                    estado: "omitido",
                    valor: null,
                    confianza: null,
                    noLeido: true,
                }),
            }),
        );
        const identificacion = secciones.find((s) => s.seccion.id === "identificacion");
        expect(identificacion?.listo).toBe(true);
        expect(identificacion?.sinLeer).toBe(0);
        expect(identificacion?.elementos).toHaveLength(1);
    });

    it("solo ofrece confirmar en bloque lo de confianza media con valor", () => {
        const secciones = construirSecciones(
            reporteBase({
                direccion: campo("direccion", { confianza: "media" }),
                contacto: campo("contacto", { confianza: "baja" }),
                telefono: sinLeer("telefono"),
            }),
        );
        const identificacion = secciones.find((s) => s.seccion.id === "identificacion")!;
        expect(identificacion.confirmables.map((c) => c.id)).toEqual(["direccion"]);
        expect(planConfirmarSeccion(identificacion)).toEqual([
            { campo: "direccion", accion: { tipo: "confirmar" } },
        ]);
    });
});

describe("describirResumen", () => {
    it("muestra etiqueta y valor de un campo, y 'vacío' si no hay", () => {
        const secciones = construirSecciones(
            reporteBase({
                empresa: campo("empresa", { estado: "auto", confianza: "alta", valor: "Abregu" }),
                telefono: campo("telefono", { estado: "auto", confianza: "alta", valor: "" }),
            }),
        );
        const chips = secciones[0].automaticos.map(describirResumen);
        expect(chips).toContainEqual({ etiqueta: "Empresa", valor: "Abregu" });
        expect(chips).toContainEqual({ etiqueta: "Teléfono", valor: "vacío" });
    });

    it("junta los valores de un grupo bajo su título", () => {
        const secciones = construirSecciones(
            reporteBase({
                hora_llegada: campo("hora_llegada", { estado: "auto", confianza: "alta", valor: "11:05" }),
                hora_salida: campo("hora_salida", { estado: "auto", confianza: "alta", valor: "05:50" }),
            }),
        );
        const cierre = secciones.find((s) => s.seccion.id === "cierre")!;
        const chip = cierre.automaticos
            .map(describirResumen)
            .find((c) => c.etiqueta === "Horario de atención");
        expect(chip?.valor).toBe("11:05 · 05:50");
    });
});

describe("planConfirmar", () => {
    it("confirma lo pendiente con valor y no toca lo vacío", () => {
        const pasos = planConfirmar([campo("tinta"), sinLeer("operador")]);
        expect(pasos).toEqual([{ campo: "tinta", accion: { tipo: "confirmar" } }]);
    });

    it("corrige un campo editado con otro texto", () => {
        const pasos = planConfirmar([campo("tinta", { valor: "negra" })], {
            tinta: "azul",
        });
        expect(pasos).toEqual([
            { campo: "tinta", accion: { tipo: "corregir", valor: "azul" } },
        ]);
    });

    it("confirma un campo editado con el mismo texto que el modelo", () => {
        const pasos = planConfirmar([campo("tinta", { valor: "negra" })], {
            tinta: " negra ",
        });
        expect(pasos).toEqual([{ campo: "tinta", accion: { tipo: "confirmar" } }]);
    });

    it("omite solo lo que la persona vació explícitamente", () => {
        const pasos = planConfirmar([campo("tinta", { valor: "negra" })], {
            tinta: "",
        });
        expect(pasos).toEqual([{ campo: "tinta", accion: { tipo: "omitir" } }]);
    });

    it("elegir 'Vacío' en un campo ya omitido no repite la acción", () => {
        const pasos = planConfirmar(
            [campo("tinta", { estado: "omitido", valor: null })],
            { tinta: "" },
        );
        expect(pasos).toEqual([]);
    });

    it("no vuelve a confirmar lo que una persona ya resolvió", () => {
        expect(
            planConfirmar([campo("tinta", { estado: "confirmado" })]),
        ).toEqual([]);
    });

    it("usa el valor corregido, no el del modelo, como vigente", () => {
        const pasos = planConfirmar(
            [campo("tinta", { estado: "corregido", valor: "a", corregido: "b" })],
            { tinta: "b" },
        );
        expect(pasos).toEqual([]);
    });
});

describe("planOmitirVacios", () => {
    it("omite únicamente lo pendiente sin lectura", () => {
        const pasos = planOmitirVacios([
            sinLeer("revision_linea_ln"),
            sinLeer("revision_linea_lt"),
            campo("revision_linea_nt"),
            campo("tinta", { estado: "auto", valor: null }),
        ]);
        expect(pasos.map((p) => p.campo)).toEqual([
            "revision_linea_ln",
            "revision_linea_lt",
        ]);
        expect(pasos.every((p) => p.accion.tipo === "omitir")).toBe(true);
    });

    it("nunca omite un campo opcional por su cuenta: sin acción explícita no hay pasos", () => {
        // Un opcional leído en blanco con confianza alta queda "auto", no "omitido".
        expect(
            planOmitirVacios([
                campo("telefono", { estado: "auto", confianza: "alta", valor: "" }),
            ]),
        ).toEqual([]);
        expect(planConfirmar([campo("telefono", { estado: "auto", valor: "" })])).toEqual(
            [],
        );
    });
});

describe("planReabrir", () => {
    it("reabre todo lo resuelto, incluido lo omitido", () => {
        const pasos = planReabrir([
            campo("tinta", { estado: "omitido", valor: null }),
            campo("operador", { estado: "confirmado" }),
            campo("equipo", { estado: "auto" }),
            campo("motivo"),
        ]);
        expect(pasos.map((p) => p.campo)).toEqual(["tinta", "operador"]);
    });
});

describe("rotuloOmitir", () => {
    it("adapta el texto a cuántos vacíos hay", () => {
        expect(rotuloOmitir(1, 1)).toBe("Omitir · está vacío");
        expect(rotuloOmitir(3, 3)).toBe("Omitir las 3");
        expect(rotuloOmitir(3, 4)).toBe("Omitir 3 vacíos");
    });
});

describe("coincideOpcion", () => {
    it("ignora mayúsculas, acentos y el punto final", () => {
        expect(coincideOpcion("estab", "Estab.")).toBe(true);
        expect(coincideOpcion("GARANTIA", "Garantía")).toBe(true);
        expect(coincideOpcion("", "Bueno")).toBe(false);
        expect(coincideOpcion("Malo", "Bueno")).toBe(false);
    });
});
