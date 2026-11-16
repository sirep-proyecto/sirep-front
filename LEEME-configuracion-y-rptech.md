# SIREP frontend: Configuración del bot y estado en RP-TECH

Este zip trae los archivos de `sirep-front` **en su misma ruta**. Copia todo el contenido del zip encima de la carpeta del repo y acepta reemplazar. Este archivo `LEEME-configuracion-y-rptech.md` no hace falta guardarlo en el repo.

Necesita el backend con `sirep-back-envio-y-bot.zip`: las rutas `GET`, `PUT` y `DELETE /configuracion/bot`, y los campos `rptech_*` en `/reportes`.

## Archivos

| Archivo | Qué es |
|---|---|
| `app/src/app/configuracion/page.tsx` | **Nuevo.** Página Configuración |
| `app/src/features/configuracion/configuracion-bot.tsx` | **Nuevo.** «Estado del bot»: nombre del bot, si está conectado, a qué dirección le llegan los mensajes, cuántos hay en cola y el último error. «Dirección del backend»: se escribe la URL pública nueva (otro túnel de ngrok u otro dominio), se muestra a dónde enviará Telegram, y se toca **Volver a conectar**. **Desconectar** pide confirmación |
| `app/src/features/configuracion/config-bot.ts` | **Nuevo.** Llamadas a `/configuracion/bot` |
| `app/src/components/layout/cabecera-app.tsx` | **Cambia.** Enlace «Configuración» en el menú. En el celular se ocultan el nombre junto al logo y el indicador «en vivo», para que no haya desplazamiento horizontal |
| `app/src/features/revision/lib/rptech.ts` | **Nuevo.** Regla de dónde está cada reporte respecto de RP-TECH y traducción de los motivos de rechazo a la etiqueta del campo |
| `app/src/features/revision/lib/rptech.test.ts` | **Nuevo.** 3 pruebas |
| `app/src/features/revision/components/comunes/etiqueta-rptech.tsx` | **Nuevo.** Etiqueta «En RP-TECH», «Rechazado por RP-TECH», «Envío pendiente» o «Por enviar» |
| `app/src/features/revision/components/correccion/aviso-rptech.tsx` | **Nuevo.** En el reporte rechazado, el motivo campo por campo y qué hacer. En el ya guardado, explica por qué no se reabre |
| `tabla-reportes.tsx`, `lista-tarjetas.tsx`, `cabecera-reporte.tsx`, `vista-correccion.tsx` | **Cambian.** Muestran la etiqueta y el aviso |
| `app/src/features/revision/types/dominio.ts` | **Cambia.** `estado_reporte`, `rptech_id`, `rptech_error` y `rptech_enviado_en` (opcionales) |

## Pasos (CMD, en la carpeta de `sirep-front`)

```
git checkout main
git pull
git checkout -b feature/configuracion-bot-y-rptech
```
Copia el contenido del zip encima del repo. Después:
```
cd app
npm install
npm run test
npm run build
```
Deben pasar **55 pruebas**: 52 anteriores y 3 nuevas.

## Ya probado

Contra un backend simulado, en PC (1366 px) y en celular (390 px):
- La bandeja muestra «En RP-TECH», «Rechazado por RP-TECH» y «Por enviar».
- En un reporte rechazado aparecen los motivos con el nombre del campo que ve el revisor, por ejemplo «Revisión de líneas L+N: debe ser un número entre 0 y 1000».
- En Configuración se ven el bot, la dirección actual, la cola y el último error.
- Con una dirección que no llega a este backend aparece «… no llega a este backend de SIREP» y no se cambia nada.
- Con una dirección nueva, el bot se conecta y «Recibe mensajes en» muestra la nueva. Desconectar deja el estado en «Desconectado» y el botón cambia a «Conectar».
- En el celular no hay desplazamiento horizontal y no hay errores de JavaScript.

Los 3 errores de `npm run lint` (`protector-sesion.tsx`, `cabecera-app.tsx` línea 69 y `pie-app.tsx`) ya estaban antes de estos cambios.
