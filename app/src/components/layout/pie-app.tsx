/**
 * Responsabilidad: pie global con el aviso de que el prototipo corre sobre
 * datos simulados.
 * Existe para que nadie confunda este entorno con producción mientras se
 * muestra a cliente o se capacita al taller.
 */

export function PieApp() {
  return (
    <footer className="border-t border-line bg-raised">
      <div className="mx-auto flex max-w-(--layout-max) flex-col gap-1 px-(--space-gutter) py-4 text-micro text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          SIREP · prototipo de bandeja de revisión con datos simulados · GO
          Service Latam
        </p>
        <p className="uppercase tracking-label">
          Ningún escaneo de este entorno contiene datos reales de clientes
        </p>
      </div>
    </footer>
  );
}
