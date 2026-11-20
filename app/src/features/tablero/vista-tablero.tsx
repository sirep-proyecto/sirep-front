/**
 * Responsabilidad: vista completa del Tablero del Administrador (SIREP-S4-T06, T07 y T08).
 * Solo visible para cuentas con permiso `gestionar_usuarios` (administrador).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldAlert,
  Unlock,
} from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { usePermiso } from "@/config/use-permiso";
import { mensajeDeError } from "@/features/configuracion/config-bot";

import {
  leerTablero,
  liberarReservaDesdeTablero,
  type MetricasIngestorPeriodo,
  type MetricasRevisorPeriodo,
  type TableroAdministrador,
} from "./tablero-api";

type Periodo = "total" | "hoy" | "esta_semana";

const CLASE_TH =
  "border-b border-line px-4 py-2.5 text-left text-micro font-medium uppercase tracking-label text-muted";
const CLASE_TD = "border-b border-line px-4 py-2.5 text-meta text-ink";

const fmtFechaHora = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })
    : "Sin actividad";

const fmtFecha = (isoYYYYMMDD: string | null) => {
  if (!isoYYYYMMDD) return "Sin datos suficientes";
  const d = new Date(`${isoYYYYMMDD}T12:00:00Z`);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
    : isoYYYYMMDD;
};

export function VistaTablero() {
  const esAdmin = usePermiso("gestionar_usuarios");
  const [datos, setDatos] = useState<TableroAdministrador | null>(null);
  const [cargando, setCargando] = useState(esAdmin);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("total");
  const [liberando, setLiberando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!esAdmin) return;
    setCargando(true);
    setError(null);
    try {
      setDatos(await leerTablero());
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [esAdmin]);

  useEffect(() => {
    if (!esAdmin) return;
    let vigente = true;
    leerTablero()
      .then((res) => {
        if (!vigente) return;
        setDatos(res);
        setError(null);
      })
      .catch((e) => {
        if (!vigente) return;
        setError(mensajeDeError(e));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [esAdmin]);

  async function manejarLiberar(numero: string) {
    setLiberando(numero);
    setAviso(null);
    try {
      const res = await liberarReservaDesdeTablero(numero);
      setAviso(res.mensaje || `Reserva de N° ${numero} liberada.`);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setLiberando(null);
    }
  }

  if (!esAdmin) {
    return (
      <section className="rounded-xl border border-brick-200 bg-brick-50 p-6 text-brick-800">
        <p className="flex items-center gap-2 text-base font-semibold">
          <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
          Acceso restringido al administrador
        </p>
        <p className="mt-2 text-meta">
          El tablero de avance del equipo solo puede ser consultado por cuentas con rol Administrador.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="Período de métricas">
          {(
            [
              { id: "total", label: "Acumulado" },
              { id: "hoy", label: "Hoy" },
              { id: "esta_semana", label: "Esta semana" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriodo(item.id)}
              className={[
                "h-9 cursor-pointer rounded-md border px-3 text-meta font-medium transition-colors",
                periodo === item.id
                  ? "border-petrol-600 bg-petrol-50 text-petrol-700"
                  : "border-line bg-raised text-muted hover:text-ink",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Boton
          variante="secundario"
          tamano="sm"
          onClick={() => void cargar()}
          disabled={cargando}
        >
          <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar métricas
        </Boton>
      </div>

      {aviso ? (
        <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-meta text-green-700">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {aviso}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-brick-200 bg-brick-50 px-4 py-3 text-meta text-brick-700">
          {error}
        </p>
      ) : null}

      {cargando && !datos ? (
        <p className="rounded-xl border border-line bg-raised px-5 py-6 text-meta text-muted">
          Calculando sesiones de 20 min y métricas del equipo…
        </p>
      ) : null}

      {datos ? (
        <>
          {/* 1. Totales de reportes + Proyección de término */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-raised p-4 shadow-xs">
              <p className="text-micro uppercase tracking-label text-muted">Reportes subidos</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-ink">{datos.resumen.subidos}</p>
              <p className="mt-1 text-micro text-faint">Total registrado en SIREP</p>
            </div>
            <div className="rounded-xl border border-line bg-raised p-4 shadow-xs">
              <p className="text-micro uppercase tracking-label text-muted">En cola (libres)</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-petrol-700">{datos.resumen.en_cola}</p>
              <p className="mt-1 text-micro text-faint">Listos para tomar</p>
            </div>
            <div className="rounded-xl border border-line bg-raised p-4 shadow-xs">
              <p className="text-micro uppercase tracking-label text-muted">En revisión activa</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-amber-700">{datos.resumen.en_revision}</p>
              <p className="mt-1 text-micro text-faint">
                {datos.reservas_activas.length} reservado(s) ahora
              </p>
            </div>
            <div className="rounded-xl border border-line bg-raised p-4 shadow-xs">
              <p className="text-micro uppercase tracking-label text-muted">Revisados</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-green-700">{datos.resumen.revisados}</p>
              <p className="mt-1 text-micro text-faint">
                {datos.resumen.enviados_rptech} en RP-TECH · {datos.resumen.pendientes_envio_rptech} por sincronizar
              </p>
            </div>
          </div>

          <section className="rounded-xl border border-petrol-200 bg-petrol-50/40 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                  <CalendarClock className="size-4 text-petrol-700" aria-hidden="true" />
                  Ritmo diario y fecha estimada de término
                </h2>
                <p className="mt-1 text-meta text-muted">
                  Calculado dividiendo los {datos.proyeccion.pendientes_totales} reportes pendientes entre el ritmo promedio diario ({datos.proyeccion.promedio_diario_revisados.toFixed(1)} reportes/día en {datos.proyeccion.dias_con_actividad} día(s) activo(s)).
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-micro uppercase tracking-label text-muted">Término estimado</p>
                  <p className="font-mono text-xl font-semibold text-petrol-700">
                    {fmtFecha(datos.proyeccion.fecha_estimada_termino)}
                  </p>
                  {datos.proyeccion.dias_restantes_estimados !== null ? (
                    <p className="text-micro text-faint">
                      Faltan aprox. {datos.proyeccion.dias_restantes_estimados} día(s)
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Tabla de Revisores (SIREP-S4-T06) */}
          <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-ink">Avance por Revisor</h2>
              <p className="mt-0.5 text-meta text-muted">
                Sesiones activas calculadas agrupando acciones con menos de 20 minutos entre sí.
              </p>
            </div>
            <div className="overflow-x-auto border-t border-line scroll-fino">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-sunken/70">
                    <th scope="col" className={CLASE_TH}>Revisor</th>
                    <th scope="col" className={CLASE_TH}>Cerrados</th>
                    <th scope="col" className={CLASE_TH}>Horas activas</th>
                    <th scope="col" className={CLASE_TH}>Min / reporte</th>
                    <th scope="col" className={CLASE_TH}>Rep / hora</th>
                    <th scope="col" className={CLASE_TH}>Corregidos / rep</th>
                    <th scope="col" className={CLASE_TH}>Última actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.revisores.map((r) => {
                    const m: MetricasRevisorPeriodo = periodo === "total" ? r : r[periodo];
                    return (
                      <tr key={r.nombre}>
                        <td className={`${CLASE_TD} font-medium`}>{r.nombre}</td>
                        <td className={`${CLASE_TD} font-mono font-semibold`}>{m.reportes_cerrados}</td>
                        <td className={`${CLASE_TD} font-mono`}>
                          {m.horas_activas.toFixed(2)} h ({m.minutos_activos.toFixed(0)} min)
                        </td>
                        <td className={`${CLASE_TD} font-mono`}>{m.minutos_por_reporte.toFixed(1)} min</td>
                        <td className={`${CLASE_TD} font-mono`}>{m.reportes_por_hora_activa.toFixed(2)}</td>
                        <td className={`${CLASE_TD} font-mono`}>{m.campos_corregidos_por_reporte.toFixed(2)}</td>
                        <td className={`${CLASE_TD} font-mono text-faint`}>{fmtFechaHora(m.ultima_actividad)}</td>
                      </tr>
                    );
                  })}
                  {datos.revisores.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-meta text-muted">
                        Sin revisores registrados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Tabla de Ingestores (SIREP-S4-T06) */}
          <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-ink">Avance por Ingestor</h2>
              <p className="mt-0.5 text-meta text-muted">
                PDFs subidos, duplicados detectados y errores registrados por persona.
              </p>
            </div>
            <div className="overflow-x-auto border-t border-line scroll-fino">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-sunken/70">
                    <th scope="col" className={CLASE_TH}>Ingestor</th>
                    <th scope="col" className={CLASE_TH}>PDFs subidos</th>
                    <th scope="col" className={CLASE_TH}>Duplicados</th>
                    <th scope="col" className={CLASE_TH}>Errores</th>
                    <th scope="col" className={CLASE_TH}>Horas activas</th>
                    <th scope="col" className={CLASE_TH}>Última actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.ingestores.map((ing) => {
                    const m: MetricasIngestorPeriodo = periodo === "total" ? ing : ing[periodo];
                    return (
                      <tr key={ing.nombre}>
                        <td className={`${CLASE_TD} font-medium`}>{ing.nombre}</td>
                        <td className={`${CLASE_TD} font-mono font-semibold`}>{m.pdfs_subidos}</td>
                        <td className={`${CLASE_TD} font-mono`}>{m.duplicados}</td>
                        <td className={`${CLASE_TD} font-mono`}>{m.errores}</td>
                        <td className={`${CLASE_TD} font-mono`}>{m.horas_activas.toFixed(2)} h</td>
                        <td className={`${CLASE_TD} font-mono text-faint`}>{fmtFechaHora(m.ultima_actividad)}</td>
                      </tr>
                    );
                  })}
                  {datos.ingestores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-meta text-muted">
                        Sin ingestores registrados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Reportes reservados actualmente + Alertas de calidad */}
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
              <div className="px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                  <Clock className="size-4 text-amber-700" aria-hidden="true" />
                  Reportes reservados ahora ({datos.reservas_activas.length})
                </h2>
                <p className="mt-0.5 text-meta text-muted">
                  Las reservas vencen automáticamente a las 4 horas o puedes liberarlas manualmente.
                </p>
              </div>
              <div className="border-t border-line">
                {datos.reservas_activas.length === 0 ? (
                  <p className="px-5 py-4 text-meta text-muted">No hay reportes reservados en este momento.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {datos.reservas_activas.map((res) => (
                      <li key={res.numero_reporte} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <Link
                            href={`/reportes/${encodeURIComponent(res.numero_reporte)}`}
                            className="font-mono text-meta font-semibold text-petrol-700 hover:underline"
                          >
                            N° {res.numero_reporte}
                          </Link>
                          <span className="ml-2 text-meta text-muted">{res.cliente}</span>
                          <p className="mt-0.5 text-micro text-faint">
                            Reservado por <span className="font-medium text-ink">{res.reservado_por}</span> desde {fmtFechaHora(res.reservado_en)} ({res.minutos_transcurridos.toFixed(0)} min)
                          </p>
                        </div>
                        <Boton
                          variante="secundario"
                          tamano="sm"
                          disabled={liberando === res.numero_reporte}
                          onClick={() => void manejarLiberar(res.numero_reporte)}
                        >
                          <Unlock className="size-3.5" aria-hidden="true" />
                          {liberando === res.numero_reporte ? "Liberando…" : "Liberar"}
                        </Boton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
              <div className="px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                  <AlertTriangle className="size-4 text-brick-700" aria-hidden="true" />
                  Alertas de calidad ({datos.alertas_calidad.length})
                </h2>
                <p className="mt-0.5 text-meta text-muted">
                  Reportes cerrados en menos de 2 minutos sin ninguna corrección manual.
                </p>
              </div>
              <div className="border-t border-line">
                {datos.alertas_calidad.length === 0 ? (
                  <p className="px-5 py-4 text-meta text-muted">
                    No se detectaron cierres apresurados sin correcciones.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {datos.alertas_calidad.map((al) => (
                      <li key={al.numero_reporte} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                        <div>
                          <Link
                            href={`/reportes/${encodeURIComponent(al.numero_reporte)}`}
                            className="font-mono text-meta font-semibold text-brick-700 hover:underline"
                          >
                            N° {al.numero_reporte}
                          </Link>
                          <span className="ml-2 text-meta text-ink">{al.revisor}</span>
                          <p className="mt-0.5 text-micro text-brick-700">{al.motivo}</p>
                        </div>
                        <Insignia tono="brick" tamano="micro">
                          0 correcciones
                        </Insignia>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* 5. Doble revisión aleatoria (5%) */}
          <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Doble revisión a ciegas (5% aleatorio)</h2>
                <p className="mt-0.5 text-meta text-muted">
                  Coincidencia campo por campo entre el primer y segundo revisor independiente.
                </p>
              </div>
              <Insignia tono={datos.doble_revision.promedio_coincidencia !== null ? "petrol" : "neutral"}>
                {datos.doble_revision.promedio_coincidencia !== null
                  ? `Coincidencia promedio: ${datos.doble_revision.promedio_coincidencia.toFixed(1)}%`
                  : "Sin comparaciones completadas aún"}
              </Insignia>
            </div>

            <div className="border-t border-line">
              {datos.doble_revision.pendientes.length > 0 ? (
                <div className="border-b border-line bg-amber-50/50 px-5 py-3 text-meta text-amber-900">
                  <span className="font-medium">En espera de segundo revisor:</span>{" "}
                  {datos.doble_revision.pendientes
                    .map((p) => `N° ${p.numero_reporte} (1°: ${p.primer_revisor})`)
                    .join(" · ")}
                </div>
              ) : null}

              {datos.doble_revision.completadas.length === 0 ? (
                <p className="px-5 py-4 text-meta text-muted">
                  Aún no hay reportes con doble revisión completada.
                </p>
              ) : (
                <div className="overflow-x-auto scroll-fino">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-sunken/70">
                        <th scope="col" className={CLASE_TH}>Reporte</th>
                        <th scope="col" className={CLASE_TH}>1° Revisor</th>
                        <th scope="col" className={CLASE_TH}>2° Revisor</th>
                        <th scope="col" className={CLASE_TH}>Coincidencia</th>
                        <th scope="col" className={CLASE_TH}>Campos iguales</th>
                        <th scope="col" className={CLASE_TH}>Completado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.doble_revision.completadas.map((d) => (
                        <tr key={d.numero_reporte}>
                          <td className={`${CLASE_TD} font-mono font-semibold text-petrol-700`}>
                            <Link href={`/reportes/${encodeURIComponent(d.numero_reporte)}`} className="hover:underline">
                              N° {d.numero_reporte}
                            </Link>
                          </td>
                          <td className={CLASE_TD}>{d.primer_revisor}</td>
                          <td className={CLASE_TD}>{d.segundo_revisor}</td>
                          <td className={`${CLASE_TD} font-mono font-semibold`}>
                            {d.porcentaje_coincidencia.toFixed(1)}%
                          </td>
                          <td className={`${CLASE_TD} font-mono`}>
                            {d.campos_coincidentes} / {d.campos_totales}
                          </td>
                          <td className={`${CLASE_TD} font-mono text-faint`}>{fmtFechaHora(d.completado_en)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
