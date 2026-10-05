# Cromix · AppMusical

Correspondencia musical: envía una canción con una dedicatoria, abre un sobre y conserva el recuerdo en tu repisa. Expo SDK 57, React Native 0.86 y Expo Router.

## Desarrollo

```powershell
npm ci
npx expo start --go --lan --port 8081
```

La app está pensada para Android e iOS. En Android, usa **Enter URL** en Expo Go y pega la dirección `exp://IP_DEL_PC:8081` que muestra Metro, o escanea su QR; ambos dispositivos deben estar en la misma Wi-Fi. El servidor debe usar `--go`, ya que también está instalado `expo-dev-client`. Los widgets requieren una development build. La vista local del navegador sirve para revisar el diseño y `/demo` permite explorar regalos ficticios sin escribir en Supabase. Las credenciales públicas del proyecto existente se conservan como valores predeterminados. Para otro proyecto, copia `.env.example` a `.env.local` y configura su URL y clave publicable.

## Verificación

```powershell
npx expo lint
npx tsc --noEmit
npm test
npx expo export --platform all --no-bytecode --output-dir dist/verification --max-workers 2
```

Los tests ejecutan las migraciones en PostgreSQL aislado con PGlite. Comprueban conservación de datos, permisos, entregas futuras, inmutabilidad, cuotas, repisas compartidas, calibración, desbloqueos y sobres diarios idempotentes. También prueban autenticación de la Edge Function, selección sin repeticiones recientes y colores de álbum. No usan cuentas ni regalos reales. `--no-bytecode` comprueba bundles JavaScript; no equivale a una compilación nativa ni valida Hermes. En este Windows, Control de aplicaciones bloquea `hermesc.exe` y la exportación con bytecode falla con `spawn UNKNOWN`. Debe verificarse una build de EAS antes de distribuir; no se han cambiado las protecciones de Windows.

## Supabase y Spotify

El buscador llama a `spotify-search`. El teléfono nunca recibe el secreto de Spotify. La función valida la sesión, limita búsquedas y obtiene un token de Spotify en el servidor. Los regalos nuevos usan `send_mixtape`, cuya validación reside en PostgreSQL.

Antes del primer despliegue en una base existente, revisa el esquema y guarda una copia de sus políticas y funciones. La migración conserva las filas y sustituye las políticas de acceso de `perfiles`, `amigos` y `mixtapes`. Revisa también los triggers de registro existentes para evitar dos creadores de perfiles incompatibles.

```powershell
npx --yes supabase login --agent no --output-format text
npx --yes supabase link --project-ref TU_PROJECT_REF
npx --yes supabase migration list
npx --yes supabase db push --dry-run
npx --yes supabase db push
npx --yes supabase functions deploy spotify-search
npx --yes supabase functions deploy music-profile
```

Si la base tiene migraciones remotas previas, sincroniza su historial antes de `db push`; no uses `--include-all` ni reparaciones del historial a ciegas. El 3 de octubre de 2026 se publicaron las cinco migraciones y las dos funciones en el proyecto Cromix conectado. Se verificó una búsqueda real con sesión y se completó la calibración de tres artistas desde el teléfono.

El proyecto anterior incluía un secreto de Spotify en el cliente: **rótalo en el panel de Spotify Developers**. Copia `supabase/.env.example` a `.env.spotify.local` en la raíz y completa los dos valores allí, sin pegarlos en el chat. Ese archivo está ignorado y no forma parte de los archivos de entorno que Expo carga automáticamente. Publícalos con:

```powershell
npx --yes supabase secrets set --env-file .env.spotify.local
```

Nunca uses `EXPO_PUBLIC_` para secretos, claves `service_role` o tokens personales. Después de configurar, comprueba una búsqueda desde la app con tu sesión. Spotify necesita devolver acceso válido al endpoint de búsqueda de tu aplicación.

## Artistas, sobres diarios y niveles

La cuenta inicia en nivel 1 y debe escoger exactamente tres artistas distintos. La función `music-profile` valida cada ID consultando Spotify; el cliente no puede modificar preferencias, nivel o contadores directamente. El sobre gratuito se prepara desde Buzón, una vez por día UTC, y conserva la misma canción y formato al volver a pedirlo. Guardarlo añade una pieza a la colección. No cuenta como un envío a un amigo ni consume sus tres envíos diarios.

Enviar tres regalos a amigos o guardar diez piezas desbloquea el cuarto slot; lograr ambos desbloquea el quinto. Tras ambos logros, cada envío adicional aporta 5 XP y cada pieza adicional, 2 XP. Cada 100 XP sube un nivel; desde el nivel 4 se obtiene un cambio de artista por nivel. Añadir un artista a un slot nuevo no consume un cambio. La sustitución se valida y descuenta en servidor.

Esta aplicación de Spotify devuelve 404 en `/recommendations`, 403 en `/artists/{id}/top-tracks` y no incluye popularidad en la búsqueda. Por eso, actualmente se usa búsqueda por artista, comprobación del ID del intérprete y selección aleatoria entre sus resultados; no puede garantizarse un umbral de popularidad. Se evita repetir la misma canción durante 30 días cuando quedan alternativas; al agotarlas, se elige la menos reciente y se prioriza un formato que todavía no haya salido para esa canción. Se agrupan versiones remasterizadas del mismo título. La caché de catálogo dura seis horas y cada artista se sortea antes de la canción para que los catálogos grandes no desplacen a los pequeños.

`SPOTIFY_RECOMMENDATIONS_ENABLED=true` solo debe configurarse si Spotify concede acceso efectivo a ese endpoint. En ese caso se aplica `min_popularity=65` y se conservan únicamente canciones de los artistas escogidos. Las restricciones de acceso están documentadas en los [cambios de Spotify de febrero de 2026](https://developer.spotify.com/documentation/web-api/references/changes/february-2026). Buscar y recibir canciones usa las credenciales de la aplicación en servidor; los usuarios no tienen que conectar su cuenta Spotify. Escuchar abre Spotify externamente.

## Widgets y compilación móvil

Hay configuración y componentes nativos para iOS y Android. Muestran el número de sobres pendientes y la última canción abierta, sin dedicatorias ni títulos de regalos cerrados. El enlace `cromix://buzon` abre el buzón. Android solicita actualización periódica; el sistema controla el momento real. iOS sincroniza al usar la app. No hay promesa de actualización instantánea con la app cerrada ni notificaciones push implementadas.

```powershell
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

Se necesitan una cuenta Expo y las credenciales de distribución correspondientes. Para conectar la development build instalada, inicia Metro con `npx expo start --dev-client --lan --port 8081`. No se generan ni editan `ios/` o `android/` a mano. Antes de publicar: probar gestos y memoria en un Android modesto, abrir Spotify instalado y sin instalar, widgets, registro con confirmación de email, cierre de sesión y entregas programadas en dos cuentas de prueba.

## Estructura

- `src/app`: pantallas y rutas.
- `src/components/three`: geometría procedural y materiales; un solo canvas en el detalle, render bajo demanda.
- `src/domain`: formatos, fechas, enlaces y datos de ejemplo.
- `src/state`: sesión, colección, amigos y sincronización.
- `src/widgets`: variantes nativas y apertura del buzón.
- `supabase`: migraciones y funciones de búsquedas, artistas y sobres diarios.
- `tests`: dominio y seguridad de la base.

La carátula de Spotify se muestra íntegra junto al objeto; el objeto lleva una etiqueta propia con el título y un color extraído de los píxeles del álbum. La extracción usa una imagen temporal de 32×32 y guarda solo el color para reutilizarlo. El fondo negro es el predeterminado; Estudio permite Negro, Grafito y Crema, independientemente del material de las repisas. El visor aparece en la preparación, al descubrir el regalo y al inspeccionarlo. Los regalos antiguos sin ID de canción abren una búsqueda en Spotify.

Las repisas compartidas tienen nombre, invitaciones y miembros. Cada usuario acepta su invitación y añade explícitamente regalos recibidos y abiertos; se comparte también su dedicatoria. Solo los miembros aceptados pueden leer esas canciones. Añadir o quitar de una repisa compartida conserva la colección personal. Las decisiones de producto y monetización están en `PROYECTO.md`.

La navegaci�n principal tiene tres pesta�as: Repisa, Inicio y Perfil. Inicio re�ne buz�n, regalos, amigos y sobre diario. El nivel y Ajustes est�n arriba a la derecha. Perfil permite cambiar el usuario y muestra los artistas y el correo. El acceso de creador a sobres sin l�mite diario est� ligado a `creator_accounts.user_id`, protegido en servidor; cambiar el username no concede ni revoca este permiso. Se conserva el l�mite t�cnico de peticiones por minuto.
