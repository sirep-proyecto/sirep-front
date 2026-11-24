/**
 * Responsabilidad: pestaña "Mi clave de Gemini". Cualquier cuenta pega aquí su
 * propia API key de Gemini y elige el modelo; los reportes que sube desde la
 * página se leen con ella. Si la clave falla, el backend usa la de la empresa y
 * aquí se ve el último error.
 * Existe para ingestar más rápido: Gemini limita las lecturas por minuto por
 * proyecto de Google, y con una clave propia cada persona tiene su propio cupo.
 */

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, ListChecks, PauseCircle, PlayCircle, PlugZap, Trash2 } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";
import { Insignia } from "@/components/ui/insignia";

import { mensajeDeError } from "./config-bot";
import {
  describirMiClave,
  guardarMiClave,
  leerMiClave,
  modelosMiClave,
  probarMiClave,
  quitarMiClave,
  sePuedeElegir,
  textoOpcionModelo,
  type EstadoMiClave,
  type ModeloConCupo,
} from "./config-mi-clave";

const fechaHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "";

type Trabajo = "guardar" | "probar" | "quitar" | "modelos" | "pausar";

export function ConfiguracionMiClave() {
  const [estado, setEstado] = useState<EstadoMiClave | null>(null);
  const [clave, setClave] = useState("");
  const [modelo, setModelo] = useState("");
  const [modelos, setModelos] = useState<ModeloConCupo[] | null>(null);
  const [trabajando, setTrabajando] = useState<Trabajo | null>(null);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const aplicar = (nuevo: EstadoMiClave) => {
    setEstado(nuevo);
    setModelo(nuevo.modelo);
  };

  const cargar = useCallback(async () => {
    try {
      aplicar(await leerMiClave());
    } catch (e) {
      setResultado({ ok: false, mensaje: mensajeDeError(e) });
    }
  }, []);

  useEffect(() => {
    // Carga inicial desde el backend (mismo patrón que configuracion-ia.tsx)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  async function ejecutar(trabajo: Trabajo, accion: () => Promise<void>) {
    setTrabajando(trabajo);
    setResultado(null);
    try {
      await accion();
    } catch (e) {
      setResultado({ ok: false, mensaje: mensajeDeError(e) });
    } finally {
      setTrabajando(null);
      setConfirmarQuitar(false);
    }
  }

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    void ejecutar("guardar", async () => {
      const cambio: { clave?: string; modelo?: string } = {};
      if (clave.trim()) cambio.clave = clave.trim();
      if (modelo.trim() && modelo.trim() !== estado?.modelo) cambio.modelo = modelo.trim();
      aplicar(await guardarMiClave(cambio));
      setClave("");
      setResultado({ ok: true, mensaje: "Clave guardada. Los reportes que subas desde ahora se leen con ella." });
    });
  };

  const probar = () =>
    ejecutar("probar", async () => {
      setResultado(await probarMiClave({ clave: clave.trim() || undefined, modelo: modelo.trim() || undefined }));
    });

  const verModelos = () =>
    ejecutar("modelos", async () => {
      const r = await modelosMiClave({ clave: clave.trim() || undefined });
      setResultado({ ok: r.ok, mensaje: r.mensaje });
      if (r.ok) setModelos(r.modelos);
    });

  const pausar = () =>
    ejecutar("pausar", async () => {
      aplicar(await guardarMiClave({ activa: !estado?.activa }));
    });

  const quitar = () =>
    ejecutar("quitar", async () => {
      aplicar(await quitarMiClave());
      setModelos(null);
      setResultado({ ok: true, mensaje: "Clave quitada. Tus reportes se leen con la clave de la empresa." });
    });

  const tieneClave = Boolean(estado?.configurada || clave.trim());
  const hayCambios = Boolean(clave.trim()) || (!!estado && modelo.trim() !== estado.modelo);
  const bloqueado = trabajando !== null || !estado?.disponible;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Mi clave de Gemini</h2>
          {estado?.configurada ? (
            <Insignia tono={estado.activa && !estado.ilegible ? "green" : "amber"}>
              {estado.ilegible ? "Vuelve a pegarla" : estado.activa ? "Activa" : "Pausada"}
            </Insignia>
          ) : null}
        </div>
        {estado ? <p className="mt-1 text-meta text-muted">{describirMiClave(estado)}</p> : null}
        {estado?.configurada ? (
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-meta sm:grid-cols-3">
            <div>
              <dt className="text-muted">Modelo</dt>
              <dd className="font-mono text-ink">{estado.modelo}</dd>
            </div>
            <div>
              <dt className="text-muted">Reportes leídos con tu clave</dt>
              <dd className="text-ink">{estado.lecturas}</dd>
            </div>
            <div>
              <dt className="text-muted">Último uso</dt>
              <dd className="text-ink">{fechaHora(estado.ultimo_uso_en) || "Aún no"}</dd>
            </div>
          </dl>
        ) : null}
        {estado?.ultimo_error ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-meta text-amber-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Tu clave falló el {fechaHora(estado.ultimo_error_en)} y ese reporte se leyó con la de la empresa: {estado.ultimo_error}
            </span>
          </p>
        ) : null}
        {estado && !estado.disponible ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-meta text-amber-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Falta correr la migración 20261124000000_claves_ia_usuario.sql en Supabase.
          </p>
        ) : null}
      </section>

      {estado ? (
        <form onSubmit={guardar} className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
          <div className="flex flex-col gap-2">
            <label htmlFor="mi-clave" className="flex items-center gap-1.5 text-meta font-medium text-ink">
              <KeyRound className="size-3.5" aria-hidden="true" />
              API key de Gemini
            </label>
            <Entrada
              id="mi-clave"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder={estado.configurada ? `••••${estado.final ?? ""} (déjalo vacío para mantenerla)` : "AIza…"}
              className="max-w-xl font-mono"
            />
            <p className="text-micro text-muted">
              Créala en <strong>tu propia cuenta</strong> de Google AI Studio (aistudio.google.com › Get API key). El límite de
              lecturas por minuto es por proyecto de Google: dos claves del mismo proyecto comparten el mismo cupo.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="mi-modelo" className="text-meta font-medium text-ink">
              Modelo
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {modelos?.length ? (
                <select
                  id="mi-modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="h-9 w-full max-w-xl cursor-pointer rounded-sm border border-line-strong bg-inset px-3 font-mono text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600"
                >
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id} disabled={!sePuedeElegir(m)}>
                      {textoOpcionModelo(m)}
                    </option>
                  ))}
                </select>
              ) : (
                <Entrada
                  id="mi-modelo"
                  autoComplete="off"
                  spellCheck={false}
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="max-w-sm font-mono"
                />
              )}
              <Boton type="button" variante="secundario" tamano="sm" onClick={() => void verModelos()} disabled={trabajando !== null || !tieneClave}>
                <ListChecks className="size-4" aria-hidden="true" />
                {trabajando === "modelos" ? "Comprobando modelos…" : "Ver modelos gratuitos de mi clave"}
              </Boton>
            </div>
            <p className="text-micro text-muted">
              Recomendado: <span className="font-mono">{estado.modelo_por_defecto}</span>. Al ver los modelos se hace una
              prueba mínima de cada uno para saber cuáles responden con el cupo gratuito de tu cuenta.
            </p>
          </div>

          {resultado ? (
            <p
              role="status"
              className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-meta ${
                resultado.ok ? "border-green-200 bg-green-50 text-green-700" : "border-brick-200 bg-brick-50 text-brick-700"
              }`}
            >
              {resultado.ok ? (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              )}
              {resultado.mensaje}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Boton type="submit" disabled={bloqueado || !hayCambios || !tieneClave}>
              {trabajando === "guardar" ? "Probando y guardando…" : "Guardar"}
            </Boton>
            <Boton type="button" variante="secundario" onClick={() => void probar()} disabled={trabajando !== null || !tieneClave}>
              <PlugZap className="size-4" aria-hidden="true" />
              {trabajando === "probar" ? "Probando…" : "Probar conexión"}
            </Boton>
            {estado.configurada ? (
              <>
                <Boton type="button" variante="fantasma" onClick={() => void pausar()} disabled={bloqueado}>
                  {estado.activa ? <PauseCircle className="size-4" aria-hidden="true" /> : <PlayCircle className="size-4" aria-hidden="true" />}
                  {estado.activa ? "Pausar" : "Volver a usarla"}
                </Boton>
                {confirmarQuitar ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-meta text-ink">¿Quitar tu clave?</span>
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
                    Quitar
                  </Boton>
                )}
              </>
            ) : null}
          </div>

          <p className="mt-4 text-micro text-faint">
            La clave se guarda cifrada y no se vuelve a mostrar. Solo la usan los reportes que tú subes desde la página. Si tu
            clave falla o se queda sin cupo, ese reporte se lee con la clave de la empresa y te avisamos.
          </p>
        </form>
      ) : null}
    </div>
  );
}
