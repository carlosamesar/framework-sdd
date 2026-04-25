/**
 * architect.mjs — Architect agent node.
 *
 * Reads the spec, searches existing evidence for relevant prior patterns,
 * and produces design_notes describing the implementation approach.
 * Does NOT write evidence — it only plans.
 */
import { createToolBoundLlm } from '../llm.mjs';
import { searchEvidenceTool } from '../tools.mjs';

let _llm;
function getLlm() {
  if (!_llm) _llm = createToolBoundLlm([searchEvidenceTool]);
  return _llm;
}

const SYSTEM = `You are the Architect agent in a Spec-Driven Development (SDD) pipeline.
Your job: read the spec and research existing patterns to produce concise design_notes
that will guide the Developer and Tester agents.

Rules:
- Extract tenantId ALWAYS from JWT custom:tenant_id — never from query params.
- Use ResponseBuilder for all Lambda HTTP responses.
- Reference exact file patterns from .agents-core/ modules when relevant.
- Keep design_notes under 400 words.
- End with a "Implementation checklist:" bullet list.`;

export async function architectNode(state) {
  const { spec_content, change_slug, run_id } = state;

  const humanMsg = `Change: ${change_slug} (run: ${run_id})

SPEC:
${spec_content}

Search existing evidence for relevant patterns if needed, then produce design_notes.`;

  // Allow up to 2 tool call rounds
  const llm = getLlm();
  let messages = [{ role: 'user', content: humanMsg }];
  let designNotes = '';

  for (let round = 0; round < 3; round++) {
    const response = await llm.invoke([
      { role: 'system', content: SYSTEM },
      ...messages,
    ]);

    if (response.tool_calls?.length) {
      messages.push(response);
      for (const tc of response.tool_calls) {
        try {
          const result = await searchEvidenceTool.invoke(tc.args);
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        } catch (e) {
          messages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${e.message}` });
        }
      }
    } else {
      designNotes = typeof response.content === 'string'
        ? response.content
        : response.content.map(b => b.text ?? '').join('');
      break;
    }
  }

  return {
    design_notes: designNotes,
    messages: [`[Architect] Design notes produced for ${change_slug}`],
  };
}
