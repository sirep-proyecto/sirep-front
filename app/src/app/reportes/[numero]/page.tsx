/**
 * Responsabilidad: página de servidor para la ruta `/reportes/[numero]`.
 * Desempaqueta `params.numero` y envuelve la vista en Suspense con el esqueleto
 * de carga, garantizando un render sin bloqueos de prerendering en Next.js.
 */

import { Suspense } from "react";
import { CargandoRevision } from "@/features/revision/components/correccion/estados-revision";
import { VistaCorreccion } from "@/features/revision/components/correccion/vista-correccion";

interface PaginaReporteProps {
  params: Promise<{ numero: string }>;
}

export default async function PaginaReporte({ params }: PaginaReporteProps) {
  const { numero } = await params;

  return (
    <Suspense fallback={<CargandoRevision />}>
      <VistaCorreccion numero={numero} />
    </Suspense>
  );
}
