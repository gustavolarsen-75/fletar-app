# Pendientes futuros — leer antes de arrancar cada tema

Este archivo es un "refresca memoria". Antes de implementar cualquiera de estos temas, leerlo completo para no empezar de cero.

---

## 📬 Notificaciones push (cuando el browser está cerrado) — Opción C

**Cuándo implementar:** cuando arranquemos con el sistema de créditos y Mercado Pago (ya necesitamos Firebase Functions para el webhook de MP, entonces aprovechamos y montamos las push también — todo junto).

**Qué decidimos:**
- Opción B (Howler.js) ya está implementada: sonido cuando la tab está abierta.
- Opción C es el siguiente paso: notificaciones push reales al dispositivo aunque el browser esté cerrado.

**Arquitectura decidida:**
1. **OneSignal** (gratis hasta 10.000 usuarios) — maneja las suscripciones push de los usuarios
2. **Firebase Functions** (plan Blaze, ~$0 al volumen de Fletar) — cuando llega un evento a Firebase (nueva carga, nueva oferta, retiro disponible), una Function dispara la notificación push via OneSignal REST API

**Quién recibe qué:**
- Transportista → nueva carga disponible + oferta aceptada por el cliente
- Cliente → nueva oferta de transportista
- Chofer → retiro disponible asignado a su vehículo

**Pasos de implementación (para cuando llegue el momento):**
1. Crear cuenta en OneSignal → crear app web → obtener App ID y REST API Key
2. Agregar SDK de OneSignal a los 3 HTML (transportista, cliente, chofer)
3. Modificar service workers (sw-chofer.js, sw-cliente.js) para incluir el worker de OneSignal
4. Activar plan Blaze en Firebase (requiere tarjeta, pero no cobra hasta superar el free tier)
5. Crear Firebase Functions:
   - `onNuevaCarga` → notifica a todos los transportistas suscritos
   - `onNuevaOferta` → notifica al cliente específico (por clienteId)
   - `onOfertaAceptada` → notifica al transportista específico
   - `onRetiroDisponible` → notifica al chofer asignado
6. Deployar Functions con `firebase deploy --only functions`
7. Probar en staging antes de producción

**Recursos:**
- OneSignal Web SDK: https://documentation.onesignal.com/docs/web-push-quickstart
- Firebase Functions + OneSignal: https://documentation.onesignal.com/docs/firebase-functions

---

## 💳 Sistema de créditos — Mercado Pago

**Cuándo implementar:** cuando haya suficiente volumen de usuarios para justificar el cobro.

**Qué decidimos:**
- Cobro: $0.30 USD por remito creado
- Quién paga: el transportista
- Mecanismo: créditos prepagos (no cobro por transacción individual — las comisiones de MP lo hacen inviable)

**Paquetes:**
| Paquete | Precio | Ops |
|---|---|---|
| Arranque | $9 USD | 30 ops |
| Estándar | $30 USD | 100 ops |
| Pro | $75 USD | 300 ops |
| Empresa | $220 USD | 1.000 ops |

**Pasos de implementación:**
1. Activar plan Blaze en Firebase
2. Crear pantalla de checkout en `fletar-transportista.html` con los 4 paquetes
3. Integrar Mercado Pago Checkout Pro → genera link de pago
4. Crear Firebase Function `mpWebhook` → recibe confirmación de pago de MP → suma créditos en `transportistas/{id}/saldo`
5. Agregar campo `saldo` en Firebase bajo `transportistas/trans-001/saldo`
6. Guard al crear remito: si `saldo === 0` → bloquear + mostrar alerta de recarga
7. Banner cuando quedan menos de 10 créditos

**Nota:** el webhook de MP necesita una URL pública. Usar Firebase Functions: `https://us-central1-fletar-49e36.cloudfunctions.net/mpWebhook`

---

## 🔙 Bloqueo del botón back en Android (apps cliente y chofer)

**Cuándo implementar:** cuando se decida publicar en Play Store como app nativa.

**Contexto:** se intentó con `history.pushState` + `popstate` + `hashchange` en múltiples variantes (mismo URL, doble push, URL con hash `#f`). Ninguna funcionó. La razón: Chrome 94+ permite que el WebAPK de Android intercepte el botón back **a nivel de sistema operativo**, antes de que el evento llegue a JavaScript. Es un comportamiento intencional de Chrome para evitar que usuarios queden atrapados en PWAs.

**Solución futura viable:**
Envolver el PWA en una app nativa con **Capacitor** (de Ionic). Capacitor permite interceptar el botón back desde código Android nativo y tomar control total. Los pasos generales:
1. Instalar Capacitor: `npm install @capacitor/core @capacitor/android`
2. Agregar el plugin de back button: `App.addListener('backButton', handler)`
3. Publicar en Play Store como APK

**Alternativa más simple:** aceptar el comportamiento actual (el back cierra la app, como hacen Twitter/Instagram PWA). El botón de home del teléfono garantiza que la app queda en background.

---

## ⭐ Sistema de calificaciones post-entrega

**Cuándo implementar:** cuando haya operaciones reales y feedback de usuarios.

**Qué se califica:** el transportista, por parte del cliente, una vez marcado el estado "entregado".

**Pendiente definir:** escala (1-5 estrellas), si el transportista también califica al cliente, dónde se muestra la calificación promedio.

---
