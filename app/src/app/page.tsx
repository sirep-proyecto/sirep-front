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
import { useEffect } from "react";

import { BotonSubirReportes } from "@/features/revision/components/subida/boton-subir-reportes";
import { ZonaSoltarPagina } from "@/features/revision/components/subida/zona-soltar-pagina";
import { useEnvioRptech } from "@/features/revision/hooks/use-envio-rptech";
import { useBandeja } from "@/features/revision/hooks/use-bandeja";
import { usePermiso } from "@/config/use-permiso";
import { useSubida } from "@/features/revision/providers/subida-contexto";

export default function PaginaBandeja() {
  const bandeja = useBandeja();
  const { estado: subida } = useSubida();
  const envio = useEnvioRptech(bandeja.refrescar);
  // El envío a RP-TECH es manual y solo para quien puede cerrar reportes
  // (el backend también lo exige en /reportes/:numero/importar e /importar-lote).
  const puedeEnviar = usePermiso("cerrar_reportes");

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
          Revisión técnica
        </p>
        <h1 className="text-display font-semibold tracking-tight text-ink">
          Bandeja de revisión
        </h1>
        <p className="mt-2 text-base text-muted">
          Reportes escaneados: el modelo lee el documento y solo lo dudoso
          espera tu revisión, junto al recorte del escaneo.
        </p>
      </header>
      <div className="pb-7">
        <BotonSubirReportes />
      </div>
      </div>

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
            onEnviarLote={puedeEnviar ? envio.enviarLote : undefined}
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
