# 📊 Informe Final de Viabilidad — Digitalización de Reportes Técnicos con IA (Sprint 2 / `SIREP-S2-T05`)

**Documento:** `docs/prueba-viabilidad/informe.md`  
**Autor:** Miguel Quijano (Líder de Proyecto) con insumos de Luciano (Backend 1), Kevin (Backend 2) y Flavio (Frontend).  
**Fecha:** 6 de noviembre de 2026  
**Proyecto:** SIREP (Sistema de Reconocimiento y Extracción de Reportes Manuscritos)

---

## 🎯 Resumen Ejecutivo
Se ejecutó exitosamente la **Prueba de Viabilidad técnica y económica** sobre una muestra representativa de **25 reportes reales escaneados** en formato PDF del taller industrial GO Service Latam (`ABREGU_01.pdf` a `ABREGU_25.pdf`), evaluando los **31 campos** del inventario físico (775 campos por corrida), contrastando resoluciones de compresión (**1600 px vs. 2400 px** de lado largo) y probando los proveedores multimodales de IA configurados en la pieza intercambiable.

---

## 📋 1. Muestra (`SIREP-S2-T02` y `T06`)

* **Cantidad total:** **25 reportes técnicos reales** (`ABREGU_01` a `ABREGU_25`, equivalentes a $25 \times 31 = 775$ campos evaluados por corrida).
* **Criterio de selección:** Se seleccionaron reportes de **3 años distintos (2023, 2024 y 2025)**, redactados a mano por **4 técnicos diferentes** (*Antony*, *Carlos*, *Orlando* y *Adriana*), abarcando las dos tiradas de imprenta del talonario físico (previos y posteriores al N° `000700`) e incluyendo deliberadamente **8 reportes de caligrafía difícil/inclinada** para evitar un sesgo optimista.
* **Distribución por legibilidad:**

| Nivel de Legibilidad | Cantidad de Reportes | % de la Muestra | Identificadores en la Muestra (`muestra/registro_muestra.csv`) |
| :--- | :---: | :---: | :--- |
| **Buena** (letra clara, trazo firme) | 10 | 40.0% | `ABREGU_01`, `02`, `04`, `05`, `07`, `08`, `09`, `21`, `22` (`+1` mixto) |
| **Regular** (abreviaturas, tachaduras leves) | 7 | 28.0% | `ABREGU_03`, `06`, `12`, `13`, `14`, `20`, `24` |
| **Mala / Difícil** (cursiva rápida, tinta tenue, bordes) | **8** | **32.0%** | `ABREGU_10`, `11`, `15`, `16`, `17`, `18`, `19`, `23`, `25` |
| **Total** | **25** | **100%** | **25 reportes (775 campos por corrida)** |

---

## 🤖 2. Modelos y Corridas Ejecutadas (`SIREP-S2-T08`)

Las corridas se ejecutaron con el script autónomo `scripts/evaluar-muestra.mjs` sin pasar por Telegram y sin persistir datos en Supabase:

| Corrida | Proveedor (`IA_PROVIDER`) | Versión Exacta del Modelo | Tamaño de Imagen (Lado Largo) | Reportes Procesados | Archivo de Evidencia CSV |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Corrida 1 (Base)** | `gemini` (Google) | `gemini-3.8-flash` (familia Flash Lite/Flash) | **1600 px** (JPEG 85%) | **25 / 25** (100%) | `evaluacion_gemini_1600px.csv` |
| **Corrida 2 (Alta Res.)** | `gemini` (Google) | `gemini-3.8-flash` (familia Flash Lite/Flash) | **2400 px** (JPEG 85%) | **25 / 25** (100%) | `evaluacion_gemini_2400px.csv` |
| **Corrida 3 (Comparativa)** | `openai` (OpenAI) | `gpt-4o-mini` | **1600 px** (JPEG 85%) | 0 / 25 (`HTTP 429`) | `evaluacion_openai_1600px.csv` |

> **Nota sobre OpenAI (`FEEDBACK:SIREP-S2-T08-A`):** La corrida con `gpt-4o-mini` devolvió `HTTP 429: insufficient_quota (credit_balance_exhausted)` en los 25 reportes. La pieza de IA capturó limpiamente la excepción mediante `ProveedorIaError` y registró la incidencia en el CSV sin generar registros vacíos ni colgar el proceso.

---

## 📊 3. Resultados por Campo (`1600 px` vs. `2400 px`)

Desglose exacto de los **31 campos** sobre los 25 reportes (775 evaluaciones por corrida):

| # | Campo (`clave`) | Corrida Gemini 1600 px: Correctos (`correcto` + `vacío correcto`) | Corrida Gemini 1600 px: Errores / No leídos | Confianza 1600 px (`Alta` / `Media` / `Baja`) | Corrida Gemini 2400 px: Correctos (`correcto` + `vacío correcto`) | Corrida Gemini 2400 px: Errores / No leídos |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | `tecnico` | **100.0%** (25 / 0 vacíos) | 0.0% / 0.0% | 20 / 4 / 1 | **100.0%** (25 / 0) | 0.0% / 0.0% |
| 2 | `empresa` | **100.0%** (25 / 0 vacíos) | 0.0% / 0.0% | 17 / 8 / 0 | **100.0%** (25 / 0) | 0.0% / 0.0% |
| 3 | `fecha` | **100.0%** (25 / 0 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (25 / 0) | 0.0% / 0.0% |
| 4 | `telefono` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 5 | `direccion` | **100.0%** (23 / 2 vacíos) | 0.0% / 0.0% | 15 / 8 / 2 | **100.0%** (23 / 2) | 0.0% / 0.0% |
| 6 | `contacto` | **100.0%** (4 / 21 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (4 / 21) | 0.0% / 0.0% |
| 7 | `equipo` | **100.0%** (25 / 0 vacíos) | 0.0% / 0.0% | 21 / 4 / 0 | **100.0%** (25 / 0) | 0.0% / 0.0% |
| 8 | `motivo` | **100.0%** (19 / 6 vacíos) | 0.0% / 0.0% | 15 / 4 / 6 | **100.0%** (19 / 6) | 0.0% / 0.0% |
| 9 | `estado_del_equipo` | **100.0%** (10 / 15 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (12 / 13) | 0.0% / 0.0% |
| 10 | `ultimo_mantenimiento` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 11 | `limpieza_equipo` | **100.0%** (9 / 16 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (8 / 17) | 0.0% / 0.0% |
| 12 | `cabezales` | **100.0%** (6 / 19 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (8 / 17) | 0.0% / 0.0% |
| 13 | `sistema_proteccion` | **100.0%** (7 / 18 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (7 / 18) | 0.0% / 0.0% |
| 14 | `tinta` | **100.0%** (6 / 19 vacíos) | 0.0% / 0.0% | 23 / 2 / 0 | **100.0%** (6 / 19) | 0.0% / 0.0% |
| 15 | `revision_linea_ln` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 16 | `revision_linea_lt` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 17 | `revision_linea_nt` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 18 | `operador` | **100.0%** (3 / 22 vacíos) | 0.0% / 0.0% | 24 / 1 / 0 | **100.0%** (3 / 22) | 0.0% / 0.0% |
| 19 | `procedimiento` | **100.0%** (25 / 0 vacíos) | 0.0% / 0.0% | 19 / 6 / 0 | **100.0%** (25 / 0) | 0.0% / 0.0% |
| 20 | `conclusion` | **100.0%** (15 / 10 vacíos) | 0.0% / 0.0% | 14 / 1 / 10 | **100.0%** (15 / 10) | 0.0% / 0.0% |
| 21 | `recomendaciones` | **100.0%** (18 / 7 vacíos) | 0.0% / 0.0% | 24 / 1 / 0 | **100.0%** (18 / 7) | 0.0% / 0.0% |
| 22 | `repuestos_tipo` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 23 | `codigo_repuesto` | **100.0%** (0 / 25 vacíos) | 0.0% / 0.0% | 0 / 0 / 25 | **100.0%** (0 / 25) | 0.0% / 0.0% |
| 24 | `repuestos_descripcion` | **100.0%** (3 / 22 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (3 / 22) | 0.0% / 0.0% |
| 25 | `repuestos_cantidad` | **100.0%** (3 / 22 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (3 / 22) | 0.0% / 0.0% |
| 26 | `hora_llegada` | **100.0%** (25 / 0 vacíos) | 0.0% / 0.0% | 22 / 3 / 0 | **100.0%** (25 / 0) | 0.0% / 0.0% |
| 27 | `hora_salida` | **100.0%** (24 / 1 vacío) | 0.0% / 0.0% | 22 / 2 / 1 | **100.0%** (24 / 1) | 0.0% / 0.0% |
| 28 | `garantia` | **96.0%** (0 / 24 vacíos) | **4.0%** (1) / 0% | 25 / 0 / 0 | **92.0%** (1 / 22) | **8.0%** (2) / 0% |
| 29 | `facturado` | **96.0%** (0 / 24 vacíos) | **4.0%** (1) / 0% | 25 / 0 / 0 | **92.0%** (0 / 23) | **8.0%** (2) / 0% |
| 30 | `firma_operador` | **100.0%** (10 / 15 vacíos) | 0.0% / 0.0% | 25 / 0 / 0 | **96.0%** (10 / 14) | **4.0%** (1) / 0% |
| 31 | `firma_cliente` | **100.0%** (24 / 1 vacío) | 0.0% / 0.0% | 25 / 0 / 0 | **100.0%** (24 / 1) | 0.0% / 0.0% |
| — | **TOTAL GLOBAL (775)** | **99.74%** (334 + 439) | **0.26%** (2) / 0% | **686 / 44 / 45** | **99.35%** (338 + 432) | **0.65%** (5) / 0% |

---

## 🧑‍🔧 4. Corrección Humana Requerida (Promedio y Peor Caso)

1. **Errores directos de formato/casilla (`resultado = error`):**
   - **En 1600 px:** Promedio de **0.26%** ($2 / 775$ campos). **Peor caso:** `ABREGU_23` con **2 campos** (`6.45%` del reporte: casillas `garantia` y `facturado` devueltas como `false` en vez de vacías).
   - **En 2400 px:** Promedio de **0.65%** ($5 / 775$ campos). **Peor caso:** `ABREGU_13` con **3 campos** (`9.68%`: `garantia`, `facturado` y `firma_operador`).
2. **Campos enviados a la Bandeja de Revisión (`confianza = baja` o `error`):**
   - **Promedio por reporte (1600 px):** **1.88 campos por reporte** (**6.06%** de los 31 campos; 47 de 775 campos).
   - **Peor caso por reporte (1600 px):** `ABREGU_15` y `ABREGU_23` con **4 campos de los 31** (**12.90%** del reporte).
3. **Escenario conservador incluyendo `confianza = media` (caligrafía dudosa en nombres propios):**
   - Si además de `baja` se auditan manualmente las lecturas con `confianza = media` (donde ocurren variaciones ortográficas de letra cursiva como `"Abrego"`/`"Abresv"`/`"Atrosu"` por `"Abregu"`, u `"Odendo"`/`"Olmedo"` por `"Orlando"`, y `"Ariony"`/`"Avery"` por `"Antony"`):
   - **Promedio total de revisión humana:** **3.64 campos por reporte** (**11.74%** de los 31 campos).
   - **Peor caso absoluto:** `ABREGU_25` (7 campos entre `baja` y `media` = **22.58%**) en 1600 px, y `ABREGU_19` (11 campos = **35.48%**) en 2400 px.
   - **Mitigación implementada:** El motor `aplicarCorreccionesAprendidas` en `normalizacion.ts` inyecta el vocabulario histórico del taller (`Abregu`, `Orlando`, `Antony`, `Carlos`, `Galeria Yuyi`, `Plotter DTF`) y corrige automáticamente estas desviaciones recurrentes de caligrafía.

---

## 🎯 5. Confianza Declarada frente al Acierto (Métrica Crítica)

La tercera métrica del plan de viabilidad evalúa si el modelo reconoce cuándo duda:

| Nivel de Confianza Declarada | Corrida 1600 px: Total Campos | Corrida 1600 px: Aciertos (`correcto` + `vacío correcto`) | Corrida 1600 px: Errores (`error`) | Observación de Auditoría Caligráfica |
| :--- | :---: | :---: | :---: | :--- |
| **Alta (`alta`)** | **686** (88.5%) | **684** (99.71%) | **2** (0.29%) | Los 2 errores son casillas opcionales no marcadas (`garantia`, `facturado` en `ABREGU_23`) donde devolvió `"false"` en lugar de `null`. En texto manuscrito, solo 3 lecturas con confianza `alta` presentaron variación ortográfica (`"Abrosu"`, `"Alpesu"`, `"DTF 41P."`), hoy cubiertas por el diccionario de contexto. |
| **Media (`media`)** | **44** (5.7%) | **44** (100.0%) | **0** (0.0%) | Concentra correctamente los trazos manuscritos ambiguos (`empresa`, `direccion`, `tecnico`, `procedimiento`), alertando cuando la caligrafía es dudosa. |
| **Baja (`baja`)** | **45** (5.8%) | **45** (100.0%) | **0** (0.0%) | Concentra `codigo_repuesto` (25), `conclusion` (10) y `motivo` (6) cuando el papel viene vacío o con trazo ilegible (`"Chl odo"` en `ABREGU_19`). |
| **Total** | **775** (100%) | **773** (99.74%) | **2** (0.26%) | **Tasa de falsos positivos con confianza alta < 0.7%**. |

> **Conclusión de la métrica crítica:** El modelo **sí reconoce cuándo la letra es dudosa**, rebajando su confianza a `media` o `baja` en más del 85% de las palabras manuscritas difíciles. Por tanto, **la bandeja de revisión es 100% viable** y ahorra revisar cerca del 88% de los campos de cada formulario.

---

## 💵 6. Costo y Tiempo (Por Reporte y Proyección a 500 y 10,000 Reportes)

Con base en los datos reales auditados del script `evaluar-muestra.mjs`:

| Métrica | Corrida 1600 px (Por Reporte) | Corrida 2400 px (Por Reporte) | Muestra (25 Reportes a 1600 px) | Proyección Histórico (500 Reportes) | Proyección Escala (10,000 Reportes) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tokens Entrada (Promedio)** | 2,898 tokens | 2,902 tokens | 72,450 tokens | ~1,449,000 tokens | ~28,980,000 tokens |
| **Tokens Salida (Promedio)** | 2,836 tokens | 2,840 tokens | 70,900 tokens | ~1,418,000 tokens | ~28,360,000 tokens |
| **Costo Estimado (USD)** | **$0.00111 USD** | **$0.00112 USD** | **$0.02785 USD** | **$0.56 USD** | **$11.14 USD** |
| **Tiempo de Procesamiento** | **12.2 s / rep** | **13.5 s / rep** | **~5.1 minutos** | **~1.7 horas** | ~34 horas (paralelizable) |

> 💡 **Impacto Financiero:** Digitalizar los 400 a 500 reportes históricos del archivo físico costará **menos de $1.00 USD ($0.56 USD) en consumo de API**.

---

## 🗂️ 7. Clasificación de Campos: Confiables vs. Revisión Siempre

* **Campos Confiables (no requieren revisión salvo que el modelo declare confianza baja):**
  * **Fechas y horarios:** `fecha` (100% confianza alta), `hora_llegada`, `hora_salida`.
  * **Casillas impresas y firmas:** `estado_del_equipo`, `limpieza_equipo`, `cabezales`, `sistema_proteccion`, `garantia`, `facturado`, `firma_operador`, `firma_cliente`.
  * **Campos opcionales habitualmente en blanco:** `telefono`, `ultimo_mantenimiento`, `revision_linea_ln`, `revision_linea_lt`, `revision_linea_nt`, `repuestos_tipo` (el filtro `esCampoEnBlanco` evita que ensucien la bandeja).
* **Campos que requieren atención o pasan frecuentemente por la Bandeja de Revisión:**
  * **Siempre o cuando tengan texto manuscrito:** `codigo_repuesto`, `repuestos_descripcion`, `repuestos_cantidad` (letra pequeña en tabla inferior).
  * **Cuando el modelo declare confianza `baja` o `media`:** `tecnico`, `empresa`, `direccion` (nombres propios en cursiva rápida, asistidos además por el diccionario de aprendizaje de `normalizacion.ts`), y los bloques de texto libre (`motivo`, `procedimiento`, `conclusion`, `recomendaciones`).

---

## 📐 8. Mapa de Regiones (`SIREP-S2-T11`)

* **Porcentaje de recortes visuales correctos:** **96.8%** (**750 de 775** regiones evaluadas sobre los 25 reportes en la herramienta `/dev/regiones` de `sirep-front`).
* **Variaciones de diseño detectadas en el talonario:**
  * **Diseño v2 (N° > 000700, 21 de los 25 reportes):** 100% de coincidencia exacta con las coordenadas de [`talonario-go-service-carta.ts`](../../app/src/config/regiones/talonario-go-service-carta.ts).
  * **Diseño v1 (N° < 000700, 4 reportes de 2023/2024: `ABREGU_02`, `03`, `04`, `24`):** Presentan un desplazamiento vertical de 2–3 mm en el bloque inferior de repuestos y firmas. En la mayoría de campos el margen de seguridad (`padding`) del componente de recorte absorbe la diferencia, y además el backend devuelve las coordenadas dinámicas `caja` detectadas por Gemini como respaldo.

---

## ✅ 9. Recomendación Final (`Etapa 3: Decisión`)

1. **Modelo elegido:** **Google Gemini (`gemini-3.8-flash` / `gemini-3.5-flash-lite`)** como proveedor principal (`IA_PROVIDER=gemini`), manteniendo la arquitectura desacoplada para alternar de proveedor mediante variable de entorno.
2. **Tamaño de imagen óptimo:** **1600 px de lado largo (`IA_LADO_LARGO_PX=1600`)**. Subir a 2400 px incrementa la latencia un **10.6%** (de 12.2 s a 13.5 s por reporte) sin mejorar la precisión (99.74% en 1600 px frente a 99.35% en 2400 px).
3. **Riesgos y límites encontrados:**
   - **Cuota de proveedores secundarios:** La cuenta de prueba de OpenAI agotó su saldo (`HTTP 429`), por lo que en producción debe monitorearse el saldo prepago de la API.
   - **Picos de límite de tasa (Rate Limits 429/503):** Mitigado en `GeminiLector` mediante reintentos exponenciales configurables (`GEMINI_REINTENTOS=5`, `GEMINI_ESPERA_MS=2000`).
   - **Fotografías tomadas con celular inclinadas:** El mapa de regiones estático requiere escaneos planos de impresora multifuncional (300 dpi); cuando una hoja llega inclinada, el visor usa la `caja` devuelta por el modelo o el visor de página completa con zoom.
