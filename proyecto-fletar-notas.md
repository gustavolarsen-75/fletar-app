# Proyecto: Fletar

---
## ⚠️ PENDIENTE PARA PRÓXIMA SESIÓN: Revisar cotizador con datos reales de mercado
Ver sección "Investigación de tarifas reales" al final de este archivo.
---



## Idea central
Marketplace de fletes que elimina el proceso manual de contactar 3-4 empresas por separado.
El problema real: cada envío requiere escribir a múltiples transportistas, preguntar rutas, tiempos y precios — todo por WhatsApp/teléfono. Fletar centraliza todo eso.

## Dueño del proyecto
- Gustavo (gustavolarsen75@gmail.com)
- Arranca en Misiones, Argentina, con plan de expansión nacional

## Diseño visual
- Estilo: gris oscuro (#2C2C2A) en header + naranja (#E85D20) como color de acento
- Fondo: gris claro (#F5F5F5), cards blancas
- Logo: F con flecha (SVG) + "fletar" en Montserrat diagonal naranja/blanco
- Tagline: "Más fletes, menos llamadas"

## Modelo de negocio
- Transportistas: gratis siempre (al año evaluar suscripción mensual opcional)
- Empresas/usuarios que envían: 6 meses gratis → 6% de comisión al cerrar cada flete
- Pagos del flete: fuera de la app en el MVP, integración de pagos en versión futura
- Foco inicial: transportes chicos (tipo NEO Mandados) — paquetes, documentos, mandados

## Usuarios de la plataforma
- Transportistas / camioneros independientes
- Empresas de transporte (flotas con varios vehículos)
- Empresas que envían mercadería (primer cliente: empresa de Gustavo)
- Particulares (mudanzas, envíos puntuales)

## Flujo principal

### Para quien envía mercadería
1. Publica la carga: origen (provincia → localidad), destino, tipo de envío, fechas
2. Ve preview de transportistas que hacen esa ruta antes de publicar
3. Los transportistas ofertan: precio, tiempo de retiro, tiempo de entrega
4. El usuario compara y acepta la mejor oferta
5. Se comunican por chat interno de la app
6. El transportista actualiza el estado: retirado → en camino → entregado
7. Ambos se califican al finalizar

### Para transportistas (registro en 4 pasos)
- Paso 1: Tipo de cuenta (empresa o transportista)
- Paso 2: Datos básicos + logo + provincia de origen + Maps
- Paso 3: Provincias de destino (con "Marcar todas")
- Paso 4: Localidades por provincia (con "Marcar todas") + email y contraseña

## Funciones clave implementadas
- Logo del transportista: se sube en registro, se muestra en ofertas
- Selección de provincias destino con "Marcar todas" + localidades con "Marcar todas"
- Dirección precargada automáticamente al publicar una carga
- Botón 📍 para detectar ubicación actual y generar link de Google Maps
- Mercadería simplificada: documento, paquete chico/mediano, caja grande, varios bultos
- Opciones especiales: frágil, refrigerado, contra reembolso
- Matching de rutas: transportistas con ruta coincidente aparecen primero con badge
- Selector provincia → localidad en cascada al publicar carga
- Chat interno entre empresa y transportista
- Seguimiento con timeline de estados (retirado → en camino → entregado)
- Panel admin para aprobar/rechazar transportistas con documentación

## Verificación de transportistas
- Obligatoria para operar (habilitación de transporte + seguro)
- Aprobación por admin (Gustavo) en 24hs
- Badge "Verificado ✓" visible en cada oferta

## Stack del prototipo actual
- React 18 desde CDN + Babel standalone (abre directo en navegador, sin instalación)
- Montserrat desde Google Fonts
- Archivo único: fletar.html (guardado en esta carpeta)

## Próximos pasos
- Pasar el prototipo a proyecto real con Vite + Node.js + PostgreSQL
- Conectar base de datos real
- Sistema de notificaciones (email/WhatsApp)
- Integración de pagos (MercadoPago)
- Subida de archivos real (logo, documentos verificación)
- Deploy en Railway o Render
- App mobile (segunda etapa)

## Correcciones realizadas
- Validación del registro corregida: el nombre/celular/dirección se valida en paso 2, no en paso 1
- "Ar" del logo en fondo oscuro para que se vea sobre fondos claros
- Tagline cambiado de "Fletes de Misiones al país entero" a "Más fletes, menos llamadas"
- Mercadería simplificada para transporte chico (sin peso/volumen técnico)
- Login corregido: trans@test.com y empresa@test.com ahora funcionan correctamente en modo login

## Cambios sesión 02/06/2026

### Dashboard empresa rediseñado
- Pantalla de inicio limpia con saludo + 2 botones grandes: "Nuevo envío" y "Últimos envíos"
- Alerta naranja si hay un envío en camino
- Nueva pantalla "Historial de envíos" con sección Activos (con estado y ofertas) e Historial (fecha, ruta, transportista)
- Navbar de empresa simplificada: solo "Inicio"

### Sistema de cotizaciones (subasta cerrada)
- Al publicar una carga, se notifica a todos los transportistas que hacen esa ruta
- Confirmación post-publicación muestra cuántos transportistas fueron notificados
- Transportistas reciben el pedido con detalle completo + aviso de que hay competencia pero precios son privados
- Formulario del transportista: precio + fecha retiro + hora retiro + entrega estimada + nota opcional
- Vista del usuario para comparar ofertas:
  - Ordenar por menor precio o mejor puntuación
  - Badges automáticos: "Más barato" y "Mejor puntuado"
  - Muestra precio, retiro, entrega estimada y vehículo por oferta
  - Nota explicando que los precios son privados entre transportistas
  - Al elegir, las otras ofertas se atenúan
- El usuario decide cuándo cerrar el pedido (sin límite de tiempo automático)

## Decisiones de diseño tomadas
- Subasta cerrada: transportistas saben que hay competencia pero no ven precios ni quiénes compiten
- Sin límite de tiempo: el usuario elige cuando quiere (a futuro agregar vencimiento automático)
- Oferta incluye: precio + fecha/hora retiro + entrega estimada + nota libre

## Estilo de trabajo con Claude
- Cuestionar decisiones antes de ejecutar
- Hacer preguntas sobre aspectos no considerados
- Dar siempre opciones con pros y contras
- Mostrar cómo quedaría visualmente antes de tocar nada

---

## 🔍 Investigación de tarifas reales — Mercado de fletes Misiones (03/06/2026)

### Cómo cotiza el mercado en Argentina

#### 1. El concepto clave: peso cobrable
Todos los actores del mercado (couriers, empresas de carga, transportistas independientes) usan la misma lógica:
> **Peso cobrable = el mayor entre el peso real y el peso volumétrico**

La fórmula del peso volumétrico varía según el operador:
- **Carretera / flete terrestre:** `(L cm × A cm × H cm) ÷ 4.000`
- **Vía Cargo y couriers:** usan `÷ 6.000` (criterio más generoso para el cliente)

Esto es importante: **en Fletar usamos ÷ 4.000**, que es el estándar para camiones. Es correcto para el segmento que atacamos.

#### 2. Tarifas de referencia del mercado institucional

**CATAC (Confederación Argentina del Transporte Automotor de Cargas)**
- Publica tabla oficial mensual. La de **abril 2026** está disponible.
- Está diseñada para camiones completos de granos/cereales ($/tonelada por km).
- Referencia base: ~$9.636/tn para 1 km, escala a ~$80.165/tn para 100 km, ~$103.249/tn para 500 km.
- **No aplica directamente a carga fraccionada** (que es el foco de Fletar), pero es útil como piso de referencia para cargas completas.

**FADEEAC**
- Similar a CATAC, publica tarifas para cereales/oleaginosas.
- Referencia abril 2025: ~$7.428/tn para 1 km, llegando a ~$80.000/tn para 500 km.

#### 3. Vía Cargo (courier de carretera a nivel nacional)
- Cotiza por peso cobrable (mayor entre real y volumétrico con divisor 6.000).
- Distancia, zona y servicio determinan el precio.
- Buenos Aires–Misiones (1.150 km): tarifa alta por zona lejana y posible recargo regional.
- El precio típico en su calculadora para 10 kg Bs.As.–Posadas está en el rango $15.000–$30.000 dependiendo del servicio.
- **Son couriers de paquetes, no de carga general de camión** — precios más altos, pesos menores.

#### 4. Mercado real de fletes de camión Misiones–Buenos Aires (fuentes indirectas)
- Ruta Posadas → Buenos Aires: ~1.150 km
- Referencia de mercado para flete completo (2025–2026): entre $1.200.000 y $2.500.000 por viaje (camión completo, según tipo).
- Para **carga fraccionada** (que es Fletar): se cobra por kg cobrable.
  - Rango estimado de mercado NEA: **$1.200 – $2.200/kg cobrable** para rutas de 800–1.200 km.
  - Para rutas cortas (Posadas–Corrientes, ~290 km): **$350 – $600/kg cobrable**.

#### 5. ¿Cómo está configurado el cotizador de Fletar ahora?

Las tarifas actuales en `fletar-cliente.html`:
| Distancia | Tarifa base/kg cobrable | Mínimo de envío |
|-----------|------------------------|-----------------|
| < 300 km  | $380/kg               | $25.000         |
| 300–600 km| $650/kg               | $45.000         |
| 600–1.000 km | $980/kg            | $70.000         |
| > 1.000 km | $1.450/kg           | $100.000        |

#### 6. Análisis: ¿el cotizador está bien?

**Lo que está bien:**
- La lógica de peso cobrable con ÷ 4.000 es correcta para carretera.
- La estructura de tramos por distancia es la forma correcta de calcular.
- El rango ±20–25% refleja bien la variabilidad real del mercado.
- Los mínimos de envío tienen sentido (ningún transportista sale por menos de cierto monto).

**Lo que puede mejorar:**
- Las tarifas base están un poco bajas para el mercado actual de Misiones (2026). Con inflación y combustible, el mercado está más cerca de:
  - < 300 km: $500–$700/kg cobrable
  - 300–600 km: $900–$1.200/kg cobrable
  - 600–1.000 km: $1.400–$1.800/kg cobrable
  - > 1.000 km: $1.800–$2.500/kg cobrable
- Los mínimos también deberían subir (mínimo $40.000–$50.000 para rutas cortas en 2026).
- El cotizador muestra valores referenciales, que es correcto. Pero conviene aclarar que las tarifas reales pueden estar más arriba en el contexto actual.

**Importante para la próxima sesión:**
El cotizador sirve para orientar al cliente antes de recibir ofertas reales. No necesita ser exacto, pero sí estar en el orden de magnitud correcto para no generar expectativas falsas. **Propuesta: actualizar los rangos de precio en `fletar-cliente.html`.**

#### Fuentes consultadas
- CATAC Tarifa de Referencia Abril 2026 (PDF oficial)
- FADEEAC Tarifas Cereales Abril 2025
- Vía Cargo — sistema de cotización
- Valorlocal.com.ar — el flete representa 1,8–5% del precio de alimentos básicos
- Infobae (sept. 2025) — flete camionero argentino es 30% más caro que Brasil/EEUU
- Mudanza.com.ar — referencias flete Bs.As.–Misiones
