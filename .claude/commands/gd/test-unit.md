# /gd:test-unit — Generar y Ejecutar Tests Unitarios con TDD

## Propósito
Generar tests unitarios automáticamente desde las tareas del breakdown y ejecutarlos siguiendo el ciclo TDD (RED → GREEN → REFACTOR). Es el companion de `/gd:implement` — siempre se usan juntos.

**Nota**: Para el ciclo TDD completo con plantillas detalladas, ver `/gd:implement` (Level 4, 65+ líneas).

---

## Cómo Funciona

1. **Leer la tarea del breakdown** (criterios de aceptación)
2. **Generar el archivo de test** con todos los casos cubiertos
3. **Ejecutar los tests** para verificar que están en RED
4. **Después de implementar**, ejecutar para verificar GREEN
5. **Verificar coverage** con umbral ≥ 85%

---

## Generación Automática de Tests

Dado el criterio de aceptación: "Handler cerrar-caja debe retornar 200 con la caja cerrada cuando el operador envía montoCierre válido", el comando genera:

```typescript
// src/modules/caja/handlers/__tests__/cerrar-caja.handler.spec.ts
import { Test } from '@nestjs/testing';
import { CerrarCajaHandler } from '../cerrar-caja.handler';
import { CajaRepository } from '../../repositories/caja.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';

const mockCajaRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

describe('CerrarCajaHandler', () => {
  let handler: CerrarCajaHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CerrarCajaHandler,
        { provide: CajaRepository, useValue: mockCajaRepository },
      ],
    }).compile();
    handler = module.get(CerrarCajaHandler);
  });

  // ===== HAPPY PATH =====

  it('should return closed caja when valid cajaId and montoCierre', async () => {
    // Arrange
    const tenantId = 'tenant-uuid-123';
    const cajaId = 'caja-uuid-456';
    const montoCierre = 150000;
    const cajaBD = { id: cajaId, tenantId, estado: 'abierta', montoCierre: null };

    mockCajaRepository.findOne.mockResolvedValue(cajaBD);
    mockCajaRepository.save.mockResolvedValue({ ...cajaBD, estado: 'cerrada', montoCierre });

    // Act
    const result = await handler.execute({ tenantId, cajaId, montoCierre });

    // Assert
    expect(result.estado).toBe('cerrada');
    expect(result.montoCierre).toBe(150000);
    expect(mockCajaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'cerrada', montoCierre: 150000 })
    );
  });

  // ===== EDGE CASES =====

  it('should throw NotFoundException when caja does not exist', async () => {
    mockCajaRepository.findOne.mockResolvedValue(null);
    await expect(
      handler.execute({ tenantId: 'tenant', cajaId: 'inexistente', montoCierre: 100 })
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException when caja already closed', async () => {
    mockCajaRepository.findOne.mockResolvedValue({ estado: 'cerrada' });
    await expect(
      handler.execute({ tenantId: 'tenant', cajaId: 'caja-id', montoCierre: 100 })
    ).rejects.toThrow(ConflictException);
  });

  it('should NOT use tenantId from input — only from JWT context', async () => {
    // Verificación explícita del multi-tenant: el handler no debe aceptar
    // tenantId que no venga del JWT (esto es una prueba de arquitectura)
    const cajaBD = { id: 'caja-id', tenantId: 'jwt-tenant', estado: 'abierta' };
    mockCajaRepository.findOne.mockResolvedValue(cajaBD);
    mockCajaRepository.save.mockResolvedValue({ ...cajaBD, estado: 'cerrada' });

    await handler.execute({ tenantId: 'jwt-tenant', cajaId: 'caja-id', montoCierre: 100 });

    // El findOne debe filtrar por el tenantId del JWT
    expect(mockCajaRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'caja-id', tenantId: 'jwt-tenant' }
    });
  });
});
```

---

## Ejecutar Tests

```bash
# Ejecutar tests de un archivo específico (RED phase)
npm test -- --testPathPattern=cerrar-caja.handler.spec

# Ejecutar todos los tests del módulo
npm test -- --testPathPattern=caja/

# Con coverage
npm run test:cov -- --testPathPattern=caja/

# Watch mode (durante desarrollo)
npm test -- --watch --testPathPattern=cerrar-caja
```

---

## Uso

```
/gd:test-unit [T04]                        # generar tests para la tarea T04
/gd:test-unit [nombre-del-servicio]        # generar tests para un servicio/handler
/gd:test-unit --run                        # generar Y ejecutar
/gd:test-unit --run --coverage             # ejecutar con reporte de coverage
/gd:test-unit --coverage-check             # verificar que coverage >= 85%
```

---

## Estructura de Tests por Tipo

| Tipo | Ubicación | Patrón |
|------|-----------|--------|
| Handler/Service | `src/modules/[mod]/handlers/__tests__/` | `[nombre].handler.spec.ts` |
| Repository | `src/repositories/__tests__/` | `[nombre].repository.spec.ts` |
| DTO/Validator | `src/dto/__tests__/` | `[nombre].dto.spec.ts` |
| Guard | `src/guards/__tests__/` | `[nombre].guard.spec.ts` |
| Lambda | `lib/lambda/[fn]/__tests__/` | `handler.spec.js` |

---

## Coverage Report

```bash
npm run test:cov

# Output esperado:
# File              | % Stmts | % Branch | % Funcs | % Lines
# cerrar-caja.ts    |    92.3 |     87.5 |   100.0 |    91.2  ✅
# caja.repository   |    88.7 |     83.3 |    90.0 |    88.1  ✅
```

**Umbral mínimo**: 85% en statements, branches, functions y lines para módulos de negocio.

---

## Relación con Otros Comandos

| Comando | Cuándo usar |
|---------|------------|
| `/gd:test-unit` | Tests de unidades aisladas — siempre con `/gd:implement` |
| `/gd:e2e` | Tests de flujo completo API + BD + UI |
| `/gd:playwright` | Tests de UI con Playwright |
| `/gd:gate tdd` | Verificar que la suite pasa el gate TDD completo |

---

## Siguiente Paso
Después de generar y ejecutar los tests unitarios en GREEN, ejecutar `/gd:gate tdd` para validar el gate TDD completo antes del review.
