# Preferencias de trabajo — Gustavo / Proyecto Fletar

## ⚠️ LEER ESTO SIEMPRE AL INICIO DE CADA SESIÓN

Al empezar una nueva sesión con Gustavo:
1. Leer este archivo completo.
2. Leer **EN-CURSO.md** — si hay algo anotado ahí, es una tarea que quedó a
   medias (por ejemplo, la sesión se cortó de golpe). Retomar desde ahí, no
   preguntar "¿qué hacemos hoy?" en ese caso — decir directamente en qué quedó
   y cómo seguir.
3. Si EN-CURSO.md dice "Sin tareas en curso", recién ahí decir:
> "Retomamos con Fletar. Recuerdo tus preferencias: analizo contigo antes de hacer cualquier cosa, espero tu OK antes de implementar, te doy pros/contras y mockup, y verifico que cada cambio no rompa nada previo. ¿Qué trabajamos hoy?"

---

## Cómo quiero que Claude trabaje conmigo

1. **Siempre cuestionarme** antes de arrancar cualquier tarea. Hacerme preguntas que yo quizás no consideré. No asumir que ya pensé en todo.

2. **Darme siempre pros y contras** de cada opción. Nunca recomendar una sola cosa sin mostrar las alternativas y sus consecuencias.

3. **Mostrarme opciones** de cómo algo podría quedar mejor, no solo hacer lo que pedí de la manera más obvia.

4. Cuando haya una decisión importante (arquitectura, diseño, flujo de usuario), **preguntarme con el componente de preguntas** (opciones clickeables), no solo texto.

5. Ser directo y conciso. No explicar de más, no repetir lo que ya hice.

6. **Siempre mostrar mockup visual antes de implementar** cualquier cambio de interfaz.

7. **La app siempre tiene que ser intuitiva, simple y lo más limpia posible.**

8. **Analizar juntos antes de hacer cualquier cosa.** No arrancar a implementar directamente — primero discutir, llegar a la mejor opción entre los dos, y esperar el OK explícito de Gustavo antes de tocar cualquier archivo.

9. **Siempre esperar el OK antes de implementar.** Sin excepción. Aunque parezca obvio lo que hay que hacer.

10. **Verificar impacto antes de cada cambio.** Antes de implementar algo, revisar que no rompa ni altere nada de lo ya hecho. Si hay riesgo de conflicto, parar, avisarle a Gustavo y re-analizar juntos antes de continuar. La información más importante siempre resaltada y fácil de visualizar. Menos es más: cada pantalla debe tener un propósito claro, sin elementos que distraigan.

---

## Contexto del proyecto

- Proyecto: **Fletar** — marketplace de fletes entre empresas y transportistas, región NEA (Misiones y alrededores).
- Stack: HTML + React (CDN) + Firebase Realtime Database. Sin backend propio. Archivos `.html` estáticos deployados en Netlify.

### Archivos activos (versión Firebase — ESTOS SON LOS QUE SE USAN)
| Archivo | Descripción |
|---|---|
| `fletar-cliente.html` | App naranja · auto-login empresa · publica cargas · ve ofertas · Firebase |
| `fletar-transportista.html` | App verde · auto-login Carlos Ramírez · ve cargas · hace ofertas · Firebase |
| `fletar-chofer.html` | App del chofer · manifiesto de viaje · QR · funciona offline |
| `index.html` | Landing de prueba · dos botones · apunta a cliente y transportista |

### Archivo a NO tocar
| Archivo | Descripción |
|---|---|
| `fletar.html` | Versión unificada original — conservada como referencia, no modificar |

### App publicada
- URL Netlify (pausada, sin créditos): https://fletar-app.netlify.app
- URL Vercel (activa): https://fletar-app-5.vercel.app
- Deploys anteriores: proyecto-fletar.vercel.app, fletar-app-2.vercel.app, fletar-app-3.vercel.app, fletar-app-4.vercel.app
- Para subir cambios cuando Netlify tenga créditos: arrastrar carpeta al panel Production deploys
- Para subir a Vercel: vercel.com → Agregar nuevo → Proyecto → arrastrar carpeta (usar nombre distinto cada vez)
- Firebase proyecto: fletar-49e36 — Realtime Database activa
- Datos en Firebase: cargas, ofertas, chat, remitos (tiempo real entre dispositivos)
- Datos en localStorage: fletar_flota (privado por dispositivo)

---

## Lo que está implementado

- Auto-login por archivo (empresa en fletar-cliente, Carlos Ramírez en fletar-transportista)
- Firebase Realtime Database: sync automático entre dispositivos sin botón actualizar
- Publicar carga: formulario 4 pasos (Ruta → Qué mandás → Medidas/Cotizador → Destinatario)
- Cotizador automático: largo × ancho × alto → peso volumétrico → peso cobrable → precio estimado
- Tabla de distancias entre provincias (NEA principalmente)
- Ver y comparar ofertas: ordenar por precio o calificación, badges automáticos
- Hacer oferta: precio + fecha/hora retiro + entrega estimada + nota
- Remitos con QR generado automáticamente
- Seguimiento de estado: pendiente-retiro → retirado → en-deposito → cargando-ruta → en-camino → entregado (6 estados)
- Mi Flota: gestión de vehículos con autocompletado (35 modelos argentinos), capacidad m³/kg, barras de ocupación
- Mis viajes: asignar remitos a vehículos, actualizar estado, generar link WhatsApp para chofer
- App del chofer (fletar-chofer.html): manifiesto con entregas y retiros, confirmación con nombre+DNI, funciona offline
- Chat interno entre empresa y transportista (Firebase)

---

## Estado al cierre de sesión (15/06/2026) — actualizado

### Fix adicional (15/06/2026) — Mi Flota: tipo, TIPOS_VEHICULO, persistencia Firebase

**Problema**: Al editar Móvil 01 seleccionando Kangoo desde el autocomplete, el campo `tipo` no se actualizaba (solo `modelo`, `capacidadM3`, `capacidadKg`). El card mostraba `v.tipo` que seguía siendo el valor viejo.

**Fixes aplicados:**

1. **`tipo` en SelectorVehiculo**: La callback ahora incluye `tipo: v.categoria` al elegir un modelo del autocomplete.

2. **TIPOS_VEHICULO simplificado**: Los valores del select ahora coinciden exactamente con `DB_VEHICULOS.categoria`:
   - "Utilitario chico", "Furgón mediano", "Furgón grande", "Pick-up", "Camión mediano", "Camión grande", "Semi / Acoplado", "Otro"
   - (antes tenían paréntesis con ejemplos que rompían la consistencia)

3. **iconosPorTipo actualizado**: Mapa de íconos actualizado para los nuevos valores de tipo.

4. **FLOTA_SEMILLA limpiada**: Móvil 01 y 02 son ahora genéricos sin patente/chofer hardcodeados, con tipos que coinciden con el nuevo schema.

5. **Persistencia Firebase**: La flota ahora se guarda TAMBIÉN en Firebase bajo `flota/trans-001` al hacer guardar/eliminar. Al montar MiFlota o entrar a En Depósito, si localStorage está vacío o solo tiene semilla, se restaura desde Firebase automáticamente. Esto sobrevive cambios de URL en Vercel (nueva URL = localStorage vacío pero Firebase permanece).

**Nota técnica**: `KEY_FLOTA_FB` y `guardarFlotaEnFB()` están definidos a nivel módulo justo antes de `MiFlota`. Son accesibles desde `TransportistaDashboard` porque en JavaScript, las `const` de módulo son hoisted a nivel del scope global del archivo y están inicializadas antes de que React renderice cualquier componente.

---

## Estado al cierre de sesión (15/06/2026)

### Sesión 15/06/2026 — 3 bugs en En Depósito resueltos

**Bug 1 (Card Carga Asignada muestra Móvil 01 vacío):** La card es correcta — los paquetes SÍ están asignados a Móvil 01 en Firebase (de sesiones previas). Se agregó botón "↩ Desasignar" por vehículo en la card de resumen que mueve los paquetes de vuelta a `en-deposito` (limpia `vehiculoRuta`). También se quitó la condición `|| flota.length === 0` que ocultaba la card incorrectamente.

**Bug 2 (Mi Flota se resetea a Móvil 01 y 02):** Root cause: `TransportistaDashboard.flota` solo se leía de localStorage al montar. Si el usuario agregaba vehículos en Mi Flota y volvía al dashboard sin navegar, el selector de vehículo en En Depósito mostraba solo los de FLOTA_SEMILLA. Fix: se agregó un `useEffect` que re-lee localStorage desde `KEY_FLOTA` cada vez que `etapa` cambia a `"enDeposito"`.

**Bug 3 (Selección en Ruta 2 se revierte):** Consecuencia de Bug 2 — al no ver Móvil 04, el usuario no podía asignar vehículo, y `confirmarCargaGrupo` llamaba alert + limpiaba la selección. Fix de Bug 2 resuelve el caso raíz. Defensivamente se agregó `e.stopPropagation()` en el checkbox individual y en el "Seleccionar todos".

---

## Estado al cierre de sesión (11/06/2026)

### Sesión 11/06/2026 — Autocomplete de ciudades + detección geográfica de rutas

Implementado en fletar-cliente.html y fletar-transportista.html:
- **GeoRef API** reemplaza a Nominatim para búsqueda de ciudades — API oficial argentina, solo localidades, sin ruido
- **GPS con priorización provincial:** al detectar ubicación, las ciudades de esa provincia aparecen primero en el autocomplete
- **Accept-Language: es** en todas las llamadas para recibir nombres en español

Implementado en fletar-transportista.html — MisRutas:
- **Detección automática de paradas:** al elegir origen + destino, la app consulta GeoRef y calcula geográficamente qué ciudades están en el camino (tolerancia 45% de desvío)
- **Rutas interprovinciales:** usa centroides de las 24 provincias para detectar cuáles quedan en el camino y busca localidades en todas en paralelo
- **UI checkboxes:** ciudades ordenadas por distancia desde el origen, con tilde para marcar las que cubre el transportista
- **Campo manual:** "¿No está tu ciudad? Agregala" para casos que no detecta automáticamente
- **Eliminado:** el viejo sistema de modales Provincias + Ciudades que era confuso

---

## Estado al cierre de sesión (09/06/2026)

### Sesión 09/06/2026 — Multi-sucursales, responsive, pipeline UX
Implementado en fletar-transportista.html:
- **Fix remito destinatario:** datos reales del destinatario (nombre, tel, domicilio, ciudad) en lugar de hardcoded
- **Botón "Enviar link":** usa navigator.share() — abre WhatsApp/Gmail/etc. en móvil; copia al portapapeles en desktop
- **Multi-sucursales:** URL ?sucursal=obera abre la app en modo sucursal, filtra cargas y remitos por zona asignada. Central (sin param) gestiona sucursales vía pantalla "🏢 Sucursales"
- **SucursalesManager:** CRUD completo en Firebase (sucursales/), selección de ciudades por pills, generación y copia/share de links
- **Pipeline grilla → detalle:** clic en card oculta las otras 5, muestra solo esa etapa con título y "← Volver"
- **Responsive:** clases .g2/.g3/.g4 con colapso en móvil, font-size 16px en inputs (evita zoom iOS)

Implementado en fletar-cliente.html:
- **Fix responsive:** reemplazados selectores CSS de atributo (no funcionaban con React inline styles) por clases .g2/.g2-1/.g3/.g4

Implementado en fletar-chofer.html:
- **Desktop:** columna centrada 520px, modal como diálogo centrado en lugar de bottom-sheet

Deploy exitoso en Vercel: https://fletar-app-5.vercel.app (09/06/2026)

### Cadena logística completa (08/06/2026)
- **6 estados internos:** pendiente-retiro → retirado → en-deposito → cargando-ruta → en-camino → entregado
- **Pipeline del transportista:** 6 cards (Pedidos, Cotizados, Aceptados, En depósito, En camino, Entregados)
- **Vista del cliente:** 3 pasos visibles (Retirado → En camino → Entregado)
- **Depósito opcional:** botón "Saltar depósito"

### Nota técnica importante: OneDrive y bash
El entorno bash de Claude ve versiones cacheadas/antiguas de los archivos en OneDrive. Los archivos que bash lee pueden estar incompletos o desactualizados. Siempre usar la herramienta Read/Edit para leer y modificar archivos — NO confiar en bash para verificar el contenido de archivos en PROYECTO FLETAR.

---

## Pendiente / próximos pasos

1. ~~**Cadena logística completa** — IMPLEMENTADO (08/06/2026)~~

2. **App del chofer — pulir y completar:**
   - Página `fletar-chofer.html` con todos los remitos del vehículo
   - El chofer escanea QRs de destinatarios para marcar entregas
   - Funciona offline una vez cargado
   - PWA instalada en celular del chofer (service worker robusto hecho — pendiente verificar que instala bien con ícono verde)

3. **PWA app del cliente (`fletar-cliente.html`) — PENDIENTE (después del chofer):**
   - Mismo proceso: manifest + service worker + ícono naranja
   - Para que el cliente pueda instalar Fletar como app en su celular y publicar envíos fácilmente

4. **Cotizador — actualizar tarifas:**
   - Las tarifas actuales están bajas para el mercado 2026
   - Rangos correctos investigados: < 300 km → $500-700/kg, 300-600 km → $900-1200/kg, etc.
   - Ver sección de investigación en proyecto-fletar-notas.md

5. **Notificaciones reales:** email o WhatsApp cuando llega una oferta nueva

6. **Sistema de calificaciones** post-entrega

---

## Modelo de negocio

### Estrategia general de lanzamiento
**Todas las plataformas arrancan GRATIS.** El objetivo es masa crítica de usuarios antes de activar cualquier cobro. No hay fecha definida para el switch — depende del volumen de uso real.

---

### Modelo definido (15/06/2026)
- **Cobro:** $0.30 USD por operación (= por remito creado)
- **Quién paga:** el transportista (no la empresa)
- **Mecanismo:** sistema de créditos prepagos (NO cobro por transacción individual — las comisiones de MP lo hacen inviable)

### Sistema de créditos (a implementar)
El transportista compra un paquete de créditos. Cada remito creado descuenta 1 crédito de su saldo en Firebase.

**Paquetes sugeridos:**
| Paquete | Precio | Comisión MP (~5%+IVA) | Neto | Costo/op |
|---|---|---|---|---|
| Arranque · 30 ops | $9 USD | ~$0.54 | ~$8.46 | $0.28 |
| Estándar · 100 ops | $30 USD | ~$1.80 | ~$28.20 | $0.28 |
| Pro · 300 ops | $75 USD | ~$4.50 | ~$70.50 | $0.235 |
| Empresa · 1.000 ops | $220 USD | ~$13.20 | ~$206.80 | $0.207 |

### Componentes técnicos a implementar
1. **Checkout de créditos** — pantalla en `fletar-transportista.html` con los paquetes, genera link de pago de Mercado Pago
2. **Webhook de Mercado Pago** — Firebase Function (plan Blaze obligatorio): MP llama a `{dominio}/api/mp-webhook` cuando se aprueba el pago → suma créditos en Firebase
3. **Campo `saldo`** en Firebase — `transportistas/{id}/saldo` (número que se decrementa en cada remito)
4. **Guard al crear remito** — si `saldo === 0`, bloquea la operación y muestra alerta de recarga
5. **Banner de créditos bajos** — aviso cuando quedan menos de 10 créditos

---

### Monetización Flete Ya (fletes-persona.html + fletes-fletero.html) — definido 15/06/2026

Apps urbanas de flete en ciudad. Ticket promedio $5–50 USD. Modelo distinto a FLETAR.

**Hoja de ruta:**
1. **Fase 1 — Gratis:** lanzar sin cobrar nada, objetivo: 20+ fleteros activos en la ciudad
2. **Fase 2 — Suscripción del fletero:** $8 USD/mes acceso ilimitado a pedidos (30 días gratis al registrarse)
3. **Fase 3 — Comisión %:** 12% por trabajo cuando el pago fluya por la app (requiere MP Marketplace)

**Por qué NO cobro por operación acá:** el ticket es muy chico ($5–50), el $0.30 representaría 0.6%–6% — sin sentido. La suscripción funciona sin importar si el pago es cash o digital.

**Proyección suscripción $8/mes:**
- 50 fleteros → $400 USD/mes
- 200 fleteros → $1.600 USD/mes

**Proyección comisión 12% (fase 3):**
- 1.000 trabajos/mes × $25 USD prom → $3.000 USD/mes

---

### Pasarela de pago
- **Mercado Pago** (recomendado para Argentina)
- WhatsApp también tiene tarifa para Argentina: mensajes tipo Utility ~$0.02 USD/conversación; 1.000 conv/mes gratis
- Para el webhook: necesita plan Blaze de Firebase + número exclusivo para WhatsApp API (no puede estar en uso personal)

### Costos de infraestructura
| Concepto | Costo |
|---|---|
| Dominio .com | ~$12–15 USD/año |
| Firebase Hosting + DB (hasta ~500 usuarios) | Gratis (Spark plan) |
| SSL | Gratis (incluido en Firebase Hosting) |
| WhatsApp API (hasta 1.000 conv/mes) | Gratis |
| WhatsApp API (exceso, Utility) | ~$0.02 USD/conversación |
| Firebase Functions (plan Blaze) | ~$0 a volumen FLETAR; requiere tarjeta |
| **Mínimo para lanzar** | **~$12–15 USD/año** |
