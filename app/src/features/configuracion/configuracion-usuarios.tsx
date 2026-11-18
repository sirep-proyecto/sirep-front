/**
 * Responsabilidad: pestaña "Usuarios y accesos" de Configuración. Un administrador
 * crea cuentas (revisor, operador o administrador) y activa o quita, cuenta por
 * cuenta, las acciones que pueden hacer: ver, editar, cerrar, subir, exportar, etc.
 * Reemplaza tener que agregar cada cuenta a las variables de entorno del servidor.
 */

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";
import { Insignia } from "@/components/ui/insignia";
import { obtenerUsuarioSesion } from "@/config/sesion";
import { refrescarSesionApi } from "@/lib/api";

import { mensajeDeError } from "./config-bot";
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  leerUsuarios,
  type CuentaUsuario,
  type ListadoUsuarios,
  type PermisoDefinicion,
  type RolDefinicion,
  type RolUsuario,
} from "./config-usuarios";

const CLASE_SELECT = [
  "h-9 w-full rounded-sm border border-line-strong bg-inset px-3",
  "text-base text-ink",
  "transition-colors duration-150 ease-[var(--ease-salida)]",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const fechaHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "Nunca";

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const tonoRol = (rol: string) => (rol === "admin" ? "amber" : rol === "supervisor" ? "petrol" : "neutral");

interface SelectorPermisosProps {
  permisos: PermisoDefinicion[];
  marcados: string[];
  esAdmin: boolean;
  deshabilitado: boolean;
  onCambio: (nuevos: string[]) => void;
}

function SelectorPermisos({ permisos, marcados, esAdmin, deshabilitado, onCambio }: SelectorPermisosProps) {
  const visibles = permisos.filter((p) => esAdmin || !p.soloAdmin);
  return (
    <fieldset className="min-w-0">
      <legend className="text-meta font-medium text-ink">Qué puede hacer</legend>
      {esAdmin ? (
        <p className="mt-1 text-micro text-muted">
          El administrador siempre puede hacer todo, incluido crear cuentas y cambiar accesos.
        </p>
      ) : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {visibles.map((permiso) => {
          const activo = esAdmin || marcados.includes(permiso.id);
          return (
            <label
              key={permiso.id}
              className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-sunken px-3 py-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70"
            >
              <input
                type="checkbox"
                checked={activo}
                disabled={esAdmin || deshabilitado}
                onChange={() =>
                  onCambio(activo ? marcados.filter((m) => m !== permiso.id) : [...marcados, permiso.id])
                }
                className="mt-0.5 size-4 shrink-0 accent-[var(--petrol-600)]"
              />
              <span className="min-w-0">
                <span className="block text-meta font-medium text-ink">{permiso.etiqueta}</span>
                <span className="block text-micro text-muted">{permiso.descripcion}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface EditorCuentaProps {
  catalogo: ListadoUsuarios["catalogo"];
  /** Sin cuenta es el formulario de una cuenta nueva. */
  cuenta?: CuentaUsuario;
  esPropia?: boolean;
  onGuardado: (aviso: string) => void;
  onCancelar: () => void;
}

function EditorCuenta({ catalogo, cuenta, esPropia = false, onGuardado, onCancelar }: EditorCuentaProps) {
  const nueva = !cuenta;
  const esCuentaAdmin = cuenta?.rol === "admin";
  const rolInicial: RolUsuario = cuenta?.rol ?? "supervisor";
  const porDefecto = (rol: RolUsuario) =>
    catalogo.roles.find((r: RolDefinicion) => r.id === rol)?.permisos_por_defecto ?? [];

  const [usuario, setUsuario] = useState(cuenta?.usuario ?? "");
  const [nombre, setNombre] = useState(cuenta?.nombre ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolUsuario>(rolInicial);
  const [permisos, setPermisos] = useState<string[]>(cuenta?.permisos ?? porDefecto(rolInicial));
  const [activo, setActivo] = useState(cuenta?.activo ?? true);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarRol(nuevo: RolUsuario) {
    setRol(nuevo);
    // Al cambiar de rol se parte de lo que ese rol trae; después se puede ajustar.
    setPermisos(porDefecto(nuevo).filter((p) => nuevo === "admin" || p !== "gestionar_usuarios"));
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTrabajando(true);
    setError(null);
    try {
      if (nueva) {
        const creada = await crearUsuario({ usuario: usuario.trim(), nombre: nombre.trim(), password, rol, permisos });
        onGuardado(`Cuenta "${creada.usuario}" creada. Ya puede iniciar sesión.`);
      } else {
        // La cuenta de administrador solo cambia de nombre y de contraseña.
        await actualizarUsuario(cuenta.id, {
          nombre: nombre.trim(),
          ...(esCuentaAdmin ? {} : { rol, permisos, activo }),
          ...(password ? { password } : {}),
        });
        onGuardado(`Cambios guardados en "${cuenta.usuario}".`);
      }
    } catch (e) {
      setError(mensajeDeError(e));
      setTrabajando(false);
    }
  }

  async function eliminar() {
    if (!cuenta) return;
    setTrabajando(true);
    setError(null);
    try {
      await eliminarUsuario(cuenta.id);
      onGuardado(`Cuenta "${cuenta.usuario}" eliminada.`);
    } catch (e) {
      setError(mensajeDeError(e));
      setTrabajando(false);
      setConfirmarEliminar(false);
    }
  }

  const idCampo = (campo: string) => `${campo}-${cuenta?.id ?? "nueva"}`;
  const valido =
    nombre.trim().length >= 2 && (nueva ? /^[a-zA-Z0-9._@-]{3,60}$/.test(usuario.trim()) && password.length >= 8 : password === "" || password.length >= 8);

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 border-t border-line bg-inset/40 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idCampo("usuario")} className="text-meta font-medium text-ink">
            Usuario
          </label>
          <Entrada
            id={idCampo("usuario")}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            disabled={!nueva || trabajando}
            autoComplete="off"
            spellCheck={false}
            placeholder="Ej. maria.lopez"
          />
          {nueva ? <p className="text-micro text-muted">Con este usuario inicia sesión. No se puede cambiar después.</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idCampo("nombre")} className="text-meta font-medium text-ink">
            Nombre visible
          </label>
          <Entrada
            id={idCampo("nombre")}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={trabajando}
            autoComplete="off"
            placeholder="Ej. María López"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idCampo("password")} className="text-meta font-medium text-ink">
            {nueva ? "Contraseña" : "Nueva contraseña"}
          </label>
          <Entrada
            id={idCampo("password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={trabajando}
            autoComplete="new-password"
            placeholder={nueva ? "Mínimo 8 caracteres" : "Déjala vacía para no cambiarla"}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idCampo("rol")} className="text-meta font-medium text-ink">
            Rol
          </label>
          <select
            id={idCampo("rol")}
            value={rol}
            onChange={(e) => cambiarRol(e.target.value as RolUsuario)}
            disabled={trabajando || esPropia || esCuentaAdmin}
            className={CLASE_SELECT}
          >
            {catalogo.roles.filter((r) => esCuentaAdmin || r.id !== "admin").map((r) => (
              <option key={r.id} value={r.id}>
                {r.etiqueta}
              </option>
            ))}
          </select>
          {esCuentaAdmin ? (
            <p className="text-micro text-muted">Es la única cuenta de administrador: no cambia de rol.</p>
          ) : null}
        </div>
      </div>

      <SelectorPermisos
        permisos={catalogo.permisos}
        marcados={permisos}
        esAdmin={rol === "admin"}
        deshabilitado={trabajando}
        onCambio={setPermisos}
      />

      {!nueva && !esCuentaAdmin ? (
        <label className="flex cursor-pointer items-center gap-2.5 text-meta text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <input
            type="checkbox"
            checked={activo}
            disabled={trabajando || esPropia}
            onChange={(e) => setActivo(e.target.checked)}
            className="size-4 accent-[var(--petrol-600)]"
          />
          Cuenta activa (si la desactivas, no puede entrar)
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" disabled={trabajando || !valido}>
          {trabajando ? "Guardando…" : nueva ? "Crear cuenta" : "Guardar cambios"}
        </Boton>
        <Boton type="button" variante="fantasma" onClick={onCancelar} disabled={trabajando}>
          Cancelar
        </Boton>
        {!nueva && !esPropia && !esCuentaAdmin ? (
          confirmarEliminar ? (
            <span className="ml-auto flex flex-wrap items-center gap-2">
              <span className="text-meta text-ink">¿Eliminar esta cuenta?</span>
              <Boton type="button" variante="peligro" tamano="sm" onClick={() => void eliminar()} disabled={trabajando}>
                Sí, eliminar
              </Boton>
              <Boton type="button" variante="fantasma" tamano="sm" onClick={() => setConfirmarEliminar(false)} disabled={trabajando}>
                No
              </Boton>
            </span>
          ) : (
            <Boton
              type="button"
              variante="fantasma"
              onClick={() => setConfirmarEliminar(true)}
              disabled={trabajando}
              className="ml-auto text-brick-700"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </Boton>
          )
        ) : null}
      </div>
    </form>
  );
}

export function ConfiguracionUsuarios() {
  const [datos, setDatos] = useState<ListadoUsuarios | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | "nueva" | null>(null);
  const miId = obtenerUsuarioSesion()?.id;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await leerUsuarios());
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

  async function alGuardar(mensaje: string) {
    setAbierto(null);
    setAviso(mensaje);
    await cargar();
    // Si el administrador cambió algo de su propia cuenta, su sesión se pone al día.
    void refrescarSesionApi();
  }

  return (
    <div className="flex flex-col gap-5">
      {aviso ? (
        <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-meta text-green-700">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {aviso}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-meta text-brick-700">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-line bg-raised shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Cuentas de SIREP</h2>
            <p className="mt-1 text-meta text-muted">
              Crea cuentas y decide qué puede hacer cada una. Los cambios se aplican en segundos, sin reiniciar nada.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Boton variante="fantasma" tamano="sm" onClick={() => void cargar()} disabled={cargando} className="text-petrol-700">
              <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} aria-hidden="true" />
              Actualizar
            </Boton>
            {datos ? (
              <Boton
                onClick={() => {
                  setAviso(null);
                  setAbierto(abierto === "nueva" ? null : "nueva");
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Nueva cuenta
              </Boton>
            ) : null}
          </div>
        </div>

        {datos && abierto === "nueva" ? (
          <EditorCuenta catalogo={datos.catalogo} onGuardado={alGuardar} onCancelar={() => setAbierto(null)} />
        ) : null}

        {cargando && !datos ? <p className="border-t border-line px-5 py-4 text-meta text-muted">Cargando cuentas…</p> : null}

        {datos && datos.cuentas.length === 0 ? (
          <p className="border-t border-line px-5 py-4 text-meta text-muted">
            Aún no hay cuentas. Usa &ldquo;Nueva cuenta&rdquo; para crear la primera.
          </p>
        ) : null}

        <ul>
          {datos?.cuentas.map((cuenta) => {
            const propia = cuenta.id === miId;
            const abiertaEsta = abierto === cuenta.id;
            return (
              <li key={cuenta.id} className="border-t border-line">
                <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-petrol-50 font-mono text-micro font-semibold text-petrol-700 ring-1 ring-inset ring-petrol-200"
                  >
                    {iniciales(cuenta.nombre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-ink">
                      {cuenta.nombre}
                      {propia ? <span className="ml-2 text-micro font-normal text-muted">(tú)</span> : null}
                    </p>
                    <p className="truncate font-mono text-micro text-muted">
                      {cuenta.usuario} · último acceso: {fechaHora(cuenta.ultimo_acceso)}
                    </p>
                  </div>
                  <Insignia tono={tonoRol(cuenta.rol)}>
                    {datos.catalogo.roles.find((r) => r.id === cuenta.rol)?.etiqueta ?? cuenta.rol}
                  </Insignia>
                  {cuenta.activo ? <Insignia tono="green">Activa</Insignia> : <Insignia tono="brick">Desactivada</Insignia>}
                  <span className="hidden text-micro text-muted lg:inline">
                    {cuenta.rol === "admin" ? "Todos los permisos" : `${cuenta.permisos.length} de ${datos.catalogo.permisos.length - 1} permisos`}
                  </span>
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    onClick={() => {
                      setAviso(null);
                      setAbierto(abiertaEsta ? null : cuenta.id);
                    }}
                    aria-expanded={abiertaEsta}
                  >
                    {abiertaEsta ? "Cerrar" : "Editar"}
                  </Boton>
                </div>
                {abiertaEsta ? (
                  <EditorCuenta
                    catalogo={datos.catalogo}
                    cuenta={cuenta}
                    esPropia={propia}
                    onGuardado={alGuardar}
                    onCancelar={() => setAbierto(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
