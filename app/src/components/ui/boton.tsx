/**
 * Responsabilidad: primitiva de botón con las variantes y tamaños que usa el
 * prototipo, con el mismo contrato de shadcn/ui.
 * Existe para que la acción primaria, la secundaria y la destructiva se vean
 * iguales en la bandeja y en la vista de corrección, y para que el tamaño
 * táctil de 44 px en móvil sea una decisión de un solo lugar.
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const variantes = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-colors duration-150 ease-[var(--ease-salida)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600",
  ],
  {
    variants: {
      variante: {
        primario: "bg-petrol-600 text-paper hover:bg-petrol-700",
        secundario:
          "border border-line-strong bg-raised text-ink hover:bg-sunken",
        fantasma: "text-muted hover:bg-sunken hover:text-ink",
        peligro: "bg-brick-600 text-paper hover:bg-brick-700",
        exito: "bg-green-600 text-paper hover:bg-green-700",
      },
      tamano: {
        sm: "h-8 px-3 text-meta",
        md: "h-9 px-4 text-body",
        lg: "h-11 px-5 text-base",
        icono: "size-9 p-0",
      },
    },
    defaultVariants: {
      variante: "primario",
      tamano: "md",
    },
  },
);

export interface BotonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantes> {}

export function Boton({ className, variante, tamano, ...props }: BotonProps) {
  return (
    <button
      type="button"
      {...props}
      className={twMerge(variantes({ variante, tamano }), className)}
    />
  );
}
