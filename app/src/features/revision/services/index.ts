/**
 * Responsabilidad: punto único donde se elige la implementación del
 * repositorio de reportes.
 * Existe para que migrar a Supabase sea un cambio en este archivo: se agrega
 * `repositorio-supabase.ts` cumpliendo `RepositorioReportes` y se cambia la
 * fábrica. Los componentes siguen recibiendo el mismo objeto por contexto.
 *
 * TODO(supabase): implementar `RepositorioReportes` contra la tabla de
 * reportes y reemplazar la fábrica de acá.
 */

import type { RepositorioReportes } from "@/features/revision/types/dominio";

import { crearRepositorioSimulado } from "./repositorio-simulado";

export { ErrorRepositorio } from "./errores";

export function crearRepositorio(): RepositorioReportes {
  return crearRepositorioSimulado();
}
