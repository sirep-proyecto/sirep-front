# 📋 Inventario del Formulario Físico sobre 5 Reportes Escaneados (`Día 1 — Frontend`)

**Documento:** `docs/inventario-formulario-fisico.md`  
**Autor:** Flavio (Frontend)  
**Fuente de verdad en código:**
- Frontend: [`sirep-front/app/src/config/campos-formulario.ts`](../app/src/config/campos-formulario.ts)
- Backend: `sirep-back/src/escaneos/campos-formulario.ts`

---

## 1. Muestra Inicial de 5 Reportes Analizados
Para levantar el inventario físico se inspeccionaron 5 reportes escaneados representativos del talonario **"Reporte Técnico — GO Service Latam"** (`ABREGU_01`, `ABREGU_02`, `ABREGU_08`, `ABREGU_12` y `ABREGU_20`), identificando cada casilla, línea, tabla, firma y sello impreso en la hoja tamaño Carta ($1275 \times 1650\text{ px}$ a 150 dpi).

---

## 2. Tabla de Inventario de los 31 Campos del Papel

| # | Sección del Papel | Clave (`id` / `clave`) | Etiqueta Impresa en el Papel | Elemento Físico | Tipo de Dato | Frecuencia en los 5 Reportes | ¿Suele venir Lleno o Vacío? (`opcional`) |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **1. Identificación** | `tecnico` | `TECNICO:` | Línea manuscrita | `texto` | 5 / 5 (100%) | **Suele venir lleno** (`opcional: false`) |
| 2 | **1. Identificación** | `empresa` | `EMPRESA:` | Línea manuscrita | `texto` | 5 / 5 (100%) | **Suele venir lleno** (`opcional: false`) |
| 3 | **1. Identificación** | `fecha` | `FECHA:` | Casillero de fecha | `fecha` (`AAAA-MM-DD`) | 5 / 5 (100%) | **Suele venir lleno** (`opcional: false`) |
| 4 | **1. Identificación** | `telefono` | `TELF:` | Casillero numérico corto | `codigo` / `texto` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 5 | **1. Identificación** | | `N° 000XXX` (Talonario) | Sello/impreso tipográfico rojo | `numero_reporte` | 5 / 5 (100%) | **Siempre impreso** (cabecera superior derecha) |
| 6 | **1. Identificación** | `direccion` | `DIRECCION:` | Línea manuscrita | `texto` | 5 / 5 (100%) | **Suele venir lleno** (`opcional: false`) |
| 7 | **1. Identificación** | `contacto` | `CONTACTO:` | Línea manuscrita | `texto` | 1 / 5 (20%) | **Suele venir vacío** (`opcional: true`) |
| 8 | **2. Equipo y motivo** | `equipo` | `EQUIPO:` | Línea manuscrita | `texto` | 5 / 5 (100%) | **Suele venir lleno** (marcado `opcional: true` por seguridad en hojas reversas) |
| 9 | **2. Equipo y motivo** | `motivo` | `MOTIVO:` | Línea manuscrita | `texto` | 4 / 5 (80%) | **Frecuentemente lleno, a veces vacío** (`opcional: true`) |
| 10 | **3. Revisión inicial** | `estado_del_equipo` | `ESTADO DEL EQUIPO` | Casillas `☐ Operativo ☐ Inoperativo` | `opcion` | 3 / 5 (60%) | **Mixto (a veces sin marcar)** (`opcional: true`) |
| 11 | **3. Revisión inicial** | `ultimo_mantenimiento` | `ULTIMO MANT.` | Casillero corto | `texto` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 12 | **3. Revisión inicial** | `limpieza_equipo` | `LIMPIEZA DEL EQUIPO` | Casillas `☐ Limpio ☐ Sucio` | `opcion` | 3 / 5 (60%) | **Mixto (a veces sin marcar)** (`opcional: true`) |
| 13 | **3. Revisión inicial** | `cabezales` | `CABEZALES` | Casillas `☐ Bueno ☐ Regular ☐ Malo` | `opcion` | 2 / 5 (40%) | **Suele venir vacío** (`opcional: true`) |
| 14 | **3. Revisión inicial** | `sistema_proteccion` | `SIST. DE PROTECCION` | Casillas `☐ Estab. ☐ UPS` + cuadro | `texto` | 2 / 5 (40%) | **Suele venir vacío** (`opcional: true`) |
| 15 | **3. Revisión inicial** | `tinta` | `TINTA` | Casillero corto | `texto` | 1 / 5 (20%) | **Suele venir vacío** (`opcional: true`) |
| 16 | **3. Revisión inicial** | `revision_linea_ln` | `REVISION DE LINEAS: L+N` | Casillero de voltaje | `codigo` / `texto` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 17 | **3. Revisión inicial** | `revision_linea_lt` | `REVISION DE LINEAS: L+T` | Casillero de voltaje | `codigo` / `texto` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 18 | **3. Revisión inicial** | `revision_linea_nt` | `REVISION DE LINEAS: N+T` | Casillero de voltaje | `codigo` / `texto` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 19 | **3. Revisión inicial** | `operador` | `OPERADOR:` | Línea manuscrita | `texto` | 1 / 5 (20%) | **Suele venir vacío** (`opcional: true`) |
| 20 | **4. Servicio realizado** | `procedimiento` | `PROCEDIMIENTO:` | Recuadro grande de 7 renglones | `multilinea` / `texto` | 5 / 5 (100%) | **Siempre lleno** (`opcional: false`) |
| 21 | **4. Servicio realizado** | `conclusion` | `CONCLUSION:` | Recuadro de 2 renglones | `multilinea` / `texto` | 4 / 5 (80%) | **Frecuentemente lleno, a veces vacío** (`opcional: true`) |
| 22 | **4. Servicio realizado** | `recomendaciones` | `RECOMENDACIONES:` | Recuadro de 2 renglones | `multilinea` / `texto` | 4 / 5 (80%) | **Frecuentemente lleno, a veces vacío** (`opcional: true`) |
| 23 | **5. Repuestos** | `repuestos_tipo` | `REPUESTOS REQUERIDOS` | Casillas `☐ Venta ☐ Descarte ☐ Garantía` | `opcion` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 24 | **5. Repuestos** | `codigo_repuesto` | `CODIGO` | Columna 1 de tabla (4 filas) | `codigo` / `texto` | 0 / 5 (0%) | **Suele venir vacío** (`opcional: true`) |
| 25 | **5. Repuestos** | `repuestos_descripcion` | `DESCRIPCION` | Columna 2 de tabla (4 filas) | `multilinea` / `texto` | 2 / 5 (40%) | **Suele venir vacío** (`opcional: true`) |
| 26 | **5. Repuestos** | `repuestos_cantidad` | `CANT.` | Columna 3 de tabla (4 filas) | `codigo` / `texto` | 2 / 5 (40%) | **Suele venir vacío** (`opcional: true`) |
| 27 | **6. Cierre de la visita** | `hora_llegada` | `Hora de llegada cliente` | Casillero de hora | `hora` (`HH:MM`) | 5 / 5 (100%) | **Siempre lleno** (`opcional: false`) |
| 28 | **6. Cierre de la visita** | `hora_salida` | `Hora de salida cliente` | Casillero de hora | `hora` (`HH:MM`) | 5 / 5 (100%) | **Suele venir lleno** (`opcional: false`) |
| 29 | **6. Cierre de la visita** | `garantia` | `GARANTIA` | Casilla booleana `☐` | `casilla` (`boolean`) | 0 / 5 (0%) | **Suele venir vacío/sin marcar** (`opcional: true`) |
| 30 | **6. Cierre de la visita** | `facturado` | `FACTURADO` | Casilla booleana `☐` | `casilla` (`boolean`) | 0 / 5 (0%) | **Suele venir vacío/sin marcar** (`opcional: true`) |
| 31 | **6. Cierre de la visita** | `firma_operador` | `Firma del Operador del Equipo` | Línea de firma / rúbrica | `firma` (`boolean`) | 2 / 5 (40%) | **Mixto (a veces sin firmar)** (`opcional: true`) |
| 32 | **6. Cierre de la visita** | `firma_cliente` | `Firma del Cliente o Administrador` | Línea de firma / sello | `firma` (`boolean`) | 5 / 5 (100%) | **Suele venir firmado** (`opcional: true` por si falta en reverso) |
