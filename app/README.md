# SIREP — bandeja de revisión (prototipo frontend)

Prototipo funcional de la bandeja de revisión de SIREP: bandeja de reportes, vista de
corrección con escaneo, calibración de regiones del talonario y datos simulados.
Solo frontend: sin backend, sin Supabase y sin llamadas de red reales.

## Frontend

### Cómo levantarlo

```bash
cd app
npm install
npm run dev        # http://localhost:3000
```

Scripts disponibles:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción (`next build`) |
| `npm run start` | Sirve el build ya compilado |
| `npm run lint` | ESLint sobre todo `src/` |
| `npm test` | Suite con Vitest (`npx vitest run`) |

Verificación mínima antes de entregar:

```bash
npx tsc --noEmit && npm run lint && npm test
```

### Estructura

```
src/
├── app/
│   ├── layout.tsx                     # fuentes, tokens, skip link, cabecera y pie
│   ├── page.tsx                       # bandeja
│   ├── reportes/[numero]/page.tsx     # vista de corrección
│   └── dev/regiones/page.tsx          # calibración de regiones (solo desarrollo)
├── components/
│   ├── ui/                            # primitivas con contrato de shadcn/ui
│   │   ├── boton.tsx  entrada.tsx  insignia.tsx  esqueleto.tsx
│   └── layout/
│       ├── cabecera-app.tsx  pie-app.tsx
├── features/revision/
│   ├── components/
│   │   ├── bandeja/                   # resumen, herramientas, tabla, tarjetas, estados
│   │   ├── correccion/                # visor, panel de campos, progreso, cierre
│   │   ├── escaneo/                   # hoja falsa, recorte, visor, resaltado
│   │   ├── calibracion/               # mapa de regiones y lista de cobertura
│   │   └── comunes/                   # etiquetas de estado/origen/confianza
│   ├── hooks/                         # use-bandeja, use-revision-reporte, use-atajos
│   ├── services/                      # contrato de repositorio + implementación simulada
│   ├── providers/                     # contexto React que inyecta el repositorio
│   ├── types/                         # dominio, campos y regiones (sin React)
│   └── lib/                           # funciones puras probadas
├── config/
│   ├── campos-formulario.ts           # inventario provisional de campos
│   ├── regiones/                      # un mapa por diseño de talonario
│   ├── escaneo-falso.ts               # dibujo SVG del escaneo inventado
│   ├── entorno.ts                     # guardas de pantallas de desarrollo
│   └── sesion.ts                      # usuario simulado (TODO: auth real)
├── mocks/
│   └── reportes.ts                    # 12 reportes simulados, incluido el 000845
└── styles/
    └── tokens.css                     # color, tipografía, radios, sombras
```

Reglas que sostienen la estructura:

- **Los componentes no importan `mocks/`.** Los datos llegan por el repositorio; el dibujo
  del escaneo es configuración (`config/escaneo-falso.ts`), no un mock.
- **`services/` es el único acceso a datos.** Todo lo demás recibe objetos por props o
  por el contexto `useRepositorio()`.
- **`lib/` es puro y probado.** Recorte, filtros, orden, dudosos y estados viven ahí y se
  testean sin React.

### Cómo reemplazar los datos simulados por Supabase

El contrato es `RepositorioReportes`
(`src/features/revision/types/dominio.ts`):

```ts
export interface RepositorioReportes {
  listarReportes(): Promise<Reporte[]>;
  obtenerReporte(numero: string): Promise<Reporte | null>;
  revisarCampo(numero: string, campoId: IdCampo, accion: AccionRevision): Promise<Reporte>;
}
```

Pasos:

1. **Implementar el contrato.** Crear
   `src/features/revision/services/repositorio-supabase.ts` con una clase o fábrica que
   cumpla `RepositorioReportes` usando `@supabase/supabase-js` (dependencia nueva, recién
   ahí). Cada método devuelve el mismo `Reporte` que hoy devuelve el simulado.
2. **Mapear filas a dominio.** El dominio ya usa `snake_case`
   (`numero_reporte`, `valor_modelo`, `estado_revision`), así que el mapeo es casi
   directo; lo único a traducir son las fechas ISO de Postgres a `string` y los enums a
   los tipos `EstadoEscaneo` / `EstadoRevisionCampo` / `Confianza`.
3. **Cambiar la fábrica.** En `src/features/revision/services/index.ts`:

   ```ts
   export function crearRepositorio(): RepositorioReportes {
     return crearRepositorioSupabase();   // antes: crearRepositorioSimulado()
   }
   ```

   Ese es el **único** archivo que cambia. Ningún componente se toca: el objeto sigue
   llegando por `ProveedorRepositorio` en `layout.tsx`.
4. **Mover la lógica de mutación al servidor.** `revisarCampo` hoy actualiza un arreglo
   en memoria y deriva el estado con `derivarEstadoReporte`. Con Supabase esa misma regla
   vive en una función o vista de la base (o se reutiliza `lib/estados.ts` en el cliente
   tras el `update`), para que el estado nunca dependa de quién pregunte primero.
5. **Reemplazar el escaneo falso.** `Escaneo.ruta_original` apunta hoy a un SVG generado.
   Con escaneos reales, esa URL viene del bucket de storage y el visor muestra un `<img>`
   en lugar de `HojaEscaneada`; `calcularRecorte` ya recorta sobre cualquier imagen, así
   que el panel de corrección no cambia.
6. **Retirar los mocks.** `src/mocks/reportes.ts` queda solo para tests; se puede borrar
   junto con `crearRepositorioSimulado` cuando el repositorio real esté en verde.

Variables de entorno:

| Variable | Efecto |
| --- | --- |
| `NEXT_PUBLIC_DEV_MODE=false` | Oculta la ruta `/dev/regiones` (responde 404) y el enlace de la cabecera |

### Pantallas de desarrollo

- **`/`** — bandeja con resumen, búsqueda, filtros de estado y origen, y orden por defecto
  de más a menos campos dudosos.
- **`/reportes/[numero]`** — vista de corrección: escaneo con región resaltada, campos
  agrupados por sección, confianza, acciones y barra de progreso.
- **`/dev/regiones`** — calibración: dibuja todas las regiones del mapa sobre el escaneo
  y lista campo por campo la cobertura. Se oculta con `NEXT_PUBLIC_DEV_MODE=false`.

Atajos de teclado en la vista de corrección: `Enter` confirma, `↓`/`↑` (o `j`/`k`) salta
entre campos dudosos, `Escape` cancela una corrección. `Tab` conserva su comportamiento
nativo.
