import { Suspense } from "react";
import type { Metadata } from "next";
import { Archivo, Caveat, IBM_Plex_Mono } from "next/font/google";

import { CabeceraApp } from "@/components/layout/cabecera-app";
import { PieApp } from "@/components/layout/pie-app";
import { ProveedorRepositorio } from "@/features/revision/providers/repositorio-contexto";

import "./globals.css";

/*
 * Las tres familias del sistema: Archivo para la interfaz, IBM Plex Mono para
 * todo lo que se copia o se compara (N°, series, códigos) y Caveat únicamente
 * para la letra manuscrita del escaneo simulado. Los nombres de variable son
 * los que `tokens.css` ya espera.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SIREP · Bandeja de revisión",
    template: "%s · SIREP",
  },
  description:
    "Revisión de reportes técnicos escaneados: el modelo lee el documento y solo lo dudoso llega al técnico, junto al recorte del escaneo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${plexMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#contenido" className="salto-contenido">
          Saltar al contenido
        </a>
        <ProveedorRepositorio>
          <Suspense fallback={<div className="h-14 border-b border-line bg-paper" />}>
            <CabeceraApp />
          </Suspense>
          <main id="contenido" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <PieApp />
        </ProveedorRepositorio>
      </body>
    </html>
  );
}
