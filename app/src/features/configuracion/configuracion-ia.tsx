/**
 * Responsabilidad: pestaña "Lectura con IA". Deja elegir con qué proveedor se
 * leen los reportes (Gemini o ChatGPT), el modelo y la API key de cada uno.
 * Cada proveedor guarda su propia clave: al cambiar de uno a otro, la del otro
 * se conserva. Solo la ve el administrador principal (la clave cobra a su cuenta).
 */

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, PlugZap, RefreshCw, Sparkles, Trash2 } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";
import { Insignia } from "@/components/ui/insignia";

import { mensajeDeError } from "./config-bot";
import {
  NOMBRE_PROVEEDOR,
  PROVEEDORES_IA,
  armarCambio,
  describirClave,
  guardarIa,
  leerEstadoIa,
  probarIa,
  quitarClaveIa,
  type EstadoIa,
  type ProveedorIa,
} from "./config-ia";

const fechaHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "";

const AYUDA_CLAVE: Record<ProveedorIa, string> = {
  gemini: "Se crea en Google AI Studio (aistudio.google.com › Get API key). Tiene capa gratuita con límite por minuto y por día.",
  openai:
    "Se crea en platform.openai.com › API keys. Se cobra por uso a esa cuenta: necesita saldo cargado. La suscripción de ChatGPT Plus no sirve para la API.",
};

const vacio = (): Record<ProveedorIa, string> => ({ gemini: "", openai: "" });

export function ConfiguracionIa() {
  const [estado, setEstado] = useState<EstadoIa | null>(null);
  const [proveedor, setProveedor] = useState<ProveedorIa>("gemini");
  const [modelos, setModelos] = useState<Record<ProveedorIa, string>>(vacio);
  const [claves, setClaves] = useState<Record<ProveedorIa, string>>(vacio);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<"guardar" | "probar" | "quitar" | null>(null);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [prueba, setPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const aplicar = (nuevo: EstadoIa) => {
    setEstado(nuevo);
    setProveedor(nuevo.proveedor);
    setModelos({ ...nuevo.modelos });
    setClaves(vacio());
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      aplicar(await leerEstadoIa());
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  function elegir(p: ProveedorIa) {
    setProveedor(p);
    setPrueba(null);
    setConfirmarQuitar(false);
    setAviso(null);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!estado) return;
    setTrabajando("guardar");
    setError(null);
    setAviso(null);
    setPrueba(null);
    try {
      aplicar(await guardarIa(armarCambio(proveedor, modelos, claves, estado)));
      setAviso(`Listo. Los reportes que se suban desde ahora se leen con ${NOMBRE_PROVEEDOR[proveedor]}.`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  async function probar() {
    setTrabajando("probar");
    setPrueba(null);
    try {
      setPrueba(
        await probarIa({ proveedor, modelo: modelos[proveedor].trim(), clave: claves[proveedor].trim() || undefined }),
      );
    } catch (e) {
      setPrueba({ ok: false, mensaje: mensajeDeError(e) });
    } finally {
      setTrabajando(null);
    }
  }

  async function quitar() {
    setTrabajando("quitar");
    setError(null);
    setAviso(null);
    try {
      aplicar(await quitarClaveIa(proveedor));
      setAviso(`Se quitó la clave guardada de ${NOMBRE_PROVEEDOR[proveedor]}.`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
      setConfirmarQuitar(false);
    }
  }

  const clave = estado?.claves[proveedor];
  const tieneClave = Boolean(clave?.configurada || claves[proveedor].trim());
  const hayCambios =
    !!estado &&
    (proveedor !== estado.proveedor ||
      PROVEEDORES_IA.some((p) => modelos[p].trim() !== estado.modelos[p] || claves[p].trim() !== ""));
  const bloqueado = trabajando !== null || !estado?.disponible;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">En uso ahora</h2>
          <Boton variante="fantasma" tamano="sm" onClick={() => void cargar()} disabled={cargando} className="text-petrol-700">
            <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </Boton>
        </div>
        {cargando && !estado ? <p className="mt-3 text-meta text-muted">Consultando…</p> : null}
        {estado ? (
          <dl className="mt-2">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-line py-3">
              <dt className="text-meta text-muted">Lee los reportes con</dt>
              <dd className="flex items-center gap-2 text-meta font-medium text-ink">
                <Insignia tono="petrol">{NOMBRE_PROVEEDOR[estado.proveedor]}</Insignia>
                <span className="font-mono">{estado.modelos[estado.proveedor]}</span>
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
              <dt className="text-meta text-muted">Configurado</dt>
              <dd className="text-right text-meta text-ink">
                {estado.origen === "pantalla"
                  ? `Desde aquí${estado.actualizado_por ? ` por ${estado.actualizado_por}` : ""}${
                      estado.actualizado_en ? ` · ${fechaHora(estado.actualizado_en)}` : ""
                    }`
                  : "Con las variables del servidor"}
              </dd>
            </div>
          </dl>
        ) : null}
        {estado && !estado.disponible ? (
          <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-meta text-amber-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Falta correr la migración 20261119000000_configuracion_ia.sql en Supabase. Hasta entonces se usa lo del servidor y no
            se puede cambiar aquí.
          </p>
        ) : null}
      </section>

      {estado ? (
        <form onSubmit={guardar} className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
          <h2 className="text-base font-semibold text-ink">Proveedor de IA</h2>
          <p className="mt-1 text-meta text-muted">
            Cada proveedor guarda su propia API key: si cambias de uno a otro, la del otro queda guardada para volver cuando
            quieras.
          </p>

          <div role="radiogroup" aria-label="Proveedor de IA" className="mt-4 grid gap-2 sm:grid-cols-2">
            {PROVEEDORES_IA.map((p) => {
              const elegido = p === proveedor;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={elegido}
                  onClick={() => elegir(p)}
                  disabled={trabajando !== null}
                  className={[
                    "flex cursor-pointer flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left",
                    "transition-colors duration-150 ease-[var(--ease-salida)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600",
                    elegido ? "border-petrol-600 bg-petrol-50" : "border-line-strong bg-inset hover:border-petrol-600/40",
                  ].join(" ")}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-base font-semibold text-ink">
                      <Sparkles className="size-4 text-petrol-700" aria-hidden="true" />
                      {NOMBRE_PROVEEDOR[p]}
                    </span>
                    {estado.proveedor === p ? <Insignia tono="green" tamano="micro">En uso</Insignia> : null}
                  </span>
                  <span className="text-micro text-muted">{describirClave(estado.claves[p])}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <label htmlFor="modelo-ia" className="text-meta font-medium text-ink">
              Modelo de {NOMBRE_PROVEEDOR[proveedor]}
            </label>
            <Entrada
              id="modelo-ia"
              list={`modelos-${proveedor}`}
              autoComplete="off"
              spellCheck={false}
              value={modelos[proveedor]}
              onChange={(e) => setModelos((m) => ({ ...m, [proveedor]: e.target.value }))}
              className="max-w-sm font-mono"
            />
            <datalist id={`modelos-${proveedor}`}>
              {estado.modelos_sugeridos[proveedor].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-micro text-muted">Elige de la lista o escribe otro nombre de modelo.</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="clave-ia" className="flex items-center gap-1.5 text-meta font-medium text-ink">
              <KeyRound className="size-3.5" aria-hidden="true" />
              API key de {NOMBRE_PROVEEDOR[proveedor]}
            </label>
            <Entrada
              id="clave-ia"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={claves[proveedor]}
              onChange={(e) => setClaves((c) => ({ ...c, [proveedor]: e.target.value }))}
              placeholder={clave?.configurada ? describirClave(clave) : "Pega aquí la clave"}
              className="max-w-xl font-mono"
            />
            <p className="text-micro text-muted">
              {clave?.configurada ? "Déjalo vacío para mantener la clave actual. " : ""}
              {AYUDA_CLAVE[proveedor]}
            </p>
          </div>

          {prueba ? (
            <p
              role="status"
              className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-meta ${
                prueba.ok ? "border-green-200 bg-green-50 text-green-700" : "border-brick-200 bg-brick-50 text-brick-700"
              }`}
            >
              {prueba.ok ? <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> : <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />}
              {prueba.mensaje}
            </p>
          ) : null}
          {aviso ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-meta text-green-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              {aviso}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-3 rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Boton type="submit" disabled={bloqueado || !hayCambios || !tieneClave || !modelos[proveedor].trim()}>
              {trabajando === "guardar"
                ? "Guardando…"
                : proveedor !== estado.proveedor
                  ? `Guardar y usar ${NOMBRE_PROVEEDOR[proveedor]}`
                  : "Guardar"}
            </Boton>
            <Boton
              type="button"
              variante="secundario"
              onClick={() => void probar()}
              disabled={trabajando !== null || !tieneClave || !modelos[proveedor].trim()}
            >
              <PlugZap className="size-4" aria-hidden="true" />
              {trabajando === "probar" ? "Probando…" : "Probar conexión"}
            </Boton>
            {clave?.origen === "pantalla" ? (
              confirmarQuitar ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-meta text-ink">¿Quitar la clave guardada?</span>
                  <Boton type="button" variante="peligro" tamano="sm" onClick={() => void quitar()} disabled={bloqueado}>
                    {trabajando === "quitar" ? "Quitando…" : "Sí, quitar"}
                  </Boton>
                  <Boton type="button" variante="fantasma" tamano="sm" onClick={() => setConfirmarQuitar(false)} disabled={bloqueado}>
                    Cancelar
                  </Boton>
                </span>
              ) : (
                <Boton type="button" variante="fantasma" onClick={() => setConfirmarQuitar(true)} disabled={bloqueado} className="text-brick-700">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Quitar clave
                </Boton>
              )
            ) : null}
          </div>

          <p className="mt-4 text-micro text-faint">
            La clave se guarda cifrada y no se vuelve a mostrar. &quot;Probar conexión&quot; solo consulta el modelo: no lee ningún
            reporte ni gasta saldo. El cambio se aplica a los reportes que se suban después; los ya leídos no cambian.
          </p>
        </form>
      ) : null}

      {error && !estado ? (
        <p role="alert" className="rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
