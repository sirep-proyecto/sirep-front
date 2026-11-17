/**
 * Responsabilidad: almacén de la cola de subida —guarda el estado, procesa los
 * archivos de a uno en orden y avisa a quien lo escuche—.
 * Existe fuera de React para que la subida sobreviva al cierre del panel (y a
 * la navegación) y para probar el recorrido completo con un envío falso: el
 * proveedor solo lo conecta a la pantalla con `useSyncExternalStore`.
 */

import { COLA_VACIA, reducirCola, siguienteEnEspera, type AccionCola } from "./cola";
import { crearItems } from "./cola";
import { clasificarFallo } from "./respuesta";
import type { EstadoCola, RespuestaUpload } from "./tipos";

export interface ParametrosEnvio {
  archivo: File;
  /** Solo si la persona escribió un N°; vacío no se manda. */
  numeroReporte?: string;
  alProgreso: (fraccion: number) => void;
  /** Se llama cuando termina el envío y empieza la espera de la IA. */
  alEnviado: () => void;
}

export interface DependenciasAlmacen {
  subir: (parametros: ParametrosEnvio) => Promise<RespuestaUpload>;
  calcularHuella: (archivo: File) => Promise<string | undefined>;
  generarId?: () => string;
}

export interface AlmacenSubida {
  obtener: () => EstadoCola;
  suscribir: (oyente: () => void) => () => void;
  agregar: (archivos: readonly File[]) => void;
  quitar: (id: string) => void;
  establecerNumero: (id: string, valor: string) => void;
  reintentar: (id: string) => void;
  limpiarTerminados: () => void;
  /** Se resuelve cuando la cola queda sin nada que procesar (útil en pruebas). */
  esperarFin: () => Promise<void>;
}

export function crearAlmacenSubida(dependencias: DependenciasAlmacen): AlmacenSubida {
  let contador = 0;
  const generarId = dependencias.generarId ?? (() => `subida-${(contador += 1)}`);

  let estado: EstadoCola = COLA_VACIA;
  const oyentes = new Set<() => void>();
  // Los `File` no entran al estado (que es solo datos): se guardan aparte.
  const archivos = new Map<string, File>();
  let procesando: Promise<void> | null = null;

  function despachar(accion: AccionCola) {
    const siguiente = reducirCola(estado, accion);
    if (siguiente === estado) return;
    estado = siguiente;
    oyentes.forEach((oyente) => oyente());
  }

  function buscar(id: string) {
    return estado.items.find((item) => item.id === id);
  }

  async function procesarUno(id: string) {
    const archivo = archivos.get(id);
    if (!archivo) return;

    despachar({ tipo: "validando", id });
    try {
      const huella = await dependencias.calcularHuella(archivo);
      if (huella) despachar({ tipo: "huella", id, huella });
    } catch {
      // Sin huella se sigue igual: el backend también detecta duplicados.
    }
    // La huella pudo marcarlo "repetido": entonces no se envía.
    if (buscar(id)?.estado !== "validando") return;

    const numero = buscar(id)?.numeroManual.trim();
    despachar({ tipo: "subiendo", id });
    try {
      const respuesta = await dependencias.subir({
        archivo,
        numeroReporte: numero ? numero : undefined,
        alProgreso: (fraccion) => despachar({ tipo: "progreso", id, fraccion }),
        alEnviado: () => despachar({ tipo: "leyendo", id }),
      });
      despachar({ tipo: "listo", id, respuesta });
    } catch (error) {
      const datos = error as { status?: unknown; data?: unknown };
      const status = typeof datos?.status === "number" ? datos.status : 0;
      const resultado = clasificarFallo(status, datos?.data);
      if (resultado.tipo === "duplicado") {
        despachar({ tipo: "duplicado", id, info: resultado.info });
      } else {
        despachar({ tipo: "fallo", id, fallo: resultado.fallo });
      }
    }
  }

  /** Bucle único: mientras haya alguien en espera, procesa el primero. */
  function arrancar() {
    if (procesando) return;
    procesando = (async () => {
      try {
        for (let siguiente = siguienteEnEspera(estado.items); siguiente; ) {
          await procesarUno(siguiente.id);
          siguiente = siguienteEnEspera(estado.items);
        }
      } finally {
        procesando = null;
      }
    })();
  }

  return {
    obtener: () => estado,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    agregar(nuevos) {
      if (nuevos.length === 0) return;
      const items = crearItems(
        nuevos.map((archivo) => ({
          nombre: archivo.name,
          tamano: archivo.size,
          mime: archivo.type,
          ultimaModificacion: archivo.lastModified,
        })),
        estado.items,
        generarId,
      );
      items.forEach((item, indice) => archivos.set(item.id, nuevos[indice]));
      despachar({ tipo: "agregar", items });
      arrancar();
    },
    quitar(id) {
      despachar({ tipo: "quitar", id });
      if (!buscar(id)) archivos.delete(id);
    },
    establecerNumero: (id, valor) => despachar({ tipo: "numero", id, valor }),
    reintentar(id) {
      despachar({ tipo: "reintentar", id });
      arrancar();
    },
    limpiarTerminados() {
      despachar({ tipo: "limpiar_terminados" });
      for (const id of [...archivos.keys()]) {
        if (!buscar(id)) archivos.delete(id);
      }
    },
    esperarFin: () => procesando ?? Promise.resolve(),
  };
}
