/**
 * Responsabilidad: tabla para el administrador con quién tiene clave de Gemini
 * propia, si está activa, cuántos reportes leyó y su último error.
 * Nunca muestra una clave: el backend solo envía sus 4 últimos caracteres.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";

import { mensajeDeError } from "./config-bot";
import { leerClavesDeUsuarios, type ClaveDeUsuario } from "./config-mi-clave";

const fechaHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "—";

export function ConfiguracionClavesUsuarios() {
  const [filas, setFilas] = useState<ClaveDeUsuario[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setFilas(await leerClavesDeUsuarios());
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial desde el backend (mismo patrón que configuracion-ia.tsx)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  return (
    <section className="rounded-xl border border-line bg-raised px-5 py-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Claves propias de cada cuenta</h2>
          <p className="mt-1 text-meta text-muted">
            Quien tiene clave propia lee sus reportes con su propio cupo de Gemini. Si su clave falla, se usa la de arriba.
          </p>
        </div>
        <Boton variante="fantasma" tamano="sm" onClick={() => void cargar()} disabled={cargando} className="text-petrol-700">
          <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </Boton>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
          {error}
        </p>
      ) : null}
      {filas && filas.length === 0 ? (
        <p className="mt-3 text-meta text-muted">Nadie tiene clave propia todavía. Cada persona la agrega en «Mi clave de Gemini».</p>
      ) : null}
      {filas && filas.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-meta">
            <thead>
              <tr className="border-b border-line text-micro uppercase tracking-label text-faint">
                <th className="py-2 pr-3 font-medium">Cuenta</th>
                <th className="py-2 pr-3 font-medium">Clave</th>
                <th className="py-2 pr-3 font-medium">Modelo</th>
                <th className="py-2 pr-3 font-medium">Leídos</th>
                <th className="py-2 pr-3 font-medium">Último uso</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.usuario_id} className="border-b border-line last:border-b-0">
                  <td className="py-2 pr-3">
                    <span className="block font-medium text-ink">{f.nombre ?? f.usuario ?? "—"}</span>
                    <span className="text-micro text-muted">{f.rol}</span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-ink">••••{f.final ?? ""}</td>
                  <td className="py-2 pr-3 font-mono text-ink">{f.modelo}</td>
                  <td className="py-2 pr-3 text-ink">{f.lecturas}</td>
                  <td className="py-2 pr-3 text-ink">{fechaHora(f.ultimo_uso_en)}</td>
                  <td className="py-2">
                    {f.ultimo_error ? (
                      <span title={f.ultimo_error}>
                        <Insignia tono="amber" tamano="micro">Falló {fechaHora(f.ultimo_error_en)}</Insignia>
                      </span>
                    ) : (
                      <Insignia tono={f.activa ? "green" : "neutral"} tamano="micro">
                        {f.activa ? "Activa" : "Pausada"}
                      </Insignia>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
