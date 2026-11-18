/**
 * Responsabilidad: pestaña "Actividad" de Configuración. Muestra qué hizo cada cuenta
 * (revisar reportes, cerrarlos, subir escaneos, exportar, cambiar accesos…) para que
 * el administrador pueda controlar las acciones de las cuentas que creó.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Boton } from "@/components/ui/boton";

import {
  ACCIONES_ACTIVIDAD,
  describirDetalle,
  leerActividad,
  type RegistroActividad,
} from "./config-actividad";
import { mensajeDeError } from "./config-bot";
import { leerUsuarios, type CuentaUsuario } from "./config-usuarios";

const CLASE_SELECT = [
  "h-9 w-full rounded-sm border border-line-strong bg-inset px-3",
  "text-base text-ink",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600",
].join(" ");

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });

export function ConfiguracionActividad() {
  const [registros, setRegistros] = useState<RegistroActividad[]>([]);
  const [cuentas, setCuentas] = useState<CuentaUsuario[]>([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [accion, setAccion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setRegistros(await leerActividad({ usuarioId: usuarioId || undefined, accion: accion || undefined }));
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [usuarioId, accion]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  useEffect(() => {
    leerUsuarios()
      .then((datos) => setCuentas(datos.cuentas))
      .catch(() => undefined);
  }, []);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Actividad de las cuentas</h2>
          <p className="mt-1 text-meta text-muted">
            Lo último que hizo cada cuenta. Se conserva el nombre que tenía al hacerlo.
          </p>
        </div>
        <Boton variante="fantasma" tamano="sm" onClick={() => void cargar()} disabled={cargando} className="text-petrol-700">
          <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </Boton>
      </div>

      <div className="grid gap-3 border-t border-line px-5 py-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-meta font-medium text-ink">
          Cuenta
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className={CLASE_SELECT}>
            <option value="">Todas las cuentas</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-meta font-medium text-ink">
          Acción
          <select value={accion} onChange={(e) => setAccion(e.target.value)} className={CLASE_SELECT}>
            <option value="">Todas las acciones</option>
            {Object.entries(ACCIONES_ACTIVIDAD).map(([id, etiqueta]) => (
              <option key={id} value={id}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mx-5 mb-4 rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
          {error}
        </p>
      ) : null}

      {!error && !cargando && registros.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-meta text-muted">Aún no hay actividad registrada.</p>
      ) : null}

      {registros.length > 0 ? (
        <div className="overflow-x-auto border-t border-line scroll-fino">
          <table className="w-full border-collapse">
            <caption className="sr-only">Actividad reciente de las cuentas de SIREP</caption>
            <thead>
              <tr className="bg-sunken/70">
                {["Cuándo", "Cuenta", "Acción", "Detalle"].map((titulo) => (
                  <th
                    key={titulo}
                    scope="col"
                    className="border-b border-line px-4 py-2.5 text-left text-micro font-medium uppercase tracking-label text-muted"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap border-b border-line px-4 py-2 font-mono text-meta text-faint">
                    {fechaHora(r.creado_en)}
                  </td>
                  <td className="border-b border-line px-4 py-2 text-body font-medium text-ink">{r.usuario}</td>
                  <td className="border-b border-line px-4 py-2 text-meta text-ink">
                    {ACCIONES_ACTIVIDAD[r.accion] ?? r.accion}
                  </td>
                  <td className="border-b border-line px-4 py-2 text-meta text-muted">{describirDetalle(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
