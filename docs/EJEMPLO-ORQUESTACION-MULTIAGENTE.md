---

## Ejemplo YAML declarativo

```yaml
framework: sdd-agent
flow: "Validar y desplegar función multi-tenant"
agents:
  - name: DBValidator
    instructions: "Valida el esquema multi-tenant y produce un análisis."
    tool: gdDatabase
  - name: Deployer
    instructions: "Despliega la función Lambda usando el análisis del agente anterior."
    tool: gdDeploy
context:
  schema:
    tables:
      - name: users
        columns: [id, email]
      - name: tenant_orders
        columns: [id, tenant_id, amount]
  target: lambda
  function: myFunc
```

Ejecución:

```bash
cd packages/sdd-agent-orchestrator/src/agent
node demo-agents-flow.cjs
```

---
# AGENTS.md — Ejemplo de orquestación multi-agente (ReAct)

Este ejemplo muestra cómo definir y ejecutar un flujo multi-agente secuencial (handoff) en Framework-SDD, usando agentes autónomos y tools MCP reales.

---

## Ejemplo: Validación y despliegue multi-agente

```js
const { AutonomousAgent } = require('./AutonomousAgent.cjs');
const { AgentsOrchestrator } = require('./AgentsOrchestrator.cjs');
const { gdDatabaseTool } = require('./tools/gdDatabaseTool.cjs');
const { gdDeployTool } = require('./tools/gdDeployTool.cjs');
const { DummyLLM } = require('./llm/DummyLLM.cjs');
const { DummyMemory } = require('./memory/DummyMemory.cjs');

// Esquema de ejemplo
const schema = {
  tables: [
    { name: 'users', columns: ['id', 'email'] },
    { name: 'tenant_orders', columns: ['id', 'tenant_id', 'amount'] }
  ]
};

(async () => {
  const dbAgent = new AutonomousAgent({
    instructions: 'Valida el esquema multi-tenant y produce un análisis.',
    tools: [gdDatabaseTool],
    llm: new DummyLLM(),
    memory: new DummyMemory(),
    name: 'DBValidator'
  });
  const deployAgent = new AutonomousAgent({
    instructions: 'Despliega la función Lambda usando el análisis del agente anterior.',
    tools: [gdDeployTool],
    llm: new DummyLLM(),
    memory: new DummyMemory(),
    name: 'Deployer'
  });
  const orchestrator = new AgentsOrchestrator({ agents: [dbAgent, deployAgent] });
  const result = await orchestrator.run('Validar y desplegar función', { schema, target: 'lambda', function: 'myFunc' });
  console.log('Resultado final multi-agente:', result);
  console.log('Trace completo:', orchestrator.trace);
})();
```

---

## Flujo
1. **DBValidator** analiza el esquema multi-tenant.
2. El resultado se pasa automáticamente a **Deployer**.
3. **Deployer** ejecuta el despliegue usando el análisis recibido.
4. El trace muestra cada paso y handoff.

---

## Extensión
- Agrega más agentes en el arreglo `agents` para flujos más complejos.
- Cada agente puede tener tools, memoria y LLM propios.
- El contexto y resultados se pasan automáticamente entre agentes.

---

**Referencia:**
- `src/agent/AutonomousAgent.cjs`
- `src/agent/AgentsOrchestrator.cjs`
- `src/agent/tools/`
- `src/agent/demo-multiagent-handoff.cjs`
