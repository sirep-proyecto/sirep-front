/**
 * Responsabilidad: una fila de la cola de subida —archivo, estado y acciones—.
 * Existe para que cada estado (espera, leyendo, listo, duplicado, error) tenga
 * su propio tratamiento visual y su propio texto, con el estado anunciado por
 * `aria-live` sin exigir que la persona mire la fila.
 */

import Link from "next/link";
import {
  AlertTriangle,
  Check,
  FileImage,
  FileText,
  Loader2,
  X,
} from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";
import { formatearNumeroReporte, pluralizar } from "@/features/revision/lib/formato";
import {
  numeroDetectado,
  textoDudas,
  textoDuplicado,
} from "@/features/revision/lib/subida/respuesta";
import type { ItemSubida } from "@/features/revision/lib/subida/tipos";
import { formatearTamano } from "@/features/revision/lib/subida/validacion";

interface FilaSubidaProps {
  item: ItemSubida;
  onQuitar: (id: string) => void;
  onReintentar: (id: string) => void;
  onCambioNumero: (id: string, valor: string) => void;
  /** Cierra el panel al navegar a un reporte. */
  onNavegar: () => void;
}

function descripcion(item: ItemSubida): string {
  const tipo =
    item.tipo === "pdf" ? "PDF" : item.tipo === "imagen" ? "foto" : "archivo";
  const paginas = item.resultado?.totalPaginas;
  const partes = [
    paginas ? pluralizar(paginas, "página", "páginas") : tipo,
    formatearTamano(item.tamano),
  ];
  return partes.join(" · ");
}

const ESTILO_FILA: Record<ItemSubida["estado"], string> = {
  espera: "border-line bg-raised",
  validando: "border-petrol-200 bg-raised",
  subiendo: "border-petrol-200 bg-raised",
  leyendo: "border-petrol-200 bg-raised",
  listo: "border-green-200 bg-raised",
  duplicado: "border-amber-200 bg-amber-50",
  repetido: "border-amber-200 bg-amber-50",
  error: "border-brick-200 bg-brick-50",
};

function Estado({ item }: { item: ItemSubida }) {
  switch (item.estado) {
    case "espera":
      return (
        <span className="text-faint">
          En espera · se sube cuando termine el anterior
        </span>
      );
    case "validando":
      return (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Validando el archivo…
        </span>
      );
    case "subiendo":
      return (
        <span className="inline-flex items-center gap-1.5 text-petrol-700">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Subiendo… {Math.round(item.progreso * 100)} %
        </span>
      );
    case "leyendo":
      return (
        <span className="inline-flex items-center gap-1.5 text-petrol-700">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          La IA está leyendo el reporte…
        </span>
      );
    case "listo": {
      const numero = item.resultado ? numeroDetectado(item.resultado) : null;
      return (
        <span className="text-green-700">
          <Check className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
          Listo ·{" "}
          {numero ? (
            <span className="font-mono">{formatearNumeroReporte(numero)}</span>
          ) : (
            "sin N° detectado"
          )}{" "}
          · {textoDudas(item.resultado?.camposDudosos.length ?? 0)}
        </span>
      );
    }
    case "duplicado": {
      const { titulo, detalle } = textoDuplicado(item.duplicado ?? { codigo: "desconocido" });
      return (
        <span className="text-amber-700">
          <AlertTriangle className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
          {titulo}
          {detalle ? <span className="text-muted"> {detalle}</span> : null}
        </span>
      );
    }
    case "repetido":
      return (
        <span className="text-amber-700">
          <AlertTriangle className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
          Repetido en esta subida
          <span className="text-muted"> · no se envía de nuevo</span>
        </span>
      );
    case "error":
      return (
        <span className="text-brick-700">
          <X className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
          {item.fallo?.mensaje ?? "No se pudo subir el archivo"}
        </span>
      );
  }
}

export function FilaSubida({
  item,
  onQuitar,
  onReintentar,
  onCambioNumero,
  onNavegar,
}: FilaSubidaProps) {
  const Icono = item.tipo === "imagen" ? FileImage : FileText;
  const numero = item.resultado ? numeroDetectado(item.resultado) : null;
  const numeroDuplicado = item.duplicado?.numeroReporte;
  const enCurso = item.estado === "subiendo" || item.estado === "leyendo";

  return (
    <li className={`rounded-lg border p-3 ${ESTILO_FILA[item.estado]}`}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-petrol-700 ring-1 ring-inset ring-line"
        >
          <Icono className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-ink" title={item.nombre}>
            {item.nombre}
          </p>
          <p className="text-meta text-muted">{descripcion(item)}</p>
          <p aria-live="polite" className="mt-1 text-meta">
            <Estado item={item} />
          </p>

          {enCurso ? (
            <div
              role="progressbar"
              aria-label={`Avance de ${item.nombre}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.estado === "subiendo" ? Math.round(item.progreso * 100) : undefined}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken"
            >
              <div
                className={`h-full rounded-full bg-petrol-600 transition-[width] duration-200 ${
                  item.estado === "leyendo" ? "w-full animate-pulse" : ""
                }`}
                style={
                  item.estado === "subiendo"
                    ? { width: `${Math.round(item.progreso * 100)}%` }
                    : undefined
                }
              />
            </div>
          ) : null}

          {item.estado === "espera" ? (
            <label className="mt-2 flex flex-col gap-1 text-micro text-faint">
              N° del talonario (opcional)
              <Entrada
                value={item.numeroManual}
                onChange={(evento) => onCambioNumero(item.id, evento.target.value)}
                placeholder="N° 000…"
                maxLength={20}
                autoComplete="off"
                className="h-8 max-w-48 font-mono text-meta"
              />
            </label>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {item.estado === "listo" ? (
            <Link
              href={numero ? `/reportes/${encodeURIComponent(numero)}` : "/"}
              onClick={onNavegar}
              className="inline-flex h-8 items-center rounded-md border border-line-strong bg-raised px-3 text-meta font-medium text-ink shadow-xs hover:border-petrol-600/40 hover:bg-petrol-50 hover:text-petrol-700"
            >
              {numero ? "Revisar →" : "Ver en la bandeja →"}
            </Link>
          ) : null}
          {item.estado === "duplicado" && numeroDuplicado ? (
            <Link
              href={`/reportes/${encodeURIComponent(numeroDuplicado)}`}
              onClick={onNavegar}
              className="inline-flex h-8 items-center rounded-md border border-line-strong bg-raised px-3 text-meta font-medium text-ink shadow-xs hover:border-petrol-600/40 hover:bg-petrol-50 hover:text-petrol-700"
            >
              Abrir el existente
            </Link>
          ) : null}
          {item.estado === "error" && item.fallo?.reintentable ? (
            <Boton variante="secundario" tamano="sm" onClick={() => onReintentar(item.id)}>
              Reintentar
            </Boton>
          ) : null}
          {item.estado === "espera" || item.estado === "error" || item.estado === "repetido" ? (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => onQuitar(item.id)}
              aria-label={`Quitar ${item.nombre}`}
            >
              Quitar
            </Boton>
          ) : null}
          {item.estado === "duplicado" ? (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => onQuitar(item.id)}
              aria-label={`Descartar ${item.nombre}`}
            >
              Descartar
            </Boton>
          ) : null}
        </div>
      </div>
    </li>
  );
}
