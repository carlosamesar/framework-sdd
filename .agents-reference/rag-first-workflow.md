# RAG-first workflow

Usar este orden para ahorrar tokens:
1. leer archivo ultra-light del agente
2. leer AGENTS index
3. consultar COMMANDS-INDEX solo si hay comando gd
4. cargar un solo módulo de .agents-core según la tarea
5. usar PATTERNS-CACHE para snippets repetidos
6. consultar RAG para dudas puntuales
7. abrir documentación extensa solo si lo anterior no basta
