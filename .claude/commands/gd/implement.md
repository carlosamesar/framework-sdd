# /gd:implement — Ejecutar con TDD: RED → GREEN → REFACTOR

## Propósito
Implementar una tarea del breakdown siguiendo el ciclo estricto TDD. Cada tarea se completa solo cuando tiene tests pasando, coverage ≥ 85% y el código respeta los patrones del repo.

## Alias
- `/gd:aplicar`

---

## Prerrequisitos
- `tasks.md` con tareas definidas (output de `/gd:breakdown`)
- Plan técnico con contratos API y patrones de referencia
- Tarea específica a implementar (por ID: T01, T02, etc.)

---

## Ciclo TDD Obligatorio: RED → GREEN → REFACTOR

### Fase 1 — RED: Escribir Test FALLIDO

```
1. Leer la tarea del breakdown (criterios de aceptación)
2. Escribir el test que verifica el comportamiento esperado
3. Ejecutar: npm test -- --testPathPattern=[archivo]
4. VERIFICAR que el test FALLA (si pasa sin código = test incorrecto)
5. El mensaje de fallo debe describir exactamente lo que falta
```

**Template de test unitario (NestJS)**:
```typescript
describe('[NombreServicio]', () => {
  let service: NombreServicio;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NombreServicio,
        { provide: NombreRepository, useValue: mockRepository },
      ],
    }).compile();
    service = module.get(NombreServicio);
  });

  describe('[metodo]', () => {
    it('should [comportamiento esperado] when [condición]', async () => {
      // Arrange
      const input = { tenantId: 'tenant-uuid', ...datos };
      mockRepository.findOne.mockResolvedValue(entidadExistente);

      // Act
      const result = await service.metodo(input);

      // Assert
      expect(result).toMatchObject({ campo: 'valor esperado' });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-uuid' })
      );
    });

    it('should throw NotFoundException when [recurso no existe]', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.metodo({ id: 'inexistente' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

**Template de test unitario (Lambda)**:
```javascript
describe('handler', () => {
  it('should return 200 with data when [condición]', async () => {
    // Arrange
    const event = buildEvent({
      body: JSON.stringify({ campo: 'valor' }),
      claims: { 'custom:tenant_id': 'tenant-uuid' }
    });

    // Act
    const response = await handler(event, context);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({ id: expect.any(String) });
  });
});
```

---

### Fase 2 — GREEN: Implementar el Mínimo que Pasa

```
1. Escribir el código mínimo para hacer pasar el test
2. NO sobre-implementar: si el test no lo cubre, no lo escribas aún
3. Ejecutar: npm test -- --testPathPattern=[archivo]
4. VERIFICAR que el test PASA (verde)
5. Ejecutar TODOS los tests del módulo: npm test -- --testPathPattern=[módulo]
6. VERIFICAR que no hay regresiones
```

**Reglas del GREEN**:
- El código puede ser "feo" — eso se resuelve en REFACTOR
- Un `if (input === 'valor hardcodeado') return resultado` es válido temporalmente
- Prohibido: saltar al código final sin pasar por RED

---

### Fase 3 — REFACTOR: Mejorar sin Romper

```
1. Identificar duplicación, nombres poco claros, violaciones SOLID
2. Refactorizar en pequeños pasos — ejecutar tests después de CADA cambio
3. Verificar que todos los tests siguen pasando
4. Aplicar patrones del repo de referencia
```

**Checklist de REFACTOR**:
- [ ] Nombres de variables y métodos son descriptivos en español/inglés consistente
- [ ] Sin duplicación (DRY) — extraer helpers si se repite
- [ ] Responsabilidad única (S de SOLID) — un método hace una sola cosa
- [ ] Multi-tenant: `tenantId` siempre viene de JWT, nunca de body
- [ ] Manejo de errores explícito — no `catch (e) {}` sin loguear

---

## Quality Gates Obligatorios por Tarea

Antes de marcar una tarea como ✅ done:

| Gate | Criterio | Cómo verificar |
|------|----------|---------------|
| **TDD Gate** | Tests escritos ANTES del código | Historial de git: test primero |
| **Coverage Gate** | ≥ 85% en líneas del módulo | `npm run test:cov` |
| **Spec Gate** | Implementación cumple criterios de aceptación del task | Revisar checklist de la tarea |
| **Lint Gate** | 0 errores de lint | `npm run lint` |
| **No-Regression Gate** | Todos los tests previos pasan | `npm test` completo |
| **Multi-Tenant Gate** | tenant_id siempre de JWT | Code review manual |

---

## Uso

```
/gd:implement [T01]                    # implementar tarea específica
/gd:implement [T01] [T02]              # implementar múltiples tareas en orden
/gd:implement [descripción directa]   # para cambios atómicos (Nivel 0-1)
```

---

## Ejemplos de Uso

```
/gd:implement T03   # implementar DTO de creación con validaciones
/gd:implement T04   # implementar handler de negocio principal
/gd:implement Agregar campo 'activo' a la entidad Usuario con migration
```

---

## Patrones de Referencia en el Repo

| Tipo | Archivo de referencia |
|------|-----------------------|
| Lambda con JWT + CORS | `lib/lambda/transacciones/fnTransaccionLineas/index.mjs` |
| NestJS Module completo | `servicio-tesoreria/src/modules/caja/` |
| TypeORM Repository | `servicio-tesoreria/src/repositories/` |
| DTOs con validación | `servicio-contabilidad/src/dto/` |
| Guards de Cognito | `servicio-tesoreria/src/guards/cognito.guard.ts` |

---

## Integración con Razonamiento

Antes de escribir el primer test para lógica crítica (pagos, permisos, cálculos):

```
/gd:razonar --modelo=inversion [descripción de lo que se va a implementar]
```
→ "¿Cómo garantizaría que esta implementación falle?" — los caminos al fracaso se convierten en los tests más importantes.

Para diseño de lógica de negocio compleja antes de implementar:

```
/gd:razonar --modelo=rlm-cadena-pensamiento [descripción de la lógica]
```

---

## Siguiente Paso
Después de implementar todas las tareas, usar `/gd:review` para revisión automática de calidad antes de verificar.
