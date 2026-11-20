/**
 * Responsabilidad: página raíz de la bandeja de revisión; compone resumen,
 * barra de herramientas y lista con el estado que corresponde.
 * Existe como compositor delgado: no contiene lógica de datos (vive en
 * `use-bandeja`) ni reglas de cálculo (viven en `lib/`), solo decide qué pieza
 * se renderiza según el estado de carga y los filtros activos.
 */

"use client";

import { AvisoEnvioRptech } from "@/features/revision/components/bandeja/aviso-envio";
import { BarraHerramientas } from "@/features/revision/components/bandeja/barra-herramientas";
import { EstadosBandeja } from "@/features/revision/components/bandeja/estados-bandeja";
import { ListaTarjetas } from "@/features/revision/components/bandeja/lista-tarjetas";
import { ResumenBandeja } from "@/features/revision/components/bandeja/resumen-bandeja";
import { TablaReportes } from "@/features/revision/components/bandeja/tabla-reportes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Unlock } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { USUARIO_ACTUAL } from "@/config/sesion";
import { BotonSubirReportes } from "@/features/revision/components/subida/boton-subir-reportes";
import { ZonaSoltarPagina } from "@/features/revision/components/subida/zona-soltar-pagina";
import { useEnvioRptech } from "@/features/revision/hooks/use-envio-rptech";
import { useBandeja } from "@/features/revision/hooks/use-bandeja";
import { usePermiso } from "@/config/use-permiso";
import { useRepositorio } from "@/features/revision/providers/repositorio-contexto";
import { useSubida } from "@/features/revision/providers/subida-contexto";

export default function PaginaBandeja() {
  const router = useRouter();
  const repositorio = useRepositorio();
  const bandeja = useBandeja();
  const { estado: subida } = useSubida();
  const envio = useEnvioRptech(bandeja.refrescar);
  const puedeEnviar = usePermiso("cerrar_reportes");
  const esAdmin = usePermiso("gestionar_usuarios");
  const puedeUsarCola = usePermiso("usar_cola");
  const puedeEditar = usePermiso("editar_campos");
  const puedeSubir = usePermiso("subir_escaneos");
  const esSoloIngestor = puedeSubir && !puedeEditar && !esAdmin;

  const [tomandoSiguiente, setTomandoSiguiente] = useState(false);
  const [liberandoNumero, setLiberandoNumero] = useState<string | null>(null);
  const [avisoCola, setAvisoCola] = useState<string | null>(null);

  const miReservaActiva = bandeja.reportes.find(
    (r) =>
      r.reservado_por &&
      (r.reservado_por_id === USUARIO_ACTUAL.id ||
        r.reservado_por.toLowerCase() === USUARIO_ACTUAL.nombre.toLowerCase()),
  );

  async function manejarSiguienteReporte() {
    if (!repositorio.tomarSiguienteReporte || tomandoSiguiente) return;
    setTomandoSiguiente(true);
    setAvisoCola(null);
    try {
      const res = await repositorio.tomarSiguienteReporte();
      bandeja.refrescar();
      if (res.numero_reporte) {
        router.push(`/reportes/${encodeURIComponent(res.numero_reporte)}`);
      } else {
        setAvisoCola(res.mensaje || "No hay reportes pendientes en la cola.");
      }
    } catch (e) {
      setAvisoCola(
        e instanceof Error ? e.message : "No se pudo reservar el siguiente reporte.",
      );
    } finally {
      setTomandoSiguiente(false);
    }
  }

  async function manejarLiberarReporte(numero: string) {
    if (!repositorio.liberarReporte || liberandoNumero) return;
    setLiberandoNumero(numero);
    setAvisoCola(null);
    try {
      const res = await repositorio.liberarReporte(numero);
      setAvisoCola(res.mensaje);
      bandeja.refrescar();
    } catch (e) {
      setAvisoCola(
        e instanceof Error ? e.message : "No se pudo liberar la reserva.",
      );
    } finally {
      setLiberandoNumero(null);
    }
  }

  // Cada reporte que termina de leer la IA se refleja en la bandeja de
  // inmediato, sin esperar al aviso en vivo (que puede no llegar).
  const { refrescar } = bandeja;
  useEffect(() => {
    if (subida.listos > 0) refrescar();
  }, [subida.listos, refrescar]);

  // Resumen y barra solo con archivo cargado: durante la carga o el error
  // mostraría cifras en cero que parecieran ser verdad.
  const conArchivo =
    bandeja.estadoCarga === "listo" && bandeja.totalArchivo > 0;
  const conResultados = conArchivo && bandeja.reportes.length > 0;

  return (
    <div className="mx-auto w-full max-w-(--layout-max) px-(--space-gutter) pb-16">
      <ZonaSoltarPagina />
      <div className="flex flex-wrap items-end justify-between gap-4">
      <header className="max-w-2xl pt-10 pb-7">
        <p className="mb-2 inline-flex items-center gap-2 text-micro font-medium uppercase tracking-label text-petrol-700">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-petrol-600" />
          {esSoloIngestor ? "Ingesta de documentos" : "Revisión técnica"}
        </p>
        <h1 className="text-display font-semibold tracking-tight text-ink">
          {esSoloIngestor ? "Mis cargas de reportes" : "Bandeja de revisión"}
        </h1>
        <p className="mt-2 text-base text-muted">
          {esSoloIngestor
            ? "Sube los PDFs escaneados y verifica el estado de tus cargas (procesado, duplicado o error)."
            : "Toma el siguiente reporte pendiente de la cola con reserva o revisa los campos dudosos junto al recorte del escaneo."}
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-2.5 pb-7">
        {puedeUsarCola ? (
          <>
            <Boton
              variante="primario"
              tamano="lg"
              onClick={() => void manejarSiguienteReporte()}
              disabled={tomandoSiguiente}
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              {tomandoSiguiente
                ? "Buscando en la cola..."
                : miReservaActiva
                  ? `Continuar mi reserva (N° ${miReservaActiva.numero_reporte})`
                  : "Siguiente reporte"}
            </Boton>
            {miReservaActiva ? (
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => void manejarLiberarReporte(miReservaActiva.numero_reporte)}
                disabled={liberandoNumero === miReservaActiva.numero_reporte}
                title="Devolver mi reporte reservado a la cola"
              >
                <Unlock className="size-4" aria-hidden="true" />
                Liberar mi reserva
              </Boton>
            ) : null}
          </>
        ) : null}
        <BotonSubirReportes />
      </div>
      </div>

      {avisoCola ? (
        <div
          role="status"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-petrol-200 bg-petrol-50 px-4 py-2.5 text-meta text-petrol-800"
        >
          <span>{avisoCola}</span>
          <button
            type="button"
            onClick={() => setAvisoCola(null)}
            className="text-micro font-medium underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      {conArchivo ? (
        <>
          <ResumenBandeja resumen={bandeja.resumen} />
          <BarraHerramientas
            filtros={bandeja.filtros}
            orden={bandeja.orden}
            filtrosActivos={bandeja.filtrosActivos}
            resultados={bandeja.reportes.length}
            totalArchivo={bandeja.totalArchivo}
            onCambioBusqueda={bandeja.establecerBusqueda}
            onCambioEstado={bandeja.establecerEstado}
            onCambioOrigen={bandeja.establecerOrigen}
            onCambioOrden={bandeja.establecerOrden}
            onLimpiar={bandeja.limpiarFiltros}
            porEnviar={bandeja.porEnviar}
            enviandoLote={envio.enviandoLote}
            onEnviarLote={esAdmin ? envio.enviarLote : undefined}
          />
        </>
      ) : null}

      <AvisoEnvioRptech aviso={envio.aviso} onCerrar={envio.cerrarAviso} />

      {bandeja.estadoCarga === "cargando" ? (
        <EstadosBandeja estado="cargando" />
      ) : null}

      {bandeja.estadoCarga === "error" ? (
        <EstadosBandeja estado="error" onReintentar={bandeja.reintentar} />
      ) : null}

      {bandeja.estadoCarga === "listo" && bandeja.totalArchivo === 0 ? (
        <EstadosBandeja estado="vacio" />
      ) : null}

      {conArchivo && bandeja.reportes.length === 0 ? (
        <EstadosBandeja
          estado="sin_resultados"
          onLimpiar={bandeja.limpiarFiltros}
        />
      ) : null}

      {conResultados ? (
        <>
          <TablaReportes
            reportes={bandeja.reportes}
            ruta="/reportes/"
            enviando={envio.enviando}
            onEnviar={puedeEnviar ? envio.enviar : undefined}
            onLiberar={esAdmin ? manejarLiberarReporte : undefined}
            liberandoNumero={liberandoNumero}
          />
          <ListaTarjetas
            reportes={bandeja.reportes}
            enviando={envio.enviando}
            onEnviar={puedeEnviar ? envio.enviar : undefined}
          />
        </>
      ) : null}
    </div>
  );
}
