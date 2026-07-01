# Instrucciones para activar las notificaciones por WhatsApp

El código ya está escrito. Solo necesitás seguir estos pasos una vez cuando estés listo para lanzar la app.

---

## Paso 1 — Crear cuenta en Twilio

1. Entrá a **https://www.twilio.com** y creá una cuenta gratuita.
2. Verificá tu número de teléfono personal (es para activar la cuenta, no se usa en la app).
3. En el dashboard de Twilio, copiá estos tres datos:
   - **Account SID** (empieza con `AC...`)
   - **Auth Token** (clave secreta)
4. En el menú lateral, andá a **Messaging → Try it out → Send a WhatsApp message**.
5. Seguí los pasos para activar el **Sandbox de WhatsApp**. Te va a dar un número de Twilio (algo como `+14155238886`). Ese es tu número de salida.

> **Sandbox vs. número real:** El sandbox es gratis y sirve para probar. Para producción necesitás solicitar a Twilio un número aprobado por Meta (lleva unos días de aprobación).

---

## Paso 2 — Actualizar Firebase al plan Blaze

Las Cloud Functions de Firebase solo funcionan en el **plan Blaze** (pago por uso).

1. Entrá a **https://console.firebase.google.com** → proyecto `fletar-49e36`.
2. En el menú lateral, hacé clic en el engranaje ⚙️ → **Uso y facturación**.
3. Hacé clic en **Modificar plan** y seleccioná **Blaze**.
4. Ingresá una tarjeta de crédito. El costo real para un MVP con poco tráfico es casi cero (centavos por mes). Firebase tiene un free tier generoso incluido dentro del plan Blaze.

---

## Paso 3 — Instalar Firebase CLI

Desde una terminal (en la carpeta `PROYECTO FLETAR`):

```bash
npm install -g firebase-tools
firebase login
firebase use fletar-49e36
```

---

## Paso 4 — Instalar dependencias de las funciones

```bash
cd functions
npm install
cd ..
```

---

## Paso 5 — Cargar las credenciales de Twilio (NUNCA en el código)

```bash
firebase functions:config:set \
  twilio.sid="AC_TU_ACCOUNT_SID_AQUI" \
  twilio.token="TU_AUTH_TOKEN_AQUI" \
  twilio.from="+14155238886"
```

Reemplazá los valores con los datos reales de tu cuenta Twilio. Este comando guarda las credenciales de forma segura en Firebase, fuera del código fuente.

Para verificar que quedaron guardadas:

```bash
firebase functions:config:get
```

---

## Paso 6 — Hacer deploy de las funciones

```bash
firebase deploy --only functions
```

El proceso tarda 2-3 minutos. Al terminar vas a ver algo como:

```
✔  functions[nuevaOferta]: Successful create operation.
✔  functions[cambioEstadoRemito]: Successful create operation.
✔  functions[ofertaAceptada]: Successful create operation.
```

---

## Paso 7 — Probar el sistema

1. Abrí la app del transportista y hacé clic en el avatar (CR) en la navbar.
2. Ingresá tu número de WhatsApp real (ej: `3764 123456`) y guardalo.
3. Abrí la app del cliente y hacé lo mismo.
4. Publicá una carga de prueba desde la app del cliente.
5. Hacé una oferta desde la app del transportista.
6. Deberías recibir un WhatsApp en el teléfono de la empresa con el link a las ofertas.

> **Nota sobre el Sandbox:** Para recibir mensajes del sandbox de Twilio, el número de destino tiene que haber enviado primero el mensaje `join <palabra>` al número de Twilio. Twilio te explica esto al activar el sandbox. En producción (número aprobado) esto no es necesario.

---

## Qué hace cada función

| Función | Se activa cuando... | Notifica a... |
|---|---|---|
| `nuevaOferta` | Un transportista hace una oferta | La empresa: "Recibiste una oferta" |
| `ofertaAceptada` | La empresa acepta una oferta (se crea el remito) | El transportista: "Tu oferta fue aceptada" |
| `cambioEstadoRemito` | El estado del envío cambia | La empresa: en retirado, en-camino, entregado |

---

## Costo estimado (Twilio)

- Plan de prueba (sandbox): **gratis** para probar
- Plan producción: ~**USD 0.005 por mensaje** (medio centavo de dólar)
- Para 100 envíos/mes con 3 notificaciones cada uno = **USD 1.50/mes**

---

## Soporte

- Docs Twilio WhatsApp: https://www.twilio.com/docs/whatsapp
- Docs Firebase Functions: https://firebase.google.com/docs/functions
