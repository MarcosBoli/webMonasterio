# Bodegas Monasterio — Manual completo del administrador

> Este documento explica cómo funciona la web de Bodegas Monasterio, cómo está montado el sistema por dentro, y cómo gestionarlo todo desde el panel de administración. Está escrito para que lo pueda leer cualquier persona, sin necesidad de saber programar.

---

## Índice

1. [Visión general — qué hay montado](#1-visión-general)
2. [Los tres archivos de la web](#2-los-tres-archivos-de-la-web)
3. [El backend — cómo funciona por dentro](#3-el-backend)
4. [La base de datos](#4-la-base-de-datos)
5. [Los emails automáticos](#5-los-emails-automáticos)
6. [El panel de administración](#6-el-panel-de-administración)
7. [Cómo desplegar el backend en Railway](#7-despliegue-en-railway)
8. [Cómo conectar el formulario con el backend](#8-conectar-el-formulario)
9. [Variables de entorno — configuración completa](#9-variables-de-entorno)
10. [Casos de uso habituales](#10-casos-de-uso-habituales)
11. [Preguntas frecuentes y resolución de problemas](#11-preguntas-frecuentes)
12. [Estructura de archivos del proyecto](#12-estructura-de-archivos)

---

## 1. Visión general

La web de Bodegas Monasterio es un sistema en dos piezas que trabajan juntas:

**La web pública** (lo que ve el cliente)
Tres páginas HTML estáticas alojadas en GitHub Pages (gratuito):
- La página principal con toda la información del restaurante y la bodega
- La carta con los platos, vinos y precios de la temporada
- El formulario de reservas donde el cliente rellena sus datos

**El backend** (lo que no se ve pero hace que todo funcione)
Un servidor Node.js alojado en Railway (plataforma en la nube) que recibe las reservas, las guarda en una base de datos PostgreSQL y envía emails automáticos tanto al cliente como al restaurante.

Cuando un cliente rellena el formulario de reserva y pulsa "Confirmar reserva", ocurre lo siguiente:
1. El navegador envía los datos al servidor (backend en Railway)
2. El servidor valida que todos los campos son correctos
3. Si todo está bien, guarda la reserva en la base de datos con estado "pendiente"
4. Envía un email al cliente confirmando que se ha recibido su solicitud
5. Envía otro email al restaurante avisando de la nueva reserva con todos los datos
6. El formulario muestra el mensaje de éxito al cliente

Todo esto ocurre en menos de dos segundos.

---

## 2. Los tres archivos de la web

### `index.html` — La página principal

Es la primera página que ve cualquier visitante. Tiene nueve secciones:

- **Navbar**: La barra de navegación que aparece arriba. Cuando el usuario baja por la página, el fondo cambia a semitransparente con efecto de cristal esmerilado (glassmorphism). En móvil, los enlaces se ocultan y aparece un botón de menú hamburguesa que abre un cajón lateral.

- **Hero**: La sección de portada a pantalla completa con el vídeo de fondo. El vídeo se reproduce hacia adelante y luego hacia atrás en bucle continuo (técnica llamada "ping-pong"), sin que se note el corte. Si el navegador no puede reproducir el vídeo, muestra la imagen del logo de marca como fondo.

- **Problema**: Cita editorial centrada sobre fondo beige. Sin imágenes, solo tipografía grande.

- **Solución**: Tres columnas con los tres pilares del negocio: bodega propia, cocina de producto y el espacio. Cada uno tiene un icono SVG animado (la copa se llena de vino, el plato tiene ondas que se expanden, la casa echa humo).

- **La Casa (Features)**: Carrusel de fotos a la izquierda con avance automático cada 5,5 segundos, barra de progreso, botones anterior/siguiente y contador de imagen. A la derecha, los cuatro servicios principales con flechas de acción.

- **Trust strip**: Banda de confianza con los cuatro datos clave del negocio en una línea horizontal.

- **Testimonios**: Cinta horizontal infinita con seis reseñas de clientes que se desplaza automáticamente y se pausa al pasar el ratón por encima.

- **Precios**: Tres tarjetas con los menús y precios. La del centro (Menú degustación) aparece destacada en granate como opción recomendada.

- **Footer**: Pie de página oscuro con toda la información de contacto, horarios, redes sociales y aviso legal.

### `carta.html` — La carta del restaurante

Página dedicada a la oferta gastronómica. Incluye:

- Una barra de filtros fija que permite saltar directamente a Entrantes, Principales, Postres o Vinos sin necesitar hacer scroll. La barra detecta automáticamente qué sección es visible y resalta el filtro correspondiente.
- Las secciones de platos con precios, ingredientes principales y etiquetas (vegetariano, recomendado, etc.)
- La sección de vinos de la casa con precios por copa y por botella
- Una cita editorial separando las secciones de cocina y vinos

### `reservar.html` — El formulario de reservas

El formulario más completo de los tres. Tiene dos columnas en escritorio: el formulario a la izquierda y un panel informativo fijo a la derecha que se queda visible mientras el usuario rellena el formulario (horarios, teléfono, mapa esquemático y política de cancelación).

El formulario tiene ocho campos:
- **Nombre**: texto libre
- **Email**: validado en tiempo real (formato correcto)
- **Teléfono**: mínimo 9 dígitos
- **Tipo de experiencia**: un selector que cambia las opciones de hora disponibles automáticamente. El Menú del día solo muestra horarios de mediodía; el Menú degustación, de noche; la Cata sabatina, solo el sábado a las 12:30; los Eventos privados muestran "Acordar por teléfono"
- **Fecha**: selector de calendario con la fecha mínima bloqueada en hoy
- **Hora**: se rellena automáticamente según el tipo de experiencia elegido
- **Número de personas**: contador con botones + y − (mínimo 1, máximo 20)
- **Mensaje adicional**: campo de texto libre opcional

Al enviar, el botón muestra un spinner de carga mientras espera la respuesta del servidor. Si hay un error, se muestra un mensaje de error bajo el botón. Si todo va bien, el formulario desaparece y aparece una pantalla de éxito con una animación de check verde.

### `admin.html` — El panel de administración

Solo accesible para el equipo del restaurante. Explicado en detalle en la sección 6.

---

## 3. El backend

El backend es un servidor web escrito en Node.js con Express. Vive en la carpeta `backend/` del proyecto y se despliega en Railway (una plataforma en la nube).

### Qué hace

El servidor tiene tres endpoints (direcciones a las que se puede llamar):

**`POST /api/reservas`** — Crear una reserva
Recibe los datos del formulario, los valida, los guarda en la base de datos y envía los emails. Cualquiera puede llamar a este endpoint (es público, lo usa el formulario de la web).

**`GET /api/reservas`** — Ver todas las reservas
Devuelve la lista de todas las reservas ordenadas por fecha. Este endpoint está protegido: solo funciona si se envía la clave de administrador correcta en la cabecera `X-Api-Key`. Sin esa clave, devuelve error 401.

**`PATCH /api/reservas/:id`** — Actualizar el estado de una reserva
Permite cambiar el estado de una reserva entre `pendiente`, `confirmada` y `cancelada`. También está protegido con la clave de administrador.

**`GET /health`** — Comprobación de estado
Railway lo usa para saber si el servidor está funcionando correctamente.

### Cómo valida los datos

Antes de guardar cualquier reserva, el servidor comprueba:
- Que el nombre no esté vacío
- Que el email tiene formato válido (contiene @ y dominio)
- Que el teléfono tiene al menos 9 dígitos
- Que se ha elegido un tipo de experiencia
- Que la fecha tiene formato correcto (AAAA-MM-DD)
- Que se ha elegido una hora
- Que el número de personas es un número entero entre 1 y 20

Si alguna validación falla, el servidor devuelve un error con la lista de campos incorrectos y no guarda nada ni envía emails.

---

## 4. La base de datos

Se usa PostgreSQL, una base de datos relacional muy robusta. Railway la proporciona como servicio adicional dentro del mismo proyecto y la conecta automáticamente al servidor.

Hay una sola tabla llamada `reservas` con estas columnas:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | Número entero (autoincremental) | Identificador único de cada reserva |
| `nombre` | Texto | Nombre completo del cliente |
| `email` | Texto | Email del cliente (en minúsculas) |
| `telefono` | Texto | Teléfono del cliente |
| `experiencia` | Texto | Tipo de experiencia elegida |
| `fecha` | Fecha | Día de la reserva (AAAA-MM-DD) |
| `hora` | Texto | Hora de la reserva |
| `personas` | Número entero | Número de comensales |
| `mensaje` | Texto (opcional) | Notas adicionales del cliente |
| `estado` | Texto | Estado actual: `pendiente`, `confirmada` o `cancelada` |
| `created_at` | Fecha y hora | Cuándo se creó la reserva (automático) |

La tabla se crea automáticamente la primera vez que arranca el servidor. Si ya existe, no la toca.

---

## 5. Los emails automáticos

Cuando llega una reserva nueva, el sistema envía dos emails distintos de forma simultánea.

### Email al cliente

Asunto: `Reserva recibida · [tipo de experiencia] · [fecha]`

El cliente recibe un email con el encabezado en granate de Bodegas Monasterio y un resumen de su reserva: tipo de experiencia, fecha formateada en español (por ejemplo "lunes, 23 de junio de 2025"), hora, número de personas y el mensaje que haya dejado. También incluye información de cómo cancelar o modificar la reserva.

El tono es cálido y acogedor, no corporativo. El asunto del email evita la carpeta de spam usando palabras concretas en lugar de frases genéricas.

### Email al restaurante

Asunto: `Nueva reserva: [nombre] · [X] pax · [fecha]`

El restaurante recibe toda la información operativa: fecha, hora, tipo de experiencia, número de personas, y los datos de contacto del cliente (email clicable y teléfono clicable para llamar directamente desde el móvil). También incluye el número de reserva interno (#ID) y la hora exacta a la que se creó la solicitud.

### Si los emails fallan

Si hay algún problema al enviar los emails (por ejemplo, credenciales SMTP incorrectas o problemas de red), el servidor **no cancela la reserva**. La reserva se guarda igualmente en la base de datos y el cliente ve el mensaje de éxito. El error de email se registra en los logs del servidor en Railway, donde puede verse en el panel de control.

### Configuración del email

El sistema usa SMTP, el protocolo estándar de correo electrónico. Funciona con cualquier proveedor: Gmail, Brevo, Resend, Amazon SES, o el servidor de correo propio. Ver sección 9 para la configuración completa.

---

## 6. El panel de administración

El panel de administración está en `admin.html`. No está enlazado desde la web pública, así que solo llega quien conoce la URL directamente.

### Acceso

Al abrir `admin.html`, lo primero que aparece es una pantalla de inicio de sesión. Solo tiene un campo: la clave de administrador (API Key). Esta clave se configura durante el despliegue del backend (variable `ADMIN_API_KEY`).

Al pulsar "Entrar", el panel hace una llamada real al servidor para comprobar que la clave es correcta. Si la clave es incorrecta, muestra el mensaje "Clave incorrecta" en rojo. Si es correcta, pasa al panel principal.

La sesión se guarda en el navegador mientras la pestaña esté abierta. Al cerrar la pestaña o pulsar "Cerrar sesión", hay que volver a introducir la clave.

### El panel principal

Una vez dentro, el panel tiene tres zonas:

**Barra superior**
Muestra el nombre del panel a la izquierda y el botón de cerrar sesión a la derecha.

**Tarjetas de estadísticas**
Cuatro números de un vistazo:
- Total de reservas recibidas
- Cuántas están pendientes de confirmar (en amarillo)
- Cuántas están confirmadas (en verde)
- Cuántas están canceladas (en gris)

Estos números se actualizan solos cada 60 segundos para que siempre estés viendo datos frescos sin necesidad de recargar la página.

**Filtros**
Antes de ver la tabla, puedes afinar qué reservas quieres ver:
- **Búsqueda de texto**: escribe un nombre, un email o un teléfono y la tabla filtra en tiempo real
- **Estado**: muestra solo las pendientes, solo las confirmadas, solo las canceladas, o todas
- **Experiencia**: filtra por tipo (Menú del día, Menú degustación, Cata sabatina, Evento privado)
- **Fecha desde / hasta**: ver solo las reservas de un rango de fechas concreto
- **Botón "Actualizar"**: recarga los datos del servidor manualmente si quieres refrescar ahora mismo

**La tabla de reservas**
Cada fila muestra: número de reserva, nombre del cliente, tipo de experiencia, fecha, hora, número de personas, estado (con un badge de color) y los botones de acción.

Al hacer clic en cualquier fila, se expande y muestra los datos adicionales: email, teléfono (clicable para llamar), mensaje del cliente y cuándo se creó la solicitud.

Los botones de acción son:
- **✓ Confirmar**: cambia el estado a "confirmada" (aparece solo si la reserva está pendiente o cancelada)
- **✗ Cancelar**: cambia el estado a "cancelada" (aparece solo si la reserva está pendiente o confirmada)

Al confirmar o cancelar, la tabla se actualiza al instante sin recargar la página, y aparece una notificación pequeña en la esquina inferior derecha ("Reserva #12 confirmada ✓") que desaparece sola a los 3 segundos.

### En móvil

En pantallas pequeñas, la tabla se convierte en tarjetas apiladas. Cada tarjeta muestra la información más importante y los botones de acción. El funcionamiento es idéntico.

---

## 7. Despliegue en Railway

Railway es la plataforma donde vive el backend. El proceso de despliegue completo lleva unos 10-15 minutos.

### Paso 1: Crear cuenta en Railway

Entra en [railway.app](https://railway.app) y crea una cuenta gratuita. Puedes usar tu cuenta de GitHub para agilizarlo.

### Paso 2: Crear un nuevo proyecto

Desde el panel de Railway, pulsa **"New Project"** → **"Deploy from GitHub repo"**. Si es la primera vez, Railway te pedirá permiso para acceder a tu cuenta de GitHub. Autorízalo.

Busca y selecciona el repositorio `MarcosBoli/webMonasterio`.

### Paso 3: Configurar el directorio raíz

Railway detectará que el repositorio tiene código pero lo buscará en la raíz. Necesitas indicarle que el backend está en la subcarpeta `backend/`. En la configuración del servicio, busca **"Root Directory"** y escribe `backend`.

Railway leerá el archivo `railway.toml` que está dentro de esa carpeta y sabrá automáticamente cómo arrancar el servidor (`npm start`).

### Paso 4: Añadir la base de datos PostgreSQL

Dentro del mismo proyecto en Railway, pulsa **"New"** → **"Database"** → **"Add PostgreSQL"**. Railway creará una base de datos PostgreSQL y la conectará automáticamente al servidor. La variable `DATABASE_URL` se inyecta sola, no tienes que hacer nada más.

### Paso 5: Configurar las variables de entorno

En el panel del servicio Node.js, ve a la pestaña **"Variables"** y añade las siguientes (ver sección 9 para los valores):

```
FRONTEND_URL=https://marcosboli.github.io
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-gmail
RESTAURANT_EMAIL=reservas@bodegasmonasterio.es
RESTAURANT_NAME=Bodegas Monasterio
ADMIN_API_KEY=una-clave-larga-y-segura-que-tu-elijas
```

### Paso 6: Obtener la URL del servidor

Una vez desplegado, Railway asigna una URL pública al servidor, algo parecido a `https://bodegas-monasterio-api-production.up.railway.app`. La encontrarás en la pestaña **"Settings"** → **"Domains"** del servicio. Cópiala, la necesitarás en el paso siguiente.

### Paso 7: Verificar que funciona

Abre en el navegador tu URL + `/health`. Deberías ver:
```json
{"ok": true, "ts": "2026-05-17T10:00:00.000Z"}
```

Si ves eso, el servidor está funcionando perfectamente.

---

## 8. Conectar el formulario con el backend

Una vez que tienes la URL del backend de Railway, necesitas decírsela al formulario de reservas.

Abre el archivo `reservar.html` y busca la línea que pone:
```html
</body>
```

Justo antes de esa línea, añade:
```html
<script>window.BODEGAS_API_URL = 'https://TU-URL.up.railway.app';</script>
```

Sustituyendo `TU-URL` por la URL real que te dio Railway.

Después, guarda el archivo, haz commit y push. La web pública de GitHub Pages se actualizará en 1-2 minutos.

Lo mismo para `admin.html`: si quieres que el panel apunte a tu servidor de Railway, añade la misma línea antes del `</body>` del archivo `admin.html`.

---

## 9. Variables de entorno

Estas son todas las variables que hay que configurar en Railway. Están en el archivo `backend/.env.example` del proyecto como referencia.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL. **Railway la inyecta automáticamente, no tocar.** | `postgresql://...` |
| `PORT` | Puerto del servidor. **Railway lo gestiona automáticamente.** | `3000` |
| `FRONTEND_URL` | URL de la web pública. Sirve para que el servidor acepte peticiones desde ahí. | `https://marcosboli.github.io` |
| `SMTP_HOST` | Servidor de correo saliente | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP. 587 para TLS, 465 para SSL. | `587` |
| `SMTP_SECURE` | `true` si el puerto es 465, `false` si es 587 | `false` |
| `SMTP_USER` | Email desde el que se envían los correos | `bodegasmonasterio@gmail.com` |
| `SMTP_PASS` | Contraseña de aplicación del email (no la contraseña normal) | `abcd efgh ijkl mnop` |
| `RESTAURANT_EMAIL` | Email donde llegan las notificaciones de nuevas reservas | `reservas@bodegasmonasterio.es` |
| `RESTAURANT_NAME` | Nombre que aparece como remitente en los emails | `Bodegas Monasterio` |
| `ADMIN_API_KEY` | Clave secreta para acceder al panel de administración. Elige una larga y difícil. | `monasterio-admin-2026-xK9mP...` |

### Cómo obtener la contraseña de aplicación de Gmail

Gmail no permite usar tu contraseña normal en aplicaciones externas. Necesitas crear una "contraseña de aplicación":

1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Busca "Verificación en dos pasos" y actívala si no la tienes
3. Vuelve a la página de tu cuenta y busca "Contraseñas de aplicaciones" (puedes usar el buscador)
4. Crea una nueva contraseña, ponle el nombre "Bodegas Monasterio"
5. Gmail te dará una clave de 16 caracteres (tipo `abcd efgh ijkl mnop`)
6. Copia esa clave y úsala como valor de `SMTP_PASS`

---

## 10. Casos de uso habituales

### Ver las reservas del fin de semana

1. Abre `admin.html` en el navegador e introduce la clave de administrador
2. En los filtros, pon la fecha "desde" el viernes y "hasta" el domingo
3. La tabla mostrará solo las reservas de esos tres días

### Confirmar una reserva

1. Encuentra la reserva en la tabla (puedes buscar por nombre o teléfono)
2. Haz clic en el botón verde **"✓ Confirmar"** en la columna de acciones
3. El badge cambia a verde "confirmada" al instante
4. (Opcional) Llama al cliente para confirmarlo personalmente — el teléfono está en la fila expandida

### Cancelar una reserva

1. Busca la reserva en la tabla
2. Haz clic en el botón rojo **"✗ Cancelar"**
3. El badge cambia a gris "cancelada"
4. Contacta con el cliente por teléfono o email para informarle (el sistema no envía email de cancelación automáticamente — es mejor hacerlo de forma personal)

### Ver los datos de contacto de un cliente

1. Haz clic en cualquier parte de la fila de la reserva
2. La fila se expande mostrando email, teléfono (clicable), mensaje y fecha de la solicitud
3. Pulsa Escape o haz clic de nuevo para cerrar la fila expandida

### Filtrar por tipo de experiencia para planificar la semana

1. En el selector de "Experiencia", elige "Menú degustación"
2. Pon el rango de fechas de la semana
3. Verás exactamente cuántas cenas de degustación tienes y a qué horas

### Actualizar los datos sin recargar la página

Pulsa el botón **"↻ Actualizar"** en la barra de filtros. Los datos se recargan del servidor y el timestamp de "última actualización" se actualiza. También puedes esperar: el panel se actualiza solo cada 60 segundos.

---

## 11. Preguntas frecuentes y resolución de problemas

### El formulario muestra "Error al enviar la reserva"

**Causa más probable**: el backend no está arrancado o la URL está mal configurada en `reservar.html`.

**Solución**:
1. Abre la URL de Railway + `/health` en el navegador. Si no carga, el servidor está caído.
2. Ve a Railway, abre el servicio y mira los logs. Si ves un error de base de datos, probablemente el servicio PostgreSQL no está conectado.
3. Comprueba que la URL en `reservar.html` es exactamente la que te dio Railway (sin barra final).

### El panel de administración dice "Clave incorrecta"

**Causa**: la clave que introduces no coincide con el valor de `ADMIN_API_KEY` en Railway.

**Solución**: ve a Railway → Variables → copia el valor exacto de `ADMIN_API_KEY` y pégalo en el campo de inicio de sesión. La clave distingue mayúsculas y minúsculas.

### No llegan los emails de confirmación

**Posibles causas**:
1. Las variables SMTP están mal configuradas en Railway
2. La contraseña de aplicación de Gmail es incorrecta o ha caducado
3. Gmail está bloqueando el envío por actividad inusual

**Para diagnosticar**: ve a Railway → tu servicio → pestaña "Logs". Busca líneas que contengan "Email error:". El mensaje de error te dirá qué está fallando.

**Solución más común**: genera una nueva contraseña de aplicación en Gmail y actualiza `SMTP_PASS` en Railway. El servidor se reinicia automáticamente al cambiar variables.

### Los emails llegan a la carpeta de spam

**Causa**: los emails enviados desde Gmail con SMTP sin dominio propio tienen más probabilidad de ir a spam.

**Solución a largo plazo**: usar un servicio de email transaccional como [Brevo](https://brevo.com) (gratuito hasta 300 emails/día) o [Resend](https://resend.com) con un dominio verificado. El código del backend solo requiere cambiar las variables SMTP, el resto no cambia.

### La web de GitHub Pages no actualiza

**Causa**: GitHub Pages tarda entre 1 y 5 minutos en publicar los cambios después de un push.

**Solución**: espera unos minutos y recarga la página con Ctrl+Shift+R (fuerza recarga sin caché).

### El carrusel de fotos muestra imágenes grises con texto

Esas son las imágenes de marcador de posición. Para reemplazarlas con fotos reales del local:
1. Sube las fotos a la carpeta `assets/gallery/` con los nombres `01.jpg`, `02.jpg`, etc.
2. Abre `index.html` y busca los elementos `<img class="carousel-img">`
3. Cambia cada atributo `src` de `assets/gallery/01.svg` a `assets/gallery/01.jpg`

### Añadir una nueva fecha bloqueada (festivo, cierre)

Actualmente el formulario solo bloquea fechas pasadas. Para bloquear fechas específicas (Navidad, vacaciones, etc.), abre `reservar.html`, busca el input de fecha y añade un atributo `max` con la fecha límite, o contacta para que se implemente una lista de fechas bloqueadas en el servidor.

---

## 12. Estructura de archivos del proyecto

```
webMonasterio/
│
├── index.html              ← Página principal (9 secciones)
├── carta.html              ← La carta del restaurante
├── reservar.html           ← Formulario de reservas
├── admin.html              ← Panel de administración (solo para el restaurante)
│
├── assets/
│   ├── hero.mp4            ← Vídeo del héroe (ping-pong)
│   ├── brand.png           ← Logo/marca de Bodegas Monasterio
│   ├── logo.png            ← Logo alternativo
│   └── gallery/
│       ├── 01.svg          ← Placeholder bodega (reemplazar con foto real)
│       ├── 02.svg          ← Placeholder viña
│       ├── 03.svg          ← Placeholder mesa
│       ├── 04.svg          ← Placeholder copas
│       └── 05.svg          ← Placeholder cocina
│
├── backend/
│   ├── package.json        ← Dependencias Node.js
│   ├── railway.toml        ← Configuración de despliegue en Railway
│   ├── .env.example        ← Plantilla de variables de entorno
│   ├── .gitignore          ← Excluye node_modules y .env del repositorio
│   └── src/
│       ├── index.js        ← Servidor Express principal
│       ├── db.js           ← Conexión a PostgreSQL y creación de tabla
│       ├── routes/
│       │   └── reservas.js ← Lógica de los endpoints de reservas
│       └── emails/
│           └── templates.js ← Plantillas HTML de los emails
│
├── .agents/
│   └── skills/             ← Habilidades instaladas para el agente de IA
│
├── skills-lock.json        ← Registro de skills instaladas
├── README.md               ← Descripción general del repositorio
└── ADMIN.md                ← Este documento
```

---

*Documento generado el 17 de mayo de 2026. Para cualquier duda técnica o para ampliar funcionalidades, contacta con el equipo de desarrollo.*
