/**
 * Responsabilidad: pantalla del bot de Telegram. Muestra a qué dirección le
 * manda Telegram los mensajes y deja escribir la nueva dirección pública del
 * backend (otro túnel de ngrok, otro dominio) y volver a conectar el bot.
 * Existe para no tener que entrar al servidor a correr `npm run telegram:webhook`.
 */

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, PlugZap, RefreshCw, Unplug } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";
import { Insignia } from "@/components/ui/insignia";

import { conectarBot, desconectarBot, leerEstadoBot, limpiarDireccion, mensajeDeError, type EstadoBot } from "./config-bot";

const fechaHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "";

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-line py-3 last:border-b-0">
      <dt className="text-meta text-muted">{etiqueta}</dt>
      <dd className="min-w-0 text-right text-meta font-medium break-all text-ink">{children}</dd>
    </div>
  );
}

export function ConfiguracionBot() {
  const [estado, setEstado] = useState<EstadoBot | null>(null);
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<"conectar" | "desconectar" | null>(null);
  const [confirmarDesconexion, setConfirmarDesconexion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const aplicar = (nuevo: EstadoBot) => {
    setEstado(nuevo);
    setDireccion(nuevo.direccion_actual ?? nuevo.direccion_sugerida ?? "");
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      aplicar(await leerEstadoBot());
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

  async function conectar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTrabajando("conectar");
    setError(null);
    setAviso(null);
    try {
      const nuevo = await conectarBot(limpiarDireccion(direccion));
      aplicar(nuevo);
      setAviso("Bot conectado. Telegram ya envía los mensajes a la dirección nueva.");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  async function desconectar() {
    setTrabajando("desconectar");
    setError(null);
    setAviso(null);
    try {
      aplicar(await desconectarBot());
      setAviso("Bot desconectado. Telegram guarda los mensajes hasta que vuelvas a conectar.");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(null);
      setConfirmarDesconexion(false);
    }
  }

  const rutaWebhook = estado?.ruta_webhook ?? "/telegram/webhook";
  const limpia = limpiarDireccion(direccion, rutaWebhook);
  const valida = /^https:\/\/[^\s/?#]+/.test(limpia);
  const bloqueado = !estado?.puede_cambiar || trabajando !== null;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Estado del bot</h2>
          <Boton variante="fantasma" tamano="sm" onClick={() => void cargar()} disabled={cargando} className="text-petrol-700">
            <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </Boton>
        </div>

        {cargando && !estado ? <p className="mt-3 text-meta text-muted">Consultando a Telegram…</p> : null}

        {estado && !estado.configurado ? (
          <p className="mt-3 text-meta text-amber-700">Este backend no tiene TELEGRAM_BOT_TOKEN: el bot no está configurado.</p>
        ) : null}

        {estado?.configurado ? (
          <dl className="mt-2">
            <Fila etiqueta="Bot">
              {[estado.bot?.usuario, estado.bot?.nombre].filter(Boolean).join(" · ") || "—"}
            </Fila>
            <Fila etiqueta="Estado">
              {estado.conectado ? (
                <Insignia tono="green">Conectado</Insignia>
              ) : (
                <Insignia tono="amber">Desconectado</Insignia>
              )}
            </Fila>
            <Fila etiqueta="Recibe mensajes en">
              {estado.url_webhook ?? <span className="text-muted">Ninguna dirección</span>}
            </Fila>
            <Fila etiqueta="Mensajes en cola">
              <span className="font-mono">{estado.mensajes_pendientes}</span>
            </Fila>
            {estado.ultimo_error ? (
              <Fila etiqueta="Último error">
                <span className="inline-flex items-start gap-1.5 text-brick-700">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {estado.ultimo_error}
                    {estado.ultimo_error_en ? <span className="font-normal text-muted"> · {fechaHora(estado.ultimo_error_en)}</span> : null}
                  </span>
                </span>
              </Fila>
            ) : null}
          </dl>
        ) : null}
      </section>

      {estado?.configurado ? (
        <section className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
          <h2 className="text-base font-semibold text-ink">Dirección del backend</h2>
          <p className="mt-1 text-meta text-muted">
            {estado.puede_cambiar
              ? "Si el backend cambia de dirección (otro túnel de ngrok u otro dominio), escribe aquí la nueva y conecta el bot otra vez."
              : "Solo un administrador u operador puede cambiar la dirección del bot."}
          </p>

          <form onSubmit={conectar} className="mt-4 flex flex-col gap-2">
            <label htmlFor="direccion-backend" className="text-meta font-medium text-ink">
              URL pública del backend
            </label>
            <Entrada
              id="direccion-backend"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="https://mi-tunel.ngrok-free.dev"
              disabled={!estado.puede_cambiar}
              className="max-w-xl font-mono"
            />
            <p className="text-micro break-all text-muted">
              {valida ? (
                <>Telegram enviará los mensajes a {limpia}{rutaWebhook}</>
              ) : (
                "Escribe la dirección completa, empezando con https://"
              )}
            </p>

            {aviso ? (
              <p className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-meta text-green-700">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                {aviso}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="mt-2 rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
                {error}
              </p>
            ) : null}

            {estado.puede_cambiar ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Boton type="submit" disabled={bloqueado || !valida}>
                  <PlugZap className="size-4" aria-hidden="true" />
                  {trabajando === "conectar" ? "Conectando…" : estado.conectado ? "Volver a conectar" : "Conectar"}
                </Boton>
                {estado.conectado ? (
                  confirmarDesconexion ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-meta text-ink">¿Desconectar el bot?</span>
                      <Boton type="button" variante="peligro" tamano="sm" onClick={() => void desconectar()} disabled={bloqueado}>
                        {trabajando === "desconectar" ? "Desconectando…" : "Sí, desconectar"}
                      </Boton>
                      <Boton type="button" variante="fantasma" tamano="sm" onClick={() => setConfirmarDesconexion(false)} disabled={bloqueado}>
                        Cancelar
                      </Boton>
                    </span>
                  ) : (
                    <Boton type="button" variante="fantasma" onClick={() => setConfirmarDesconexion(true)} disabled={bloqueado} className="text-petrol-700">
                      <Unplug className="size-4" aria-hidden="true" />
                      Desconectar
                    </Boton>
                  )
                ) : null}
              </div>
            ) : null}
          </form>

          <p className="mt-4 text-micro text-faint">
            Antes de conectar se comprueba que la dirección llegue a este backend de SIREP: no se puede mandar el bot a otro servidor.
            Los mensajes en cola no se pierden.
          </p>
        </section>
      ) : null}
    </div>
  );
}
