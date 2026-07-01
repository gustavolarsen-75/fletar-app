# Reglas del Proyecto FLETAR

## Formato obligatorio para inputs de precio/dinero

**SIEMPRE** que haya un campo de ingreso de dinero (precio, flete, valor declarado, gastos, efectivo, etc.) en cualquiera de los tres archivos (`fletar-transportista.html`, `fletar-chofer.html`, `fletar-cliente.html`), usar este formato:

```jsx
<div style={{ position: 'relative' }}>
  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 14, pointerEvents: 'none' }}>$</span>
  <input type="number" value={...} onChange={...}
    placeholder="0"
    style={{ width: '100%', padding: '8px 10px 8px 22px', borderRadius: 7, border: '1px solid #DDE3EA', fontSize: 14, boxSizing: 'border-box' }} />
</div>
```

**Regla**: `$` visual fijo a la izquierda dentro del input + `type="number"` siempre.  
**Nunca**: usar `type="text"`, ni poner el `$` fuera del input, ni formato diferente.

---

## Stack técnico

- `fletar-transportista.html` → React (JSX via Babel CDN) + Firebase Realtime Database
- `fletar-chofer.html` → Vanilla HTML/JS, reconstruye con `app.innerHTML = html` en cada `render()`
- `fletar-cliente.html` → React + Firebase

## Firebase paths importantes

- `remitos/{id}` — datos de cada remito
- `turnosMostrador/{turnoId}` — resumen de turno cerrado (efectivo, digital, gastos)
- `config/gastosConfig/toggles` — toggles de tipos de gasto para mostrador
- `config/gastosConfig/custom` — categorías personalizadas de gasto
