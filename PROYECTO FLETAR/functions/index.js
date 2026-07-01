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
      `La empresa aceptó tu oferta${flete ? ` de ${flete}` : ""} para el envío *${ruta}*.\n\n` +
      `Coordiná el retiro y mirá todos los detalles 👉 ${APP_URL}/fletar-transportista.html?screen=aceptados&remitoId=${r.id}`;

    await enviarWhatsApp(telTrans, msg);
  });
