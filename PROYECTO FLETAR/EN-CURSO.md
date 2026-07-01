# En curso — qué se está haciendo AHORA MISMO

Este archivo es distinto a PENDIENTES-FUTUROS.md (eso es la lista de "algún día").
Este es el estado exacto de la tarea activa, para que si la sesión se corta
de golpe (se apaga la compu, se cierra la app, etc.), la próxima sesión sepa
en qué quedó todo sin tener que adivinar.

## Regla para Claude

- Al ARRANCAR una tarea nueva: escribir acá qué se va a hacer, antes de tocar código.
- Durante la tarea: si hay un paso intermedio importante, actualizar este archivo.
- Al TERMINAR una tarea (o cuando Gustavo dice "guardá y seguimos después"):
  - Si quedó 100% cerrada, vaciar este archivo y dejar solo "Sin tareas en curso."
  - Si quedó a medias, dejar anotado exactamente qué falta y por dónde seguir.
- Al EMPEZAR una sesión nueva, leer este archivo antes que nada — dice si hay
  algo interrumpido.

---

## Estado actual (01/07/2026)

Sin tareas en curso. Última tarea cerrada:

**Pantalla de instalación de la app + QR en la landing** — completo y verificado:
- `instalar-cliente.html` (nuevo): pantalla intermedia mobile con logo real,
  4 cuadritos (30 segundos / Sin Play Store ni App Store / Sin APK / En tu
  pantalla como cualquier app), botón "Instalar app" (usa beforeinstallprompt,
  con fallback de instrucciones para iPhone) y link "Seguir usando desde Chrome"
  a `fletar-cliente.html`.
- `landing.html`: QR en la esquina del hero (solo desktop, apunta a
  `instalar-cliente.html` con la URL calculada dinámicamente por JS — no hay
  que tocarlo si cambia el dominio de Vercel/Netlify). Todos los links a
  `fletar-cliente.html` (nav "Empezar gratis", hero, franja de servicios,
  CTA final, footer) redirigen a `instalar-cliente.html` en mobile (ancho
  ≤768px) vía un solo listener genérico por selector de `href` — no por ID,
  así que cualquier link nuevo a `fletar-cliente.html` queda cubierto sin
  tocar el JS. En desktop siguen yendo directo a `fletar-cliente.html`.

**Pendiente de decidir con Gustavo (no bloqueante):**
- Falta subir estos cambios a Netlify/Vercel para probarlos en el celular real.

---

## Cómo seguir si se cortó acá

1. Leer PREFERENCIAS-GUSTAVO.md (reglas de trabajo con Gustavo).
2. Leer este archivo (EN-CURSO.md) — dice si hay algo a medio hacer.
3. Si algo quedó a medias, retomar exactamente el paso descrito arriba, no
   empezar de cero.
