/**
 * Responsabilidad: identificar al usuario que firma las revisiones en el
 * prototipo.
 * Existe para que la auditoría de cada campo (quién y cuándo) sea visible desde
 * ahora. Cuando exista autenticación, este valor se reemplaza por la sesión real.
 *
 * TODO(auth): tomar el usuario del proveedor de identidad de RP-TECH.
 */

export interface UsuarioActual {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
}

export const USUARIO_ACTUAL: UsuarioActual = {
  id: "tecnico-demo",
  nombre: "Téc. Daniel Rivas",
  iniciales: "DR",
  rol: "Revisión técnica",
};
