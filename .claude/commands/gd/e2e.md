# /gd:e2e — Generar y Ejecutar Tests End-to-End desde las SPECs

## Propósito
Generar y ejecutar tests End-to-End desde los escenarios Gherkin de la especificación. Los tests E2E validan flujos completos de negocio (UI + Backend + BD) simulando el comportamiento real del usuario.

**Nota**: Para tests E2E con Playwright en detalle, ver `/gd:playwright` (Level 4, 283 líneas con patterns completos).

---

## Cómo Funciona

1. **Leer la spec Gherkin** del change activo
2. **Mapear escenarios P0** a tests E2E (1 escenario = 1 test E2E)
3. **Generar los tests** en Playwright (UI) o en formato API (backend-only)
4. **Ejecutar la suite** contra el entorno configurado
5. **Emitir reporte** con resultados por escenario

---

## Tipos de Test E2E

### Backend E2E (API + BD)
Para cuando no hay UI o el test cubre solo el backend.

```typescript
// e2e/caja/cerrar-caja.e2e.spec.ts
describe('POST /api/caja/cerrar — E2E', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    jwtToken = await authenticateTestUser({ role: 'operador', tenantId: TEST_TENANT_ID });
  });

  afterAll(() => app.close());

  it('Scenario: Operador cierra caja abierta con monto válido', async () => {
    // Given: caja abierta en el tenant del operador
    const caja = await seedCajaAbierta({ tenantId: TEST_TENANT_ID });

    // When: operador envía POST /api/caja/cerrar
    const response = await request(app.getHttpServer())
      .post('/api/caja/cerrar')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ cajaId: caja.id, montoCierre: 150000 });

    // Then: 200 con caja cerrada
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: caja.id,
      estado: 'cerrada',
      montoCierre: 150000,
    });

    // And: el estado en BD se actualizó
    const cajaActualizada = await cajaRepository.findOne({ where: { id: caja.id } });
    expect(cajaActualizada.estado).toBe('cerrada');
  });

  it('Scenario: Operador intenta cerrar caja ya cerrada — 409', async () => {
    const cajaCerrada = await seedCajaCerrada({ tenantId: TEST_TENANT_ID });
    const response = await request(app.getHttpServer())
      .post('/api/caja/cerrar')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ cajaId: cajaCerrada.id, montoCierre: 100000 });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('CAJA_YA_CERRADA');
  });
});
```

### UI E2E (Playwright)
Para flujos que requieren interacción con la UI. Ver `/gd:playwright` para el pattern completo.

```typescript
// e2e/parqueaderos/cerrar-caja.spec.ts
import { test, expect } from '@playwright/test';

test('Scenario: Operador cierra caja con monto desde la UI', async ({ page }) => {
  // Given: operador autenticado en la página de caja
  await page.goto('/parqueaderos/caja');
  await loginAs(page, 'operador');

  // When: clic en "Cerrar caja" e ingresa el monto
  await page.click('[data-testid="btn-cerrar-caja"]');
  await page.fill('[data-testid="input-monto-cierre"]', '150000');
  await page.click('[data-testid="btn-confirmar-cierre"]');

  // Then: modal de confirmación y estado actualizado
  await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="estado-caja"]')).toHaveText('Cerrada');
});
```

---

## Uso

```
/gd:e2e                          # generar E2E para todos los escenarios P0 del change activo
/gd:e2e [slug]                   # para un change específico
/gd:e2e --type=api               # solo tests de API (sin UI)
/gd:e2e --type=ui                # solo tests de UI con Playwright
/gd:e2e --scenario=E01           # generar test para un escenario específico
/gd:e2e --run                    # generar Y ejecutar los tests
/gd:e2e --run --type=api         # ejecutar solo los tests de API
```

---

## Ejecutar Tests E2E

```bash
# Tests E2E de API (NestJS)
npm run test:e2e

# Tests E2E de UI (Playwright)
npx playwright test e2e/

# Un archivo específico
npx playwright test e2e/parqueaderos/cerrar-caja.spec.ts

# Con UI mode para depuración
npx playwright test --ui
```

---

## Estructura de Archivos

```
e2e/
├── [módulo]/
│   ├── [feature].e2e.spec.ts    # tests de API E2E
│   └── [feature].spec.ts        # tests de UI Playwright
└── helpers/
    ├── auth.ts                  # helpers de autenticación de tests
    └── seeds.ts                 # datos de prueba
```

---

## Relación con Otros Comandos

| Comando | Cuándo usar |
|---------|------------|
| `/gd:test-unit` | Tests de unidades aisladas (servicios, handlers) |
| `/gd:e2e` | Tests de flujos completos (API + BD + UI) |
| `/gd:playwright` | Tests de UI con Playwright — patrones detallados |

---

## Siguiente Paso
Después de generar los tests E2E, incluirlos en el CI/CD y ejecutar `/gd:verify` para validar cobertura completa.
