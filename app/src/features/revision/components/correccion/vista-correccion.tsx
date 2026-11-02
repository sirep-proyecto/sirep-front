/**
 * Responsabilidad: vista interactiva de cliente para la corrección de un reporte.
 * Recibe `numero: string` ya resuelto desde la página servidor, evitando
 * advertencias de prerendering en Next.js.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { BarraAccionesReporte } from "@/features/revision/components/correccion/barra-acciones-reporte";
import { CabeceraReporte } from "@/features/revision/components/correccion/cabecera-reporte";
import {
  CargandoRevision,
  ErrorDeCarga,
  ReporteNoEncontrado,
} from "@/features/revision/components/correccion/estados-revision";
import { ModalImagenReal } from "@/features/revision/components/correccion/modal-imagen-real";
import { PanelCampos } from "@/features/revision/components/correccion/panel-campos";
import { ProgresoRevision } from "@/features/revision/components/correccion/progreso-revision";
import { HojaEscaneada } from "@/features/revision/components/escaneo/hoja-escaneada";
import { RecorteEscaneo } from "@/features/revision/components/escaneo/recorte";
import { useRevisionReporte } from "@/features/revision/hooks/use-revision-reporte";
import { useRepositorio } from "@/features/revision/providers/repositorio-contexto";
import type { NumeroPagina } from "@/features/revision/types/regiones";

interface VistaCorreccionProps {
  numero: string;
}

export function VistaCorreccion({ numero }: VistaCorreccionProps) {
  const revision = useRevisionReporte(numero);
  const repositorio = useRepositorio();

  const [nombreReporte, setNombreReporte] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalOriginal, setModalOriginal] = useState(false);
  const [paginaEscaneo, setPaginaEscaneo] = useState<NumeroPagina>(1);
  const [zoomNivel, setZoomNivel] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Snapshot para detectar cambios sucios (dirty) y poder revertir
  const [snapshotReporte, setSnapshotReporte] = useState<string | null>(null);
  const [tieneCambios, setTieneCambios] = useState(false);

  // Inicializar nombre y snapshot cuando el reporte carga
  useEffect(() => {
    if (revision.reporte && !snapshotReporte) {
      const serializado = JSON.stringify(revision.reporte.campos);
      setSnapshotReporte(serializado);
      setNombreReporte(
        `Reporte N° ${revision.reporte.numero_reporte} - ${revision.reporte.cliente}`,
      );
    }
  }, [revision.reporte, snapshotReporte]);

  // Sincronizar cambios en campos para habilitar/deshabilitar Guardar
  useEffect(() => {
    if (revision.reporte && snapshotReporte) {
      const actual = JSON.stringify(revision.reporte.campos);
      const nombreCambiado =
        nombreReporte !==
        `Reporte N° ${revision.reporte.numero_reporte} - ${revision.reporte.cliente}`;
      setTieneCambios(actual !== snapshotReporte || nombreCambiado);
    }
  }, [revision.reporte, snapshotReporte, nombreReporte]);

  if (revision.estado === "cargando") return <CargandoRevision />;
  if (revision.estado === "no_encontrado")
    return <ReporteNoEncontrado numero={numero} />;
  if (revision.estado === "error")
    return (
      <ErrorDeCarga
        mensaje={revision.mensajeError ?? "No se pudo cargar el reporte."}
        onReintentar={revision.recargar}
      />
    );
  if (!revision.reporte) return null;

  const reporte = revision.reporte;

  // Acciones de la barra superior
  const handleGuardar = async () => {
    if (!tieneCambios || guardando) return;
    setGuardando(true);
    try {
      if (repositorio.actualizarReporte) {
        await repositorio.actualizarReporte(reporte);
      }
      setSnapshotReporte(JSON.stringify(reporte.campos));
      setTieneCambios(false);
      setMensajeGuardado("Cambios guardados con éxito.");
      setTimeout(() => setMensajeGuardado(null), 3000);
    } catch {
      setMensajeGuardado("Ocurrió un error al guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const handleRevertir = () => {
    if (!snapshotReporte) return;
    try {
      const camposPrevios = JSON.parse(snapshotReporte);
      for (const campo of camposPrevios) {
        if (campo.valor_corregido) {
          void revision.corregir(campo.id, campo.valor_corregido);
        } else if (campo.estado_revision === "confirmado") {
          void revision.confirmar(campo.id);
        }
      }
      setNombreReporte(
        `Reporte N° ${reporte.numero_reporte} - ${reporte.cliente}`,
      );
      setTieneCambios(false);
      setMensajeGuardado("Se revirtieron todos los cambios al estado previo.");
      setTimeout(() => setMensajeGuardado(null), 3000);
    } catch {
      revision.recargar();
    }
  };

  const handleDescargarPDF = () => {
    const anterior = document.title;
    document.title = nombreReporte || `Reporte_${reporte.numero_reporte}`;
    window.print();
    document.title = anterior;
  };

  return (
    <div className="mx-auto flex w-full max-w-(--layout-max) flex-col gap-5 px-(--space-gutter) pb-16 pt-4">
      {/* Mensaje de confirmación / guardado */}
      {mensajeGuardado ? (
        <aside
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xs border border-green-200 bg-green-50 px-3 py-2 text-meta text-green-800 animate-in fade-in"
        >
          <FileCheck className="size-4 shrink-0 text-green-600" />
          <span>{mensajeGuardado}</span>
        </aside>
      ) : null}

      {/* Barra de navegación rápida a la bandeja */}
      <nav aria-label="Navegación secundaria">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-meta font-medium text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver a la bandeja de revisión
        </Link>
      </nav>

      {/* Barra de herramientas superior CRUD + Google Sheets Title */}
      <BarraAccionesReporte
        nombreReporte={nombreReporte}
        onCambioNombre={(nuevo) => {
          setNombreReporte(nuevo);
          setTieneCambios(true);
        }}
        modoEdicion={modoEdicion}
        onAlternarEdicion={() => setModoEdicion((prev) => !prev)}
        tieneCambios={tieneCambios}
        guardando={guardando}
        onGuardar={handleGuardar}
        onRevertir={handleRevertir}
        onDescargarPDF={handleDescargarPDF}
        onVerImagenReal={() => setModalOriginal(true)}
      />

      {/* Alerta de bloqueo cuando el modo edición está apagado */}
      {!modoEdicion ? (
        <aside
          role="note"
          className="flex items-center justify-between rounded-xs border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-meta text-amber-900"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-amber-700" />
            <span>
              <strong>Campos en modo lectura protegida:</strong> Los campos
              tienen cursor de edición prohibido. Hacé clic en{" "}
              <strong>&ldquo;Editar&rdquo;</strong> arriba para habilitar
              cambios manuales.
            </span>
          </div>
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setModoEdicion(true)}
            className="shrink-0 font-medium"
          >
            Habilitar Edición
          </Boton>
        </aside>
      ) : null}

      {/* Cabecera contextual del reporte */}
      <CabeceraReporte reporte={reporte} />

      {/* Barra de progreso de revisión de campos dudosos */}
      <ProgresoRevision
        pendientes={revision.pendientes}
        ultimoResuelto={
          revision.ultimaAccion
            ? (reporte.campos.find((c) => c.id === revision.ultimaAccion)
                ?.definicion.etiqueta ?? null)
            : null
        }
        onDeshacer={() => void revision.deshacer()}
      />

      {/* Contenedor principal de dos paneles (Visor de Escaneo | Lista de Campos) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Panel izquierdo: Visor de escaneo */}
        <section
          aria-label="Visor del escaneo"
          className="flex flex-col gap-3 rounded-md border border-line bg-paper p-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="text-micro uppercase tracking-label font-medium text-muted">
                Visor de Escaneo
              </span>
              <span className="rounded-xs bg-sunken px-1.5 py-0.5 font-mono text-micro text-ink">
                Pág. {paginaEscaneo} de {reporte.mapa.paginas}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => setModalOriginal(true)}
                className="gap-1 text-micro"
              >
                <Eye className="size-3" />
                Original
              </Boton>

              <div className="flex items-center rounded-xs border border-line p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setZoomNivel((z) => Math.max(z - 0.2, 0.8))
                  }
                  title="Reducir zoom"
                  aria-label="Reducir zoom"
                  className="p-1 text-muted hover:text-ink"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="px-1 text-micro font-mono">
                  {Math.round(zoomNivel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoomNivel((z) => Math.min(z + 0.2, 2))
                  }
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                  className="p-1 text-muted hover:text-ink"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              </div>

              {reporte.mapa.paginas > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaginaEscaneo(1)}
                    disabled={paginaEscaneo === 1}
                    className="p-1 text-muted disabled:opacity-30 hover:text-ink"
                    title="Página anterior"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaginaEscaneo(2)}
                    disabled={paginaEscaneo === 2}
                    className="p-1 text-muted disabled:opacity-30 hover:text-ink"
                    title="Página siguiente"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Recorte destacado del campo activo */}
          {revision.campoActivo ? (
            <div className="rounded-xs border border-petrol-200 bg-petrol-50/50 p-2.5">
              <p className="text-micro uppercase tracking-label font-medium text-petrol-800">
                Recorte del campo activo:{" "}
                <span className="font-semibold">
                  {revision.campoActivo.definicion.etiqueta}
                </span>
              </p>
              <div className="mt-1.5 overflow-hidden rounded-xs border border-petrol-300 bg-paper">
                <RecorteEscaneo
                  mapa={reporte.mapa}
                  region={revision.campoActivo.region}
                >
                  <HojaEscaneada
                    mapa={reporte.mapa}
                    pagina={revision.campoActivo.region.pagina}
                    reporte={reporte}
                  />
                </RecorteEscaneo>
              </div>
            </div>
          ) : null}

          {/* Lienzo del escaneo */}
          <div
            className="relative min-h-[540px] w-full overflow-auto rounded-xs border border-line bg-sunken p-2 flex items-center justify-center"
            style={{ maxHeight: "720px" }}
          >
            <div
              style={{
                transform: `scale(${zoomNivel})`,
                transformOrigin: "top center",
                transition: "transform 150ms ease-out",
                width: "100%",
                maxWidth: "600px",
              }}
            >
              <HojaEscaneada
                mapa={reporte.mapa}
                pagina={paginaEscaneo}
                reporte={reporte}
                resaltado={
                  revision.campoActivo
                    ? {
                        region: revision.campoActivo.region,
                        etiqueta: revision.campoActivo.definicion.etiqueta,
                        tono: "amber",
                      }
                    : null
                }
              />
            </div>
          </div>
        </section>

        {/* Panel derecho: Lista de campos con soporte de bloqueo */}
        <div className="flex flex-col gap-4">
          <PanelCampos
            reporte={reporte}
            grupos={revision.grupos}
            soloDudosos={revision.soloDudosos}
            campoActivo={revision.campoActivo}
            enCurso={revision.campoEnCurso !== null}
            errorAccion={revision.errorAccion}
            modoEdicion={modoEdicion}
            onCambiarVista={revision.cambiarVista}
            acciones={{
              seleccionar: revision.seleccionar,
              confirmar: (id) => void revision.confirmar(id),
              corregir: revision.corregir,
              ilegible: (id) => void revision.marcarIlegible(id),
              reabrir: (id) => void revision.reabrir(id),
              descartarError: revision.descartarError,
            }}
          />
        </div>
      </div>

      {/* Modal de Imagen Real (archivo físico escaneado) */}
      <ModalImagenReal
        abierto={modalOriginal}
        rutaImagen={reporte.escaneo.ruta_original}
        numeroReporte={reporte.numero_reporte}
        cliente={reporte.cliente}
        onCerrar={() => setModalOriginal(false)}
      />

      {/* Plantilla oculta para impresión y descarga como PDF */}
      <div className="hidden print:block print:p-8 bg-paper text-ink">
        <header className="border-b-2 border-ink pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">
                GO SERVICE LATAM
              </h1>
              <p className="text-sm text-muted">
                Soporte Multimarcas · Servicio Técnico
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-mono font-bold text-brick-700">
                N° {reporte.numero_reporte}
              </h2>
              <p className="text-sm">Fecha: {reporte.fecha_reporte}</p>
            </div>
          </div>
        </header>

        <section className="my-6 grid grid-cols-2 gap-4 text-sm border-b border-line pb-4">
          <div>
            <p>
              <strong>Cliente / Empresa:</strong> {reporte.cliente}
            </p>
            <p>
              <strong>Equipo:</strong> {reporte.equipo}
            </p>
          </div>
          <div>
            <p>
              <strong>Técnico:</strong> {reporte.tecnico}
            </p>
            <p>
              <strong>Estado de revisión:</strong> {reporte.estado}
            </p>
          </div>
        </section>

        <section className="my-4">
          <h3 className="font-bold text-sm uppercase tracking-wide border-b border-line pb-1 mb-3">
            Detalle de Campos del Formulario
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-1">Campo</th>
                <th className="py-1">Valor Final</th>
                <th className="py-1">Lectura Modelo</th>
                <th className="py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reporte.campos.map((campo) => (
                <tr key={campo.id} className="border-b border-line/50">
                  <td className="py-1.5 font-medium">
                    {campo.definicion?.etiqueta ?? campo.id}
                  </td>
                  <td className="py-1.5">
                    {campo.valor_corregido ??
                      campo.valor_modelo ??
                      "Sin valor"}
                  </td>
                  <td className="py-1.5 text-muted">
                    {campo.valor_modelo ?? "—"}
                  </td>
                  <td className="py-1.5 capitalize text-xs">
                    {campo.estado_revision}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-12 pt-6 border-t border-line flex justify-between text-xs text-muted">
          <div>Firma del Técnico: _______________________</div>
          <div>Conformidad del Cliente: _______________________</div>
        </footer>
      </div>
    </div>
  );
}
