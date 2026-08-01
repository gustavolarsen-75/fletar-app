/**
 * FLETAR — Firebase Cloud Functions
 * Notificaciones automáticas por WhatsApp via Twilio
 *
 * Para activar: ver INSTRUCCIONES-WHATSAPP.md
 */

const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const twilio    = require("twilio");

admin.initializeApp();
const db = admin.database();

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
// Estas credenciales se cargan con: firebase functions:config:set twilio.sid="..." etc.
// NO escribir los valores reales acá — quedarían expuestos en el código.
function getTwilioClient() {
  const sid   = functions.config().twilio.sid;
  const token = functions.config().twilio.token;
  return twilio(sid, token);
}

const WHATSAPP_FROM = () => `whatsapp:${functions.config().twilio.from}`;
const APP_URL       = "https://fletar-app-5.vercel.app";

// ─── HELPER: obtener teléfono de un usuario desde Firebase ───────────────────
async function getTelefono(usuarioId) {
  if (!usuarioId) return null;
  const snap = await db.ref(`usuarios/${usuarioId}/telefono`).get();
  return snap.exists() ? snap.val() : null;
}

// ─── HELPER: enviar WhatsApp ──────────────────────────────────────────────────
async function enviarWhatsApp(telefono, mensaje) {
  if (!telefono) {
    console.log("Sin teléfono, no se envió notificación.");
    return;
  }
  const numero = telefono.startsWith("+") ? telefono : `+549${telefono}`;
  try {
    const client = getTwilioClient();
    await client.messages.create({
      from: WHATSAPP_FROM(),
      to:   `whatsapp:${numero}`,
      body: mensaje,
    });
    console.log(`WhatsApp enviado a ${numero}`);
  } catch (err) {
    console.error("Error enviando WhatsApp:", err.message);
  }
}

// ─── TRIGGER 1: Nueva oferta → notificar a la empresa ────────────────────────
exports.nuevaOferta = functions.database
  .ref("/ofertas/{ofertaId}")
  .onCreate(async (snap) => {
    const oferta = snap.val();
    if (!oferta) return;

    // Obtener la carga para saber quién es la empresa
    const cargaSnap = await db.ref(`cargas/${oferta.cargaId}`).get();
    if (!cargaSnap.exists()) return;
    const carga = cargaSnap.val();

    // Obtener teléfono de la empresa
    const tel = await getTelefono(carga.empresaId);
    if (!tel) return;

    const precio = oferta.precio ? `$${Number(oferta.precio).toLocaleString("es-AR")}` : "";
    const msg =
      `📦 *Fletar* — Nueva oferta recibida\n\n` +
      `*${oferta.transportistaNombre}* cotizó ${precio} para tu envío *${carga.origen} → ${carga.destino}*.\n\n` +
      `Entrá a ver todos los detalles y comparar ofertas 👉 ${APP_URL}/fletar-cliente.html?screen=ofertas&cargaId=${oferta.cargaId}`;

    await enviarWhatsApp(tel, msg);
  });

// ─── TRIGGER 2: Cambio de estado en remito → notificaciones según estado ─────
exports.cambioEstadoRemito = functions.database
  .ref("/remitos/{remitoId}/estado")
  .onUpdate(async (change, context) => {
    const estadoAnterior = change.before.val();
    const estadoNuevo    = change.after.val();
    if (estadoAnterior === estadoNuevo) return;

    const remitoSnap = await db.ref(`remitos/${context.params.remitoId}`).get();
    if (!remitoSnap.exists()) return;
    const r = remitoSnap.val();

    const ruta    = `${r.remitente?.ciudad || "—"} → ${r.destinatario?.ciudad || "—"}`;
    const destino = r.destinatario?.nombre ? ` para *${r.destinatario.nombre}*` : "";

    // Mapa: estado → mensaje para empresa + mensaje para transportista
    const eventos = {
      "retirado": {
        empresaId:    r.empresaId,
        mensajeEmpresa:
          `🚐 *Fletar* — Tu paquete fue retirado\n\n` +
          `El envío *${ruta}*${destino} ya fue retirado y está camino al depósito.\n\n` +
          `Seguí el estado en tiempo real 👉 ${APP_URL}/fletar-cliente.html?screen=seguimiento&remitoId=${r.id}`,
      },
      "en-camino": {
        empresaId:    r.empresaId,
        mensajeEmpresa:
          `🚛 *Fletar* — Tu paquete está en camino\n\n` +
          `El envío *${ruta}*${destino} salió a ruta y está en camino.\n\n` +
          `Seguí el estado 👉 ${APP_URL}/fletar-cliente.html?screen=seguimiento&remitoId=${r.id}`,
      },
      "entregado": {
        empresaId:    r.empresaId,
        mensajeEmpresa:
          `✅ *Fletar* — Entrega confirmada\n\n` +
          `El envío *${ruta}*${destino} fue entregado exitosamente.\n\n` +
          `Ver comprobante 👉 ${APP_URL}/fletar-cliente.html?screen=seguimiento&remitoId=${r.id}`,
        transportistaId: r.transportistaId,
        mensajeTransportista:
          `✅ *Fletar* — Entrega registrada\n\n` +
          `Registraste la entrega de *${ruta}*. ¡Bien hecho!\n\n` +
          `Ver tu historial 👉 ${APP_URL}/fletar-transportista.html?screen=entregados`,
      },
    };

    const evento = eventos[estadoNuevo];
    if (!evento) return;

    // Notificar empresa
    if (evento.empresaId && evento.mensajeEmpresa) {
      const telEmpresa = await getTelefono(evento.empresaId);
      await enviarWhatsApp(telEmpresa, evento.mensajeEmpresa);
    }

    // Notificar transportista (solo en entregado)
    if (evento.transportistaId && evento.mensajeTransportista) {
      const telTrans = await getTelefono(evento.transportistaId);
      await enviarWhatsApp(telTrans, evento.mensajeTransportista);
    }
  });

// ─── TRIGGER 3: Oferta aceptada (remito creado) → notificar al transportista ─
// Un remito se crea cuando la empresa acepta una oferta.
// Detectamos que es nuevo y tiene estado "pendiente-retiro".
exports.ofertaAceptada = functions.database
  .ref("/remitos/{remitoId}")
  .onCreate(async (snap) => {
    const r = snap.val();
    if (!r || r.estado !== "pendiente-retiro") return;

    const telTrans = await getTelefono(r.transportistaId);
    if (!telTrans) return;

    const ruta    = `${r.remitente?.ciudad || "—"} → ${r.destinatario?.ciudad || "—"}`;
    const flete   = r.flete ? `$${Number(r.flete).toLocaleString("es-AR")}` : "";
    const msg =
      `🎉 *Fletar* — ¡Tu oferta fue aceptada!\n\n` +
      `La empresa o el cliente aceptó tu oferta${flete ? ` de ${flete}` : ""} para el envío *${ruta}*.\n\n` +
      `Coordiná el retiro y mirá todos los detalles 👉 ${APP_URL}/fletar-transportista.html?screen=aceptados&remitoId=${r.id}`;

    await enviarWhatsApp(telTrans, msg);
  });

// ════════════════════════════════════════════════════════════════════════════
// ONESIGNAL — Notificaciones push reales (fletero + cliente)
// Funcionan aunque la app esté cerrada. Independiente del sistema de WhatsApp
// de arriba (ese sigue sin activar). Credenciales cargadas con:
//   firebase functions:config:set \
//     onesignal.fletero_app_id="..." onesignal.fletero_api_key="..." \
//     onesignal.cliente_app_id="..." onesignal.cliente_api_key="..."
// NO escribir los valores reales acá — quedarían expuestos en el código.
// ════════════════════════════════════════════════════════════════════════════

async function enviarPush({ appId, apiKey, externalId, titulo, mensaje }) {
  if (!appId || !apiKey || !externalId) {
    console.log("Push OneSignal: faltan datos, no se envía.", { tieneAppId: !!appId, tieneApiKey: !!apiKey, externalId });
    return;
  }
  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        include_aliases: { external_id: [externalId] },
        headings: { en: titulo, es: titulo },
        contents: { en: mensaje, es: mensaje },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error("OneSignal error:", res.status, data);
    else console.log("Push OneSignal enviado a", externalId, data.id || "");
  } catch (err) {
    console.error("Error enviando push OneSignal:", err.message);
  }
}

function pushFletero(externalId, titulo, mensaje) {
  const cfg = functions.config().onesignal || {};
  return enviarPush({ appId: cfg.fletero_app_id, apiKey: cfg.fletero_api_key, externalId, titulo, mensaje });
}

function pushCliente(externalId, titulo, mensaje) {
  const cfg = functions.config().onesignal || {};
  return enviarPush({ appId: cfg.cliente_app_id, apiKey: cfg.cliente_api_key, externalId, titulo, mensaje });
}

// ─── TRIGGER: nueva oferta → push al cliente ──────────────────────────────────
exports.pushNuevaOferta = functions.database
  .ref("/ofertas/{ofertaId}")
  .onCreate(async (snap) => {
    const oferta = snap.val();
    if (!oferta) return;

    const cargaSnap = await db.ref(`cargas/${oferta.cargaId}`).get();
    if (!cargaSnap.exists()) return;
    const carga = cargaSnap.val();
    if (!carga.empresaId) return;

    const quien = oferta.esFletero
      ? (oferta.fleteroNombre || "Un fletero")
      : (oferta.transportistaNombre || "Un transportista");
    const ruta = `${carga.origen || carga.ciudad || ""} → ${carga.destino || carga.destinatario?.ciudad || ""}`.trim();

    await pushCliente(carga.empresaId, "📦 Nueva oferta recibida", `${quien} cotizó tu envío ${ruta}`);
  });

// ─── TRIGGER: oferta aceptada (se crea el remito) → push al fletero ──────────
exports.pushOfertaAceptadaFletero = functions.database
  .ref("/remitos/{remitoId}")
  .onCreate(async (snap) => {
    const r = snap.val();
    if (!r || !r.esFletero || !r.fleteroId || r.estado !== "pendiente-retiro") return;

    await pushFletero(
      r.fleteroId,
      "🎉 ¡Te aceptaron una cotización!",
      `Tenés un flete confirmado en ${r.remitente?.ciudad || "tu ciudad"}. Retiro: ${r.retiro || "a coordinar"}.`
    );
  });

// ─── SCHEDULED: recordatorio diario de fletes exprés programados para hoy ────
// Corre todos los días a las 8:00 (hora Argentina) y avisa a cada fletero que
// tenga un flete aceptado, todavía sin retirar, programado para hoy.
exports.recordatorioFleteProgramadoDiario = functions.pubsub
  .schedule("every day 08:00")
  .timeZone("America/Argentina/Buenos_Aires")
  .onRun(async () => {
    const hoyAR = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

    const snap = await db.ref("remitos").get();
    if (!snap.exists()) return null;

    const remitos = Object.values(snap.val());
    const pendientesHoy = remitos.filter(r =>
      r && r.esFletero && r.fleteroId &&
      r.estado === "pendiente-retiro" &&
      r.fechaDeseada === hoyAR
    );

    for (const r of pendientesHoy) {
      await pushFletero(
        r.fleteroId,
        "🗓️ Tenés un flete programado para hoy",
        `Recordá retirar en ${r.remitente?.ciudad || "tu ciudad"}${r.horaDeseada ? " a las " + r.horaDeseada + "hs" : ""}.`
      );
    }

    return null;
  });
