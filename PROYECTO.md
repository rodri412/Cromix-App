# Cromix · canciones que se convierten en recuerdos

## La experiencia

Una persona elige una canción, escribe por qué le recuerda a su amigo y la envía como un casete, CD, vinilo o MiniDisc. El destinatario rompe el sello del sobre, descubre el mensaje y guarda el objeto. El valor de la colección lo dan las personas y los momentos asociados a ella.

Cada objeto tiene el título de la canción en su etiqueta, un color extraído del álbum y el formato escogido. La carátula original y el artista aparecen junto a él. Así se reconoce el regalo sin diseñar una portada manual para cada canción. La escucha abre Spotify; los regalos anteriores que no guardaron un ID de canción usan una búsqueda por título y artista.

## Lo implementado

- Repisa personal con desplazamiento virtualizado, búsqueda y filtros por formato. La carga por páginas no corta la colección después de 500 piezas.
- Repisas compartidas con nombre, invitaciones que se aceptan y canciones elegidas por sus destinatarios. Admiten pareja o grupos de amigos; añadir una canción comparte también su dedicatoria.
- Casete, CD, vinilo y MiniDisc con geometría propia; visor 3D que permite girarlos y consultar mensaje, remitente, destinatario y fechas.
- Plástico transparente, tornillos, papel, metal, surcos y discos con agujero real. Las repisas usan ilustraciones ligeras; el visor 3D se monta al preparar, descubrir o inspeccionar un regalo y se actualiza bajo demanda.
- Sobres kraft, rosa, medianoche y lavanda, con apertura de solapa 3D y una alternativa ilustrada si no hay renderizado disponible.
- Preparación del regalo: canción, formato, sobre, amigo, dedicatoria de hasta 500 caracteres y entrega inmediata o programada.
- Tres envíos por día, contados en el servidor y renovados a las 00:00 UTC. Un regalo programado cuenta cuando se crea.
- Amigos por nombre de usuario, registro, sesión, personalización gratuita de la repisa, vibración y reducción de movimiento.
- Colección de demostración que no escribe en la base real.
- Calibración obligatoria de tres artistas favoritos, con búsqueda y validación en Spotify desde el servidor.
- Sobre gratuito diario desde Buzón, con canciones de esos artistas, formatos aleatorios e historial para evitar repeticiones recientes. Volver a solicitarlo no cambia el contenido.
- Niveles y logros: tres envíos a amigos o diez piezas guardadas abren el cuarto slot; ambos logros abren el quinto. Después, cada cien XP concede un nivel y un cambio de artista, con 5 XP por envío adicional y 2 XP por pieza adicional.
- Componentes y configuración de widgets para Android e iOS. Falta validarlos en builds instaladas.

Las cinco migraciones y las dos Edge Functions están publicadas en el Supabase conectado. La búsqueda devolvió canciones reales y la calibración se guardó desde el teléfono. No se han enviado regalos a amigos para probar el código. Spotify no concede a este proyecto acceso a recomendaciones ni a top tracks; se usa búsqueda por artista con comprobación de sus IDs, sin prometer popularidad alta. Las reglas detalladas y las pruebas están en `README.md`.

## Originalidad: siguientes colecciones

Estas son propuestas de producto, todavía no pantallas ni formatos implementados:

| Idea | Qué aporta | Prioridad |
| --- | --- | --- |
| «Nuestro año, lado A» | Un álbum mensual de dedicatorias que dos amigos construyen juntos | Alta |
| Intercambio de piezas | Dos amigos aceptan un intercambio; transferencia atómica en servidor y origen conservado | Alta |
| Carta para una fecha | Cumpleaños, aniversarios y mensajes para el futuro; ya hay entrega programada | Alta |
| Postal de un concierto | Objeto de papel con una foto propia y una dedicatoria; permisos y almacenamiento acotados | Media |
| Reproductor MP3 retro | Una forma nueva de mostrar la canción, con pantalla y botones 3D propios | Media |
| Disco de 7 pulgadas | Variante visual del vinilo para ediciones temáticas propias | Media |
| Tarjeta de memoria | Un pequeño contenedor para recuerdos de un viaje | Baja |

Conviene ampliar los formatos cuando los cuatro actuales funcionen bien en dispositivos modestos. Cada edición debe representar un recuerdo o un diseño propio; el catálogo de Spotify no otorga derechos para vender música ni mercancía de artistas.

## Monetización propuesta

La primera prueba comercial sería un paquete de personalización propio: una repisa, dos papeles de sobre y un sello. El comprador debe ver exactamente qué recibe antes de pagar. Mantendría la colección recibida, sus mensajes y la escucha accesibles sin pago.

| Producto | Contenido | Cómo validarlo |
| --- | --- | --- |
| Paquetes de ambientación | Maderas, iluminación y fondos originales | Medir cuántas personas personalizan y vuelven a su repisa |
| Papelería de temporada | Sobres, sellos y tipografías propios | Probar una colección pequeña y medir interés antes de construir más |
| Cromix Studio | Suscripción con biblioteca de diseños y organización adicional | Solo después de comprobar uso recurrente y valor mensual |
| Diario de dedicatorias | Exportación cuidada de mensajes propios y fechas | Probar una maqueta sin incluir arte o audio de Spotify en el producto vendido |
| Ediciones de ilustradores | Diseños originales mediante acuerdo con su creador | Calcular reparto, soporte y coste de producir cada colección |

Son hipótesis; los precios y la disposición a pagar necesitan validación con usuarios. Actualmente el Estudio ofrece temas gratuitos y no procesa compras. Para activar cobros hacen falta productos de App Store/Google Play, restauración de compras y verificación del derecho de acceso en servidor. Antes del lanzamiento comercial debe revisarse el uso concreto de la API y la política vigente de Spotify.

La [política de Spotify](https://developer.spotify.com/policy) distingue aplicaciones con streaming de otras integraciones y establece restricciones comerciales. Además restringe el uso de clips de audio en mensajería o personalización. La implementación usa apertura externa de Spotify y mantiene su carátula íntegra; no promete reproducción propia de 30 segundos. Esto no constituye una aprobación comercial de Spotify.

## Operación en Supabase Free

Guardar metadatos y dedicatorias, sin subir copias de portadas ni audio. Limitar búsquedas en servidor, reutilizar el token de Spotify y paginar la colección. Revisar los consumos reales en el panel antes de cambiar de plan; los límites vigentes están en [Supabase Pricing](https://supabase.com/pricing).

Cuando crezca la colección, conviene pasar de recargar todas las páginas a paginación por cursor y contadores en servidor. Añadir solicitudes de amistad y bloqueo antes de abrir el registro al público; el modelo actual conserva las relaciones dirigidas de la app original. Implementar notificaciones push con consentimiento y un proceso de entrega de cartas programadas. Los widgets dependen del ciclo de actualización del sistema y no sustituyen push.

## Qué falta antes de distribuir

1. Regenerar el secreto de Spotify que se compartió en el chat y actualizarlo en Supabase desde el archivo local ignorado.
2. Verificar envío/recepción e invitaciones entre dos cuentas de prueba. La búsqueda real ya se comprobó.
3. Construir con EAS y comprobar el visor y los widgets en iOS y Android; no se ha medido FPS ni consumo en un teléfono real.
4. Completar bloqueo, eliminación de cuenta, política de privacidad y consentimiento de notificaciones para un lanzamiento público.
5. Validar el interés por personalización antes de integrar pagos.

El detalle técnico, comandos y limitaciones de compilación están en `README.md`.
