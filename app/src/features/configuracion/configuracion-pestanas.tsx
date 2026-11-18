/**
 * Responsabilidad: pestañas de la página de Configuración. "Bot de Telegram" lo
 * ve toda cuenta; "Usuarios y accesos", "Lectura con IA" y "Actividad" solo el
 * administrador principal (el único con el permiso gestionar_usuarios).
 */

"use client";

import { useState } from "react";
import { History, Send, Sparkles, Users } from "lucide-react";

import { usePermiso } from "@/config/use-permiso";

import { ConfiguracionActividad } from "./configuracion-actividad";
import { ConfiguracionBot } from "./configuracion-bot";
import { ConfiguracionIa } from "./configuracion-ia";
import { ConfiguracionUsuarios } from "./configuracion-usuarios";

type Pestana = "bot" | "usuarios" | "ia" | "actividad";

export function ConfiguracionPestanas() {
  const puedeGestionarUsuarios = usePermiso("gestionar_usuarios");
  const [elegida, setElegida] = useState<Pestana>("bot");
  const activa: Pestana = elegida !== "bot" && !puedeGestionarUsuarios ? "bot" : elegida;

  const pestanas: { id: Pestana; etiqueta: string; Icono: typeof Send }[] = [
    { id: "bot", etiqueta: "Bot de Telegram", Icono: Send },
    ...(puedeGestionarUsuarios
      ? [
          { id: "usuarios" as const, etiqueta: "Usuarios y accesos", Icono: Users },
          { id: "ia" as const, etiqueta: "Lectura con IA", Icono: Sparkles },
          { id: "actividad" as const, etiqueta: "Actividad", Icono: History },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      {pestanas.length > 1 ? (
        <div role="tablist" aria-label="Secciones de configuración" className="flex gap-1 overflow-x-auto border-b border-line">
          {pestanas.map(({ id, etiqueta, Icono }) => {
            const seleccionada = id === activa;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`pestana-${id}`}
                aria-selected={seleccionada}
                aria-controls={`panel-${id}`}
                onClick={(e) => {
                  setElegida(id);
                  // En celular las pestañas no entran todas: se desliza para que la elegida quede a la vista
                  e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
                }}
                className={[
                  "-mb-px flex h-10 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 text-meta font-medium whitespace-nowrap",
                  "transition-colors duration-150 ease-[var(--ease-salida)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-petrol-600",
                  seleccionada
                    ? "border-petrol-600 text-petrol-700"
                    : "border-transparent text-muted hover:text-ink",
                ].join(" ")}
              >
                <Icono className="size-4" aria-hidden="true" />
                {etiqueta}
              </button>
            );
          })}
        </div>
      ) : null}

      <div role="tabpanel" id={`panel-${activa}`} aria-labelledby={`pestana-${activa}`}>
        {activa === "bot" ? <ConfiguracionBot /> : null}
        {activa === "usuarios" ? <ConfiguracionUsuarios /> : null}
        {activa === "ia" ? <ConfiguracionIa /> : null}
        {activa === "actividad" ? <ConfiguracionActividad /> : null}
      </div>
    </div>
  );
}
