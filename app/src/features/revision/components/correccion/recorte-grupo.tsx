/**
 * Responsabilidad: mostrar como evidencia un solo recorte del escaneo que abarca
 * todos los campos de una tarjeta agrupada.
 * Existe porque lo que el técnico compara contra el papel es la tabla o la fila
 * completa, no cuatro tiras sueltas; reutiliza `RecorteEscaneo` y `HojaEscaneada`
 * tal como están, solo cambia la región que se les pasa.
 */

import { HojaEscaneada } from "@/features/revision/components/escaneo/hoja-escaneada";
import { RecorteEscaneo } from "@/features/revision/components/escaneo/recorte";
import { calcularRecorte, unirRegiones } from "@/features/revision/lib/recorte";
import type {
    CampoVista,
    ReporteVista,
} from "@/features/revision/types/dominio";

interface RecorteGrupoProps {
    reporte: ReporteVista;
    campos: readonly CampoVista[];
    /** Altura máxima del recorte en rem; el ancho sale de la proporción de la región. */
    alturaMaxRem?: number;
}

export function RecorteGrupo({
    reporte,
    campos,
    alturaMaxRem = 7,
}: RecorteGrupoProps) {
    const region = unirRegiones(campos.map((campo) => campo.region));
    if (!region) return null;

    const padding = 0.012;
    let aspecto: number;
    try {
        aspecto = calcularRecorte(region, reporte.mapa, { padding }).aspecto_ventana;
    } catch {
        // Una región inválida no debe tumbar la tarjeta: se revisa sin evidencia.
        return null;
    }

    return (
        // El recorte es evidencia visual; el valor ya está escrito en texto en la tarjeta.
        <div
            aria-hidden="true"
            className="overflow-hidden rounded-xs border border-line bg-paper"
            style={{ width: `min(100%, ${(alturaMaxRem * aspecto).toFixed(2)}rem)` }}
        >
            <RecorteEscaneo mapa={reporte.mapa} region={region} padding={padding}>
                <HojaEscaneada
                    mapa={reporte.mapa}
                    pagina={region.pagina}
                    reporte={reporte}
                    className="h-full w-full"
                />
            </RecorteEscaneo>
        </div>
    );
}
