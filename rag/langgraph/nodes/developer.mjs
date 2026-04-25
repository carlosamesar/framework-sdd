/**
 * developer.mjs — Developer agent node.
 *
 * Reads spec + design_notes, generates code evidence by calling
 * capture_evidence with type=code.  Produces code_summary.
 */
import { createToolBoundLlm } from '../llm.mjs';
import { captureEvidenceTool } from '../tools.mjs';

let _llm;
function getLlm() {
  if (!_llm) _llm = createToolBoundLlm([captureEvidenceTool]);
  return _llm;
}

const SYSTEM = `You are the Developer agent in an SDD pipeline.
Your job: given the spec and design notes, produce the implementation and capture it as evidence.

Rules:
- Call capture_evidence EXACTLY once with type="code".
- The metadata must include "task_id": "T1".
- Extract tenantId from JWT custom:tenant_id.
- Use ResponseBuilder for Lambda handlers.
- Keep code_summary under 200 words describing what was implemented.`;

export async function developerNode(state) {
  const { spec_content, design_notes, change_slug, run_id } = state;

  const humanMsg = `Change: ${change_slug} (run: ${run_id})

SPEC:
${spec_content}

DESIGN NOTES:
${design_notes}

Implement the solution. Call capture_evidence with type=code, then return your code_summary.`;

  const llm = getLlm();
  let messages = [{ role: 'user', content: humanMsg }];
  let codeSummary = '';

  for (let round = 0; round < 4; round++) {
    const response = await llm.invoke([
      { role: 'system', content: SYSTEM },
      ...messages,
    ]);

    if (response.tool_calls?.length) {
      messages.push(response);
      for (const tc of response.tool_calls) {
        try {
          const result = await captureEvidenceTool.invoke(tc.args);
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        } catch (e) {
          messages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${e.message}` });
        }
      }
    } else {
      codeSummary = typeof response.content === 'string'
        ? response.content
        : response.content.map(b => b.text ?? '').join('');
      break;
    }
  }

  return {
    code_summary: codeSummary,
    messages: [`[Developer] Code evidence captured for ${change_slug}`],
  };
}
