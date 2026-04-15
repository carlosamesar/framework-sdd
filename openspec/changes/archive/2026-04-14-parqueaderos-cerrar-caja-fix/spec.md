# Spec: parqueaderos-cerrar-caja-fix

**Fecha**: 2026-04-14  
**Change**: parqueaderos-cerrar-caja-fix  
**Estado**: Final

---

## Feature: Cerrar caja en módulo de parqueaderos

### Escenario 1 — Happy path: operador cierra su propia caja
```
Given que hay una caja abierta para el parqueadero del tenant
And el usuario autenticado está en la pantalla de "Control de caja"
When el usuario presiona "Cerrar caja"
Then el sistema llama POST /caja/cerrar con { idCajaTurno: "<id>" }
And el backend actualiza el estado de la caja a "CERRADA"
And el frontend recarga el historial
And el botón "Cerrar caja" desaparece y aparece "Abrir caja"
```

### Escenario 2 — No hay caja abierta
```
Given que no hay caja abierta para el parqueadero
When el usuario navega a "Control de caja"
Then no se muestra el botón "Cerrar caja"
And se muestra el botón "Abrir caja"
```

### Escenario 3 — Error de backend al cerrar
```
Given que hay una caja abierta
When el usuario presiona "Cerrar caja"
And el backend retorna un error (4xx o 5xx)
Then se muestra una notificación de error con el mensaje del backend
And el estado de la UI no cambia
```

### Escenario 4 — Administrador cierra caja de operador
```
Given que hay una caja abierta creada por el operador A
And el administrador B está autenticado
When el administrador B presiona "Cerrar caja"
Then el sistema permite el cierre (no rechaza por diferencia de operador)
And la caja queda en estado "CERRADA"
```

### Escenario 5 — El parqueadero real se carga en el componente
```
Given que el tenant tiene al menos un parqueadero configurado
When el componente "Control de caja" se inicializa
Then el sistema carga el primer parqueadero disponible del tenant
And usa ese idParqueadero para cargar el historial y operar la caja
```

---

## Contratos API (Backend)

### POST /caja/cerrar
- **Request body**: `{ "idCajaTurno": "<uuid>" }`
- **Headers**: `Authorization: Bearer <JWT>`
- **Response 200**: `{ exito: true, mensaje: "Caja cerrada exitosamente", idCajaTurno, estado: "CERRADA", montoTotal }`
- **Response 404**: `{ message: "Caja no encontrada" }`
- **Response 400**: `{ message: "La caja ya se encuentra cerrada" }`

---

## Criterios de aceptación

- [ ] Al presionar "Cerrar caja", se hace POST al endpoint correcto `/caja/cerrar`
- [ ] El body incluye `{ idCajaTurno: "<id de la caja activa>" }`
- [ ] Si el backend responde 200, el historial se recarga y la UI refleja la caja cerrada
- [ ] Si el backend responde error, aparece notificación de error
- [ ] El `idParqueadero` del componente corresponde al parqueadero real del tenant (no un UUID ficticio)
- [ ] El administrador puede cerrar cajas abiertas por cualquier operador del tenant
