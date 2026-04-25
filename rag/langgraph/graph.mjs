/**
 * graph.mjs — LangGraph Phase 2 StateGraph.
 *
 * Node sequence:
 *   start → architect → developer → tester → reviewer → auditor → (certified|retry|end)
 *
 * Conditional edges:
 *  - After reviewer:       approve  → auditor
 *                          reject   → developer (loop, constrained by retry_count)
 *  - After auditor:        certified → end
 *                          blocked + retries left → corrective node based on current_phase
 *                          blocked + max_retries  → end (force-exit)
 *
 * The graph is exported as a compiled app usable with `.invoke()` or `.stream()`.
 */
import { StateGraph, END } from '@langchain/langgraph';
import { channels } from './state.mjs';
import { architectNode } from './nodes/architect.mjs';
import { developerNode } from './nodes/developer.mjs';
import { testerNode }    from './nodes/tester.mjs';
import { reviewerNode }  from './nodes/reviewer.mjs';
import { auditorNode }   from './nodes/auditor.mjs';

// ─── Router functions ─────────────────────────────────────────────────────────

function routeAfterReviewer(state) {
  if (state.review_decision === 'approve') return 'auditor';
  if (state.retry_count >= state.max_retries)  return END;
  return 'developer'; // rejected — loop back, Developer will re-capture code
}

function routeAfterAuditor(state) {
  const result = state.pipeline_result;
  if (!result)                                 return END;
  if (result.certified)                        return END;
  if (state.retry_count >= state.max_retries)  return END;

  // Route to the node responsible for the blocked phase
  const phase = result.current_phase;
  if (phase === '/gd:implement') return 'developer';
  if (phase === '/gd:test')      return 'tester';
  if (phase === '/gd:review')    return 'reviewer';
  // /gd:verify and /gd:release are handled deterministically inside auditorNode
  return END;
}

// ─── Graph definition ─────────────────────────────────────────────────────────

const workflow = new StateGraph({ channels });

workflow
  .addNode('architect', architectNode)
  .addNode('developer', developerNode)
  .addNode('tester',    testerNode)
  .addNode('reviewer',  reviewerNode)
  .addNode('auditor',   auditorNode);

workflow.setEntryPoint('architect');

workflow.addEdge('architect', 'developer');
workflow.addEdge('developer', 'tester');
workflow.addEdge('tester',    'reviewer');

workflow.addConditionalEdges('reviewer', routeAfterReviewer, {
  auditor:   'auditor',
  developer: 'developer',
  [END]:     END,
});

workflow.addConditionalEdges('auditor', routeAfterAuditor, {
  developer: 'developer',
  tester:    'tester',
  reviewer:  'reviewer',
  [END]:     END,
});

export const app = workflow.compile();
