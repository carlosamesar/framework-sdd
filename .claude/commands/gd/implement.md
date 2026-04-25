# /gd:implement — Ejecutar con TDD: RED → GREEN → REFACTOR

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:implement` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


> **🛑 ZERO TRUST V9 — REGLAS HEREDADAS ACTIVAS**
> Si este comando se ejecuta sin haber pasado por `/gd:start`, el contexto ZERO TRUST sigue vigente. Verifica antes de continuar:
> 1. ¿Existe un SDD y una Matriz aprobada para este cambio? Si no → ve a `/gd:start`.
> 2. **TÚ (el LLM) escribes las pruebas**, no el desarrollador. Abarcan TODOS los escenarios: caminos felices, negativos y casos borde.
> 3. Framework de pruebas por stack: `frontend` → **Playwright** | `backend` → **Jest + Supertest** | `fullstack` → ambos.
> 4. TDD obligatorio: primero el test en rojo (RED), luego el código mínimo (GREEN), luego refactor.
> El desarrollador opera sobre código heredado sin contexto histórico — sé quirúrgicamente preciso.

## Propósito
Implementar una tarea del breakdown siguiendo el ciclo estricto TDD. Cada tarea se completa solo cuando tiene tests pasando, coverage ≥ 85% y el código respeta los patrones del repo.

## Alias
- `/gd:aplicar`

---

## Prerrequisitos
- `TASKS.md` con tareas definidas (output de `/gd:breakdown`) en `openspec/changes/<slug>/TASKS.md`
- Plan técnico `PLAN.md` con contratos API y patrones de referencia en `openspec/changes/<slug>/PLAN.md`
- Tarea específica a implementar (por ID: T01, T02, etc.)
- Rama de trabajo Git creada bajo el patrón `fix/<slug>` desde la base correcta del repo objetivo
- Repo objetivo identificado antes de tocar código

---

## Preparación Git obligatoria

Antes del primer test o cambio de código, el flujo debe validar esto:

```text
1. Ir al repo correcto
2. Cambiar a la rama base correspondiente
3. Actualizar la base local
4. Crear la rama fix/<slug>
5. Implementar y commitear solo en esa rama
6. Preparar PR hacia la rama base correspondiente
```

Ejemplo operativo:

```bash
git checkout performance
git pull
git checkout -b fix/ajuste-formulario-terceros
```

O en backend:

```bash
git checkout microservicios
git pull
git checkout -b fix/ajuste-endpoint-sedes
```

Si no existe una rama `fix/**`, la implementación no debe iniciar.

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

**Template de test unitario (Angular 19 — componente con Signals)**:
```typescript
describe('[NombreComponent]', () => {
  let component: NombreComponent;
  let fixture: ComponentFixture<NombreComponent>;
  let mockServicio: jasmine.SpyObj<NombreServicio>;

  beforeEach(async () => {
    mockServicio = jasmine.createSpyObj('NombreServicio', ['metodo']);

    await TestBed.configureTestingModule({
      imports: [NombreComponent], // standalone component
      providers: [
        { provide: NombreServicio, useValue: mockServicio }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NombreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should [comportamiento esperado] when [condición]', () => {
    // Arrange
    mockServicio.metodo.and.returnValue(of(resultado));

    // Act
    component.accion();
    fixture.detectChanges();

    // Assert
    expect(component.signal()).toBe(valorEsperado);
    const el = fixture.nativeElement.querySelector('[data-testid="elemento"]');
    expect(el.textContent).toContain('texto esperado');
  });

  it('should disable submit when [condición]', () => {
    // Arrange — signal en estado bloqueante
    component.recaptchaToken.set(null);
    fixture.detectChanges();

    // Assert
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });
});
```

**Template de test E2E (Playwright — Angular)**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('[Feature]', () => {
  test('should [comportamiento esperado] when [condición]', async ({ page }) => {
    // Arrange
    await page.goto('/auth/login');

    // Act
    await page.fill('[data-testid="email"]', 'usuario@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    // Para reCAPTCHA en tests: usar Google test key (siempre pasa) o mockear
    await page.click('[data-testid="submit"]');

    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="bienvenida"]')).toBeVisible();
  });

  test('should show error when [condición de fallo]', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'invalido@test.com');
    await page.fill('[data-testid="password"]', 'wrongpass');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-msg"]')).toBeVisible();
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

## Captura de Evidencia de Código (Obligatorio)

**Después de cada commit**, documentar la evidencia en `EVIDENCE.md` del change:

```markdown
## Evidencia — <change-slug>

### Código
- Commit: <git-sha>
- Tarea: T01 — <descripcion>
- Archivos modificados: [lista]
- Tests: <resultado de npm test>
- Build: OK / ERROR
```

**Modo automático** — si el repo tiene infraestructura RAG/SQLite:
```bash
node <ruta-al-repo-framework>/rag/scripts/capture-evidence.mjs \
  --type=code \
  --change=<change-slug> \
  --title="T01: <descripcion>" \
  --description="Implementacion completada" \
  --metadata='{"task_id":"T01","commit":"<git-sha>"}'
```

**Verificar hook de evidencia automático** (si existe en el repo):
```bash
npm run evidence:hooks:check
# Si falta: npm run evidence:hooks:install
```

Sin evidencia documentada de código y tests, el gate de `/gd:close` fallará.

## Post-Implementation Validation Gate: Tests Obligatorios

**OBLIGATORIO**: Después de completar la implementación, ejecutar el comando de testing para su stack ANTES de proceder a `/gd:review`:

```bash
# Si la tarea es BACKEND (Lambda o NestJS)
/gd:test-Backend --scope=integration

# Si la tarea es FRONTEND (Angular + Playwright)
/gd:test-Frontend --scope=smoke
```

**Regla de bloqueo**: Si los tests fallan:
- ❌ NO proceder a `/gd:review`
- ↩️ VOLVER a `/gd:implement` y corregir
- ✅ Solo cuando TODOS los tests pasen, ejecutar `/gd:review`

---

## Siguiente Paso
Una vez que `/gd:test-Backend` o `/gd:test-Frontend` reportan ✅ PASS, ejecutar `/gd:review` para revisión automática de calidad antes de verificar.
