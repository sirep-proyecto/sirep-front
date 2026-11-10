# 🤝 Acta de Decisión de Esquema: Homologación `reportes` entre SIREP y RP-TECH (`SIREP-S2-T04`)

**Fecha:** 5 de noviembre de 2026  
**Participantes:**
- **Miguel Quijano** (Líder de Proyecto — SIREP)
- **Adrián Miranda** (Líder Técnico — RP-TECH)
- **Flavio** (Frontend SIREP — Insumo `docs/tabla-comparacion-rptech.md`)

**Estado:** Acordado con RP-TECH (Pendiente de visto bueno final del Coordinador en Etapa 3 para aplicar migración en producción de RP-TECH).

---

## 1. Contexto y Objetivo
De acuerdo con la decisión arquitectónica del proyecto, **SIREP no mantiene un esquema aislado de reportes**, sino que escribe sobre la tabla `public.reportes` de RP-TECH ampliada con los campos presentes en los talonarios físicos de GO Service Latam. Esto evita migrar cientos de registros históricos posteriormente.

Para esta reunión se revisó fila por fila el documento [`docs/tabla-comparacion-rptech.md`](../tabla-comparacion-rptech.md) (31 campos físicos del formulario frente a la Especificación v1 de RP-TECH).

---

## 2. Evaluación de la Propuesta de Entidades (`cliente`, `equipo`, `técnico`)

### Propuesta evaluada:
> *"Cliente, equipo y técnico se guardan como el texto leído y, además, con un vínculo opcional a los clientes, equipos y perfiles de RP-TECH, que se completa en la revisión."*

### Acuerdo con Adrián Miranda:
1. **Conservación del texto manuscrito leído (columnas `text`):**
   - En los reportes antiguos en papel (2023–2025), los nombres de empresas, modelos de equipos y técnicos suelen escribirse con abreviaturas (ej. `"Abregu"`, `"UV-2 cama plana"`, `"Antony"`) o hacer referencia a máquinas/clientes que aún no estaban dados de alta en el catálogo digital de RP-TECH.
   - Por ello, `cliente` (`text`), `serie_equipo` (`text`) y `tecnico_asignado` (`text`) **se guardan siempre con el texto extraído por la IA (o corregido en la bandeja)** para no bloquear la ingesta por Telegram cuando no exista coincidencia exacta de llave foránea.
2. **Vínculos opcionales (`nullable` UUIDs) hacia catálogos de RP-TECH:**
   - Se acuerda incorporar tres llaves foráneas opcionales (`on delete set null`) en la migración de integración con RP-TECH, las cuales pueden vincularse durante o después de la revisión humana en la bandeja:
     - `cliente_id uuid null references public.clientes(id)`
     - `equipo_id uuid null references public.equipos(id)`
     - `tecnico_perfil_id uuid null references public.perfiles(id)`
   - **Regla de negocio:** Para registros con `origen = 'historico'`, estas 3 llaves foráneas son `NULL` al momento de la captura por Telegram y se completan opcionalmente en la bandeja de revisión. Para registros con `origen = 'sistema'` (creados desde la app de RP-TECH), RP-TECH mantiene su validación habitual.

---

## 3. Acuerdo sobre Columnas de la Tabla `reportes`

### 3.1. Columnas de control del histórico (obligatorias para SIREP)
| Columna | Tipo SQL | Regla acordada |
| :--- | :--- | :--- |
| `origen` | `text not null default 'sistema' check (origen in ('historico', 'sistema'))` | Identifica si el reporte provino del archivo físico en papel (`historico`) o nació digitalmente en RP-TECH (`sistema`). |
| `escaneo_id` | `uuid null references public.escaneos(id) on delete set null` | Vincula el reporte con su archivo original sin comprimir en Storage y su huella `SHA-256`. |
| `numero_talonario` | `text null` (indexado) | N° impreso del talonario físico (ej. `000845`). Clave de búsqueda y detección de duplicados de negocio. |

### 3.2. Campos de RP-TECH que pasan a ser opcionales (`nullable`) para el histórico
Los siguientes campos exigidos en reportes digitales nuevos de RP-TECH **no existen en el formulario de papel** y quedan acordados como `nullable` cuando `origen = 'historico'`:
- `fotos_ingreso`
- `fotos_salida`
- `firmas_digitales_pad` (en papel se reemplaza por las banderas booleanas `firma_operador` y `firma_cliente`)
- `numero_caso_crm`

### 3.3. Campos del formulario físico que se agregan a `reportes`
Se acuerda que el formulario físico cuenta con **31 campos**, los cuales se persisten de la siguiente forma:
1. **Columnas dedicadas para consulta, filtrado y exportación directa:**
   - Ya existentes en RP-TECH: `cliente`, `fecha`, `serie_equipo`, `procedimiento`, `codigo_repuesto`, `tecnico_asignado`, `estado_reporte`.
   - Incorporadas en la migración `20261103000000_reportes_campos_formulario.sql`: `direccion`, `motivo`, `estado_equipo`, `conclusion`, `recomendaciones`, `hora_llegada`, `hora_salida`.
   - Columnas adicionales de detalle técnico acordadas para la migración definitiva en RP-TECH: `telefono`, `contacto`, `ultimo_mantenimiento`, `limpieza_equipo`, `cabezales`, `sistema_proteccion`, `tinta`, `revision_linea_ln`, `revision_linea_lt`, `revision_linea_nt`, `operador`, `repuestos_tipo`, `repuestos_descripcion`, `repuestos_cantidad`, `garantia`, `facturado`, `firma_operador`, `firma_cliente`.
2. **Trazabilidad y auditoría de revisión campo por campo (`campos_extraidos` y `campos_dudosos`):**
   - `campos_extraidos jsonb`: Guarda por cada uno de los 31 campos el valor original leído por el modelo (`valor`), su nivel de `confianza` (`alta`, `media`, `baja`), la bandera `noLeido`, las coordenadas `caja` y el sub-objeto `revision` (`estado`, `valor_corregido`, `revisado_por`, `revisado_en`, `corregido_por`, `corregido_en`), garantizando que **nunca se sobrescriba lo que leyó el modelo**.
   - `campos_dudosos text[]`: Lista de claves pendientes de revisión humana para alimentar la bandeja de forma inmediata.

---

## 4. Cómo se Aplican los Cambios
1. En el repositorio de **SIREP** (`sirep-back`), el esquema base y las columnas de consulta operan mediante las migraciones versionadas en `supabase/migrations/` (100% reproducibles con `supabase db reset`).
2. Una vez aprobada esta acta por el coordinador en la **Etapa 3 (Decisión)**, se enviará el Pull Request con la migración SQL al repositorio de **RP-TECH**, revisada por Adrián Miranda.
